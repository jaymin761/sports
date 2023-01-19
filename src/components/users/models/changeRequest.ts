import mongoose from "mongoose";
import {AppConstants} from "../../../utils/appConstants";

const changeRequestSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_USER},
    businessId: {type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_BUSINESS, required: false},
    mobile: {
        type: String,
        require: false,
    }, 
    optionalMobile: {
        type: String,
        require: false,
    }, 
    email: {
        type: String,
        require: false,
        unique: false,
        lowercase: true,
        trim: true,
    }, 
    name: {
        type: String,
        require: false,
        unique: false,
        lowercase: true,
    },
    type: { // TODO: mobile for 2 and email for 1
        type: Number,
        require: true,
    },
    otp: {
        type: Number
    },
    mobileType:{
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: AppConstants.TOKEN_EXPIRY_TIME
    },
}, {timestamps: true});

module.exports = mongoose.model(AppConstants.MODEL_CHANGE_REQUEST, changeRequestSchema);