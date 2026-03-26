import axios from 'axios'
import { env } from '../config/env.js'

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const SYSTEM_INSTRUCTION = {
  parts: [
    {
      text: [
        'Anda adalah SiagaMate AI, asisten kesiapsiagaan bencana Indonesia.',
        'Jawab ringkas, jelas, dan berbentuk langkah aksi.',
        'Prioritaskan keselamatan jiwa, evakuasi, dan pertolongan pertama.',
        'Jika informasi tidak pasti, arahkan pengguna ke BMKG, BNPB, BPBD, atau layanan darurat 112.'
      ].join(' ')
    }
  ]
}

function createUserMessage(message: string, context: Record<string, unknown>) {
  return `Konteks:\n${JSON.stringify(context, null, 2)}\n\nPertanyaan pengguna:\n${message}`
}

export async function askGemini(message: string, context: Record<string, unknown>) {
  if (!env.geminiApiKey) {
    return {
      answer:
        'Mode offline aktif. Untuk kondisi darurat: 1) lindungi diri dulu, 2) cek anggota keluarga, 3) evakuasi ke titik aman, 4) pantau BMKG/BPBD, 5) hubungi 112 jika perlu bantuan segera.',
      provider: 'fallback'
    }
  }

  const userMessage = createUserMessage(message, context)
  const response = await axios.post(
    `${GEMINI_ENDPOINT}?key=${env.geminiApiKey}`,
    {
      systemInstruction: SYSTEM_INSTRUCTION,
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ]
    },
    {
      timeout: 12000
    }
  )

  const answer =
    response?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Maaf, saya belum mendapatkan jawaban yang lengkap. Gunakan protokol evakuasi standar.'

  return {
    answer,
    provider: 'gemini'
  }
}
