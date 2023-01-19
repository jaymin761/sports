import mongoose from "mongoose";
import {AppConstants} from "../../utils/appConstants";
import {AppStrings} from "../../utils/appStrings";
import {AvailableRequestStatus} from "../../utils/enum";

const availableRequestStatus = Object.values(AvailableRequestStatus).filter(value => typeof value === 'number');

const employeeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    designation: String,
    workHours: {
        startTime: String,
        endTime: String,
    },
    workDays:[String],
    authorized: Number, // default authorized
    available: {
        type: Number,
        default: 1
    }, // 1 for available, 0 for unavailable
    reason: {
        type: String,
        default: null
    },
    businessBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_ADDRESS
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    status: {
        type: Number,
        default: 1 // 1 for pending, 2 for accepted, 3 for rejected
    },
    rejectReason: {
        type: String,
        default: null // if user reject request
    },
    requestStatus: {
        type: Number,
        enum: availableRequestStatus,
        default: AvailableRequestStatus.NONE
    }
}, {timestamps: true})

module.exports = mongoose.model(AppConstants.MODEL_EMPLOYEE, employeeSchema);