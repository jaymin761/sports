import mongoose from "mongoose";
import { AppConstants } from "../../../utils/appConstants";

const mongoose_ = require('mongoose');

const trustSchema = new mongoose_.Schema({
    name:{
        type: String,
        required: true,
    },
    image:{
        type: Number,
        required: true,
    },
    idNumber:{
        type: Number,
        required: true,
    },
    reference:{
        type: Number,
        required: true,
    },
    homeAddress:{
        type: Number,
        required: true,
    },
    combine:{
        type: Number,
        required: true,
    },
    star:{
        type: Number,
        required: false,
        default: 0,
    },
    message:{
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        require: false,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose_.model(AppConstants.MODEL_TRUST, trustSchema);