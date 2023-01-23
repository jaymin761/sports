var mongoose = require('mongoose');
const multer = require('multer');
var constants = require('../../models/modelConstants');
var sportModel = mongoose.model(constants.sportSchema);
const path = require('path');
const md5 = require('md5');
const { createSuccessResponse, createErrorResponse } = require('../../helpers/responseweb');
const { dbConnection } = require('../../models/dbConnection');
const fs = require("fs");
var mongodb = require('mongodb');
var MongoDataTable = require('mongo-datatable');
var MongoClient = mongodb.MongoClient;
const sportsController = {

    sports: async function (req, res, next) {
        var responseData = {};
        responseData.pageName = 'Sports';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        var list = await sportModel.find({
            deletedStatus: 0
        }).sort({ "createdAt": -1 }).exec();
        responseData.data = list;
        res.render('pages/sports/sportsList', responseData);
    },
    sportListing:async function(req,res,next){
        var options = req.query;
        options.showAlertOnError = true;
       
        options.customQuery = {
            deletedStatus: 0,
          };
          MongoClient.connect(process.env.DATABASE_BASE_URL, function(err, client) {
            new MongoDataTable(client.db(process.env.DATABASE)).get(constants.sportSchema, options, function(err, result) {
              if (err) {
                // handle the error
            return;

              }
                for (var i = result.data.length - 1; i >= 0; i--) {

                    if(result.data[i]['status']==1){
                        var status = '<label class="badge badge-success">Active</label>';
                    }else{
                        var status = '<label class="badge badge-danger">Inctive</label>';
                    }
                    var action = "";

                    if(result.data[i]['status']==1){

                        action += "<button class='btn btn-sm btn-success sport-type-sts' data-status='0' data-id='" + result.data[i]['_id'] + "' title='Click to Disabled'><i class='fas fa-unlock'></i></button>";
                    }else{
                        action +="<button class='btn btn-sm btn-danger sport-type-sts' data-status='1' data-id='"+result.data[i]['_id']+"' title='Click to Enabled'><i class='fas fa-lock'></i></button>"
                    }
                    action+=' <button data-toggle="modal" data-target="#modal-default" class="btn btn-sm btn-primary edit-sports" data-status="'+result.data[i]['status']+'" data-icon="'+result.data[i]['icon']+'" data-name="'+result.data[i]['name']+'" data-id="'+result.data[i]['_id']+'" title="Click to Edit"><i class="fas fa-edit" ></i></button><button class="btn btn-sm btn-danger delete-sports" data-id="'+result.data[i]['_id']+'" title="Click to Delete"><i class="fas fa-trash-alt"></i></button>'
                    
                   var img = "<img src='" + process.env.WEBURL + 'images/' + result.data[i]['icon'] + "' style='height:50px;width:50px;'/>";
                    
                    result.data[i]['_id'] = i + 1;
                    result.data[i]['status'] = status;
                    result.data[i]['icon'] = img;
                    result.data[i]['createAt'] = action;

                }
                console.log(result);
              res.send(result);
            });
          });

    },
    sportDelete: async function (req, res, next) {
        const id = req.body.id
        const check = await sportModel.findOne({
            _id: mongoose.Types.ObjectId(id)
        })
        if (!check) {
            return createErrorResponse(req, res, 'Sport not found', err, 422);
        }
        await sportModel.updateOne({
            _id: mongoose.Types.ObjectId(id)
        }, {
            deletedStatus: 1
        })
        return createSuccessResponse(res, "Delete Successfully", { 'status': 1 });

    },
    sportStatus: async function (req, res, next) {
        const id = req.body.id
        const status = req.body.status
        const check = await sportModel.findOne({
            _id: mongoose.Types.ObjectId(id)
        })
        if (!check) {
            return createErrorResponse(req, res, 'Sport not found', err, 422);
        }
        await sportModel.updateOne({
            _id: mongoose.Types.ObjectId(id)
        }, {
            status: status
        })
        return createSuccessResponse(res, "Status Update Successfully", { 'status': 1 });
    },
    sportCreate: function (req, res, next) {
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

            checkExists = await sportModel.findOne({
                ...checkExists,
                name: name,
            }); 
            if(checkExists){
                return createSuccessResponse(res, "name already exists", { 'status': 2 });

            }


            

            if (id) {
                let checksport = await sportModel.findOne({
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
                await sportModel.updateOne({
                    _id: mongoose.Types.ObjectId(id)
                }, {
                    name:name,
                    // status:status,
                    icon:createData.icon
                })
                return createSuccessResponse(res, "update Successfully", { 'status': 1 });
            }
            else{
                await sportModel.create(createData);
                return createSuccessResponse(res, "Create Successfully", { 'status': 1 });
            }

        });

    }
}
module.exports = sportsController
