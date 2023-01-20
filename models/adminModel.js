var constants = require('./modelConstants');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var adminSchema = new Schema({
    firstName: {
        type: String,
        default: null
    },
    lastName: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null
    },
    contactNo: {
        type: Number,
        default: null
    },
    password: {
        type: String,
        default: null
    },
    isMaster: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: null
    },
    forgotPasswordToken: {
        type: String,
        default: null
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        default: null
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        default: null
    }
}, {
    collection: constants.adminSchema,
    versionKey: false,
    autoIndex: true,
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true }
});

mongoose.model(constants.adminSchema, adminSchema);