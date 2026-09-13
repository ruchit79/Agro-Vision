import express from "express";
import { 
  getChatResponse, 
  getThreads, 
  getThreadMessages, 
  deleteThread,
  renameThread
} from "../controller/chatController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, getChatResponse);
router.get("/threads", auth, getThreads);
router.get("/thread/:id", auth, getThreadMessages);
router.delete("/thread/:id", auth, deleteThread);
router.patch("/thread/:id", auth, renameThread);

export default router;
