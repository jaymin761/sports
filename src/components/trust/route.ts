import trustController from "./trustController";
import V from "./validation";

// path: "", method: "post", controller: "",
// validation: ""(can be array of validation),
// isEncrypt: boolean (default true), isPublic: boolean (default false)

export default [
    {
        path: "/references/:id",
        method: "put",
        isEncrypt: false,
        controller: trustController.approveReferences,
    },
    {
        path: "/references/:id",
        method: "delete",
        isEncrypt: false,
        controller: trustController.rejectReferences,
    },
    {
        path: "/references",
        method: "get",
        controller: trustController.getReferencesRequests,
    },
    {
        path: "/references/all",
        method: "get",
        controller: trustController.getReferences,
        isEncrypt: false,
    },
    {
        path: "/reference/delete",
        method: "post",
        controller: trustController.referanceDelete,
    },
    {
        path: "/location/interval",
        method: "post",
        controller: trustController.setLocation,
        isGuest: true,
    },
    {
        path: "/activities",
        method: "get",
        controller: trustController.activitiesLog,
    },
    {
        path: "/activities/:id",
        method: "get",
        controller: trustController.activitiesLogUser,
    },
];
