import mongoose from "mongoose";
import {AppConstants} from "../../../utils/appConstants";

const RequestTraceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_USER},
    RequestUserId: { type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_USER},
    requestedTrace : { type: Number, default: 0},
    status: {
        type: Number,
        default: 0  //pending 0, approved 1, rejected 2
    }
}, {timestamps: true});

module.exports = mongoose.model(AppConstants.MODEL_TRACE_REQUEST, RequestTraceSchema);