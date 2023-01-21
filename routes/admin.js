var express = require('express');
var multer = require('multer');
var { webAuthenticated, webNotAuthenticated, checkIsMaster } = require('../middlewares/authenticators/webAuthHandlers');
const authController = require('../controllers/admin/authController');
const dashboardController = require('../controllers/admin/dashboardController');
const sportsController = require('../controllers/admin/sportsController');
const teamsController = require('../controllers/admin/teamsController');
var router = express.Router();


var adminImageUpload = multer({ dest: APPDIR + '/public/images/admin' });


/* GET home page. */
router.get('/', function(req, res, next) {
    res.redirect('/admin/login');
});

// auth route --------------------------------------------------------------------------------------------------------------
router.get('/login', webNotAuthenticated, authController.login);
router.post('/login', webNotAuthenticated, authController.loginPost);
router.get('/logout', webAuthenticated, authController.logout);

// profile 
router.get('/profile', webAuthenticated, authController.profile);
router.post('/editprofile', webAuthenticated, authController.editProfilePost);

// change password
router.post('/chnagepassword', webAuthenticated, authController.changePasswordPost);




// dashboard
router.get('/dashboard', webAuthenticated, dashboardController.dashboard);
router.get('/sports', webAuthenticated, sportsController.sports);
router.post('/sport-create', webAuthenticated, sportsController.sportCreate);
router.post('/sport-delete', webAuthenticated, sportsController.sportDelete);
router.post('/sport-status', webAuthenticated, sportsController.sportStatus);

// team 
router.get('/team', webAuthenticated, teamsController.teams);
router.post('/team-create', webAuthenticated, teamsController.teamCreate);
router.post('/team-delete', webAuthenticated, teamsController.teamDelete);
router.post('/team-status', webAuthenticated, teamsController.teamStatus);




module.exports = router;