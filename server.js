import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import downloadRoute from "./routes/download.route.js";
import job from "./lib/cron.js";
import playdl from "play-dl";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

job.start();

if (process.env.YOUTUBE_COOKIE) {
  playdl.setToken({
    youtube: {
      cookie: process.env.YOUTUBE_COOKIE,
    },
  });
}

app.use(
    cors({
      origin: ["https://youty-backend.onrender.com", "https://youty.vercel.app", "http://localhost:5174"], // your frontend domain
      methods: ["GET", "POST"],
      credentials: true,
    })
  );
app.use(express.json());
app.use("/", downloadRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})