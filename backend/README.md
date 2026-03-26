# SiagaMate AI - Backend

Backend API untuk aplikasi SiagaMate AI dibangun menggunakan **Node.js**, **Express**, **TypeScript**, dengan database **MongoDB** (Mongoose). Backend bertanggub jawab menghimpun data secara realtime dari **BMKG**, mensinkronisasikan AI model **Google Gemini**, mengatur **Firebase Auth** untuk personalisasi pengguna, serta mengirim **Push Notification (FCM)**.

## ✨ Fitur & Integrasi Utama

- **TypeScript Runtime:** Menggunakan setup modern dengan TypeScript.
- **MongoDB Database:** Penyimpanan terpusat untuk profil user, log chat bot (batas 5 chat per user), device tokens (PWA fcm), log notifikasi, riwayat prediksi risiko, hingga skor hasil *assessment*.
- **Firebase Authentication Middleware:** Memverifikasi ID Token dari pengguna frontend, mengamankan rute personalisasi API.
- **Google Gemini AI API:** Layanan inti asisten chatbot (*SiagaMate AI*) untuk menjawab konsultasi mitigasi dan logistik bencana.
- **Data Integrasi BMKG:** Pengambilan *multi-feed* (Auto-gempa terkini, Peringatan cuaca) tanpa membebani browser pengguna (*Server-Side Fetching & Caching Proxy*).
- **Firebase Cloud Messaging (FCM):** Server backend menghantarkan push notification otomatis saat deteksi tingkat bahaya tinggi (high severity).

## 🚏 Ringkasan Endpoints API

Semua rute disajikan di bawah `http://localhost:4000/api`

### 🔒 Authenticaton (Butuh Header: `Authorization: Bearer <ID-Token>`)
- `POST /auth/login` : Proses sinkronisasi token Google ke DB MongoDB (Upsert User).
- `GET /auth/me` : Load data profil, assessment terakhir, & riwayat risk prediksi terakhir.
- `PUT /auth/profile` : Mengubah profil user (nama, jenis bahaya fokus).
- `GET /chat/history` : Memuat maksimal 5 riwayat percakapan chatbot terakhir.
- `POST /chat` : Kirim pesan ke bot Gemini (membutuhkan context profile).
- `GET /assessment/result` : Mengkueri skor *assessment* simulasi terakhir yang tersimpan.

### 🌐 Public / Optional Auth (Bisa Anonimous)
- `GET /bmkg/feeds` : Ringkasan feed dari JSON BMKG BMKG.
- `GET /alerts` : Analisis data dan return peringatan jika di zona rawan. (Akan trigger FCM jika alert tinggi).
- `GET /geocode/search` : Melakukan pencarian Query Geocoding koordinat manual (Nominatim OSM).
- `POST /notifications/register-token` : Menerima *fcm push token* dari client device.
- `GET /risk` : Prediksi / rekomendasi tingkat risiko berdasarkan input titik Long/Lat (optional auth, jika login akan otomatis disimpan secara historis).
- `POST /assessment/calculate` : Endpoint kalkulasi hasil assesment (optional auth, bila login akan di save ke database).

## 🚀 Menjalankan Server API Development

1. Install *dependencies*:
   ```bash
   pnpm install
   ```

2. Konfigurasi Environment. Salin `.env.example` ke `.env` kemudian isi sesuai kebutuhan:
   ```env
   # Basic setup
   PORT=4000
   FRONTEND_ORIGIN=http://localhost:5173
   
   # Setup Database API Keys
   MONGO_URI=mongodb+srv://...
   GEMINI_API_KEY=...
   
   # Opsional: Jika FCM Push Notification dibutuhkan (dari JSON Firebase Service Account):
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY=...
   ```

3. Jalankan command *Dev Server*:
   ```bash
   pnpm dev
   ```

Server akan menjalankan kompilasi TypeScript secara realtime dan mulai listen di port yang telah didefinisikan (ex: `:4000`).
