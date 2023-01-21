var mongoose = require('mongoose');

const dashboardController = {
    dashboard: async function(req, res, next){
        res.render('pages/dashboard');
    },
    sports: async function(req, res, next){
        res.render('pages/sports/sportsList');
    }
}
module.exports = dashboardController
