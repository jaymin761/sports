import mongoose from "mongoose";
import {AppConstants} from "../../../utils/appConstants";

const traceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_USER},
    traceUserId: { type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_USER},
    status: {
        type: Number,
        default: 0  //pending 0, approved 1, rejected 2
    }
}, {timestamps: true});

module.exports = mongoose.model(AppConstants.MODEL_TRACE, traceSchema);