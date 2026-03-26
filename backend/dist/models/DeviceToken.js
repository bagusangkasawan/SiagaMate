"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceTokenModel = void 0;
const mongoose_1 = require("mongoose");
const deviceTokenSchema = new mongoose_1.Schema({
    token: { type: String, required: true, unique: true },
    platform: { type: String, default: 'web' },
    userId: { type: String, default: null },
    locationLabel: { type: String, default: null }
}, { timestamps: true });
exports.DeviceTokenModel = (0, mongoose_1.model)('DeviceToken', deviceTokenSchema);
