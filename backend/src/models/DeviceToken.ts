import { Schema, model } from 'mongoose'

const deviceTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    platform: { type: String, default: 'web' },
    userId: { type: String, default: null },
    locationLabel: { type: String, default: null }
  },
  { timestamps: true }
)

export const DeviceTokenModel = model('DeviceToken', deviceTokenSchema)
