"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskPredictionModel = void 0;
const mongoose_1 = require("mongoose");
const riskPredictionSchema = new mongoose_1.Schema({
    userId: { type: String, default: null, index: true },
    disasterType: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], required: true },
    riskDescription: { type: String, required: true },
    bmkgData: {
        earthquake: {
            magnitude: String,
            region: String,
            potential: String,
            depth: String,
            dateTime: String,
            source: String
        },
        weatherWarning: {
            summary: String,
            source: String
        }
    },
    firstAidChecklist: { type: [String], default: [] },
    generatedAt: { type: Date, default: Date.now },
    dataSource: { type: String, default: 'BMKG' },
    transparency: { type: String, default: 'Risk level berdasarkan data resmi BMKG tanpa prediksi heuristic' }
}, { timestamps: true });
exports.RiskPredictionModel = (0, mongoose_1.model)('RiskPrediction', riskPredictionSchema);
