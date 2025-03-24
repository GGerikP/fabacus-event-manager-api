// src/app.ts
import express from 'express';
import routes from './api/routes';

const app = express();

// Middleware
app.use(express.json());

/*
   TODO: Add User Authentication Middleware
*/

// Routes
app.use('/api/v1', routes);

export default app;
