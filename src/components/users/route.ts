import UserController from "./userController";
import V from "./validation";
import LinkController from "../userLink/LinkController";

// path: "", method: "post", controller: "",
// validation: ""(can be array of validation),
// isEncrypt: boolean (default true), isPublic: boolean (default false)

export default [
    {
        path: "/upload/image",
        method: "post",
        controller: UserController.uploadImage,
        isEncrypt: false,
    },
    {
        path: "/upload/file",
        method: "post",
        controller: UserController.uploadFile,
        isEncrypt: false,
    },
    {
        path: "/profile/ids",
        method: "get",
        controller: UserController.idTypes,
        isEncrypt: false,
    },
    {
        path: "/profile/:id",
        method: "get",
        controller: UserController.getOtherProfile,
        isGuest: true,
    },
    {
        path: "/profile",
        method: "get",
        controller: UserController.getProfile,
        validation: V.hasUserValidation,
    },
    {
        path: "/profile",
        method: "post",
        controller: UserController.profileCompleted,
        validation: V.complateProfileValidation,
    },
    {
        path: "/profile/setting",
        method: "post",
        controller: UserController.profileSetting,
        validation: V.settingProfileValidation,
    },
    {
        path: "/location/list",
        method: "get",
        controller: UserController.locationList,
        isGuest: true,
    },
    {
        path: "/location",
        method: "get",
        controller: UserController.listOfUserLocation, //for mobile
        isGuest: true,
    },
    {
        path: "/location/group",
        method: "get",
        controller: UserController.groupListing,
        isGuest: true,
    },
    {
        path: "/location",
        method: "post",
        controller: UserController.updateLocationEveryHour,
        validation: [V.hasUserValidation, V.locationValidation],
    },
    {
        path: "/username",
        method: "get",
        controller: UserController.checkUserNameAvailability,
        validation: [V.hasUserValidation],
    },
    {
        path: "/profile/reference",
        method: "post",
        controller: UserController.submitUserReferences,
        validation: [V.hasUserValidation /*,V.refrenceValidation*/],
    },
    {
        path: "/profile/document",
        method: "post",
        controller: UserController.submitUserDocumentId,
        validation: [V.documentProfileValidation],
    },
    {
        path: "/profile/document/minor",
        method: "post",
        controller: UserController.submitUserDocumentMinor,
    },
    {
        path: "/profile/document/minor",
        method: "get",
        controller: UserController.userDocumentsMinor,
    },
    {
        path: "/profile/document/verify",
        method: "post",
        controller: UserController.requestUserDocumentOtpVerify,
    },
    {
        path: "/profile/document/minor/verify/:id/:status",
        method: "put",
        controller: UserController.userDocumentsMinorVerify,
        isEncrypt: false,
    },
    {
        path: "/profile/document/otp",
        method: "post",
        controller: UserController.requestUserDocumentOtp,
    },

    {
        path: "/trace/approve/:id",
        method: "put",
        controller: UserController.traceUserAccpted,
        validation: V.traceUserAccpted,
    },
    {
        path: "/trace/history/",
        method: "get",
        controller: UserController.historyList,
    },
    {
        path: "/trace/request/",
        method: "get",
        controller: UserController.requestList,
    },
    {
        path: "/trace/:id",
        method: "post",
        controller: UserController.traceUser,
        isEncrypt: false,
    },
    {
        path: "/trace/request/:id",
        method: "post",
        controller: UserController.addRequest,
    },
    {
        path: "/configurable/field",
        method: "get",
        controller: UserController.configurableFieldList,
    },
    {
        path: "/search",
        method: "get",
        controller: UserController.searchUser,
    },
    {
        path: "/google/direction",
        method: "post",
        controller: UserController.googleData,
        isEncrypt: false,
    },
    {
        path: "/google/nearbysearch",
        method: "post",
        controller: UserController.googleNearByData,
        isEncrypt: false,
    },
    {
        path: "/google/distancematrix",
        method: "post",
        controller: UserController.googleDistanceMatrixData,
        isEncrypt: false,
    },
    {
        path: "/inactive",
        method: "post",
        controller: UserController.userInactive,
        validation: V.inactiveValidation,
    },
    {
        path: "/verify/selfie",
        method: "post",
        controller: UserController.verifySelfie,
        validation: V.verifySelfie,
    },
    {
        path: "/home/address",
        method: "post",
        controller: UserController.homeAddressAdd,
        validation: V.homeAddressValidation,
    },
    {
        path: "/verification/selfie",
        method: "post",
        controller: UserController.processDataReq,
        // controller: UserController.detectFacesGCS,
        isEncrypt: false,
    },
    {
        path: "/listOfUser",
        method: "get",
        controller: UserController.listOfUser,
        isGuest: true,
    },
    {
        path: "/trace/delete/:id",
        method: "delete",
        controller: UserController.deleteTraceUser,
        isEncrypt: false,
    },
    {
        path: "/chat/category/list",
        method: "get",
        controller: UserController.chatCategoryList,
    },
    {
        path: "/delete/request",
        method: "post",
        controller: UserController.userDeleteRequest,
        validation: V.DeleteRequestValidation
    },
    {
        path: "/trust/list",
        method: "get",
        controller: UserController.trustList
    },
    {
        path: "/verification/selfie/web",
        method: "post",
        controller: UserController.processDataReqWeb,
        // controller: UserController.detectFacesGCS,
        isEncrypt: false,
    },
    {
        path: "/veriyFirebaseMobileOtp",
        method: "post",
        controller: UserController.veriyFirebaseMobileOtp,
        isPublic: true,
    },
    {
        path: "/exist/mobile",
        method: "post",
        controller: UserController.existMobile,
        isPublic: true,
    },
    // contact us
    {
        path: "/contactUs",
        method: "post",
        controller: UserController.contactToAdmin,
    },
    
    {
        path: "/verification",  // Face and figur verifiction for mobile
        method: "post",
        controller: UserController.FaceVerification, 
        Validation: V.VerificationValidation
    }   

];
