import { a as auth } from "./_libs/@clerk/tanstack-react-start+[...].mjs";
import { n as createServerFn, r as TSS_SERVER_FUNCTION } from "./_ssr/ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_authenticated-BzPE0_Zg.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var checkAuth_createServerFn_handler = createServerRpc({
	id: "946c77cb015d3af369324ebdb693c583b25d59a10ba5ec676db9a45c5b74da4a",
	name: "checkAuth",
	filename: "src/routes/_authenticated.tsx"
}, (opts) => checkAuth.__executeServer(opts));
var checkAuth = createServerFn({ method: "GET" }).handler(checkAuth_createServerFn_handler, async () => {
	const { userId } = await auth();
	return { userId };
});
//#endregion
export { checkAuth_createServerFn_handler };
