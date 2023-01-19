import mongoose, { Schema } from 'mongoose';
import { AppConstants } from "../../../utils/appConstants";
import { SocialsTypeVisibility } from "../../../utils/enum";

const socialsTypeVisibility = Object.values(SocialsTypeVisibility).filter(value => typeof value === 'number')

const addressSchema = new mongoose.Schema({
    name: String,
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        },
    },
}, { _id: false })

const socialsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_USER
    },
    visibility: { // 1 for private 0 for public
        type: Number,
        enum: socialsTypeVisibility,
        default: 0
    },
    description: {
        type: String,
        require: true
    },
    image: {
        type: String,
        default: null
    },
    video: {
        type: String,
        default: null
    },
    thumbnail: {
        type: String,
        default: null
    },
    address: addressSchema,
    status: {
        type: Number,
        default: 1 // 1 FOR ACTIVE 0 FOR INACTIVE
    },
    isBlockPost: {  // 1 for enable, 0 for disable
        type: Number,
        default: 1
    },
    isDelete: {
        type: Number,
        default: 0 // if post is delete = isDelete: 1
    }
}, {
    timestamps: true
})

socialsSchema.index({
    "address.location": "2dsphere",
})

module.exports = mongoose.model(AppConstants.MODEL_POST, socialsSchema)