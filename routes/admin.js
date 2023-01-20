var express = require('express');
var multer = require('multer');
var { webAuthenticated, webNotAuthenticated, checkIsMaster } = require('../middlewares/authenticators/webAuthHandlers');
const authController = require('../controllers/admin/authController');
const dashboardController = require('../controllers/admin/dashboardController');
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

// dashboard
router.get('/dashboard', webAuthenticated, dashboardController.dashboard);




module.exports = router;