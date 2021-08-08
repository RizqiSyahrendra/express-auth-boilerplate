import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { errorMiddleware, notFoundMiddleware } from './middleware/errorMiddleware.js';

import welcomeRoutes from './routes/welcomeRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
dotenv.config();

//middlewares
app.use(cors());
app.use(bodyParser.json());

//routes
app.use('/', welcomeRoutes);
app.use('/auth', authRoutes);

//error middlewares
app.use(errorMiddleware);
app.use(notFoundMiddleware);

app.listen(process.env.PORT, () => {
    console.log(`Server started on ${process.env.PORT}`);
});