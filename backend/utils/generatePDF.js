// utils/generatePDF.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translations = {
  en: {
    title: "HEALTH AUDIT REPORT",
    plant: "SPECIMEN TYPE",
    diagnosis: "PATHOLOGY RESULT",
    confidence: "DIAGNOSIS CONFIDENCE",
    obs: "Clinical Observations",
    cause: "Pathogen Description",
    treatment: "Treatment Protocol",
    prec: "Preventative Strategy",
    footer: "AGROVISION AI - PRECISION AGRICULTURE LABS",
    page: "Page"
  },
  hi: {
    title: "स्वास्थ्य ऑडिट रिपोर्ट",
    plant: "पौधे का प्रकार",
    diagnosis: "निदान परिणाम",
    confidence: "निदान सटीकता",
    obs: "नैदानिक अवलोकन",
    cause: "रोगज़नक़ वर्णन",
    treatment: "उपचार प्रोटोकॉल",
    prec: "निवारक रणनीति",
    footer: "एग्रोविज़न एआई - सटीक कृषि प्रयोगशाला",
    page: "पृष्ठ"
  },
  gu: {
    title: "સ્વાસ્થ્ય ઓડિટ અહેવાલ",
    plant: "છોડનો પ્રકાર",
    diagnosis: "નિદાન પરિણામ",
    confidence: "નિદાન ચોકસાઇ",
    obs: "તબીબી અવલોકનો",
    cause: "રોગકારક વર્ણન",
    treatment: "સારવાર પ્રોટોકોલ",
    prec: "નિવારક વ્યૂહરચના",
    footer: "એગ્રોવિઝન એઆઈ - પ્રિસિઝન એગ્રીકલ્ચર લેબ્સ",
    page: "પાનું"
  }
};

const generatePDF = (data, filename, lang = 'en') => {
  const t = translations[lang] || translations.en;
  
  const doc = new PDFDocument({ 
    margin: 40,
    size: 'A4',
    bufferPages: true,
  });

  const pdfPath = path.join(__dirname, ".." , "reports", filename);
  const stream = fs.createWriteStream(pdfPath);
  
  const fontPaths = [
    "C:/Windows/Fonts/Nirmala.ttf", 
    "C:/Windows/Fonts/Mangal.ttf",
    "C:/Windows/Fonts/Arial.ttf"
  ];
  
  let selectedFont = "Helvetica";
  for (const f of fontPaths) {
    if (fs.existsSync(f)) {
      selectedFont = f;
      break;
    }
  }

  const logoPath = path.join(__dirname, "..", "assets", "logo.png");
  doc.pipe(stream);

  const drawHeader = () => {
    // Top Brand Bar
    doc.rect(0, 0, 595.28, 60).fill("#064e40");
    doc.rect(0, 58, 595.28, 2).fill("#10b981");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 12, { width: 35 });
    }

    doc
      .fillColor("#ffffff")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("AGROVISION AI", 85, 20, { characterSpacing: 1 });

    doc
      .fontSize(7)
      .font("Helvetica")
      .text("DIGITAL CROP DIAGNOSTICS SYSTEM", 85, 38, { characterSpacing: 1, opacity: 0.8 });
  };

  drawHeader();

  // --- REPORT TITLE & METADATA ---
  doc.moveDown(4);
  doc.font(selectedFont).fillColor("#064e40").fontSize(20).text(t.title, 40, 85);
  doc.rect(40, 110, 515, 0.5).fill("#e5e7eb");

  const metaY = 120;
  doc.font("Helvetica").fillColor("#6b7280").fontSize(8).text(`REPORT REF: ${filename.split('-')[1]?.split('.')[0] || 'N/A'}`, 40, metaY);
  doc.text(`TIMESTAMP: ${new Date().toLocaleString()}`, 40, metaY + 12);

  // --- CORE METRICS TABLE ---
  const tableY = 150;
  doc.roundedRect(40, tableY, 515, 70, 8).fill("#f8fafc");
  doc.roundedRect(40, tableY, 515, 70, 8).lineWidth(0.5).stroke("#e2e8f0");

  // Specimen
  doc.font(selectedFont).fillColor("#64748b").fontSize(7).text(t.plant, 60, tableY + 15);
  doc.fillColor("#0f172a").fontSize(11).font(selectedFont).text(data.plant, 60, tableY + 28);

  // Result
  doc.fillColor("#64748b").fontSize(7).text(t.diagnosis, 220, tableY + 15);
  doc.fillColor("#991b1b").fontSize(11).font(selectedFont).text(data.disease, 220, tableY + 28);

  // Confidence Meter
  const rawConf = data.confidence || 85;
  const confRatio = typeof rawConf === 'number' ? (rawConf > 1 ? rawConf / 100 : rawConf) : (parseFloat(rawConf) > 1 ? parseFloat(rawConf) / 100 : parseFloat(rawConf) || 0.85);
  const confPercent = Math.round(confRatio * 100);
  doc.fillColor("#64748b").fontSize(7).text(t.confidence, 400, tableY + 15);
  
  // Meter Bar
  doc.roundedRect(400, tableY + 30, 100, 8, 4).fill("#e2e8f0");
  const meterColor = confRatio > 0.8 ? "#10b981" : confRatio > 0.6 ? "#f59e0b" : "#ef4444";
  doc.roundedRect(400, tableY + 30, Math.min(100, Math.max(10, 100 * confRatio)), 8, 4).fill(meterColor);
  doc.fillColor(meterColor).fontSize(10).font("Helvetica-Bold").text(`${confPercent}%`, 400, tableY + 42);

  // --- CONTENT SECTIONS ---
  doc.y = 240; 
  let currentPage = 1;

  const drawSection = (title, content, color) => {
    if (!content || content.trim() === "") return; // SKIP EMPTY SECTIONS

    // Predict if next section will overflow (approx 100 units for header + 2 lines)
    if (doc.y > 650) {
      doc.addPage();
      drawHeader();
      doc.y = 90;
      currentPage++;
    }

    doc.moveDown(1.5);
    const startY = doc.y;
    
    // Aesthetic side-accent
    doc.rect(40, startY, 3, 15).fill("#10b981");
    
    doc.font(selectedFont).fillColor(color).fontSize(12).text(title, 50, startY + 2);
    doc.moveDown(0.8);
    
    doc
      .fillColor("#334155")
      .font(selectedFont)
      .fontSize(10.5)
      .text(content, { align: "justify", lineGap: 3, indent: 0 });
  };

  drawSection(t.obs, data.description, "#064e40");
  drawSection(t.cause, data.cause, "#064e40");
  drawSection(t.treatment, data.treatment, "#064e40");
  drawSection(t.prec, data.precaution, "#064e40");

  // --- FINAL FOOTER PASSOVER ---
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    
    const pageHeight = doc.page.height;
    // Footer Background
    doc.rect(0, pageHeight - 50, 595.28, 50).fill("#f1f5f9");
    doc.rect(0, pageHeight - 50, 595.28, 1).fill("#e2e8f0");
    
    doc
      .font(selectedFont)
      .fillColor("#64748b")
      .fontSize(7.5)
      .text(t.footer, 40, pageHeight - 30);
      
    doc.text(`${t.page} ${i + 1} / ${range.count}`, 500, pageHeight - 30, { align: "right", width: 55 });
  }

  doc.end();
  return filename;
};

export default generatePDF;
