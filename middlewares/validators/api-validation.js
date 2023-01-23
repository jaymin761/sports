const validator = require('./validate');


const check = (req, res, next) => {

    var check_image = check_single_image(req.files);
    var validationRule;

    if (check_image == false) {
        validationRule = {
            "first_name": "required",
            "fileName": "required",
        }
    } else {
        validationRule = {
            "first_name": "required",
        }
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const register = (req, res, next) => {

  
    validationRule = {
        "mobile": "required|exist:users,mobile",
        "password": "required|min:4|max:50",
        "deviceToken": "required",
        "deviceType": "required"
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}
const login = (req, res, next) => {

  
    validationRule = {
        "mobile": "required",
        "password": "required",
        "deviceToken": "required",
        "deviceType": "required"
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const signin = (req, res, next) => {

    validationRule = {
        "email": "required",
        "password": "required",
        "device_type": "required",
        "device_token": "required"
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}

const socialLogin = (req, res, next) => {
    const validationRule = {
        "username": "required",
        "social_id": "required",
        "type": "required",
        "device_type": "required",
        "device_token": "required"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const checkUser = (req, res, next) => {
    const validationRule = {
        "social_id": "required",
        "type": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}

const verifyOtp = (req, res, next) => {

    validationRule = {
        "otp": "required",
        "user_id": "required",
        "device_id": "required",
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}

const resendOtp = (req, res, next) => {

    validationRule = {
        "user_id": "required",
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}

const forgotPassword = (req, res, next) => {
    const validationRule = {
        "email": "required"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}

const resetPassword = (req, res, next) => {
    const validationRule = {
        "forgot_password_token": "required",
        "new_password": "required",
        "confirm_password": "required"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}

const changePassword = (req, res, next) => {
    const validationRule = {
        "old_password": "required",
        "new_password": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}

const updateUserInfo = (req, res, next) => {
    var file = req.file;
    const validationRule = {
        "first_name": "required",
        "last_name": "required",
        "username": "required",
        "city": "required",
        "state": "required",
        "country": "required",
        "longitude": "required",
        "latitude": "required",
        // "nationality": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            if (file) {
                let image_name = file.filename;
                fs.unlink(APPDIR + '/public/images/users/' + image_name, () => { console.log("delete"); });
            }
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}

const verifyEmailOtp = (req, res, next) => {
    const validationRule = {
        "otp": "required",
        "email": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const verifyPromocode = (req, res, next) => {
    const validationRule = {
        "code": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const updateUserProfileStatus = (req, res, next) => {
    const validationRule = {
        "profile_status": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const createContactUs = (req, res, next) => {
    const validationRule = {
        "username": "required",
        "email": "required",
        "contact_no": "required",
        "message": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const deleteAccountstep2 = (req, res, next) => {
    const validationRule = {
        "verification_code": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const blockUnblockUser = (req, res, next) => {
    const validationRule = {
        "user_id": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const followUnfollowUser = (req, res, next) => {
    const validationRule = {
        "user_id": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const deletePost = (req, res, next) => {
    const validationRule = {
        "post_id": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const createPost = (req, res, next) => {
    const validationRule = {
        "post_status": "required",
        "title": "required",
        // "start_date": "required",
        // "end_date": "required",
        "description": "required",
        "media": "required",

    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const uploadMedia = (req, res, next) => {
    var validationRule;
    var file = req.files;
    if (file.length > 0) {
        validationRule = {}
    } else {
        validationRule = {
            "media": "required",
        }
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const postDetail = (req, res, next) => {
    const validationRule = {
        "type": "required",
        "post_id": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const imageDetail = (req, res, next) => {
    const validationRule = {
        "type": "required",
        "media_id": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const commentList = (req, res, next) => {
    const validationRule = {
        "comment_type": "required",
        "id": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const likeList = (req, res, next) => {
    const validationRule = {
        "like_type": "required",
        "id": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const userPostData = (req, res, next) => {
    const validationRule = {
        "type": "required",
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const userCategorizedPostData = (req, res, next) => {
    const validationRule = {
        "type": "required",
        "type_of_search": "required"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const userReport = (req, res, next) => {
    const validationRule = {
        "profileId": "required",
        "category": "required",
        "description": "required"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const postReport = (req, res, next) => {
    const validationRule = {
        "post_id": "required",
        "category": "required",
        "description": "required"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const createComment = (req, res, next) => {
    const validationRule = {
        "comment_type": "required",
        "comment": "required",
        "id": "required"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const likeDislike = (req, res, next) => {
    const validationRule = {
        "like_type": "required",
        "id": "required"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}
const readNotification = (req, res, next) => {
    const validationRule = {
        "notification_id": "required"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}


function check_single_image(image) {
    console.log(image);
    if (image) {
        return true;
    } else {
        return false
    }
}
module.exports = {
    check,
    register,
    login,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    socialLogin,
    changePassword,
    verifyPromocode,
    signin,
    updateUserProfileStatus,
    updateUserInfo,
    verifyEmailOtp,
    createContactUs,
    deleteAccountstep2,
    blockUnblockUser,
    followUnfollowUser,
    deletePost,
    userPostData,
    userReport,
    postReport,
    userCategorizedPostData,
    checkUser,
    postDetail,
    imageDetail,
    commentList,
    createPost,
    uploadMedia,
    createComment,
    likeDislike,
    likeList,
    readNotification
}