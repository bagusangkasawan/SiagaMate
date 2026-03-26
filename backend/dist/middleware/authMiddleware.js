"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
/**
 * Middleware: verifies Firebase ID token from Authorization header.
 * Sets req.uid and req.email on success.
 */
async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token autentikasi diperlukan' });
    }
    const idToken = header.slice(7);
    if (firebase_admin_1.default.apps.length === 0) {
        return res.status(503).json({ error: 'Firebase belum diinisialisasi' });
    }
    try {
        const decoded = await firebase_admin_1.default.auth().verifyIdToken(idToken);
        req.uid = decoded.uid;
        req.email = decoded.email;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa' });
    }
}
/**
 * Optional auth: extracts uid if token present, but doesn't block.
 */
async function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ') || firebase_admin_1.default.apps.length === 0) {
        return next();
    }
    try {
        const decoded = await firebase_admin_1.default.auth().verifyIdToken(header.slice(7));
        req.uid = decoded.uid;
        req.email = decoded.email;
    }
    catch {
        // silently continue without auth
    }
    next();
}
