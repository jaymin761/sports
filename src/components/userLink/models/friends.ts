import mongoose from "mongoose";
import {AppConstants} from "../../../utils/appConstants";
import { FriendStatus } from "../../../utils/enum";

const friendStatus = Object.values(FriendStatus).filter(value => typeof value === 'number');

const friendsSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_USER},
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_USER},
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: AppConstants.MODEL_BUSINESS},
    link: String,
    status: {
      type: Number,
      enums: friendStatus
    },
}, {timestamps: true});

module.exports = mongoose.model(AppConstants.MODEL_FRIENDS, friendsSchema);