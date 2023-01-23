var constants = require('./modelConstants');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    mobile: {
        type: String,
        require: false,
    },
    password: {
        type: String,
        default: null
    },
    isVerify: {
        type: Number,
        require: false,
        default: 0,
    },
    deviceToken: {
        type: String,
        require: false,
    },
    deviceType: {
        type: Number,
        default: 1,
    },
    userStatus: {
        type: Number,
        default:1
    },
}, {
    collection: constants.userSchema,
    versionKey: false,
    autoIndex: true,
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true }
});

mongoose.model(constants.userSchema, userSchema);