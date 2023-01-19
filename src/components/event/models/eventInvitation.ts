import mongoose, { Schema } from 'mongoose';
import { AppConstants } from "../../../utils/appConstants";

const eventInvitation = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_USER
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_EVENT
    },
    invitedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_USER
    },
    status: {
        type: Number,
        require: true,
        default: 0   // 0 for invited( Pending ), 1 for Accpted, 2 for rejected
    }
}, {
    timestamps: true
})

module.exports = mongoose.model(AppConstants.MODEL_EVENT_INVITATION, eventInvitation)