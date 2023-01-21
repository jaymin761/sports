var mongoose = require('mongoose');
var constants = require('../../models/modelConstants');
var sportModel = mongoose.model(constants.sportSchema);

const sportsController = {
 
    sports: async function(req, res, next){
        var responseData = {};
        responseData.pageName = 'Sports';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        var list = await sportModel.find({}).exec(); 
        responseData.data = list;
        
        res.render('pages/sports/sportsList', responseData);
    }
}
module.exports = sportsController
