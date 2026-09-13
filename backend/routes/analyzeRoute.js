import express from "express";
import controllers from "../controller/analyzeController.js";
import auth from "../middleware/auth.js";

const { analyzeImage, getHistory, getCommunityStats, deleteHistory } = controllers;
const router = express.Router();

router.post("/", auth, analyzeImage);
router.get("/history", auth, getHistory);
router.get("/community-stats", auth, getCommunityStats);
router.delete("/:id", auth, deleteHistory);

export default router;