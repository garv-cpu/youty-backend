import express from 'express';
import {getDownloadFile, getVideoMetadata} from "../controllers/download.controller.js";

const router = express.Router();

router.get('/download', getDownloadFile);
router.get('/metadata', getVideoMetadata);

export default router;