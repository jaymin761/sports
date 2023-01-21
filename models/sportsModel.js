var constants = require('./modelConstants');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sportSchema = new Schema({
    name: {
        type: String,
        require: true,
        min: 6,
        max: 255
    },
    icon: {
        type: String,
        require: true,
    },
    status: {
        type: Number,
        require: false,
        default: 0,
    },
    deletedStatus: {
        type: Number,
        required: true,
        default: false
    },
}, {
    collection: constants.sportSchema,
    versionKey: false,
    autoIndex: true,
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true }
});

mongoose.model(constants.sportSchema, sportSchema);