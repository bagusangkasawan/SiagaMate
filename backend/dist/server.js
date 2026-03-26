"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const apiRoutes_js_1 = __importDefault(require("./routes/apiRoutes.js"));
const database_js_1 = require("./config/database.js");
const env_js_1 = require("./config/env.js");
const fcmService_js_1 = require("./services/fcmService.js");
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const hpp_1 = __importDefault(require("hpp"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin(requestOrigin, callback) {
        // Allow requests with no origin (curl, server-to-server)
        if (!requestOrigin)
            return callback(null, true);
        // Allow the configured origin + common dev ports
        const allowed = [
            ...env_js_1.env.frontendOrigin.split(',').map(o => o.trim()),
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:4173',
        ];
        if (allowed.includes(requestOrigin))
            return callback(null, true);
        callback(null, false);
    }
}));
// 1. Security HTTP Headers
app.use((0, helmet_1.default)());
// 2. Rate Limiting (100 request per 15 menit per IP)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Terlalu banyak request dari IP Anda, coba lagi dalam 15 menit.' }
});
app.use('/api', limiter);
// 3. Body Parser config (limit 10kb)
app.use(express_1.default.json({ limit: '10kb' }));
// 4. Prevent HTTP Parameter Pollution
app.use((0, hpp_1.default)());
// 5. Root endpoint
app.get('/', (req, res) => {
    res.send('SiagaMate API is running...');
});
app.use('/api', apiRoutes_js_1.default);
// Global error handler
app.use((error, _req, res, _next) => {
    const statusCode = typeof error === 'object' && error && 'status' in error
        ? Number(error.status) || 500
        : 500;
    const message = typeof error === 'object' && error && 'message' in error
        ? String(error.message) + (error instanceof Error ? `\nStack: ${error.stack}` : '')
        : 'Terjadi kesalahan internal server';
    console.error('[Global Error Handler]', error);
    res.status(statusCode).json({ error: message });
});
// Initialize database and Firebase
(0, database_js_1.connectDatabase)()
    .then(() => {
    (0, fcmService_js_1.initFirebase)();
    app.listen(env_js_1.env.port, () => {
        console.log(`SiagaMate API berjalan di http://localhost:${env_js_1.env.port}`);
    });
})
    .catch((err) => {
    console.error('Gagal memulai server:', err);
    process.exit(1);
});
