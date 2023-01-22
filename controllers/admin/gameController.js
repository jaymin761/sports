var mongoose = require('mongoose');
const multer = require('multer');
var constants = require('../../models/modelConstants');
var gameModel = mongoose.model(constants.gameSchema);
var teamModel = mongoose.model(constants.teamSchema);
var sportModel = mongoose.model(constants.sportSchema);
const path = require('path');
const md5 = require('md5');
const { createSuccessResponse, createErrorResponse } = require('../../helpers/responseweb');
const { dbConnection } = require('../../models/dbConnection');
const fs = require("fs");
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
                $project:{
                    "_id":1,
                    "name": 1,
                    "place": 1,
                    "start_date": 1,
                    "team_one":{ $arrayElemAt: ["$team_one.name", 0] },
                    "team_two":{ $arrayElemAt: ["$team_two.name", 0] },
                    "sports":{ $arrayElemAt: ["$sports.name", 0] },

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
            win_expect_id:team_ex,
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

    }
}
module.exports = gameController
