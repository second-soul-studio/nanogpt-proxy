import express from 'express';

export default function registerAdminRoutes(app) {
    const router = express.Router();
    // To develop
    app.use('/api/v1/admin', router);
}