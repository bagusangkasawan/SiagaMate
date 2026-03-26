"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentResultModel = void 0;
const mongoose_1 = require("mongoose");
const assessmentResultSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    earthquakeReadiness: { type: Number, required: true },
    floodReadiness: { type: Number, required: true },
    overallReadiness: { type: Number, required: true },
    recommendations: { type: [String], default: [] },
    answers: { type: mongoose_1.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
exports.AssessmentResultModel = (0, mongoose_1.model)('AssessmentResult', assessmentResultSchema);
