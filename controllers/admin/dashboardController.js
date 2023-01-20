var mongoose = require('mongoose');

const authController = {
    dashboard: async function(req, res, next){
        console.log("dasd");
        res.render('pages/dashboard');
    }
}
module.exports = authController
