import mongoose from "mongoose";
import {AppConstants} from "../../../utils/appConstants";

const contactCardSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_USER},
    name:String,
    image:String,
    mobile:String,
    email:String,
    linkedWith:{ type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_USER},
}, {timestamps: true});

module.exports = mongoose.model(AppConstants.MODEL_CONTACT, contactCardSchema);