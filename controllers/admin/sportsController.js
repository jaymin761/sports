var mongoose = require('mongoose');

const sportsController = {
 
    sports: async function(req, res, next){
        res.render('pages/sports/sportsList');
    }
}
module.exports = sportsController
