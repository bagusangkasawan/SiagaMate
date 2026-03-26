import { Schema, model } from 'mongoose'

const assessmentResultSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    earthquakeReadiness: { type: Number, required: true },
    floodReadiness: { type: Number, required: true },
    overallReadiness: { type: Number, required: true },
    recommendations: { type: [String], default: [] },
    answers: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
)

export const AssessmentResultModel = model('AssessmentResult', assessmentResultSchema)
