import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import generatePDF from "../utils/generatePDF.js";
import PlantDisease from "../models/PlantDisease.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const analyzeImage = async (req, res) => {
  const { filePath } = req.body;
  console.log("filePath debugging:", filePath);
  try {
    if (!filePath) {
      return res.status(400).json({ error: "Valid filePath is required" });
    }

    let cleanRelPath = filePath.replace(/\\/g, "/");
    if (cleanRelPath.startsWith("/")) cleanRelPath = cleanRelPath.substring(1);

    const candidatePaths = [
      path.resolve(__dirname, "..", cleanRelPath),
      path.resolve(process.cwd(), cleanRelPath),
      path.resolve(process.cwd(), "uploads", path.basename(cleanRelPath)),
      path.resolve(filePath)
    ];

    const resolvedFilePath = candidatePaths.find(p => fs.existsSync(p));

    if (!resolvedFilePath) {
      console.error("Analyze Controller: Image file not found at candidates:", candidatePaths);
      return res.status(400).json({ error: "Valid filePath is required" });
    }

    // ✅ 2. Create form and attach image stream
    const form = new FormData();
    form.append("image", fs.createReadStream(resolvedFilePath));

    // ✅ 3. Send to Flask API
    const flaskUrl = process.env.FLASK_URL || "http://127.0.0.1:8000";
    const flaskResponse = await axios.post(`${flaskUrl}/predict`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // ✅ 4. Generate PDF Report
    const result = flaskResponse.data;
    const lang = req.body.lang || "en";

    const fileName = `report-${Date.now()}.pdf`;
    const pdfPath = generatePDF(result, fileName, lang);

    // ✅ Save result to database for history
    const historyEntry = await PlantDisease.create({
      User: req.user._id,
      plant: result.plant,
      disease: result.disease,
      confidence: result.confidence.toString(),
      description: result.description,
      treatment: result.treatment,
      cause: result.cause,
      precaution: result.precaution,
      pdfUrl: `/reports/${fileName}`
    });

    await historyEntry.save();

    return res.status(200).json({
      ...result,
      pdfUrl: `/reports/${fileName}`,
    });
  } catch (error) {
    if (error.response) {
      console.error("Flask API responded with error:", {
        status: error.response.status,
        data: error.response.data,
      });
      return res.status(error.response.status).json({
        error: error.response.data.error || "Flask API error",
        message: error.response.data.message || JSON.stringify(error.response.data),
      });
    } else if (error.request) {
      console.error("No response received from Flask API:", error.request);
      return res.status(500).json({ error: "No response from Flask API" });
    } else {
      console.error("Error setting up request to Flask API:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }
};

export const getHistory = async (req, res) => {
  try {
    const history = await PlantDisease.find({ User: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal Error" });
  }
};

export const getCommunityStats = async (req, res) => {
  try {
    // Get last 20 public reports (anonymized)
    const recentReports = await PlantDisease.find()
      .select('plant disease confidence createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    // Grouping by disease for "Hotspots" (simulation)
    const hotspots = recentReports.reduce((acc, curr) => {
      acc[curr.disease] = (acc[curr.disease] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({ recentReports, hotspots });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal Error" });
  }
};

export const deleteHistory = async (req, res) => {
  try {
    const deleted = await PlantDisease.findOneAndDelete({ 
      _id: req.params.id, 
      User: req.user._id 
    });
    if (!deleted) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Deletion failed" });
  }
};

export default { analyzeImage, getHistory, getCommunityStats, deleteHistory };
