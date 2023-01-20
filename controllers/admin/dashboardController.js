var mongoose = require('mongoose');

const authController = {
    dashboard: async function(req, res, next){
        res.render('pages/dashboard', responseData);
    }
}
module.exports = authController
