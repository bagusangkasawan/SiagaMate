import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import apiRoutes from './routes/apiRoutes.js'
import { connectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { initFirebase } from './services/fcmService.js'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import hpp from 'hpp'

const app = express()

app.use(
  cors({
    origin(requestOrigin, callback) {
      // Allow requests with no origin (curl, server-to-server)
      if (!requestOrigin) return callback(null, true)
      // Allow the configured origin + common dev ports
      const allowed = [
        env.frontendOrigin,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:4173',
      ]
      if (allowed.includes(requestOrigin)) return callback(null, true)
      callback(null, false)
    }
  })
)

// 1. Security HTTP Headers
app.use(helmet())

// 2. Rate Limiting (100 request per 15 menit per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Terlalu banyak request dari IP Anda, coba lagi dalam 15 menit.' }
})
app.use('/api', limiter)

// 3. Body Parser config (limit 10kb)
app.use(express.json({ limit: '10kb' }))

// 4. Prevent HTTP Parameter Pollution
app.use(hpp())

app.use('/api', apiRoutes)

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode =
    typeof error === 'object' && error && 'status' in error
      ? Number((error as { status?: number }).status) || 500
      : 500

  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as Error).message) + (error instanceof Error ? `\nStack: ${error.stack}` : '')
      : 'Terjadi kesalahan internal server'

  console.error('[Global Error Handler]', error)
  res.status(statusCode).json({ error: message })
})

async function bootstrap() {
  await connectDatabase()
  initFirebase()

  app.listen(env.port, () => {
    console.log(`SiagaMate API berjalan di http://localhost:${env.port}`)
  })
}

void bootstrap()
