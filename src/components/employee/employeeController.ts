import {AppStrings} from "../../utils/appStrings";
import {Response} from "express";
import commonUtils, { fileFilter } from "../../utils/commonUtils";
import moment from 'moment';
import mongoose from "mongoose";
import {AvailableRequestStatus, FriendStatus, NotificationType} from "../../utils/enum";
import agenda from "../../utils/schedule";

const User = require('../users/models/userModel');
const Business = require('../business/models/businessModel');
const Address = require('../business/models/addressModel');
const Employee = require('./employeeModel');

const multer = require("multer");

//TODO::  add null condition with or operator || skip self id too
const getusers = async (req: any, res: Response) => {
    try {
        const userId = req.headers.userid as string;
        const businessId = req.headers.businessid as string;
        const pipeline: any = [
            {
                $match: {
                    _id: {$ne: new mongoose.Types.ObjectId(userId)},
                    $or: [
                        {employee: {$exists: false}},
                        {employee: {$eq: null}},
                    ],
                }
            },
            {$sort: {createdAt: -1}},
            {
                $lookup: {
                    from: "friends",
                    let: {recipient: "$_id"},
                    pipeline: [
                        {
                            "$match": {
                                "$expr": {
                                    $and: [
                                        {"$eq": ["$businessId", new mongoose.Types.ObjectId(businessId)]},
                                        {"$eq": ["$recipient", "$$recipient"]},
                                        {"$eq": ["$status", FriendStatus.FRIENDS]},
                                    ]
                                }
                            }
                        },
                    ],
                    as: "businesLink"
                }
            },
            {$unwind: "$businesLink"},
            {
                $lookup: {
                    from: "employees",
                    let: {empId: "$_id"},
                    pipeline: [
                        {
                            "$match": {
                                "$expr": {
                                    $and: [
                                        {"$eq": ["$businessId", new mongoose.Types.ObjectId(businessId)]},
                                        {"$eq": ["$employeeId", "$$empId"]},
                                    ]
                                }
                            }
                        },
                    ],
                    as: "employeeLink"
                }
            },
            {
                $unwind: {
                    path: "$employeeLink",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    profilePic: "$image.profilePic",
                    name: "$userName",
                    fullName: "$fullName",
                    isBusinessLink: "$businesLink.status",
                    employeeStatus: {$cond: {if: "$employeeLink", then: "$employeeLink.status", else: 0}},
                    permissions: "$permissions"
                    // isEquivalent: { $eq: [ "employee" ] }
                },
            },
        ];

        const User_ = await User.aggregate(pipeline);
        return commonUtils.sendSuccess(req, res, User_)
    } catch (error) {
        console.log(error)
        return commonUtils.sendError(req, res, AppStrings.SOMETHING_WENT_WRONG)
    }

}

