import mongoose from "mongoose";
import { AppConstants } from "../../../utils/appConstants";

const deleteRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_USER },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_BUSINESS },
    reason: {
        type: String,
        require: true
    },
    status: {
        type: Number,
        require: true // user 0, business 1
    },
    isDelete: {
        type: Number, //  1 cancle,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model(AppConstants.MODEL_DELETE_REQUEST, deleteRequestSchema);