import routeArray from "./route";
import commonutils from "../../utils/commonUtils";
import { MicroComponent } from "../../utils/enum";

export default (prefix:String) => commonutils.routeArray(routeArray, prefix,false,MicroComponent.BUSINESS);