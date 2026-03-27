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

export async function askGemini(message: string, context: Record<string, unknown>) {
  if (!env.geminiApiKey) {
    return {
      answer:
        'Mode offline aktif. Untuk kondisi darurat: 1) lindungi diri dulu, 2) cek anggota keluarga, 3) evakuasi ke titik aman, 4) pantau BMKG/BPBD, 5) hubungi 112 jika perlu bantuan segera.',
      provider: 'fallback'
    }
  }

  const optimizedContext = JSON.parse(JSON.stringify(context))
  if (
    optimizedContext.risk?.bmkgData?.weatherForecast?.forecast &&
    Array.isArray(optimizedContext.risk.bmkgData.weatherForecast.forecast)
  ) {
    optimizedContext.risk.bmkgData.weatherForecast.forecast =
      optimizedContext.risk.bmkgData.weatherForecast.forecast.slice(0, 3)
  }

  const contextString = `\n\nKonteks Pengguna & Riwayat Chat:\n${JSON.stringify(optimizedContext, null, 2)}`
  const dynamicSystemInstruction = {
    parts: [
      { text: SYSTEM_INSTRUCTION.parts[0].text + contextString }
    ]
  }

  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${env.geminiApiKey}`,
      {
        systemInstruction: dynamicSystemInstruction,
        contents: [
          {
            role: 'user',
            parts: [{ text: message }]
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
  } catch (error) {
    console.error('Gemini API Error:', error instanceof Error ? error.message : error)
    return {
      answer:
        'Maaf, layanan AI sedang sibuk atau mengalami gangguan sementara. Harap tetap tenang, pantau informasi dari BMKG/BPBD, dan hubungi 112 jika dalam kondisi darurat.',
      provider: 'fallback'
    }
  }
}
