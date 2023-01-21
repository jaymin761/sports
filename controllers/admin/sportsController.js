var mongoose = require('mongoose');
const multer = require('multer');
var constants = require('../../models/modelConstants');
var sportModel = mongoose.model(constants.sportSchema);
const path = require('path');
const md5 = require('md5');
const { createSuccessResponse } = require('../../helpers/responseweb');

const sportsController = {
 
    sports: async function(req, res, next){
        var responseData = {};
        responseData.pageName = 'Sports';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        var list = await sportModel.find({}).exec(); 
        responseData.data = list;
        console.log(responseData);
        res.render('pages/sports/sportsList', responseData);
    },
    sportCreate:function(req,res,next){
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

            await sportModel.create(createData);
        });
        return createSuccessResponse(res, "Create Successfully", { 'status': 1 });
       
    }
}
module.exports = sportsController
