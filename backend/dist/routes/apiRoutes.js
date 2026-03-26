"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bmkgService_js_1 = require("../services/bmkgService.js");
const riskService_js_1 = require("../services/riskService.js");
const chatbotService_js_1 = require("../services/chatbotService.js");
const simulationService_js_1 = require("../services/simulationService.js");
const geocodingService_js_1 = require("../services/geocodingService.js");
const ChatInteraction_js_1 = require("../models/ChatInteraction.js");
const DeviceToken_js_1 = require("../models/DeviceToken.js");
const NotificationLog_js_1 = require("../models/NotificationLog.js");
const RiskPrediction_js_1 = require("../models/RiskPrediction.js");
const User_js_1 = require("../models/User.js");
const AssessmentResult_js_1 = require("../models/AssessmentResult.js");
const fcmService_js_1 = require("../services/fcmService.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
function parseLocation(query) {
    const lat = Number.parseFloat(String(query.lat ?? ''));
    const lng = Number.parseFloat(String(query.lng ?? ''));
    return {
        lat: Number.isNaN(lat) ? -6.2 : lat,
        lng: Number.isNaN(lng) ? 106.8 : lng
    };
}
// ═══════════════════════════════════════════
// PUBLIC ROUTES (no auth required)
// ═══════════════════════════════════════════
router.get('/bmkg/feeds', async (_req, res) => {
    try {
        const feedData = await (0, bmkgService_js_1.getBmkgMultiFeed)();
        res.json(feedData);
    }
    catch {
        res.status(502).json({ error: 'Data BMKG sementara tidak tersedia' });
    }
});
router.get('/geocode/search', async (req, res) => {
    const query = String(req.query.q || '');
    if (!query || query.trim().length < 3) {
        return res.json({ locations: [] });
    }
    const locations = await (0, geocodingService_js_1.searchLocation)(query);
    res.json({ locations });
});
router.get('/alerts', async (req, res) => {
    const { lat, lng } = parseLocation(req.query);
    const alerts = await (0, bmkgService_js_1.getAlertsByLocation)(lat, lng);
    await NotificationLog_js_1.NotificationLogModel.insertMany(alerts.map((item) => ({ ...item })));
    const highestAlert = alerts.find((item) => item.severity === 'high');
    if (highestAlert) {
        const tokens = await DeviceToken_js_1.DeviceTokenModel.find({}, { token: 1, _id: 0 }).lean();
        const payload = {
            category: highestAlert.category,
            severity: highestAlert.severity
        };
        await Promise.allSettled(tokens.map((entry) => (0, fcmService_js_1.sendPushNotification)({
            token: String(entry.token),
            title: highestAlert.title,
            body: highestAlert.message,
            data: payload
        })));
    }
    res.json({ alerts });
});
router.get('/assessment/questions', (_req, res) => {
    const questions = (0, simulationService_js_1.getAssessmentQuestions)();
    res.json({ questions });
});
router.post('/simulate', (req, res) => {
    const { scenarioType = 'banjir', lat = -6.2, lng = 106.8 } = req.body || {};
    const simulation = (0, simulationService_js_1.simulateScenario)({
        type: String(scenarioType),
        lat: Number(lat),
        lng: Number(lng)
    });
    res.json({ simulation });
});
// ═══════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════
/**
 * POST /auth/login
 * Receives Firebase ID token, upserts user in MongoDB, returns user data.
 */
router.post('/auth/login', authMiddleware_js_1.requireAuth, async (req, res) => {
    const authReq = req;
    const { name, photoURL } = req.body || {};
    try {
        const user = await User_js_1.UserModel.findOneAndUpdate({ firebaseUid: authReq.uid }, {
            $setOnInsert: {
                firebaseUid: authReq.uid,
                name: name || 'Pengguna Baru',
                locationLabel: 'Jakarta Selatan',
                lat: -6.2615,
                lng: 106.8106,
                profile: 'warga',
                disasterType: 'banjir'
            },
            $set: {
                email: authReq.email || '',
                photoURL: photoURL || ''
            }
        }, { upsert: true, new: true });
        res.json({ user });
    }
    catch (error) {
        console.error('Login/upsert error:', error);
        res.status(500).json({ error: 'Gagal menyimpan data pengguna' });
    }
});
/**
 * GET /auth/me
 * Returns current user profile + latest saved data.
 */
router.get('/auth/me', authMiddleware_js_1.requireAuth, async (req, res) => {
    const authReq = req;
    try {
        const user = await User_js_1.UserModel.findOne({ firebaseUid: authReq.uid }).lean();
        if (!user) {
            return res.status(404).json({ error: 'User belum terdaftar' });
        }
        // Load latest assessment and risk in parallel
        const [latestAssessment, latestRisk] = await Promise.all([
            AssessmentResult_js_1.AssessmentResultModel.findOne({ userId: authReq.uid }).sort({ createdAt: -1 }).lean(),
            RiskPrediction_js_1.RiskPredictionModel.findOne({ userId: authReq.uid }).sort({ createdAt: -1 }).lean()
        ]);
        res.json({
            user,
            latestAssessment: latestAssessment || null,
            latestRisk: latestRisk || null
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Gagal mengambil data pengguna' });
    }
});
/**
 * PUT /auth/profile
 * Updates the user's profile fields.
 */
router.put('/auth/profile', authMiddleware_js_1.requireAuth, async (req, res) => {
    const authReq = req;
    const { name, locationLabel, lat, lng, profile, disasterType, adminLevel4Code } = req.body || {};
    try {
        const updateFields = {};
        if (name !== undefined)
            updateFields.name = name;
        if (locationLabel !== undefined)
            updateFields.locationLabel = locationLabel;
        if (lat !== undefined)
            updateFields.lat = Number(lat);
        if (lng !== undefined)
            updateFields.lng = Number(lng);
        if (profile !== undefined)
            updateFields.profile = profile;
        if (disasterType !== undefined)
            updateFields.disasterType = disasterType;
        if (adminLevel4Code !== undefined)
            updateFields.adminLevel4Code = adminLevel4Code;
        const user = await User_js_1.UserModel.findOneAndUpdate({ firebaseUid: authReq.uid }, { $set: updateFields }, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Gagal memperbarui profil' });
    }
});
// ═══════════════════════════════════════════
// PERSONALIZED ROUTES (auth required)
// ═══════════════════════════════════════════
/**
 * POST /register — legacy register (still works without auth)
 */
router.post('/register', async (req, res) => {
    const { name, locationLabel, lat, lng, profile = 'warga' } = req.body || {};
    const user = await User_js_1.UserModel.create({
        firebaseUid: `anonymous_${Date.now()}`,
        name: name || 'Pengguna Baru',
        locationLabel: locationLabel || 'Lokasi belum diatur',
        lat: Number(lat) || -6.2,
        lng: Number(lng) || 106.8,
        profile
    });
    res.status(201).json({ user });
});
router.post('/notifications/register-token', async (req, res) => {
    const { token, platform = 'web', userId = null, locationLabel = null } = req.body || {};
    if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'token FCM wajib diisi' });
    }
    const record = await DeviceToken_js_1.DeviceTokenModel.findOneAndUpdate({ token }, { token, platform, userId, locationLabel }, { upsert: true, new: true });
    res.status(201).json({ device: record });
});
/**
 * GET /risk — with optional auth to save per-user
 */
router.get('/risk', authMiddleware_js_1.optionalAuth, async (req, res) => {
    try {
        const authReq = req;
        const { lat, lng } = parseLocation(req.query);
        const disasterType = String(req.query.disasterType || 'banjir');
        const profile = String(req.query.profile || 'warga');
        const adminLevel4Code = req.query.adminLevel4Code ? String(req.query.adminLevel4Code) : undefined;
        const prediction = await (0, riskService_js_1.predictRisk)({ lat, lng, disasterType, profile, adminLevel4Code });
        // Save to database with userId if authenticated
        RiskPrediction_js_1.RiskPredictionModel.create({
            ...prediction,
            userId: authReq.uid || null
        }).catch(err => {
            console.error('Failed to save risk prediction:', err);
        });
        res.json({ prediction });
    }
    catch (error) {
        console.error('Risk prediction error:', error);
        res.status(500).json({ error: 'Gagal menganalisis risiko' });
    }
});
/**
 * POST /chat — requires authentication
 */
router.post('/chat', authMiddleware_js_1.requireAuth, async (req, res) => {
    const authReq = req;
    const { message = '', context = {} } = req.body || {};
    if (!message.trim()) {
        return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }
    const chatResult = await (0, chatbotService_js_1.askGemini)(message, context);
    const record = await ChatInteraction_js_1.ChatInteractionModel.create({
        userId: authReq.uid,
        message,
        answer: chatResult.answer,
        provider: chatResult.provider,
        context
    });
    // Enforce 5-message limit per user
    if (authReq.uid) {
        (0, ChatInteraction_js_1.enforceChatLimit)(authReq.uid).catch(err => {
            console.error('Chat limit enforcement failed:', err);
        });
    }
    res.json({
        response: {
            id: record.id,
            message: record.message,
            answer: record.answer,
            provider: record.provider,
            createdAt: record.createdAt
        }
    });
});
/**
 * GET /chat/history — returns up to 5 most recent chat interactions for the user
 */
router.get('/chat/history', authMiddleware_js_1.requireAuth, async (req, res) => {
    const authReq = req;
    try {
        const chats = await ChatInteraction_js_1.ChatInteractionModel
            .find({ userId: authReq.uid })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('message answer provider createdAt')
            .lean();
        res.json({ chats }); // newest first (matches frontend prepending behavior)
    }
    catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ error: 'Gagal mengambil riwayat chat' });
    }
});
/**
 * POST /assessment/calculate — with optional auth to save results
 */
router.post('/assessment/calculate', authMiddleware_js_1.optionalAuth, (req, res) => {
    const authReq = req;
    const { answers } = req.body || {};
    if (!answers || typeof answers !== 'object') {
        return res.status(400).json({ error: 'answers object wajib diisi' });
    }
    const result = (0, simulationService_js_1.calculateAssessmentScore)(answers);
    // Save to DB if authenticated
    if (authReq.uid) {
        AssessmentResult_js_1.AssessmentResultModel.create({
            userId: authReq.uid,
            ...result,
            answers
        }).catch(err => {
            console.error('Failed to save assessment result:', err);
        });
    }
    res.json(result);
});
/**
 * GET /assessment/result — returns latest assessment result for the user
 */
router.get('/assessment/result', authMiddleware_js_1.requireAuth, async (req, res) => {
    const authReq = req;
    try {
        const latest = await AssessmentResult_js_1.AssessmentResultModel
            .findOne({ userId: authReq.uid })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ result: latest || null });
    }
    catch (error) {
        console.error('Get assessment result error:', error);
        res.status(500).json({ error: 'Gagal mengambil hasil assessment' });
    }
});
exports.default = router;
