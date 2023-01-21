var constants = require('./modelConstants');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var winSchema = new Schema({
    game_id: {
        type: mongoose.Schema.Types.ObjectId,
        require: false,
        default: null,
    },
    tema_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        default: false
    },
}, {
    collection: constants.winSchema,
    versionKey: false,
    autoIndex: true,
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true }
});

mongoose.model(constants.winSchema, winSchema);