const addEmployee = async (req: any, res: Response) => {
    try {

        const user_id = req.headers.userid;

        
        let user = await User.findById(user_id);
        if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);

        const businessId = req.headers.businessid;
        // console.log(businessId)
        const business = await Business.findById(businessId);
        if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

        let employeeId = req.body.employeeId;
        let employee_ = await User.findById(employeeId);
        if (!employee_) return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);

        let employeeCount = await Employee.find({businessId: businessId}).count()

        
        const start_time = req.body.workHours.startTime;
        console.log();
        
        const end_time = req.body.workHours.endTime;
        // const start_time_ = moment(`${start_time}`, 'hh:mm a').toISOString();
        // const end_time_ = moment(`${end_time}`, 'hh:mm a').toISOString();

        // console.log(moment(start_time, 'YYYY-MM-DD hh:mm a').format( 'hh:mm a'));
        

        if (moment(start_time, 'YYYY-MM-DD hh:mm a').isAfter(moment(end_time, 'YYYY-MM-DD hh:mm a'))) return commonUtils.sendError(req, res, {message: AppStrings.TIME_INVALID}, 422);

        let employeeData = await Employee.findOne({employeeId: employeeId, status: [1, 2]});

        if (employeeData) {
            return commonUtils.sendError(req, res, {message: AppStrings.EMPLOYEE_ALREADY_ADDED})
        }

        let address = await Address.find({businessId: new mongoose.Types.ObjectId(businessId)});

        if (!address) return commonUtils.sendError(req, res, {message: AppStrings.ADDRESS_NOT_FOUND})
        
        const days = ['Su','Mo','Tu','We','Th','Fr','Sa']
        const workDays = req.body?.workDays && req.body?.workDays.length ? req.body?.workDays.filter((a:any) => days.includes(a)) : null;

        if (employeeCount >= business.limitedEmployee){

            return commonUtils.sendError(req, res, {message:AppStrings.YOUR_LIMIT})
        }
        
        const employee = new Employee({
            userId: user_id,
            businessId: businessId,
            employeeId: employeeId,
            businessBranch: req.body.businessBranch,
            designation: req.body.designation,
            workHours: {
                startTime: start_time,
                endTime: end_time
            },
            authorized: 0
        })
        if(workDays) employee.workDays = workDays;

        await employee.save();

        employeeData = {
            employee: {
                _id: employee._id,
                businessId: businessId,
                employeeId: employee._id,
                designation: employee.designation,
                workHours: {
                    startTime: employee.workHours.startTime,
                    endTime: employee.workHours.endTime
                }
            }
        }
        if(workDays) employeeData.workDays = workDays;

        await User.findByIdAndUpdate(user_id, employeeData)

        // notify code
        const pushToken = await User.getPushToken(employeeId); //get pushtoken of requestId user
        await commonUtils.sendNotification({
            notification:{
                title:AppStrings.EMPLOYEE_REQUEST.TITLE,
                body:AppStrings.EMPLOYEE_REQUEST.BODY.replace(':name',user.fullName).replace(':business',business?.name)
            },
            data:{
                employeeId: employeeId,
                senderId: user_id,businessId: businessId.toString(),
                type:NotificationType.EMPLOYEE_REQUEST.toString()
            }
        },pushToken,employeeId.toString())
        // notify code end

        return commonUtils.sendSuccess(req, res, employee);        

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG});
    }

}

const listEmployee = async (req: any, res: Response) => {
    let businessId = "";
    if(req.query.businessId){
        businessId = req.query.businessId as string;
    }else{
        businessId = req.headers.businessid as string;
    }
    const addressId = req.query.addressId?.length ? req.query.addressId : null;

    try {
        const business = await Business.findById(businessId).populate({
            path: 'userId',
        })
        
        if (!business) return commonUtils.sendError(req, res, {messsage: AppStrings.BUSINESS_NOT_FOUND});

        const address = await Address.findOne({businessId: new mongoose.Types.ObjectId(businessId), primaryAddress:true })        

        const selfObj = {
            'userName': business?.userId.userName,
            'fullName': business?.userId.fullName,
            'image': business?.userId.image.profilePic ?? null,
            'authorized': 1,
            'userId': business?.userId?._id?.toString() ?? "",
            'creator': 1,
            'trustLevel': business?.userId?.averageTrust,
            'designation':business?.designation,
            'workHours':{
                "startTime":business?.workHours?.startTime,
                "endTime":business?.workHours?.endTime
            },
            'businessBranch':address?._id,
            'businessName':address?.businessName,
            'businessLocationName':address?.businessLocationName,
            'permissions': business?.userId?.permissions
        }
        let filter:any={
            businessId: new mongoose.Types.ObjectId(businessId)
        }
        if (addressId) {
            filter = {
                ...filter,
                'businessBranch': new mongoose.Types.ObjectId(addressId)
            }
        }   
        
        const pipeline = [
            {
                $match:
                    {...filter ,status: {$in: [1, 2, 3]}}
            },
            {$sort: {createdAt: -1}},
            {
                $lookup: {
                    from: "users",
                    localField: "employeeId",
                    foreignField: "_id",
                    as: "userObj",
                },
            },
            {
                $unwind: {path: '$userObj'}
            },
            {
                $lookup: {
                    from: 'addresses',
                    let: {businessId: "$_id"},
                    // localField: '_id',
                    // foreignField: 'businessId',
                    pipeline: [{
                        $match: {
                            $expr: {
                            $and: [
                                {"$eq": ["$_id",  new mongoose.Types.ObjectId(addressId)]},
                                {"$eq": ["$businessId", "$$businessId"]},
                            ]}
                        }
                    }],
                    as: 'addressObj',
                }
            },
            {
                $unwind: {path: "$addressObj", preserveNullAndEmptyArrays: true},
            },
            {
                $project: {
                    _id: 1,
                    'userId': "$userObj._id",
                    'userName': "$userObj.userName",
                    'fullName': "$userObj.fullName",
                    'image': "$userObj.image.profilePic",
                    'authorized': "$authorized",
                    'available': "$available",
                    'trustLevel': "$userObj.averageTrust",
                    'status': "$status",
                    'businessId':"$businessId",
                    'businessBranch': "$businessBranch",
                    'businessName': "$addressObj.businessName",
                    'businessLocationName': "$addressObj.businessLocationName",
                    'designation': "$designation",
                    'workHours': "$workHours",
                    'workDays': "$workDays",
                    'permissions': "$userObj.permissions",
                    'rejectReason': "$rejectReason",
                    'unavailableRequest': {
                        'requestStatus': "$requestStatus",
                        'startDate': "$startDate",
                        'endDate': "$endDate",
                        'reason': "$reason",
                    },
                },
            },
        ];

        const employees = await Employee.aggregate(pipeline);
        employees.unshift(selfObj)
        return commonUtils.sendSuccess(req, res, employees);
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {error: AppStrings.SOMETHING_WENT_WRONG});
    }
}

