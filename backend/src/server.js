import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeDb } from './utils/db.js';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use('/api', router);
app.use(errorHandler);

const port = process.env.PORT || 5000;

initializeDb().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
