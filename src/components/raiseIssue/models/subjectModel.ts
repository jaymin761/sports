import mongoose, { Schema } from 'mongoose';
import { AppConstants } from "../../../utils/appConstants";
import { ReportToType } from '../../../utils/enum';
const reportToType = Object.values(ReportToType).filter(value => typeof value === 'number');

const reportSchema = new mongoose.Schema(
    {
        subject: String,        
        reportType: {
            type: Number,
            enum: reportToType,
            require: true,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model(AppConstants.MODEL_REPORT_SUBJECT, reportSchema)