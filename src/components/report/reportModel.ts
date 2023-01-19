import mongoose from 'mongoose';
import {AppConstants} from "../../utils/appConstants";
import {ReportType} from "../../utils/enum";

const reportType = Object.values(ReportType).filter(value => typeof value === 'number')

const reportSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_USER
    },

    reportId: {
        type: mongoose.Schema.Types.ObjectId
    },

    reportType: {
        type: Number,
        enum: reportType
    },

    reportReason: String

}, {
    timestamps: true
})

module.exports = mongoose.model(AppConstants.MODEL_REPORT, reportSchema)