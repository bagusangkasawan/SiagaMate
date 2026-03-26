import { Schema, model } from 'mongoose'

const chatInteractionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    answer: { type: String, required: true },
    provider: { type: String, required: true },
    context: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
)

export const ChatInteractionModel = model('ChatInteraction', chatInteractionSchema)

/**
 * Enforce max 5 chat interactions per user.
 * Call after inserting a new chat. Deletes oldest records beyond the limit.
 */
export async function enforceChatLimit(userId: string, maxCount = 5) {
  const count = await ChatInteractionModel.countDocuments({ userId })
  if (count > maxCount) {
    const excess = count - maxCount
    const oldest = await ChatInteractionModel
      .find({ userId })
      .sort({ createdAt: 1 })
      .limit(excess)
      .select('_id')
      .lean()
    await ChatInteractionModel.deleteMany({
      _id: { $in: oldest.map(d => d._id) }
    })
  }
}