const listBusinessEmployee = async (req: any, res: Response) => {
    const userId = req.headers.userid;
    try {
        const employee = await Employee.find({employeeId: userId})

        if (!employee) return commonUtils.sendError(req, res, {messsage: AppStrings.EMPLOYEE_NOT_FOUND});

        const pipeline = [
            {
                $match:
                    {employeeId: new mongoose.Types.ObjectId(userId)}
            },
            {$sort: {createdAt: -1}},
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userObj",
                },
            },
            {
                $unwind: {path: '$userObj'},
            },
            {
                $lookup: {
                    from: "businesses",
                    localField: "businessId",
                    foreignField: "_id",
                    as: "businessObj",
                },
            },
            {
                $unwind: {path: '$businessObj'}
            },
            {
                $lookup: {
                    from: "addresses",
                    localField: "businessBranch",
                    foreignField: "_id",
                    as: "addressObj",
                },
            },
            {
                $unwind: {path: '$addressObj'}
            },
            {
                $project: {
                    _id: 1,
                    'businessId': "$businessObj._id",
                    'fullName': "$userObj.fullName",
                    'image': "$businessObj.image",
                    'authorized': "$authorized",
                    'available': "$available",
                    'businessBranch': "$businessBranch",
                    'businessName': "$businessObj.name",
                    'businessLocationName': "$addressObj.businessLocationName",
                    'status': "$status",
                    'designation': "$designation",
                    'workHours': "$workHours",
                    'workDays': "$workDays",
                    'rejectReason': "$rejectReason",
                    'unavailableRequest': {
                        'requestStatus': "$requestStatus",
                        'startDate': "$startDate",
                        'endDate': "$endDate",
                        'reason': "$reason",
                    },
                    'permissions': {
                        $cond: {
                            if: "$businessObj.permissions", then: "$businessObj.permissions", else: {
                                acceptMessage: {
                                    public: true,
                                    contact: true,
                                    marketing: true
                                },
                                visibility: {
                                    picture: true,
                                    status: true,
                                    post: true
                                },
                                location: {
                                    whileUsingApp: false,
                                    withLinkedContact: false,
                                    withPublic: true,
                                    notShared: false,
                                },
                            }
                        }
                    }
                },
            },
        ];

        const employees = await Employee.aggregate(pipeline);
        return commonUtils.sendSuccess(req, res, employees);
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {error: AppStrings.SOMETHING_WENT_WRONG});
    }
}

