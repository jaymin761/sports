var mongoose = require('mongoose');
const multer = require('multer');
var constants = require('../../models/modelConstants');
var teamModel = mongoose.model(constants.teamSchema);
const path = require('path');
const md5 = require('md5');
const { createSuccessResponse, createErrorResponse } = require('../../helpers/responseweb');
const { dbConnection } = require('../../models/dbConnection');
const fs = require("fs");

const sportsController = {

    teams: async function (req, res, next) {
        var responseData = {};
        responseData.pageName = 'Team';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;
        console.log(req.user);
        var list = await teamModel.find({
            deletedStatus: 0
        }).sort({ "createdAt": -1 }).exec();
        responseData.data = list;
        res.render('pages/team/teamList', responseData);
    },
    teamDelete: async function (req, res, next) {
        const id = req.body.id
        const check = await teamModel.findOne({
            _id: mongoose.Types.ObjectId(id)
        })
        if (!check) {
            return createErrorResponse(req, res, 'Sport not found', err, 422);
        }
        await teamModel.updateOne({
            _id: mongoose.Types.ObjectId(id)
        }, {
            deletedStatus: 1
        })
        return createSuccessResponse(res, "Delete Successfully", { 'status': 1 });

    },
    teamStatus: async function (req, res, next) {
        const id = req.body.id
        const status = req.body.status
        const check = await teamModel.findOne({
            _id: mongoose.Types.ObjectId(id)
        })
        if (!check) {
            return createErrorResponse(req, res, 'Sport not found', err, 422);
        }
        await teamModel.updateOne({
            _id: mongoose.Types.ObjectId(id)
        }, {
            status: status
        })
        return createSuccessResponse(res, "Status Update Successfully", { 'status': 1 });
    },
    teamCreate: function (req, res, next) {
        // console.log(req.body);

        const storage = multer.diskStorage({
            destination: function (req, file, callback) {
                callback(null, './public/images');
            },
            filename: function (req, file, callback) {
                callback(null, md5(Date.now()) + path.extname(file.originalname));
            }
        });

        const uploaFiles = multer({
            storage: storage,
        }).single('icon_image');

        uploaFiles(req, res, async (err) => {
            const {
                name,
                status,
                id
            } = req.body
            var createData = {
                name,
                status,
                icon: req.file ? req.file.filename : null,
            }
            var checkExists={}
            if(id){
                checkExists={
                    _id :{$ne:mongoose.Types.ObjectId(id)}
                }   
            }

            checkExists = await teamModel.findOne({
                ...checkExists,
                name: name,
            }); 
            if(checkExists){
                return createSuccessResponse(res, "name already exists", { 'status': 2 });

            }


            

            if (id) {
                let checksport = await teamModel.findOne({
                    _id: mongoose.Types.ObjectId(id)
                });
                if (req.file) {
                    if (checksport) {
                        if (checksport.icon) {
                            fs.unlink(APPDIR + '/public/images/' + checksport.icon, () => {
                                console.log("delete");
                            });
                        }
                    }
                    createData.icon = req.file.filename
                } else {
                    createData.icon = checksport.icon
                }
                await teamModel.updateOne({
                    _id: mongoose.Types.ObjectId(id)
                }, {
                    name:name,
                    // status:status,
                    icon:createData.icon
                })
                return createSuccessResponse(res, "update Successfully", { 'status': 1 });
            }
            else{
                await teamModel.create(createData);
                return createSuccessResponse(res, "Create Successfully", { 'status': 1 });
            }

        });

    }
}
module.exports = sportsController
