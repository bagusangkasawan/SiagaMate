"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFirebase = initFirebase;
exports.sendPushNotification = sendPushNotification;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const env_js_1 = require("../config/env.js");
function getFirebaseCredential() {
    if (env_js_1.env.firebaseServiceAccountJson) {
        const parsed = JSON.parse(env_js_1.env.firebaseServiceAccountJson);
        return firebase_admin_1.default.credential.cert(parsed);
    }
    if (env_js_1.env.firebaseProjectId && env_js_1.env.firebaseClientEmail && env_js_1.env.firebasePrivateKey) {
        return firebase_admin_1.default.credential.cert({
            projectId: env_js_1.env.firebaseProjectId,
            clientEmail: env_js_1.env.firebaseClientEmail,
            privateKey: env_js_1.env.firebasePrivateKey.replace(/\\n/g, '\n')
        });
    }
    return null;
}
function initFirebase() {
    if (firebase_admin_1.default.apps.length > 0)
        return;
    const credential = getFirebaseCredential();
    if (!credential) {
        console.warn('FCM belum aktif: firebase credentials tidak ditemukan di .env');
        return;
    }
    firebase_admin_1.default.initializeApp({ credential });
    console.log('Firebase Admin initialized');
}
async function sendPushNotification({ token, title, body, data }) {
    if (firebase_admin_1.default.apps.length === 0) {
        return { success: false, reason: 'firebase-not-initialized' };
    }
    await firebase_admin_1.default.messaging().send({
        token,
        notification: { title, body },
        data
    });
    return { success: true };
}
