"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '' },
    name: { type: String, required: true },
    photoURL: { type: String, default: '' },
    locationLabel: { type: String, default: 'Jakarta Selatan' },
    lat: { type: Number, default: -6.2615 },
    lng: { type: Number, default: 106.8106 },
    profile: { type: String, enum: ['warga', 'petugas'], default: 'warga' },
    disasterType: { type: String, default: 'banjir' },
    adminLevel4Code: { type: String, default: '' }
}, { timestamps: true });
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
