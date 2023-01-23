var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');

var constants = require('../../models/modelConstants');
var userTokenModel = mongoose.model(constants.userTokenSchema);

// var UserTokenSchema = mongoose.model(constants.userTokenSchema);

const apiValidateToken = async function(req, res, next) {

    let accessToken = req.headers['x-access-token'] || req.headers.authorization;
    if (accessToken) {
        var token = accessToken;
        token = token.replace(/^Bearer\s+/, "");
        req.currentUser = {};

        jwt.verify(token, process.env.SECRETKEY, async function(err, decoded) {

            if (decoded) {

                req.currentUser.user_id = decoded.sub;
                req.currentUser.user_env_type = decoded.user_env_type;

                var userToken = await userTokenModel.findOne({ $and: [{ userId: decoded.sub }, { token: token }] }).exec();
                if (userToken == null) {
                    res.status(401).json({ status: false, message: "Invalid Token" });
                    return false;
                }

                next();
            } else {
                console.log(err);
                res.status(401).json({ status: false, message: "Invalid Token" });
                return false;
            }
        });
    } else {
        res.status(401).json({ status: false, message: "Invalid Token" });
        return false;
    }
};

const apiValidateTokenOptional = async function(req, res, next) {
    let accessToken = req.headers['x-access-token'] || req.headers.authorization;
    if (accessToken) {
        var token = accessToken;
        token = token.replace(/^Bearer\s+/, "");
        req.currentUser = {};

        jwt.verify(token, process.env.SECRETKEY, async function(err, decoded) {
            if (decoded) {
                req.currentUser.user_id = decoded.sub;

                var userToken = await userTokenModel.findOne({ $and: [{ userId: decoded.sub }, { token: token }] })
                    .populate('userId').exec();
                if (userToken != null) {
                    req.user = userToken.userId;
                }
                next();
            } else {
                next();
            }
        });
    } else {
        next();
    }
};


const validToken = function(req, res, next) {
        const authorizationHeaader = req.headers.authorization;
        let result;
        if (authorizationHeaader) {
            const token = req.headers.authorization.split(' ')[1]; // Bearer <token>
            const options = {
                expiresIn: '2d',
                issuer: 'coopervision'
            };
            try {

                // verify makes sure that the token hasn't expired and has been issued by us
                result = jwt.verify(token, process.env.SECRETKEY, options);

                // Let's pass back the decoded token to the request object
                req.decoded = result;
                // We call next to pass execution to the subsequent middleware
                next();
            } catch (err) {
                // Throw an error just in case anything goes wrong with verification
                throw new Error(err);

            }
        } else {
            result = {
                error: `Authentication error. Token required.`,
                status: 401
            };
            res.status(401).send(result);
        }
    }
    // let gaga = {
    //     expiresIn: '2d',
    //     issuer: 'coopervision'
    // };
    // let data = {
    //     time: Date(),
    //     userId: 12,
    // }

// const token = jwt.sign(data, process.env.SECRETKEY, gaga);

const VerfiyToken = function(req, res, next) {

    req.currentUser = {};
    var token = req.headers['x-access-token'] || req.headers.authorization;

    if (token) {
        token = token.replace(/^Bearer\s+/, "");
        jwt.verify(token, process.env.SECRETKEY, (err, decoded) => {
            if (decoded) {
                req.currentUser.user = decoded;
                next();
            } else {
                res.status(401).json({ status: false, message: "Invalid Token" });
                return false;
            }
        });
    } else {
        res.status(401).json({ status: false, message: "Invalid Tokesn" });
        return false;
    }

}

const apiVerifyUser = function(req, res, next) {
    if (req.user.status === CONFIGS.userStatus.inactive) {
        return res.json({ responseCode: 203, msg: 'User not verified' });
    } else if (req.user.status === CONFIGS.userStatus.suspended) {
        return res.json({ responseCode: 203, msg: 'User not verified' });
    } else if (req.user.status === CONFIGS.userStatus.reported) {
        return res.json({ responseCode: 203, msg: 'User not verified' });
    } else if (req.user.status === CONFIGS.userStatus.blocked) {
        return res.json({ responseCode: 203, msg: 'User not verified' });
    } else {
        next();
    }
};

const apiIsDriver = function(req, res, next) {
    if (req.user.status !== CONFIGS.role.driver) {
        return res.json({ responseCode: 203, msg: 'User not verified' });
    } else {
        next();
    }
};

const apiIsCustomer = function(req, res, next) {
    if (req.user.status !== CONFIGS.role.customer) {
        return res.json({ responseCode: 203, msg: 'User not verified' });
    } else {
        next();
    }
};

module.exports = {
    apiValidateToken,
    validToken,
    VerfiyToken,
    apiVerifyUser,
    apiIsDriver,
    apiIsCustomer,
    apiValidateTokenOptional
}