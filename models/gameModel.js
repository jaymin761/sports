var constants = require('./modelConstants');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
    name: {
        type: String,
        min: 6,
        max: 255,
        default: null,
    },
    place: {
        type: String,
        default: null,
    },
    team1_id: {
        type: mongoose.Schema.Types.ObjectId,
        require: false,
        default: null,
    },
    team2_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        default: false
    },
    win_expect_id: {
        type: mongoose.Schema.Types.ObjectId,
        require: false,
        default: null,
    },
    win_status: {
        type: Number,
        require: false,
        default: 0,
    },
    sport_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    start_date: {
        type: Date,
        default: null
    },
    deletedStatus: {
        type: Number,
        default: false
    },
}, {
    collection: constants.gameSchema,
    versionKey: false,
    autoIndex: true,
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true }
});

mongoose.model(constants.gameSchema, gameSchema);