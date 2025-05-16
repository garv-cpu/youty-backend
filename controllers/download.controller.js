import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import playdl from "play-dl";

// Set ffmpeg binary path globally
ffmpeg.setFfmpegPath(ffmpegPath);

// ==============================
// Download Controller
// ==============================
export const getDownloadFile = async (req, res) => {
  const videoURL = req.query.url;
  console.log("Attempting to download:", videoURL);

  if (!videoURL || !playdl.yt_validate(videoURL)) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    // Get video info
    const videoInfo = await playdl.video_info(videoURL);
    const title = videoInfo.video_details.title.replace(/[^a-zA-Z0-9]/g, "-");

    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp3"`);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders();

    // Get audio stream (play-dl returns a readable stream URL)
    const stream = await playdl.stream(videoURL, { quality: 1 }); // 1 = highest quality audio

    ffmpeg(stream.stream)
      .audioBitrate(128)
      .format("mp3")
      .on("error", (err) => {
        console.error("FFmpeg Error: ", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Conversion Error" });
        }
      })
      .pipe(res, { end: true });
  } catch (error) {
    console.error("New Error: ", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

// ==============================
// Metadata Controller
// ==============================
export const getVideoMetadata = async (req, res) => {
  const videoURL = req.query.url;

  if (!videoURL || !playdl.yt_validate(videoURL)) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const videoInfo = await playdl.video_info(videoURL);
    const vd = videoInfo.video_details;

    const durationSeconds = parseInt(vd.durationInSec) || 0;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;

    res.json({
      videoId: vd.id,
      title: vd.title,
      description: vd.description,
      channel: vd.channel.name,
      duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    });
  } catch (error) {
    console.error("Metadata Error: ", error);
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
};
