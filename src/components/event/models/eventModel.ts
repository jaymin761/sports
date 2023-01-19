import moment from 'moment';
import mongoose, { Schema } from 'mongoose';
import { AppConstants } from "../../../utils/appConstants";
import { EventStatus, EventTypeVisibility } from "../../../utils/enum";

const eventTypeVisibility = Object.values(EventTypeVisibility).filter(value => typeof value === 'number')
const eventStatus = Object.values(EventStatus).filter(value => typeof value === 'number')

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

const eventSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: AppConstants.MODEL_USER
    },
    inviteId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: AppConstants.MODEL_USER,
        default: null
    },
    name: String,
    description: String,
    image: [String],
    video: String,
    address: addressSchema,
    startDate: Date,
    endDate: Date,
    // startTime: {
    //     type: String,
    // },
    // endTime: {
    //     type: String
    // },
    duration: {
        type: String,
        default: "3 Days"   // In Days
    },
    visibility: { // 0 for private 1 for public
        type: Number,
        enum: eventTypeVisibility,
        default: 1
    },
    status: {
        type: Number,
        enum: eventStatus,
        default: EventStatus.UPCOMING
    },
    cancelledReason: {
        type: String,
        default: null
    },
    isBlockEvent: { // 1 for enable, 0 for disable
        type: Number,
        default: 1
    }
    // ,
    // reportStatus: {
    //     type: Number,
    //     default: 1
    // },   // For ReportedEvent 0 And For UnreportedEvent 1
    // reportReason: {
    //     type: String,
    //     default: null
    // }

}, {
    timestamps: true
})

eventSchema.index({
    "address.location": "2dsphere",
})

module.exports = mongoose.model(AppConstants.MODEL_EVENT, eventSchema)