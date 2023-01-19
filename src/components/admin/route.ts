import auth from "../../auth";
import authController from "./controller/authController";
import V from "./validation";
import UserController from "../users/userController";
import validation from "./validation";

// path: "", method: "post", controller: "",
// validation: ""(can be array of validation), 
// isEncrypt: boolean (default true), isPublic: boolean (default false)

export default [
    {
        path: "/dashboard",
        method: "get",
        controller: authController.adminDashboard,
        isPublic: true
    },
    {
        path: "/login",
        method: "get",
        controller: authController.adminLogin,
        isPublic: true
    },
    {
        path: "/register",
        method: "post",
        controller: authController.adminRegister,
        validation: [V.adminregisterValidation],
        isPublic: true
    },
]; 