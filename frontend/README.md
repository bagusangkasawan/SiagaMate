# SiagaMate AI - Frontend

Frontend aplikasi SiagaMate AI menggunakan **React**, **TypeScript**, **Vite**, dan dikombinasikan dengan **TailwindCSS** untuk desain UI yang menarik (Glassmorphism & Dark Theme). Aplikasi ini juga telah dikonfigurasi sebagai **Progressive Web App (PWA)** sehingga dapat diinstall pada perangkat mobile maupun desktop.

## ✨ Fitur Utama

- **Google Authentication:** Login yang aman dan praktis menggunakan Firebase (Google Provider).
- **Dashboard Informasi BMKG:** Pemantauan gempa bumi terkini dan peringatan dini cuaca secara interaktif melalui data live BMKG.
- **Peta Risiko Interaktif:** Kalkulator risiko bencana (banjir, gempa) berdasakan geolokasi (terintegrasi dengan Peta Leaflet/OpenStreetMap).
- **Chatbot Asisten Pertolongan Pertama:** Terhubung langsung dengan *Google Gemini AI* yang memiliki panduan khusus bencana dan pertolongan pertama (Dibatasi 5 interaksi per user untuk memori yang efisien).
- **Assessment Kesiapsiagaan:** Kuis pengukuran tingkat kesiapan pengguna terhadap bencana gempa dan banjir yang skornya akan disimpan ke profil dan selalu bisa dilihat kapan saja.
- **Push Notification (FCM):** Menerima peringatan darurat secara realtime (memanfaatkan Firebase Cloud Messaging).
- **Personalisasi User:** Menyimpan preferensi, riwayat assessment, riwayat chat, dan *risk profile* di MongoDB yang aman dan privat.

## 🚀 Menjalankan Aplikasi Development

1. Install seluruh *dependencies*:
   ```bash
   pnpm install
   ```

2. Konfigurasi Environment. Duplikat `.env.example` menjadi `.env` dan tambahkan kredensial web Firebase Anda:
   ```env
   VITE_API_BASE_URL=http://localhost:4000/api
   VITE_FCM_VAPID_KEY=...
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. Menjalankan server development:
   ```bash
   pnpm dev
   ```

4. Build untuk Production:
   ```bash
   pnpm build
   ```

Aplikasi akan berjalan di `http://localhost:5173`. Pastikan backend API (di port `4000`) juga sedang berjalan!
