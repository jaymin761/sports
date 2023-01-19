import LinkController from "../userLink/LinkController";
import BusinessController from "./businessController";
import V from "./validation";

// path: "", method: "post", controller: "",
// validation: ""(can be array of validation),
// isEncrypt: boolean (default true), isPublic: boolean (default false)
// skipComponentId: boolean (default false)
// isGuest: boolean (default false)

export default [
    {
        path: "/upload/image",
        method: "post",
        controller: BusinessController.uploadImage,
        isEncrypt: false,
        skipComponentId: true,
    },
    {
        path: "/verify/document",
        method: "post",
        controller: BusinessController.verifyDocument,
        validation: [V.verifyDocumentValidation],
    },
    {
        path: "/setting",
        method: "post",
        controller: BusinessController.permissionSetting,
        validation: [V.settingValidation],
    },
    {
        path: "/advertisement",
        method: "post",
        controller: BusinessController.advertisement,
        validation: [V.advertisementValidation],
    },
    {
        path: "/upload/audio",
        method: "post",
        controller: BusinessController.uploadAudio,
        isEncrypt: false,
        skipComponentId: true,
    },
    {
        path: "/upload/video",
        method: "post",
        controller: BusinessController.uploadVideo,
        isEncrypt: false,
        skipComponentId: true,
    },
    {
        path: "/references",
        method: "post",
        controller: BusinessController.submitReferences,
    },
    {
        path: "/address",
        method: "post",
        controller: BusinessController.addAddress,
        // validation: [V.addressValidation],
        skipComponentId: true,
    },
    {
        path: "/address",
        method: "put",
        controller: BusinessController.updateAddress,
        // validation: [V.addressValidation],
        skipComponentId: true,
    },
    {
        path: "/address",
        method: "get",
        controller: BusinessController.listAddress,
        skipComponentId: true
    },
    {
        path: "/address/:id",
        method: "delete",
        isEncrypt: false,
        controller: BusinessController.deleteAddress,
    },
    {
        path: "/category/sub",
        method: "get",
        skipComponentId: true,
        controller: BusinessController.subCategoryList,
    },
    {
        path: "/category",
        method: "get",
        skipComponentId: true,
        controller: BusinessController.categoryList,
    },
    {
        path: "/profile",
        method: "get",
        controller: BusinessController.getProfile,
    },
    {
        path: "/cluster",
        method: "get",
        controller: BusinessController.getBusinessClusterApi,
        skipComponentId: true,
        isGuest: true
    },
    {
        path: "/friends/:id", // add friend with businessid
        method: "post",
        controller: LinkController.addFriendForBusiness,
        isEncrypt: false,
        skipComponentId: true,
    },{
        path: "/unlink", // delete friend with businessid
        method: "post",
        controller: LinkController.deleteFriendForBusiness,
        skipComponentId: true,
    },
    {
        path: "/friends/action", //list of friend with status
        method: "get",
        controller: LinkController.getBusinessFriendRequestAction,    
      },
    {
        path: "/",
        method: "post",
        controller: BusinessController.createBusiness,
        skipComponentId: true,
        validation: [V.createBusinessValidation],
    },
    {
        path: "/",
        method: "put",
        controller: BusinessController.updateBusiness,
        validation: [V.updateBusinessValidation],
    },
    {
        path: "/",
        method: "get",
        controller: BusinessController.listBusiness,
        skipComponentId: true,
    },
    {
        path: "/profile/:id",
        method: "get",
        controller: BusinessController.getBusiness,
        skipComponentId: true,
    },
    {
        path: "/mul/address",
        method: "post",
        controller: BusinessController.mulAddressAdd,
        validation: [V.addressValidation],
        skipComponentId: true,
    },
    {
        path: "/demoFile",
        method: "get",
        controller: BusinessController.demoFile,
        skipComponentId: true,
        isEncrypt: false,
        isPublic: false
    },
];