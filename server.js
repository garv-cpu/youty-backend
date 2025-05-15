import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import downloadRoute from "./routes/download.route.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/", downloadRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})