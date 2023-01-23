var express = require('express');
var multer = require('multer');
var { apiValidateToken } = require('../middlewares/authenticators/apiAuthHandlers');
const validater  = require('../middlewares/validators/api-validation');
const userController = require('../controllers/user/userController');

var router = express.Router();


router.post('/register',validater.register, userController.register);
router.post('/login',validater.login, userController.login);
router.get('/sport-list',apiValidateToken,userController.sportList);



module.exports = router;