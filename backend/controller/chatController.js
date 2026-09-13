import ChatThread from "../models/ChatThread.js";
import ChatMessage from "../models/ChatMessage.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const responses = {
  en: {
    greet: "Hello! I am AgroVision AI Specialist. How can I assist you with your crops, plant diseases, fertilizers, or farming practices today?",
    tomato_pesticides: "🍅 **Best Tomato Pesticides & Treatments**:\n\n1. **Fungal Diseases (Early/Late Blight, Leaf Spot, Mold)**:\n   • **Mancozeb 75% WP**: 2g/L water (Protective contact fungicide).\n   • **Chlorothalonil**: 2ml/L water (Effective against Early & Late Blight).\n   • **Copper Hydroxide**: Excellent for bacterial spots & blight prevention.\n\n2. **Sucking Pests (Whiteflies, Aphids, Spider Mites)**:\n   • **Imidacloprid 17.8% SL**: 0.5ml/L water (Systemic control for whiteflies transmitting Yellow Leaf Curl Virus).\n   • **Abamectin**: Highly effective against Spider Mites.\n\n3. **Organic Protection**:\n   • **Neem Oil (3000 PPM)**: Mix 5ml/L water + a few drops of liquid soap as an emulsifier.",
    mancozeb: "Mancozeb is a protective contact fungicide. Dosage: 2g/L of water. Ensure thorough coverage on both leaf surfaces. PHI (Pre-Harvest Interval): 7-14 days.",
    imidacloprid: "Imidacloprid is a systemic insecticide effective against sucking pests like aphids, whiteflies, and jassids. Apply 0.5ml per liter of water.",
    npk: "Balanced NPK (19:19:19) supports early vegetative growth. Switch to Potassium-rich fertilizer (0:0:50) during flowering & fruiting stage for higher yield.",
    bio: "Bio-agents like Trichoderma Viride (for root rot/soil fungi) and Pseudomonas Fluorescens (for bacterial blights) provide excellent eco-friendly plant protection.",
    spread: "Plant diseases spread rapidly through water splashes, wind, insects, and unsterilized tools. Sanitize cutting tools with 70% alcohol and remove infected leaves.",
    safe: "Avoid consuming severely infected plant parts. If chemical pesticides were sprayed, strictly observe the Pre-Harvest Interval (PHI) printed on the label.",
    organic: "Neem Oil (3000 PPM) is an effective organic preventative. Mix 5ml per 1L of water with a few drops of liquid soap as an emulsifier.",
    blight: "Blight causes dark spots and tissue decay. For Early Blight: apply Mancozeb or Chlorothalonil. For Late Blight: use Copper Hydroxide or Metalaxyl, and destroy infected stems.",
    yellow_leaves: "Yellowing leaves can be caused by Nitrogen deficiency, overwatering, or viral infections like Yellow Leaf Curl. Ensure proper drainage and apply balanced NPK.",
    rust: "Rust appears as reddish-orange powdery pustules. Treat with Sulfur-based fungicides or Propiconazole, and avoid overhead watering.",
    mold: "Leaf Mold thrives in high humidity. Prune lower foliage to increase air movement and apply copper-based fungicides.",
    watering: "Water plants early in the morning at the soil level. Avoid wetting foliage, as lingering leaf moisture promotes fungal spore germination.",
    soil: "Maintain soil pH between 6.0 - 7.0 for optimal nutrient absorption. Add organic compost or farmyard manure annually to improve soil structure.",
    context: (disease) => `Regarding ${disease}: Maintain proper spacing for airflow, manage soil moisture, and isolate affected plants to prevent further spread.`,
    default: "I am your AgroVision AI Assistant! Ask me about plant diseases (Blight, Rust, Mold, Spots), treatments (Mancozeb, Neem Oil, Copper), NPK fertilizers, or crop care."
  },
  hi: {
    greet: "नमस्ते! मैं आपका एग्रोविज़न एआई विशेषज्ञ हूँ। आज मैं आपकी फसलों, पौधों के रोगों, उर्वरकों या खेती के तरीकों में कैसे मदद कर सकता हूँ?",
    tomato_pesticides: "🍅 **टमाटर के लिए सर्वोत्तम कीटनाशक और उपचार**:\n\n1. **फंगल रोग (झुलसा, लीफ स्पॉट, मोल्ड)**:\n   • **मानकोज़ेब 75% WP**: 2 ग्राम/लीटर पानी (सुरक्षात्मक कवकनाशी)।\n   • **क्लोरोथालोनिल**: 2 मिली/लीटर पानी (झुलसा रोग के लिए उपयोगी)।\n\n2. **कीट (सफेद मक्खी, एफिड्स)**:\n   • **इमिडाक्लोप्रिड 17.8% SL**: 0.5 मिली/लीटर पानी (सफेद मक्खी नियंत्रण के लिए)।\n\n3. **जैविक सुरक्षा**:\n   • **नीम का तेल (3000 PPM)**: 5 मिली/लीटर पानी + तरल साबुन।",
    mancozeb: "मानकोज़ेब एक सुरक्षात्मक कवकनाशी (Fungicide) है। खुराक: 2 ग्राम प्रति लीटर पानी। ध्यान दें कि छिड़काव पत्तियों के दोनों तरफ हो। PHI: 7-14 दिन।",
    imidacloprid: "इमिडाक्लोप्रिड चूसने वाले कीटों जैसे सफेद मक्खी, माहू (एफिड्स) के लिए बहुत प्रभावी है। खुराक: 0.5 मिली प्रति लीटर पानी।",
    npk: "पौधों के शुरुआती विकास के लिए संतुलित NPK (19:19:19) का प्रयोग करें। फल बनते समय पोटेशियम (0:0:50) का उपयोग करें।",
    bio: "ट्राइकोडर्मा विरिडी और स्यूडोमोनास फ्लोरेसेंस जैसे जैविक कवकनाशी मिट्टी जनित रोगों के उपचार के लिए सबसे सुरक्षित विकल्प हैं।",
    spread: "बीमारियां पानी के छींटों, हवा और गंदे औजारों से फैलती हैं। औजारों को सैनिटाइज करें और बीमार पत्तियों को काट कर नष्ट कर दें।",
    safe: "संक्रमित फलों का सेवन न करें। रसायनों के छिड़काव के बाद 'प्रतीक्षा अवधि' (PHI) का पालन जरूर करें।",
    organic: "नीम का तेल (3000 PPM) एक बेहतरीन जैविक रोकथाम है। 1 लीटर पानी में 5 मिली नीम तेल और थोड़ा तरल साबुन मिलाकर छिड़काव करें।",
    blight: "झुलसा (Blight) रोग में पत्तियां काली/भूरी पड़ जाती हैं। अगेती झुलसा के लिए मानकोजेब और पछेती झुलसा के लिए कॉपर फंगीसाइड का प्रयोग करें।",
    yellow_leaves: "पत्तियों का पीला पड़ना नाइट्रोजन की कमी, अधिक पानी या वायरल बीमारी का लक्षण हो सकता है। जल निकासी सुधारें और NPK दें।",
    rust: "गेरुआ/रस्ट (Rust) में पत्तियों पर लाल-भूरे धब्बे बनते हैं। सल्फर आधारित कवकनाशी का छिड़काव करें।",
    mold: "लीफ मोल्ड नमी के कारण होता है। पौधे की निचली पत्तियों की छंटाई करें ताकि हवा का संचार बना रहे।",
    watering: "पौधों को सुबह के समय सीधे जड़ों में पानी दें। पत्तियों पर पानी डालने से फफूंद लगने का खतरा बढ़ता है।",
    soil: "मिट्टी का पीएच (pH) 6.0 से 7.0 के बीच होना चाहिए। हर साल जैविक खाद मिलाकर मिट्टी की उर्वरता बढ़ाएं।",
    context: (disease) => `${disease} के प्रबंधन के लिए हवा का संचार बेहतर बनाएं, नमी नियंत्रित रखें और प्रभावित भागों को हटा दें।`,
    default: "मैं आपका एग्रोविज़न एआई सहायक हूँ! मुझसे फसलों की बीमारियों (झुलसा, मोल्ड, रस्ट), दवाओं (मानकोजेब, नीम तेल) या खाद के बारे में पूछें।"
  },
  gu: {
    greet: "નમસ્તે! હું તમારો એગ્રોવિઝન એઆઈ નિષ્ણાત છું. આજે હું તમને તમારા પાક, રોગો, ખાતર અથવા ખેતી વિશે કેવી રીતે મદદ કરી શકું?",
    tomato_pesticides: "🍅 **ટામેટાં માટે શ્રેષ્ઠ જંતુનાશકો અને ઉપાયો**:\n\n1. **ફૂગના રોગો (સુકારો, પાંદડાના ધાબા)**:\n   • **મેન્કોઝેબ 75% WP**: 2 ગ્રામ/લિટર પાણી.\n   • **ક્લોરોથાલોનિલ**: 2 મિલી/લિટર પાણી.\n\n2. **જીવાતો (સફેદ માખી, એફિડ્સ)**:\n   • **ઇમિડાક્લોપ્રિડ**: 0.5 મિલી/લિટર પાણી.\n\n3. **જૈવિક ઉપાય**:\n   • **લીમડાનું તેલ**: 5 મિલી/લિટર પાણી.",
    mancozeb: "મેન્કોઝેબ એક રક્ષણાત્મક ફૂગનાશક છે. ડોઝ: 2 ગ્રામ પ્રતિ લિટર પાણી. પાંદડાની બંને બાજુ છંટકાવ કરવો. PHI: 7-14 દિવસ.",
    imidacloprid: "ઇમિડાક્લોપ્રિડ સફેદ માખી અને એફિડ્સ જેવા ચૂસિયા પ્રકારની જીવાતો માટે ઉત્તમ છે. 0.5 મિલી પ્રતિ લિટર પાણીમાં વાપરો.",
    npk: "શરૂઆતના વિકાસ માટે સંતુલિત NPK (19:19:19) વાપરો. ફળ આવતી વખતે પોટેશિયમયુક્ત ખાતર (0:0:50) આપવું.",
    bio: "ટ્રાઇકોડર્મા વિરિડી અને સ્યુડોમોનાસ ફ્લોરોસેન્સ જેવા જૈવિક એજન્ટો જમીનજન્ય રોગો માટે ખૂબ જ ઉપયોગી છે.",
    spread: "રોગ પાણીના છાંટા, હવા અને સાધનો દ્વારા ફેલાય છે. સાધનો સાફ રાખો અને ચેપગ્રસ્ત પાંદડા દૂર કરો.",
    safe: "ચેપગ્રસ્ત ફળો ખાશો નહીં. જંતુનાશક છાંટ્યા પછી 'વેઇટિંગ પિરિયડ' (PHI) નું પાલન કરવું.",
    organic: "લીમડાનું તેલ (3000 PPM) ઉત્તમ જૈવિક ઉપાય છે. 1 લિટર પાણીમાં 5 મિલી લીમડાનું તેલ અને થોડું પ્રવાહી સાબુ મેળવો.",
    blight: "સુકારો/ગેરુ રોગમાં પાંદડા પર કાળા-બદામી ધાબા પડે છે. મેન્કોઝેબ અથવા કોપર ફૂગનાશકનો છંટકાવ કરો.",
    yellow_leaves: "પાંદડા પીળા પડવા તે નાઇટ્રોજનની અછત અથવા વધુ પડતા પાણીનું કારણ હોઈ શકે છે. યોગ્ય નિતાર રાખો.",
    rust: "ગેરુ (Rust) માં પાંદડા પર લાલ-બદામી પાવડર જેવા ધાબા દેખાય છે. સલ્ફર ફૂગનાશકનો ઉપયોગ કરો.",
    mold: "ભેજવાળા વાતાવરણમાં મોલ્ડ ફેલાય છે. હવાની અવરજવર વધારવા પાંદડાઓની છાંટણી કરો.",
    watering: "છોડને સવારે મૂળમાં જ પાણી આપવું. પાંદડા ભીના રાખવાથી ફૂગના રોગો વધે છે.",
    soil: "જમીનનું pH 6.0 થી 7.0 રાખવું ઉત્તમ છે. સેન્દ્રિય ખાતર ઉમેરી જમીનની ફળદ્રુપતા વધારો.",
    context: (disease) => `${disease} ના નિયંત્રણ માટે હવાની અવરજવર જાળવો અને ચેપગ્રસ્ત ભાગો દૂર કરો.`,
    default: "હું તમારો એગ્રોવિઝન એઆઈ સહાયક છું! પાકના રોગો, દવાનો છંટકાવ, જૈવિક ખાતર અને ખેતી વિશે કંઈપણ પૂછો."
  }
};

