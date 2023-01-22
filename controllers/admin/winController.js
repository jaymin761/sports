var mongoose = require('mongoose');
const multer = require('multer');
var constants = require('../../models/modelConstants');
var gameModel = mongoose.model(constants.gameSchema);
var teamModel = mongoose.model(constants.teamSchema);
var sportModel = mongoose.model(constants.sportSchema);
var winModel = mongoose.model(constants.winSchema);
const path = require('path');
const md5 = require('md5');
const { createSuccessResponse, createErrorResponse } = require('../../helpers/responseweb');
const fs = require("fs");
const moment = require('moment/moment');

const winController = {
    winGame: async function(req, res, next){
        var responseData = {};
        responseData.pageName = 'Game wining histroy';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        var list = await winModel.find({}).sort({ "createdAt": -1 }).exec();
        responseData.data = list;

        res.render('pages/winTeam/winHistoryList', responseData);
    }
}
module.exports = winController

