import { Schema, model } from 'mongoose'

const notificationLogSchema = new Schema(
  {
    userId: { type: String, default: null, index: true },
    title: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    message: { type: String, required: true },
    category: { type: String, required: true },
    action: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
)

export const NotificationLogModel = model('NotificationLog', notificationLogSchema)
