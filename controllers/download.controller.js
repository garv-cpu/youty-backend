// Updated version using yt-dlp instead of play-dl

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

// ==============================
// Download Controller
// ==============================
export const getDownloadFile = async (req, res) => {
  const videoURL = req.query.url;
  console.log("Attempting to download:", videoURL);

  if (!videoURL || !videoURL.includes("youtube.com") && !videoURL.includes("youtu.be")) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  const tempDir = os.tmpdir();
  const outputId = uuidv4();
  const outputPath = path.join(tempDir, `${outputId}.mp3`);

  try {
    const ytDlpArgs = [
      videoURL,
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "128K",
      "-o", outputPath,
    ];

    if (process.env.YOUTUBE_COOKIE_PATH) {
      ytDlpArgs.push("--cookies", process.env.YOUTUBE_COOKIE_PATH);
    }

    const ytDlp = spawn("yt-dlp", ytDlpArgs);

    ytDlp.stderr.on("data", (data) => {
      console.error(`yt-dlp error: ${data}`);
    });

    ytDlp.on("close", (code) => {
      if (code === 0) {
        const filename = `${outputId}.mp3`;
        res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
        res.setHeader("Content-Type", "audio/mpeg");

        const readStream = fs.createReadStream(outputPath);
        readStream.pipe(res);

        readStream.on("close", () => {
          fs.unlink(outputPath, () => {}); // Clean up
        });
      } else {
        console.error("yt-dlp process exited with code", code);
        res.status(500).json({ error: "Download failed" });
      }
    });
  } catch (error) {
    console.error("yt-dlp error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ==============================
// Metadata Controller
// ==============================
export const getVideoMetadata = async (req, res) => {
  const videoURL = req.query.url;

  if (!videoURL || (!videoURL.includes("youtube.com") && !videoURL.includes("youtu.be"))) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const ytDlp = spawn("yt-dlp", [
      "--dump-json",
      videoURL,
      ...(process.env.YOUTUBE_COOKIE_PATH ? ["--cookies", process.env.YOUTUBE_COOKIE_PATH] : [])
    ]);

    let output = "";
    ytDlp.stdout.on("data", (data) => {
      output += data.toString();
    });

    ytDlp.stderr.on("data", (data) => {
      console.error("yt-dlp stderr:", data.toString());
    });

    ytDlp.on("close", () => {
      try {
        const json = JSON.parse(output);
        const durationSeconds = json.duration || 0;
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;

        res.json({
          videoId: json.id,
          title: json.title,
          description: json.description,
          channel: json.uploader,
          duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
        });
      } catch (e) {
        console.error("Metadata parse error:", e);
        res.status(500).json({ error: "Failed to fetch metadata" });
      }
    });
  } catch (error) {
    console.error("Metadata Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
