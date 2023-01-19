import mongoose, { Schema } from 'mongoose';
import { AppConstants } from "../../../utils/appConstants";

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_USER
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_POST
    },
    comment: {
        type: String,
        require: true
    },
    isDeleteAdmin: {  // if admin remove this comment flag is : 1
        type: Number,
        default: 0
    }
}, { timestamps: true })

module.exports = mongoose.model(AppConstants.MODEL_COMMENT, commentSchema)