var mongoose = require('mongoose');
var constants = require('../../models/modelConstants');
var userTokenModel = mongoose.model(constants.userTokenSchema);
const jwt = require('jsonwebtoken')

exports.generateToken = (data) => {
    const { _id, deviceToken } = data
    var token = jwt.sign({
        sub: _id,
    },
        process.env.SECRETKEY, { expiresIn: CONFIGS.token_validity }
    );
    userTokenModel.create({
        userId: _id,
        token: token,
        deviceToken: deviceToken,
    }, (err, result1) => {
        console.log(err);
    });

    return token;
}