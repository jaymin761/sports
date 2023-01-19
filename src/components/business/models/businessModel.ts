import mongoose from "mongoose";
import {AppConstants} from "../../../utils/appConstants";
import {Device, Recognise, TrustStatus} from "../../../utils/enum"

const trustStatus = Object.values(TrustStatus).filter(value => typeof value === 'number');
const deviceType = Object.values(Device).filter(value => typeof value === 'number');
const recognise = Object.values(Recognise).filter(value => typeof value === 'number');


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
}, {_id: false})

const contactSchema = new mongoose.Schema({
    name: String,
    image: String,
    id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_USER
    }
}, {_id: false})

const permissionSchema = new mongoose.Schema({
    location: {
        whileUsingApp: {
            type: Boolean,
            default: false
        },
        withLinkedContact: {
            type: Boolean,
            default: false
        },
        withPublic: {
            type: Boolean,
            default: true
        },
        notShared: {
            type: Boolean,
            default: false
        }
    },
    visibility: {
        picture: {
            type: Boolean,
            default: true
        },

        status: {
            type: Boolean,
            default: true
        },
        post: {
            type: Boolean,
            default: true
        },
    },
    acceptMessage: {
        public: {
            type: Boolean,
            default: true
        },
        contact: {
            type: Boolean,
            default: true
        },
        marketing: {
            type: Boolean,
            default: true
        },
    },
}, {_id: false})

const reference = new mongoose.Schema({
    name: String,
    email: String,
    mobile: String,
    id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_USER
    },
    isEndorsed: {
        type: Number,
        enum: recognise
    } // 0 and 1
}, {_id: false})

const advertisementSchema = new mongoose.Schema({
    message: String,
    video: String,
    image: String,
    audio: String
}, {_id: false})

const businessSchema = new mongoose.Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: AppConstants.MODEL_USER
        },
        name: String,
        image: String,
        businessCategory: {
            type: mongoose.Schema.Types.ObjectId,
        },
        mobile: {
            type: String,
            require: false,
        },
        email: String,
        // address: addressSchema,
        bio: String,
        businessStatus: String,
        optionalMobile: {
            secondary: String,
            alternative: String
        },
        document: {
            registrationNumber: String,
            image: String,
            secondaryNumber: String,
            address: addressSchema,
            idVerifyByAdmin: Boolean, //admin update
            imageVerifyByAdmin: Boolean, //admin update,
            country: String,
            docType: Number,
        },
        permissions: permissionSchema,
        reference: [reference],
        advertisement: advertisementSchema,
        averageRating: {
            stars: {
                type: Number,
                default: 0,
            },
            commentCount: {
                type: Number,
                default: 0,
            },
        },
        trustLevelCount: Number,
        isProfileComplete: {
            type: Number,
            default: 0,
            required: false,
        },
        isMobileVerified: {
            type: Number,
            default: 0,
            required: false,
        },
        isEmailVerified: {
            type: Number,
            default: 0,
            required: false,
        },
        rejectReason:{
            type: String,
            default: null,
            required: false
        },
        limitedEmployee : {
            type: Number,
            default: 10
        },
        chatPermissions:[Number],
        isApprove: Number, // 0 for pending, 1 for approve, 2 for rejected
        designation:{
            type: String,
            required: true
        },
        workHours: {
            startTime: Date,
            endTime: Date
        },
        isDeleted: {
            type: Number,
            default: 0
        }
    },
    {timestamps: true}
);

businessSchema.index({
    "address.location": "2dsphere",
    "document.homeAddress.location": "2dsphere"
})

module.exports = mongoose.model(AppConstants.MODEL_BUSINESS, businessSchema);