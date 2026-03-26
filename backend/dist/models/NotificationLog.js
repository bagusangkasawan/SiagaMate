"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationLogModel = void 0;
const mongoose_1 = require("mongoose");
const notificationLogSchema = new mongoose_1.Schema({
    userId: { type: String, default: null, index: true },
    title: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    message: { type: String, required: true },
    category: { type: String, required: true },
    action: { type: String, required: true },
    payload: { type: mongoose_1.Schema.Types.Mixed, default: null }
}, { timestamps: true });
exports.NotificationLogModel = (0, mongoose_1.model)('NotificationLog', notificationLogSchema);
