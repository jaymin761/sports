import mongoose, { Schema } from 'mongoose';
import { AppConstants } from "../../../utils/appConstants";

const blockEvent = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_EVENT
    },
    reportUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_USER
    },
    reason: {
        type: String,
        require: true
    },
    status: {
        type: Number,
        require: true,
        default: 1   // 1 for enable, 0 for disable
    }
}, {
    timestamps: true
})

module.exports = mongoose.model(AppConstants.MODEL_EVENT_BLOCK, blockEvent)