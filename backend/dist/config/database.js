"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("./env.js");
async function connectDatabase() {
    if (!env_js_1.env.mongoUri) {
        throw new Error('MONGO_URI belum diisi di .env');
    }
    await mongoose_1.default.connect(env_js_1.env.mongoUri);
    console.log('MongoDB connected');
}