const listOfEmployeeForHome = async (req: any, res: Response) => {
    const businessId = req.headers.businessid;

    const business = await Business.findById(businessId).populate({
        path: 'userId',
    })
    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND});

    const selfObj = {
        'userId': business?.userId._id,
        'userName': business?.userId.userName,
        'fullName': business?.userId.fullName,
        'image': business?.userId.image.profilePic ?? null,
        'authorized': 1,
        'creator': 1,
        'permissions': business?.userId?.permissions,
        'trustLevel': business?.userId?.averageTrust,
    }

    try {
        const pipeline = [
            {$match: {businessId: new mongoose.Types.ObjectId(businessId), authorized: 1}},
            {$sort: {createdAt: -1}},
            {
                $lookup: {
                    from: "users",
                    localField: "employeeId",
                    foreignField: "_id",
                    as: "userObj",
                },
            },
            {
                $unwind: {path: '$userObj'}
            },
            {
                $project: {
                    _id: 0,
                    'userId': "$userObj._id",
                    'userName': "$userObj.userName",
                    // @ts-ignore
                    'fullName': {$cond: {if: "$userObj.fullName", then: "$userObj.fullName", else: null}},
                    'image': "$userObj.image.profilePic",
                    'authorized': "$authorized",
                    'permissions': "$userObj.permissions",
                    // @ts-ignore
                    'location': {$cond: {if: "$userObj.address.location", then: "$userObj.address.location", else: null}}
                }
            }
        ];

        const employees = await Employee.aggregate(pipeline);
        employees.unshift(selfObj)
        return commonUtils.sendSuccess(req, res, employees);
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {error: AppStrings.SOMETHING_WENT_WRONG});
    }
}


const deleteEmployee = async (req: any, res: Response) => {
    let userId = req.headers.userid;
    const businessId = req.headers.businessid;
    const employeeId = req.params.id;

    const business = await Business.findOne({userId: userId, _id: businessId});
    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND})

    const employees = await Employee.findOne({userId: userId, _id: employeeId, businessId: businessId});
    if (!employees) return commonUtils.sendError(req, res, {message: AppStrings.NOT_PERMISSION})

    const employee = await Employee.findByIdAndDelete(employeeId);
    if (!employee) return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);

    await User.updateMany({'employee._id': employeeId}, {
        $set: {
            employee: null
        }
    })

    return commonUtils.sendSuccess(req, res, {message: AppStrings.DELETE})
}

const authorizedEmployee = async (req: any, res: Response) => {
    const businessId = req.headers.businessid;
    let userId = req.headers.userid;
    let employeeId = req.params.id;

    const business = await Business.findOne({userId: userId, _id: businessId});
    if (!business)
        return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND})

    const employee = await Employee.findOne({
        _id: new mongoose.Types.ObjectId(employeeId),
        userId: new mongoose.Types.ObjectId(userId)
    })
    if (!employee)
        return commonUtils.sendError(req, res, {message: AppStrings.NOT_PERMISSION})

    employee.authorized = employee.authorized == 0 ? 1 : 0;
    await employee.save();

    return commonUtils.sendSuccess(req, res, {message: AppStrings.STATUS_UPDATED_SUCCESSFULLY})
}

