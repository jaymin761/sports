import mongoose, { Schema } from 'mongoose';
import { AppConstants } from "../../../utils/appConstants";

const likeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_USER
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_POST
    },
}, { timestamps: true })

module.exports = mongoose.model(AppConstants.MODEL_LIKE, likeSchema)