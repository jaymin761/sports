var constants = require('./modelConstants');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userTokenSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    token: {
        type: String,
        required: true
    },
    deviceId: {
        type: String,
        required: false
    },
    deviceToken: {
        type: String
    },
    deviceType: {
        type: String
    },
}, {
    collection: constants.userTokenSchema,
    versionKey: false,
    autoIndex: true,
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true }
});

mongoose.model(constants.userTokenSchema, userTokenSchema);