import { r as __toESM, t as __commonJSMin } from "../../_runtime.mjs";
import { a as OrganizationProfile$1, b as require_jsx_runtime, c as SignUp$1, i as OrganizationList$1, n as useRoutingProps, s as SignIn$1, t as InternalClerkProvider, u as UserProfile$1, x as require_react } from "./react+[...].mjs";
import { A as getEnvVariable, O as isAutomatedEnvironment, a as constants, c as getAuthObjectForAcceptedToken, d as isHttpOrHttps, f as isProxyUrlRelative, i as AuthStatus, j as buildErrorThrower, k as isDevelopmentEnvironment, o as createClerkRequest, r as isTruthy, s as debugRequestState, t as createClerkClient, y as isDevelopmentFromSecretKey } from "../clerk__backend+clerk__shared.mjs";
import { a as apiUrlFromPublishableKey, i as resolveKeysWithKeylessFallback$1, n as createKeylessService, r as createNodeFileStorage, t as handleNetlifyCacheInDevInstance } from "../clerk__shared.mjs";
import { AsyncLocalStorage } from "node:async_hooks";
import * as fs from "node:fs";
import * as path from "node:path";
//#region node_modules/@tanstack/react-router/dist/esm/matchContext.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var matchContext = import_react.createContext(void 0);
var dummyMatchContext = import_react.createContext(void 0);
//#endregion
//#region node_modules/@tanstack/react-router/dist/esm/routerContext.js
var routerContext = import_react.createContext(null);
//#endregion
//#region node_modules/@tanstack/react-router/dist/esm/useRouter.js
/**
* Access the current TanStack Router instance from React context.
* Must be used within a `RouterProvider`.
*
* Options:
* - `warn`: Log a warning if no router context is found (default: true).
*
* @returns The registered router instance.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useRouterHook
*/
function useRouter(opts) {
	return import_react.useContext(routerContext);
}
//#endregion
//#region node_modules/@tanstack/router-core/dist/esm/utils.js
/**
* Return the last element of an array.
* Intended for non-empty arrays used within router internals.
*/
function last(arr) {
	return arr[arr.length - 1];
}
function isFunction(d) {
	return typeof d === "function";
}
/**
* Apply a value-or-updater to a previous value.
* Accepts either a literal value or a function of the previous value.
*/
function functionalUpdate(updater, previous) {
	if (isFunction(updater)) return updater(previous);
	return updater;
}
var hasOwn = Object.prototype.hasOwnProperty;
function hasKeys(obj) {
	for (const key in obj) if (hasOwn.call(obj, key)) return true;
	return false;
}
var createNull = () => Object.create(null);
var nullReplaceEqualDeep = (prev, next) => replaceEqualDeep(prev, next, createNull);
/**
* This function returns `prev` if `_next` is deeply equal.
* If not, it will replace any deeply equal children of `b` with those of `a`.
* This can be used for structural sharing between immutable JSON values for example.
* Do not use this with signals
*/
function replaceEqualDeep(prev, _next, _makeObj = () => ({}), _depth = 0) {
	return _next;
}
function isPlainObject(o) {
	if (!hasObjectPrototype(o)) return false;
	const ctor = o.constructor;
	if (typeof ctor === "undefined") return true;
	const prot = ctor.prototype;
	if (!hasObjectPrototype(prot)) return false;
	if (!prot.hasOwnProperty("isPrototypeOf")) return false;
	return true;
}
function hasObjectPrototype(o) {
	return Object.prototype.toString.call(o) === "[object Object]";
}
/**
* Perform a deep equality check with options for partial comparison and
* ignoring `undefined` values. Optimized for router state comparisons.
*/
function deepEqual(a, b, opts) {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (let i = 0, l = a.length; i < l; i++) if (!deepEqual(a[i], b[i], opts)) return false;
		return true;
	}
	if (isPlainObject(a) && isPlainObject(b)) {
		const ignoreUndefined = opts?.ignoreUndefined ?? true;
		if (opts?.partial) {
			for (const k in b) if (!ignoreUndefined || b[k] !== void 0) {
				if (!deepEqual(a[k], b[k], opts)) return false;
			}
			return true;
		}
		let aCount = 0;
		if (!ignoreUndefined) aCount = Object.keys(a).length;
		else for (const k in a) if (a[k] !== void 0) aCount++;
		let bCount = 0;
		for (const k in b) if (!ignoreUndefined || b[k] !== void 0) {
			bCount++;
			if (bCount > aCount || !deepEqual(a[k], b[k], opts)) return false;
		}
		return aCount === bCount;
	}
	return false;
}
/**
* Create a promise with exposed resolve/reject and status fields.
* Useful for coordinating async router lifecycle operations.
*/
function createControlledPromise(onResolve) {
	let resolveLoadPromise;
	let rejectLoadPromise;
	const controlledPromise = new Promise((resolve, reject) => {
		resolveLoadPromise = resolve;
		rejectLoadPromise = reject;
	});
	controlledPromise.status = "pending";
	controlledPromise.resolve = (value) => {
		controlledPromise.status = "resolved";
		controlledPromise.value = value;
		resolveLoadPromise(value);
		onResolve?.(value);
	};
	controlledPromise.reject = (e) => {
		controlledPromise.status = "rejected";
		rejectLoadPromise(e);
	};
	return controlledPromise;
}
/**
* Heuristically detect dynamic import "module not found" errors
* across major browsers for lazy route component handling.
*/
function isModuleNotFoundError(error) {
	if (typeof error?.message !== "string") return false;
	return error.message.startsWith("Failed to fetch dynamically imported module") || error.message.startsWith("error loading dynamically imported module") || error.message.startsWith("Importing a module script failed");
}
function isPromise(value) {
	return Boolean(value && typeof value === "object" && typeof value.then === "function");
}
/**
* Remove control characters that can cause open redirect vulnerabilities.
* Characters like \r (CR) and \n (LF) can trick URL parsers into interpreting
* paths like "/\r/evil.com" as "http://evil.com".
*/
function sanitizePathSegment(segment) {
	return segment.replace(/[\x00-\x1f\x7f]/g, "");
}
function decodeSegment(segment) {
	let decoded;
	try {
		decoded = decodeURI(segment);
	} catch {
		decoded = segment.replaceAll(/%[0-9A-F]{2}/gi, (match) => {
			try {
				return decodeURI(match);
			} catch {
				return match;
			}
		});
	}
	return sanitizePathSegment(decoded);
}
/**
* Default list of URL protocols to allow in links, redirects, and navigation.
* Any absolute URL protocol not in this list is treated as dangerous by default.
*/
var DEFAULT_PROTOCOL_ALLOWLIST = [
	"http:",
	"https:",
	"mailto:",
	"tel:"
];
/**
* Check if a URL string uses a protocol that is not in the allowlist.
* Returns true for blocked protocols like javascript:, blob:, data:, etc.
*
* The URL constructor correctly normalizes:
* - Mixed case (JavaScript: → javascript:)
* - Whitespace/control characters (java\nscript: → javascript:)
* - Leading whitespace
*
* For relative URLs (no protocol), returns false (safe).
*
* @param url - The URL string to check
* @param allowlist - Set of protocols to allow
* @returns true if the URL uses a protocol that is not allowed
*/
function isDangerousProtocol(url, allowlist) {
	if (!url) return false;
	try {
		const parsed = new URL(url);
		return !allowlist.has(parsed.protocol);
	} catch {
		return false;
	}
}
var HTML_ESCAPE_LOOKUP = {
	"&": "\\u0026",
	">": "\\u003e",
	"<": "\\u003c",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029"
};
var HTML_ESCAPE_REGEX = /[&><\u2028\u2029]/g;
/**
* Escape HTML special characters in a string to prevent XSS attacks
* when embedding strings in script tags during SSR.
*
* This is essential for preventing XSS vulnerabilities when user-controlled
* content is embedded in inline scripts.
*/
function escapeHtml(str) {
	return str.replace(HTML_ESCAPE_REGEX, (match) => HTML_ESCAPE_LOOKUP[match]);
}
function decodePath(path) {
	if (!path) return {
		path,
		handledProtocolRelativeURL: false
	};
	if (!/[%\\\x00-\x1f\x7f]/.test(path) && !path.startsWith("//")) return {
		path,
		handledProtocolRelativeURL: false
	};
	const re = /%25|%5C/gi;
	let cursor = 0;
	let result = "";
	let match;
	while (null !== (match = re.exec(path))) {
		result += decodeSegment(path.slice(cursor, match.index)) + match[0];
		cursor = re.lastIndex;
	}
	result = result + decodeSegment(cursor ? path.slice(cursor) : path);
	let handledProtocolRelativeURL = false;
	if (result.startsWith("//")) {
		handledProtocolRelativeURL = true;
		result = "/" + result.replace(/^\/+/, "");
	}
	return {
		path: result,
		handledProtocolRelativeURL
	};
}
/**
* Encodes a path the same way `new URL()` would, but without the overhead of full URL parsing.
*
* This function encodes:
* - Whitespace characters (spaces → %20, tabs → %09, etc.)
* - Non-ASCII/Unicode characters (emojis, accented characters, etc.)
*
* It preserves:
* - Already percent-encoded sequences (won't double-encode %2F, %25, etc.)
* - ASCII special characters valid in URL paths (@, $, &, +, etc.)
* - Forward slashes as path separators
*
* Used to generate proper href values for SSR without constructing URL objects.
*
* @example
* encodePathLikeUrl('/path/file name.pdf') // '/path/file%20name.pdf'
* encodePathLikeUrl('/path/日本語') // '/path/%E6%97%A5%E6%9C%AC%E8%AA%9E'
* encodePathLikeUrl('/path/already%20encoded') // '/path/already%20encoded' (preserved)
*/
function encodePathLikeUrl(path) {
	if (!/\s|[^\u0000-\u007F]/.test(path)) return path;
	return path.replace(/\s|[^\u0000-\u007F]/gu, encodeURIComponent);
}
function arraysEqual(a, b) {
	if (a === b) return true;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
}
//#endregion
//#region node_modules/@tanstack/router-core/dist/esm/invariant.js
function invariant() {
	throw new Error("Invariant failed");
}
//#endregion
//#region node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.production.js
/**
* @license React
* use-sync-external-store-shim.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_use_sync_external_store_shim_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React = require_react();
	function is(x, y) {
		return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
	}
	var objectIs = "function" === typeof Object.is ? Object.is : is, useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useDebugValue = React.useDebugValue;
	function useSyncExternalStore$2(subscribe, getSnapshot) {
		var value = getSnapshot(), _useState = useState({ inst: {
			value,
			getSnapshot
		} }), inst = _useState[0].inst, forceUpdate = _useState[1];
		useLayoutEffect(function() {
			inst.value = value;
			inst.getSnapshot = getSnapshot;
			checkIfSnapshotChanged(inst) && forceUpdate({ inst });
		}, [
			subscribe,
			value,
			getSnapshot
		]);
		useEffect(function() {
			checkIfSnapshotChanged(inst) && forceUpdate({ inst });
			return subscribe(function() {
				checkIfSnapshotChanged(inst) && forceUpdate({ inst });
			});
		}, [subscribe]);
		useDebugValue(value);
		return value;
	}
	function checkIfSnapshotChanged(inst) {
		var latestGetSnapshot = inst.getSnapshot;
		inst = inst.value;
		try {
			var nextValue = latestGetSnapshot();
			return !objectIs(inst, nextValue);
		} catch (error) {
			return !0;
		}
	}
	function useSyncExternalStore$1(subscribe, getSnapshot) {
		return getSnapshot();
	}
	var shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
	exports.useSyncExternalStore = void 0 !== React.useSyncExternalStore ? React.useSyncExternalStore : shim;
}));
//#endregion
//#region node_modules/use-sync-external-store/shim/index.js
var require_shim = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_use_sync_external_store_shim_production();
}));
//#endregion
//#region node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.production.js
/**
* @license React
* use-sync-external-store-shim/with-selector.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_with_selector_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React = require_react(), shim = require_shim();
	function is(x, y) {
		return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
	}
	var objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef = React.useRef, useEffect = React.useEffect, useMemo = React.useMemo, useDebugValue = React.useDebugValue;
	exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
		var instRef = useRef(null);
		if (null === instRef.current) {
			var inst = {
				hasValue: !1,
				value: null
			};
			instRef.current = inst;
		} else inst = instRef.current;
		instRef = useMemo(function() {
			function memoizedSelector(nextSnapshot) {
				if (!hasMemo) {
					hasMemo = !0;
					memoizedSnapshot = nextSnapshot;
					nextSnapshot = selector(nextSnapshot);
					if (void 0 !== isEqual && inst.hasValue) {
						var currentSelection = inst.value;
						if (isEqual(currentSelection, nextSnapshot)) return memoizedSelection = currentSelection;
					}
					return memoizedSelection = nextSnapshot;
				}
				currentSelection = memoizedSelection;
				if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
				var nextSelection = selector(nextSnapshot);
				if (void 0 !== isEqual && isEqual(currentSelection, nextSelection)) return memoizedSnapshot = nextSnapshot, currentSelection;
				memoizedSnapshot = nextSnapshot;
				return memoizedSelection = nextSelection;
			}
			var hasMemo = !1, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
			return [function() {
				return memoizedSelector(getSnapshot());
			}, null === maybeGetServerSnapshot ? void 0 : function() {
				return memoizedSelector(maybeGetServerSnapshot());
			}];
		}, [
			getSnapshot,
			getServerSnapshot,
			selector,
			isEqual
		]);
		var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
		useEffect(function() {
			inst.hasValue = !0;
			inst.value = value;
		}, [value]);
		useDebugValue(value);
		return value;
	};
}));
//#endregion
//#region node_modules/use-sync-external-store/shim/with-selector.js
var require_with_selector = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_with_selector_production();
}));
//#endregion
//#region node_modules/@tanstack/react-store/dist/esm/useStore.js
var import_with_selector = /* @__PURE__ */ __toESM(require_with_selector(), 1);
function defaultCompare(a, b) {
	return a === b;
}
function useStore(atom, selector, compare = defaultCompare) {
	const subscribe = (0, import_react.useCallback)((handleStoreChange) => {
		if (!atom) return () => {};
		const { unsubscribe } = atom.subscribe(handleStoreChange);
		return unsubscribe;
	}, [atom]);
	const boundGetSnapshot = (0, import_react.useCallback)(() => atom?.get(), [atom]);
	return (0, import_with_selector.useSyncExternalStoreWithSelector)(subscribe, boundGetSnapshot, boundGetSnapshot, selector, compare);
}
//#endregion
//#region node_modules/@tanstack/react-router/dist/esm/useMatch.js
var dummyStore = {
	get: () => void 0,
	subscribe: () => ({ unsubscribe: () => {} })
};
/**
* Read and select the nearest or targeted route match.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useMatchHook
*/
function useMatch(opts) {
	const router = useRouter();
	const nearestMatchId = import_react.useContext(opts.from ? dummyMatchContext : matchContext);
	const key = opts.from ?? nearestMatchId;
	const matchStore = key ? opts.from ? router.stores.getRouteMatchStore(key) : router.stores.matchStores.get(key) : void 0;
	{
		const match = matchStore?.get();
		if ((opts.shouldThrow ?? true) && !match) invariant();
		if (match === void 0) return;
		return opts.select ? opts.select(match) : match;
	}
	const previousResult = import_react.useRef(void 0);
	return useStore(matchStore ?? dummyStore, (match) => {
		if ((opts.shouldThrow ?? true) && !match) invariant();
		if (match === void 0) return;
		const selected = opts.select ? opts.select(match) : match;
		if (opts.structuralSharing ?? router.options.defaultStructuralSharing) {
			const shared = replaceEqualDeep(previousResult.current, selected);
			previousResult.current = shared;
			return shared;
		}
		return selected;
	});
}
//#endregion
//#region node_modules/@tanstack/react-router/dist/esm/useParams.js
/**
* Access the current route's path parameters with type-safety.
*
* Options:
* - `from`/`strict`: Specify the matched route and whether to enforce strict typing
* - `select`: Project the params object to a derived value for memoized renders
* - `structuralSharing`: Enable structural sharing for stable references
* - `shouldThrow`: Throw if the route is not found in strict contexts
*
* @returns The params object (or selected value) for the matched route.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useParamsHook
*/
function useParams(opts) {
	return useMatch({
		from: opts.from,
		shouldThrow: opts.shouldThrow,
		structuralSharing: opts.structuralSharing,
		strict: opts.strict,
		select: (match) => {
			const params = opts.strict === false ? match.params : match._strictParams;
			return opts.select ? opts.select(params) : params;
		}
	});
}
//#endregion
//#region node_modules/@tanstack/react-router/dist/esm/utils.js
/**
* React.use if available (React 19+), undefined otherwise.
* Use dynamic lookup to avoid Webpack compilation errors with React 18.
*/
var reactUse = import_react.use;
var useLayoutEffect = typeof window !== "undefined" ? import_react.useLayoutEffect : import_react.useEffect;
/**
* Taken from https://www.developerway.com/posts/implementing-advanced-use-previous-hook#part3
*/
function usePrevious(value) {
	const ref = import_react.useRef({
		value,
		prev: null
	});
	const current = ref.current.value;
	if (value !== current) ref.current = {
		value,
		prev: current
	};
	return ref.current.prev;
}
/**
* React hook to wrap `IntersectionObserver`.
*
* This hook will create an `IntersectionObserver` and observe the ref passed to it.
*
* When the intersection changes, the callback will be called with the `IntersectionObserverEntry`.
*
* @param ref - The ref to observe
* @param intersectionObserverOptions - The options to pass to the IntersectionObserver
* @param options - The options to pass to the hook
* @param callback - The callback to call when the intersection changes
* @returns The IntersectionObserver instance
* @example
* ```tsx
* const MyComponent = () => {
* const ref = React.useRef<HTMLDivElement>(null)
* useIntersectionObserver(
*  ref,
*  (entry) => { doSomething(entry) },
*  { rootMargin: '10px' },
*  { disabled: false }
* )
* return <div ref={ref} />
* ```
*/
function useIntersectionObserver(ref, callback, intersectionObserverOptions = {}, options = {}) {
	import_react.useEffect(() => {
		if (!ref.current || options.disabled || typeof IntersectionObserver !== "function") return;
		const observer = new IntersectionObserver(([entry]) => {
			callback(entry);
		}, intersectionObserverOptions);
		observer.observe(ref.current);
		return () => {
			observer.disconnect();
		};
	}, [
		callback,
		intersectionObserverOptions,
		options.disabled,
		ref
	]);
}
/**
* React hook to take a `React.ForwardedRef` and returns a `ref` that can be used on a DOM element.
*
* @param ref - The forwarded ref
* @returns The inner ref returned by `useRef`
* @example
* ```tsx
* const MyComponent = React.forwardRef((props, ref) => {
*  const innerRef = useForwardedRef(ref)
*  return <div ref={innerRef} />
* })
* ```
*/
function useForwardedRef(ref) {
	const innerRef = import_react.useRef(null);
	import_react.useImperativeHandle(ref, () => innerRef.current, []);
	return innerRef;
}
//#endregion
//#region node_modules/@tanstack/react-router/dist/esm/useNavigate.js
/**
* Imperative navigation hook.
*
* Returns a stable `navigate(options)` function to change the current location
* programmatically. Prefer the `Link` component for user-initiated navigation,
* and use this hook from effects, callbacks, or handlers where imperative
* navigation is required.
*
* Options:
* - `from`: Optional route base used to resolve relative `to` paths.
*
* @returns A function that accepts `NavigateOptions`.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useNavigateHook
*/
function useNavigate(_defaultOpts) {
	const router = useRouter();
	return import_react.useCallback((options) => {
		return router.navigate({
			...options,
			from: options.from ?? _defaultOpts?.from
		});
	}, [_defaultOpts?.from, router]);
}
//#endregion
//#region node_modules/@tanstack/react-router/dist/esm/ScriptOnce.js
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime(), 1);
/**
* Server-only helper to emit a script tag exactly once during SSR.
*/
function ScriptOnce({ children }) {
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
		nonce: router.options.ssr?.nonce,
		dangerouslySetInnerHTML: { __html: children + ";document.currentScript.remove()" }
	});
}
//#endregion
//#region node_modules/@tanstack/react-router/dist/esm/useLocation.js
/**
* Read the current location from the router state with optional selection.
* Useful for subscribing to just the pieces of location you care about.
*
* Options:
* - `select`: Project the `location` object to a derived value
* - `structuralSharing`: Enable structural sharing for stable references
*
* @returns The current location (or selected value).
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useLocationHook
*/
function useLocation(opts) {
	const router = useRouter();
	{
		const location = router.stores.location.get();
		return opts?.select ? opts.select(location) : location;
	}
	const previousResult = (0, import_react.useRef)(void 0);
	return useStore(router.stores.location, (location) => {
		const selected = opts?.select ? opts.select(location) : location;
		if (opts?.structuralSharing ?? router.options.defaultStructuralSharing) {
			const shared = replaceEqualDeep(previousResult.current, selected);
			previousResult.current = shared;
			return shared;
		}
		return selected;
	});
}
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/utils/index.js
var isClient = () => typeof window !== "undefined";
var errorThrower = buildErrorThrower({ packageName: "@clerk/tanstack-react-start" });
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/utils/errors.js
var createErrorMessage = (msg) => {
	return `🔒 Clerk: ${msg.trim()}

For more info, check out the docs: https://clerk.com/docs,
or come say hi in our discord server: https://clerk.com/discord

`;
};
createErrorMessage(`
  You're calling 'getAuth()' from a server function, without providing the request object.
  Example:

  export const someServerFunction = createServerFn({ method: 'GET' }).handler(async () => {
    const request = getWebRequest()
    const auth = getAuth(request);
    ...
  });
  `);
