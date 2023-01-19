import UserController from "./userController";
import V from "./validation";

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
   
];
