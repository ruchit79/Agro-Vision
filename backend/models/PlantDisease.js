import mongoose from "mongoose";

const PlantSchema = new mongoose.Schema({
  User: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  plant: {
    type: String,
    required: true,
  },
  disease: {
    type: String,
    required: true,
  },
  confidence: {
    type: String,
  },
  description: {
    type: String,
  },
  treatment: {
    type: String,
  },
  cause: {
    type: String,
  },
  precaution: {
    type: String,
  },
  pdfUrl: {
    type: String,
  },
}, { timestamps: true });

const PlantDisease = mongoose.model("PlantDisease", PlantSchema);

export default PlantDisease;