var clerkMiddlewareNotConfigured = createErrorMessage(`
It looks like you're trying to use Clerk without configuring the middleware.

To fix this, make sure you have the \`clerkMiddleware()\` configured in your \`createStart()\` function in your \`src/start.ts\` file.`);
//#endregion
//#region node_modules/@tanstack/start-client-core/dist/esm/createMiddleware.js
var createMiddleware = (options, __opts) => {
	const resolvedOptions = {
		type: "request",
		...__opts || options
	};
	const setValidator = (validator) => {
		return createMiddleware({}, Object.assign(resolvedOptions, {
			validator,
			inputValidator: validator
		}));
	};
	return {
		options: resolvedOptions,
		middleware: (middleware) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { middleware }));
		},
		validator: setValidator,
		inputValidator: setValidator,
		client: (client) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { client }));
		},
		server: (server) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { server }));
		}
	};
};
//#endregion
//#region node_modules/@tanstack/start-fn-stubs/dist/esm/createIsomorphicFn.js
function createIsomorphicFn() {
	return createRuntimeFn(() => void 0);
}
function createRuntimeFn(fn, serverImpl) {
	return Object.assign(fn, {
		server: (nextServerImpl) => {
			return createRuntimeFn(nextServerImpl, nextServerImpl);
		},
		client: (clientImpl) => {
			return createRuntimeFn(serverImpl ?? clientImpl, serverImpl);
		}
	});
}
//#endregion
//#region node_modules/@tanstack/start-storage-context/dist/esm/async-local-storage.js
var GLOBAL_STORAGE_KEY = Symbol.for("tanstack-start:start-storage-context");
var globalObj = globalThis;
if (!globalObj[GLOBAL_STORAGE_KEY]) globalObj[GLOBAL_STORAGE_KEY] = new AsyncLocalStorage();
var startStorage = globalObj[GLOBAL_STORAGE_KEY];
function getStartContext(opts) {
	const context = startStorage.getStore();
	if (!context && opts?.throwIfNotFound !== false) throw new Error(`No Start context found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return context;
}
//#endregion
//#region node_modules/@tanstack/start-client-core/dist/esm/getGlobalStartContext.js
var getGlobalStartContext = createIsomorphicFn().client(() => void 0).server(() => {
	const context = getStartContext().contextAfterGlobalMiddlewares;
	if (!context) throw new Error(`Global context not set yet, you are calling getGlobalStartContext() before the global middlewares are applied.`);
	return context;
});
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/server/auth.js
var auth = (async (opts) => {
	const authObjectFn = getGlobalStartContext().auth;
	if (!authObjectFn) return errorThrower.throw(clerkMiddlewareNotConfigured);
	return getAuthObjectForAcceptedToken({
		authObject: await Promise.resolve(authObjectFn({ treatPendingAsSignedOut: opts?.treatPendingAsSignedOut })),
		acceptsToken: opts?.acceptsToken
	});
});
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/utils/env.js
var getPublicEnvVariables = () => {
	const getValue = (name) => {
		return getEnvVariable(`VITE_${name}`) || getEnvVariable(name);
	};
	return {
		publishableKey: getValue("CLERK_PUBLISHABLE_KEY"),
		domain: getValue("CLERK_DOMAIN"),
		isSatellite: isTruthy(getValue("CLERK_IS_SATELLITE")),
		proxyUrl: getValue("CLERK_PROXY_URL"),
		signInUrl: getValue("CLERK_SIGN_IN_URL"),
		signUpUrl: getValue("CLERK_SIGN_UP_URL"),
		clerkJsUrl: getValue("CLERK_JS_URL") || getValue("CLERK_JS"),
		clerkJsVersion: getValue("CLERK_JS_VERSION"),
		clerkUIUrl: getValue("CLERK_UI_URL"),
		clerkUIVersion: getValue("CLERK_UI_VERSION"),
		prefetchUI: getValue("CLERK_PREFETCH_UI") === "false" ? false : void 0,
		telemetryDisabled: isTruthy(getValue("CLERK_TELEMETRY_DISABLED")),
		telemetryDebug: isTruthy(getValue("CLERK_TELEMETRY_DEBUG")),
		unsafeDisableDevelopmentModeConsoleWarning: isTruthy(getValue("CLERK_UNSAFE_DISABLE_DEVELOPMENT_MODE_CONSOLE_WARNING")),
		afterSignInUrl: getValue("CLERK_AFTER_SIGN_IN_URL"),
		afterSignUpUrl: getValue("CLERK_AFTER_SIGN_UP_URL"),
		newSubscriptionRedirectUrl: getValue("CLERK_CHECKOUT_CONTINUE_URL")
	};
};
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/server/constants.js
var commonEnvs = () => {
	const publicEnvs = getPublicEnvVariables();
	return {
		CLERK_JS_VERSION: publicEnvs.clerkJsVersion,
		CLERK_JS_URL: publicEnvs.clerkJsUrl,
		CLERK_UI_URL: publicEnvs.clerkUIUrl,
		CLERK_UI_VERSION: publicEnvs.clerkUIVersion,
		PREFETCH_UI: publicEnvs.prefetchUI,
		PUBLISHABLE_KEY: publicEnvs.publishableKey,
		DOMAIN: publicEnvs.domain,
		PROXY_URL: publicEnvs.proxyUrl,
		IS_SATELLITE: publicEnvs.isSatellite,
		SIGN_IN_URL: publicEnvs.signInUrl,
		SIGN_UP_URL: publicEnvs.signUpUrl,
		TELEMETRY_DISABLED: publicEnvs.telemetryDisabled,
		TELEMETRY_DEBUG: publicEnvs.telemetryDebug,
		API_VERSION: getEnvVariable("CLERK_API_VERSION") || "v1",
		SECRET_KEY: getEnvVariable("CLERK_SECRET_KEY"),
		MACHINE_SECRET_KEY: getEnvVariable("CLERK_MACHINE_SECRET_KEY"),
		ENCRYPTION_KEY: getEnvVariable("CLERK_ENCRYPTION_KEY"),
		CLERK_JWT_KEY: getEnvVariable("CLERK_JWT_KEY"),
		API_URL: getEnvVariable("CLERK_API_URL") || apiUrlFromPublishableKey(publicEnvs.publishableKey),
		SDK_METADATA: {
			name: "@clerk/tanstack-react-start",
			version: "1.4.11",
			environment: getEnvVariable("NODE_ENV")
		}
	};
};
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/server/clerkClient.js
var clerkClient = (options) => {
	const commonEnv = commonEnvs();
	return createClerkClient({
		secretKey: commonEnv.SECRET_KEY,
		machineSecretKey: commonEnv.MACHINE_SECRET_KEY,
		publishableKey: commonEnv.PUBLISHABLE_KEY,
		apiUrl: commonEnv.API_URL,
		apiVersion: commonEnv.API_VERSION,
		userAgent: `@clerk/tanstack-react-start@1.4.11`,
		proxyUrl: commonEnv.PROXY_URL,
		domain: commonEnv.DOMAIN,
		isSatellite: commonEnv.IS_SATELLITE,
		sdkMetadata: commonEnv.SDK_METADATA,
		telemetry: {
			disabled: commonEnv.TELEMETRY_DISABLED,
			debug: commonEnv.TELEMETRY_DEBUG
		},
		...options
	});
};
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/utils/feature-flags.js
var KEYLESS_DISABLED = isTruthy(getEnvVariable("VITE_CLERK_KEYLESS_DISABLED")) || isTruthy(getEnvVariable("CLERK_KEYLESS_DISABLED")) || false;
/**
* Whether keyless mode can be used in the current environment.
* Keyless mode is only available in development, when not explicitly disabled,
* and when not running in an automated/CI environment.
*
* To disable keyless mode, set either:
* - `VITE_CLERK_KEYLESS_DISABLED=1` (for Vite-based projects)
* - `CLERK_KEYLESS_DISABLED=1` (generic)
*/
var canUseKeyless = isDevelopmentEnvironment() && !isAutomatedEnvironment() && !KEYLESS_DISABLED;
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/server/keyless/fileStorage.js
function createFileStorage(options = {}) {
	const { cwd = () => process.cwd() } = options;
	return createNodeFileStorage(fs, path, {
		cwd,
		frameworkPackageName: "@clerk/tanstack-react-start"
	});
}
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/server/keyless/index.js
var keylessServiceInstance = null;
function keyless() {
	if (!keylessServiceInstance) keylessServiceInstance = createKeylessService({
		storage: createFileStorage(),
		api: {
			async createAccountlessApplication(requestHeaders, source) {
				try {
					return await clerkClient().__experimental_accountlessApplications.createAccountlessApplication({
						requestHeaders,
						source
					});
				} catch {
					return null;
				}
			},
			async completeOnboarding(requestHeaders, source) {
				try {
					return await clerkClient().__experimental_accountlessApplications.completeAccountlessApplicationOnboarding({
						requestHeaders,
						source
					});
				} catch {
					return null;
				}
			}
		},
		framework: "tanstack-react-start"
	});
	return keylessServiceInstance;
}
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/server/keyless/utils.js
/**
* Resolves Clerk keys, falling back to keyless mode in development if configured keys are missing.
*
* @param configuredPublishableKey - The publishable key from options or environment
* @param configuredSecretKey - The secret key from options or environment
* @returns The resolved keys (either configured or from keyless mode)
*/
function resolveKeysWithKeylessFallback(configuredPublishableKey, configuredSecretKey) {
	return resolveKeysWithKeylessFallback$1(configuredPublishableKey, configuredSecretKey, keyless(), canUseKeyless);
}
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/server/loadOptions.js
var loadOptions = (request, overrides = {}) => {
	const commonEnv = commonEnvs();
	const secretKey = overrides.secretKey || commonEnv.SECRET_KEY;
	const machineSecretKey = overrides.machineSecretKey || commonEnv.MACHINE_SECRET_KEY;
	const publishableKey = overrides.publishableKey || commonEnv.PUBLISHABLE_KEY;
	const jwtKey = overrides.jwtKey || commonEnv.CLERK_JWT_KEY;
	const apiUrl = getEnvVariable("CLERK_API_URL") || apiUrlFromPublishableKey(publishableKey);
	const domain = overrides.domain || commonEnv.DOMAIN;
	const isSatellite = overrides.isSatellite || commonEnv.IS_SATELLITE;
	const relativeOrAbsoluteProxyUrl = overrides.proxyUrl || commonEnv.PROXY_URL;
	const signInUrl = overrides.signInUrl || commonEnv.SIGN_IN_URL;
	const signUpUrl = overrides.signUpUrl || commonEnv.SIGN_UP_URL;
	const satelliteAutoSync = overrides.satelliteAutoSync;
	let proxyUrl;
	if (!!relativeOrAbsoluteProxyUrl && isProxyUrlRelative(relativeOrAbsoluteProxyUrl)) proxyUrl = new URL(relativeOrAbsoluteProxyUrl, request.clerkUrl).toString();
	else proxyUrl = relativeOrAbsoluteProxyUrl;
	if (!secretKey && !canUseKeyless) throw errorThrower.throw("Clerk: no secret key provided");
	if (isSatellite && !proxyUrl && !domain) throw errorThrower.throw("Clerk: satellite mode requires a proxy URL or domain");
	if (isSatellite && secretKey && !isHttpOrHttps(signInUrl) && isDevelopmentFromSecretKey(secretKey)) throw errorThrower.throw("Clerk: satellite mode requires a sign-in URL in production");
	return {
		...overrides,
		secretKey,
		machineSecretKey,
		publishableKey,
		jwtKey,
		apiUrl,
		domain,
		isSatellite,
		proxyUrl,
		signInUrl,
		signUpUrl,
		satelliteAutoSync
	};
};
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/server/utils/index.js
/**
* Wraps obscured clerk internals with a readable `clerkState` key.
* This is intended to be passed into <ClerkProvider>
*
* @internal
*/
var wrapWithClerkState = (data) => {
	return { __internal_clerk_state: { ...data } };
};
/**
* Returns the prefetchUI config from environment variables.
*
* @internal
*/
function getPrefetchUIFromEnv() {
	if (getEnvVariable("CLERK_PREFETCH_UI") === "false") return false;
}
function getUnsafeDisableDevelopmentModeConsoleWarningFromEnv() {
	const value = getEnvVariable("VITE_CLERK_UNSAFE_DISABLE_DEVELOPMENT_MODE_CONSOLE_WARNING") || getEnvVariable("CLERK_UNSAFE_DISABLE_DEVELOPMENT_MODE_CONSOLE_WARNING");
	return value ? isTruthy(value) : void 0;
}
function getResponseClerkState(requestState, additionalStateOptions = {}) {
	const { reason, message, isSignedIn, ...rest } = requestState;
	return wrapWithClerkState({
		__clerk_ssr_state: rest.toAuth(),
		__publishableKey: requestState.publishableKey,
		__proxyUrl: requestState.proxyUrl,
		__domain: requestState.domain,
		__isSatellite: requestState.isSatellite,
		__signInUrl: requestState.signInUrl,
		__signUpUrl: requestState.signUpUrl,
		__afterSignInUrl: requestState.afterSignInUrl,
		__afterSignUpUrl: requestState.afterSignUpUrl,
		__clerk_debug: debugRequestState(requestState),
		__clerkJSUrl: getEnvVariable("CLERK_JS") || getEnvVariable("CLERK_JS_URL"),
		__clerkJSVersion: getEnvVariable("CLERK_JS_VERSION"),
		__clerkUIUrl: getEnvVariable("CLERK_UI_URL"),
		__clerkUIVersion: getEnvVariable("CLERK_UI_VERSION"),
		__prefetchUI: getPrefetchUIFromEnv(),
		__telemetryDisabled: isTruthy(getEnvVariable("CLERK_TELEMETRY_DISABLED")),
		__telemetryDebug: isTruthy(getEnvVariable("CLERK_TELEMETRY_DEBUG")),
		__unsafeDisableDevelopmentModeConsoleWarning: getUnsafeDisableDevelopmentModeConsoleWarningFromEnv(),
		__signInForceRedirectUrl: additionalStateOptions.signInForceRedirectUrl || getEnvVariable("CLERK_SIGN_IN_FORCE_REDIRECT_URL") || "",
		__signUpForceRedirectUrl: additionalStateOptions.signUpForceRedirectUrl || getEnvVariable("CLERK_SIGN_UP_FORCE_REDIRECT_URL") || "",
		__signInFallbackRedirectUrl: additionalStateOptions.signInFallbackRedirectUrl || getEnvVariable("CLERK_SIGN_IN_FALLBACK_REDIRECT_URL") || "",
		__signUpFallbackRedirectUrl: additionalStateOptions.signUpFallbackRedirectUrl || getEnvVariable("CLERK_SIGN_UP_FALLBACK_REDIRECT_URL") || ""
	});
}
/**
* Patches request to avoid duplex issues with unidici
* For more information, see:
* https://github.com/nodejs/node/issues/46221
* https://github.com/whatwg/fetch/pull/1457
* @internal
*/
var patchRequest = (request) => {
	const clonedRequest = new Request(request.url, {
		headers: request.headers,
		method: request.method,
		redirect: request.redirect,
		cache: request.cache
	});
	if (clonedRequest.method !== "GET" && clonedRequest.body !== null && !("duplex" in clonedRequest)) clonedRequest.duplex = "half";
	return clonedRequest;
};
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/server/clerkMiddleware.js
var clerkMiddleware = (options) => {
	return createMiddleware().server(async ({ request, next }) => {
		const clerkRequest = createClerkRequest(patchRequest(request));
		const resolvedOptions = typeof options === "function" ? await options({ url: clerkRequest.clerkUrl }) : options;
		const loadedOptions = loadOptions(clerkRequest, {
			...resolvedOptions,
			publishableKey: resolvedOptions?.publishableKey,
			secretKey: resolvedOptions?.secretKey
		});
		const { publishableKey, secretKey, claimUrl: keylessClaimUrl, apiKeysUrl: keylessApiKeysUrl } = await resolveKeysWithKeylessFallback(loadedOptions.publishableKey, loadedOptions.secretKey);
		if (publishableKey) loadedOptions.publishableKey = publishableKey;
		if (secretKey) loadedOptions.secretKey = secretKey;
		const requestState = await clerkClient().authenticateRequest(clerkRequest, {
			...loadedOptions,
			acceptsToken: "any"
		});
		const locationHeader = requestState.headers.get(constants.Headers.Location);
		if (locationHeader) {
			handleNetlifyCacheInDevInstance({
				locationHeader,
				requestStateHeaders: requestState.headers,
				publishableKey: requestState.publishableKey
			});
			throw new Response(null, {
				status: 307,
				headers: requestState.headers
			});
		}
		if (requestState.status === AuthStatus.Handshake) throw new Error("Clerk: handshake status without redirect");
		const clerkInitialState = getResponseClerkState(requestState, loadedOptions);
		if (canUseKeyless && keylessClaimUrl) clerkInitialState.__internal_clerk_state = {
			...clerkInitialState.__internal_clerk_state,
			__keylessClaimUrl: keylessClaimUrl,
			__keylessApiKeysUrl: keylessApiKeysUrl
		};
		const result = await next({ context: {
			clerkInitialState,
			auth: (opts) => requestState.toAuth(opts)
		} });
		if (requestState.headers) requestState.headers.forEach((value, key) => {
			result.response.headers.append(key, value);
		});
		return result;
	});
};
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/client/OptionsContext.js
var ClerkOptionsCtx = import_react.createContext(void 0);
ClerkOptionsCtx.displayName = "ClerkOptionsCtx";
var ClerkOptionsProvider = (props) => {
	const { children, options } = props;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClerkOptionsCtx.Provider, {
		value: { value: options },
		children
	});
};
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/client/useAwaitableNavigate.js
var useAwaitableNavigate = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const resolveFunctionsRef = import_react.useRef([]);
	const resolveAll = () => {
		resolveFunctionsRef.current.forEach((resolve) => resolve());
		resolveFunctionsRef.current.splice(0, resolveFunctionsRef.current.length);
	};
	const [_, startTransition] = (0, import_react.useTransition)();
	import_react.useEffect(() => {
		resolveAll();
	}, [location]);
	return (options) => {
		return new Promise((res) => {
			startTransition(() => {
				resolveFunctionsRef.current.push(res);
				res(navigate(options));
			});
		});
	};
};
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/client/utils.js
var pickFromClerkInitState = (clerkInitState) => {
	const { __clerk_ssr_state, __publishableKey, __proxyUrl, __domain, __isSatellite, __signInUrl, __signUpUrl, __clerkJSUrl, __clerkJSVersion, __clerkUIUrl, __clerkUIVersion, __telemetryDisabled, __telemetryDebug, __unsafeDisableDevelopmentModeConsoleWarning, __signInForceRedirectUrl, __signUpForceRedirectUrl, __signInFallbackRedirectUrl, __signUpFallbackRedirectUrl, __keylessClaimUrl, __keylessApiKeysUrl, __prefetchUI } = clerkInitState || {};
	return {
		clerkSsrState: __clerk_ssr_state,
		publishableKey: __publishableKey,
		proxyUrl: __proxyUrl,
		domain: __domain,
		isSatellite: !!__isSatellite,
		signInUrl: __signInUrl,
		signUpUrl: __signUpUrl,
		__internal_clerkJSUrl: __clerkJSUrl,
		__internal_clerkJSVersion: __clerkJSVersion,
		__internal_clerkUIUrl: __clerkUIUrl,
		__internal_clerkUIVersion: __clerkUIVersion,
		prefetchUI: __prefetchUI,
		telemetry: {
			disabled: __telemetryDisabled,
			debug: __telemetryDebug
		},
		unsafe_disableDevelopmentModeConsoleWarning: __unsafeDisableDevelopmentModeConsoleWarning,
		signInForceRedirectUrl: __signInForceRedirectUrl,
		signUpForceRedirectUrl: __signUpForceRedirectUrl,
		signInFallbackRedirectUrl: __signInFallbackRedirectUrl,
		signUpFallbackRedirectUrl: __signUpFallbackRedirectUrl,
		__keylessClaimUrl,
		__keylessApiKeysUrl
	};
};
var mergeWithPublicEnvs = (restInitState) => {
	const envVars = getPublicEnvVariables();
	return {
		...restInitState,
		publishableKey: restInitState.publishableKey || envVars.publishableKey,
		domain: restInitState.domain || envVars.domain,
		isSatellite: restInitState.isSatellite || envVars.isSatellite,
		signInUrl: restInitState.signInUrl || envVars.signInUrl,
		signUpUrl: restInitState.signUpUrl || envVars.signUpUrl,
		__internal_clerkJSUrl: restInitState.__internal_clerkJSUrl || envVars.clerkJsUrl,
		__internal_clerkJSVersion: restInitState.__internal_clerkJSVersion || envVars.clerkJsVersion,
		__internal_clerkUIUrl: restInitState.__internal_clerkUIUrl || envVars.clerkUIUrl,
		__internal_clerkUIVersion: restInitState.__internal_clerkUIVersion || envVars.clerkUIVersion,
		signInForceRedirectUrl: restInitState.signInForceRedirectUrl,
		prefetchUI: restInitState.prefetchUI ?? envVars.prefetchUI,
		unsafe_disableDevelopmentModeConsoleWarning: restInitState.unsafe_disableDevelopmentModeConsoleWarning ?? envVars.unsafeDisableDevelopmentModeConsoleWarning
	};
};
/**
* Parses a URL string into TanStack Router navigation options.
* TanStack Router doesn't parse query strings from the `to` parameter,
* so we need to extract pathname, search params, and hash separately.
*/
function parseUrlForNavigation(to, baseUrl) {
	const url = new URL(to, baseUrl);
	const searchParams = Object.fromEntries(url.searchParams);
	return {
		to: url.pathname,
		search: Object.keys(searchParams).length > 0 ? searchParams : void 0,
		hash: url.hash ? url.hash.slice(1) : void 0
	};
}
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/client/ClerkProvider.js
var SDK_METADATA = {
	name: "@clerk/tanstack-react-start",
	version: "1.4.11"
};
var awaitableNavigateRef = { current: void 0 };
function ClerkProvider({ children, ...providerProps }) {
	const awaitableNavigate = useAwaitableNavigate();
	const clerkInitialState = getGlobalStartContext()?.clerkInitialState ?? {};
	(0, import_react.useEffect)(() => {
		awaitableNavigateRef.current = awaitableNavigate;
	}, [awaitableNavigate]);
	const { clerkSsrState, __keylessClaimUrl, __keylessApiKeysUrl, ...restInitState } = pickFromClerkInitState((isClient() ? window.__clerk_init_state : clerkInitialState)?.__internal_clerk_state);
	const mergedProps = {
		...mergeWithPublicEnvs(restInitState),
		...providerProps
	};
	const keylessProps = __keylessClaimUrl ? {
		__internal_keyless_claimKeylessApplicationUrl: __keylessClaimUrl,
		__internal_keyless_copyInstanceKeysUrl: __keylessApiKeysUrl
	} : {};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScriptOnce, { children: `window.__clerk_init_state = ${JSON.stringify(clerkInitialState)};` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClerkOptionsProvider, {
		options: mergedProps,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InternalClerkProvider, {
			initialState: clerkSsrState,
			sdkMetadata: SDK_METADATA,
			routerPush: (to) => {
				const { search, hash, ...rest } = parseUrlForNavigation(to, window.location.origin);
				return awaitableNavigateRef.current?.({
					...rest,
					search,
					hash,
					replace: false
				});
			},
			routerReplace: (to) => {
				const { search, hash, ...rest } = parseUrlForNavigation(to, window.location.origin);
				return awaitableNavigateRef.current?.({
					...rest,
					search,
					hash,
					replace: true
				});
			},
			...mergedProps,
			...keylessProps,
			children
		})
	})] });
}
ClerkProvider.displayName = "ClerkProvider";
//#endregion
//#region node_modules/@clerk/tanstack-react-start/dist/client/uiComponents.js
var usePathnameWithoutSplatRouteParams = () => {
	const { _splat } = useParams({ strict: false });
	const { pathname } = useLocation();
	const splatRouteParam = _splat || "";
	return (0, import_react.useRef)(`/${pathname.replace(splatRouteParam, "").replace(/\/$/, "").replace(/^\//, "").trim()}`).current;
};
Object.assign((props) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserProfile$1, { ...useRoutingProps("UserProfile", props, { path: usePathnameWithoutSplatRouteParams() }) });
}, { ...UserProfile$1 });
Object.assign((props) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrganizationProfile$1, { ...useRoutingProps("OrganizationProfile", props, { path: usePathnameWithoutSplatRouteParams() }) });
}, { ...OrganizationProfile$1 });
Object.assign((props) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrganizationList$1, { ...useRoutingProps("OrganizationList", props, { path: usePathnameWithoutSplatRouteParams() }) });
}, { ...OrganizationList$1 });
var SignIn = (props) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignIn$1, { ...useRoutingProps("SignIn", props, { path: usePathnameWithoutSplatRouteParams() }) });
};
var SignUp = (props) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignUp$1, { ...useRoutingProps("SignUp", props, { path: usePathnameWithoutSplatRouteParams() }) });
};
//#endregion
export { last as A, encodePathLikeUrl as C, isDangerousProtocol as D, hasKeys as E, matchContext as F, replaceEqualDeep as M, useRouter as N, isModuleNotFoundError as O, routerContext as P, deepEqual as S, functionalUpdate as T, invariant as _, auth as a, createControlledPromise as b, reactUse as c, useLayoutEffect as d, usePrevious as f, require_with_selector as g, useStore as h, clerkMiddleware as i, nullReplaceEqualDeep as j, isPromise as k, useForwardedRef as l, useMatch as m, SignUp as n, ScriptOnce as o, useParams as p, ClerkProvider as r, useNavigate as s, SignIn as t, useIntersectionObserver as u, DEFAULT_PROTOCOL_ALLOWLIST as v, escapeHtml as w, decodePath as x, arraysEqual as y };
