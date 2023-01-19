import {AppConstants} from "../../../utils/appConstants";

const mongoose_ = require('mongoose');

const locationTraceSchema = new mongoose_.Schema({
    user_id: {
        type: mongoose_.Schema.Types.ObjectId,
        require: true,
        ref: AppConstants.MODEL_USER
    },
    location: {
        address: {
            type: String,
            default: null
        },
        location: {
            type: {
                type: String,
                enum: ['Point']
            },
            coordinates: {
                type: [Number]
            }
        },
    },
    guestId: String,
    distance: {
        type: mongoose_.Schema.Types.Number,
        require: true,
    },
    result: {
        type: mongoose_.Schema.Types.Boolean,
        require: true,
    }

}, {timestamps: true});

module.exports = mongoose_.model(AppConstants.MODEL_LOCATION_TRACE, locationTraceSchema);