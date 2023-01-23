var mongoose = require('mongoose');
var constants = require('../../models/modelConstants');
var common = require('./commonController');
var userModel = mongoose.model(constants.userSchema);
var sportsModel = mongoose.model(constants.sportSchema);
const { createSuccessResponse, createErrorResponse } = require('../../helpers/responseweb');
var bcrypt = require('bcryptjs');

const userController = {
    register: async function (req, res, next) {

        try {

            const {
                mobile,
                password,
                deviceToken,
                deviceType
            } = req.body


            const user = new userModel({
                mobile:mobile,
                password:password,
                deviceToken:deviceToken,
                deviceType:deviceType
            })


            const token = common.generateToken(user);

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        
            await user.save();

            let data = {
                'id': user._id,
                'deviceId': user.device_id,
                'deviceType': user.deviceType,
                'deviceToken': user.deviceToken,
                'token': token
            }
            return createSuccessResponse(res, "Register Successfully", data);
        } catch (err) {
            console.log(err);
            return createErrorResponse(req, res, 'Internal Server error', "Internal Server error", 501);
        }

    },
    login: async function (req, res, next) {

        try {

            const {
                mobile,
                password,
            } = req.body


            const user = await userModel.findOne({
                mobile:mobile
            })

            if(!user){
                return createErrorResponse(req,res,{'errors':'User credential does not match'},422)
            }
            const valid_password = await bcrypt.compare(password, user.password);

            if (!valid_password) {
                return createErrorResponse(req,res,{'errors':'User credential does not match'},422)
            }
    
            const token = common.generateToken(user);

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        
            await user.save();

            let data = {
                'id': user._id,
                'deviceId': user.device_id,
                'deviceType': user.deviceType,
                'deviceToken': user.deviceToken,
                'token': token
            }
            return createSuccessResponse(res, "Register Successfully", data);
        } catch (err) {
            console.log(err);
            return createErrorResponse(req, res, 'Internal Server error', "Internal Server error", 501);
        }

    },
    sportList:async function (req,res,next){

        const data = await sportsModel.find({})
        return createSuccessResponse(res, "Get Data Successfully", data);

    }
}
module.exports = userController
