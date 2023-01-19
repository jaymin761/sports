import reportController from "./reportController";
import V from "./validation";
import vUser from "../users/validation";

// path: "", method: "post", controller: "",
// validation: ""(can be array of validation),
// isEncrypt: boolean (default true), isPublic: boolean (default false)

export default [
    {
        path: "/",
        method: "post",
        controller: reportController.createReport,
        validation: [V.reportValidation,vUser.hasUserValidation]
    },
    {
        path: "/subject/:id", //id= reportType
        method: "get",
        controller: reportController.getTypeOfSubject,
    },
];
