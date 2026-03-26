"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatInteractionModel = void 0;
exports.enforceChatLimit = enforceChatLimit;
const mongoose_1 = require("mongoose");
const chatInteractionSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    answer: { type: String, required: true },
    provider: { type: String, required: true },
    context: { type: mongoose_1.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
exports.ChatInteractionModel = (0, mongoose_1.model)('ChatInteraction', chatInteractionSchema);
/**
 * Enforce max 5 chat interactions per user.
 * Call after inserting a new chat. Deletes oldest records beyond the limit.
 */
async function enforceChatLimit(userId, maxCount = 5) {
    const count = await exports.ChatInteractionModel.countDocuments({ userId });
    if (count > maxCount) {
        const excess = count - maxCount;
        const oldest = await exports.ChatInteractionModel
            .find({ userId })
            .sort({ createdAt: 1 })
            .limit(excess)
            .select('_id')
            .lean();
        await exports.ChatInteractionModel.deleteMany({
            _id: { $in: oldest.map(d => d._id) }
        });
    }
}