const availableEmployee = async (req: any, res: Response) => {
    const businessId = req.headers.businessid;
    const type = req.headers.type ?? 0

    let userId = req.headers.userid;
    let employeeId = req.params.id;
    let date = moment(new Date());
    let start_ = req.body.startDate;
    let start = moment(start_);
    let end_ = req.body.endDate;
    let end = moment(end_);

    try {
        if(start_ || end_){
            if (start <= date) {
                return commonUtils.sendError(req, res, {message: AppStrings.AFTER_TODAY})
            }
    
            if (end < start) {
                return commonUtils.sendError(req, res, {message: AppStrings.AFTER_START_DATE})
            }
        }

        const business = await Business.findOne(type == 1 ? {_id: businessId} : {userId: userId, _id: businessId});
        // console.log(business);
        
        if (!business)
            return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND})

        const employee = await Employee.findOne(type == 1 ? {
            _id: new mongoose.Types.ObjectId(employeeId),
            employeeId: new mongoose.Types.ObjectId(userId),
            available: 1
        } : {
            _id: new mongoose.Types.ObjectId(employeeId),
            userId: new mongoose.Types.ObjectId(userId),
            available: 1
        })
        console.log(employee)
        if (!employee)
            return commonUtils.sendError(req, res, {message: AppStrings.EMPLOYEE_NOT_FOUND})

        if (employee) {
            // employee.available = type == 1 ? 1 : req.body.available
            // employee.requestStatus = type == 1 ? AvailableRequestStatus.PENDING : AvailableRequestStatus.ACCEPTED
            employee.businessBranch = req.body.businessBranch
            employee.designation = req.body.designation
            employee.authorized = req.body.authorized
        }
        if(employee && req.body.available == 0){
            employee.reason = req.body.reason
            employee.startDate = start.startOf('day')
            employee.endDate = end.endOf('day')
            employee.requestStatus = type == 0 ? AvailableRequestStatus.ACCEPTED : AvailableRequestStatus.PENDING            
        }
        
        if(req.body.workHours){
            const start_time = req.body.workHours.startTime;
            const end_time = req.body.workHours.endTime;
            // const start_time_ = moment(`${start_time}`, 'hh:mm a').toISOString();
            // const end_time_ = moment(`${end_time}`, 'hh:mm a').toISOString();
    
            if (moment(start_time, 'YYYY-MM-DD hh:mm a').isAfter(moment(end_time, 'YYYY-MM-DD hh:mm a'))) return commonUtils.sendError(req, res, {message: AppStrings.TIME_INVALID}, 422);
            employee.workHours = {
                startTime: start_time,
                endTime: end_time
            }    
        }
        
        if(req.body.workDays){
            const days = ['Su','Mo','Tu','We','Th','Fr','Sa']
            const workDays = req.body?.workDays.filter((a:any) => days.includes(a));
            employee.workDays = workDays;
        }

        await employee.save();

        if (type == 1) {
            // notify to business owner
            // notify code
            const pushToken = await User.getPushToken(business.userId); //get pushtoken of requestId user
            const emp = await User.findById(employee.employeeId); //get pushtoken of requestId user
            await commonUtils.sendNotification({
                notification:{
                    title:AppStrings.EMPLOYEE_AVAILABILITY_REQUEST.TITLE,
                    body:AppStrings.EMPLOYEE_AVAILABILITY_REQUEST.BODY.replace(':name',emp.fullName).replace(':business',business?.name)
                },
                data:{
                    employeeId: employee.employeeId.toString(),
                    businessId: businessId.toString(),senderId:employee.employeeId.toString(),
                    type:NotificationType.EMPLOYEE_AVAILABILITY_REQUEST.toString()
                }
            },pushToken,business.userId.toString())
            // notify code end
        }

        await agenda.start();
        await agenda.schedule(employee.startDate, "unavailable", {employee_id: employee._id});
        await agenda.schedule(employee.endDate, "available", {employee_id: employee._id});

        return commonUtils.sendSuccess(req, res, {message: AppStrings.EMPLOYEE_UNAVAILABLE})
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }

}

