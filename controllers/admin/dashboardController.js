var mongoose = require('mongoose');
var constants = require('../../models/modelConstants');
var sportModel = mongoose.model(constants.sportSchema);
var teamModel = mongoose.model(constants.teamSchema);

const dashboardController = {
    dashboard: async function(req, res, next){
        var responseData = {};
        responseData.pageName = 'Dashboard';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        var sportCount = await sportModel.countDocuments({"deletedStatus": 0})
        var teamCount = await teamModel.countDocuments({"deletedStatus": 0})

        responseData.sportCount = sportCount;
        responseData.teamCount = teamCount;

        res.render('pages/dashboard', responseData);
    }
}
module.exports = dashboardController
