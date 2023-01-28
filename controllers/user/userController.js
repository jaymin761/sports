var mongoose = require('mongoose');
var constants = require('../../models/modelConstants');
var common = require('./commonController');
var userModel = mongoose.model(constants.userSchema);
var sportsModel = mongoose.model(constants.sportSchema);
var gameModel = mongoose.model(constants.gameSchema);
var teamModel = mongoose.model(constants.teamSchema);
const { createSuccessResponse, createErrorResponse } = require('../../helpers/responseweb');
var bcrypt = require('bcryptjs');
const { ceil } = require('lodash');

const userController = {
    register: async function (req, res, next) {

        try {

            const {
                mobile,
                password,
                deviceToken,
                deviceType
            } = req.body


            const user = new userModel({
                mobile:mobile,
                password:password,
                deviceToken:deviceToken,
                deviceType:deviceType
            })


            const token = common.generateToken(user);

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        
            await user.save();

            let data = {
                'id': user._id,
                'deviceId': user.device_id,
                'deviceType': user.deviceType,
                'deviceToken': user.deviceToken,
                'token': token
            }
            return createSuccessResponse(res, "Register Successfully", data);
        } catch (err) {
            console.log(err);
            return createErrorResponse(req, res, 'Internal Server error', "Internal Server error", 501);
        }

    },
    login: async function (req, res, next) {

        try {

            const {
                mobile,
                password,
            } = req.body


            const user = await userModel.findOne({
                mobile:mobile
            })

            if(!user){
                return createErrorResponse(req,res,{'errors':'User credential does not match'},422)
            }
            const valid_password = await bcrypt.compare(password, user.password);

            if (!valid_password) {
                return createErrorResponse(req,res,{'errors':'User credential does not match'},422)
            }
    
            const token = common.generateToken(user);

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        
            await user.save();

            let data = {
                'id': user._id,
                'deviceId': user.device_id,
                'deviceType': user.deviceType,
                'deviceToken': user.deviceToken,
                'token': token
            }
            return createSuccessResponse(res, "Register Successfully", data);
        } catch (err) {
            console.log(err);
            return createErrorResponse(req, res, 'Internal Server error', "Internal Server error", 501);
        }

    },
    sportList:async function (req,res,next){

        const data = await sportsModel.find({
            deletedStatus:0,
            status:1            
        })
        return createSuccessResponse(res, "Get Data Successfully", data);

    },
    gameList:async function (req,res,next){


        const sport_id = req.query.sport_id
        const perPage = 10
        const page = (req.query.page) ? req.query.page : 1;
        const skip = (page -1) * perPage    
        
        let filter={
            deletedStatus: 0,
        }
        if(sport_id){
            filter={
                ...filter,
                sport_id:new mongoose.Types.ObjectId(sport_id)
            }
        }
        var aggregate = [
            {
                $match:filter
            },
            { $sort: { createdAt: -1 } },
            {
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
            },
            { $unwind: { path: "$team_one" } },
            {
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
            { $unwind: { path: "$team_two" } },
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
            { $unwind: { path: "$sports" } },
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
            { $unwind: { path: "$expect_team" } },
            {
                $project:{
                    "_id":1,
                    "name": 1,
                    "place": 1,
                    "start_date": 1,
                    "win_status": 1,
                    "team_one":'$team_one',
                    "team_two":'$team_two',
                    "sports": '$sports',
                    "expect_team":'$expect_team',
                }
            },
            {
                $facet:{
                    metadata:[{$count: "total"}],
                    data: [{$skip: skip},{$limit: perPage}]
                }
            }
        ]
        var responseData = {};
        var data = await gameModel.aggregate(aggregate).then( async(result)=>{
            responseData.total=result[0].metadata.length > 0 ? result[0].metadata[0].total : 0;
            responseData.page= page;
            responseData.per_page= perPage;
            responseData.total_page= Math.ceil(responseData.total/perPage);
            responseData.data = result[0].data   ;
            return createSuccessResponse(res, "Get Data Successfully", responseData);
        });
    }
}
module.exports = userController
