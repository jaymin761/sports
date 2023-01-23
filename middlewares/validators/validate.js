const Validator = require('validatorjs');
const mongoose = require('mongoose');
const { createErrorResponse } = require('../../helpers/responseweb');

const validatorUtil = (body, rules, customMessages, callback) => {
    const validation = new Validator(body, rules, customMessages);
    validation.passes(() => callback(null, true));
    validation.fails(() => callback(validation.errors.errors, false));
};

const validatorUtilWithCallback = (rules, customMessages, req, res, next) => {
    const validation = new Validator(req.body, rules, customMessages);
    validation.passes(() => next());
    validation.fails(() => createErrorResponse(req, res, {
        errors: formattedErrors(validation.errors.errors)
    }));
};
Validator.registerAsync('exist', function (value, attribute, req, passes) {
    if (!attribute) throw new Error('Specify Requirements i.e fieldName: exist:table,column');

    let attArr = attribute.split(",");
    if (attArr.length !== 2) throw new Error(`Invalid format for validation rule on ${attribute}`);
    const { 0: table, 1: column } = attArr;

    let msg = `${column} already in use`
   
    mongoose.model(table).findOne({ [column]: value}).then((result) => {
        if (result) {
            passes(false, msg);
        } else {
            passes();
        }
    }).catch((err) => {
        console.log(err);
        passes(false, err);
    });
});
function formattedErrors(err) {
    let transformed = {};
    Object.keys(err).forEach(function (key, val) {
        transformed[key] = err[key][0];
    })
    return transformed
}

module.exports = {
    validatorUtil,
    validatorUtilWithCallback
}