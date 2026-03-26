"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function getEnv(key, fallback = '') {
    return process.env[key] || fallback;
}
exports.env = {
    port: Number.parseInt(getEnv('PORT'), 10),
    frontendOrigin: getEnv('FRONTEND_ORIGIN', 'http://localhost:5173'),
    mongoUri: getEnv('MONGO_URI'),
    geminiApiKey: getEnv('GEMINI_API_KEY'),
    bmkgEarthquakeFeed: getEnv('BMKG_EARTHQUAKE_FEED', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'),
    bmkgFeltEarthquakeFeed: getEnv('BMKG_FELT_EARTHQUAKE_FEED', 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json'),
    bmkgRecentEarthquakeFeed: getEnv('BMKG_RECENT_EARTHQUAKE_FEED', 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json'),
    bmkgWeatherWarningFeed: getEnv('BMKG_WEATHER_WARNING_FEED', 'https://data.bmkg.go.id/DataMKG/MEWS/DiniHari_Indonesia.xml'),
    firebaseProjectId: getEnv('FIREBASE_PROJECT_ID'),
    firebaseClientEmail: getEnv('FIREBASE_CLIENT_EMAIL'),
    firebasePrivateKey: getEnv('FIREBASE_PRIVATE_KEY'),
    bmkgWeatherForecastFeed: getEnv('BMKG_WEATHER_FORECAST_FEED', 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/DigitalForecast-Indonesia.xml'),
    bnpbDisasterApi: getEnv('BNPB_DISASTER_API', 'https://data.bnpb.go.id/api/v1/disasters'),
    firebaseServiceAccountJson: getEnv('FIREBASE_SERVICE_ACCOUNT_JSON')
};
