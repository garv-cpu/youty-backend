import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ytdl from "@distube/ytdl-core";

// Set ffmpeg binary path globally
ffmpeg.setFfmpegPath(ffmpegPath);

// ==============================
// Download Controller
// ==============================
export const getDownloadFile = async (req, res) => {
  const videoURL = req.query.url;
  console.log("Attempting to download:", videoURL);

  if (!videoURL || !ytdl.validateURL(videoURL)) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const info = await ytdl.getInfo(videoURL);
    const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "-");

    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp3"`);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");

    const audioStream = ytdl(videoURL, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    ffmpeg(audioStream)
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

  if (!videoURL || !ytdl.validateURL(videoURL)) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const info = await ytdl.getInfo(videoURL);
    const { title, description, videoId, author, lengthSeconds } =
      info.videoDetails;

    res.json({
      videoId,
      title,
      description,
      channel: author.name,
      duration: `${Math.floor(lengthSeconds / 60)}:${
        lengthSeconds % 60
      }`.padStart(2, "0"),
    });
  } catch (error) {
    console.error("Metadata Error: ", error);
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
};
