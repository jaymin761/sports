import mongoose from "mongoose";
import { AppConstants } from "../../../utils/appConstants";
import { Endorsed, Recognise } from "../../../utils/enum";

const recogniseStatus =  Object.values(Recognise).filter(value => typeof value === 'number');

const endorsedSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: AppConstants.MODEL_USER,
    },
    endorsedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: AppConstants.MODEL_USER,
    },
    businessId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: AppConstants.MODEL_BUSINESS,
    },
    endorsedType: Number,
    doYouKnow: {
      type: Number,
      enum: recogniseStatus,
    }
  },{ timestamps: true });

module.exports = mongoose.model(AppConstants.MODEL_ENDORSED, endorsedSchema);