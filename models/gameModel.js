var constants = require('./modelConstants');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
    name: {
        type: String,
        require: true,
        min: 6,
        max: 255
    },
    place: {
        type: String,
        require: true,
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
    sport_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        default: false
    },
    start_date: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        default: false
    },
    end_date: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        default: false
    },    
    win_status: {
        type: Number,
        required: true,
        default: false
    },
    deletedStatus: {
        type: Number,
        required: true,
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