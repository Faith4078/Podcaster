import { i as clerkMiddleware } from "../_libs/@clerk/tanstack-react-start+[...].mjs";
import { t as createStart } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/start-kZOaA3Sn.js
var startInstance = createStart(() => {
	return { requestMiddleware: [clerkMiddleware()] };
});
//#endregion
export { startInstance };
