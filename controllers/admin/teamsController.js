var mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
var constants = require('../../models/modelConstants');
var sportModel = mongoose.model(constants.sportSchema);
var teamModel = mongoose.model(constants.teamSchema);
const path = require('path');
const md5 = require('md5');
const { createSuccessResponse } = require('../../helpers/responseweb');
const { dbConnection } = require('../../models/dbConnection');

const teamController = {
 
    teams: async function(req, res, next){
        var responseData = {};
        responseData.pageName = 'Teams';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        var list = await teamModel.find({
            deletedStatus:0
        }).sort( { "createdAt": -1 } ).exec(); 
        responseData.data = list;
        res.render('pages/team/teamList', responseData);
    },

    teamDelete: async function(req, res, next){
        const id =req.body.id 
        const check = await teamModel.findOne({
            _id:mongoose.Types.ObjectId(id)
        });       
        if(!check){
              return createErrorResponse(req, res, 'Sport not found', err, 422);
        }
        // fs.unlink(APPDIR + '/public/images/' + check.icon, () => {
        //     console.log("delete");
        // });
        await teamModel.updateOne({
            _id:mongoose.Types.ObjectId(id)
        },{
            deletedStatus:1
        })
        return createSuccessResponse(res, "Delete Successfully", { 'status': 1 });
    },

    teamStatus: async function(req, res, next){
        const id =req.body.id 
        const status =req.body.status 
        const check = await teamModel.findOne({
             _id:mongoose.Types.ObjectId(id)
         })
         if(!check){
               return createErrorResponse(req, res, 'Sport not found', err, 422);
         }
         await teamModel.updateOne({
            _id:mongoose.Types.ObjectId(id)
        },{
            status:status
        })
         return createSuccessResponse(res, "Status Update Successfully", { 'status': 1 });
    },

    teamCreate:function(req,res,next){
        // console.log(req.body);

        const storage = multer.diskStorage({
            destination: function(req, file, callback) {
                callback(null, './public/images');
            },
            filename: function(req, file, callback) {
                callback(null, md5(Date.now()) + path.extname(file.originalname));
            }
        });
    
        const uploaFiles = multer({
            storage: storage,
        }).single('icon_image');

        uploaFiles(req, res, async(err) => {
            const {
                name,
                status,
            }=req.body

            var createData={
                name,
                status,
                icon:req.file?req.file.filename:null,
            }
            if(req.file){
                createData.icon=req.file.filename
            }

            await teamModel.create(createData);
        });
        return createSuccessResponse(res, "Create Successfully", { 'status': 1 });
    }
}
module.exports = teamController
