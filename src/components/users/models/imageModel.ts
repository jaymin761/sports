import mongoose from "mongoose";
import { AppConstants } from "../../../utils/appConstants";

const mongoose_ = require('mongoose');

const ImageSchema = new mongoose_.Schema({
    image: {
        type: String,
        require: false,
    },
    type: Number // 1 for images, 2 for file, 3 for video, 4 audio
}, { timestamps: true });

module.exports = mongoose_.model(AppConstants.MODEL_IMAGE, ImageSchema);