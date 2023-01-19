import mongoose from "mongoose";
import {AppConstants} from "../../../utils/appConstants";

/*const mulAddressSchema = new mongoose.Schema({
    businessName: String,
    businessLocationName: String,
    physicalAddress: String,
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_CATEGORY
    },
    image: String,
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        },
    },
    description: String,
    email: String,
    mobile: String,
    primaryAddress: Boolean
})*/

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    businessName: String,
    businessLocationName: String,
    physicalAddress: String,
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_CATEGORY
    },
    image: String,
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        },
    },
    description: String,
    email: String,
    mobile: String,
    primaryAddress: Boolean
}, {timestamps: true})

addressSchema.index({
    "location": "2dsphere",
})

module.exports = mongoose.model(AppConstants.MODEL_ADDRESS, addressSchema);