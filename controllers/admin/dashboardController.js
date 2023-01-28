var mongoose = require('mongoose');
var constants = require('../../models/modelConstants');
var sportModel = mongoose.model(constants.sportSchema);
var teamModel = mongoose.model(constants.teamSchema);
var gameModel = mongoose.model(constants.gameSchema);
var userModel = mongoose.model(constants.userSchema);
var mongodb = require('mongodb');
var MongoDataTable = require('mongo-datatable');
var MongoClient = mongodb.MongoClient;

const dashboardController = {
    dashboard: async function (req, res, next) {
        var responseData = {};
        responseData.pageName = 'Dashboard';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        var sportCount = await sportModel.countDocuments({ "deletedStatus": 0 })
        var teamCount = await teamModel.countDocuments({ "deletedStatus": 0 })
        var gameCount = await gameModel.countDocuments({ "deletedStatus": 0 })
        var userCount = await userModel.countDocuments()

        responseData.sportCount = sportCount;
        responseData.teamCount = teamCount;
        responseData.gameCount = gameCount;
        responseData.userCount = userCount;

        res.render('pages/dashboard', responseData);
    },
    users: async function (req, res, next) {
        var responseData = {};
        responseData.pageName = 'Users';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        res.render('pages/users/usersList', responseData);
    },
    userListing: async function (req, res, next) {
        var options = req.query;
        options.showAlertOnError = true;

       
        MongoClient.connect(process.env.DATABASE_BASE_URL, function (err, client) {
            new MongoDataTable(client.db(process.env.DATABASE)).get(constants.userSchema, options, function (err, result) {
                if (err) {
                    // handle the error
                    return;
                }
                for (var i = result.data.length - 1; i >= 0; i--) {

                    result.data[i]['_id'] = i + 1;
                }
                res.send(result);
            });
        });
    }
}
module.exports = dashboardController
