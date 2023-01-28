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
var mongodb = require('mongodb');
var MongoDataTable = require('mongo-datatable');
var MongoClient = mongodb.MongoClient;

const winController = {
    winGame: async function(req, res, next){
        var responseData = {};
        responseData.pageName = 'Game wining histroy';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        var list = await winModel.find({}).sort({ "createdAt": -1 }).exec();
        responseData.data = list;

        res.render('pages/winTeam/winHistoryList', responseData);
    },

    winGameListing: async function(req, res, next){
        var options = req.query;
        options.showAlertOnError = true;

        // options.customQuery = {
        //     deletedStatus:0
        // };
        MongoClient.connect(process.env.DATABASE_BASE_URL, function(err, client) {
            new MongoDataTable(client.db(process.env.DATABASE)).get(constants.winSchema, options, async function(err, result) {
                if (err) {
                    // handle the error
                    return;
                }
                for (var i = result.data.length - 1; i >= 0; i--) {
                    var team = await teamModel.findOne({"_id": mongoose.Types.ObjectId(result.data[i].team_id)});
                    var game = await gameModel.findOne({"_id": mongoose.Types.ObjectId(result.data[i].game_id)});
                    var team_one = await teamModel.findOne({"_id": mongoose.Types.ObjectId(game.team1_id)});
                    var team_two = await teamModel.findOne({"_id": mongoose.Types.ObjectId(game.team2_id)});

                    var action = "";
                    if(result.data[i]['win_status']==1){
                        var status = '<label class="badge badge-success">Yes</label>';
                        var action =   "<button data-toggle='modal' data-target='#modal-default' class='btn btn-sm btn-primary edit-game' data-id='" +result.data[i]['_id']+"'title='Click to Edit'><i class='fas fa-edit'></i></button> <button class='btn btn-sm btn-danger delete-game' data-id='"+result.data[i]['_id']+ "'title='Click to Delete'><i class='fas fa-trash-alt'></i></button>";
                    }else{
                        var status = '<label class="badge badge-danger">No</label>';
                        var action =  "<button class='btn btn-sm btn-danger win-game' data-id='"+result.data[i]['_id']+"' title='Click to Edit' data-toggle='modal' data-target='#modal-win-default'><i class='fa fa-trophy' aria-hidden='true'></i></i></button> <button data-toggle='modal' data-target='#modal-default' class='btn btn-sm btn-primary edit-game' data-id='" +result.data[i]['_id']+"'title='Click to Edit'><i class='fas fa-edit'></i></button> <button class='btn btn-sm btn-danger delete-game' data-id='"+result.data[i]['_id']+ "'title='Click to Delete'><i class='fas fa-trash-alt'></i></button>";
                    }
                    

                    result.data[i]['_id'] = i + 1;
                    result.data[i]['team_id'] = team.name;
                    result.data[i]['game_id'] = game.name;
                    result.data[i]['team_one'] = team_one.name;
                    result.data[i]['team_two'] = team_two.name;
                    // result.data[i]['win_expect_id'] = win_expect_team.name;
                    // result.data[i]['sport_id'] = sports.name;
                    // result.data[i]['start_date'] = result.data[i].start_date;
                    // result.data[i]['createAt'] = action;
                    // result.data[i]['win_status'] = status;
                }
                // console.log(result);
              res.send(result);
            });
          });
    }
}
module.exports = winController

