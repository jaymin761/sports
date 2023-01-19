import EmployeeController from "./employeeController";
import V from "./validation";

// path: "", method: "post", controller: "",
// validation: ""(can be array of validation),
// isEncrypt: boolean (default true), isPublic: boolean (default false)

export default [
    {
        path: "/users",
        method: "get",
        controller: EmployeeController.getusers,
        isEncrypt: false,
        skipComponentId: true,
    },
    {
        path: "/home",
        method: "get",
        controller: EmployeeController.listOfEmployeeForHome,
    },
    {
        path: "/",
        method: "post",
        controller: EmployeeController.addEmployee,
        validation: V.employeeValidation,
    },
    {
        path: "/",
        method: "get",
        controller: EmployeeController.listEmployee,
        skipComponentId: true
    },
    {
        path: "/business",
        method: "get",
        controller: EmployeeController.listBusinessEmployee,
        skipComponentId: true,
    },
    {
        path: "/accept/:id",
        method: "put",
        controller: EmployeeController.approvedEmployee,
        skipComponentId: true,
        validation: V.approvedEmployeeValidation
    },
    {
        path: "/:id",
        method: "delete",
        controller: EmployeeController.deleteEmployee,
        isEncrypt: false,
    },
    {
        path: "/:id",
        method: "put",
        controller: EmployeeController.authorizedEmployee,
        isEncrypt: false,
    },
    {
        path: "/available/:id",
        method: "put",
        controller: EmployeeController.availableEmployee,
        validation: V.availableValidation
    },
    {
        path: "/approve/:id/:employeeId/:status",
        method: "post",
        controller: EmployeeController.availableEmployeeAccept,
        isEncrypt: false,
        skipComponentId: true,
    }
];
