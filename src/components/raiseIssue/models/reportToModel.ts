import mongoose, { Schema } from 'mongoose';
import { AppConstants } from "../../../utils/appConstants";
import { ReportToType } from '../../../utils/enum';
const reportToType = Object.values(ReportToType).filter(value => typeof value === 'number');

const reportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: AppConstants.MODEL_USER,
        },
        subject: String,
        message: String,
        reportType: {
            type: Number,
            enum: reportToType,
            require: true,
        },
        files: [Array],
        image: String,
        video: {
            url: String,
            thumbnail: String,
        },
        action: {
            type: Number,
            require: true,
            default: 0
        },
        isReply: { // reply admin to user change flag (isReply: 1)
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model(AppConstants.MODEL_REPORT_TO, reportSchema)