const approvedEmployee = async (req: any, res: Response) => {
    const requestId = req.params.id;
    let userId = req.headers.userid;

    try {
        let employee = await Employee.findOne({
            _id: new mongoose.Types.ObjectId(requestId),
            employeeId: new mongoose.Types.ObjectId(userId),
        })

        if (!employee)
            return commonUtils.sendError(req, res, {message: AppStrings.EMPLOYEE_NOT_FOUND})

        const pushToken = await User.getPushToken(employee.userId); //get pushtoken of business user
        const {fullName} = await User.findById(userId);
        const business = await Business.findById(employee.businessId);

        if (req.body.status == 2) {
            employee.status = req.body.status;
            employee.requestStatus = AvailableRequestStatus.ACCEPTED
            await employee.save();

            // notify code ==> notify to business (employee)
            await commonUtils.sendNotification({
                notification:{
                    title:AppStrings.EMPLOYEE_REQUEST_APPROVE.TITLE,
                    body:AppStrings.EMPLOYEE_REQUEST_APPROVE.BODY.replace(':name',fullName).replace(':designation',employee.designation).replace(':business',business?.name)
                },
                data:{
                    employeeId: userId, senderId: userId.toString(), businessId: employee.businessId.toString(),
                    type:NotificationType.EMPLOYEE_REQUEST_APPROVE.toString()
                }
            },pushToken,employee.userId.toString())
            // notify code end

            return commonUtils.sendSuccess(req, res, {message: AppStrings.STATUS_ACCEPTED})

        } else if (req.body.status == 3) {
            employee.status = req.body.status;
            employee.requestStatus = AvailableRequestStatus.REJECTED
            employee.rejectReason = req.body.rejectReason
            await employee.save();

            // notify code ==> notify to business (employee)
            await commonUtils.sendNotification({
                notification:{
                    title:AppStrings.EMPLOYEE_REQUEST_REJECT.TITLE,
                    body:AppStrings.EMPLOYEE_REQUEST_REJECT.BODY.replace(':name',fullName).replace(':designation',employee.designation).replace(':business',business?.name)
                },
                data:{
                    employeeId: userId, senderId: userId.toString(), businessId: employee.businessId.toString(),
                    type:NotificationType.EMPLOYEE_REQUEST_REJECT.toString()
                }
            },pushToken,employee.userId.toString())
            // notify code end

            return commonUtils.sendSuccess(req, res, {message: AppStrings.STATUS_REJECTED})
        }
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }

}

const availableEmployeeAccept = async (req: any, res: Response) => {
    const requestId = req.params.id;
    const employeeId = req.params.employeeId;
    const status = req.params.status;

    try {
        let employee = await Employee.findOne({
            _id: new mongoose.Types.ObjectId(requestId),
            employeeId: new mongoose.Types.ObjectId(employeeId),
        })

        if (!employee) return commonUtils.sendError(req, res, {message: AppStrings.EMPLOYEE_NOT_FOUND})

        const pushToken = await User.getPushToken(employeeId); //get pushtoken of requestId user
        const business = await Business.findById(employee.businessId)

        if (status == 1) {
            employee.requestStatus = AvailableRequestStatus.ACCEPTED
            await employee.save();

            //notify to employee
            // notify code
            await commonUtils.sendNotification({
                notification:{
                    title:AppStrings.EMPLOYEE_AVAILABILITY_APPROVE.TITLE,
                    body:AppStrings.EMPLOYEE_AVAILABILITY_APPROVE.BODY.replace(':business',business?.name)
                },
                data:{
                    employeeId: employeeId, businessId: employee.businessId.toString(),
                    senderId: business.userId.toString(),
                    type:NotificationType.EMPLOYEE_AVAILABILITY_APPROVE.toString()
                }
            },pushToken,employeeId.toString())
            // notify code end
            
            return commonUtils.sendSuccess(req, res, {message: AppStrings.STATUS_AVAIlABLE_ACCEPTED})
        } else{
            employee.requestStatus = AvailableRequestStatus.REJECTED
            await employee.save();
            
            // notify code
            await commonUtils.sendNotification({
                notification:{
                    title:AppStrings.EMPLOYEE_AVAILABILITY_REJECT.TITLE,
                    body:AppStrings.EMPLOYEE_AVAILABILITY_REJECT.BODY.replace(':business',business?.name)
                },
                data:{
                    employeeId: employeeId, businessId: employee.businessId.toString(),
                    senderId: business.userId.toString(),
                    type:NotificationType.EMPLOYEE_AVAILABILITY_REJECT.toString()
                }
            },pushToken,employeeId.toString())
            // notify code end

            return commonUtils.sendSuccess(req, res, {message: AppStrings.STATUS_AVAIlABLE_REJECTED})

        }
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }

}

export default {
    getusers,
    addEmployee,
    listEmployee,
    deleteEmployee,
    authorizedEmployee,
    listOfEmployeeForHome,
    availableEmployee,
    availableEmployeeAccept,
    approvedEmployee,
    listBusinessEmployee
}
