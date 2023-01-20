var mongoose = require('mongoose');
var constants = require('../../models/modelConstants');
var adminModel = mongoose.model(constants.adminSchema);

const webAuthenticated = async function(req, res, next) {
    if (req.isAuthenticated()) {
        var result = await adminModel.findById(req.user.id);
        var status = result.status;
        if (status == 1) {
            return next();
        } else {
            req.session.destroy();
            return res.redirect('/admin');
        }
    }
    res.redirect('/');
};

const webNotAuthenticated = async function(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/admin/dashboard');
};

const checkIsMaster = async function(req, res, next) {
    if (req.user.is_master == 1) {
        return next();
    } else {
        res.redirect('/admin/dashboard');
    }
}

module.exports = {
    webAuthenticated,
    webNotAuthenticated,
    checkIsMaster
}