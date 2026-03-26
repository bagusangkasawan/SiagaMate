import { useState, useEffect } from 'react'
import type { AssessmentQuestion, AssessmentResult } from '../types'
import { API_BASE, authFetch } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export default function SimulationPage() {
  const { idToken, user } = useAuth()
  const [started, setStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [motivationMessage, setMotivationMessage] = useState('')
  const [hasSavedResult, setHasSavedResult] = useState(false)

  // Load last assessment result from backend on mount
  useEffect(() => {
    if (!user || !idToken) return

    async function loadSavedResult() {
      try {
        const res = await authFetch(`${API_BASE}/assessment/result`, {}, idToken)
        if (res.ok) {
          const data = await res.json()
          if (data.result) {
            setResult(data.result)
            setMotivationMessage(getMotivationalMessage(data.result.overallReadiness))
            setHasSavedResult(true)
          }
        }
      } catch (err) {
        console.error('Failed to load assessment result:', err)
      }
    }

    void loadSavedResult()
  }, [user, idToken])

  useEffect(() => {
    if (started && questions.length === 0) {
      fetchQuestions()
    }
  }, [started, questions.length])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/assessment/questions`)
      const data = await response.json()
      setQuestions(data.questions)
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    setStarted(true)
    setCurrentQuestion(0)
    setAnswers({})
    setResult(null)
    setHasSavedResult(false)
  }

  const handleAnswer = async (points: number) => {
    const question = questions[currentQuestion]
    const newAnswers = { ...answers, [question.id]: points }
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Quiz finished, calculate result
      await submitAssessment(newAnswers)
    }
  }

  const submitAssessment = async (finalAnswers: Record<string, number>) => {
    try {
      setLoading(true)
      const response = await authFetch(`${API_BASE}/assessment/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers })
      }, idToken)
      const data = await response.json()
      setResult(data)
      setMotivationMessage(getMotivationalMessage(data.overallReadiness))
    } catch (error) {
      console.error('Failed to calculate assessment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = () => {
    setStarted(false)
    setCurrentQuestion(0)
    setAnswers({})
    setResult(null)
    setQuestions([])
    setHasSavedResult(false)
  }

  function getMotivationalMessage(score: number): string {
    if (score >= 90) return '🌟 Anda adalah rela siaga bencana! Terus jaga kesiapan ini.'
    if (score >= 80) return '✅ Sangat baik! Beberapa hal kecil masih bisa ditingkatkan.'
    if (score >= 70) return '👍 Cukup baik. Terus belajar dan berlatih.'
    if (score >= 60) return '⚠️ Perlu lebih banyak persiapan. Jangan tunda lagi!'
    if (score >= 40) return '🔴 Kesiapan masih rendah. Mulai persiapan sekarang!'
    return '🚨 Sangat kritis! Butuh bantuan profesional dari BNPB Terdekat.'
  }

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Show saved result if user is logged in and has one
  if (!started && hasSavedResult && result) {
    return (
      <section className="min-h-screen pt-24 pb-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">Hasil Assessment Terakhir</p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Tingkat Kesiapsiagaan Anda</h1>
          </div>

          <div className="mt-12 space-y-6">
            {/* Overall Score */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <div className="mb-4 text-6xl font-bold text-violet-400">{result.overallReadiness}%</div>
              <p className="text-lg font-semibold text-white mb-2">Kesiapan Keseluruhan</p>
              <p className="text-sm text-slate-400">{motivationMessage}</p>
            </div>

            {/* Detailed Scores */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">🏚️ Kesiapan Gempa Bumi</h3>
                <div className="mb-4">
                  <div className="mb-2 flex items-end justify-between">
                    <span className="text-3xl font-bold text-orange-400">{result.earthquakeReadiness}%</span>
                    <span className="text-xs text-slate-500">dari 100</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500" style={{ width: `${result.earthquakeReadiness}%` }} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">🌊 Kesiapan Banjir</h3>
                <div className="mb-4">
                  <div className="mb-2 flex items-end justify-between">
                    <span className="text-3xl font-bold text-blue-400">{result.floodReadiness}%</span>
                    <span className="text-xs text-slate-500">dari 100</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500" style={{ width: `${result.floodReadiness}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
                <h3 className="mb-6 text-xl font-semibold text-white">💡 Rekomendasi untuk Anda</h3>
                <div className="space-y-4">
                  {result.recommendations.map((rec, idx) => (
                    <div key={idx} className="rounded-lg border-l-2 border-amber-500/50 bg-amber-500/5 px-4 py-3 text-sm text-slate-300">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={handleStart}
                className="cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
              >
                🔄 Uji Ulang Kesiapsiagaan
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!started) {
    return (
      <section className="min-h-screen pt-24 pb-20">
        <div className="mx-auto max-w-2xl px-6">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">Kesiapsiagaan</p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Uji Kesiapan Bencana Anda</h1>
            <p className="mx-auto mt-4 max-w-lg text-sm text-slate-400">
              Ikuti kuis interaktif ini untuk mengetahui seberapa siap Anda menghadapi bencana alam seperti gempa bumi
              dan banjir.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-white/5 bg-white/[0.02] p-8">
            <div className="space-y-6 text-center">
              <div className="text-5xl">🎮</div>
              <h2 className="text-xl font-semibold text-white">Siap Diuji Kesiapsiagaanmu?</h2>
              <p className="text-sm text-slate-400">
                Jawab 12 pertanyaan untuk mendapatkan analisis mendalam tentang tingkat kesiapan Anda terhadap bencana
                gempa bumi dan banjir.
              </p>

              <div className="space-y-3 pt-6">
                <div className="flex items-center gap-3 text-left text-sm text-slate-300">
                  <span className="text-lg">✅</span> Penilaian otomatis dan objektif
                </div>
                <div className="flex items-center gap-3 text-left text-sm text-slate-300">
                  <span className="text-lg">💡</span> Rekomendasi personal untuk meningkatkan kesiapan
                </div>
                <div className="flex items-center gap-3 text-left text-sm text-slate-300">
                  <span className="text-lg">🎯</span> Dampak langsung untuk keselamatan Anda
                </div>
                {user && (
                  <div className="flex items-center gap-3 text-left text-sm text-emerald-300">
                    <span className="text-lg">💾</span> Hasil tersimpan otomatis di akun Anda
                  </div>
                )}
              </div>

              <button
                onClick={handleStart}
                className="mt-8 cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
              >
                🚀 Mulai Kuis Sekarang
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (result) {
    return (
      <section className="min-h-screen pt-24 pb-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">Hasil Assessment</p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Tingkat Kesiapsiagaan Anda</h1>
          </div>

          <div className="mt-12 space-y-6">
            {/* Overall Score */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <div className="mb-4 text-6xl font-bold text-violet-400">{result.overallReadiness}%</div>
              <p className="text-lg font-semibold text-white mb-2">Kesiapan Keseluruhan</p>
              <p className="text-sm text-slate-400">{motivationMessage}</p>
              {user && (
                <p className="mt-2 text-xs text-emerald-400">💾 Hasil tersimpan di akun Anda</p>
              )}
            </div>

            {/* Detailed Scores */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Earthquake */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">🏚️ Kesiapan Gempa Bumi</h3>
                <div className="mb-4">
                  <div className="mb-2 flex items-end justify-between">
                    <span className="text-3xl font-bold text-orange-400">{result.earthquakeReadiness}%</span>
                    <span className="text-xs text-slate-500">dari 100</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                      style={{ width: `${result.earthquakeReadiness}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  {result.earthquakeReadiness >= 80
                    ? 'Sangat siap menghadapi gempa'
                    : result.earthquakeReadiness >= 60
                      ? 'Cukup siap, perlu ditingkatkan'
                      : 'Perlu persiapan lebih matang'}
                </p>
              </div>

              {/* Flood */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">🌊 Kesiapan Banjir</h3>
                <div className="mb-4">
                  <div className="mb-2 flex items-end justify-between">
                    <span className="text-3xl font-bold text-blue-400">{result.floodReadiness}%</span>
                    <span className="text-xs text-slate-500">dari 100</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${result.floodReadiness}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  {result.floodReadiness >= 80
                    ? 'Sangat siap menghadapi banjir'
                    : result.floodReadiness >= 60
                      ? 'Cukup siap, perlu ditingkatkan'
                      : 'Perlu persiapan lebih matang'}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
              <h3 className="mb-6 text-xl font-semibold text-white">💡 Rekomendasi untuk Anda</h3>
              <div className="space-y-4">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="rounded-lg border-l-2 border-amber-500/50 bg-amber-500/5 px-4 py-3 text-sm text-slate-300">
                    {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={handleRestart}
                className="cursor-pointer rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/5"
              >
                ↺ Uji Ulang
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
              >
                🏠 Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (loading || questions.length === 0) {
    return (
      <section className="min-h-screen pt-24 pb-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="text-slate-400">Memuat pertanyaan...</p>
        </div>
      </section>
    )
  }

  // Quiz Display
  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <section className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-2xl px-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Pertanyaan {currentQuestion + 1} dari {questions.length}</span>
            <span className="text-xs font-semibold text-violet-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
          {/* Category Badge */}
          <div className="mb-6 flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium uppercase ${
                question.category === 'earthquake'
                  ? 'bg-orange-500/20 text-orange-300'
                  : question.category === 'flood'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-violet-500/20 text-violet-300'
              }`}
            >
              {question.category === 'earthquake'
                ? '🏚️ Gempa'
                : question.category === 'flood'
                  ? '🌊 Banjir'
                  : '📋 Umum'}
            </span>
          </div>

          {/* Question */}
          <h2 className="mb-8 text-2xl font-bold text-white">{question.question}</h2>

          {/* Options */}
          <div className="space-y-3">
            {shuffleArray(question.options).map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option.points)}
                disabled={loading}
                className="group w-full cursor-pointer rounded-lg border border-white/10 bg-white/[0.02] p-4 text-left transition-all hover:border-violet-500/50 hover:bg-violet-500/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-slate-300 group-hover:text-white">{option.text}</span>
                  <div className="mt-0.5 h-5 w-5 rounded-full border-2 border-slate-600 group-hover:border-violet-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Skip/Back Info */}
        <p className="mt-6 text-center text-xs text-slate-500">
          ✨ Jawab dengan jujur untuk mendapat hasil assessment terbaik
        </p>
      </div>
    </section>
  )
}