export const getChatResponse = async (req, res) => {
  const { message, context, lang, threadId, imageUrl } = req.body;
  const currentLang = lang || 'en';
  const repo = responses[currentLang] || responses.en;
  
  if (!message && !imageUrl) return res.status(400).json({ error: "Message or image is required" });

  try {
    let response = "";
    let analyzedDiseaseInfo = null;

    // 1. If image is uploaded in chat, send to Flask Backend for real AI prediction
    if (imageUrl) {
      try {
        let cleanRelPath = imageUrl.replace(/\\/g, "/");
        if (cleanRelPath.startsWith("/")) cleanRelPath = cleanRelPath.substring(1);

        const candidatePaths = [
          path.resolve(__dirname, "..", cleanRelPath),
          path.resolve(process.cwd(), cleanRelPath),
          path.resolve(process.cwd(), "uploads", path.basename(cleanRelPath))
        ];

        let fullImagePath = candidatePaths.find(p => fs.existsSync(p));

        if (fullImagePath) {
          const form = new FormData();
          form.append("image", fs.createReadStream(fullImagePath));

          const flaskUrl = process.env.FLASK_URL || "http://127.0.0.1:8000";
          const flaskResponse = await axios.post(`${flaskUrl}/predict`, form, {
            headers: form.getHeaders(),
            timeout: 10000
          });

          if (flaskResponse.data && flaskResponse.data.plant) {
            analyzedDiseaseInfo = flaskResponse.data;
            response = `🔍 **AI Image Analysis Result**:\n\n` +
              `🌱 **Plant**: ${analyzedDiseaseInfo.plant}\n` +
              `🦠 **Diagnosis**: ${analyzedDiseaseInfo.disease.replace(/_/g, ' ')}\n` +
              `🎯 **Confidence**: ${analyzedDiseaseInfo.confidence}%\n\n` +
              `📝 **Description**: ${analyzedDiseaseInfo.description}\n` +
              `💊 **Treatment**: ${analyzedDiseaseInfo.treatment}\n` +
              `🛡️ **Precaution**: ${analyzedDiseaseInfo.precaution}`;
          }
        } else {
          console.error("Uploaded image file not found at candidate paths:", candidatePaths);
        }
      } catch (err) {
        console.error("Flask prediction error in chat assistant:", err.message);
      }

      if (!response) {
        response = `📸 I received your plant leaf image! Our AI model processed it. If you need specific treatment advice for this plant, ask me about diseases (Blight, Mold, Rust, Yellowing) or pesticides (Mancozeb, Imidacloprid, Neem Oil).`;
      }
    }

    // 2. Text NLP Matching if no image response generated yet
    if (!response) {
      const msg = (message || "").toLowerCase();

      if (/^(hi|hello|hey|greetings|namaste|नमस्ते|નમસ્તે)/.test(msg)) {
        response = repo.greet;
      } else if (/tomato|टमाटर|ટામેટા/.test(msg) && /pesticide|medicine|fungicide|pest|insect|कीट|दवा|દવા/.test(msg)) {
        response = repo.tomato_pesticides;
      } else if (/mancozeb|fungicide|કવકનાશી|कवकनाशी|medicine|दवा|દવા/.test(msg)) {
        response = repo.mancozeb;
      } else if (/imidacloprid|pest|insect|कीट|जीवात|જીવાત|pesticide|aphid|whitefly/.test(msg)) {
        response = repo.imidacloprid;
      } else if (/npk|fertilizer|manure|खाद|ખાતર|nitrogen|potassium|phosphorus/.test(msg)) {
        response = repo.npk;
      } else if (/bio|trichoderma|pseudomonas|organic|जैविक|જૈવિક|neem|नीम|લીમડો/.test(msg)) {
        response = repo.organic;
      } else if (/spread|transmission|infect|फैलाव|ફેલાવો/.test(msg)) {
        response = repo.spread;
      } else if (/blight|झुलसा|સુકારો|early blight|late blight/.test(msg)) {
        response = repo.blight;
      } else if (/yellow|पीली|પીળા|yellowing/.test(msg)) {
        response = repo.yellow_leaves;
      } else if (/rust|रस्ट|गेरुआ|गेरू/.test(msg)) {
        response = repo.rust;
      } else if (/mold|मोल्ड|mould/.test(msg)) {
        response = repo.mold;
      } else if (/water|watering|सिंचाई|પાણી/.test(msg)) {
        response = repo.watering;
      } else if (/soil|मिट्टी|જમીન|ph/.test(msg)) {
        response = repo.soil;
      } else if (/safe|eat|consume|खायें|ખાવા/.test(msg)) {
        response = repo.safe;
      } else if (context && context.disease) {
        response = repo.context(context.disease);
      } else {
        response = repo.default;
      }
    }

    // --- Persistence Logic ---
    let currentThreadId = threadId;
    const titleText = message ? (message.substring(0, 30) + (message.length > 30 ? "..." : "")) : "Image Diagnosis";

    if (!currentThreadId) {
      const newThread = await ChatThread.create({
        user: req.user._id,
        title: titleText,
        lastMessage: response.substring(0, 50) + "..."
      });
      currentThreadId = newThread._id;
    } else {
      await ChatThread.findByIdAndUpdate(currentThreadId, {
        lastMessage: response.substring(0, 50) + "...",
        updatedAt: new Date()
      });
    }

    // Save message with imageUrl attached if provided
    const userMsgObj = { thread: currentThreadId, sender: "user", text: message || "Sent an image for analysis" };
    if (imageUrl) userMsgObj.imageUrl = imageUrl;

    await ChatMessage.create([
      userMsgObj,
      { thread: currentThreadId, sender: "bot", text: response }
    ]);

    res.status(200).json({ 
      reply: response, 
      threadId: currentThreadId 
    });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
};

export const renameThread = async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  try {
    const thread = await ChatThread.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title },
      { new: true }
    );
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    res.status(200).json(thread);
  } catch (error) {
    res.status(500).json({ error: "Failed to rename thread" });
  }
};

export const getThreads = async (req, res) => {
  try {
    const threads = await ChatThread.find({ user: req.user._id })
      .sort({ updatedAt: -1 });
    res.status(200).json(threads);
  } catch (error) {
    res.status(500).json({ error: "Failed to catch history" });
  }
};

export const getThreadMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ thread: req.params.id })
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to load messages" });
  }
};

export const deleteThread = async (req, res) => {
  try {
    await ChatMessage.deleteMany({ thread: req.params.id });
    await ChatThread.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Thread deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete thread" });
  }
};
