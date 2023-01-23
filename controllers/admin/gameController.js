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
const { dbConnection } = require('../../models/dbConnection');
const fs = require("fs");
var mongodb = require('mongodb');
var MongoDataTable = require('mongo-datatable');
var MongoClient = mongodb.MongoClient;
const moment = require('moment/moment');

const gameController = {

    games: async function (req, res, next) {
        var responseData = {};
        responseData.pageName = 'games';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        var gameList = await gameModel.aggregate([
            {
                $match:{deletedStatus: 0}
            },{
                $lookup: {
                    from: constants.teamSchema,
                    let: { teamId: "$team1_id" },
                    as: "team_one",
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$_id", "$$teamId"] },
                                ]
                            }
                        }
                    },{
                        $project:{
                            _id:1,
                            name:1,
                        }
                    }]
                },
                
            },{
                $lookup: {
                    from: constants.teamSchema,
                    let: { teamId2: "$team2_id" },
                    as: "team_two",
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$_id", "$$teamId2"] },
                                ]
                            }
                        }
                    },{
                        $project:{
                            _id:1,
                            name:1,
                        }
                    }]
                }
            },
            {
                $lookup: {
                    from: constants.sportSchema,
                    let: { sportId: "$sport_id" },
                    as: "sports",
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$_id", "$$sportId"] },
                                ]
                            }
                        }
                    },{
                        $project:{
                            _id:1,
                            name:1,
                        }
                    }]
                }
            },
            {
                $lookup: {
                    from: constants.teamSchema,
                    let: { win_expect_id: "$win_expect_id" },
                    as: "expect_team",
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$_id", "$$win_expect_id"] },
                                ]
                            }
                        }
                    },{
                        $project:{
                            _id:1,
                            name:1,
                        }
                    }]
                }
            },
            {
                $project:{
                    "_id":1,
                    "name": 1,
                    "place": 1,
                    "start_date": 1,
                    "win_status": 1,
                    "team_one":{ $arrayElemAt: ["$team_one.name", 0] },
                    "team_two":{ $arrayElemAt: ["$team_two.name", 0] },
                    "sports":{ $arrayElemAt: ["$sports.name", 0] },
                    "expect_team":{ $arrayElemAt: ["$expect_team.name", 0] },

                }
            },
            {
                $sort:{
                    "start_date": 1
                }
            }
        ]);

        var teamList = await teamModel.find({
            status:1,
            deletedStatus: 0
        }).sort({ "createdAt": -1 }).exec();

        var sportList = await sportModel.find({
            status:1,
            deletedStatus: 0
        }).sort({ "createdAt": -1 }).exec();

        responseData.data = gameList;
        responseData.team = teamList;
        responseData.sport = sportList;
        res.render('pages/games/gameList', responseData);
    },

    gameListing: async function(req, res, next){
        var options = req.query;
        options.showAlertOnError = true;

        options.customQuery = {
            deletedStatus:0
        };

        MongoClient.connect(process.env.DATABASE_BASE_URL, function(err, client) {
            new MongoDataTable(client.db(process.env.DATABASE)).get(constants.gameSchema, options, async function(err, result) {
                if (err) {
                    // handle the error
                    return;
                }
                for (var i = result.data.length - 1; i >= 0; i--) {
                    var team_one = await teamModel.findOne({"_id": mongoose.Types.ObjectId(result.data[i].team1_id)});
                    var team_two = await teamModel.findOne({"_id": mongoose.Types.ObjectId(result.data[i].team2_id)});
                    var win_expect_team = await teamModel.findOne({"_id": mongoose.Types.ObjectId(result.data[i].win_expect_id)});
                    var sports = await sportModel.findOne({"_id": mongoose.Types.ObjectId(result.data[i].sport_id)});

                    var action = "";
                    if(result.data[i]['win_status']==1){
                        var status = '<label class="badge badge-success">Active</label>';
                    }else{
                        var status = '<label class="badge badge-danger">Inctive</label>';
                    }
                    
                    action +=  "<button data-toggle='modal' data-target='#modal-default' class='btn btn-sm btn-primary edit-game' data-id='" +result.data[i]['_id']+"'title='Click to Edit'><i class='fas fa-edit'></i></button> <button class='btn btn-sm btn-danger delete-game' data-id='"+result.data[i]['_id']+ "'title='Click to Delete'><i class='fas fa-trash-alt'></i></button>";

                    result.data[i]['_id'] = i + 1;
                    result.data[i]['team1_id'] = team_one.name;
                    result.data[i]['team2_id'] = team_two.name;
                    result.data[i]['win_expect_id'] = win_expect_team.name;
                    result.data[i]['sport_id'] = sports.name;
                    result.data[i]['start_date'] = result.data[i].start_date;
                    result.data[i]['createAt'] = action;
                    result.data[i]['win_status'] = status;


                }
                console.log(result);
              res.send(result);
            });
          });
    },

    teamGet:async function (req,res,next){
        const team_id = req.body.team_id
        var teamList = await teamModel.find({
            _id :{$ne:mongoose.Types.ObjectId(team_id)},
            status:1,
            deletedStatus: 0
        }).sort({ "createdAt": -1 }).exec();

        return createSuccessResponse(res, "Get Successfully",{teamList});

    },
    teamGetExpet:async function (req,res,next){
      
        const teams = req.body.teams;
        var teamList = await teamModel.find({
            _id: {$in:teams},
            status:1,
            deletedStatus: 0
        }).sort({ "createdAt": -1 }).exec();
        return createSuccessResponse(res, "Get Successfully",{teamList});

    },
    gameCreate:async function (req,res,next){
        const {
            name,
            place,
            start_date,
            team_one,
            team_two,
            sport,
            team_ex
        }=req.body

        await gameModel.create({
            name:name,
            place:place,
            start_date:moment(start_date).format('YYYY-MM-DD'),
            team1_id:team_one,
            team2_id:team_two,
            sport_id:sport,
            win_expect_id:team_ex?team_ex:null,
        })
        return createSuccessResponse(res, "Game Successfully",{status:1});

    },
    gameEdit:async function (req,res){
        const {
            id
        }=req.body

        var teamList = await gameModel.findOne({
            _id :mongoose.Types.ObjectId(id),
        }).exec();
        return createSuccessResponse(res, "Get Successfully",{teamList});

    },
    gameupdate:async function (req,res){
        const {
            name,
            place,
            start_date,
            team_one,
            team_two,
            sport,
            team_ex,
            id
        }=req.body

        await gameModel.updateOne({
            _id: mongoose.Types.ObjectId(id)
        }, {
            name:name,
            place:place,
            start_date:new Date(start_date),
            team1_id:team_one,
            team2_id:team_two,
            sport_id:sport,
            win_expect_id:team_ex?team_ex:null,
        })
        return createSuccessResponse(res, "update Successfully", { 'status': 1 });
    },
    gameWin:async function(req,res){

        const {
            id
        }=req.body

           var teamList = await gameModel.aggregate([
            {
                $match:{_id :mongoose.Types.ObjectId(id),
                deletedStatus: 0}
            },{
                $lookup: {
                    from: constants.teamSchema,
                    let: { teamId: "$team1_id" },
                    as: "team_one",
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$_id", "$$teamId"] },
                                ]
                            }
                        }
                    },{
                        $project:{
                            _id:1,
                            name:1,
                        }
                    }]
                },
                
            },{
                $lookup: {
                    from: constants.teamSchema,
                    let: { teamId2: "$team2_id" },
                    as: "team_two",
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$_id", "$$teamId2"] },
                                ]
                            }
                        }
                    },{
                        $project:{
                            _id:1,
                            name:1,
                        }
                    }]
                }
            },
            {
                $lookup: {
                    from: constants.sportSchema,
                    let: { sportId: "$sport_id" },
                    as: "sports",
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$_id", "$$sportId"] },
                                ]
                            }
                        }
                    },{
                        $project:{
                            _id:1,
                            name:1,
                        }
                    }]
                }
            },
            {
                $lookup: {
                    from: constants.teamSchema,
                    let: { win_expect_id: "$win_expect_id" },
                    as: "expect_team",
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$_id", "$$win_expect_id"] },
                                ]
                            }
                        }
                    },{
                        $project:{
                            _id:1,
                            name:1,
                        }
                    }]
                }
            },
            {
                $project:{
                    "_id":1,
                    "team_one":{ $arrayElemAt: ["$team_one.name", 0] },
                    "team_one_id":{ $arrayElemAt: ["$team_one._id", 0] },
                    "team_two":{ $arrayElemAt: ["$team_two.name", 0] },
                    "team_two_id":{ $arrayElemAt: ["$team_two._id", 0] },
                }
            },
        ]);
        return createSuccessResponse(res, "Get Successfully",teamList[0]);

    },
    gameWinSave:async function (req,res){

       let id = req.body.id;
       let win_team_id = req.body.win_team_id;

       await gameModel.updateOne({
          _id: mongoose.Types.ObjectId(id)
        }, {
          win_status:1
        })

        await winModel.create({
            game_id:id,
            team_id:win_team_id
        })

       return createSuccessResponse(res, "Winner Annouce Successfully", { 'status': 1 });
    },
    
    gameDelete: async function(req, res, next){
        const id = req.body.id
        const check = await gameModel.findOne({
            _id: mongoose.Types.ObjectId(id)
        })
        if (!check) {
            return createErrorResponse(req, res, 'Sport not found', err, 422);
        }
        await gameModel.updateOne({
            _id: mongoose.Types.ObjectId(id)
        }, {
            deletedStatus: 1
        })
        return createSuccessResponse(res, "Delete Successfully", { 'status': 1 });
    }
}
module.exports = gameController
