import ReportController from "./reportController";
import V from "./validations"

export default [
    {
        path: "/report",
        method: "post",
        controller: ReportController.report,
        validation: V.reportValidation
    }, {
        path: "/reports",
        method: "get",
        controller: ReportController.reportList
    }
]