var mongoose = require('mongoose');

const dashboardController = {
    dashboard: async function(req, res, next){
        var responseData = {};
        responseData.pageName = 'Dashboard';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        res.render('pages/dashboard', responseData);
    }
}
module.exports = dashboardController
