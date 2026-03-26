"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = getSummary;
const ChatInteraction_js_1 = require("../models/ChatInteraction.js");
const NotificationLog_js_1 = require("../models/NotificationLog.js");
const RiskPrediction_js_1 = require("../models/RiskPrediction.js");
const User_js_1 = require("../models/User.js");
async function getSummary() {
    const [totalUsers, totalNotifications, totalChats, totalPredictions] = await Promise.all([
        User_js_1.UserModel.countDocuments(),
        NotificationLog_js_1.NotificationLogModel.countDocuments(),
        ChatInteraction_js_1.ChatInteractionModel.countDocuments(),
        RiskPrediction_js_1.RiskPredictionModel.countDocuments()
    ]);
    return {
        generatedAt: new Date().toISOString(),
        metrics: {
            totalUsers,
            totalNotifications,
            totalChats,
            totalPredictions
        },
        insights: [
            totalUsers === 0
                ? 'Belum ada pengguna terdaftar. Dorong onboarding melalui sekolah/komunitas.'
                : 'Aktifkan simulasi berkala, BMKG multi-feed, dan push FCM untuk meningkatkan kesiapsiagaan pengguna aktif.',
            totalChats > 0
                ? 'Interaksi chatbot tinggi. Pertimbangkan materi edukasi otomatis mingguan.'
                : 'Belum ada interaksi chatbot. Kampanyekan fitur tanya jawab darurat.'
        ]
    };
}
