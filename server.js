import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import downloadRoute from "./routes/download.route.js";
import job from "./lib/cron.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

job.start();

app.use(
    cors({
      origin: "https://youty-backend.onrender.com", // your frontend domain
      methods: ["GET", "POST"],
      credentials: true,
    })
  );
app.use(express.json());
app.use("/", downloadRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})