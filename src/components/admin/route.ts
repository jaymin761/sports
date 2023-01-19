import auth from "../../auth";
import authController from "./controller/authController";
import trustController from "./controller/trustController";
import categoryController from "./controller/categoryController";
import V from "./validation";
import traceController from "./controller/traceController";
import roleController from "./controller/roleController";
import configurableController from "./controller/configurableController";
import UserController from "../users/userController";
import eventController from "./controller/eventController";
import postController from "./controller/postController";
import validation from "./validation";
import chatCategoryController from "./controller/chatCategoryController";
import reportController from "../raiseIssue/reportController";
import vReport from "../raiseIssue/validation";
// path: "", method: "post", controller: "",
// validation: ""(can be array of validation), 
// isEncrypt: boolean (default true), isPublic: boolean (default false)

export default [
    {
        path: "/register",
        method: "post",
        controller: authController.adminRegister,
        validation: [V.adminregisterValidation],
        isPublic: true
    },
    {
        path: "/update",
        method: "put",
        controller: authController.adminUpdate,
        validation: [V.adminUpdateValidation],
    },
    {
        path: "/:id",
        method: "delete",
        controller: authController.adminDelete,
        // validation: [V.isSuperAdmin],        
    },
    {
        path: "/upload/image",
        method: "post",
        controller: authController.uploadImage,
        isPublic: true
    },
    {
        path: "/upload/file",
        method: "post",
        controller: authController.uploadFile,
        isPublic: true
    },
    {
        path: "/login/access",
        method: "post",
        controller: authController.loginAccess,
        validation: [V.isSuperAdmin, V.loginAccessValidation],
    },
    {
        path: "/login",
        method: "post",
        controller: authController.login,
        validation: V.loginValidation,
        isPublic: true
    },
    {
        path: "/password/change",
        method: "put",
        controller: authController.changePassword,
        validation: V.changePasswordValidation,
    },
    {
        path: "/",
        method: "get",
        controller: authController.adminList,
        // validation: V.isSuperAdmin,
    },
    {
        path: "/logout",
        method: "patch",
        controller: auth.logout,
        isEncrypt: false,
        isPublic: true
    },
    {
        path: "/profile",
        method: "get",
        controller: authController.getProfile,
    },
    {
        path: "/refreshToken",
        method: "get",
        controller: auth.getAdminRefreshToken,
        isPublic: true
    },
    {
        path: "/role/assign",
        method: "post",
        controller: authController.assignRole,
    },
    {
        path: "/category",
        method: "post",
        controller: categoryController.category,
        validation: V.categoryValidation,

    },
    {
        path: "/category/:id",
        method: "put",
        controller: categoryController.categoryUpdate,
        validation: V.categoryUpdateValidation,

    },
    {
        path: "/category/sub",
        method: "get",
        controller: categoryController.getSubCategory,
    },
    {
        path: "/category",
        method: "get",
        controller: categoryController.getCategory,
    },
    {
        path: "/category/:id",
        method: "delete",
        controller: categoryController.deleteCategory,
    },
    {
        path: "/subcategory/:id",
        method: "delete",
        controller: categoryController.deleteSubCategory,
    },
    {
        path: "/category/list",
        method: "get",
        controller: categoryController.categoryList,
    },
    {
        path: "/documents",
        method: "get",
        controller: authController.userDocumentList,
    },
    {
        path: "/id/verify",
        method: "put",
        controller: authController.userIdVerify,
        validation: V.userIdVerifyValidation,
    },
    {
        path: "/image/verify",
        method: "patch",
        controller: authController.userImageVerify,
        validation: V.userIdVerifyValidation,
    },
    {
        path: "/users",
        method: "get",
        controller: authController.userList,
    },
    {
        path: "/user/status",
        method: "patch",
        controller: authController.userStatusUpdate,
    },
    {
        path: "/user/edit",
        method: "get",
        controller: authController.userEdit,
    },
    {
        path: "/user/update",
        method: "patch",
        controller: authController.userUpdate,
        validation: V.userUpdate,
    },
    {
        path: "/user/profile",
        method: "patch",
        controller: authController.userProfileUpdate,
        // validation: V.userValidation,

    },
    {
        path: "/image/upload",
        method: "post",
        controller: authController.imageUpload,
    },
    {
        path: "/file/upload",
        method: "post",
        controller: authController.uploadFile,
    },
    {
        path: "/trust/list",
        method: "get",
        controller: trustController.trustList,
    },
    {
        path: "/trust",
        method: "post",
        controller: trustController.trust,
        validation: V.trustValidation,
    },
    {
        path: "/trust/:id",
        method: "put",
        controller: trustController.trustUpdate,
        validation: V.trustUpdateValidation,
    },
    {
        path: "/user/trust/:id",
        method: "put",
        controller: trustController.userTrustUpdate,
        validation: V.trustUserValidation,
    },
    {
        path: "/trace/request/approve/:id",
        method: "put",
        controller: traceController.approveRequest,
        validation: V.requestApprove
    },
    {
        path: "/trace/request/pending",
        method: "get",
        controller: traceController.listRequestPending,
    },
    {
        path: "/trace/request",
        method: "get",
        controller: traceController.listRequestApprove,
    },
    {
        path: "/role",
        method: "post",
        controller: roleController.roleAdd,
        validation: V.roleValidation,
    },
    {
        path: "/role/:id",
        method: "put",
        controller: roleController.roleUpdate,
    },
    {
        path: "/role",
        method: "get",
        controller: roleController.roleList,
    },
    {
        path: "/configurable/field",
        method: "put",
        controller: configurableController.configurableFieldAdd,
    },
    {
        path: "/configurable/field",
        method: "get",
        controller: configurableController.configurableFieldList,
    },
    {
        path: "/dashboard",
        method: "get",
        controller: authController.dashboard,
    },
    {
        path: "/setting",
        method: "put",
        controller: authController.setting,
        validation: V.setting
    },
    {
        path: "/business/list",
        method: "get",
        controller: authController.listBusiness
    },
    {
        path: "/business/approve/:id",
        method: "put",
        controller: authController.businessApproved,
        validation: V.businessRequestApprove
    },
    {
        path: "/business/:id",
        method: "get",
        controller: [authController.userBusinessList, authController.methodAllowance],
    },
    {
        path: "/business/:id",
        method: "put",
        controller: authController.businessUpdate,
    },
    {
        path: "/user/rejected/:id",
        method: "put",
        controller: authController.userRejected
    },
    {
        path: "/business/addresses",
        method: "post",
        controller: authController.businessAddressAdd,
        validation: V.addressValidation
    },
    {
        path: "/business/address",
        method: "patch",
        controller: authController.businessAddressUpdate,
        validation: V.addressUpdateValidation
    },
    {
        path: "/business/address/:id",
        method: "delete",
        controller: authController.deleteBusinessAddress,
    },
    {
        path: "/business/address/:id",
        method: "get",
        controller: authController.businessAddressList,
    },
    {
        path: "/employee/:id",
        method: "get",
        controller: authController.employeeList,
    },
    {
        path: "/employee/:id",
        method: "get",
        controller: authController.employeeList,
    },
    {
        path: "/link/:id",
        method: "get",
        controller: authController.linkList,
    },
    {
        path: "/businesses/lists/:id",
        method: "get",
        controller: authController.businessList,
    },
    {
        path: "/business/mul/address",
        method: "post",
        controller: authController.MulAddressAdd,
        validation: V.mulAddressValidation
    },
    {
        path: "/inactive/:id",
        method: "put",
        controller: authController.adminStatus,
    },
    {
        path: "/events",
        method: "get",
        controller: eventController.eventList,
    },
    {
        path: "/events/user",
        method: "get",
        controller: eventController.userEventList,
    },
    {
        path: "/event/block",
        method: "get",
        controller: eventController.blockEventList,
    },
    {
        path: "/event/disable/:id",
        method: "put",
        controller: eventController.updateEventStatus,
    },
    {
        path: "/event/delete/:id",
        method: "delete",
        controller: eventController.deleteEvent,
    },
    {
        path: "/event/update",
        method: "put",
        controller: eventController.eventUpdate
    },
    {
        path: "/event/user/block/:id",
        method: "get",
        controller: eventController.blockEventListUser
    },
    {
        path: "/user/pending/document",
        method: "get",
        controller: authController.pendingDocument
    },
    {
        path: "/user/document/approve",
        method: "put",
        controller: authController.approveDocument,
        validation: V.documentApproveValidation
    },
    {
        path: "/user/trace/history/:id",
        method: "get",
        controller: traceController.traceHistory
    },
    {
        path: "/socials/allPost",
        method: "get",
        controller: postController.allPostList
    },
    {
        path: "/user/socials/post/:id",
        method: "get",
        controller: postController.postList
    },
    {
        path: "/socials/post/comment/:id",
        method: "get",
        controller: postController.commentList
    },
    {
        path: "/socials/comment/remove",
        method: "post",
        controller: postController.removeComment 
    },
    {
        path: "/socials/post/report/:id",
        method: "get",
        controller: postController.postReportList
    },
    {
        path: "/post/disable/:id",
        method: "put",
        controller: postController.updatePostStatus
    },
    {
        path: "/post/update/:id",
        method: "put",
        controller: postController.postUpdate,
        validation: V.socialMediaAddValidation
    },
    {
        path: "/post/delete/:id",
        method: "post",
        controller: postController.postDelete,
        validation: V.PostDeleteValidation
    },
    {
        path: "/trace/list/:id",
        method: "get",
        controller: traceController.traceUserList
    },
    {
        path: "/trace/delete/:id",
        method: "delete",
        controller: traceController.traceUserDelete
    },
    {
        path: "/chat/category/",
        method: "post",
        controller: chatCategoryController.chatCategory,
        // validation: V.ChatCategoryValidation
    },
    {
        path: "/chat/category/",
        method: "get",
        controller: chatCategoryController.getCategory,
    },
    {
        path: "/chat/category/list",
        method: "get",
        controller: chatCategoryController.getSubCategory,
    },
    {
        path: "/chat/category/:id",
        method: "delete",
        controller: chatCategoryController.deleteSubCategory,
    },
    //raise an issue (report)
    {
        path: "/report",
        method: "get",
        controller: reportController.listReport,
    },
    {
        path: "/report/reply",
        method: "post",
        controller: authController.reportReplyToUser,
    },
    {
        path: "/report/subject",
        method: "get",
        controller: reportController.getAllSubject,
    },
    {
        path: "/report/subject",
        method: "post",
        controller: reportController.createSubject,
        validation: [vReport.subjectValidation]
    },
    {
        path: "/report/subject/:id",
        method: "put",
        controller: reportController.updateSubject,
    },
    {
        path: "/report/subject/:id",
        method: "delete",
        controller: reportController.deleteSubject,
    },
    {
        path: "/report/:id",
        method: "get",
        controller: reportController.singleReport,
    },
    {
        path: "/report/:id",
        method: "delete",
        controller: reportController.deleteReport,
        isEncrypt:false
    }, 
    {
        path: "/user/:id",
        method: "delete",
        controller: authController.userDelete,
        isEncrypt:false
    }, 
    {
        path: "/delete/request",
        method: "get",
        controller: authController.deleteRequestList,
        isEncrypt:false
    }, 
    {
        path: "/business/:id",
        method: "delete",
        controller: authController.businessDelete,
        isEncrypt:false
    }, 
    {
        path: "/request/cancel/:id",
        method: "put",
        controller: authController.requestCancel,
        isEncrypt:false
    }, 
    {
        path: "/user/idVerifyList",
        method: "get",
        controller: authController.userIdVerifyList,
    }, 
    {
        path: "/user/idVerifyUpdateList",
        method: "get",
        controller: authController.verifyUpdateDocumentList,
    },
    {
        path: "/user/isMark",
        method: "put",
        controller: authController.userIsMark,
    },
    {
        path: "/idVerifyCountList",
        method: "get",
        controller: authController.idVerifyCountList,
    },
    {
        path: "/idVerifyCountUpdate",
        method: "put",
        controller: authController.idVerifyCountUpdate,
    }
    
]; 