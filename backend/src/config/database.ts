import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDatabase(): Promise<void> {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI belum diisi di .env')
  }

  await mongoose.connect(env.mongoUri)
  console.log('MongoDB connected')
}
