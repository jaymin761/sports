import {AppStrings} from "../../../utils/appStrings";

const traceRequest = require("../../users/models/requestModel");
const User = require("../../users/models/userModel");
const Role = require("../models/role");
import {NextFunction, query, Request, Response} from "express";
import commonUtils, {fileFilter, fileStorage} from "../../../utils/commonUtils";
import mongoose from "mongoose";

async function roleAdd(req: Request, res: Response) {

    let role = await new Role({
        name: req.body.name,
        permission:{
            users: req.body?.users,
            category: req.body?.category,
            sub_admin: req.body?.sub_admin,
            trust_level: req.body?.trust_level,
            roles: req.body?.roles,
            trace_request: req.body?.trace_request,
            trace_history: req.body?.trace_history,
            configurable_fields: req.body?.configurable_fields,
            business_request: req.body?.business_request
        }
    })

    await role.save();

    return commonUtils.sendSuccess(req, res, {id:role._id});
}

async function roleUpdate(req: Request, res: Response) {
    let roleId = req.params.id
    const role = await Role.findById(roleId);
    if (!role)
        return commonUtils.sendError(req, res, {message:AppStrings.ROLE_NOT_FOUND})

    role.name = req.body.name || role.name;
    role.permission.users = req.body.users || role.permission.users;
    role.permission.category = req.body.category || role.permission.category;
    role.permission.sub_admin = req.body.sub_admin || role.permission.sub_admin;
    role.permission.trust_level = req.body.trust_level || role.permission.trust_level;
    role.permission.roles = req.body.roles || role.permission.roles;
    role.permission.trace_request = req.body.trace_request || role.permission.trace_request;
    role.permission.trace_history = req.body.trace_history || role.permission.trace_history;
    role.permission.configurable_fields = req.body.configurable_fields || role.permission.configurable_fields;
    role.permission.business_request = req.body.business_request || role.permission.business_request;

    await role.save();
    return commonUtils.sendSuccess(req, res, {message: AppStrings.UPDATE});

}

async function roleList(req: Request, res: Response) {
    let role = await Role.find().sort({createdAt: -1});
    if (!role)
        return commonUtils.sendError(req, res, {message:AppStrings.ROLE_NOT_FOUND})

    return commonUtils.sendSuccess(req, res, role);
}

export default {
    roleAdd,
    roleUpdate,
    roleList
}
