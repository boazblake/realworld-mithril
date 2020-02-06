(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    var val = aliases[name];
    return (val && name !== val) ? expandAlias(val) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (bundle && typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = typeof window === 'undefined' ? this : window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};

require.register("mithril-stream/stream.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "mithril-stream");
  (function() {
    /* eslint-disable */
;(function() {
"use strict"
/* eslint-enable */
Stream.SKIP = {}
Stream.lift = lift
Stream.scan = scan
Stream.merge = merge
Stream.combine = combine
Stream.scanMerge = scanMerge
Stream["fantasy-land/of"] = Stream

var warnedHalt = false
Object.defineProperty(Stream, "HALT", {
	get: function() {
		warnedHalt || console.log("HALT is deprecated and has been renamed to SKIP");
		warnedHalt = true
		return Stream.SKIP
	}
})

function Stream(value) {
	var dependentStreams = []
	var dependentFns = []

	function stream(v) {
		if (arguments.length && v !== Stream.SKIP) {
			value = v
			if (open(stream)) {
				stream.changing()
				stream.state = "active"
				dependentStreams.forEach(function(s, i) { s(dependentFns[i](value)) })
			}
		}

		return value
	}

	stream.constructor = Stream
	stream.state = arguments.length && value !== Stream.SKIP ? "active" : "pending"
	stream.parents = []

	stream.changing = function() {
		open(stream) && (stream.state = "changing")
		dependentStreams.forEach(function(s) {
			s.changing()
		})
	}

	stream.map = function(fn, ignoreInitial) {
		var target = stream.state === "active" && ignoreInitial !== Stream.SKIP
			? Stream(fn(value))
			: Stream()
		target.parents.push(stream)

		dependentStreams.push(target)
		dependentFns.push(fn)
		return target
	}

	var end
	function createEnd() {
		end = Stream()
		end.map(function(value) {
			if (value === true) {
				stream.parents.forEach(function (p) {p.unregisterChild(stream)})
				stream.state = "ended"
				stream.parents.length = dependentStreams.length = dependentFns.length = 0
			}
			return value
		})
		return end
	}

	stream.toJSON = function() { return value != null && typeof value.toJSON === "function" ? value.toJSON() : value }

	stream["fantasy-land/map"] = stream.map
	stream["fantasy-land/ap"] = function(x) { return combine(function(s1, s2) { return s1()(s2()) }, [x, stream]) }

	stream.unregisterChild = function(child) {
		var childIndex = dependentStreams.indexOf(child)
		if (childIndex !== -1) {
			dependentStreams.splice(childIndex, 1)
			dependentFns.splice(childIndex, 1)
		}
	}

	Object.defineProperty(stream, "end", {
		get: function() { return end || createEnd() }
	})

	return stream
}

function combine(fn, streams) {
	var ready = streams.every(function(s) {
		if (s.constructor !== Stream)
			throw new Error("Ensure that each item passed to stream.combine/stream.merge/lift is a stream")
		return s.state === "active"
	})
	var stream = ready
		? Stream(fn.apply(null, streams.concat([streams])))
		: Stream()

	var changed = []

	var mappers = streams.map(function(s) {
		return s.map(function(value) {
			changed.push(s)
			if (ready || streams.every(function(s) { return s.state !== "pending" })) {
				ready = true
				stream(fn.apply(null, streams.concat([changed])))
				changed = []
			}
			return value
		}, Stream.SKIP)
	})

	var endStream = stream.end.map(function(value) {
		if (value === true) {
			mappers.forEach(function(mapper) { mapper.end(true) })
			endStream.end(true)
		}
		return undefined
	})

	return stream
}

function merge(streams) {
	return combine(function() { return streams.map(function(s) { return s() }) }, streams)
}

function scan(fn, acc, origin) {
	var stream = origin.map(function(v) {
		var next = fn(acc, v)
		if (next !== Stream.SKIP) acc = next
		return next
	})
	stream(acc)
	return stream
}

function scanMerge(tuples, seed) {
	var streams = tuples.map(function(tuple) { return tuple[0] })

	var stream = combine(function() {
		var changed = arguments[arguments.length - 1]
		streams.forEach(function(stream, i) {
			if (changed.indexOf(stream) > -1)
				seed = tuples[i][1](seed, stream())
		})

		return seed
	}, streams)

	stream(seed)

	return stream
}

function lift() {
	var fn = arguments[0]
	var streams = Array.prototype.slice.call(arguments, 1)
	return merge(streams).map(function(streams) {
		return fn.apply(undefined, streams)
	})
}

function open(s) {
	return s.state === "pending" || s.state === "active" || s.state === "changing"
}

if (typeof module !== "undefined") module["exports"] = Stream
else if (typeof window.m === "function" && !("stream" in window.m)) window.m.stream = Stream
else window.m = {stream : Stream}

}());
  })();
});

require.register("mithril/mithril.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "mithril");
  (function() {
    ;(function() {
"use strict"
function Vnode(tag, key, attrs0, children, text, dom) {
	return {tag: tag, key: key, attrs: attrs0, children: children, text: text, dom: dom, domSize: undefined, state: undefined, _state: undefined, events: undefined, instance: undefined, skip: false}
}
Vnode.normalize = function(node) {
	if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined)
	if (node != null && typeof node !== "object") return Vnode("#", undefined, undefined, node === false ? "" : node, undefined, undefined)
	return node
}
Vnode.normalizeChildren = function normalizeChildren(children) {
	for (var i = 0; i < children.length; i++) {
		children[i] = Vnode.normalize(children[i])
	}
	return children
}
var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
var selectorCache = {}
var hasOwn = {}.hasOwnProperty
function isEmpty(object) {
	for (var key in object) if (hasOwn.call(object, key)) return false
	return true
}
function compileSelector(selector) {
	var match, tag = "div", classes = [], attrs = {}
	while (match = selectorParser.exec(selector)) {
		var type = match[1], value = match[2]
		if (type === "" && value !== "") tag = value
		else if (type === "#") attrs.id = value
		else if (type === ".") classes.push(value)
		else if (match[3][0] === "[") {
			var attrValue = match[6]
			if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\")
			if (match[4] === "class") classes.push(attrValue)
			else attrs[match[4]] = attrValue === "" ? attrValue : attrValue || true
		}
	}
	if (classes.length > 0) attrs.className = classes.join(" ")
	return selectorCache[selector] = {tag: tag, attrs: attrs}
}
function execSelector(state, attrs, children) {
	var hasAttrs = false, childList, text
	var className = attrs.className || attrs.class
	if (!isEmpty(state.attrs) && !isEmpty(attrs)) {
		var newAttrs = {}
		for(var key in attrs) {
			if (hasOwn.call(attrs, key)) {
				newAttrs[key] = attrs[key]
			}
		}
		attrs = newAttrs
	}
	for (var key in state.attrs) {
		if (hasOwn.call(state.attrs, key)) {
			attrs[key] = state.attrs[key]
		}
	}
	if (className !== undefined) {
		if (attrs.class !== undefined) {
			attrs.class = undefined
			attrs.className = className
		}
		if (state.attrs.className != null) {
			attrs.className = state.attrs.className + " " + className
		}
	}
	for (var key in attrs) {
		if (hasOwn.call(attrs, key) && key !== "key") {
			hasAttrs = true
			break
		}
	}
	if (Array.isArray(children) && children.length === 1 && children[0] != null && children[0].tag === "#") {
		text = children[0].children
	} else {
		childList = children
	}
	return Vnode(state.tag, attrs.key, hasAttrs ? attrs : undefined, childList, text)
}
function hyperscript(selector) {
	// Because sloppy mode sucks
	var attrs = arguments[1], start = 2, children
	if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
		throw Error("The selector must be either a string or a component.");
	}
	if (typeof selector === "string") {
		var cached = selectorCache[selector] || compileSelector(selector)
	}
	if (attrs == null) {
		attrs = {}
	} else if (typeof attrs !== "object" || attrs.tag != null || Array.isArray(attrs)) {
		attrs = {}
		start = 1
	}
	if (arguments.length === start + 1) {
		children = arguments[start]
		if (!Array.isArray(children)) children = [children]
	} else {
		children = []
		while (start < arguments.length) children.push(arguments[start++])
	}
	var normalized = Vnode.normalizeChildren(children)
	if (typeof selector === "string") {
		return execSelector(cached, attrs, normalized)
	} else {
		return Vnode(selector, attrs.key, attrs, normalized)
	}
}
hyperscript.trust = function(html) {
	if (html == null) html = ""
	return Vnode("<", undefined, undefined, html, undefined, undefined)
}
hyperscript.fragment = function(attrs1, children) {
	return Vnode("[", attrs1.key, attrs1, Vnode.normalizeChildren(children), undefined, undefined)
}
var m = hyperscript
/** @constructor */
var PromisePolyfill = function(executor) {
	if (!(this instanceof PromisePolyfill)) throw new Error("Promise must be called with `new`")
	if (typeof executor !== "function") throw new TypeError("executor must be a function")
	var self = this, resolvers = [], rejectors = [], resolveCurrent = handler(resolvers, true), rejectCurrent = handler(rejectors, false)
	var instance = self._instance = {resolvers: resolvers, rejectors: rejectors}
	var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout
	function handler(list, shouldAbsorb) {
		return function execute(value) {
			var then
			try {
				if (shouldAbsorb && value != null && (typeof value === "object" || typeof value === "function") && typeof (then = value.then) === "function") {
					if (value === self) throw new TypeError("Promise can't be resolved w/ itself")
					executeOnce(then.bind(value))
				}
				else {
					callAsync(function() {
						if (!shouldAbsorb && list.length === 0) console.error("Possible unhandled promise rejection:", value)
						for (var i = 0; i < list.length; i++) list[i](value)
						resolvers.length = 0, rejectors.length = 0
						instance.state = shouldAbsorb
						instance.retry = function() {execute(value)}
					})
				}
			}
			catch (e) {
				rejectCurrent(e)
			}
		}
	}
	function executeOnce(then) {
		var runs = 0
		function run(fn) {
			return function(value) {
				if (runs++ > 0) return
				fn(value)
			}
		}
		var onerror = run(rejectCurrent)
		try {then(run(resolveCurrent), onerror)} catch (e) {onerror(e)}
	}
	executeOnce(executor)
}
PromisePolyfill.prototype.then = function(onFulfilled, onRejection) {
	var self = this, instance = self._instance
	function handle(callback, list, next, state) {
		list.push(function(value) {
			if (typeof callback !== "function") next(value)
			else try {resolveNext(callback(value))} catch (e) {if (rejectNext) rejectNext(e)}
		})
		if (typeof instance.retry === "function" && state === instance.state) instance.retry()
	}
	var resolveNext, rejectNext
	var promise = new PromisePolyfill(function(resolve, reject) {resolveNext = resolve, rejectNext = reject})
	handle(onFulfilled, instance.resolvers, resolveNext, true), handle(onRejection, instance.rejectors, rejectNext, false)
	return promise
}
PromisePolyfill.prototype.catch = function(onRejection) {
	return this.then(null, onRejection)
}
PromisePolyfill.resolve = function(value) {
	if (value instanceof PromisePolyfill) return value
	return new PromisePolyfill(function(resolve) {resolve(value)})
}
PromisePolyfill.reject = function(value) {
	return new PromisePolyfill(function(resolve, reject) {reject(value)})
}
PromisePolyfill.all = function(list) {
	return new PromisePolyfill(function(resolve, reject) {
		var total = list.length, count = 0, values = []
		if (list.length === 0) resolve([])
		else for (var i = 0; i < list.length; i++) {
			(function(i) {
				function consume(value) {
					count++
					values[i] = value
					if (count === total) resolve(values)
				}
				if (list[i] != null && (typeof list[i] === "object" || typeof list[i] === "function") && typeof list[i].then === "function") {
					list[i].then(consume, reject)
				}
				else consume(list[i])
			})(i)
		}
	})
}
PromisePolyfill.race = function(list) {
	return new PromisePolyfill(function(resolve, reject) {
		for (var i = 0; i < list.length; i++) {
			list[i].then(resolve, reject)
		}
	})
}
if (typeof window !== "undefined") {
	if (typeof window.Promise === "undefined") window.Promise = PromisePolyfill
	var PromisePolyfill = window.Promise
} else if (typeof global !== "undefined") {
	if (typeof global.Promise === "undefined") global.Promise = PromisePolyfill
	var PromisePolyfill = global.Promise
} else {
}
var buildQueryString = function(object) {
	if (Object.prototype.toString.call(object) !== "[object Object]") return ""
	var args = []
	for (var key0 in object) {
		destructure(key0, object[key0])
	}
	return args.join("&")
	function destructure(key0, value) {
		if (Array.isArray(value)) {
			for (var i = 0; i < value.length; i++) {
				destructure(key0 + "[" + i + "]", value[i])
			}
		}
		else if (Object.prototype.toString.call(value) === "[object Object]") {
			for (var i in value) {
				destructure(key0 + "[" + i + "]", value[i])
			}
		}
		else args.push(encodeURIComponent(key0) + (value != null && value !== "" ? "=" + encodeURIComponent(value) : ""))
	}
}
var FILE_PROTOCOL_REGEX = new RegExp("^file://", "i")
var _8 = function($window, Promise) {
	var callbackCount = 0
	var oncompletion
	function setCompletionCallback(callback) {oncompletion = callback}
	function finalizer() {
		var count = 0
		function complete() {if (--count === 0 && typeof oncompletion === "function") oncompletion()}
		return function finalize(promise0) {
			var then0 = promise0.then
			promise0.then = function() {
				count++
				var next = then0.apply(promise0, arguments)
				next.then(complete, function(e) {
					complete()
					if (count === 0) throw e
				})
				return finalize(next)
			}
			return promise0
		}
	}
	function normalize(args, extra) {
		if (typeof args === "string") {
			var url = args
			args = extra || {}
			if (args.url == null) args.url = url
		}
		return args
	}
	function request(args, extra) {
		var finalize = finalizer()
		args = normalize(args, extra)
		var promise0 = new Promise(function(resolve, reject) {
			if (args.method == null) args.method = "GET"
			args.method = args.method.toUpperCase()
			var useBody = (args.method === "GET" || args.method === "TRACE") ? false : (typeof args.useBody === "boolean" ? args.useBody : true)
			if (typeof args.serialize !== "function") args.serialize = typeof FormData !== "undefined" && args.data instanceof FormData ? function(value) {return value} : JSON.stringify
			if (typeof args.deserialize !== "function") args.deserialize = deserialize
			if (typeof args.extract !== "function") args.extract = extract
			args.url = interpolate(args.url, args.data)
			if (useBody) args.data = args.serialize(args.data)
			else args.url = assemble(args.url, args.data)
			var xhr = new $window.XMLHttpRequest(),
				aborted = false,
				_abort = xhr.abort
			xhr.abort = function abort() {
				aborted = true
				_abort.call(xhr)
			}
			xhr.open(args.method, args.url, typeof args.async === "boolean" ? args.async : true, typeof args.user === "string" ? args.user : undefined, typeof args.password === "string" ? args.password : undefined)
			if (args.serialize === JSON.stringify && useBody && !(args.headers && args.headers.hasOwnProperty("Content-Type"))) {
				xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8")
			}
			if (args.deserialize === deserialize && !(args.headers && args.headers.hasOwnProperty("Accept"))) {
				xhr.setRequestHeader("Accept", "application/json, text/*")
			}
			if (args.withCredentials) xhr.withCredentials = args.withCredentials
			for (var key in args.headers) if ({}.hasOwnProperty.call(args.headers, key)) {
				xhr.setRequestHeader(key, args.headers[key])
			}
			if (typeof args.config === "function") xhr = args.config(xhr, args) || xhr
			xhr.onreadystatechange = function() {
				// Don't throw errors on xhr.abort().
				if(aborted) return
				if (xhr.readyState === 4) {
					try {
						var response = (args.extract !== extract) ? args.extract(xhr, args) : args.deserialize(args.extract(xhr, args))
						if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || FILE_PROTOCOL_REGEX.test(args.url)) {
							resolve(cast(args.type, response))
						}
						else {
							var error = new Error(xhr.responseText)
							for (var key in response) error[key] = response[key]
							reject(error)
						}
					}
					catch (e) {
						reject(e)
					}
				}
			}
			if (useBody && (args.data != null)) xhr.send(args.data)
			else xhr.send()
		})
		return args.background === true ? promise0 : finalize(promise0)
	}
	function jsonp(args, extra) {
		var finalize = finalizer()
		args = normalize(args, extra)
		var promise0 = new Promise(function(resolve, reject) {
			var callbackName = args.callbackName || "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++
			var script = $window.document.createElement("script")
			$window[callbackName] = function(data) {
				script.parentNode.removeChild(script)
				resolve(cast(args.type, data))
				delete $window[callbackName]
			}
			script.onerror = function() {
				script.parentNode.removeChild(script)
				reject(new Error("JSONP request failed"))
				delete $window[callbackName]
			}
			if (args.data == null) args.data = {}
			args.url = interpolate(args.url, args.data)
			args.data[args.callbackKey || "callback"] = callbackName
			script.src = assemble(args.url, args.data)
			$window.document.documentElement.appendChild(script)
		})
		return args.background === true? promise0 : finalize(promise0)
	}
	function interpolate(url, data) {
		if (data == null) return url
		var tokens = url.match(/:[^\/]+/gi) || []
		for (var i = 0; i < tokens.length; i++) {
			var key = tokens[i].slice(1)
			if (data[key] != null) {
				url = url.replace(tokens[i], data[key])
			}
		}
		return url
	}
	function assemble(url, data) {
		var querystring = buildQueryString(data)
		if (querystring !== "") {
			var prefix = url.indexOf("?") < 0 ? "?" : "&"
			url += prefix + querystring
		}
		return url
	}
	function deserialize(data) {
		try {return data !== "" ? JSON.parse(data) : null}
		catch (e) {throw new Error(data)}
	}
	function extract(xhr) {return xhr.responseText}
	function cast(type0, data) {
		if (typeof type0 === "function") {
			if (Array.isArray(data)) {
				for (var i = 0; i < data.length; i++) {
					data[i] = new type0(data[i])
				}
			}
			else return new type0(data)
		}
		return data
	}
	return {request: request, jsonp: jsonp, setCompletionCallback: setCompletionCallback}
}
var requestService = _8(window, PromisePolyfill)
var coreRenderer = function($window) {
	var $doc = $window.document
	var $emptyFragment = $doc.createDocumentFragment()
	var nameSpace = {
		svg: "http://www.w3.org/2000/svg",
		math: "http://www.w3.org/1998/Math/MathML"
	}
	var onevent
	function setEventCallback(callback) {return onevent = callback}
	function getNameSpace(vnode) {
		return vnode.attrs && vnode.attrs.xmlns || nameSpace[vnode.tag]
	}
	// IE9 - IE11 (at least) throw an UnspecifiedError when accessing document.activeElement when
	// inside an iframe. Catch and swallow this error0, and heavy-handidly return null.
	function activeElement() {
		try {
			return $doc.activeElement
		} catch (e) {
			return null
		}
	}
	//create
	function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
		for (var i = start; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				createNode(parent, vnode, hooks, ns, nextSibling)
			}
		}
	}
	function createNode(parent, vnode, hooks, ns, nextSibling) {
		var tag = vnode.tag
		if (typeof tag === "string") {
			vnode.state = {}
			if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
			switch (tag) {
				case "#": return createText(parent, vnode, nextSibling)
				case "<": return createHTML(parent, vnode, nextSibling)
				case "[": return createFragment(parent, vnode, hooks, ns, nextSibling)
				default: return createElement(parent, vnode, hooks, ns, nextSibling)
			}
		}
		else return createComponent(parent, vnode, hooks, ns, nextSibling)
	}
	function createText(parent, vnode, nextSibling) {
		vnode.dom = $doc.createTextNode(vnode.children)
		insertNode(parent, vnode.dom, nextSibling)
		return vnode.dom
	}
	function createHTML(parent, vnode, nextSibling) {
		var match1 = vnode.children.match(/^\s*?<(\w+)/im) || []
		var parent1 = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}[match1[1]] || "div"
		var temp = $doc.createElement(parent1)
		temp.innerHTML = vnode.children
		vnode.dom = temp.firstChild
		vnode.domSize = temp.childNodes.length
		var fragment = $doc.createDocumentFragment()
		var child
		while (child = temp.firstChild) {
			fragment.appendChild(child)
		}
		insertNode(parent, fragment, nextSibling)
		return fragment
	}
	function createFragment(parent, vnode, hooks, ns, nextSibling) {
		var fragment = $doc.createDocumentFragment()
		if (vnode.children != null) {
			var children = vnode.children
			createNodes(fragment, children, 0, children.length, hooks, null, ns)
		}
		vnode.dom = fragment.firstChild
		vnode.domSize = fragment.childNodes.length
		insertNode(parent, fragment, nextSibling)
		return fragment
	}
	function createElement(parent, vnode, hooks, ns, nextSibling) {
		var tag = vnode.tag
		var attrs2 = vnode.attrs
		var is = attrs2 && attrs2.is
		ns = getNameSpace(vnode) || ns
		var element = ns ?
			is ? $doc.createElementNS(ns, tag, {is: is}) : $doc.createElementNS(ns, tag) :
			is ? $doc.createElement(tag, {is: is}) : $doc.createElement(tag)
		vnode.dom = element
		if (attrs2 != null) {
			setAttrs(vnode, attrs2, ns)
		}
		insertNode(parent, element, nextSibling)
		if (vnode.attrs != null && vnode.attrs.contenteditable != null) {
			setContentEditable(vnode)
		}
		else {
			if (vnode.text != null) {
				if (vnode.text !== "") element.textContent = vnode.text
				else vnode.children = [Vnode("#", undefined, undefined, vnode.text, undefined, undefined)]
			}
			if (vnode.children != null) {
				var children = vnode.children
				createNodes(element, children, 0, children.length, hooks, null, ns)
				setLateAttrs(vnode)
			}
		}
		return element
	}
	function initComponent(vnode, hooks) {
		var sentinel
		if (typeof vnode.tag.view === "function") {
			vnode.state = Object.create(vnode.tag)
			sentinel = vnode.state.view
			if (sentinel.$$reentrantLock$$ != null) return $emptyFragment
			sentinel.$$reentrantLock$$ = true
		} else {
			vnode.state = void 0
			sentinel = vnode.tag
			if (sentinel.$$reentrantLock$$ != null) return $emptyFragment
			sentinel.$$reentrantLock$$ = true
			vnode.state = (vnode.tag.prototype != null && typeof vnode.tag.prototype.view === "function") ? new vnode.tag(vnode) : vnode.tag(vnode)
		}
		vnode._state = vnode.state
		if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
		initLifecycle(vnode._state, vnode, hooks)
		vnode.instance = Vnode.normalize(vnode._state.view.call(vnode.state, vnode))
		if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
		sentinel.$$reentrantLock$$ = null
	}
	function createComponent(parent, vnode, hooks, ns, nextSibling) {
		initComponent(vnode, hooks)
		if (vnode.instance != null) {
			var element = createNode(parent, vnode.instance, hooks, ns, nextSibling)
			vnode.dom = vnode.instance.dom
			vnode.domSize = vnode.dom != null ? vnode.instance.domSize : 0
			insertNode(parent, element, nextSibling)
			return element
		}
		else {
			vnode.domSize = 0
			return $emptyFragment
		}
	}
	//update
	function updateNodes(parent, old, vnodes, recycling, hooks, nextSibling, ns) {
		if (old === vnodes || old == null && vnodes == null) return
		else if (old == null) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, ns)
		else if (vnodes == null) removeNodes(old, 0, old.length, vnodes)
		else {
			if (old.length === vnodes.length) {
				var isUnkeyed = false
				for (var i = 0; i < vnodes.length; i++) {
					if (vnodes[i] != null && old[i] != null) {
						isUnkeyed = vnodes[i].key == null && old[i].key == null
						break
					}
				}
				if (isUnkeyed) {
					for (var i = 0; i < old.length; i++) {
						if (old[i] === vnodes[i]) continue
						else if (old[i] == null && vnodes[i] != null) createNode(parent, vnodes[i], hooks, ns, getNextSibling(old, i + 1, nextSibling))
						else if (vnodes[i] == null) removeNodes(old, i, i + 1, vnodes)
						else updateNode(parent, old[i], vnodes[i], hooks, getNextSibling(old, i + 1, nextSibling), recycling, ns)
					}
					return
				}
			}
			recycling = recycling || isRecyclable(old, vnodes)
			if (recycling) {
				var pool = old.pool
				old = old.concat(old.pool)
			}
			var oldStart = 0, start = 0, oldEnd = old.length - 1, end = vnodes.length - 1, map
			while (oldEnd >= oldStart && end >= start) {
				var o = old[oldStart], v = vnodes[start]
				if (o === v && !recycling) oldStart++, start++
				else if (o == null) oldStart++
				else if (v == null) start++
				else if (o.key === v.key) {
					var shouldRecycle = (pool != null && oldStart >= old.length - pool.length) || ((pool == null) && recycling)
					oldStart++, start++
					updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), shouldRecycle, ns)
					if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling)
				}
				else {
					var o = old[oldEnd]
					if (o === v && !recycling) oldEnd--, start++
					else if (o == null) oldEnd--
					else if (v == null) start++
					else if (o.key === v.key) {
						var shouldRecycle = (pool != null && oldEnd >= old.length - pool.length) || ((pool == null) && recycling)
						updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), shouldRecycle, ns)
						if (recycling || start < end) insertNode(parent, toFragment(o), getNextSibling(old, oldStart, nextSibling))
						oldEnd--, start++
					}
					else break
				}
			}
			while (oldEnd >= oldStart && end >= start) {
				var o = old[oldEnd], v = vnodes[end]
				if (o === v && !recycling) oldEnd--, end--
				else if (o == null) oldEnd--
				else if (v == null) end--
				else if (o.key === v.key) {
					var shouldRecycle = (pool != null && oldEnd >= old.length - pool.length) || ((pool == null) && recycling)
					updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), shouldRecycle, ns)
					if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling)
					if (o.dom != null) nextSibling = o.dom
					oldEnd--, end--
				}
				else {
					if (!map) map = getKeyMap(old, oldEnd)
					if (v != null) {
						var oldIndex = map[v.key]
						if (oldIndex != null) {
							var movable = old[oldIndex]
							var shouldRecycle = (pool != null && oldIndex >= old.length - pool.length) || ((pool == null) && recycling)
							updateNode(parent, movable, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns)
							insertNode(parent, toFragment(movable), nextSibling)
							old[oldIndex].skip = true
							if (movable.dom != null) nextSibling = movable.dom
						}
						else {
							var dom = createNode(parent, v, hooks, ns, nextSibling)
							nextSibling = dom
						}
					}
					end--
				}
				if (end < start) break
			}
			createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns)
			removeNodes(old, oldStart, oldEnd + 1, vnodes)
		}
	}
	function updateNode(parent, old, vnode, hooks, nextSibling, recycling, ns) {
		var oldTag = old.tag, tag = vnode.tag
		if (oldTag === tag) {
			vnode.state = old.state
			vnode._state = old._state
			vnode.events = old.events
			if (!recycling && shouldNotUpdate(vnode, old)) return
			if (typeof oldTag === "string") {
				if (vnode.attrs != null) {
					if (recycling) {
						vnode.state = {}
						initLifecycle(vnode.attrs, vnode, hooks)
					}
					else updateLifecycle(vnode.attrs, vnode, hooks)
				}
				switch (oldTag) {
					case "#": updateText(old, vnode); break
					case "<": updateHTML(parent, old, vnode, nextSibling); break
					case "[": updateFragment(parent, old, vnode, recycling, hooks, nextSibling, ns); break
					default: updateElement(old, vnode, recycling, hooks, ns)
				}
			}
			else updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns)
		}
		else {
			removeNode(old, null)
			createNode(parent, vnode, hooks, ns, nextSibling)
		}
	}
	function updateText(old, vnode) {
		if (old.children.toString() !== vnode.children.toString()) {
			old.dom.nodeValue = vnode.children
		}
		vnode.dom = old.dom
	}
	function updateHTML(parent, old, vnode, nextSibling) {
		if (old.children !== vnode.children) {
			toFragment(old)
			createHTML(parent, vnode, nextSibling)
		}
		else vnode.dom = old.dom, vnode.domSize = old.domSize
	}
	function updateFragment(parent, old, vnode, recycling, hooks, nextSibling, ns) {
		updateNodes(parent, old.children, vnode.children, recycling, hooks, nextSibling, ns)
		var domSize = 0, children = vnode.children
		vnode.dom = null
		if (children != null) {
			for (var i = 0; i < children.length; i++) {
				var child = children[i]
				if (child != null && child.dom != null) {
					if (vnode.dom == null) vnode.dom = child.dom
					domSize += child.domSize || 1
				}
			}
			if (domSize !== 1) vnode.domSize = domSize
		}
	}
	function updateElement(old, vnode, recycling, hooks, ns) {
		var element = vnode.dom = old.dom
		ns = getNameSpace(vnode) || ns
		if (vnode.tag === "textarea") {
			if (vnode.attrs == null) vnode.attrs = {}
			if (vnode.text != null) {
				vnode.attrs.value = vnode.text //FIXME handle0 multiple children
				vnode.text = undefined
			}
		}
		updateAttrs(vnode, old.attrs, vnode.attrs, ns)
		if (vnode.attrs != null && vnode.attrs.contenteditable != null) {
			setContentEditable(vnode)
		}
		else if (old.text != null && vnode.text != null && vnode.text !== "") {
			if (old.text.toString() !== vnode.text.toString()) old.dom.firstChild.nodeValue = vnode.text
		}
		else {
			if (old.text != null) old.children = [Vnode("#", undefined, undefined, old.text, undefined, old.dom.firstChild)]
			if (vnode.text != null) vnode.children = [Vnode("#", undefined, undefined, vnode.text, undefined, undefined)]
			updateNodes(element, old.children, vnode.children, recycling, hooks, null, ns)
		}
	}
	function updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns) {
		if (recycling) {
			initComponent(vnode, hooks)
		} else {
			vnode.instance = Vnode.normalize(vnode._state.view.call(vnode.state, vnode))
			if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
			if (vnode.attrs != null) updateLifecycle(vnode.attrs, vnode, hooks)
			updateLifecycle(vnode._state, vnode, hooks)
		}
		if (vnode.instance != null) {
			if (old.instance == null) createNode(parent, vnode.instance, hooks, ns, nextSibling)
			else updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, recycling, ns)
			vnode.dom = vnode.instance.dom
			vnode.domSize = vnode.instance.domSize
		}
		else if (old.instance != null) {
			removeNode(old.instance, null)
			vnode.dom = undefined
			vnode.domSize = 0
		}
		else {
			vnode.dom = old.dom
			vnode.domSize = old.domSize
		}
	}
	function isRecyclable(old, vnodes) {
		if (old.pool != null && Math.abs(old.pool.length - vnodes.length) <= Math.abs(old.length - vnodes.length)) {
			var oldChildrenLength = old[0] && old[0].children && old[0].children.length || 0
			var poolChildrenLength = old.pool[0] && old.pool[0].children && old.pool[0].children.length || 0
			var vnodesChildrenLength = vnodes[0] && vnodes[0].children && vnodes[0].children.length || 0
			if (Math.abs(poolChildrenLength - vnodesChildrenLength) <= Math.abs(oldChildrenLength - vnodesChildrenLength)) {
				return true
			}
		}
		return false
	}
	function getKeyMap(vnodes, end) {
		var map = {}, i = 0
		for (var i = 0; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				var key2 = vnode.key
				if (key2 != null) map[key2] = i
			}
		}
		return map
	}
	function toFragment(vnode) {
		var count0 = vnode.domSize
		if (count0 != null || vnode.dom == null) {
			var fragment = $doc.createDocumentFragment()
			if (count0 > 0) {
				var dom = vnode.dom
				while (--count0) fragment.appendChild(dom.nextSibling)
				fragment.insertBefore(dom, fragment.firstChild)
			}
			return fragment
		}
		else return vnode.dom
	}
	function getNextSibling(vnodes, i, nextSibling) {
		for (; i < vnodes.length; i++) {
			if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom
		}
		return nextSibling
	}
	function insertNode(parent, dom, nextSibling) {
		if (nextSibling && nextSibling.parentNode) parent.insertBefore(dom, nextSibling)
		else parent.appendChild(dom)
	}
	function setContentEditable(vnode) {
		var children = vnode.children
		if (children != null && children.length === 1 && children[0].tag === "<") {
			var content = children[0].children
			if (vnode.dom.innerHTML !== content) vnode.dom.innerHTML = content
		}
		else if (vnode.text != null || children != null && children.length !== 0) throw new Error("Child node of a contenteditable must be trusted")
	}
	//remove
	function removeNodes(vnodes, start, end, context) {
		for (var i = start; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				if (vnode.skip) vnode.skip = false
				else removeNode(vnode, context)
			}
		}
	}
	function removeNode(vnode, context) {
		var expected = 1, called = 0
		if (vnode.attrs && typeof vnode.attrs.onbeforeremove === "function") {
			var result = vnode.attrs.onbeforeremove.call(vnode.state, vnode)
			if (result != null && typeof result.then === "function") {
				expected++
				result.then(continuation, continuation)
			}
		}
		if (typeof vnode.tag !== "string" && typeof vnode._state.onbeforeremove === "function") {
			var result = vnode._state.onbeforeremove.call(vnode.state, vnode)
			if (result != null && typeof result.then === "function") {
				expected++
				result.then(continuation, continuation)
			}
		}
		continuation()
		function continuation() {
			if (++called === expected) {
				onremove(vnode)
				if (vnode.dom) {
					var count0 = vnode.domSize || 1
					if (count0 > 1) {
						var dom = vnode.dom
						while (--count0) {
							removeNodeFromDOM(dom.nextSibling)
						}
					}
					removeNodeFromDOM(vnode.dom)
					if (context != null && vnode.domSize == null && !hasIntegrationMethods(vnode.attrs) && typeof vnode.tag === "string") { //TODO test custom elements
						if (!context.pool) context.pool = [vnode]
						else context.pool.push(vnode)
					}
				}
			}
		}
	}
	function removeNodeFromDOM(node) {
		var parent = node.parentNode
		if (parent != null) parent.removeChild(node)
	}
	function onremove(vnode) {
		if (vnode.attrs && typeof vnode.attrs.onremove === "function") vnode.attrs.onremove.call(vnode.state, vnode)
		if (typeof vnode.tag !== "string") {
			if (typeof vnode._state.onremove === "function") vnode._state.onremove.call(vnode.state, vnode)
			if (vnode.instance != null) onremove(vnode.instance)
		} else {
			var children = vnode.children
			if (Array.isArray(children)) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i]
					if (child != null) onremove(child)
				}
			}
		}
	}
	//attrs2
	function setAttrs(vnode, attrs2, ns) {
		for (var key2 in attrs2) {
			setAttr(vnode, key2, null, attrs2[key2], ns)
		}
	}
	function setAttr(vnode, key2, old, value, ns) {
		var element = vnode.dom
		if (key2 === "key" || key2 === "is" || (old === value && !isFormAttribute(vnode, key2)) && typeof value !== "object" || typeof value === "undefined" || isLifecycleMethod(key2)) return
		var nsLastIndex = key2.indexOf(":")
		if (nsLastIndex > -1 && key2.substr(0, nsLastIndex) === "xlink") {
			element.setAttributeNS("http://www.w3.org/1999/xlink", key2.slice(nsLastIndex + 1), value)
		}
		else if (key2[0] === "o" && key2[1] === "n" && typeof value === "function") updateEvent(vnode, key2, value)
		else if (key2 === "style") updateStyle(element, old, value)
		else if (key2 in element && !isAttribute(key2) && ns === undefined && !isCustomElement(vnode)) {
			if (key2 === "value") {
				var normalized0 = "" + value // eslint-disable-line no-implicit-coercion
				//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
				if ((vnode.tag === "input" || vnode.tag === "textarea") && vnode.dom.value === normalized0 && vnode.dom === activeElement()) return
				//setting select[value] to same value while having select open blinks select dropdown in Chrome
				if (vnode.tag === "select") {
					if (value === null) {
						if (vnode.dom.selectedIndex === -1 && vnode.dom === activeElement()) return
					} else {
						if (old !== null && vnode.dom.value === normalized0 && vnode.dom === activeElement()) return
					}
				}
				//setting option[value] to same value while having select open blinks select dropdown in Chrome
				if (vnode.tag === "option" && old != null && vnode.dom.value === normalized0) return
			}
			// If you assign an input type1 that is not supported by IE 11 with an assignment expression, an error0 will occur.
			if (vnode.tag === "input" && key2 === "type") {
				element.setAttribute(key2, value)
				return
			}
			element[key2] = value
		}
		else {
			if (typeof value === "boolean") {
				if (value) element.setAttribute(key2, "")
				else element.removeAttribute(key2)
			}
			else element.setAttribute(key2 === "className" ? "class" : key2, value)
		}
	}
	function setLateAttrs(vnode) {
		var attrs2 = vnode.attrs
		if (vnode.tag === "select" && attrs2 != null) {
			if ("value" in attrs2) setAttr(vnode, "value", null, attrs2.value, undefined)
			if ("selectedIndex" in attrs2) setAttr(vnode, "selectedIndex", null, attrs2.selectedIndex, undefined)
		}
	}
	function updateAttrs(vnode, old, attrs2, ns) {
		if (attrs2 != null) {
			for (var key2 in attrs2) {
				setAttr(vnode, key2, old && old[key2], attrs2[key2], ns)
			}
		}
		if (old != null) {
			for (var key2 in old) {
				if (attrs2 == null || !(key2 in attrs2)) {
					if (key2 === "className") key2 = "class"
					if (key2[0] === "o" && key2[1] === "n" && !isLifecycleMethod(key2)) updateEvent(vnode, key2, undefined)
					else if (key2 !== "key") vnode.dom.removeAttribute(key2)
				}
			}
		}
	}
	function isFormAttribute(vnode, attr) {
		return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode.dom === activeElement()
	}
	function isLifecycleMethod(attr) {
		return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
	}
	function isAttribute(attr) {
		return attr === "href" || attr === "list" || attr === "form" || attr === "width" || attr === "height"// || attr === "type"
	}
	function isCustomElement(vnode){
		return vnode.attrs.is || vnode.tag.indexOf("-") > -1
	}
	function hasIntegrationMethods(source) {
		return source != null && (source.oncreate || source.onupdate || source.onbeforeremove || source.onremove)
	}
	//style
	function updateStyle(element, old, style) {
		if (old === style) element.style.cssText = "", old = null
		if (style == null) element.style.cssText = ""
		else if (typeof style === "string") element.style.cssText = style
		else {
			if (typeof old === "string") element.style.cssText = ""
			for (var key2 in style) {
				element.style[key2] = style[key2]
			}
			if (old != null && typeof old !== "string") {
				for (var key2 in old) {
					if (!(key2 in style)) element.style[key2] = ""
				}
			}
		}
	}
	//event
	function updateEvent(vnode, key2, value) {
		var element = vnode.dom
		var callback = typeof onevent !== "function" ? value : function(e) {
			var result = value.call(element, e)
			onevent.call(element, e)
			return result
		}
		if (key2 in element) element[key2] = typeof value === "function" ? callback : null
		else {
			var eventName = key2.slice(2)
			if (vnode.events === undefined) vnode.events = {}
			if (vnode.events[key2] === callback) return
			if (vnode.events[key2] != null) element.removeEventListener(eventName, vnode.events[key2], false)
			if (typeof value === "function") {
				vnode.events[key2] = callback
				element.addEventListener(eventName, vnode.events[key2], false)
			}
		}
	}
	//lifecycle
	function initLifecycle(source, vnode, hooks) {
		if (typeof source.oninit === "function") source.oninit.call(vnode.state, vnode)
		if (typeof source.oncreate === "function") hooks.push(source.oncreate.bind(vnode.state, vnode))
	}
	function updateLifecycle(source, vnode, hooks) {
		if (typeof source.onupdate === "function") hooks.push(source.onupdate.bind(vnode.state, vnode))
	}
	function shouldNotUpdate(vnode, old) {
		var forceVnodeUpdate, forceComponentUpdate
		if (vnode.attrs != null && typeof vnode.attrs.onbeforeupdate === "function") forceVnodeUpdate = vnode.attrs.onbeforeupdate.call(vnode.state, vnode, old)
		if (typeof vnode.tag !== "string" && typeof vnode._state.onbeforeupdate === "function") forceComponentUpdate = vnode._state.onbeforeupdate.call(vnode.state, vnode, old)
		if (!(forceVnodeUpdate === undefined && forceComponentUpdate === undefined) && !forceVnodeUpdate && !forceComponentUpdate) {
			vnode.dom = old.dom
			vnode.domSize = old.domSize
			vnode.instance = old.instance
			return true
		}
		return false
	}
	function render(dom, vnodes) {
		if (!dom) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.")
		var hooks = []
		var active = activeElement()
		var namespace = dom.namespaceURI
		// First time0 rendering into a node clears it out
		if (dom.vnodes == null) dom.textContent = ""
		if (!Array.isArray(vnodes)) vnodes = [vnodes]
		updateNodes(dom, dom.vnodes, Vnode.normalizeChildren(vnodes), false, hooks, null, namespace === "http://www.w3.org/1999/xhtml" ? undefined : namespace)
		dom.vnodes = vnodes
		// document.activeElement can return null in IE https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
		if (active != null && activeElement() !== active) active.focus()
		for (var i = 0; i < hooks.length; i++) hooks[i]()
	}
	return {render: render, setEventCallback: setEventCallback}
}
function throttle(callback) {
	//60fps translates to 16.6ms, round it down since setTimeout requires int
	var time = 16
	var last = 0, pending = null
	var timeout = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout
	return function() {
		var now = Date.now()
		if (last === 0 || now - last >= time) {
			last = now
			callback()
		}
		else if (pending === null) {
			pending = timeout(function() {
				pending = null
				callback()
				last = Date.now()
			}, time - (now - last))
		}
	}
}
var _11 = function($window) {
	var renderService = coreRenderer($window)
	renderService.setEventCallback(function(e) {
		if (e.redraw === false) e.redraw = undefined
		else redraw()
	})
	var callbacks = []
	function subscribe(key1, callback) {
		unsubscribe(key1)
		callbacks.push(key1, throttle(callback))
	}
	function unsubscribe(key1) {
		var index = callbacks.indexOf(key1)
		if (index > -1) callbacks.splice(index, 2)
	}
	function redraw() {
		for (var i = 1; i < callbacks.length; i += 2) {
			callbacks[i]()
		}
	}
	return {subscribe: subscribe, unsubscribe: unsubscribe, redraw: redraw, render: renderService.render}
}
var redrawService = _11(window)
requestService.setCompletionCallback(redrawService.redraw)
var _16 = function(redrawService0) {
	return function(root, component) {
		if (component === null) {
			redrawService0.render(root, [])
			redrawService0.unsubscribe(root)
			return
		}
		
		if (component.view == null && typeof component !== "function") throw new Error("m.mount(element, component) expects a component, not a vnode")
		
		var run0 = function() {
			redrawService0.render(root, Vnode(component))
		}
		redrawService0.subscribe(root, run0)
		redrawService0.redraw()
	}
}
m.mount = _16(redrawService)
var Promise = PromisePolyfill
var parseQueryString = function(string) {
	if (string === "" || string == null) return {}
	if (string.charAt(0) === "?") string = string.slice(1)
	var entries = string.split("&"), counters = {}, data0 = {}
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i].split("=")
		var key5 = decodeURIComponent(entry[0])
		var value = entry.length === 2 ? decodeURIComponent(entry[1]) : ""
		if (value === "true") value = true
		else if (value === "false") value = false
		var levels = key5.split(/\]\[?|\[/)
		var cursor = data0
		if (key5.indexOf("[") > -1) levels.pop()
		for (var j = 0; j < levels.length; j++) {
			var level = levels[j], nextLevel = levels[j + 1]
			var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel, 10))
			if (level === "") {
				var key5 = levels.slice(0, j).join()
				if (counters[key5] == null) {
					counters[key5] = Array.isArray(cursor) ? cursor.length : 0
				}
				level = counters[key5]++
			}
			// Disallow direct prototype pollution
			else if (level === "__proto__") break
			if (j === levels.length - 1) cursor[level] = value
			else {
				// Read own properties exclusively to disallow indirect
				// prototype pollution
				var desc = Object.getOwnPropertyDescriptor(cursor, level)
				if (desc != null) desc = desc.value
				if (desc == null) cursor[level] = desc = isNumber ? [] : {}
				cursor = desc
			}
		}
	}
	return data0
}
var coreRouter = function($window) {
	var supportsPushState = typeof $window.history.pushState === "function"
	var callAsync0 = typeof setImmediate === "function" ? setImmediate : setTimeout
	function normalize1(fragment0) {
		var data = $window.location[fragment0].replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
		if (fragment0 === "pathname" && data[0] !== "/") data = "/" + data
		return data
	}
	var asyncId
	function debounceAsync(callback0) {
		return function() {
			if (asyncId != null) return
			asyncId = callAsync0(function() {
				asyncId = null
				callback0()
			})
		}
	}
	function parsePath(path, queryData, hashData) {
		var queryIndex = path.indexOf("?")
		var hashIndex = path.indexOf("#")
		var pathEnd = queryIndex > -1 ? queryIndex : hashIndex > -1 ? hashIndex : path.length
		if (queryIndex > -1) {
			var queryEnd = hashIndex > -1 ? hashIndex : path.length
			var queryParams = parseQueryString(path.slice(queryIndex + 1, queryEnd))
			for (var key4 in queryParams) queryData[key4] = queryParams[key4]
		}
		if (hashIndex > -1) {
			var hashParams = parseQueryString(path.slice(hashIndex + 1))
			for (var key4 in hashParams) hashData[key4] = hashParams[key4]
		}
		return path.slice(0, pathEnd)
	}
	var router = {prefix: "#!"}
	router.getPath = function() {
		var type2 = router.prefix.charAt(0)
		switch (type2) {
			case "#": return normalize1("hash").slice(router.prefix.length)
			case "?": return normalize1("search").slice(router.prefix.length) + normalize1("hash")
			default: return normalize1("pathname").slice(router.prefix.length) + normalize1("search") + normalize1("hash")
		}
	}
	router.setPath = function(path, data, options) {
		var queryData = {}, hashData = {}
		path = parsePath(path, queryData, hashData)
		if (data != null) {
			for (var key4 in data) queryData[key4] = data[key4]
			path = path.replace(/:([^\/]+)/g, function(match2, token) {
				delete queryData[token]
				return data[token]
			})
		}
		var query = buildQueryString(queryData)
		if (query) path += "?" + query
		var hash = buildQueryString(hashData)
		if (hash) path += "#" + hash
		if (supportsPushState) {
			var state = options ? options.state : null
			var title = options ? options.title : null
			$window.onpopstate()
			if (options && options.replace) $window.history.replaceState(state, title, router.prefix + path)
			else $window.history.pushState(state, title, router.prefix + path)
		}
		else $window.location.href = router.prefix + path
	}
	router.defineRoutes = function(routes, resolve, reject) {
		function resolveRoute() {
			var path = router.getPath()
			var params = {}
			var pathname = parsePath(path, params, params)
			var state = $window.history.state
			if (state != null) {
				for (var k in state) params[k] = state[k]
			}
			for (var route0 in routes) {
				var matcher = new RegExp("^" + route0.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")
				if (matcher.test(pathname)) {
					pathname.replace(matcher, function() {
						var keys = route0.match(/:[^\/]+/g) || []
						var values = [].slice.call(arguments, 1, -2)
						for (var i = 0; i < keys.length; i++) {
							params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
						}
						resolve(routes[route0], params, path, route0)
					})
					return
				}
			}
			reject(path, params)
		}
		if (supportsPushState) $window.onpopstate = debounceAsync(resolveRoute)
		else if (router.prefix.charAt(0) === "#") $window.onhashchange = resolveRoute
		resolveRoute()
	}
	return router
}
var _20 = function($window, redrawService0) {
	var routeService = coreRouter($window)
	var identity = function(v) {return v}
	var render1, component, attrs3, currentPath, lastUpdate
	var route = function(root, defaultRoute, routes) {
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		var run1 = function() {
			if (render1 != null) redrawService0.render(root, render1(Vnode(component, attrs3.key, attrs3)))
		}
		var bail = function(path) {
			if (path !== defaultRoute) routeService.setPath(defaultRoute, null, {replace: true})
			else throw new Error("Could not resolve default route " + defaultRoute)
		}
		routeService.defineRoutes(routes, function(payload, params, path) {
			var update = lastUpdate = function(routeResolver, comp) {
				if (update !== lastUpdate) return
				component = comp != null && (typeof comp.view === "function" || typeof comp === "function")? comp : "div"
				attrs3 = params, currentPath = path, lastUpdate = null
				render1 = (routeResolver.render || identity).bind(routeResolver)
				run1()
			}
			if (payload.view || typeof payload === "function") update({}, payload)
			else {
				if (payload.onmatch) {
					Promise.resolve(payload.onmatch(params, path)).then(function(resolved) {
						update(payload, resolved)
					}, bail)
				}
				else update(payload, "div")
			}
		}, bail)
		redrawService0.subscribe(root, run1)
	}
	route.set = function(path, data, options) {
		if (lastUpdate != null) {
			options = options || {}
			options.replace = true
		}
		lastUpdate = null
		routeService.setPath(path, data, options)
	}
	route.get = function() {return currentPath}
	route.prefix = function(prefix0) {routeService.prefix = prefix0}
	route.link = function(vnode1) {
		vnode1.dom.setAttribute("href", routeService.prefix + vnode1.attrs.href)
		vnode1.dom.onclick = function(e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return
			e.preventDefault()
			e.redraw = false
			var href = this.getAttribute("href")
			if (href.indexOf(routeService.prefix) === 0) href = href.slice(routeService.prefix.length)
			route.set(href, undefined, undefined)
		}
	}
	route.param = function(key3) {
		if(typeof attrs3 !== "undefined" && typeof key3 !== "undefined") return attrs3[key3]
		return attrs3
	}
	return route
}
m.route = _20(window, redrawService)
m.withAttr = function(attrName, callback1, context) {
	return function(e) {
		callback1.call(context || this, attrName in e.currentTarget ? e.currentTarget[attrName] : e.currentTarget.getAttribute(attrName))
	}
}
var _28 = coreRenderer(window)
m.render = _28.render
m.redraw = redrawService.redraw
m.request = requestService.request
m.jsonp = requestService.jsonp
m.parseQueryString = parseQueryString
m.buildQueryString = buildQueryString
m.version = "1.1.7"
m.vnode = Vnode
if (typeof module !== "undefined") module["exports"] = m
else window.m = m
}());
  })();
});

require.register("moment/moment.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "moment");
  (function() {
    //! moment.js

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () { 'use strict';

    var hookCallback;

    function hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
    }

    function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return input != null && Object.prototype.toString.call(input) === '[object Object]';
    }

    function isObjectEmpty(obj) {
        if (Object.getOwnPropertyNames) {
            return (Object.getOwnPropertyNames(obj).length === 0);
        } else {
            var k;
            for (k in obj) {
                if (obj.hasOwnProperty(k)) {
                    return false;
                }
            }
            return true;
        }
    }

    function isUndefined(input) {
        return input === void 0;
    }

    function isNumber(input) {
        return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false,
            parsedDateParts : [],
            meridiem        : null,
            rfc2822         : false,
            weekdayMismatch : false
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this);
            var len = t.length >>> 0;

            for (var i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            var parsedParts = some.call(flags.parsedDateParts, function (i) {
                return i != null;
            });
            var isNowValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.weekdayMismatch &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated &&
                (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                isNowValid = isNowValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }

            if (Object.isFrozen == null || !Object.isFrozen(m)) {
                m._isValid = isNowValid;
            }
            else {
                return isNowValid;
            }
        }
        return m._isValid;
    }

    function createInvalid (flags) {
        var m = createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i = 0; i < momentProperties.length; i++) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        if (!this.isValid()) {
            this._d = new Date(NaN);
        }
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function warn(msg) {
        if (hooks.suppressDeprecationWarnings === false &&
                (typeof console !==  'undefined') && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (hooks.deprecationHandler != null) {
                hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                var args = [];
                var arg;
                for (var i = 0; i < arguments.length; i++) {
                    arg = '';
                    if (typeof arguments[i] === 'object') {
                        arg += '\n[' + i + '] ';
                        for (var key in arguments[0]) {
                            arg += key + ': ' + arguments[0][key] + ', ';
                        }
                        arg = arg.slice(0, -2); // Remove trailing comma and space
                    } else {
                        arg = arguments[i];
                    }
                    args.push(arg);
                }
                warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    hooks.suppressDeprecationWarnings = false;
    hooks.deprecationHandler = null;

    function isFunction(input) {
        return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
    }

    function set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (isFunction(prop)) {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
        // TODO: Remove "ordinalParse" fallback in next major release.
        this._dayOfMonthOrdinalParseLenient = new RegExp(
            (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
                '|' + (/\d{1,2}/).source);
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig), prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (hasOwnProp(parentConfig, prop) &&
                    !hasOwnProp(childConfig, prop) &&
                    isObject(parentConfig[prop])) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i, res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function calendar (key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        ss : '%d seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (isFunction(output)) ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [];
        for (var u in unitsObj) {
            units.push({unit: u, priority: priorities[u]});
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '', i;
            for (i = 0; i < length; i++) {
                output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match3to4      = /\d\d\d\d?/;     //     999 - 9999
    var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
    var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    // includes scottish gaelic two word and hyphenated months
    var matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i;

    var regexes = {};

    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }));
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (isNumber(callback)) {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;
    var WEEK = 7;
    var WEEKDAY = 8;

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? '' + y : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                set$1(this, unit, value);
                hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get(this, unit);
            }
        };
    }

    function get (mom, unit) {
        return mom.isValid() ?
            mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
    }

    function set$1 (mom, unit, value) {
        if (mom.isValid() && !isNaN(value)) {
            if (unit === 'FullYear' && isLeapYear(mom.year()) && mom.month() === 1 && mom.date() === 29) {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value, mom.month(), daysInMonth(value, mom.month()));
            }
            else {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
            }
        }
    }

    // MOMENTS

    function stringGet (units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }


    function stringSet (units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units);
            for (var i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    function mod(n, x) {
        return ((n % x) + x) % x;
    }

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        if (isNaN(year) || isNaN(month)) {
            return NaN;
        }
        var modMonth = mod(month, 12);
        year += (month - modMonth) / 12;
        return modMonth === 1 ? (isLeapYear(year) ? 29 : 28) : (31 - modMonth % 7 % 2);
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m, format) {
        if (!m) {
            return isArray(this._months) ? this._months :
                this._months['standalone'];
        }
        return isArray(this._months) ? this._months[m.month()] :
            this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m, format) {
        if (!m) {
            return isArray(this._monthsShort) ? this._monthsShort :
                this._monthsShort['standalone'];
        }
        return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
            this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    function handleStrictParse(monthName, format, strict) {
        var i, ii, mom, llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (!isNumber(value)) {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            hooks.updateOffset(this, true);
            return this;
        } else {
            return get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    var defaultMonthsShortRegex = matchWord;
    function monthsShortRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict ?
                this._monthsShortStrictRegex : this._monthsShortRegex;
        }
    }

    var defaultMonthsRegex = matchWord;
    function monthsRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict ?
                this._monthsStrictRegex : this._monthsRegex;
        }
    }

    function computeMonthsParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    }

    function createDate (y, m, d, h, M, s, ms) {
        // can't just apply() to create a date:
        // https://stackoverflow.com/q/181348
        var date;
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            date = new Date(y + 400, m, d, h, M, s, ms);
            if (isFinite(date.getFullYear())) {
                date.setFullYear(y);
            }
        } else {
            date = new Date(y, m, d, h, M, s, ms);
        }

        return date;
    }

    function createUTCDate (y) {
        var date;
        // the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            var args = Array.prototype.slice.call(arguments);
            // preserve leap years using a full 400 year cycle, then reset
            args[0] = y + 400;
            date = new Date(Date.UTC.apply(null, args));
            if (isFinite(date.getUTCFullYear())) {
                date.setUTCFullYear(y);
            }
        } else {
            date = new Date(Date.UTC.apply(null, arguments));
        }

        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear, resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek, resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 6th is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd',   function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd',   function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES
    function shiftWeekdays (ws, n) {
        return ws.slice(n, 7).concat(ws.slice(0, n));
    }

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m, format) {
        var weekdays = isArray(this._weekdays) ? this._weekdays :
            this._weekdays[(m && m !== true && this._weekdays.isFormat.test(format)) ? 'format' : 'standalone'];
        return (m === true) ? shiftWeekdays(weekdays, this._week.dow)
            : (m) ? weekdays[m.day()] : weekdays;
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return (m === true) ? shiftWeekdays(this._weekdaysShort, this._week.dow)
            : (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return (m === true) ? shiftWeekdays(this._weekdaysMin, this._week.dow)
            : (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
    }

    function handleStrictParse$1(weekdayName, format, strict) {
        var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse (weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return handleStrictParse$1.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\\.?') + '$', 'i');
                this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$', 'i');
                this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$', 'i');
            }
            if (!this._weekdaysParse[i]) {
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    var defaultWeekdaysRegex = matchWord;
    function weekdaysRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict ?
                this._weekdaysStrictRegex : this._weekdaysRegex;
        }
    }

    var defaultWeekdaysShortRegex = matchWord;
    function weekdaysShortRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict ?
                this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
        }
    }

    var defaultWeekdaysMinRegex = matchWord;
    function weekdaysMinRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict ?
                this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
        }
    }


    function computeWeekdaysParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom, minp, shortp, longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, 1]).day(i);
            minp = this.weekdaysMin(mom, '');
            shortp = this.weekdaysShort(mom, '');
            longp = this.weekdays(mom, '');
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 7; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
        this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('k',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);
    addRegexToken('kk', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['k', 'kk'], function (input, array, config) {
        var kInput = toInt(input);
        array[HOUR] = kInput === 24 ? 0 : kInput;
    });
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour they want. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse
    };

    // internal storage for locale config files
    var locales = {};
    var localeFamilies = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return globalLocale;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && (typeof module !== 'undefined') &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                var aliasedRequire = require;
                aliasedRequire('./locale/' + name);
                getSetGlobalLocale(oldLocale);
            } catch (e) {}
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
            else {
                if ((typeof console !==  'undefined') && console.warn) {
                    //warn user if arguments are passed but the locale could not be set
                    console.warn('Locale ' + key +  ' not found. Did you forget to load it?');
                }
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, config) {
        if (config !== null) {
            var locale, parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple('defineLocaleOverride',
                        'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    locale = loadLocale(config.parentLocale);
                    if (locale != null) {
                        parentConfig = locale._config;
                    } else {
                        if (!localeFamilies[config.parentLocale]) {
                            localeFamilies[config.parentLocale] = [];
                        }
                        localeFamilies[config.parentLocale].push({
                            name: name,
                            config: config
                        });
                        return null;
                    }
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            if (localeFamilies[name]) {
                localeFamilies[name].forEach(function (x) {
                    defineLocale(x.name, x.config);
                });
            }

            // backwards compat for now: also set the locale
            // make sure we set the locale AFTER all child locales have been
            // created, so we won't end up with the child locale set.
            getSetGlobalLocale(name);


            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale, tmpLocale, parentConfig = baseConfig;
            // MERGE
            tmpLocale = loadLocale(name);
            if (tmpLocale != null) {
                parentConfig = tmpLocale._config;
            }
            config = mergeConfigs(parentConfig, config);
            locale = new Locale(config);
            locale.parentLocale = locales[name];
            locales[name] = locale;

            // backwards compat for now: also set the locale
            getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function listLocales() {
        return keys(locales);
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(hooks.now());
        if (config._useUTC) {
            return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, expectedWeekday, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear != null) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay();

        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }

        // check for mismatching day of week
        if (config._w && typeof config._w.d !== 'undefined' && config._w.d !== expectedWeekday) {
            getParsingFlags(config).weekdayMismatch = true;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            var curWeek = weekOfYear(createLocal(), dow, doy);

            weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

            // Default to current week.
            week = defaults(w.w, curWeek.week);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from beginning of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to beginning of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
    var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

    var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
        ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
        ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
        ['YYYY-DDD', /\d{4}-\d{3}/],
        ['YYYY-MM', /\d{4}-\d\d/, false],
        ['YYYYYYMMDD', /[+-]\d{10}/],
        ['YYYYMMDD', /\d{8}/],
        // YYYYMM is NOT allowed by the standard
        ['GGGG[W]WWE', /\d{4}W\d{3}/],
        ['GGGG[W]WW', /\d{4}W\d{2}/, false],
        ['YYYYDDD', /\d{7}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
        ['HH:mm:ss', /\d\d:\d\d:\d\d/],
        ['HH:mm', /\d\d:\d\d/],
        ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
        ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
        ['HHmmss', /\d\d\d\d\d\d/],
        ['HHmm', /\d\d\d\d/],
        ['HH', /\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime, dateFormat, timeFormat, tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
    var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;

    function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
        var result = [
            untruncateYear(yearStr),
            defaultLocaleMonthsShort.indexOf(monthStr),
            parseInt(dayStr, 10),
            parseInt(hourStr, 10),
            parseInt(minuteStr, 10)
        ];

        if (secondStr) {
            result.push(parseInt(secondStr, 10));
        }

        return result;
    }

    function untruncateYear(yearStr) {
        var year = parseInt(yearStr, 10);
        if (year <= 49) {
            return 2000 + year;
        } else if (year <= 999) {
            return 1900 + year;
        }
        return year;
    }

    function preprocessRFC2822(s) {
        // Remove comments and folding whitespace and replace multiple-spaces with a single space
        return s.replace(/\([^)]*\)|[\n\t]/g, ' ').replace(/(\s\s+)/g, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }

    function checkWeekday(weekdayStr, parsedInput, config) {
        if (weekdayStr) {
            // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
            var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
                weekdayActual = new Date(parsedInput[0], parsedInput[1], parsedInput[2]).getDay();
            if (weekdayProvided !== weekdayActual) {
                getParsingFlags(config).weekdayMismatch = true;
                config._isValid = false;
                return false;
            }
        }
        return true;
    }

    var obsOffsets = {
        UT: 0,
        GMT: 0,
        EDT: -4 * 60,
        EST: -5 * 60,
        CDT: -5 * 60,
        CST: -6 * 60,
        MDT: -6 * 60,
        MST: -7 * 60,
        PDT: -7 * 60,
        PST: -8 * 60
    };

    function calculateOffset(obsOffset, militaryOffset, numOffset) {
        if (obsOffset) {
            return obsOffsets[obsOffset];
        } else if (militaryOffset) {
            // the only allowed military tz is Z
            return 0;
        } else {
            var hm = parseInt(numOffset, 10);
            var m = hm % 100, h = (hm - m) / 100;
            return h * 60 + m;
        }
    }

    // date and time from ref 2822 format
    function configFromRFC2822(config) {
        var match = rfc2822.exec(preprocessRFC2822(config._i));
        if (match) {
            var parsedArray = extractFromRFC2822Strings(match[4], match[3], match[2], match[5], match[6], match[7]);
            if (!checkWeekday(match[1], parsedArray, config)) {
                return;
            }

            config._a = parsedArray;
            config._tzm = calculateOffset(match[8], match[9], match[10]);

            config._d = createUTCDate.apply(null, config._a);
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

            getParsingFlags(config).rfc2822 = true;
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        configFromRFC2822(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        // Final attempt, use Input Fallback
        hooks.createFromInputFallback(config);
    }

    hooks.createFromInputFallback = deprecate(
        'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
        'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
        'discouraged and will be removed in an upcoming major release. Please refer to ' +
        'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // constant that refers to the ISO standard
    hooks.ISO_8601 = function () {};

    // constant that refers to the RFC 2822 form
    hooks.RFC_2822 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === hooks.ISO_8601) {
            configFromISO(config);
            return;
        }
        if (config._f === hooks.RFC_2822) {
            configFromRFC2822(config);
            return;
        }
        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            // console.log('token', token, 'parsedInput', parsedInput,
            //         'regex', getParseRegexForToken(token, config));
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
            return obj && parseInt(obj, 10);
        });

        configFromArray(config);
    }

    function createFromConfig (config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig (config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isDate(input)) {
            config._d = input;
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        }  else {
            configFromInput(config);
        }

        if (!isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (isUndefined(input)) {
            config._d = new Date(hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (isObject(input)) {
            configFromObject(config);
        } else if (isNumber(input)) {
            // from milliseconds
            config._d = new Date(input);
        } else {
            hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (locale === true || locale === false) {
            strict = locale;
            locale = undefined;
        }

        if ((isObject(input) && isObjectEmpty(input)) ||
                (isArray(input) && input.length === 0)) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
        'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other < this ? this : other;
            } else {
                return createInvalid();
            }
        }
    );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other > this ? this : other;
            } else {
                return createInvalid();
            }
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +(new Date());
    };

    var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

    function isDurationValid(m) {
        for (var key in m) {
            if (!(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
                return false;
            }
        }

        var unitHasDecimal = false;
        for (var i = 0; i < ordering.length; ++i) {
            if (m[ordering[i]]) {
                if (unitHasDecimal) {
                    return false; // only allow non-integers for smallest unit
                }
                if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                    unitHasDecimal = true;
                }
            }
        }

        return true;
    }

    function isValid$1() {
        return this._isValid;
    }

    function createInvalid$1() {
        return createDuration(NaN);
    }

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        this._isValid = isDurationValid(normalizedInput);

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible to translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    function absRound (number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // FORMATTING

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = (string || '').match(matcher);

        if (matches === null) {
            return null;
        }

        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return minutes === 0 ?
          0 :
          parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            hooks.updateOffset(res, false);
            return res;
        } else {
            return createLocal(input).local();
        }
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime, keepMinutes) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
                if (input === null) {
                    return this;
                }
            } else if (Math.abs(input) < 16 && !keepMinutes) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    addSubtract(this, createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm != null) {
            this.utcOffset(this._tzm, false, true);
        } else if (typeof this._i === 'string') {
            var tZone = offsetFromString(matchOffset, this._i);
            if (tZone != null) {
                this.utcOffset(tZone);
            }
            else {
                this.utcOffset(0, true);
            }
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal () {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset () {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc () {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    // and further modified to allow for strings containing both week and day
    var isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

    function createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (isNumber(input)) {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])                         * sign,
                h  : toInt(match[HOUR])                         * sign,
                m  : toInt(match[MINUTE])                       * sign,
                s  : toInt(match[SECOND])                       * sign,
                ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
            };
        } else if (!!(match = isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                w : parseIso(match[4], sign),
                d : parseIso(match[5], sign),
                h : parseIso(match[6], sign),
                m : parseIso(match[7], sign),
                s : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    createDuration.fn = Duration.prototype;
    createDuration.invalid = createInvalid$1;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return {milliseconds: 0, months: 0};
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
                'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = createDuration(val, period);
            addSubtract(this, dur, direction);
            return this;
        };
    }

    function addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (months) {
            setMonth(mom, get(mom, 'Month') + months * isAdding);
        }
        if (days) {
            set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
        }
        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (updateOffset) {
            hooks.updateOffset(mom, days || months);
        }
    }

    var add      = createAdder(1, 'add');
    var subtract = createAdder(-1, 'subtract');

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
    }

    function calendar$1 (time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = hooks.calendarFormat(this, sod) || 'sameElse';

        var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

        return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore (input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween (from, to, units, inclusivity) {
        var localFrom = isMoment(from) ? from : createLocal(from),
            localTo = isMoment(to) ? to : createLocal(to);
        if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
            return false;
        }
        inclusivity = inclusivity || '()';
        return (inclusivity[0] === '(' ? this.isAfter(localFrom, units) : !this.isBefore(localFrom, units)) &&
            (inclusivity[1] === ')' ? this.isBefore(localTo, units) : !this.isAfter(localTo, units));
    }

    function isSame (input, units) {
        var localInput = isMoment(input) ? input : createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
        }
    }

    function isSameOrAfter (input, units) {
        return this.isSame(input, units) || this.isAfter(input, units);
    }

    function isSameOrBefore (input, units) {
        return this.isSame(input, units) || this.isBefore(input, units);
    }

    function diff (input, units, asFloat) {
        var that,
            zoneDelta,
            output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        switch (units) {
            case 'year': output = monthDiff(this, that) / 12; break;
            case 'month': output = monthDiff(this, that); break;
            case 'quarter': output = monthDiff(this, that) / 3; break;
            case 'second': output = (this - that) / 1e3; break; // 1000
            case 'minute': output = (this - that) / 6e4; break; // 1000 * 60
            case 'hour': output = (this - that) / 36e5; break; // 1000 * 60 * 60
            case 'day': output = (this - that - zoneDelta) / 864e5; break; // 1000 * 60 * 60 * 24, negate dst
            case 'week': output = (this - that - zoneDelta) / 6048e5; break; // 1000 * 60 * 60 * 24 * 7, negate dst
            default: output = this - that;
        }

        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function toISOString(keepOffset) {
        if (!this.isValid()) {
            return null;
        }
        var utc = keepOffset !== true;
        var m = utc ? this.clone().utc() : this;
        if (m.year() < 0 || m.year() > 9999) {
            return formatMoment(m, utc ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ');
        }
        if (isFunction(Date.prototype.toISOString)) {
            // native implementation is ~50x faster, use it when we can
            if (utc) {
                return this.toDate().toISOString();
            } else {
                return new Date(this.valueOf() + this.utcOffset() * 60 * 1000).toISOString().replace('Z', formatMoment(m, 'Z'));
            }
        }
        return formatMoment(m, utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ');
    }

    /**
     * Return a human readable representation of a moment that can
     * also be evaluated to get a new moment which is the same
     *
     * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
     */
    function inspect () {
        if (!this.isValid()) {
            return 'moment.invalid(/* ' + this._i + ' */)';
        }
        var func = 'moment';
        var zone = '';
        if (!this.isLocal()) {
            func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
            zone = 'Z';
        }
        var prefix = '[' + func + '("]';
        var year = (0 <= this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
        var datetime = '-MM-DD[T]HH:mm:ss.SSS';
        var suffix = zone + '[")]';

        return this.format(prefix + year + datetime + suffix);
    }

    function format (inputString) {
        if (!inputString) {
            inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 createLocal(time).isValid())) {
            return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow (withoutSuffix) {
        return this.from(createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 createLocal(time).isValid())) {
            return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow (withoutSuffix) {
        return this.to(createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    var MS_PER_SECOND = 1000;
    var MS_PER_MINUTE = 60 * MS_PER_SECOND;
    var MS_PER_HOUR = 60 * MS_PER_MINUTE;
    var MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;

    // actual modulo - handles negative numbers (for dates before 1970):
    function mod$1(dividend, divisor) {
        return (dividend % divisor + divisor) % divisor;
    }

    function localStartOfDate(y, m, d) {
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return new Date(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return new Date(y, m, d).valueOf();
        }
    }

    function utcStartOfDate(y, m, d) {
        // Date.UTC remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return Date.UTC(y, m, d);
        }
    }

    function startOf (units) {
        var time;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        var startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year(), 0, 1);
                break;
            case 'quarter':
                time = startOfDate(this.year(), this.month() - this.month() % 3, 1);
                break;
            case 'month':
                time = startOfDate(this.year(), this.month(), 1);
                break;
            case 'week':
                time = startOfDate(this.year(), this.month(), this.date() - this.weekday());
                break;
            case 'isoWeek':
                time = startOfDate(this.year(), this.month(), this.date() - (this.isoWeekday() - 1));
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date());
                break;
            case 'hour':
                time = this._d.valueOf();
                time -= mod$1(time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE), MS_PER_HOUR);
                break;
            case 'minute':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_MINUTE);
                break;
            case 'second':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_SECOND);
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function endOf (units) {
        var time;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        var startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year() + 1, 0, 1) - 1;
                break;
            case 'quarter':
                time = startOfDate(this.year(), this.month() - this.month() % 3 + 3, 1) - 1;
                break;
            case 'month':
                time = startOfDate(this.year(), this.month() + 1, 1) - 1;
                break;
            case 'week':
                time = startOfDate(this.year(), this.month(), this.date() - this.weekday() + 7) - 1;
                break;
            case 'isoWeek':
                time = startOfDate(this.year(), this.month(), this.date() - (this.isoWeekday() - 1) + 7) - 1;
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
                break;
            case 'hour':
                time = this._d.valueOf();
                time += MS_PER_HOUR - mod$1(time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE), MS_PER_HOUR) - 1;
                break;
            case 'minute':
                time = this._d.valueOf();
                time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
                break;
            case 'second':
                time = this._d.valueOf();
                time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function valueOf () {
        return this._d.valueOf() - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate () {
        return new Date(this.valueOf());
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function toJSON () {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function isValid$2 () {
        return isValid(this);
    }

    function parsingFlags () {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict
        };
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);


    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input,
                this.week(),
                this.weekday(),
                this.localeData()._week.dow,
                this.localeData()._week.doy);
    }

    function getSetISOWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input, this.isoWeek(), this.isoWeekday(), 1, 4);
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIORITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        // TODO: Remove "ordinalParse" fallback in next major release.
        return isStrict ?
          (locale._dayOfMonthOrdinalParse || locale._ordinalParse) :
          locale._dayOfMonthOrdinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0]);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var proto = Moment.prototype;

    proto.add               = add;
    proto.calendar          = calendar$1;
    proto.clone             = clone;
    proto.diff              = diff;
    proto.endOf             = endOf;
    proto.format            = format;
    proto.from              = from;
    proto.fromNow           = fromNow;
    proto.to                = to;
    proto.toNow             = toNow;
    proto.get               = stringGet;
    proto.invalidAt         = invalidAt;
    proto.isAfter           = isAfter;
    proto.isBefore          = isBefore;
    proto.isBetween         = isBetween;
    proto.isSame            = isSame;
    proto.isSameOrAfter     = isSameOrAfter;
    proto.isSameOrBefore    = isSameOrBefore;
    proto.isValid           = isValid$2;
    proto.lang              = lang;
    proto.locale            = locale;
    proto.localeData        = localeData;
    proto.max               = prototypeMax;
    proto.min               = prototypeMin;
    proto.parsingFlags      = parsingFlags;
    proto.set               = stringSet;
    proto.startOf           = startOf;
    proto.subtract          = subtract;
    proto.toArray           = toArray;
    proto.toObject          = toObject;
    proto.toDate            = toDate;
    proto.toISOString       = toISOString;
    proto.inspect           = inspect;
    proto.toJSON            = toJSON;
    proto.toString          = toString;
    proto.unix              = unix;
    proto.valueOf           = valueOf;
    proto.creationData      = creationData;
    proto.year       = getSetYear;
    proto.isLeapYear = getIsLeapYear;
    proto.weekYear    = getSetWeekYear;
    proto.isoWeekYear = getSetISOWeekYear;
    proto.quarter = proto.quarters = getSetQuarter;
    proto.month       = getSetMonth;
    proto.daysInMonth = getDaysInMonth;
    proto.week           = proto.weeks        = getSetWeek;
    proto.isoWeek        = proto.isoWeeks     = getSetISOWeek;
    proto.weeksInYear    = getWeeksInYear;
    proto.isoWeeksInYear = getISOWeeksInYear;
    proto.date       = getSetDayOfMonth;
    proto.day        = proto.days             = getSetDayOfWeek;
    proto.weekday    = getSetLocaleDayOfWeek;
    proto.isoWeekday = getSetISODayOfWeek;
    proto.dayOfYear  = getSetDayOfYear;
    proto.hour = proto.hours = getSetHour;
    proto.minute = proto.minutes = getSetMinute;
    proto.second = proto.seconds = getSetSecond;
    proto.millisecond = proto.milliseconds = getSetMillisecond;
    proto.utcOffset            = getSetOffset;
    proto.utc                  = setOffsetToUTC;
    proto.local                = setOffsetToLocal;
    proto.parseZone            = setOffsetToParsedOffset;
    proto.hasAlignedHourOffset = hasAlignedHourOffset;
    proto.isDST                = isDaylightSavingTime;
    proto.isLocal              = isLocal;
    proto.isUtcOffset          = isUtcOffset;
    proto.isUtc                = isUtc;
    proto.isUTC                = isUtc;
    proto.zoneAbbr = getZoneAbbr;
    proto.zoneName = getZoneName;
    proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
    proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

    function createUnix (input) {
        return createLocal(input * 1000);
    }

    function createInZone () {
        return createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat (string) {
        return string;
    }

    var proto$1 = Locale.prototype;

    proto$1.calendar        = calendar;
    proto$1.longDateFormat  = longDateFormat;
    proto$1.invalidDate     = invalidDate;
    proto$1.ordinal         = ordinal;
    proto$1.preparse        = preParsePostFormat;
    proto$1.postformat      = preParsePostFormat;
    proto$1.relativeTime    = relativeTime;
    proto$1.pastFuture      = pastFuture;
    proto$1.set             = set;

    proto$1.months            =        localeMonths;
    proto$1.monthsShort       =        localeMonthsShort;
    proto$1.monthsParse       =        localeMonthsParse;
    proto$1.monthsRegex       = monthsRegex;
    proto$1.monthsShortRegex  = monthsShortRegex;
    proto$1.week = localeWeek;
    proto$1.firstDayOfYear = localeFirstDayOfYear;
    proto$1.firstDayOfWeek = localeFirstDayOfWeek;

    proto$1.weekdays       =        localeWeekdays;
    proto$1.weekdaysMin    =        localeWeekdaysMin;
    proto$1.weekdaysShort  =        localeWeekdaysShort;
    proto$1.weekdaysParse  =        localeWeekdaysParse;

    proto$1.weekdaysRegex       =        weekdaysRegex;
    proto$1.weekdaysShortRegex  =        weekdaysShortRegex;
    proto$1.weekdaysMinRegex    =        weekdaysMinRegex;

    proto$1.isPM = localeIsPM;
    proto$1.meridiem = localeMeridiem;

    function get$1 (format, index, field, setter) {
        var locale = getLocale();
        var utc = createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl (format, index, field) {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return get$1(format, index, field, 'month');
        }

        var i;
        var out = [];
        for (i = 0; i < 12; i++) {
            out[i] = get$1(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl (localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = getLocale(),
            shift = localeSorted ? locale._week.dow : 0;

        if (index != null) {
            return get$1(format, (index + shift) % 7, field, 'day');
        }

        var i;
        var out = [];
        for (i = 0; i < 7; i++) {
            out[i] = get$1(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function listMonths (format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function listMonthsShort (format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function listWeekdays (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function listWeekdaysShort (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function listWeekdaysMin (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    getSetGlobalLocale('en', {
        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports

    hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
    hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

    var mathAbs = Math.abs;

    function abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function addSubtract$1 (duration, input, value, direction) {
        var other = createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function add$1 (input, value) {
        return addSubtract$1(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function subtract$1 (input, value) {
        return addSubtract$1(this, input, value, -1);
    }

    function absCeil (number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToMonths (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays (months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as (units) {
        if (!this.isValid()) {
            return NaN;
        }
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'quarter' || units === 'year') {
            days = this._days + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            switch (units) {
                case 'month':   return months;
                case 'quarter': return months / 3;
                case 'year':    return months / 12;
            }
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week'   : return days / 7     + milliseconds / 6048e5;
                case 'day'    : return days         + milliseconds / 864e5;
                case 'hour'   : return days * 24    + milliseconds / 36e5;
                case 'minute' : return days * 1440  + milliseconds / 6e4;
                case 'second' : return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function valueOf$1 () {
        if (!this.isValid()) {
            return NaN;
        }
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asQuarters     = makeAs('Q');
    var asYears        = makeAs('y');

    function clone$1 () {
        return createDuration(this);
    }

    function get$2 (units) {
        units = normalizeUnits(units);
        return this.isValid() ? this[units + 's']() : NaN;
    }

    function makeGetter(name) {
        return function () {
            return this.isValid() ? this._data[name] : NaN;
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        ss: 44,         // a few seconds to seconds
        s : 45,         // seconds to minute
        m : 45,         // minutes to hour
        h : 22,         // hours to day
        d : 26,         // days to month
        M : 11          // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
        var duration = createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds <= thresholds.ss && ['s', seconds]  ||
                seconds < thresholds.s   && ['ss', seconds] ||
                minutes <= 1             && ['m']           ||
                minutes < thresholds.m   && ['mm', minutes] ||
                hours   <= 1             && ['h']           ||
                hours   < thresholds.h   && ['hh', hours]   ||
                days    <= 1             && ['d']           ||
                days    < thresholds.d   && ['dd', days]    ||
                months  <= 1             && ['M']           ||
                months  < thresholds.M   && ['MM', months]  ||
                years   <= 1             && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function getSetRelativeTimeRounding (roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof(roundingFunction) === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        if (threshold === 's') {
            thresholds.ss = limit - 1;
        }
        return true;
    }

    function humanize (withSuffix) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var locale = this.localeData();
        var output = relativeTime$1(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var abs$1 = Math.abs;

    function sign(x) {
        return ((x > 0) - (x < 0)) || +x;
    }

    function toISOString$1() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var seconds = abs$1(this._milliseconds) / 1000;
        var days         = abs$1(this._days);
        var months       = abs$1(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes           = absFloor(seconds / 60);
        hours             = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years  = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        var totalSign = total < 0 ? '-' : '';
        var ymSign = sign(this._months) !== sign(total) ? '-' : '';
        var daysSign = sign(this._days) !== sign(total) ? '-' : '';
        var hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

        return totalSign + 'P' +
            (Y ? ymSign + Y + 'Y' : '') +
            (M ? ymSign + M + 'M' : '') +
            (D ? daysSign + D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? hmsSign + h + 'H' : '') +
            (m ? hmsSign + m + 'M' : '') +
            (s ? hmsSign + s + 'S' : '');
    }

    var proto$2 = Duration.prototype;

    proto$2.isValid        = isValid$1;
    proto$2.abs            = abs;
    proto$2.add            = add$1;
    proto$2.subtract       = subtract$1;
    proto$2.as             = as;
    proto$2.asMilliseconds = asMilliseconds;
    proto$2.asSeconds      = asSeconds;
    proto$2.asMinutes      = asMinutes;
    proto$2.asHours        = asHours;
    proto$2.asDays         = asDays;
    proto$2.asWeeks        = asWeeks;
    proto$2.asMonths       = asMonths;
    proto$2.asQuarters     = asQuarters;
    proto$2.asYears        = asYears;
    proto$2.valueOf        = valueOf$1;
    proto$2._bubble        = bubble;
    proto$2.clone          = clone$1;
    proto$2.get            = get$2;
    proto$2.milliseconds   = milliseconds;
    proto$2.seconds        = seconds;
    proto$2.minutes        = minutes;
    proto$2.hours          = hours;
    proto$2.days           = days;
    proto$2.weeks          = weeks;
    proto$2.months         = months;
    proto$2.years          = years;
    proto$2.humanize       = humanize;
    proto$2.toISOString    = toISOString$1;
    proto$2.toString       = toISOString$1;
    proto$2.toJSON         = toISOString$1;
    proto$2.locale         = locale;
    proto$2.localeData     = localeData;

    proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
    proto$2.lang = lang;

    // Side effect imports

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    hooks.version = '2.24.0';

    setHookCallback(createLocal);

    hooks.fn                    = proto;
    hooks.min                   = min;
    hooks.max                   = max;
    hooks.now                   = now;
    hooks.utc                   = createUTC;
    hooks.unix                  = createUnix;
    hooks.months                = listMonths;
    hooks.isDate                = isDate;
    hooks.locale                = getSetGlobalLocale;
    hooks.invalid               = createInvalid;
    hooks.duration              = createDuration;
    hooks.isMoment              = isMoment;
    hooks.weekdays              = listWeekdays;
    hooks.parseZone             = createInZone;
    hooks.localeData            = getLocale;
    hooks.isDuration            = isDuration;
    hooks.monthsShort           = listMonthsShort;
    hooks.weekdaysMin           = listWeekdaysMin;
    hooks.defineLocale          = defineLocale;
    hooks.updateLocale          = updateLocale;
    hooks.locales               = listLocales;
    hooks.weekdaysShort         = listWeekdaysShort;
    hooks.normalizeUnits        = normalizeUnits;
    hooks.relativeTimeRounding  = getSetRelativeTimeRounding;
    hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
    hooks.calendarFormat        = getCalendarFormat;
    hooks.prototype             = proto;

    // currently HTML5 input type only supports 24-hour formats
    hooks.HTML5_FMT = {
        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm',             // <input type="datetime-local" />
        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss',  // <input type="datetime-local" step="1" />
        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS',   // <input type="datetime-local" step="0.001" />
        DATE: 'YYYY-MM-DD',                             // <input type="date" />
        TIME: 'HH:mm',                                  // <input type="time" />
        TIME_SECONDS: 'HH:mm:ss',                       // <input type="time" step="1" />
        TIME_MS: 'HH:mm:ss.SSS',                        // <input type="time" step="0.001" />
        WEEK: 'GGGG-[W]WW',                             // <input type="week" />
        MONTH: 'YYYY-MM'                                // <input type="month" />
    };

    return hooks;

})));
  })();
});

require.register("pubnub/dist/web/pubnub.min.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "pubnub");
  (function() {
    !function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.PubNub=t():e.PubNub=t()}(window,function(){return r={},i.m=n=[function(e,t,n){"use strict";e.exports={}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;t.default={PNTimeOperation:"PNTimeOperation",PNHistoryOperation:"PNHistoryOperation",PNDeleteMessagesOperation:"PNDeleteMessagesOperation",PNFetchMessagesOperation:"PNFetchMessagesOperation",PNMessageCounts:"PNMessageCountsOperation",PNSubscribeOperation:"PNSubscribeOperation",PNUnsubscribeOperation:"PNUnsubscribeOperation",PNPublishOperation:"PNPublishOperation",PNSignalOperation:"PNSignalOperation",PNAddMessageActionOperation:"PNAddActionOperation",PNRemoveMessageActionOperation:"PNRemoveMessageActionOperation",PNGetMessageActionsOperation:"PNGetMessageActionsOperation",PNCreateUserOperation:"PNCreateUserOperation",PNUpdateUserOperation:"PNUpdateUserOperation",PNDeleteUserOperation:"PNDeleteUserOperation",PNGetUserOperation:"PNGetUsersOperation",PNGetUsersOperation:"PNGetUsersOperation",PNCreateSpaceOperation:"PNCreateSpaceOperation",PNUpdateSpaceOperation:"PNUpdateSpaceOperation",PNDeleteSpaceOperation:"PNDeleteSpaceOperation",PNGetSpaceOperation:"PNGetSpacesOperation",PNGetSpacesOperation:"PNGetSpacesOperation",PNGetMembersOperation:"PNGetMembersOperation",PNUpdateMembersOperation:"PNUpdateMembersOperation",PNGetMembershipsOperation:"PNGetMembershipsOperation",PNUpdateMembershipsOperation:"PNUpdateMembershipsOperation",PNPushNotificationEnabledChannelsOperation:"PNPushNotificationEnabledChannelsOperation",PNRemoveAllPushNotificationsOperation:"PNRemoveAllPushNotificationsOperation",PNWhereNowOperation:"PNWhereNowOperation",PNSetStateOperation:"PNSetStateOperation",PNHereNowOperation:"PNHereNowOperation",PNGetStateOperation:"PNGetStateOperation",PNHeartbeatOperation:"PNHeartbeatOperation",PNChannelGroupsOperation:"PNChannelGroupsOperation",PNRemoveGroupOperation:"PNRemoveGroupOperation",PNChannelsForGroupOperation:"PNChannelsForGroupOperation",PNAddChannelsToGroupOperation:"PNAddChannelsToGroupOperation",PNRemoveChannelsFromGroupOperation:"PNRemoveChannelsFromGroupOperation",PNAccessManagerGrant:"PNAccessManagerGrant",PNAccessManagerGrantToken:"PNAccessManagerGrantToken",PNAccessManagerAudit:"PNAccessManagerAudit"},e.exports=t.default},function(e,t,n){"use strict";function r(e){return encodeURIComponent(e).replace(/[!~*'()]/g,function(e){return"%".concat(e.charCodeAt(0).toString(16).toUpperCase())})}function i(e){return function(e){var t=[];return Object.keys(e).forEach(function(e){return t.push(e)}),t}(e).sort()}e.exports={signPamFromParams:function(t){return i(t).map(function(e){return"".concat(e,"=").concat(r(t[e]))}).join("&")},endsWith:function(e,t){return-1!==e.indexOf(t,this.length-t.length)},createPromise:function(){var n,r;return{promise:new Promise(function(e,t){n=e,r=t}),reject:r,fulfill:n}},encodeString:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r,i=(r=n(5))&&r.__esModule?r:{default:r};n(0);function o(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function s(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var a,u,c,f=(a=l,(u=[{key:"getAuthKey",value:function(){return this.authKey}},{key:"setAuthKey",value:function(e){return this.authKey=e,this}},{key:"setCipherKey",value:function(e){return this.cipherKey=e,this}},{key:"getUUID",value:function(){return this.UUID}},{key:"setUUID",value:function(e){return this._db&&this._db.set&&this._db.set("".concat(this.subscribeKey,"uuid"),e),this.UUID=e,this}},{key:"getFilterExpression",value:function(){return this.filterExpression}},{key:"setFilterExpression",value:function(e){return this.filterExpression=e,this}},{key:"getPresenceTimeout",value:function(){return this._presenceTimeout}},{key:"setPresenceTimeout",value:function(e){return 20<=e?this._presenceTimeout=e:(this._presenceTimeout=20,console.log("WARNING: Presence timeout is less than the minimum. Using minimum value: ",this._presenceTimeout)),this.setHeartbeatInterval(this._presenceTimeout/2-1),this}},{key:"setProxy",value:function(e){this.proxy=e}},{key:"getHeartbeatInterval",value:function(){return this._heartbeatInterval}},{key:"setHeartbeatInterval",value:function(e){return this._heartbeatInterval=e,this}},{key:"getSubscribeTimeout",value:function(){return this._subscribeRequestTimeout}},{key:"setSubscribeTimeout",value:function(e){return this._subscribeRequestTimeout=e,this}},{key:"getTransactionTimeout",value:function(){return this._transactionalRequestTimeout}},{key:"setTransactionTimeout",value:function(e){return this._transactionalRequestTimeout=e,this}},{key:"isSendBeaconEnabled",value:function(){return this._useSendBeacon}},{key:"setSendBeaconConfig",value:function(e){return this._useSendBeacon=e,this}},{key:"getVersion",value:function(){return"4.27.3"}},{key:"_addPnsdkSuffix",value:function(e,t){this._PNSDKSuffix[e]=t}},{key:"_getPnsdkSuffix",value:function(n){var r=this;return Object.keys(this._PNSDKSuffix).reduce(function(e,t){return e+n+r._PNSDKSuffix[t]},"")}},{key:"_decideUUID",value:function(e){return e||(this._db&&this._db.get&&this._db.get("".concat(this.subscribeKey,"uuid"))?this._db.get("".concat(this.subscribeKey,"uuid")):"pn-".concat(i.default.createUUID()))}}])&&o(a.prototype,u),void(c&&o(a,c)),l);function l(e){var t=e.setup,n=e.db;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l),s(this,"_db",void 0),s(this,"subscribeKey",void 0),s(this,"publishKey",void 0),s(this,"secretKey",void 0),s(this,"cipherKey",void 0),s(this,"authKey",void 0),s(this,"UUID",void 0),s(this,"proxy",void 0),s(this,"instanceId",void 0),s(this,"sdkName",void 0),s(this,"sdkFamily",void 0),s(this,"partnerId",void 0),s(this,"filterExpression",void 0),s(this,"suppressLeaveEvents",void 0),s(this,"secure",void 0),s(this,"origin",void 0),s(this,"logVerbosity",void 0),s(this,"useInstanceId",void 0),s(this,"useRequestId",void 0),s(this,"keepAlive",void 0),s(this,"keepAliveSettings",void 0),s(this,"autoNetworkDetection",void 0),s(this,"announceSuccessfulHeartbeats",void 0),s(this,"announceFailedHeartbeats",void 0),s(this,"_presenceTimeout",void 0),s(this,"_heartbeatInterval",void 0),s(this,"_subscribeRequestTimeout",void 0),s(this,"_transactionalRequestTimeout",void 0),s(this,"_useSendBeacon",void 0),s(this,"_PNSDKSuffix",void 0),s(this,"requestMessageCountThreshold",void 0),s(this,"restore",void 0),s(this,"dedupeOnSubscribe",void 0),s(this,"maximumCacheSize",void 0),s(this,"customEncrypt",void 0),s(this,"customDecrypt",void 0),this._PNSDKSuffix={},this._db=n,this.instanceId="pn-".concat(i.default.createUUID()),this.secretKey=t.secretKey||t.secret_key,this.subscribeKey=t.subscribeKey||t.subscribe_key,this.publishKey=t.publishKey||t.publish_key,this.sdkName=t.sdkName,this.sdkFamily=t.sdkFamily,this.partnerId=t.partnerId,this.setAuthKey(t.authKey),this.setCipherKey(t.cipherKey),this.setFilterExpression(t.filterExpression),this.origin=t.origin||"ps.pndsn.com",this.secure=t.ssl||!1,this.restore=t.restore||!1,this.proxy=t.proxy,this.keepAlive=t.keepAlive,this.keepAliveSettings=t.keepAliveSettings,this.autoNetworkDetection=t.autoNetworkDetection||!1,this.dedupeOnSubscribe=t.dedupeOnSubscribe||!1,this.maximumCacheSize=t.maximumCacheSize||100,this.customEncrypt=t.customEncrypt,this.customDecrypt=t.customDecrypt,"undefined"!=typeof location&&"https:"===location.protocol&&(this.secure=!0),this.logVerbosity=t.logVerbosity||!1,this.suppressLeaveEvents=t.suppressLeaveEvents||!1,this.announceFailedHeartbeats=t.announceFailedHeartbeats||!0,this.announceSuccessfulHeartbeats=t.announceSuccessfulHeartbeats||!1,this.useInstanceId=t.useInstanceId||!1,this.useRequestId=t.useRequestId||!1,this.requestMessageCountThreshold=t.requestMessageCountThreshold,this.setTransactionTimeout(t.transactionalRequestTimeout||15e3),this.setSubscribeTimeout(t.subscribeRequestTimeout||31e4),this.setSendBeaconConfig(t.useSendBeacon||!0),t.presenceTimeout?this.setPresenceTimeout(t.presenceTimeout):this._presenceTimeout=300,null!=t.heartbeatInterval&&this.setHeartbeatInterval(t.heartbeatInterval),this.setUUID(this._decideUUID(t.uuid))}t.default=f,e.exports=t.default},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;t.default={PNNetworkUpCategory:"PNNetworkUpCategory",PNNetworkDownCategory:"PNNetworkDownCategory",PNNetworkIssuesCategory:"PNNetworkIssuesCategory",PNTimeoutCategory:"PNTimeoutCategory",PNBadRequestCategory:"PNBadRequestCategory",PNAccessDeniedCategory:"PNAccessDeniedCategory",PNUnknownCategory:"PNUnknownCategory",PNReconnectedCategory:"PNReconnectedCategory",PNConnectedCategory:"PNConnectedCategory",PNRequestMessageCountExceededCategory:"PNRequestMessageCountExceededCategory"},e.exports=t.default},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r,i=(r=n(13))&&r.__esModule?r:{default:r};var o={createUUID:function(){return i.default.uuid?i.default.uuid():(0,i.default)()}};t.default=o,e.exports=t.default},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;r(n(3));var u=r(n(14));function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var s,a,c,f=(s=l,(a=[{key:"HMACSHA256",value:function(e){return u.default.HmacSHA256(e,this._config.secretKey).toString(u.default.enc.Base64)}},{key:"SHA256",value:function(e){return u.default.SHA256(e).toString(u.default.enc.Hex)}},{key:"_parseOptions",value:function(e){var t=e||{};return t.hasOwnProperty("encryptKey")||(t.encryptKey=this._defaultOptions.encryptKey),t.hasOwnProperty("keyEncoding")||(t.keyEncoding=this._defaultOptions.keyEncoding),t.hasOwnProperty("keyLength")||(t.keyLength=this._defaultOptions.keyLength),t.hasOwnProperty("mode")||(t.mode=this._defaultOptions.mode),-1===this._allowedKeyEncodings.indexOf(t.keyEncoding.toLowerCase())&&(t.keyEncoding=this._defaultOptions.keyEncoding),-1===this._allowedKeyLengths.indexOf(parseInt(t.keyLength,10))&&(t.keyLength=this._defaultOptions.keyLength),-1===this._allowedModes.indexOf(t.mode.toLowerCase())&&(t.mode=this._defaultOptions.mode),t}},{key:"_decodeKey",value:function(e,t){return"base64"===t.keyEncoding?u.default.enc.Base64.parse(e):"hex"===t.keyEncoding?u.default.enc.Hex.parse(e):e}},{key:"_getPaddedKey",value:function(e,t){return e=this._decodeKey(e,t),t.encryptKey?u.default.enc.Utf8.parse(this.SHA256(e).slice(0,32)):e}},{key:"_getMode",value:function(e){return"ecb"===e.mode?u.default.mode.ECB:u.default.mode.CBC}},{key:"_getIV",value:function(e){return"cbc"===e.mode?u.default.enc.Utf8.parse(this._iv):null}},{key:"encrypt",value:function(e,t,n){return this._config.customEncrypt?this._config.customEncrypt(e):this.pnEncrypt(e,t,n)}},{key:"decrypt",value:function(e,t,n){return this._config.customDecrypt?this._config.customDecrypt(e):this.pnDecrypt(e,t,n)}},{key:"pnEncrypt",value:function(e,t,n){if(!t&&!this._config.cipherKey)return e;n=this._parseOptions(n);var r=this._getIV(n),i=this._getMode(n),o=this._getPaddedKey(t||this._config.cipherKey,n);return u.default.AES.encrypt(e,o,{iv:r,mode:i}).ciphertext.toString(u.default.enc.Base64)||e}},{key:"pnDecrypt",value:function(e,t,n){if(!t&&!this._config.cipherKey)return e;n=this._parseOptions(n);var r=this._getIV(n),i=this._getMode(n),o=this._getPaddedKey(t||this._config.cipherKey,n);try{var s=u.default.enc.Base64.parse(e),a=u.default.AES.decrypt({ciphertext:s},o,{iv:r,mode:i}).toString(u.default.enc.Utf8);return JSON.parse(a)}catch(e){return null}}}])&&i(s.prototype,a),void(c&&i(s,c)),l);function l(e){var t=e.config;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l),o(this,"_config",void 0),o(this,"_iv",void 0),o(this,"_allowedKeyEncodings",void 0),o(this,"_allowedKeyLengths",void 0),o(this,"_allowedModes",void 0),o(this,"_defaultOptions",void 0),this._config=t,this._iv="0123456789012345",this._allowedKeyEncodings=["hex","utf8","base64","binary"],this._allowedKeyLengths=[128,256],this._allowedModes=["ecb","cbc"],this._defaultOptions={encryptKey:!0,keyEncoding:"utf8",keyLength:256,mode:"cbc"}}t.default=f,e.exports=t.default},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;n(0);var r,i=(r=n(4))&&r.__esModule?r:{default:r};function o(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}var s,a,u,c=(s=f,(a=[{key:"addListener",value:function(e){this._listeners.push(e)}},{key:"removeListener",value:function(t){var n=[];this._listeners.forEach(function(e){e!==t&&n.push(e)}),this._listeners=n}},{key:"removeAllListeners",value:function(){this._listeners=[]}},{key:"announcePresence",value:function(t){this._listeners.forEach(function(e){e.presence&&e.presence(t)})}},{key:"announceStatus",value:function(t){this._listeners.forEach(function(e){e.status&&e.status(t)})}},{key:"announceMessage",value:function(t){this._listeners.forEach(function(e){e.message&&e.message(t)})}},{key:"announceSignal",value:function(t){this._listeners.forEach(function(e){e.signal&&e.signal(t)})}},{key:"announceMessageAction",value:function(t){this._listeners.forEach(function(e){e.messageAction&&e.messageAction(t)})}},{key:"announceUser",value:function(t){this._listeners.forEach(function(e){e.user&&e.user(t)})}},{key:"announceSpace",value:function(t){this._listeners.forEach(function(e){e.space&&e.space(t)})}},{key:"announceMembership",value:function(t){this._listeners.forEach(function(e){e.membership&&e.membership(t)})}},{key:"announceNetworkUp",value:function(){var e={};e.category=i.default.PNNetworkUpCategory,this.announceStatus(e)}},{key:"announceNetworkDown",value:function(){var e={};e.category=i.default.PNNetworkDownCategory,this.announceStatus(e)}}])&&o(s.prototype,a),void(u&&o(s,u)),f);function f(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,f),function(e,t,n){t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n}(this,"_listeners",void 0),this._listeners=[]}t.default=c,e.exports=t.default},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNTimeOperation},t.getURL=function(){return"/time/0"},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.prepareParams=function(){return{}},t.isAuthSupported=function(){return!1},t.handleResponse=function(e,t){return{timetoken:t[0]}},t.validateParams=function(){};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,I,D){"use strict";(function(e){var r=D(71),o=D(72),s=D(73);function n(){return l.TYPED_ARRAY_SUPPORT?2147483647:1073741823}function a(e,t){if(n()<t)throw new RangeError("Invalid typed array length");return l.TYPED_ARRAY_SUPPORT?(e=new Uint8Array(t)).__proto__=l.prototype:(null===e&&(e=new l(t)),e.length=t),e}function l(e,t,n){if(!(l.TYPED_ARRAY_SUPPORT||this instanceof l))return new l(e,t,n);if("number"!=typeof e)return i(this,e,t,n);if("string"==typeof t)throw new Error("If encoding is specified then the first argument must be a string");return c(this,e)}function i(e,t,n,r){if("number"==typeof t)throw new TypeError('"value" argument must not be a number');return"undefined"!=typeof ArrayBuffer&&t instanceof ArrayBuffer?function(e,t,n,r){if(t.byteLength,n<0||t.byteLength<n)throw new RangeError("'offset' is out of bounds");if(t.byteLength<n+(r||0))throw new RangeError("'length' is out of bounds");t=void 0===n&&void 0===r?new Uint8Array(t):void 0===r?new Uint8Array(t,n):new Uint8Array(t,n,r);l.TYPED_ARRAY_SUPPORT?(e=t).__proto__=l.prototype:e=f(e,t);return e}(e,t,n,r):"string"==typeof t?function(e,t,n){"string"==typeof n&&""!==n||(n="utf8");if(!l.isEncoding(n))throw new TypeError('"encoding" must be a valid string encoding');var r=0|p(t,n),i=(e=a(e,r)).write(t,n);i!==r&&(e=e.slice(0,i));return e}(e,t,n):function(e,t){if(l.isBuffer(t)){var n=0|h(t.length);return 0===(e=a(e,n)).length||t.copy(e,0,0,n),e}if(t){if("undefined"!=typeof ArrayBuffer&&t.buffer instanceof ArrayBuffer||"length"in t)return"number"!=typeof t.length||function(e){return e!=e}(t.length)?a(e,0):f(e,t);if("Buffer"===t.type&&s(t.data))return f(e,t.data)}throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")}(e,t)}function u(e){if("number"!=typeof e)throw new TypeError('"size" argument must be a number');if(e<0)throw new RangeError('"size" argument must not be negative')}function c(e,t){if(u(t),e=a(e,t<0?0:0|h(t)),!l.TYPED_ARRAY_SUPPORT)for(var n=0;n<t;++n)e[n]=0;return e}function f(e,t){var n=t.length<0?0:0|h(t.length);e=a(e,n);for(var r=0;r<n;r+=1)e[r]=255&t[r];return e}function h(e){if(e>=n())throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+n().toString(16)+" bytes");return 0|e}function p(e,t){if(l.isBuffer(e))return e.length;if("undefined"!=typeof ArrayBuffer&&"function"==typeof ArrayBuffer.isView&&(ArrayBuffer.isView(e)||e instanceof ArrayBuffer))return e.byteLength;"string"!=typeof e&&(e=""+e);var n=e.length;if(0===n)return 0;for(var r=!1;;)switch(t){case"ascii":case"latin1":case"binary":return n;case"utf8":case"utf-8":case void 0:return x(e).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*n;case"hex":return n>>>1;case"base64":return U(e).length;default:if(r)return x(e).length;t=(""+t).toLowerCase(),r=!0}}function d(e,t,n){var r=e[t];e[t]=e[n],e[n]=r}function g(e,t,n,r,i){if(0===e.length)return-1;if("string"==typeof n?(r=n,n=0):2147483647<n?n=2147483647:n<-2147483648&&(n=-2147483648),n=+n,isNaN(n)&&(n=i?0:e.length-1),n<0&&(n=e.length+n),n>=e.length){if(i)return-1;n=e.length-1}else if(n<0){if(!i)return-1;n=0}if("string"==typeof t&&(t=l.from(t,r)),l.isBuffer(t))return 0===t.length?-1:y(e,t,n,r,i);if("number"==typeof t)return t&=255,l.TYPED_ARRAY_SUPPORT&&"function"==typeof Uint8Array.prototype.indexOf?i?Uint8Array.prototype.indexOf.call(e,t,n):Uint8Array.prototype.lastIndexOf.call(e,t,n):y(e,[t],n,r,i);throw new TypeError("val must be string, number or Buffer")}function y(e,t,n,r,i){var o,s=1,a=e.length,u=t.length;if(void 0!==r&&("ucs2"===(r=String(r).toLowerCase())||"ucs-2"===r||"utf16le"===r||"utf-16le"===r)){if(e.length<2||t.length<2)return-1;a/=s=2,u/=2,n/=2}function c(e,t){return 1===s?e[t]:e.readUInt16BE(t*s)}if(i){var f=-1;for(o=n;o<a;o++)if(c(e,o)===c(t,-1===f?0:o-f)){if(-1===f&&(f=o),o-f+1===u)return f*s}else-1!==f&&(o-=o-f),f=-1}else for(a<n+u&&(n=a-u),o=n;0<=o;o--){for(var l=!0,h=0;h<u;h++)if(c(e,o+h)!==c(t,h)){l=!1;break}if(l)return o}return-1}function v(e,t,n,r){n=Number(n)||0;var i=e.length-n;r?i<(r=Number(r))&&(r=i):r=i;var o=t.length;if(o%2!=0)throw new TypeError("Invalid hex string");o/2<r&&(r=o/2);for(var s=0;s<r;++s){var a=parseInt(t.substr(2*s,2),16);if(isNaN(a))return s;e[n+s]=a}return s}function b(e,t,n,r){return B(function(e){for(var t=[],n=0;n<e.length;++n)t.push(255&e.charCodeAt(n));return t}(t),e,n,r)}function m(e,t,n){return 0===t&&n===e.length?r.fromByteArray(e):r.fromByteArray(e.slice(t,n))}function _(e,t,n){n=Math.min(e.length,n);for(var r=[],i=t;i<n;){var o,s,a,u,c=e[i],f=null,l=239<c?4:223<c?3:191<c?2:1;if(i+l<=n)switch(l){case 1:c<128&&(f=c);break;case 2:128==(192&(o=e[i+1]))&&127<(u=(31&c)<<6|63&o)&&(f=u);break;case 3:o=e[i+1],s=e[i+2],128==(192&o)&&128==(192&s)&&2047<(u=(15&c)<<12|(63&o)<<6|63&s)&&(u<55296||57343<u)&&(f=u);break;case 4:o=e[i+1],s=e[i+2],a=e[i+3],128==(192&o)&&128==(192&s)&&128==(192&a)&&65535<(u=(15&c)<<18|(63&o)<<12|(63&s)<<6|63&a)&&u<1114112&&(f=u)}null===f?(f=65533,l=1):65535<f&&(f-=65536,r.push(f>>>10&1023|55296),f=56320|1023&f),r.push(f),i+=l}return function(e){var t=e.length;if(t<=k)return String.fromCharCode.apply(String,e);var n="",r=0;for(;r<t;)n+=String.fromCharCode.apply(String,e.slice(r,r+=k));return n}(r)}I.Buffer=l,I.SlowBuffer=function(e){+e!=e&&(e=0);return l.alloc(+e)},I.INSPECT_MAX_BYTES=50,l.TYPED_ARRAY_SUPPORT=void 0!==e.TYPED_ARRAY_SUPPORT?e.TYPED_ARRAY_SUPPORT:function(){try{var e=new Uint8Array(1);return e.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}},42===e.foo()&&"function"==typeof e.subarray&&0===e.subarray(1,1).byteLength}catch(e){return!1}}(),I.kMaxLength=n(),l.poolSize=8192,l._augment=function(e){return e.__proto__=l.prototype,e},l.from=function(e,t,n){return i(null,e,t,n)},l.TYPED_ARRAY_SUPPORT&&(l.prototype.__proto__=Uint8Array.prototype,l.__proto__=Uint8Array,"undefined"!=typeof Symbol&&Symbol.species&&l[Symbol.species]===l&&Object.defineProperty(l,Symbol.species,{value:null,configurable:!0})),l.alloc=function(e,t,n){return function(e,t,n,r){return u(t),t<=0?a(e,t):void 0!==n?"string"==typeof r?a(e,t).fill(n,r):a(e,t).fill(n):a(e,t)}(null,e,t,n)},l.allocUnsafe=function(e){return c(null,e)},l.allocUnsafeSlow=function(e){return c(null,e)},l.isBuffer=function(e){return!(null==e||!e._isBuffer)},l.compare=function(e,t){if(!l.isBuffer(e)||!l.isBuffer(t))throw new TypeError("Arguments must be Buffers");if(e===t)return 0;for(var n=e.length,r=t.length,i=0,o=Math.min(n,r);i<o;++i)if(e[i]!==t[i]){n=e[i],r=t[i];break}return n<r?-1:r<n?1:0},l.isEncoding=function(e){switch(String(e).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1}},l.concat=function(e,t){if(!s(e))throw new TypeError('"list" argument must be an Array of Buffers');if(0===e.length)return l.alloc(0);var n;if(void 0===t)for(n=t=0;n<e.length;++n)t+=e[n].length;var r=l.allocUnsafe(t),i=0;for(n=0;n<e.length;++n){var o=e[n];if(!l.isBuffer(o))throw new TypeError('"list" argument must be an Array of Buffers');o.copy(r,i),i+=o.length}return r},l.byteLength=p,l.prototype._isBuffer=!0,l.prototype.swap16=function(){var e=this.length;if(e%2!=0)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var t=0;t<e;t+=2)d(this,t,t+1);return this},l.prototype.swap32=function(){var e=this.length;if(e%4!=0)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var t=0;t<e;t+=4)d(this,t,t+3),d(this,t+1,t+2);return this},l.prototype.swap64=function(){var e=this.length;if(e%8!=0)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var t=0;t<e;t+=8)d(this,t,t+7),d(this,t+1,t+6),d(this,t+2,t+5),d(this,t+3,t+4);return this},l.prototype.toString=function(){var e=0|this.length;return 0==e?"":0===arguments.length?_(this,0,e):function(e,t,n){var r=!1;if((void 0===t||t<0)&&(t=0),t>this.length)return"";if((void 0===n||n>this.length)&&(n=this.length),n<=0)return"";if((n>>>=0)<=(t>>>=0))return"";for(e=e||"utf8";;)switch(e){case"hex":return T(this,t,n);case"utf8":case"utf-8":return _(this,t,n);case"ascii":return P(this,t,n);case"latin1":case"binary":return w(this,t,n);case"base64":return m(this,t,n);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return O(this,t,n);default:if(r)throw new TypeError("Unknown encoding: "+e);e=(e+"").toLowerCase(),r=!0}}.apply(this,arguments)},l.prototype.equals=function(e){if(!l.isBuffer(e))throw new TypeError("Argument must be a Buffer");return this===e||0===l.compare(this,e)},l.prototype.inspect=function(){var e="",t=I.INSPECT_MAX_BYTES;return 0<this.length&&(e=this.toString("hex",0,t).match(/.{2}/g).join(" "),this.length>t&&(e+=" ... ")),"<Buffer "+e+">"},l.prototype.compare=function(e,t,n,r,i){if(!l.isBuffer(e))throw new TypeError("Argument must be a Buffer");if(void 0===t&&(t=0),void 0===n&&(n=e?e.length:0),void 0===r&&(r=0),void 0===i&&(i=this.length),t<0||n>e.length||r<0||i>this.length)throw new RangeError("out of range index");if(i<=r&&n<=t)return 0;if(i<=r)return-1;if(n<=t)return 1;if(this===e)return 0;for(var o=(i>>>=0)-(r>>>=0),s=(n>>>=0)-(t>>>=0),a=Math.min(o,s),u=this.slice(r,i),c=e.slice(t,n),f=0;f<a;++f)if(u[f]!==c[f]){o=u[f],s=c[f];break}return o<s?-1:s<o?1:0},l.prototype.includes=function(e,t,n){return-1!==this.indexOf(e,t,n)},l.prototype.indexOf=function(e,t,n){return g(this,e,t,n,!0)},l.prototype.lastIndexOf=function(e,t,n){return g(this,e,t,n,!1)},l.prototype.write=function(e,t,n,r){if(void 0===t)r="utf8",n=this.length,t=0;else if(void 0===n&&"string"==typeof t)r=t,n=this.length,t=0;else{if(!isFinite(t))throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");t|=0,isFinite(n)?(n|=0,void 0===r&&(r="utf8")):(r=n,n=void 0)}var i=this.length-t;if((void 0===n||i<n)&&(n=i),0<e.length&&(n<0||t<0)||t>this.length)throw new RangeError("Attempt to write outside buffer bounds");r=r||"utf8";for(var o,s,a,u,c,f,l,h,p,d=!1;;)switch(r){case"hex":return v(this,e,t,n);case"utf8":case"utf-8":return h=t,p=n,B(x(e,(l=this).length-h),l,h,p);case"ascii":return b(this,e,t,n);case"latin1":case"binary":return b(this,e,t,n);case"base64":return u=this,c=t,f=n,B(U(e),u,c,f);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return s=t,a=n,B(function(e,t){for(var n,r,i,o=[],s=0;s<e.length&&!((t-=2)<0);++s)n=e.charCodeAt(s),r=n>>8,i=n%256,o.push(i),o.push(r);return o}(e,(o=this).length-s),o,s,a);default:if(d)throw new TypeError("Unknown encoding: "+r);r=(""+r).toLowerCase(),d=!0}},l.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};var k=4096;function P(e,t,n){var r="";n=Math.min(e.length,n);for(var i=t;i<n;++i)r+=String.fromCharCode(127&e[i]);return r}function w(e,t,n){var r="";n=Math.min(e.length,n);for(var i=t;i<n;++i)r+=String.fromCharCode(e[i]);return r}function T(e,t,n){var r=e.length;(!t||t<0)&&(t=0),(!n||n<0||r<n)&&(n=r);for(var i="",o=t;o<n;++o)i+=N(e[o]);return i}function O(e,t,n){for(var r=e.slice(t,n),i="",o=0;o<r.length;o+=2)i+=String.fromCharCode(r[o]+256*r[o+1]);return i}function S(e,t,n){if(e%1!=0||e<0)throw new RangeError("offset is not uint");if(n<e+t)throw new RangeError("Trying to access beyond buffer length")}function M(e,t,n,r,i,o){if(!l.isBuffer(e))throw new TypeError('"buffer" argument must be a Buffer instance');if(i<t||t<o)throw new RangeError('"value" argument is out of bounds');if(n+r>e.length)throw new RangeError("Index out of range")}function E(e,t,n,r){t<0&&(t=65535+t+1);for(var i=0,o=Math.min(e.length-n,2);i<o;++i)e[n+i]=(t&255<<8*(r?i:1-i))>>>8*(r?i:1-i)}function A(e,t,n,r){t<0&&(t=4294967295+t+1);for(var i=0,o=Math.min(e.length-n,4);i<o;++i)e[n+i]=t>>>8*(r?i:3-i)&255}function C(e,t,n,r){if(n+r>e.length)throw new RangeError("Index out of range");if(n<0)throw new RangeError("Index out of range")}function R(e,t,n,r,i){return i||C(e,0,n,4),o.write(e,t,n,r,23,4),n+4}function j(e,t,n,r,i){return i||C(e,0,n,8),o.write(e,t,n,r,52,8),n+8}l.prototype.slice=function(e,t){var n,r=this.length;if((e=~~e)<0?(e+=r)<0&&(e=0):r<e&&(e=r),(t=void 0===t?r:~~t)<0?(t+=r)<0&&(t=0):r<t&&(t=r),t<e&&(t=e),l.TYPED_ARRAY_SUPPORT)(n=this.subarray(e,t)).__proto__=l.prototype;else{var i=t-e;n=new l(i,void 0);for(var o=0;o<i;++o)n[o]=this[o+e]}return n},l.prototype.readUIntLE=function(e,t,n){e|=0,t|=0,n||S(e,t,this.length);for(var r=this[e],i=1,o=0;++o<t&&(i*=256);)r+=this[e+o]*i;return r},l.prototype.readUIntBE=function(e,t,n){e|=0,t|=0,n||S(e,t,this.length);for(var r=this[e+--t],i=1;0<t&&(i*=256);)r+=this[e+--t]*i;return r},l.prototype.readUInt8=function(e,t){return t||S(e,1,this.length),this[e]},l.prototype.readUInt16LE=function(e,t){return t||S(e,2,this.length),this[e]|this[e+1]<<8},l.prototype.readUInt16BE=function(e,t){return t||S(e,2,this.length),this[e]<<8|this[e+1]},l.prototype.readUInt32LE=function(e,t){return t||S(e,4,this.length),(this[e]|this[e+1]<<8|this[e+2]<<16)+16777216*this[e+3]},l.prototype.readUInt32BE=function(e,t){return t||S(e,4,this.length),16777216*this[e]+(this[e+1]<<16|this[e+2]<<8|this[e+3])},l.prototype.readIntLE=function(e,t,n){e|=0,t|=0,n||S(e,t,this.length);for(var r=this[e],i=1,o=0;++o<t&&(i*=256);)r+=this[e+o]*i;return(i*=128)<=r&&(r-=Math.pow(2,8*t)),r},l.prototype.readIntBE=function(e,t,n){e|=0,t|=0,n||S(e,t,this.length);for(var r=t,i=1,o=this[e+--r];0<r&&(i*=256);)o+=this[e+--r]*i;return(i*=128)<=o&&(o-=Math.pow(2,8*t)),o},l.prototype.readInt8=function(e,t){return t||S(e,1,this.length),128&this[e]?-1*(255-this[e]+1):this[e]},l.prototype.readInt16LE=function(e,t){t||S(e,2,this.length);var n=this[e]|this[e+1]<<8;return 32768&n?4294901760|n:n},l.prototype.readInt16BE=function(e,t){t||S(e,2,this.length);var n=this[e+1]|this[e]<<8;return 32768&n?4294901760|n:n},l.prototype.readInt32LE=function(e,t){return t||S(e,4,this.length),this[e]|this[e+1]<<8|this[e+2]<<16|this[e+3]<<24},l.prototype.readInt32BE=function(e,t){return t||S(e,4,this.length),this[e]<<24|this[e+1]<<16|this[e+2]<<8|this[e+3]},l.prototype.readFloatLE=function(e,t){return t||S(e,4,this.length),o.read(this,e,!0,23,4)},l.prototype.readFloatBE=function(e,t){return t||S(e,4,this.length),o.read(this,e,!1,23,4)},l.prototype.readDoubleLE=function(e,t){return t||S(e,8,this.length),o.read(this,e,!0,52,8)},l.prototype.readDoubleBE=function(e,t){return t||S(e,8,this.length),o.read(this,e,!1,52,8)},l.prototype.writeUIntLE=function(e,t,n,r){e=+e,t|=0,n|=0,r||M(this,e,t,n,Math.pow(2,8*n)-1,0);var i=1,o=0;for(this[t]=255&e;++o<n&&(i*=256);)this[t+o]=e/i&255;return t+n},l.prototype.writeUIntBE=function(e,t,n,r){e=+e,t|=0,n|=0,r||M(this,e,t,n,Math.pow(2,8*n)-1,0);var i=n-1,o=1;for(this[t+i]=255&e;0<=--i&&(o*=256);)this[t+i]=e/o&255;return t+n},l.prototype.writeUInt8=function(e,t,n){return e=+e,t|=0,n||M(this,e,t,1,255,0),l.TYPED_ARRAY_SUPPORT||(e=Math.floor(e)),this[t]=255&e,t+1},l.prototype.writeUInt16LE=function(e,t,n){return e=+e,t|=0,n||M(this,e,t,2,65535,0),l.TYPED_ARRAY_SUPPORT?(this[t]=255&e,this[t+1]=e>>>8):E(this,e,t,!0),t+2},l.prototype.writeUInt16BE=function(e,t,n){return e=+e,t|=0,n||M(this,e,t,2,65535,0),l.TYPED_ARRAY_SUPPORT?(this[t]=e>>>8,this[t+1]=255&e):E(this,e,t,!1),t+2},l.prototype.writeUInt32LE=function(e,t,n){return e=+e,t|=0,n||M(this,e,t,4,4294967295,0),l.TYPED_ARRAY_SUPPORT?(this[t+3]=e>>>24,this[t+2]=e>>>16,this[t+1]=e>>>8,this[t]=255&e):A(this,e,t,!0),t+4},l.prototype.writeUInt32BE=function(e,t,n){return e=+e,t|=0,n||M(this,e,t,4,4294967295,0),l.TYPED_ARRAY_SUPPORT?(this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=255&e):A(this,e,t,!1),t+4},l.prototype.writeIntLE=function(e,t,n,r){if(e=+e,t|=0,!r){var i=Math.pow(2,8*n-1);M(this,e,t,n,i-1,-i)}var o=0,s=1,a=0;for(this[t]=255&e;++o<n&&(s*=256);)e<0&&0===a&&0!==this[t+o-1]&&(a=1),this[t+o]=(e/s>>0)-a&255;return t+n},l.prototype.writeIntBE=function(e,t,n,r){if(e=+e,t|=0,!r){var i=Math.pow(2,8*n-1);M(this,e,t,n,i-1,-i)}var o=n-1,s=1,a=0;for(this[t+o]=255&e;0<=--o&&(s*=256);)e<0&&0===a&&0!==this[t+o+1]&&(a=1),this[t+o]=(e/s>>0)-a&255;return t+n},l.prototype.writeInt8=function(e,t,n){return e=+e,t|=0,n||M(this,e,t,1,127,-128),l.TYPED_ARRAY_SUPPORT||(e=Math.floor(e)),e<0&&(e=255+e+1),this[t]=255&e,t+1},l.prototype.writeInt16LE=function(e,t,n){return e=+e,t|=0,n||M(this,e,t,2,32767,-32768),l.TYPED_ARRAY_SUPPORT?(this[t]=255&e,this[t+1]=e>>>8):E(this,e,t,!0),t+2},l.prototype.writeInt16BE=function(e,t,n){return e=+e,t|=0,n||M(this,e,t,2,32767,-32768),l.TYPED_ARRAY_SUPPORT?(this[t]=e>>>8,this[t+1]=255&e):E(this,e,t,!1),t+2},l.prototype.writeInt32LE=function(e,t,n){return e=+e,t|=0,n||M(this,e,t,4,2147483647,-2147483648),l.TYPED_ARRAY_SUPPORT?(this[t]=255&e,this[t+1]=e>>>8,this[t+2]=e>>>16,this[t+3]=e>>>24):A(this,e,t,!0),t+4},l.prototype.writeInt32BE=function(e,t,n){return e=+e,t|=0,n||M(this,e,t,4,2147483647,-2147483648),e<0&&(e=4294967295+e+1),l.TYPED_ARRAY_SUPPORT?(this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=255&e):A(this,e,t,!1),t+4},l.prototype.writeFloatLE=function(e,t,n){return R(this,e,t,!0,n)},l.prototype.writeFloatBE=function(e,t,n){return R(this,e,t,!1,n)},l.prototype.writeDoubleLE=function(e,t,n){return j(this,e,t,!0,n)},l.prototype.writeDoubleBE=function(e,t,n){return j(this,e,t,!1,n)},l.prototype.copy=function(e,t,n,r){if(n=n||0,r||0===r||(r=this.length),t>=e.length&&(t=e.length),t=t||0,0<r&&r<n&&(r=n),r===n)return 0;if(0===e.length||0===this.length)return 0;if(t<0)throw new RangeError("targetStart out of bounds");if(n<0||n>=this.length)throw new RangeError("sourceStart out of bounds");if(r<0)throw new RangeError("sourceEnd out of bounds");r>this.length&&(r=this.length),e.length-t<r-n&&(r=e.length-t+n);var i,o=r-n;if(this===e&&n<t&&t<r)for(i=o-1;0<=i;--i)e[i+t]=this[i+n];else if(o<1e3||!l.TYPED_ARRAY_SUPPORT)for(i=0;i<o;++i)e[i+t]=this[i+n];else Uint8Array.prototype.set.call(e,this.subarray(n,n+o),t);return o},l.prototype.fill=function(e,t,n,r){if("string"==typeof e){if("string"==typeof t?(r=t,t=0,n=this.length):"string"==typeof n&&(r=n,n=this.length),1===e.length){var i=e.charCodeAt(0);i<256&&(e=i)}if(void 0!==r&&"string"!=typeof r)throw new TypeError("encoding must be a string");if("string"==typeof r&&!l.isEncoding(r))throw new TypeError("Unknown encoding: "+r)}else"number"==typeof e&&(e&=255);if(t<0||this.length<t||this.length<n)throw new RangeError("Out of range index");if(n<=t)return this;var o;if(t>>>=0,n=void 0===n?this.length:n>>>0,"number"==typeof(e=e||0))for(o=t;o<n;++o)this[o]=e;else{var s=l.isBuffer(e)?e:x(new l(e,r).toString()),a=s.length;for(o=0;o<n-t;++o)this[o+t]=s[o%a]}return this};var t=/[^+\/0-9A-Za-z-_]/g;function N(e){return e<16?"0"+e.toString(16):e.toString(16)}function x(e,t){var n;t=t||1/0;for(var r=e.length,i=null,o=[],s=0;s<r;++s){if(55295<(n=e.charCodeAt(s))&&n<57344){if(!i){if(56319<n){-1<(t-=3)&&o.push(239,191,189);continue}if(s+1===r){-1<(t-=3)&&o.push(239,191,189);continue}i=n;continue}if(n<56320){-1<(t-=3)&&o.push(239,191,189),i=n;continue}n=65536+(i-55296<<10|n-56320)}else i&&-1<(t-=3)&&o.push(239,191,189);if(i=null,n<128){if((t-=1)<0)break;o.push(n)}else if(n<2048){if((t-=2)<0)break;o.push(n>>6|192,63&n|128)}else if(n<65536){if((t-=3)<0)break;o.push(n>>12|224,n>>6&63|128,63&n|128)}else{if(!(n<1114112))throw new Error("Invalid code point");if((t-=4)<0)break;o.push(n>>18|240,n>>12&63|128,n>>6&63|128,63&n|128)}}return o}function U(e){return r.toByteArray(function(e){if((e=function(e){return e.trim?e.trim():e.replace(/^\s+|\s+$/g,"")}(e).replace(t,"")).length<2)return"";for(;e.length%4!=0;)e+="=";return e}(e))}function B(e,t,n,r){for(var i=0;i<r&&!(i+n>=t.length||i>=e.length);++i)t[i+n]=e[i];return i}}).call(this,D(70))},function(e,t,n){"use strict";e.exports=function(e){return null!==e&&"object"==typeof e}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=u(n(12)),i=u(n(67)),o=u(n(68)),s=u(n(69)),a=n(75);n(0);function u(e){return e&&e.__esModule?e:{default:e}}function c(e){return(c="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function f(e,t){return!t||"object"!==c(t)&&"function"!=typeof t?function(e){if(void 0!==e)return e;throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}(e):t}function l(e){return(l=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function h(e,t){return(h=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function p(e){if(!navigator||!navigator.sendBeacon)return!1;navigator.sendBeacon(e)}var d=(function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&h(e,t)}(g,r.default),g);function g(e){var t;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,g);var n=e.listenToBrowserNetworkEvents,r=void 0===n||n;return e.db=o.default,e.cbor=new s.default,e.sdkFamily="Web",e.networking=new i.default({del:a.del,get:a.get,post:a.post,patch:a.patch,sendBeacon:p}),t=f(this,l(g).call(this,e)),r&&(window.addEventListener("offline",function(){t.networkDownDetected()}),window.addEventListener("online",function(){t.networkUpDetected()})),t}t.default=d,e.exports=t.default},function(e,t,n){"use strict";function s(e){return(s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var y=f(n(3)),v=f(n(6)),b=f(n(15)),r=f(n(18)),m=f(n(7)),_=f(n(19)),k=f(n(20)),P=c(n(21)),w=c(n(22)),T=c(n(23)),O=c(n(24)),S=c(n(25)),M=c(n(26)),E=c(n(27)),A=c(n(28)),C=c(n(29)),R=c(n(30)),j=c(n(31)),N=c(n(32)),x=c(n(33)),U=c(n(34)),B=c(n(35)),I=c(n(36)),D=c(n(37)),K=c(n(38)),L=c(n(39)),F=c(n(40)),G=c(n(41)),H=c(n(42)),q=c(n(43)),z=c(n(44)),Y=c(n(45)),$=c(n(46)),W=c(n(47)),J=c(n(48)),X=c(n(49)),V=c(n(50)),Q=c(n(51)),Z=c(n(52)),ee=c(n(53)),te=c(n(54)),ne=c(n(55)),re=c(n(56)),ie=c(n(57)),oe=c(n(58)),se=c(n(59)),ae=c(n(60)),ue=c(n(61)),ce=c(n(62)),fe=c(n(63)),le=c(n(64)),he=c(n(65)),pe=c(n(8)),de=c(n(66)),i=f(n(1)),o=f(n(4)),a=(n(0),f(n(5)));function u(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return u=function(){return e},e}function c(e){if(e&&e.__esModule)return e;if(null===e||"object"!==s(e)&&"function"!=typeof e)return{default:e};var t=u();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var i in e)if(Object.prototype.hasOwnProperty.call(e,i)){var o=r?Object.getOwnPropertyDescriptor(e,i):null;o&&(o.get||o.set)?Object.defineProperty(n,i,o):n[i]=e[i]}return n.default=e,t&&t.set(e,n),n}function f(e){return e&&e.__esModule?e:{default:e}}function l(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function ge(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var h,p,d,g=(h=ye,d=[{key:"notificationPayload",value:function(e,t){return new r.default(e,t)}},{key:"generateUUID",value:function(){return a.default.createUUID()}}],(p=[{key:"getVersion",value:function(){return this._config.getVersion()}},{key:"_addPnsdkSuffix",value:function(e,t){this._config._addPnsdkSuffix(e,t)}},{key:"networkDownDetected",value:function(){this._listenerManager.announceNetworkDown(),this._config.restore?this.disconnect():this.destroy(!0)}},{key:"networkUpDetected",value:function(){this._listenerManager.announceNetworkUp(),this.reconnect()}}])&&l(h.prototype,p),void(d&&l(h,d)),ye);function ye(e){var n=this;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,ye),ge(this,"_config",void 0),ge(this,"_listenerManager",void 0),ge(this,"_tokenManager",void 0),ge(this,"time",void 0),ge(this,"publish",void 0),ge(this,"fire",void 0),ge(this,"history",void 0),ge(this,"deleteMessages",void 0),ge(this,"messageCounts",void 0),ge(this,"fetchMessages",void 0),ge(this,"channelGroups",void 0),ge(this,"push",void 0),ge(this,"hereNow",void 0),ge(this,"whereNow",void 0),ge(this,"getState",void 0),ge(this,"setState",void 0),ge(this,"grant",void 0),ge(this,"grantToken",void 0),ge(this,"audit",void 0),ge(this,"subscribe",void 0),ge(this,"signal",void 0),ge(this,"presence",void 0),ge(this,"unsubscribe",void 0),ge(this,"unsubscribeAll",void 0),ge(this,"addMessageAction",void 0),ge(this,"removeMessageAction",void 0),ge(this,"getMessageActions",void 0),ge(this,"createUser",void 0),ge(this,"updateUser",void 0),ge(this,"deleteUser",void 0),ge(this,"getUser",void 0),ge(this,"getUsers",void 0),ge(this,"createSpace",void 0),ge(this,"updateSpace",void 0),ge(this,"deleteSpace",void 0),ge(this,"getSpaces",void 0),ge(this,"getSpace",void 0),ge(this,"getMembers",void 0),ge(this,"addMembers",void 0),ge(this,"updateMembers",void 0),ge(this,"removeMembers",void 0),ge(this,"getMemberships",void 0),ge(this,"joinSpaces",void 0),ge(this,"updateMemberships",void 0),ge(this,"leaveSpaces",void 0),ge(this,"disconnect",void 0),ge(this,"reconnect",void 0),ge(this,"destroy",void 0),ge(this,"stop",void 0),ge(this,"getSubscribedChannels",void 0),ge(this,"getSubscribedChannelGroups",void 0),ge(this,"addListener",void 0),ge(this,"removeListener",void 0),ge(this,"removeAllListeners",void 0),ge(this,"parseToken",void 0),ge(this,"setToken",void 0),ge(this,"setTokens",void 0),ge(this,"getToken",void 0),ge(this,"getTokens",void 0),ge(this,"clearTokens",void 0),ge(this,"getAuthKey",void 0),ge(this,"setAuthKey",void 0),ge(this,"setCipherKey",void 0),ge(this,"setUUID",void 0),ge(this,"getUUID",void 0),ge(this,"getFilterExpression",void 0),ge(this,"setFilterExpression",void 0),ge(this,"setHeartbeatInterval",void 0),ge(this,"setProxy",void 0),ge(this,"encrypt",void 0),ge(this,"decrypt",void 0);var t=e.db,r=e.networking,i=e.cbor,o=this._config=new y.default({setup:e,db:t}),s=new v.default({config:o});r.init(o);var a=this._tokenManager=new _.default(o,i),u={config:o,networking:r,crypto:s,tokenManager:a},c=k.default.bind(this,u,pe),f=k.default.bind(this,u,R),l=k.default.bind(this,u,N),h=k.default.bind(this,u,U),p=k.default.bind(this,u,de),d=this._listenerManager=new m.default,g=new b.default({timeEndpoint:c,leaveEndpoint:f,heartbeatEndpoint:l,setStateEndpoint:h,subscribeEndpoint:p,crypto:u.crypto,config:u.config,listenerManager:d});this.addListener=d.addListener.bind(d),this.removeListener=d.removeListener.bind(d),this.removeAllListeners=d.removeAllListeners.bind(d),this.parseToken=a.parseToken.bind(a),this.setToken=a.setToken.bind(a),this.setTokens=a.setTokens.bind(a),this.getToken=a.getToken.bind(a),this.getTokens=a.getTokens.bind(a),this.clearTokens=a.clearTokens.bind(a),this.channelGroups={listGroups:k.default.bind(this,u,O),listChannels:k.default.bind(this,u,S),addChannels:k.default.bind(this,u,P),removeChannels:k.default.bind(this,u,w),deleteGroup:k.default.bind(this,u,T)},this.push={addChannels:k.default.bind(this,u,M),removeChannels:k.default.bind(this,u,E),deleteDevice:k.default.bind(this,u,C),listChannels:k.default.bind(this,u,A)},this.hereNow=k.default.bind(this,u,B),this.whereNow=k.default.bind(this,u,j),this.getState=k.default.bind(this,u,x),this.setState=g.adaptStateChange.bind(g),this.grant=k.default.bind(this,u,oe),this.grantToken=k.default.bind(this,u,se),this.audit=k.default.bind(this,u,ie),this.publish=k.default.bind(this,u,ae),this.fire=function(e,t){return e.replicate=!1,e.storeInHistory=!1,n.publish(e,t)},this.signal=k.default.bind(this,u,ue),this.history=k.default.bind(this,u,ce),this.deleteMessages=k.default.bind(this,u,fe),this.messageCounts=k.default.bind(this,u,le),this.fetchMessages=k.default.bind(this,u,he),this.addMessageAction=k.default.bind(this,u,I),this.removeMessageAction=k.default.bind(this,u,D),this.getMessageActions=k.default.bind(this,u,K),this.createUser=k.default.bind(this,u,L),this.updateUser=k.default.bind(this,u,F),this.deleteUser=k.default.bind(this,u,G),this.getUser=k.default.bind(this,u,H),this.getUsers=k.default.bind(this,u,q),this.createSpace=k.default.bind(this,u,z),this.updateSpace=k.default.bind(this,u,Y),this.deleteSpace=k.default.bind(this,u,$),this.getSpaces=k.default.bind(this,u,W),this.getSpace=k.default.bind(this,u,J),this.addMembers=k.default.bind(this,u,V),this.updateMembers=k.default.bind(this,u,Q),this.removeMembers=k.default.bind(this,u,Z),this.getMembers=k.default.bind(this,u,X),this.getMemberships=k.default.bind(this,u,ee),this.joinSpaces=k.default.bind(this,u,ne),this.updateMemberships=k.default.bind(this,u,te),this.leaveSpaces=k.default.bind(this,u,re),this.time=c,this.subscribe=g.adaptSubscribeChange.bind(g),this.presence=g.adaptPresenceChange.bind(g),this.unsubscribe=g.adaptUnsubscribeChange.bind(g),this.disconnect=g.disconnect.bind(g),this.reconnect=g.reconnect.bind(g),this.destroy=function(e){g.unsubscribeAll(e),g.disconnect()},this.stop=this.destroy,this.unsubscribeAll=g.unsubscribeAll.bind(g),this.getSubscribedChannels=g.getSubscribedChannels.bind(g),this.getSubscribedChannelGroups=g.getSubscribedChannelGroups.bind(g),this.encrypt=s.encrypt.bind(s),this.decrypt=s.decrypt.bind(s),this.getAuthKey=u.config.getAuthKey.bind(u.config),this.setAuthKey=u.config.setAuthKey.bind(u.config),this.setCipherKey=u.config.setCipherKey.bind(u.config),this.getUUID=u.config.getUUID.bind(u.config),this.setUUID=u.config.setUUID.bind(u.config),this.getFilterExpression=u.config.getFilterExpression.bind(u.config),this.setFilterExpression=u.config.setFilterExpression.bind(u.config),this.setHeartbeatInterval=u.config.setHeartbeatInterval.bind(u.config),r.hasModule("proxy")&&(this.setProxy=function(e){u.config.setProxy(e),n.reconnect()})}ge(t.default=g,"OPERATIONS",i.default),ge(g,"CATEGORIES",o.default),e.exports=t.default},function(e,t,n){var r,i,o;i=[t],void 0===(o="function"==typeof(r=function(e){var r={3:/^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i,4:/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,5:/^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,all:/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i};function t(){var e,t,n="";for(e=0;e<32;e++)t=16*Math.random()|0,8!==e&&12!==e&&16!==e&&20!==e||(n+="-"),n+=(12===e?4:16===e?3&t|8:t).toString(16);return n}function n(e,t){var n=r[t||"all"];return n&&n.test(e)||!1}t.isUUID=n,t.VERSION="0.1.0",e.uuid=t,e.isUUID=n})?r.apply(t,i):r)||(e.exports=o)},function(e,t,n){"use strict";var r,c,i,u,o,s,a,f,l,h,E=E||function(a){function n(){}var e={},t=e.lib={},r=t.Base={extend:function(e){n.prototype=this;var t=new n;return e&&t.mixIn(e),t.hasOwnProperty("init")||(t.init=function(){t.$super.init.apply(this,arguments)}),(t.init.prototype=t).$super=this,t},create:function(){var e=this.extend();return e.init.apply(e,arguments),e},init:function(){},mixIn:function(e){for(var t in e)e.hasOwnProperty(t)&&(this[t]=e[t]);e.hasOwnProperty("toString")&&(this.toString=e.toString)},clone:function(){return this.init.prototype.extend(this)}},u=t.WordArray=r.extend({init:function(e,t){e=this.words=e||[],this.sigBytes=null!=t?t:4*e.length},toString:function(e){return(e||o).stringify(this)},concat:function(e){var t=this.words,n=e.words,r=this.sigBytes;if(e=e.sigBytes,this.clamp(),r%4)for(var i=0;i<e;i++)t[r+i>>>2]|=(n[i>>>2]>>>24-i%4*8&255)<<24-(r+i)%4*8;else if(65535<n.length)for(i=0;i<e;i+=4)t[r+i>>>2]=n[i>>>2];else t.push.apply(t,n);return this.sigBytes+=e,this},clamp:function(){var e=this.words,t=this.sigBytes;e[t>>>2]&=4294967295<<32-t%4*8,e.length=a.ceil(t/4)},clone:function(){var e=r.clone.call(this);return e.words=this.words.slice(0),e},random:function(e){for(var t=[],n=0;n<e;n+=4)t.push(4294967296*a.random()|0);return new u.init(t,e)}}),i=e.enc={},o=i.Hex={stringify:function(e){var t=e.words;e=e.sigBytes;for(var n=[],r=0;r<e;r++){var i=t[r>>>2]>>>24-r%4*8&255;n.push((i>>>4).toString(16)),n.push((15&i).toString(16))}return n.join("")},parse:function(e){for(var t=e.length,n=[],r=0;r<t;r+=2)n[r>>>3]|=parseInt(e.substr(r,2),16)<<24-r%8*4;return new u.init(n,t/2)}},s=i.Latin1={stringify:function(e){var t=e.words;e=e.sigBytes;for(var n=[],r=0;r<e;r++)n.push(String.fromCharCode(t[r>>>2]>>>24-r%4*8&255));return n.join("")},parse:function(e){for(var t=e.length,n=[],r=0;r<t;r++)n[r>>>2]|=(255&e.charCodeAt(r))<<24-r%4*8;return new u.init(n,t)}},c=i.Utf8={stringify:function(e){try{return decodeURIComponent(escape(s.stringify(e)))}catch(e){throw Error("Malformed UTF-8 data")}},parse:function(e){return s.parse(unescape(encodeURIComponent(e)))}},f=t.BufferedBlockAlgorithm=r.extend({reset:function(){this._data=new u.init,this._nDataBytes=0},_append:function(e){"string"==typeof e&&(e=c.parse(e)),this._data.concat(e),this._nDataBytes+=e.sigBytes},_process:function(e){var t=this._data,n=t.words,r=t.sigBytes,i=this.blockSize,o=r/(4*i);if(e=(o=e?a.ceil(o):a.max((0|o)-this._minBufferSize,0))*i,r=a.min(4*e,r),e){for(var s=0;s<e;s+=i)this._doProcessBlock(n,s);s=n.splice(0,e),t.sigBytes-=r}return new u.init(s,r)},clone:function(){var e=r.clone.call(this);return e._data=this._data.clone(),e},_minBufferSize:0});t.Hasher=f.extend({cfg:r.extend(),init:function(e){this.cfg=this.cfg.extend(e),this.reset()},reset:function(){f.reset.call(this),this._doReset()},update:function(e){return this._append(e),this._process(),this},finalize:function(e){return e&&this._append(e),this._doFinalize()},blockSize:16,_createHelper:function(n){return function(e,t){return new n.init(t).finalize(e)}},_createHmacHelper:function(n){return function(e,t){return new l.HMAC.init(n,t).finalize(e)}}});var l=e.algo={};return e}(Math);!function(i){for(var e=E,t=(r=e.lib).WordArray,n=r.Hasher,r=e.algo,o=[],d=[],s=function(e){return 4294967296*(e-(0|e))|0},a=2,u=0;u<64;){var c;e:{c=a;for(var f=i.sqrt(c),l=2;l<=f;l++)if(!(c%l)){c=!1;break e}c=!0}c&&(u<8&&(o[u]=s(i.pow(a,.5))),d[u]=s(i.pow(a,1/3)),u++),a++}var g=[];r=r.SHA256=n.extend({_doReset:function(){this._hash=new t.init(o.slice(0))},_doProcessBlock:function(e,t){for(var n=this._hash.words,r=n[0],i=n[1],o=n[2],s=n[3],a=n[4],u=n[5],c=n[6],f=n[7],l=0;l<64;l++){if(l<16)g[l]=0|e[t+l];else{var h=g[l-15],p=g[l-2];g[l]=((h<<25|h>>>7)^(h<<14|h>>>18)^h>>>3)+g[l-7]+((p<<15|p>>>17)^(p<<13|p>>>19)^p>>>10)+g[l-16]}h=f+((a<<26|a>>>6)^(a<<21|a>>>11)^(a<<7|a>>>25))+(a&u^~a&c)+d[l]+g[l],p=((r<<30|r>>>2)^(r<<19|r>>>13)^(r<<10|r>>>22))+(r&i^r&o^i&o),f=c,c=u,u=a,a=s+h|0,s=o,o=i,i=r,r=h+p|0}n[0]=n[0]+r|0,n[1]=n[1]+i|0,n[2]=n[2]+o|0,n[3]=n[3]+s|0,n[4]=n[4]+a|0,n[5]=n[5]+u|0,n[6]=n[6]+c|0,n[7]=n[7]+f|0},_doFinalize:function(){var e=this._data,t=e.words,n=8*this._nDataBytes,r=8*e.sigBytes;return t[r>>>5]|=128<<24-r%32,t[14+(64+r>>>9<<4)]=i.floor(n/4294967296),t[15+(64+r>>>9<<4)]=n,e.sigBytes=4*t.length,this._process(),this._hash},clone:function(){var e=n.clone.call(this);return e._hash=this._hash.clone(),e}});e.SHA256=n._createHelper(r),e.HmacSHA256=n._createHmacHelper(r)}(Math),c=(r=E).enc.Utf8,r.algo.HMAC=r.lib.Base.extend({init:function(e,t){e=this._hasher=new e.init,"string"==typeof t&&(t=c.parse(t));var n=e.blockSize,r=4*n;t.sigBytes>r&&(t=e.finalize(t)),t.clamp();for(var i=this._oKey=t.clone(),o=this._iKey=t.clone(),s=i.words,a=o.words,u=0;u<n;u++)s[u]^=1549556828,a[u]^=909522486;i.sigBytes=o.sigBytes=r,this.reset()},reset:function(){var e=this._hasher;e.reset(),e.update(this._iKey)},update:function(e){return this._hasher.update(e),this},finalize:function(e){var t=this._hasher;return e=t.finalize(e),t.reset(),t.finalize(this._oKey.clone().concat(e))}}),u=(i=E).lib.WordArray,i.enc.Base64={stringify:function(e){var t=e.words,n=e.sigBytes,r=this._map;e.clamp(),e=[];for(var i=0;i<n;i+=3)for(var o=(t[i>>>2]>>>24-i%4*8&255)<<16|(t[i+1>>>2]>>>24-(i+1)%4*8&255)<<8|t[i+2>>>2]>>>24-(i+2)%4*8&255,s=0;s<4&&i+.75*s<n;s++)e.push(r.charAt(o>>>6*(3-s)&63));if(t=r.charAt(64))for(;e.length%4;)e.push(t);return e.join("")},parse:function(e){var t=e.length,n=this._map;!(r=n.charAt(64))||-1!=(r=e.indexOf(r))&&(t=r);for(var r=[],i=0,o=0;o<t;o++)if(o%4){var s=n.indexOf(e.charAt(o-1))<<o%4*2,a=n.indexOf(e.charAt(o))>>>6-o%4*2;r[i>>>2]|=(s|a)<<24-i%4*8,i++}return u.create(r,i)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="},function(o){function w(e,t,n,r,i,o,s){return((e=e+(t&n|~t&r)+i+s)<<o|e>>>32-o)+t}function T(e,t,n,r,i,o,s){return((e=e+(t&r|n&~r)+i+s)<<o|e>>>32-o)+t}function O(e,t,n,r,i,o,s){return((e=e+(t^n^r)+i+s)<<o|e>>>32-o)+t}function S(e,t,n,r,i,o,s){return((e=e+(n^(t|~r))+i+s)<<o|e>>>32-o)+t}for(var e=E,t=(r=e.lib).WordArray,n=r.Hasher,r=e.algo,M=[],i=0;i<64;i++)M[i]=4294967296*o.abs(o.sin(i+1))|0;r=r.MD5=n.extend({_doReset:function(){this._hash=new t.init([1732584193,4023233417,2562383102,271733878])},_doProcessBlock:function(e,t){for(var n=0;n<16;n++){var r=e[s=t+n];e[s]=16711935&(r<<8|r>>>24)|4278255360&(r<<24|r>>>8)}n=this._hash.words;var i,o,s=e[t+0],a=(r=e[t+1],e[t+2]),u=e[t+3],c=e[t+4],f=e[t+5],l=e[t+6],h=e[t+7],p=e[t+8],d=e[t+9],g=e[t+10],y=e[t+11],v=e[t+12],b=e[t+13],m=e[t+14],_=e[t+15],k=n[0],P=S(P=S(P=S(P=S(P=O(P=O(P=O(P=O(P=T(P=T(P=T(P=T(P=w(P=w(P=w(P=w(P=n[1],o=w(o=n[2],i=w(i=n[3],k=w(k,P,o,i,s,7,M[0]),P,o,r,12,M[1]),k,P,a,17,M[2]),i,k,u,22,M[3]),o=w(o,i=w(i,k=w(k,P,o,i,c,7,M[4]),P,o,f,12,M[5]),k,P,l,17,M[6]),i,k,h,22,M[7]),o=w(o,i=w(i,k=w(k,P,o,i,p,7,M[8]),P,o,d,12,M[9]),k,P,g,17,M[10]),i,k,y,22,M[11]),o=w(o,i=w(i,k=w(k,P,o,i,v,7,M[12]),P,o,b,12,M[13]),k,P,m,17,M[14]),i,k,_,22,M[15]),o=T(o,i=T(i,k=T(k,P,o,i,r,5,M[16]),P,o,l,9,M[17]),k,P,y,14,M[18]),i,k,s,20,M[19]),o=T(o,i=T(i,k=T(k,P,o,i,f,5,M[20]),P,o,g,9,M[21]),k,P,_,14,M[22]),i,k,c,20,M[23]),o=T(o,i=T(i,k=T(k,P,o,i,d,5,M[24]),P,o,m,9,M[25]),k,P,u,14,M[26]),i,k,p,20,M[27]),o=T(o,i=T(i,k=T(k,P,o,i,b,5,M[28]),P,o,a,9,M[29]),k,P,h,14,M[30]),i,k,v,20,M[31]),o=O(o,i=O(i,k=O(k,P,o,i,f,4,M[32]),P,o,p,11,M[33]),k,P,y,16,M[34]),i,k,m,23,M[35]),o=O(o,i=O(i,k=O(k,P,o,i,r,4,M[36]),P,o,c,11,M[37]),k,P,h,16,M[38]),i,k,g,23,M[39]),o=O(o,i=O(i,k=O(k,P,o,i,b,4,M[40]),P,o,s,11,M[41]),k,P,u,16,M[42]),i,k,l,23,M[43]),o=O(o,i=O(i,k=O(k,P,o,i,d,4,M[44]),P,o,v,11,M[45]),k,P,_,16,M[46]),i,k,a,23,M[47]),o=S(o,i=S(i,k=S(k,P,o,i,s,6,M[48]),P,o,h,10,M[49]),k,P,m,15,M[50]),i,k,f,21,M[51]),o=S(o,i=S(i,k=S(k,P,o,i,v,6,M[52]),P,o,u,10,M[53]),k,P,g,15,M[54]),i,k,r,21,M[55]),o=S(o,i=S(i,k=S(k,P,o,i,p,6,M[56]),P,o,_,10,M[57]),k,P,l,15,M[58]),i,k,b,21,M[59]),o=S(o,i=S(i,k=S(k,P,o,i,c,6,M[60]),P,o,y,10,M[61]),k,P,a,15,M[62]),i,k,d,21,M[63]);n[0]=n[0]+k|0,n[1]=n[1]+P|0,n[2]=n[2]+o|0,n[3]=n[3]+i|0},_doFinalize:function(){var e=this._data,t=e.words,n=8*this._nDataBytes,r=8*e.sigBytes;t[r>>>5]|=128<<24-r%32;var i=o.floor(n/4294967296);for(t[15+(r+64>>>9<<4)]=16711935&(i<<8|i>>>24)|4278255360&(i<<24|i>>>8),t[14+(r+64>>>9<<4)]=16711935&(n<<8|n>>>24)|4278255360&(n<<24|n>>>8),e.sigBytes=4*(t.length+1),this._process(),t=(e=this._hash).words,n=0;n<4;n++)r=t[n],t[n]=16711935&(r<<8|r>>>24)|4278255360&(r<<24|r>>>8);return e},clone:function(){var e=n.clone.call(this);return e._hash=this._hash.clone(),e}}),e.MD5=n._createHelper(r),e.HmacMD5=n._createHmacHelper(r)}(Math),a=(o=(s=E).lib).Base,f=o.WordArray,l=(o=s.algo).EvpKDF=a.extend({cfg:a.extend({keySize:4,hasher:o.MD5,iterations:1}),init:function(e){this.cfg=this.cfg.extend(e)},compute:function(e,t){for(var n=(s=this.cfg).hasher.create(),r=f.create(),i=r.words,o=s.keySize,s=s.iterations;i.length<o;){a&&n.update(a);var a=n.update(e).finalize(t);n.reset();for(var u=1;u<s;u++)a=n.finalize(a),n.reset();r.concat(a)}return r.sigBytes=4*o,r}}),s.EvpKDF=function(e,t,n){return l.create(n).compute(e,t)},E.lib.Cipher||function(){var e=(h=E).lib,t=e.Base,s=e.WordArray,n=e.BufferedBlockAlgorithm,r=h.enc.Base64,i=h.algo.EvpKDF,o=e.Cipher=n.extend({cfg:t.extend(),createEncryptor:function(e,t){return this.create(this._ENC_XFORM_MODE,e,t)},createDecryptor:function(e,t){return this.create(this._DEC_XFORM_MODE,e,t)},init:function(e,t,n){this.cfg=this.cfg.extend(n),this._xformMode=e,this._key=t,this.reset()},reset:function(){n.reset.call(this),this._doReset()},process:function(e){return this._append(e),this._process()},finalize:function(e){return e&&this._append(e),this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(r){return{encrypt:function(e,t,n){return("string"==typeof t?p:l).encrypt(r,e,t,n)},decrypt:function(e,t,n){return("string"==typeof t?p:l).decrypt(r,e,t,n)}}}});e.StreamCipher=o.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});function a(e,t,n){var r=this._iv;r?this._iv=void 0:r=this._prevBlock;for(var i=0;i<n;i++)e[t+i]^=r[i]}var u=h.mode={},c=(e.BlockCipherMode=t.extend({createEncryptor:function(e,t){return this.Encryptor.create(e,t)},createDecryptor:function(e,t){return this.Decryptor.create(e,t)},init:function(e,t){this._cipher=e,this._iv=t}})).extend();c.Encryptor=c.extend({processBlock:function(e,t){var n=this._cipher,r=n.blockSize;a.call(this,e,t,r),n.encryptBlock(e,t),this._prevBlock=e.slice(t,t+r)}}),c.Decryptor=c.extend({processBlock:function(e,t){var n=this._cipher,r=n.blockSize,i=e.slice(t,t+r);n.decryptBlock(e,t),a.call(this,e,t,r),this._prevBlock=i}}),u=u.CBC=c,c=(h.pad={}).Pkcs7={pad:function(e,t){for(var n,r=(n=(n=4*t)-e.sigBytes%n)<<24|n<<16|n<<8|n,i=[],o=0;o<n;o+=4)i.push(r);n=s.create(i,n),e.concat(n)},unpad:function(e){e.sigBytes-=255&e.words[e.sigBytes-1>>>2]}},e.BlockCipher=o.extend({cfg:o.cfg.extend({mode:u,padding:c}),reset:function(){o.reset.call(this);var e=(t=this.cfg).iv,t=t.mode;if(this._xformMode==this._ENC_XFORM_MODE)var n=t.createEncryptor;else n=t.createDecryptor,this._minBufferSize=1;this._mode=n.call(t,this,e&&e.words)},_doProcessBlock:function(e,t){this._mode.processBlock(e,t)},_doFinalize:function(){var e=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){e.pad(this._data,this.blockSize);var t=this._process(!0)}else t=this._process(!0),e.unpad(t);return t},blockSize:4});var f=e.CipherParams=t.extend({init:function(e){this.mixIn(e)},toString:function(e){return(e||this.formatter).stringify(this)}}),l=(u=(h.format={}).OpenSSL={stringify:function(e){var t=e.ciphertext;return((e=e.salt)?s.create([1398893684,1701076831]).concat(e).concat(t):t).toString(r)},parse:function(e){var t=(e=r.parse(e)).words;if(1398893684==t[0]&&1701076831==t[1]){var n=s.create(t.slice(2,4));t.splice(0,4),e.sigBytes-=16}return f.create({ciphertext:e,salt:n})}},e.SerializableCipher=t.extend({cfg:t.extend({format:u}),encrypt:function(e,t,n,r){r=this.cfg.extend(r);var i=e.createEncryptor(n,r);return t=i.finalize(t),i=i.cfg,f.create({ciphertext:t,key:n,iv:i.iv,algorithm:e,mode:i.mode,padding:i.padding,blockSize:e.blockSize,formatter:r.format})},decrypt:function(e,t,n,r){return r=this.cfg.extend(r),t=this._parse(t,r.format),e.createDecryptor(n,r).finalize(t.ciphertext)},_parse:function(e,t){return"string"==typeof e?t.parse(e,this):e}})),h=(h.kdf={}).OpenSSL={execute:function(e,t,n,r){return r=r||s.random(8),e=i.create({keySize:t+n}).compute(e,r),n=s.create(e.words.slice(t),4*n),e.sigBytes=4*t,f.create({key:e,iv:n,salt:r})}},p=e.PasswordBasedCipher=l.extend({cfg:l.cfg.extend({kdf:h}),encrypt:function(e,t,n,r){return n=(r=this.cfg.extend(r)).kdf.execute(n,e.keySize,e.ivSize),r.iv=n.iv,(e=l.encrypt.call(this,e,t,n.key,r)).mixIn(n),e},decrypt:function(e,t,n,r){return r=this.cfg.extend(r),t=this._parse(t,r.format),n=r.kdf.execute(n,e.keySize,e.ivSize,t.salt),r.iv=n.iv,l.decrypt.call(this,e,t,n.key,r)}})}(),function(){for(var e=E,t=e.lib.BlockCipher,n=e.algo,s=[],r=[],i=[],o=[],a=[],u=[],c=[],f=[],l=[],h=[],p=[],d=0;d<256;d++)p[d]=d<128?d<<1:d<<1^283;var g=0,y=0;for(d=0;d<256;d++){var v=(v=y^y<<1^y<<2^y<<3^y<<4)>>>8^255&v^99;s[g]=v;var b=p[r[v]=g],m=p[b],_=p[m],k=257*p[v]^16843008*v;i[g]=k<<24|k>>>8,o[g]=k<<16|k>>>16,a[g]=k<<8|k>>>24,u[g]=k,k=16843009*_^65537*m^257*b^16843008*g,c[v]=k<<24|k>>>8,f[v]=k<<16|k>>>16,l[v]=k<<8|k>>>24,h[v]=k,g?(g=b^p[p[p[_^b]]],y^=p[p[y]]):g=y=1}var P=[0,1,2,4,8,16,32,64,128,27,54];n=n.AES=t.extend({_doReset:function(){for(var e=(n=this._key).words,t=n.sigBytes/4,n=4*((this._nRounds=t+6)+1),r=this._keySchedule=[],i=0;i<n;i++)if(i<t)r[i]=e[i];else{var o=r[i-1];i%t?6<t&&4==i%t&&(o=s[o>>>24]<<24|s[o>>>16&255]<<16|s[o>>>8&255]<<8|s[255&o]):(o=s[(o=o<<8|o>>>24)>>>24]<<24|s[o>>>16&255]<<16|s[o>>>8&255]<<8|s[255&o],o^=P[i/t|0]<<24),r[i]=r[i-t]^o}for(e=this._invKeySchedule=[],t=0;t<n;t++)i=n-t,o=t%4?r[i]:r[i-4],e[t]=t<4||i<=4?o:c[s[o>>>24]]^f[s[o>>>16&255]]^l[s[o>>>8&255]]^h[s[255&o]]},encryptBlock:function(e,t){this._doCryptBlock(e,t,this._keySchedule,i,o,a,u,s)},decryptBlock:function(e,t){var n=e[t+1];e[t+1]=e[t+3],e[t+3]=n,this._doCryptBlock(e,t,this._invKeySchedule,c,f,l,h,r),n=e[t+1],e[t+1]=e[t+3],e[t+3]=n},_doCryptBlock:function(e,t,n,r,i,o,s,a){for(var u=this._nRounds,c=e[t]^n[0],f=e[t+1]^n[1],l=e[t+2]^n[2],h=e[t+3]^n[3],p=4,d=1;d<u;d++){var g=r[c>>>24]^i[f>>>16&255]^o[l>>>8&255]^s[255&h]^n[p++],y=r[f>>>24]^i[l>>>16&255]^o[h>>>8&255]^s[255&c]^n[p++],v=r[l>>>24]^i[h>>>16&255]^o[c>>>8&255]^s[255&f]^n[p++];h=r[h>>>24]^i[c>>>16&255]^o[f>>>8&255]^s[255&l]^n[p++],c=g,f=y,l=v}g=(a[c>>>24]<<24|a[f>>>16&255]<<16|a[l>>>8&255]<<8|a[255&h])^n[p++],y=(a[f>>>24]<<24|a[l>>>16&255]<<16|a[h>>>8&255]<<8|a[255&c])^n[p++],v=(a[l>>>24]<<24|a[h>>>16&255]<<16|a[c>>>8&255]<<8|a[255&f])^n[p++],h=(a[h>>>24]<<24|a[c>>>16&255]<<16|a[f>>>8&255]<<8|a[255&l])^n[p++],e[t]=g,e[t+1]=y,e[t+2]=v,e[t+3]=h},keySize:8});e.AES=t._createHelper(n)}(),E.mode.ECB=((h=E.lib.BlockCipherMode.extend()).Encryptor=h.extend({processBlock:function(e,t){this._cipher.encryptBlock(e,t)}}),h.Decryptor=h.extend({processBlock:function(e,t){this._cipher.decryptBlock(e,t)}}),h),e.exports=E},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;r(n(6)),r(n(3)),r(n(7));var c=r(n(16)),f=r(n(17)),l=r(n(2)),a=(n(0),r(n(4)));function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function h(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var o,s,u,p=(o=d,(s=[{key:"adaptStateChange",value:function(e,t){var n=this,r=e.state,i=e.channels,o=void 0===i?[]:i,s=e.channelGroups,a=void 0===s?[]:s;return o.forEach(function(e){e in n._channels&&(n._channels[e].state=r)}),a.forEach(function(e){e in n._channelGroups&&(n._channelGroups[e].state=r)}),this._setStateEndpoint({state:r,channels:o,channelGroups:a},t)}},{key:"adaptPresenceChange",value:function(e){var t=this,n=e.connected,r=e.channels,i=void 0===r?[]:r,o=e.channelGroups,s=void 0===o?[]:o;n?(i.forEach(function(e){t._heartbeatChannels[e]={state:{}}}),s.forEach(function(e){t._heartbeatChannelGroups[e]={state:{}}})):(i.forEach(function(e){e in t._heartbeatChannels&&delete t._heartbeatChannels[e]}),s.forEach(function(e){e in t._heartbeatChannelGroups&&delete t._heartbeatChannelGroups[e]}),!1===this._config.suppressLeaveEvents&&this._leaveEndpoint({channels:i,channelGroups:s},function(e){t._listenerManager.announceStatus(e)})),this.reconnect()}},{key:"adaptSubscribeChange",value:function(e){var t=this,n=e.timetoken,r=e.channels,i=void 0===r?[]:r,o=e.channelGroups,s=void 0===o?[]:o,a=e.withPresence,u=void 0!==a&&a,c=e.withHeartbeats,f=void 0!==c&&c;this._config.subscribeKey&&""!==this._config.subscribeKey?(n&&(this._lastTimetoken=this._currentTimetoken,this._currentTimetoken=n),"0"!==this._currentTimetoken&&0!==this._currentTimetoken&&(this._storedTimetoken=this._currentTimetoken,this._currentTimetoken=0),i.forEach(function(e){t._channels[e]={state:{}},u&&(t._presenceChannels[e]={}),(f||t._config.getHeartbeatInterval())&&(t._heartbeatChannels[e]={}),t._pendingChannelSubscriptions.push(e)}),s.forEach(function(e){t._channelGroups[e]={state:{}},u&&(t._presenceChannelGroups[e]={}),(f||t._config.getHeartbeatInterval())&&(t._heartbeatChannelGroups[e]={}),t._pendingChannelGroupSubscriptions.push(e)}),this._subscriptionStatusAnnounced=!1,this.reconnect()):console&&console.log&&console.log("subscribe key missing; aborting subscribe")}},{key:"adaptUnsubscribeChange",value:function(e,t){var n=this,r=e.channels,i=void 0===r?[]:r,o=e.channelGroups,s=void 0===o?[]:o,a=[],u=[];i.forEach(function(e){e in n._channels&&(delete n._channels[e],a.push(e),e in n._heartbeatChannels&&delete n._heartbeatChannels[e]),e in n._presenceChannels&&(delete n._presenceChannels[e],a.push(e))}),s.forEach(function(e){e in n._channelGroups&&(delete n._channelGroups[e],u.push(e),e in n._heartbeatChannelGroups&&delete n._heartbeatChannelGroups[e]),e in n._presenceChannelGroups&&(delete n._channelGroups[e],u.push(e))}),0===a.length&&0===u.length||(!1!==this._config.suppressLeaveEvents||t||this._leaveEndpoint({channels:a,channelGroups:u},function(e){e.affectedChannels=a,e.affectedChannelGroups=u,e.currentTimetoken=n._currentTimetoken,e.lastTimetoken=n._lastTimetoken,n._listenerManager.announceStatus(e)}),0===Object.keys(this._channels).length&&0===Object.keys(this._presenceChannels).length&&0===Object.keys(this._channelGroups).length&&0===Object.keys(this._presenceChannelGroups).length&&(this._lastTimetoken=0,this._currentTimetoken=0,this._storedTimetoken=null,this._region=null,this._reconnectionManager.stopPolling()),this.reconnect())}},{key:"unsubscribeAll",value:function(e){this.adaptUnsubscribeChange({channels:this.getSubscribedChannels(),channelGroups:this.getSubscribedChannelGroups()},e)}},{key:"getHeartbeatChannels",value:function(){return Object.keys(this._heartbeatChannels)}},{key:"getHeartbeatChannelGroups",value:function(){return Object.keys(this._heartbeatChannelGroups)}},{key:"getSubscribedChannels",value:function(){return Object.keys(this._channels)}},{key:"getSubscribedChannelGroups",value:function(){return Object.keys(this._channelGroups)}},{key:"reconnect",value:function(){this._startSubscribeLoop(),this._registerHeartbeatTimer()}},{key:"disconnect",value:function(){this._stopSubscribeLoop(),this._stopHeartbeatTimer(),this._reconnectionManager.stopPolling()}},{key:"_registerHeartbeatTimer",value:function(){this._stopHeartbeatTimer(),0!==this._config.getHeartbeatInterval()&&(this._performHeartbeatLoop(),this._heartbeatTimer=setInterval(this._performHeartbeatLoop.bind(this),1e3*this._config.getHeartbeatInterval()))}},{key:"_stopHeartbeatTimer",value:function(){this._heartbeatTimer&&(clearInterval(this._heartbeatTimer),this._heartbeatTimer=null)}},{key:"_performHeartbeatLoop",value:function(){var n=this,e=this.getHeartbeatChannels(),t=this.getHeartbeatChannelGroups(),r={};0===e.length&&0===t.length||(this.getSubscribedChannels().forEach(function(e){var t=n._channels[e].state;Object.keys(t).length&&(r[e]=t)}),this.getSubscribedChannelGroups().forEach(function(e){var t=n._channelGroups[e].state;Object.keys(t).length&&(r[e]=t)}),this._heartbeatEndpoint({channels:e,channelGroups:t,state:r},function(e){e.error&&n._config.announceFailedHeartbeats&&n._listenerManager.announceStatus(e),e.error&&n._config.autoNetworkDetection&&n._isOnline&&(n._isOnline=!1,n.disconnect(),n._listenerManager.announceNetworkDown(),n.reconnect()),!e.error&&n._config.announceSuccessfulHeartbeats&&n._listenerManager.announceStatus(e)}.bind(this)))}},{key:"_startSubscribeLoop",value:function(){var n=this;this._stopSubscribeLoop();var r={},i=[],o=[];if(Object.keys(this._channels).forEach(function(e){var t=n._channels[e].state;Object.keys(t).length&&(r[e]=t),i.push(e)}),Object.keys(this._presenceChannels).forEach(function(e){i.push("".concat(e,"-pnpres"))}),Object.keys(this._channelGroups).forEach(function(e){var t=n._channelGroups[e].state;Object.keys(t).length&&(r[e]=t),o.push(e)}),Object.keys(this._presenceChannelGroups).forEach(function(e){o.push("".concat(e,"-pnpres"))}),0!==i.length||0!==o.length){var e={channels:i,channelGroups:o,state:r,timetoken:this._currentTimetoken,filterExpression:this._config.filterExpression,region:this._region};this._subscribeCall=this._subscribeEndpoint(e,this._processSubscribeResponse.bind(this))}}},{key:"_processSubscribeResponse",value:function(t,e){var c=this;if(t.error)t.category===a.default.PNTimeoutCategory?this._startSubscribeLoop():(t.category===a.default.PNNetworkIssuesCategory?(this.disconnect(),t.error&&this._config.autoNetworkDetection&&this._isOnline&&(this._isOnline=!1,this._listenerManager.announceNetworkDown()),this._reconnectionManager.onReconnection(function(){c._config.autoNetworkDetection&&!c._isOnline&&(c._isOnline=!0,c._listenerManager.announceNetworkUp()),c.reconnect(),c._subscriptionStatusAnnounced=!0;var e={category:a.default.PNReconnectedCategory,operation:t.operation,lastTimetoken:c._lastTimetoken,currentTimetoken:c._currentTimetoken};c._listenerManager.announceStatus(e)}),this._reconnectionManager.startPolling()):t.category===a.default.PNBadRequestCategory&&this._stopHeartbeatTimer(),this._listenerManager.announceStatus(t));else{if(this._storedTimetoken?(this._currentTimetoken=this._storedTimetoken,this._storedTimetoken=null):(this._lastTimetoken=this._currentTimetoken,this._currentTimetoken=e.metadata.timetoken),!this._subscriptionStatusAnnounced){var n={};n.category=a.default.PNConnectedCategory,n.operation=t.operation,n.affectedChannels=this._pendingChannelSubscriptions,n.subscribedChannels=this.getSubscribedChannels(),n.affectedChannelGroups=this._pendingChannelGroupSubscriptions,n.lastTimetoken=this._lastTimetoken,n.currentTimetoken=this._currentTimetoken,this._subscriptionStatusAnnounced=!0,this._listenerManager.announceStatus(n),this._pendingChannelSubscriptions=[],this._pendingChannelGroupSubscriptions=[]}var r=e.messages||[],i=this._config,o=i.requestMessageCountThreshold,f=i.dedupeOnSubscribe;if(o&&r.length>=o){var s={};s.category=a.default.PNRequestMessageCountExceededCategory,s.operation=t.operation,this._listenerManager.announceStatus(s)}r.forEach(function(e){var t=e.channel,n=e.subscriptionMatch,r=e.publishMetaData;if(t===n&&(n=null),f){if(c._dedupingManager.isDuplicate(e))return;c._dedupingManager.addEntry(e)}if(l.default.endsWith(e.channel,"-pnpres")){var i={channel:null,subscription:null};i.actualChannel=null!=n?t:null,i.subscribedChannel=null!=n?n:t,t&&(i.channel=t.substring(0,t.lastIndexOf("-pnpres"))),n&&(i.subscription=n.substring(0,n.lastIndexOf("-pnpres"))),i.action=e.payload.action,i.state=e.payload.data,i.timetoken=r.publishTimetoken,i.occupancy=e.payload.occupancy,i.uuid=e.payload.uuid,i.timestamp=e.payload.timestamp,e.payload.join&&(i.join=e.payload.join),e.payload.leave&&(i.leave=e.payload.leave),e.payload.timeout&&(i.timeout=e.payload.timeout),c._listenerManager.announcePresence(i)}else if(1===e.messageType){var o={channel:null,subscription:null};o.channel=t,o.subscription=n,o.timetoken=r.publishTimetoken,o.publisher=e.issuingClientId,e.userMetadata&&(o.userMetadata=e.userMetadata),o.message=e.payload,c._listenerManager.announceSignal(o)}else if(2===e.messageType){var s={channel:null,subscription:null};s.channel=t,s.subscription=n,s.timetoken=r.publishTimetoken,s.publisher=e.issuingClientId,e.userMetadata&&(s.userMetadata=e.userMetadata),s.message={event:e.payload.event,type:e.payload.type,data:e.payload.data},"user"===e.payload.type?c._listenerManager.announceUser(s):"space"===e.payload.type?c._listenerManager.announceSpace(s):"membership"===e.payload.type&&c._listenerManager.announceMembership(s)}else if(3===e.messageType){var a={};a.channel=t,a.subscription=n,a.timetoken=r.publishTimetoken,a.publisher=e.issuingClientId,a.data={messageTimetoken:e.payload.data.messageTimetoken,actionTimetoken:e.payload.data.actionTimetoken,type:e.payload.data.type,uuid:e.issuingClientId,value:e.payload.data.value},a.event=e.payload.event,c._listenerManager.announceMessageAction(a)}else{var u={channel:null,subscription:null};u.actualChannel=null!=n?t:null,u.subscribedChannel=null!=n?n:t,u.channel=t,u.subscription=n,u.timetoken=r.publishTimetoken,u.publisher=e.issuingClientId,e.userMetadata&&(u.userMetadata=e.userMetadata),c._config.cipherKey?u.message=c._crypto.decrypt(e.payload):u.message=e.payload,c._listenerManager.announceMessage(u)}}),this._region=e.metadata.region,this._startSubscribeLoop()}}},{key:"_stopSubscribeLoop",value:function(){this._subscribeCall&&("function"==typeof this._subscribeCall.abort&&this._subscribeCall.abort(),this._subscribeCall=null)}}])&&i(o.prototype,s),void(u&&i(o,u)),d);function d(e){var t=e.subscribeEndpoint,n=e.leaveEndpoint,r=e.heartbeatEndpoint,i=e.setStateEndpoint,o=e.timeEndpoint,s=e.config,a=e.crypto,u=e.listenerManager;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,d),h(this,"_crypto",void 0),h(this,"_config",void 0),h(this,"_listenerManager",void 0),h(this,"_reconnectionManager",void 0),h(this,"_leaveEndpoint",void 0),h(this,"_heartbeatEndpoint",void 0),h(this,"_setStateEndpoint",void 0),h(this,"_subscribeEndpoint",void 0),h(this,"_channels",void 0),h(this,"_presenceChannels",void 0),h(this,"_heartbeatChannels",void 0),h(this,"_heartbeatChannelGroups",void 0),h(this,"_channelGroups",void 0),h(this,"_presenceChannelGroups",void 0),h(this,"_currentTimetoken",void 0),h(this,"_lastTimetoken",void 0),h(this,"_storedTimetoken",void 0),h(this,"_region",void 0),h(this,"_subscribeCall",void 0),h(this,"_heartbeatTimer",void 0),h(this,"_subscriptionStatusAnnounced",void 0),h(this,"_autoNetworkDetection",void 0),h(this,"_isOnline",void 0),h(this,"_pendingChannelSubscriptions",void 0),h(this,"_pendingChannelGroupSubscriptions",void 0),h(this,"_dedupingManager",void 0),this._listenerManager=u,this._config=s,this._leaveEndpoint=n,this._heartbeatEndpoint=r,this._setStateEndpoint=i,this._subscribeEndpoint=t,this._crypto=a,this._channels={},this._presenceChannels={},this._heartbeatChannels={},this._heartbeatChannelGroups={},this._channelGroups={},this._presenceChannelGroups={},this._pendingChannelSubscriptions=[],this._pendingChannelGroupSubscriptions=[],this._currentTimetoken=0,this._lastTimetoken=0,this._storedTimetoken=null,this._subscriptionStatusAnnounced=!1,this._isOnline=!0,this._reconnectionManager=new c.default({timeEndpoint:o}),this._dedupingManager=new f.default({config:s})}t.default=p,e.exports=t.default},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r;(r=n(8))&&r.__esModule,n(0);function i(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var s,a,u,c=(s=f,(a=[{key:"onReconnection",value:function(e){this._reconnectionCallback=e}},{key:"startPolling",value:function(){this._timeTimer=setInterval(this._performTimeLoop.bind(this),3e3)}},{key:"stopPolling",value:function(){clearInterval(this._timeTimer)}},{key:"_performTimeLoop",value:function(){var t=this;this._timeEndpoint(function(e){e.error||(clearInterval(t._timeTimer),t._reconnectionCallback())})}}])&&i(s.prototype,a),void(u&&i(s,u)),f);function f(e){var t=e.timeEndpoint;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,f),o(this,"_reconnectionCallback",void 0),o(this,"_timeEndpoint",void 0),o(this,"_timeTimer",void 0),this._timeEndpoint=t}t.default=c,e.exports=t.default},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r;(r=n(3))&&r.__esModule,n(0);function i(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var s,a,u,c=(s=f,(a=[{key:"getKey",value:function(e){var t=function(e){var t=0;if(0===e.length)return t;for(var n=0;n<e.length;n+=1)t=(t<<5)-t+e.charCodeAt(n),t&=t;return t}(JSON.stringify(e.payload)).toString(),n=e.publishMetaData.publishTimetoken;return"".concat(n,"-").concat(t)}},{key:"isDuplicate",value:function(e){return this.hashHistory.includes(this.getKey(e))}},{key:"addEntry",value:function(e){this.hashHistory.length>=this._config.maximumCacheSize&&this.hashHistory.shift(),this.hashHistory.push(this.getKey(e))}},{key:"clearHistory",value:function(){this.hashHistory=[]}}])&&i(s.prototype,a),void(u&&i(s,u)),f);function f(e){var t=e.config;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,f),o(this,"_config",void 0),o(this,"hashHistory",void 0),this.hashHistory=[],this._config=t}t.default=c,e.exports=t.default},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=t.FCMNotificationPayload=t.MPNSNotificationPayload=t.APNSNotificationPayload=void 0;n(0);function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function i(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],0<=t.indexOf(n)||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],0<=t.indexOf(n)||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}function o(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter(function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})),n.push.apply(n,r)}return n}function s(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?o(Object(n),!0).forEach(function(e){g(t,e,n[e])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach(function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))})}return t}function a(e,t){return!t||"object"!==r(t)&&"function"!=typeof t?c(e):t}function u(e){return(u=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function c(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function f(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&l(e,t)}function l(e,t){return(l=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function h(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function p(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function d(e,t,n){return t&&p(e.prototype,t),n&&p(e,n),e}function g(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var y=(d(v,[{key:"payload",get:function(){return this._payload}},{key:"title",set:function(e){this._title=e}},{key:"subtitle",set:function(e){this._subtitle=e}},{key:"body",set:function(e){this._body=e}},{key:"badge",set:function(e){this._badge=e}},{key:"sound",set:function(e){this._sound=e}}]),d(v,[{key:"_setDefaultPayloadStructure",value:function(){}},{key:"toObject",value:function(){return{}}}]),v);function v(e,t,n){h(this,v),g(this,"_subtitle",void 0),g(this,"_payload",void 0),g(this,"_badge",void 0),g(this,"_sound",void 0),g(this,"_title",void 0),g(this,"_body",void 0),this._payload=e,this._setDefaultPayloadStructure(),this.title=t,this.body=n}var b=(f(m,y),d(m,[{key:"_setDefaultPayloadStructure",value:function(){this._payload.aps={alert:{}}}},{key:"toObject",value:function(){var t=this,e=s({},this._payload),n=e.aps,r=n.alert;if(this._isSilent&&(n["content-available"]=1),"apns2"===this._apnsPushType){if(!this._configurations||!this._configurations.length)throw new ReferenceError("APNS2 configuration is missing");var i=[];this._configurations.forEach(function(e){i.push(t._objectFromAPNS2Configuration(e))}),i.length&&(e.pn_push=i)}return r&&Object.keys(r).length||delete n.alert,this._isSilent&&(delete n.alert,delete n.badge,delete n.sound,r={}),this._isSilent||Object.keys(r).length?e:null}},{key:"_objectFromAPNS2Configuration",value:function(e){var t=this;if(!e.targets||!e.targets.length)throw new ReferenceError("At least one APNS2 target should be provided");var n=[];e.targets.forEach(function(e){n.push(t._objectFromAPNSTarget(e))});var r=e.collapseId,i=e.expirationDate,o={auth_method:"token",targets:n,version:"v2"};return r&&r.length&&(o.collapse_id=r),i&&(o.expiration=i.toISOString()),o}},{key:"_objectFromAPNSTarget",value:function(e){if(!e.topic||!e.topic.length)throw new TypeError("Target 'topic' undefined.");var t=e.topic,n=e.environment,r=void 0===n?"development":n,i=e.excludedDevices,o=void 0===i?[]:i,s={topic:t,environment:r};return o.length&&(s.excluded_devices=o),s}},{key:"configurations",set:function(e){e&&e.length&&(this._configurations=e)}},{key:"notification",get:function(){return this._payload.aps}},{key:"title",get:function(){return this._title},set:function(e){e&&e.length&&(this._payload.aps.alert.title=e,this._title=e)}},{key:"subtitle",get:function(){return this._subtitle},set:function(e){e&&e.length&&(this._payload.aps.alert.subtitle=e,this._subtitle=e)}},{key:"body",get:function(){return this._body},set:function(e){e&&e.length&&(this._payload.aps.alert.body=e,this._body=e)}},{key:"badge",get:function(){return this._badge},set:function(e){null!=e&&(this._payload.aps.badge=e,this._badge=e)}},{key:"sound",get:function(){return this._sound},set:function(e){e&&e.length&&(this._payload.aps.sound=e,this._sound=e)}},{key:"silent",set:function(e){this._isSilent=e}}]),m);function m(){var e,t;h(this,m);for(var n=arguments.length,r=new Array(n),i=0;i<n;i++)r[i]=arguments[i];return g(c(t=a(this,(e=u(m)).call.apply(e,[this].concat(r)))),"_configurations",void 0),g(c(t),"_apnsPushType",void 0),g(c(t),"_isSilent",void 0),t}t.APNSNotificationPayload=b;var _=(f(k,y),d(k,[{key:"toObject",value:function(){return Object.keys(this._payload).length?s({},this._payload):null}},{key:"backContent",get:function(){return this._backContent},set:function(e){e&&e.length&&(this._payload.back_content=e,this._backContent=e)}},{key:"backTitle",get:function(){return this._backTitle},set:function(e){e&&e.length&&(this._payload.back_title=e,this._backTitle=e)}},{key:"count",get:function(){return this._count},set:function(e){null!=e&&(this._payload.count=e,this._count=e)}},{key:"title",get:function(){return this._title},set:function(e){e&&e.length&&(this._payload.title=e,this._title=e)}},{key:"type",get:function(){return this._type},set:function(e){e&&e.length&&(this._payload.type=e,this._type=e)}},{key:"subtitle",get:function(){return this.backTitle},set:function(e){this.backTitle=e}},{key:"body",get:function(){return this.backContent},set:function(e){this.backContent=e}},{key:"badge",get:function(){return this.count},set:function(e){this.count=e}}]),k);function k(){var e,t;h(this,k);for(var n=arguments.length,r=new Array(n),i=0;i<n;i++)r[i]=arguments[i];return g(c(t=a(this,(e=u(k)).call.apply(e,[this].concat(r)))),"_backContent",void 0),g(c(t),"_backTitle",void 0),g(c(t),"_count",void 0),g(c(t),"_type",void 0),t}t.MPNSNotificationPayload=_;var P=(f(w,y),d(w,[{key:"_setDefaultPayloadStructure",value:function(){this._payload.notification={},this._payload.data={}}},{key:"toObject",value:function(){var e=s({},this._payload.data),t=null,n={};if(2<Object.keys(this._payload).length){var r=this._payload;r.notification,r.data,e=s({},e,{},i(r,["notification","data"]))}return this._isSilent?e.notification=this._payload.notification:t=this._payload.notification,Object.keys(e).length&&(n.data=e),t&&Object.keys(t).length&&(n.notification=t),Object.keys(n).length?n:null}},{key:"notification",get:function(){return this._payload.notification}},{key:"data",get:function(){return this._payload.data}},{key:"title",get:function(){return this._title},set:function(e){e&&e.length&&(this._payload.notification.title=e,this._title=e)}},{key:"body",get:function(){return this._body},set:function(e){e&&e.length&&(this._payload.notification.body=e,this._body=e)}},{key:"sound",get:function(){return this._sound},set:function(e){e&&e.length&&(this._payload.notification.sound=e,this._sound=e)}},{key:"icon",get:function(){return this._icon},set:function(e){e&&e.length&&(this._payload.notification.icon=e,this._icon=e)}},{key:"tag",get:function(){return this._tag},set:function(e){e&&e.length&&(this._payload.notification.tag=e,this._tag=e)}},{key:"silent",set:function(e){this._isSilent=e}}]),w);function w(){var e,t;h(this,w);for(var n=arguments.length,r=new Array(n),i=0;i<n;i++)r[i]=arguments[i];return g(c(t=a(this,(e=u(w)).call.apply(e,[this].concat(r)))),"_isSilent",void 0),g(c(t),"_icon",void 0),g(c(t),"_tag",void 0),t}function T(e,t){h(this,T),g(this,"_payload",void 0),g(this,"_debugging",void 0),g(this,"_subtitle",void 0),g(this,"_badge",void 0),g(this,"_sound",void 0),g(this,"_title",void 0),g(this,"_body",void 0),g(this,"apns",void 0),g(this,"mpns",void 0),g(this,"fcm",void 0),this._payload={apns:{},mpns:{},fcm:{}},this._title=e,this._body=t,this.apns=new b(this._payload.apns,e,t),this.mpns=new _(this._payload.mpns,e,t),this.fcm=new P(this._payload.fcm,e,t)}t.FCMNotificationPayload=P;var O=(d(T,[{key:"debugging",set:function(e){this._debugging=e}},{key:"title",get:function(){return this._title}},{key:"body",get:function(){return this._body}},{key:"subtitle",get:function(){return this._subtitle},set:function(e){this._subtitle=e,this.apns.subtitle=e,this.mpns.subtitle=e,this.fcm.subtitle=e}},{key:"badge",get:function(){return this._badge},set:function(e){this._badge=e,this.apns.badge=e,this.mpns.badge=e,this.fcm.badge=e}},{key:"sound",get:function(){return this._sound},set:function(e){this._sound=e,this.apns.sound=e,this.mpns.sound=e,this.fcm.sound=e}}]),d(T,[{key:"buildPayload",value:function(e){var t={};if(e.includes("apns")||e.includes("apns2")){this.apns._apnsPushType=e.includes("apns")?"apns":"apns2";var n=this.apns.toObject();n&&Object.keys(n).length&&(t.pn_apns=n)}if(e.includes("mpns")){var r=this.mpns.toObject();r&&Object.keys(r).length&&(t.pn_mpns=r)}if(e.includes("fcm")){var i=this.fcm.toObject();i&&Object.keys(i).length&&(t.pn_gcm=i)}return Object.keys(t).length&&this._debugging&&(t.pn_debug=!0),t}}]),T);t.default=O},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r;(r=n(3))&&r.__esModule,n(0);function i(e){return(i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function o(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function s(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var a,u,c,f=(a=l,(u=[{key:"_initializeTokens",value:function(){this._userTokens={},this._spaceTokens={},this._userToken=void 0,this._spaceToken=void 0}},{key:"_setToken",value:function(t){var n=this,e=this.parseToken(t);e&&e.resources&&(e.resources.users&&Object.keys(e.resources.users).forEach(function(e){n._userTokens[e]=t}),e.resources.spaces&&Object.keys(e.resources.spaces).forEach(function(e){n._spaceTokens[e]=t})),e&&e.patterns&&(e.patterns.users&&0<Object.keys(e.patterns.users).length&&(this._userToken=t),e.patterns.spaces&&0<Object.keys(e.patterns.spaces).length&&(this._spaceToken=t))}},{key:"setToken",value:function(e){e&&0<e.length&&this._setToken(e)}},{key:"setTokens",value:function(e){var t=this;e&&e.length&&"object"===i(e)&&e.forEach(function(e){t.setToken(e)})}},{key:"getTokens",value:function(e){var t=this,n={users:{},spaces:{}};return e?(e.user&&(n.user=this._userToken),e.space&&(n.space=this._spaceToken),e.users&&e.users.forEach(function(e){n.users[e]=t._userTokens[e]}),e.space&&e.spaces.forEach(function(e){n.spaces[e]=t._spaceTokens[e]})):(this._userToken&&(n.user=this._userToken),this._spaceToken&&(n.space=this._spaceToken),Object.keys(this._userTokens).forEach(function(e){n.users[e]=t._userTokens[e]}),Object.keys(this._spaceTokens).forEach(function(e){n.spaces[e]=t._spaceTokens[e]})),n}},{key:"getToken",value:function(e,t){var n;return t?"user"===e?n=this._userTokens[t]:"space"===e&&(n=this._spaceTokens[t]):"user"===e?n=this._userToken:"space"===e&&(n=this._spaceToken),n}},{key:"extractPermissions",value:function(e){var t={create:!1,read:!1,write:!1,manage:!1,delete:!1};return 16==(16&e)&&(t.create=!0),8==(8&e)&&(t.delete=!0),4==(4&e)&&(t.manage=!0),2==(2&e)&&(t.write=!0),1==(1&e)&&(t.read=!0),t}},{key:"parseToken",value:function(e){var t=this,n=this._cbor.decodeToken(e);if(void 0!==n){var r=Object.keys(n.res.usr),i=Object.keys(n.res.spc),o=Object.keys(n.pat.usr),s=Object.keys(n.pat.spc),a={version:n.v,timestamp:n.t,ttl:n.ttl},u=0<r.length,c=0<i.length;(u||c)&&(a.resources={},u&&(a.resources.users={},r.forEach(function(e){a.resources.users[e]=t.extractPermissions(n.res.usr[e])})),c&&(a.resources.spaces={},i.forEach(function(e){a.resources.spaces[e]=t.extractPermissions(n.res.spc[e])})));var f=0<o.length,l=0<s.length;return(f||l)&&(a.patterns={},f&&(a.patterns.users={},o.forEach(function(e){a.patterns.users[e]=t.extractPermissions(n.pat.usr[e])})),l&&(a.patterns.spaces={},s.forEach(function(e){a.patterns.spaces[e]=t.extractPermissions(n.pat.spc[e])}))),0<Object.keys(n.meta).length&&(a.meta=n.meta),a.signature=n.sig,a}}},{key:"clearTokens",value:function(){this._initializeTokens()}}])&&o(a.prototype,u),void(c&&o(a,c)),l);function l(e,t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l),s(this,"_config",void 0),s(this,"_cbor",void 0),s(this,"_userTokens",void 0),s(this,"_spaceTokens",void 0),s(this,"_userToken",void 0),s(this,"_spaceToken",void 0),this._config=e,this._cbor=t,this._initializeTokens()}t.default=f,e.exports=t.default},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(r,i){var e=r.networking,t=r.config,o=null,s=null,a={};o=i.getOperation()===b.default.PNTimeOperation||i.getOperation()===b.default.PNChannelGroupsOperation?arguments.length<=2?void 0:arguments[2]:(a=arguments.length<=2?void 0:arguments[2],arguments.length<=3?void 0:arguments[3]);"undefined"==typeof Promise||o||(s=v.default.createPromise());var n=i.validateParams(r,a);if(n)return o?o(_(n)):s?(s.reject(new m("Validation failed, check status for details",_(n))),s.promise):void 0;var u,c=i.prepareParams(r,a),f=function(e,t,n){return e.usePost&&e.usePost(t,n)?e.postURL(t,n):e.usePatch&&e.usePatch(t,n)?e.patchURL(t,n):e.getURL(t,n)}(i,r,a),l={url:f,operation:i.getOperation(),timeout:i.getRequestTimeout(r),headers:i.getRequestHeaders?i.getRequestHeaders():{}};c.uuid=t.UUID,c.pnsdk=function(e){if(e.sdkName)return e.sdkName;var t="PubNub-JS-".concat(e.sdkFamily);e.partnerId&&(t+="-".concat(e.partnerId));t+="/".concat(e.getVersion());var n=e._getPnsdkSuffix(" ");0<n.length&&(t+=n);return t}(t),t.useInstanceId&&(c.instanceid=t.instanceId);t.useRequestId&&(c.requestid=y.default.createUUID());if(i.isAuthSupported()){var h=function(e,t,n){var r;e.getAuthToken&&(r=e.getAuthToken(t,n));return r}(i,r,a)||t.getAuthKey();h&&(c.auth=h)}t.secretKey&&function(e,t,n,r,i){var o=e.config,s=e.crypto,a=k(e,i,r);n.timestamp=Math.floor((new Date).getTime()/1e3);var u="".concat(a,"\n").concat(o.publishKey,"\n").concat(t,"\n").concat(v.default.signPamFromParams(n),"\n");if("POST"===a){var c=i.postPayload(e,r);u+="string"==typeof c?c:JSON.stringify(c)}else if("PATCH"===a){var f=i.patchPayload(e,r);u+="string"==typeof f?f:JSON.stringify(f)}var l="v2.".concat(s.HMACSHA256(u));l=(l=(l=l.replace(/\+/g,"-")).replace(/\//g,"_")).replace(/=+$/,""),n.signature=l}(r,f,c,a,i);function p(e,t){if(e.error)o?o(e):s&&s.reject(new m("PubNub call failed, check status for details",e));else{var n=i.handleResponse(r,t,a);o?o(e,n):s&&s.fulfill(n)}}if("POST"===k(r,i,a)){var d=i.postPayload(r,a);u=e.POST(c,d,l,p)}else if("PATCH"===k(r,i,a)){var g=i.patchPayload(r,a);u=e.PATCH(c,g,l,p)}else u="DELETE"===k(r,i,a)?e.DELETE(c,l,p):e.GET(c,l,p);if(i.getOperation()===b.default.PNSubscribeOperation)return u;if(s)return s.promise};var y=r(n(5)),v=(n(0),r(n(2))),b=(r(n(3)),r(n(1)));function r(e){return e&&e.__esModule?e:{default:e}}function i(e){return(i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function o(e,t){return!t||"object"!==i(t)&&"function"!=typeof t?function(e){if(void 0!==e)return e;throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}(e):t}function s(e){var n="function"==typeof Map?new Map:void 0;return(s=function(e){if(null===e||!function(e){return-1!==Function.toString.call(e).indexOf("[native code]")}(e))return e;if("function"!=typeof e)throw new TypeError("Super expression must either be null or a function");if(void 0!==n){if(n.has(e))return n.get(e);n.set(e,t)}function t(){return a(e,arguments,c(this).constructor)}return t.prototype=Object.create(e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),u(t,e)})(e)}function a(e,t,n){return(a=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],function(){})),!0}catch(e){return!1}}()?Reflect.construct:function(e,t,n){var r=[null];r.push.apply(r,t);var i=new(Function.bind.apply(e,r));return n&&u(i,n.prototype),i}).apply(null,arguments)}function u(e,t){return(u=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function c(e){return(c=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var m=(function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&u(e,t)}(f,s(Error)),f);function f(e,t){var n;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,f),(n=o(this,c(f).call(this,e))).name=n.constructor.name,n.status=t,n.message=e,n}function _(e){return function(e,t){return e.type=t,e.error=!0,e}({message:e},"validationError")}function k(e,t,n){return t.usePost&&t.usePost(e,n)?"POST":t.usePatch&&t.usePatch(e,n)?"PATCH":t.useDelete&&t.useDelete(e,n)?"DELETE":"GET"}e.exports=t.default},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNAddChannelsToGroupOperation},t.validateParams=function(e,t){var n=t.channels,r=t.channelGroup,i=e.config;if(!r)return"Missing Channel Group";if(!n||0===n.length)return"Missing Channels";if(!i.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=t.channelGroup,r=e.config;return"/v1/channel-registration/sub-key/".concat(r.subscribeKey,"/channel-group/").concat(i.default.encodeString(n))},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.channels;return{add:(void 0===n?[]:n).join(",")}},t.handleResponse=function(){return{}};n(0);var r=o(n(1)),i=o(n(2));function o(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNRemoveChannelsFromGroupOperation},t.validateParams=function(e,t){var n=t.channels,r=t.channelGroup,i=e.config;if(!r)return"Missing Channel Group";if(!n||0===n.length)return"Missing Channels";if(!i.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=t.channelGroup,r=e.config;return"/v1/channel-registration/sub-key/".concat(r.subscribeKey,"/channel-group/").concat(i.default.encodeString(n))},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.channels;return{remove:(void 0===n?[]:n).join(",")}},t.handleResponse=function(){return{}};n(0);var r=o(n(1)),i=o(n(2));function o(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNRemoveGroupOperation},t.validateParams=function(e,t){var n=t.channelGroup,r=e.config;if(!n)return"Missing Channel Group";if(!r.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=t.channelGroup,r=e.config;return"/v1/channel-registration/sub-key/".concat(r.subscribeKey,"/channel-group/").concat(i.default.encodeString(n),"/remove")},t.isAuthSupported=function(){return!0},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.prepareParams=function(){return{}},t.handleResponse=function(){return{}};n(0);var r=o(n(1)),i=o(n(2));function o(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNChannelGroupsOperation},t.validateParams=function(e){if(!e.config.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e){var t=e.config;return"/v1/channel-registration/sub-key/".concat(t.subscribeKey,"/channel-group")},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(){return{}},t.handleResponse=function(e,t){return{groups:t.payload.groups}};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNChannelsForGroupOperation},t.validateParams=function(e,t){var n=t.channelGroup,r=e.config;if(!n)return"Missing Channel Group";if(!r.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=t.channelGroup,r=e.config;return"/v1/channel-registration/sub-key/".concat(r.subscribeKey,"/channel-group/").concat(i.default.encodeString(n))},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(){return{}},t.handleResponse=function(e,t){return{channels:t.payload.channels}};n(0);var r=o(n(1)),i=o(n(2));function o(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNPushNotificationEnabledChannelsOperation},t.validateParams=function(e,t){var n=t.device,r=t.pushGateway,i=t.channels,o=t.topic,s=e.config;if(!n)return"Missing Device ID (device)";if(!r)return"Missing GW Type (pushGateway: gcm, apns or apns2)";if("apns2"===r&&!o)return"Missing APNS2 topic";if(!i||0===i.length)return"Missing Channels";if(!s.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=t.device,r=t.pushGateway,i=e.config;return"apns2"!==r?"/v1/push/sub-key/".concat(i.subscribeKey,"/devices/").concat(n):"/v2/push/sub-key/".concat(i.subscribeKey,"/devices-apns2/").concat(n)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.pushGateway,r=t.channels,i=void 0===r?[]:r,o=t.environment,s=void 0===o?"development":o,a=t.topic,u={type:n,add:i.join(",")};"apns2"===n&&delete(u=Object.assign({},u,{environment:s,topic:a})).type;return u},t.handleResponse=function(){return{}};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNPushNotificationEnabledChannelsOperation},t.validateParams=function(e,t){var n=t.device,r=t.pushGateway,i=t.channels,o=t.topic,s=e.config;if(!n)return"Missing Device ID (device)";if(!r)return"Missing GW Type (pushGateway: gcm, apns or apns2)";if("apns2"===r&&!o)return"Missing APNS2 topic";if(!i||0===i.length)return"Missing Channels";if(!s.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=t.device,r=t.pushGateway,i=e.config;return"apns2"!==r?"/v1/push/sub-key/".concat(i.subscribeKey,"/devices/").concat(n):"/v2/push/sub-key/".concat(i.subscribeKey,"/devices-apns2/").concat(n)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.pushGateway,r=t.channels,i=void 0===r?[]:r,o=t.environment,s=void 0===o?"development":o,a=t.topic,u={type:n,remove:i.join(",")};"apns2"===n&&delete(u=Object.assign({},u,{environment:s,topic:a})).type;return u},t.handleResponse=function(){return{}};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNPushNotificationEnabledChannelsOperation},t.validateParams=function(e,t){var n=t.device,r=t.pushGateway,i=t.topic,o=e.config;if(!n)return"Missing Device ID (device)";if(!r)return"Missing GW Type (pushGateway: gcm, apns or apns2)";if("apns2"===r&&!i)return"Missing APNS2 topic";if(!o.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=t.device,r=t.pushGateway,i=e.config;return"apns2"!==r?"/v1/push/sub-key/".concat(i.subscribeKey,"/devices/").concat(n):"/v2/push/sub-key/".concat(i.subscribeKey,"/devices-apns2/").concat(n)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.pushGateway,r=t.environment,i=void 0===r?"development":r,o=t.topic,s={type:n};"apns2"===n&&delete(s=Object.assign({},s,{environment:i,topic:o})).type;return s},t.handleResponse=function(e,t){return{channels:t}};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNRemoveAllPushNotificationsOperation},t.validateParams=function(e,t){var n=t.device,r=t.pushGateway,i=t.topic,o=e.config;if(!n)return"Missing Device ID (device)";if(!r)return"Missing GW Type (pushGateway: gcm, apns or apns2)";if("apns2"===r&&!i)return"Missing APNS2 topic";if(!o.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=t.device,r=t.pushGateway,i=e.config;return"apns2"!==r?"/v1/push/sub-key/".concat(i.subscribeKey,"/devices/").concat(n,"/remove"):"/v2/push/sub-key/".concat(i.subscribeKey,"/devices-apns2/").concat(n,"/remove")},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.pushGateway,r=t.environment,i=void 0===r?"development":r,o=t.topic,s={type:n};"apns2"===n&&delete(s=Object.assign({},s,{environment:i,topic:o})).type;return s},t.handleResponse=function(){return{}};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNUnsubscribeOperation},t.validateParams=function(e){if(!e.config.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=e.config,r=t.channels,i=void 0===r?[]:r,o=0<i.length?i.join(","):",";return"/v2/presence/sub-key/".concat(n.subscribeKey,"/channel/").concat(s.default.encodeString(o),"/leave")},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.channelGroups,r=void 0===n?[]:n,i={};0<r.length&&(i["channel-group"]=r.join(","));return i},t.handleResponse=function(){return{}};n(0);var r=i(n(1)),s=i(n(2));function i(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNWhereNowOperation},t.validateParams=function(e){if(!e.config.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=e.config,r=t.uuid,i=void 0===r?n.UUID:r;return"/v2/presence/sub-key/".concat(n.subscribeKey,"/uuid/").concat(i)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(){return{}},t.handleResponse=function(e,t){return t.payload?{channels:t.payload.channels}:{channels:[]}};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNHeartbeatOperation},t.validateParams=function(e){if(!e.config.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=e.config,r=t.channels,i=void 0===r?[]:r,o=0<i.length?i.join(","):",";return"/v2/presence/sub-key/".concat(n.subscribeKey,"/channel/").concat(s.default.encodeString(o),"/heartbeat")},t.isAuthSupported=function(){return!0},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.prepareParams=function(e,t){var n=t.channelGroups,r=void 0===n?[]:n,i=t.state,o=void 0===i?{}:i,s=e.config,a={};0<r.length&&(a["channel-group"]=r.join(","));return a.state=JSON.stringify(o),a.heartbeat=s.getPresenceTimeout(),a},t.handleResponse=function(){return{}};n(0);var r=i(n(1)),s=i(n(2));function i(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNGetStateOperation},t.validateParams=function(e){if(!e.config.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=e.config,r=t.uuid,i=void 0===r?n.UUID:r,o=t.channels,s=void 0===o?[]:o,a=0<s.length?s.join(","):",";return"/v2/presence/sub-key/".concat(n.subscribeKey,"/channel/").concat(u.default.encodeString(a),"/uuid/").concat(i)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.channelGroups,r=void 0===n?[]:n,i={};0<r.length&&(i["channel-group"]=r.join(","));return i},t.handleResponse=function(e,t,n){var r=n.channels,i=void 0===r?[]:r,o=n.channelGroups,s=void 0===o?[]:o,a={};1===i.length&&0===s.length?a[i[0]]=t.payload:a=t.payload;return{channels:a}};n(0);var r=i(n(1)),u=i(n(2));function i(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNSetStateOperation},t.validateParams=function(e,t){var n=e.config,r=t.state,i=t.channels,o=void 0===i?[]:i,s=t.channelGroups,a=void 0===s?[]:s;if(!r)return"Missing State";if(!n.subscribeKey)return"Missing Subscribe Key";if(0===o.length&&0===a.length)return"Please provide a list of channels and/or channel-groups"},t.getURL=function(e,t){var n=e.config,r=t.channels,i=void 0===r?[]:r,o=0<i.length?i.join(","):",";return"/v2/presence/sub-key/".concat(n.subscribeKey,"/channel/").concat(s.default.encodeString(o),"/uuid/").concat(n.UUID,"/data")},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.state,r=t.channelGroups,i=void 0===r?[]:r,o={};o.state=JSON.stringify(n),0<i.length&&(o["channel-group"]=i.join(","));return o},t.handleResponse=function(e,t){return{state:t.payload}};n(0);var r=i(n(1)),s=i(n(2));function i(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNHereNowOperation},t.validateParams=function(e){if(!e.config.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=e.config,r=t.channels,i=void 0===r?[]:r,o=t.channelGroups,s=void 0===o?[]:o,a="/v2/presence/sub-key/".concat(n.subscribeKey);if(0<i.length||0<s.length){var u=0<i.length?i.join(","):",";a+="/channel/".concat(c.default.encodeString(u))}return a},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.channelGroups,r=void 0===n?[]:n,i=t.includeUUIDs,o=void 0===i||i,s=t.includeState,a=void 0!==s&&s,u={};o||(u.disable_uuids=1);a&&(u.state=1);0<r.length&&(u["channel-group"]=r.join(","));return u},t.handleResponse=function(e,i,t){var n,r=t.channels,o=void 0===r?[]:r,s=t.channelGroups,a=void 0===s?[]:s,u=t.includeUUIDs,c=void 0===u||u,f=t.includeState,l=void 0!==f&&f;n=1<o.length||0<a.length||0===a.length&&0===o.length?function(){var r={};return r.totalChannels=i.payload.total_channels,r.totalOccupancy=i.payload.total_occupancy,r.channels={},Object.keys(i.payload.channels).forEach(function(e){var t=i.payload.channels[e],n=[];return r.channels[e]={occupants:n,name:e,occupancy:t.occupancy},c&&t.uuids.forEach(function(e){l?n.push({state:e.state,uuid:e.uuid}):n.push({state:null,uuid:e})}),r}),r}():function(){var e={},t=[];return e.totalChannels=1,e.totalOccupancy=i.occupancy,e.channels={},e.channels[o[0]]={occupants:t,name:o[0],occupancy:i.occupancy},c&&i.uuids&&i.uuids.forEach(function(e){l?t.push({state:e.state,uuid:e.uuid}):t.push({state:null,uuid:e})}),e}();return n};n(0);var r=i(n(1)),c=i(n(2));function i(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNAddMessageActionOperation},t.validateParams=function(e,t){var n=e.config,r=t.action,i=t.channel;if(!t.messageTimetoken)return"Missing message timetoken";if(!n.subscribeKey)return"Missing Subscribe Key";if(!i)return"Missing message channel";if(!r)return"Missing Action";if(!r.value)return"Missing Action.value";if(!r.type)return"Missing Action.type";if(15<r.type.length)return"Action.type value exceed maximum length of 15"},t.usePost=function(){return!0},t.postURL=function(e,t){var n=e.config,r=t.channel,i=t.messageTimetoken;return"/v1/message-actions/".concat(n.subscribeKey,"/channel/").concat(r,"/message/").concat(i)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.getRequestHeaders=function(){return{"Content-Type":"application/json"}},t.isAuthSupported=function(){return!0},t.prepareParams=function(){return{}},t.postPayload=function(e,t){return t.action},t.handleResponse=function(e,t){return{data:t.data}};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNRemoveMessageActionOperation},t.validateParams=function(e,t){var n=e.config,r=t.channel,i=t.actionTimetoken;if(!t.messageTimetoken)return"Missing message timetoken";if(!i)return"Missing action timetoken";if(!n.subscribeKey)return"Missing Subscribe Key";if(!r)return"Missing message channel"},t.useDelete=function(){return!0},t.getURL=function(e,t){var n=e.config,r=t.channel,i=t.actionTimetoken,o=t.messageTimetoken;return"/v1/message-actions/".concat(n.subscribeKey,"/channel/").concat(r,"/message/").concat(o,"/action/").concat(i)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(){return{}},t.handleResponse=function(e,t){return{data:t.data}};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNGetMessageActionsOperation},t.validateParams=function(e,t){var n=e.config,r=t.channel;if(!n.subscribeKey)return"Missing Subscribe Key";if(!r)return"Missing message channel"},t.getURL=function(e,t){var n=e.config,r=t.channel;return"/v1/message-actions/".concat(n.subscribeKey,"/channel/").concat(r)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.limit,r=t.start,i=t.end,o={};n&&(o.limit=n);r&&(o.start=r);i&&(o.end=i);return o},t.handleResponse=function(e,t){var n={data:t.data,start:null,end:null};n.data.length&&(n.end=n.data[n.data.length-1].actionTimetoken,n.start=n.data[0].actionTimetoken);return n};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNCreateUserOperation},t.validateParams=function(e,t){var n=e.config,r=t.id,i=t.name,o=t.custom;if(!r)return"Missing User.id";if(!i)return"Missing User.name";if(!n.subscribeKey)return"Missing Subscribe Key";if(o&&!Object.values(o).every(function(e){return"string"==typeof e||"number"==typeof e||"boolean"==typeof e}))return"Invalid custom type, only string, number and boolean values are allowed."},t.usePost=function(){return!0},t.getURL=function(e){var t=e.config;return"/v1/objects/".concat(t.subscribeKey,"/users")},t.postURL=function(e){var t=e.config;return"/v1/objects/".concat(t.subscribeKey,"/users")},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("user",t.id)||e.tokenManager.getToken("user")},t.prepareParams=function(e,t){var n=t.include,r={};n?void 0===n.customFields&&(n.customFields=!0):n={customFields:!0};if(n){var i=[];n.customFields&&i.push("custom");var o=i.join(",");0<o.length&&(r.include=o)}return r},t.postPayload=function(e,t){return function(e,t){return t}(0,t)},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNUpdateUserOperation},t.validateParams=function(e,t){var n=e.config,r=t.id,i=t.name,o=t.custom;if(!r)return"Missing User.id";if(!i)return"Missing User.name";if(!n.subscribeKey)return"Missing Subscribe Key";if(o&&!Object.values(o).every(function(e){return"string"==typeof e||"number"==typeof e||"boolean"==typeof e}))return"Invalid custom type, only string, number and boolean values are allowed."},t.usePatch=function(){return!0},t.getURL=function(e,t){var n=e.config,r=t.id;return"/v1/objects/".concat(n.subscribeKey,"/users/").concat(r)},t.patchURL=function(e,t){var n=e.config,r=t.id;return"/v1/objects/".concat(n.subscribeKey,"/users/").concat(r)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("user",t.id)||e.tokenManager.getToken("user")},t.prepareParams=function(e,t){var n=t.include,r={};n?void 0===n.customFields&&(n.customFields=!0):n={customFields:!0};if(n){var i=[];n.customFields&&i.push("custom");var o=i.join(",");0<o.length&&(r.include=o)}return r},t.patchPayload=function(e,t){return function(e,t){return t}(0,t)},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNDeleteUserOperation},t.validateParams=function(e,t){var n=e.config;if(!t)return"Missing UserId";if(!n.subscribeKey)return"Missing Subscribe Key"},t.useDelete=function(){return!0},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/users/").concat(t)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("user",t)||e.tokenManager.getToken("user")},t.prepareParams=function(){return{}},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNGetUserOperation},t.validateParams=function(e,t){if(!t.userId)return"Missing userId"},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/users/").concat(t.userId)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("user",t.userId)||e.tokenManager.getToken("user")},t.prepareParams=function(e,t){var n=t.include,r={};n?void 0===n.customFields&&(n.customFields=!0):n={customFields:!0};if(n){var i=[];n.customFields&&i.push("custom");var o=i.join(",");0<o.length&&(r.include=o)}return r},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNGetUsersOperation},t.validateParams=function(){},t.getURL=function(e){var t=e.config;return"/v1/objects/".concat(t.subscribeKey,"/users")},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e){return e.tokenManager.getToken("user")},t.prepareParams=function(e,t){var n=t.include,r=t.limit,i=t.page,o={};r&&(o.limit=r);if(n){var s=[];n.totalCount&&(o.count=!0),n.customFields&&s.push("custom");var a=s.join(",");0<a.length&&(o.include=a)}i&&(i.next&&(o.start=i.next),i.prev&&(o.end=i.prev));return o},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNCreateSpaceOperation},t.validateParams=function(e,t){var n=e.config,r=t.id,i=t.name,o=t.custom;if(!r)return"Missing Space.id";if(!i)return"Missing Space.name";if(!n.subscribeKey)return"Missing Subscribe Key";if(o&&!Object.values(o).every(function(e){return"string"==typeof e||"number"==typeof e||"boolean"==typeof e}))return"Invalid custom type, only string, number and boolean values are allowed."},t.usePost=function(){return!0},t.getURL=function(e){var t=e.config;return"/v1/objects/".concat(t.subscribeKey,"/spaces")},t.postURL=function(e){var t=e.config;return"/v1/objects/".concat(t.subscribeKey,"/spaces")},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("space",t.id)||e.tokenManager.getToken("space")},t.prepareParams=function(e,t){var n=t.include,r={};n?void 0===n.customFields&&(n.customFields=!0):n={customFields:!0};if(n){var i=[];n.customFields&&i.push("custom");var o=i.join(",");0<o.length&&(r.include=o)}return r},t.postPayload=function(e,t){return function(e,t){return t}(0,t)},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNUpdateSpaceOperation},t.validateParams=function(e,t){var n=e.config,r=t.id,i=t.name,o=t.custom;if(!r)return"Missing Space.id";if(!i)return"Missing Space.name";if(!n.subscribeKey)return"Missing Subscribe Key";if(o&&!Object.values(o).every(function(e){return"string"==typeof e||"number"==typeof e||"boolean"==typeof e}))return"Invalid custom type, only string, number and boolean values are allowed."},t.usePatch=function(){return!0},t.getURL=function(e,t){var n=e.config,r=t.id;return"/v1/objects/".concat(n.subscribeKey,"/spaces/").concat(r)},t.patchURL=function(e,t){var n=e.config,r=t.id;return"/v1/objects/".concat(n.subscribeKey,"/spaces/").concat(r)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("space",t.id)||e.tokenManager.getToken("space")},t.prepareParams=function(e,t){var n=t.include,r={};n?void 0===n.customFields&&(n.customFields=!0):n={customFields:!0};if(n){var i=[];n.customFields&&i.push("custom");var o=i.join(",");0<o.length&&(r.include=o)}return r},t.patchPayload=function(e,t){return function(e,t){return t}(0,t)},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNDeleteSpaceOperation},t.validateParams=function(e,t){var n=e.config;if(!t)return"Missing SpaceId";if(!n.subscribeKey)return"Missing Subscribe Key"},t.useDelete=function(){return!0},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/spaces/").concat(t)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("space",t)||e.tokenManager.getToken("space")},t.prepareParams=function(){return{}},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNGetSpacesOperation},t.validateParams=function(){},t.getURL=function(e){var t=e.config;return"/v1/objects/".concat(t.subscribeKey,"/spaces")},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e){return e.tokenManager.getToken("space")},t.prepareParams=function(e,t){var n=t.include,r=t.limit,i=t.page,o={};r&&(o.limit=r);if(n){var s=[];n.totalCount&&(o.count=!0),n.customFields&&s.push("custom");var a=s.join(",");0<a.length&&(o.include=a)}i&&(i.next&&(o.start=i.next),i.prev&&(o.end=i.prev));return o},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNGetSpaceOperation},t.validateParams=function(e,t){if(!t.spaceId)return"Missing spaceId"},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/spaces/").concat(t.spaceId)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("space",t.spaceId)||e.tokenManager.getToken("space")},t.prepareParams=function(e,t){var n=t.include,r={};n?void 0===n.customFields&&(n.customFields=!0):n={customFields:!0};if(n){var i=[];n.customFields&&i.push("custom");var o=i.join(",");0<o.length&&(r.include=o)}return r},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNGetMembersOperation},t.validateParams=function(e,t){if(!t.spaceId)return"Missing spaceId"},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/spaces/").concat(t.spaceId,"/users")},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("space",t.spaceId)||e.tokenManager.getToken("space")},t.prepareParams=function(e,t){var n=t.include,r=t.limit,i=t.page,o={};r&&(o.limit=r);if(n){var s=[];n.totalCount&&(o.count=!0),n.customFields&&s.push("custom"),n.userFields&&s.push("user"),n.customUserFields&&s.push("user.custom");var a=s.join(",");0<a.length&&(o.include=a)}i&&(i.next&&(o.start=i.next),i.prev&&(o.end=i.prev));return o},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNUpdateMembersOperation},t.validateParams=function(e,t){var n=t.spaceId,r=t.users;if(!n)return"Missing spaceId";if(!r)return"Missing users"},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/spaces/").concat(t.spaceId,"/users")},t.patchURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/spaces/").concat(t.spaceId,"/users")},t.usePatch=function(){return!0},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("space",t.spaceId)||e.tokenManager.getToken("space")},t.prepareParams=function(e,t){var n=t.include,r=t.limit,i=t.page,o={};r&&(o.limit=r);if(n){var s=[];n.totalCount&&(o.count=!0),n.customFields&&s.push("custom"),n.spaceFields&&s.push("space"),n.customSpaceFields&&s.push("space.custom");var a=s.join(",");0<a.length&&(o.include=a)}i&&(i.next&&(o.start=i.next),i.prev&&(o.end=i.prev));return o},t.patchPayload=function(e,t){return function(e,t){var n=t.users,r={};n&&0<n.length&&(r.add=[],n.forEach(function(e){var t={id:e.id};e.custom&&(t.custom=e.custom),r.add.push(t)}));return r}(0,t)},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNUpdateMembersOperation},t.validateParams=function(e,t){var n=t.spaceId,r=t.users;if(!n)return"Missing spaceId";if(!r)return"Missing users"},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/spaces/").concat(t.spaceId,"/users")},t.patchURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/spaces/").concat(t.spaceId,"/users")},t.usePatch=function(){return!0},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("space",t.spaceId)||e.tokenManager.getToken("space")},t.prepareParams=function(e,t){var n=t.include,r=t.limit,i=t.page,o={};r&&(o.limit=r);if(n){var s=[];n.totalCount&&(o.count=!0),n.customFields&&s.push("custom"),n.spaceFields&&s.push("space"),n.customSpaceFields&&s.push("space.custom");var a=s.join(",");0<a.length&&(o.include=a)}i&&(i.next&&(o.start=i.next),i.prev&&(o.end=i.prev));return o},t.patchPayload=function(e,t){return function(e,t){var n=t.addMembers,r=t.updateMembers,i=t.removeMembers,o=t.users,s={};n&&0<n.length&&(s.add=[],n.forEach(function(e){var t={id:e.id};e.custom&&(t.custom=e.custom),s.add.push(t)}));r&&0<r.length&&(s.update=[],r.forEach(function(e){var t={id:e.id};e.custom&&(t.custom=e.custom),s.update.push(t)}));o&&0<o.length&&(s.update=s.update||[],o.forEach(function(e){var t={id:e.id};e.custom&&(t.custom=e.custom),s.update.push(t)}));i&&0<i.length&&(s.remove=[],i.forEach(function(e){s.remove.push({id:e})}));return s}(0,t)},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNUpdateMembersOperation},t.validateParams=function(e,t){var n=t.spaceId,r=t.users;if(!n)return"Missing spaceId";if(!r)return"Missing users"},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/spaces/").concat(t.spaceId,"/users")},t.patchURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/spaces/").concat(t.spaceId,"/users")},t.usePatch=function(){return!0},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("space",t.spaceId)||e.tokenManager.getToken("space")},t.prepareParams=function(e,t){var n=t.include,r=t.limit,i=t.page,o={};r&&(o.limit=r);if(n){var s=[];n.totalCount&&(o.count=!0),n.customFields&&s.push("custom"),n.spaceFields&&s.push("space"),n.customSpaceFields&&s.push("space.custom");var a=s.join(",");0<a.length&&(o.include=a)}i&&(i.next&&(o.start=i.next),i.prev&&(o.end=i.prev));return o},t.patchPayload=function(e,t){return function(e,t){var n=t.users,r={};n&&0<n.length&&(r.remove=[],n.forEach(function(e){r.remove.push({id:e})}));return r}(0,t)},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNGetMembershipsOperation},t.validateParams=function(e,t){if(!t.userId)return"Missing userId"},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/users/").concat(t.userId,"/spaces")},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("user",t.userId)||e.tokenManager.getToken("user")},t.prepareParams=function(e,t){var n=t.include,r=t.limit,i=t.page,o={};r&&(o.limit=r);if(n){var s=[];n.totalCount&&(o.count=!0),n.customFields&&s.push("custom"),n.spaceFields&&s.push("space"),n.customSpaceFields&&s.push("space.custom");var a=s.join(",");0<a.length&&(o.include=a)}i&&(i.next&&(o.start=i.next),i.prev&&(o.end=i.prev));return o},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNUpdateMembershipsOperation},t.validateParams=function(e,t){var n=t.userId,r=t.spaces;if(!n)return"Missing userId";if(!r)return"Missing spaces"},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/users/").concat(t.userId,"/spaces")},t.patchURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/users/").concat(t.userId,"/spaces")},t.usePatch=function(){return!0},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("user",t.userId)||e.tokenManager.getToken("user")},t.prepareParams=function(e,t){var n=t.include,r=t.limit,i=t.page,o={};r&&(o.limit=r);if(n){var s=[];n.totalCount&&(o.count=!0),n.customFields&&s.push("custom"),n.spaceFields&&s.push("space"),n.customSpaceFields&&s.push("space.custom");var a=s.join(",");0<a.length&&(o.include=a)}i&&(i.next&&(o.start=i.next),i.prev&&(o.end=i.prev));return o},t.patchPayload=function(e,t){return function(e,t){var n=t.addMemberships,r=t.updateMemberships,i=t.removeMemberships,o=t.spaces,s={};n&&0<n.length&&(s.add=[],n.forEach(function(e){var t={id:e.id};e.custom&&(t.custom=e.custom),s.add.push(t)}));r&&0<r.length&&(s.update=[],r.forEach(function(e){var t={id:e.id};e.custom&&(t.custom=e.custom),s.update.push(t)}));o&&0<o.length&&(s.update=s.update||[],o.forEach(function(e){var t={id:e.id};e.custom&&(t.custom=e.custom),s.update.push(t)}));i&&0<i.length&&(s.remove=[],i.forEach(function(e){s.remove.push({id:e})}));return s}(0,t)},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNUpdateMembershipsOperation},t.validateParams=function(e,t){var n=t.userId,r=t.spaces;if(!n)return"Missing userId";if(!r)return"Missing spaces"},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/users/").concat(t.userId,"/spaces")},t.patchURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/users/").concat(t.userId,"/spaces")},t.usePatch=function(){return!0},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("user",t.userId)||e.tokenManager.getToken("user")},t.prepareParams=function(e,t){var n=t.include,r=t.limit,i=t.page,o={};r&&(o.limit=r);if(n){var s=[];n.totalCount&&(o.count=!0),n.customFields&&s.push("custom"),n.spaceFields&&s.push("space"),n.customSpaceFields&&s.push("space.custom");var a=s.join(",");0<a.length&&(o.include=a)}i&&(i.next&&(o.start=i.next),i.prev&&(o.end=i.prev));return o},t.patchPayload=function(e,t){return function(e,t){var n=t.spaces,r={};n&&0<n.length&&(r.add=[],n.forEach(function(e){var t={id:e.id};e.custom&&(t.custom=e.custom),r.add.push(t)}));return r}(0,t)},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNUpdateMembershipsOperation},t.validateParams=function(e,t){var n=t.userId,r=t.spaces;if(!n)return"Missing userId";if(!r)return"Missing spaces"},t.getURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/users/").concat(t.userId,"/spaces")},t.patchURL=function(e,t){var n=e.config;return"/v1/objects/".concat(n.subscribeKey,"/users/").concat(t.userId,"/spaces")},t.usePatch=function(){return!0},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.getAuthToken=function(e,t){return e.tokenManager.getToken("user",t.userId)||e.tokenManager.getToken("user")},t.prepareParams=function(e,t){var n=t.include,r=t.limit,i=t.page,o={};r&&(o.limit=r);if(n){var s=[];n.totalCount&&(o.count=!0),n.customFields&&s.push("custom"),n.spaceFields&&s.push("space"),n.customSpaceFields&&s.push("space.custom");var a=s.join(",");0<a.length&&(o.include=a)}i&&(i.next&&(o.start=i.next),i.prev&&(o.end=i.prev));return o},t.patchPayload=function(e,t){return function(e,t){var n=t.spaces,r={};n&&0<n.length&&(r.remove=[],n.forEach(function(e){r.remove.push({id:e})}));return r}(0,t)},t.handleResponse=function(e,t){return t};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNAccessManagerAudit},t.validateParams=function(e){if(!e.config.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e){var t=e.config;return"/v2/auth/audit/sub-key/".concat(t.subscribeKey)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!1},t.prepareParams=function(e,t){var n=t.channel,r=t.channelGroup,i=t.authKeys,o=void 0===i?[]:i,s={};n&&(s.channel=n);r&&(s["channel-group"]=r);0<o.length&&(s.auth=o.join(","));return s},t.handleResponse=function(e,t){return t.payload};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNAccessManagerGrant},t.validateParams=function(e){var t=e.config;if(!t.subscribeKey)return"Missing Subscribe Key";if(!t.publishKey)return"Missing Publish Key";if(!t.secretKey)return"Missing Secret Key"},t.getURL=function(e){var t=e.config;return"/v2/auth/grant/sub-key/".concat(t.subscribeKey)},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!1},t.prepareParams=function(e,t){var n=t.channels,r=void 0===n?[]:n,i=t.channelGroups,o=void 0===i?[]:i,s=t.ttl,a=t.read,u=void 0!==a&&a,c=t.write,f=void 0!==c&&c,l=t.manage,h=void 0!==l&&l,p=t.authKeys,d=void 0===p?[]:p,g={};g.r=u?"1":"0",g.w=f?"1":"0",g.m=h?"1":"0",0<r.length&&(g.channel=r.join(","));0<o.length&&(g["channel-group"]=o.join(","));0<d.length&&(g.auth=d.join(","));!s&&0!==s||(g.ttl=s);return g},t.handleResponse=function(){return{}};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return i.default.PNAccessManagerGrantToken},t.extractPermissions=l,t.validateParams=function(e,t){var n=e.config;if(!n.subscribeKey)return"Missing Subscribe Key";if(!n.publishKey)return"Missing Publish Key";if(!n.secretKey)return"Missing Secret Key";if(!t.resources&&!t.patterns)return"Missing either Resources or Patterns.";if(t.resources&&(!t.resources.users||0===Object.keys(t.resources.users).length)&&(!t.resources.spaces||0===Object.keys(t.resources.spaces).length)||t.patterns&&(!t.patterns.users||0===Object.keys(t.patterns.users).length)&&(!t.patterns.spaces||0===Object.keys(t.patterns.spaces).length))return"Missing values for either Resources or Patterns."},t.postURL=function(e){var t=e.config;return"/v3/pam/".concat(t.subscribeKey,"/grant")},t.usePost=function(){return!0},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!1},t.prepareParams=function(){return{}},t.postPayload=function(e,t){return function(e,t){var n=t.ttl,r=t.resources,i=t.patterns,o=t.meta,s={ttl:0,permissions:{resources:{channels:{},groups:{},users:{},spaces:{}},patterns:{channels:{},groups:{},users:{},spaces:{}},meta:{}}};if(r){var a=r.users,u=r.spaces;a&&Object.keys(a).forEach(function(e){s.permissions.resources.users[e]=l(a[e])}),u&&Object.keys(u).forEach(function(e){s.permissions.resources.spaces[e]=l(u[e])})}if(i){var c=i.users,f=i.spaces;c&&Object.keys(c).forEach(function(e){s.permissions.patterns.users[e]=l(c[e])}),f&&Object.keys(f).forEach(function(e){s.permissions.patterns.spaces[e]=l(f[e])})}!n&&0!==n||(s.ttl=n);o&&(s.permissions.meta=o);return s}(0,t)},t.handleResponse=function(e,t){return t.data.token};n(0);var r,i=(r=n(1))&&r.__esModule?r:{default:r};function l(e){var t=0;return e.create&&(t|=16),e.delete&&(t|=8),e.manage&&(t|=4),e.write&&(t|=2),e.read&&(t|=1),t}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNPublishOperation},t.validateParams=function(e,t){var n=e.config,r=t.message;if(!t.channel)return"Missing Channel";if(!r)return"Missing Message";if(!n.subscribeKey)return"Missing Subscribe Key"},t.usePost=function(e,t){var n=t.sendByPost;return void 0!==n&&n},t.getURL=function(e,t){var n=e.config,r=t.channel,i=t.message,o=a(e,i);return"/publish/".concat(n.publishKey,"/").concat(n.subscribeKey,"/0/").concat(s.default.encodeString(r),"/0/").concat(s.default.encodeString(o))},t.postURL=function(e,t){var n=e.config,r=t.channel;return"/publish/".concat(n.publishKey,"/").concat(n.subscribeKey,"/0/").concat(s.default.encodeString(r),"/0")},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.postPayload=function(e,t){var n=t.message;return a(e,n)},t.prepareParams=function(e,t){var n=t.meta,r=t.replicate,i=void 0===r||r,o=t.storeInHistory,s=t.ttl,a={};null!=o&&(a.store=o?"1":"0");s&&(a.ttl=s);!1===i&&(a.norep="true");n&&"object"===u(n)&&(a.meta=JSON.stringify(n));return a},t.handleResponse=function(e,t){return{timetoken:t[2]}};n(0);var r=i(n(1)),s=i(n(2));function i(e){return e&&e.__esModule?e:{default:e}}function u(e){return(u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function a(e,t){var n=e.crypto,r=e.config,i=JSON.stringify(t);return r.cipherKey&&(i=n.encrypt(i),i=JSON.stringify(i)),i}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNSignalOperation},t.validateParams=function(e,t){var n=e.config,r=t.message;if(!t.channel)return"Missing Channel";if(!r)return"Missing Message";if(!n.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=e.config,r=t.channel,i=t.message,o=function(e,t){return JSON.stringify(t)}(0,i);return"/signal/".concat(n.publishKey,"/").concat(n.subscribeKey,"/0/").concat(s.default.encodeString(r),"/0/").concat(s.default.encodeString(o))},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(){return{}},t.handleResponse=function(e,t){return{timetoken:t[2]}};n(0);var r=i(n(1)),s=i(n(2));function i(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNHistoryOperation},t.validateParams=function(e,t){var n=t.channel,r=e.config;if(!n)return"Missing channel";if(!r.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=t.channel,r=e.config;return"/v2/history/sub-key/".concat(r.subscribeKey,"/channel/").concat(i.default.encodeString(n))},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.start,r=t.end,i=t.reverse,o=t.count,s=void 0===o?100:o,a=t.stringifiedTimeToken,u=void 0!==a&&a,c=t.includeMeta,f=void 0!==c&&c,l={include_token:"true"};l.count=s,n&&(l.start=n);r&&(l.end=r);u&&(l.string_message_token="true");null!=i&&(l.reverse=i.toString());f&&(l.include_meta="true");return l},t.handleResponse=function(n,e){var r={messages:[],startTimeToken:e[1],endTimeToken:e[2]};Array.isArray(e[0])&&e[0].forEach(function(e){var t={timetoken:e.timetoken,entry:function(e,t){var n=e.config,r=e.crypto;if(!n.cipherKey)return t;try{return r.decrypt(t)}catch(e){return t}}(n,e.message)};e.meta&&(t.meta=e.meta),r.messages.push(t)});return r};n(0);var r=o(n(1)),i=o(n(2));function o(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNDeleteMessagesOperation},t.validateParams=function(e,t){var n=t.channel,r=e.config;if(!n)return"Missing channel";if(!r.subscribeKey)return"Missing Subscribe Key"},t.useDelete=function(){return!0},t.getURL=function(e,t){var n=t.channel,r=e.config;return"/v3/history/sub-key/".concat(r.subscribeKey,"/channel/").concat(i.default.encodeString(n))},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.start,r=t.end,i={};n&&(i.start=n);r&&(i.end=r);return i},t.handleResponse=function(e,t){return t.payload};n(0);var r=o(n(1)),i=o(n(2));function o(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNMessageCounts},t.validateParams=function(e,t){var n=t.channels,r=t.timetoken,i=t.channelTimetokens,o=e.config;if(!n)return"Missing channel";if(r&&i)return"timetoken and channelTimetokens are incompatible together";if(r&&i&&1<i.length&&n.length!==i.length)return"Length of channelTimetokens and channels do not match";if(!o.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=t.channels,r=e.config,i=n.join(",");return"/v3/history/sub-key/".concat(r.subscribeKey,"/message-counts/").concat(o.default.encodeString(i))},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.timetoken,r=t.channelTimetokens,i={};if(r&&1===r.length){var o=function(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){if(!(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e)))return;var n=[],r=!0,i=!1,o=void 0;try{for(var s,a=e[Symbol.iterator]();!(r=(s=a.next()).done)&&(n.push(s.value),!t||n.length!==t);r=!0);}catch(e){i=!0,o=e}finally{try{r||null==a.return||a.return()}finally{if(i)throw o}}return n}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}(r,1)[0];i.timetoken=o}else r?i.channelsTimetoken=r.join(","):n&&(i.timetoken=n);return i},t.handleResponse=function(e,t){return{channels:t.channels}};var r=i(n(1)),o=i(n(2));function i(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNFetchMessagesOperation},t.validateParams=function(e,t){var n=t.channels,r=t.includeMessageActions,i=void 0!==r&&r,o=e.config;if(!n||0===n.length)return"Missing channels";if(!o.subscribeKey)return"Missing Subscribe Key";if(i&&1<n.length)throw new TypeError("History can return actions data for a single channel only. Either pass a single channel or disable the includeMessageActions flag.")},t.getURL=function(e,t){var n=t.channels,r=void 0===n?[]:n,i=t.includeMessageActions,o=void 0!==i&&i,s=e.config,a=o?"history-with-actions":"history",u=0<r.length?r.join(","):",";return"/v3/".concat(a,"/sub-key/").concat(s.subscribeKey,"/channel/").concat(c.default.encodeString(u))},t.getRequestTimeout=function(e){return e.config.getTransactionTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=t.start,r=t.end,i=t.count,o=t.stringifiedTimeToken,s=void 0!==o&&o,a=t.includeMeta,u=void 0!==a&&a,c={};i&&(c.max=i);n&&(c.start=n);r&&(c.end=r);s&&(c.string_message_token="true");u&&(c.include_meta="true");return c},t.handleResponse=function(r,e){var i={channels:{}};return Object.keys(e.channels||{}).forEach(function(n){i.channels[n]=[],(e.channels[n]||[]).forEach(function(e){var t={};t.channel=n,t.timetoken=e.timetoken,t.message=function(e,t){var n=e.config,r=e.crypto;if(!n.cipherKey)return t;try{return r.decrypt(t)}catch(e){return t}}(r,e.message),e.actions&&(t.actions=e.actions,t.data=e.actions),e.meta&&(t.meta=e.meta),i.channels[n].push(t)})}),i};n(0);var r=i(n(1)),c=i(n(2));function i(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getOperation=function(){return r.default.PNSubscribeOperation},t.validateParams=function(e){if(!e.config.subscribeKey)return"Missing Subscribe Key"},t.getURL=function(e,t){var n=e.config,r=t.channels,i=void 0===r?[]:r,o=0<i.length?i.join(","):",";return"/v2/subscribe/".concat(n.subscribeKey,"/").concat(s.default.encodeString(o),"/0")},t.getRequestTimeout=function(e){return e.config.getSubscribeTimeout()},t.isAuthSupported=function(){return!0},t.prepareParams=function(e,t){var n=e.config,r=t.state,i=t.channelGroups,o=void 0===i?[]:i,s=t.timetoken,a=t.filterExpression,u=t.region,c={heartbeat:n.getPresenceTimeout()};0<o.length&&(c["channel-group"]=o.join(","));a&&0<a.length&&(c["filter-expr"]=a);Object.keys(r).length&&(c.state=JSON.stringify(r));s&&(c.tt=s);u&&(c.tr=u);return c},t.handleResponse=function(e,t){var r=[];t.m.forEach(function(e){var t={publishTimetoken:e.p.t,region:e.p.r},n={shard:parseInt(e.a,10),subscriptionMatch:e.b,channel:e.c,messageType:e.e,payload:e.d,flags:e.f,issuingClientId:e.i,subscribeKey:e.k,originationTimetoken:e.o,userMetadata:e.u,publishMetaData:t};r.push(n)});var n={timetoken:t.t.t,region:t.t.r};return{messages:r,metadata:n}};n(0);var r=i(n(1)),s=i(n(2));function i(e){return e&&e.__esModule?e:{default:e}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;i(n(3));var r=i(n(4));n(0);function i(e){return e&&e.__esModule?e:{default:e}}function o(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function s(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var a,u,c,f=(a=l,(u=[{key:"init",value:function(e){this._config=e,this._maxSubDomain=20,this._currentSubDomain=Math.floor(Math.random()*this._maxSubDomain),this._providedFQDN=(this._config.secure?"https://":"http://")+this._config.origin,this._coreParams={},this.shiftStandardOrigin()}},{key:"nextOrigin",value:function(){return this._providedFQDN.match(/ps\.pndsn\.com$/i)?(this._currentSubDomain=this._currentSubDomain+1,this._currentSubDomain>=this._maxSubDomain&&(this._currentSubDomain=1),e=this._currentSubDomain.toString(),this._providedFQDN.replace("ps.pndsn.com","ps".concat(e,".pndsn.com"))):this._providedFQDN;var e}},{key:"hasModule",value:function(e){return e in this._modules}},{key:"shiftStandardOrigin",value:function(){return this._standardOrigin=this.nextOrigin(),this._standardOrigin}},{key:"getStandardOrigin",value:function(){return this._standardOrigin}},{key:"POST",value:function(e,t,n,r){return this._modules.post(e,t,n,r)}},{key:"PATCH",value:function(e,t,n,r){return this._modules.patch(e,t,n,r)}},{key:"GET",value:function(e,t,n){return this._modules.get(e,t,n)}},{key:"DELETE",value:function(e,t,n){return this._modules.del(e,t,n)}},{key:"_detectErrorCategory",value:function(e){if("ENOTFOUND"===e.code)return r.default.PNNetworkIssuesCategory;if("ECONNREFUSED"===e.code)return r.default.PNNetworkIssuesCategory;if("ECONNRESET"===e.code)return r.default.PNNetworkIssuesCategory;if("EAI_AGAIN"===e.code)return r.default.PNNetworkIssuesCategory;if(0===e.status||e.hasOwnProperty("status")&&void 0===e.status)return r.default.PNNetworkIssuesCategory;if(e.timeout)return r.default.PNTimeoutCategory;if("ETIMEDOUT"===e.code)return r.default.PNNetworkIssuesCategory;if(e.response){if(e.response.badRequest)return r.default.PNBadRequestCategory;if(e.response.forbidden)return r.default.PNAccessDeniedCategory}return r.default.PNUnknownCategory}}])&&o(a.prototype,u),void(c&&o(a,c)),l);function l(t){var n=this;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l),s(this,"_modules",void 0),s(this,"_config",void 0),s(this,"_maxSubDomain",void 0),s(this,"_currentSubDomain",void 0),s(this,"_standardOrigin",void 0),s(this,"_subscribeOrigin",void 0),s(this,"_providedFQDN",void 0),s(this,"_requestTimeout",void 0),s(this,"_coreParams",void 0),this._modules={},Object.keys(t).forEach(function(e){n._modules[e]=t[e].bind(n)})}t.default=f,e.exports=t.default},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r={get:function(e){try{return localStorage.getItem(e)}catch(e){return null}},set:function(e,t){try{return localStorage.setItem(e,t)}catch(e){return null}}};t.default=r,e.exports=t.default},function(f,l,h){"use strict";(function(i){Object.defineProperty(l,"__esModule",{value:!0}),l.default=void 0;var e,o=(e=h(74))&&e.__esModule?e:{default:e};function s(e){return(s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function t(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}var n,r,a,u=(n=c,(r=[{key:"decodeToken",value:function(e){var t="";e.length%4==3?t="=":e.length%4==2&&(t="==");var n=e.replace("-","+").replace("_","/")+t,r=o.default.decode(new i.from(n,"base64"));if("object"===s(r))return r}}])&&t(n.prototype,r),void(a&&t(n,a)),c);function c(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c)}l.default=u,f.exports=l.default}).call(this,h(9).Buffer)},function(e,t){var n;n=function(){return this}();try{n=n||new Function("return this")()}catch(e){"object"==typeof window&&(n=window)}e.exports=n},function(e,t,n){"use strict";t.byteLength=function(e){var t=l(e),n=t[0],r=t[1];return 3*(n+r)/4-r},t.toByteArray=function(e){var t,n,r=l(e),i=r[0],o=r[1],s=new f(function(e,t,n){return 3*(t+n)/4-n}(0,i,o)),a=0,u=0<o?i-4:i;for(n=0;n<u;n+=4)t=c[e.charCodeAt(n)]<<18|c[e.charCodeAt(n+1)]<<12|c[e.charCodeAt(n+2)]<<6|c[e.charCodeAt(n+3)],s[a++]=t>>16&255,s[a++]=t>>8&255,s[a++]=255&t;2===o&&(t=c[e.charCodeAt(n)]<<2|c[e.charCodeAt(n+1)]>>4,s[a++]=255&t);1===o&&(t=c[e.charCodeAt(n)]<<10|c[e.charCodeAt(n+1)]<<4|c[e.charCodeAt(n+2)]>>2,s[a++]=t>>8&255,s[a++]=255&t);return s},t.fromByteArray=function(e){for(var t,n=e.length,r=n%3,i=[],o=0,s=n-r;o<s;o+=16383)i.push(u(e,o,s<o+16383?s:o+16383));1==r?(t=e[n-1],i.push(a[t>>2]+a[t<<4&63]+"==")):2==r&&(t=(e[n-2]<<8)+e[n-1],i.push(a[t>>10]+a[t>>4&63]+a[t<<2&63]+"="));return i.join("")};for(var a=[],c=[],f="undefined"!=typeof Uint8Array?Uint8Array:Array,r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",i=0,o=r.length;i<o;++i)a[i]=r[i],c[r.charCodeAt(i)]=i;function l(e){var t=e.length;if(0<t%4)throw new Error("Invalid string. Length must be a multiple of 4");var n=e.indexOf("=");return-1===n&&(n=t),[n,n===t?0:4-n%4]}function u(e,t,n){for(var r,i,o=[],s=t;s<n;s+=3)r=(e[s]<<16&16711680)+(e[s+1]<<8&65280)+(255&e[s+2]),o.push(a[(i=r)>>18&63]+a[i>>12&63]+a[i>>6&63]+a[63&i]);return o.join("")}c["-".charCodeAt(0)]=62,c["_".charCodeAt(0)]=63},function(e,t){t.read=function(e,t,n,r,i){var o,s,a=8*i-r-1,u=(1<<a)-1,c=u>>1,f=-7,l=n?i-1:0,h=n?-1:1,p=e[t+l];for(l+=h,o=p&(1<<-f)-1,p>>=-f,f+=a;0<f;o=256*o+e[t+l],l+=h,f-=8);for(s=o&(1<<-f)-1,o>>=-f,f+=r;0<f;s=256*s+e[t+l],l+=h,f-=8);if(0===o)o=1-c;else{if(o===u)return s?NaN:1/0*(p?-1:1);s+=Math.pow(2,r),o-=c}return(p?-1:1)*s*Math.pow(2,o-r)},t.write=function(e,t,n,r,i,o){var s,a,u,c=8*o-i-1,f=(1<<c)-1,l=f>>1,h=23===i?Math.pow(2,-24)-Math.pow(2,-77):0,p=r?0:o-1,d=r?1:-1,g=t<0||0===t&&1/t<0?1:0;for(t=Math.abs(t),isNaN(t)||t===1/0?(a=isNaN(t)?1:0,s=f):(s=Math.floor(Math.log(t)/Math.LN2),t*(u=Math.pow(2,-s))<1&&(s--,u*=2),2<=(t+=1<=s+l?h/u:h*Math.pow(2,1-l))*u&&(s++,u/=2),f<=s+l?(a=0,s=f):1<=s+l?(a=(t*u-1)*Math.pow(2,i),s+=l):(a=t*Math.pow(2,l-1)*Math.pow(2,i),s=0));8<=i;e[n+p]=255&a,p+=d,a/=256,i-=8);for(s=s<<i|a,c+=i;0<c;e[n+p]=255&s,p+=d,s/=256,c-=8);e[n+p-d]|=128*g}},function(e,t){var n={}.toString;e.exports=Array.isArray||function(e){return"[object Array]"==n.call(e)}},function(r,i,e){(function(b){var e,t,n;t=[],void 0===(n="function"==typeof(e=function(){var e=function(){function o(e){this.$hex=e}o.prototype={length:function(){return this.$hex.length/2},toString:function(e){if(!e||"hex"===e||16===e)return this.$hex;if("utf-8"===e){for(var t="",n=0;n<this.$hex.length;n+=2)t+="%"+this.$hex.substring(n,n+2);return decodeURIComponent(t)}if("latin"!==e)throw new Error("Unrecognised format: "+e);for(var t=[],n=0;n<this.$hex.length;n+=2)t.push(parseInt(this.$hex.substring(n,n+2),16));return String.fromCharCode.apply(String,t)}},o.fromLatinString=function(e){for(var t="",n=0;n<e.length;n++){var r=e.charCodeAt(n).toString(16);1===r.length&&(r="0"+r),t+=r}return new o(t)},o.fromUtf8String=function(e){for(var t=encodeURIComponent(e),n="",r=0;r<t.length;r++)if("%"===t.charAt(r))n+=t.substring(r+1,r+3),r+=2;else{var i=t.charCodeAt(r).toString(16);i.length<2&&(i="0"+i),n+=i}return new o(n)};var s=[],f={},r=function(e){return function(){throw new Error(e+" not implemented")}};function e(){}function t(){}function l(e,t){var n=e.value;return n<24?n:24==n?t.readByte():25==n?t.readUint16():26==n?t.readUint32():27==n?t.readUint64():31==n?null:void r("Additional info: "+n)()}function a(e,t,n){var r=e<<5;t<24?n.writeByte(r|t):t<256?(n.writeByte(24|r),n.writeByte(t)):t<65536?(n.writeByte(25|r),n.writeUint16(t)):t<4294967296?(n.writeByte(26|r),n.writeUint32(t)):(n.writeByte(27|r),n.writeUint64(t))}e.prototype={peekByte:r("peekByte"),readByte:r("readByte"),readChunk:r("readChunk"),readFloat16:function(){var e=this.readUint16(),t=(32767&e)>>10,n=1023&e,r=32768&e;if(31==t)return 0==n?r?-1/0:1/0:NaN;var i=t?Math.pow(2,t-25)*(1024+n):Math.pow(2,-24)*n;return r?-i:i},readFloat32:function(){var e=this.readUint32(),t=(2147483647&e)>>23,n=8388607&e,r=2147483648&e;if(255==t)return 0==n?r?-1/0:1/0:NaN;var i=t?Math.pow(2,t-23-127)*(8388608+n):Math.pow(2,-149)*n;return r?-i:i},readFloat64:function(){var e=this.readUint32(),t=this.readUint32(),n=e>>20&2047,r=4294967296*(1048575&e)+t,i=2147483648&e;if(2047==n)return 0===r?i?-1/0:1/0:NaN;var o=n?Math.pow(2,n-52-1023)*(4503599627370496+r):Math.pow(2,-1074)*r;return i?-o:o},readUint16:function(){return 256*this.readByte()+this.readByte()},readUint32:function(){return 65536*this.readUint16()+this.readUint16()},readUint64:function(){return 4294967296*this.readUint32()+this.readUint32()}},t.prototype={writeByte:r("writeByte"),result:r("result"),writeFloat16:r("writeFloat16"),writeFloat32:r("writeFloat32"),writeFloat64:r("writeFloat64"),writeUint16:function(e){this.writeByte(e>>8&255),this.writeByte(255&e)},writeUint32:function(e){this.writeUint16(e>>16&65535),this.writeUint16(65535&e)},writeUint64:function(e){if(9007199254740992<=e||e<=-9007199254740992)throw new Error("Cannot encode Uint64 of: "+e+" magnitude to big (floating point errors)");this.writeUint32(Math.floor(e/4294967296)),this.writeUint32(e%4294967296)},writeString:r("writeString"),canWriteBinary:function(e){return!1},writeBinary:r("writeChunk")};var h=new Error;function p(e){var t=function(e){var t=e.readByte();return{type:t>>5,value:31&t}}(e);switch(t.type){case 0:return l(t,e);case 1:return-1-l(t,e);case 2:return e.readChunk(l(t,e));case 3:var n=e.readChunk(l(t,e));return n.toString("utf-8");case 4:case 5:var r=l(t,e),i=[];if(null!==r){5===t.type&&(r*=2);for(var o=0;o<r;o++)i[o]=p(e)}else for(var s;(s=p(e))!==h;)i.push(s);if(5!==t.type)return i;for(var a={},o=0;o<i.length;o+=2)a[i[o]]=i[o+1];return a;case 6:var u=l(t,e),c=f[u],i=p(e);return c?c(i):i;case 7:if(25===t.value)return e.readFloat16();if(26===t.value)return e.readFloat32();if(27===t.value)return e.readFloat64();switch(l(t,e)){case 20:return!1;case 21:return!0;case 22:return null;case 23:return;case null:return h;default:throw new Error("Unknown fixed value: "+t.value)}default:throw new Error("Unsupported header: "+JSON.stringify(t))}throw new Error("not implemented yet")}function u(e,t){for(var n=0;n<s.length;n++){var r=s[n].fn(e);if(void 0!==r)return a(6,s[n].tag,t),u(r,t)}if(e&&"function"==typeof e.toCBOR&&(e=e.toCBOR()),!1===e)a(7,20,t);else if(!0===e)a(7,21,t);else if(null===e)a(7,22,t);else if(void 0===e)a(7,23,t);else if("number"==typeof e)Math.floor(e)===e&&e<9007199254740992&&-9007199254740992<e?e<0?a(1,-1-e,t):a(0,e,t):(function(e,t,n){n.writeByte(e<<5|t)}(7,27,t),t.writeFloat64(e));else if("string"==typeof e)t.writeString(e,function(e){a(3,e,t)});else if(t.canWriteBinary(e))t.writeBinary(e,function(e){a(2,e,t)});else{if("object"!=typeof e)throw new Error("CBOR encoding not supported: "+e);if(g.config.useToJSON&&"function"==typeof e.toJSON&&(e=e.toJSON()),Array.isArray(e)){a(4,e.length,t);for(var n=0;n<e.length;n++)u(e[n],t)}else{var i=Object.keys(e);a(5,i.length,t);for(var n=0;n<i.length;n++)u(i[n],t),u(e[i[n]],t)}}}var c=[],d=[],g={config:{useToJSON:!0},addWriter:function(t,n){"string"==typeof t?d.push(function(e){if(t===e)return n(e)}):d.push(t)},addReader:function(n,r){"string"==typeof n?c.push(function(e,t){if(n===t)return r(e,t)}):c.push(n)},encode:function(e,t){for(var n=0;n<d.length;n++){var r=d[n],i=r(t);if(i)return u(e,i),i.result()}throw new Error("Unsupported output format: "+t)},decode:function(e,t){for(var n=0;n<c.length;n++){var r=c[n],i=r(e,t);if(i)return p(i)}throw new Error("Unsupported input format: "+t)},addSemanticEncode:function(e,t){if("number"!=typeof e||e%1!=0||e<0)throw new Error("Tag must be a positive integer");return s.push({tag:e,fn:t}),this},addSemanticDecode:function(e,t){if("number"!=typeof e||e%1!=0||e<0)throw new Error("Tag must be a positive integer");return f[e]=t,this},Reader:e,Writer:t};function i(e){this.buffer=e,this.pos=0}function n(e){this.byteLength=0,this.defaultBufferLength=16384,this.latestBuffer=b.alloc(this.defaultBufferLength),this.latestBufferOffset=0,this.completeBuffers=[],this.stringFormat=e}function y(e){this.hex=e,this.pos=0}function v(e){this.$hex="",this.finalFormat=e||"hex"}return(i.prototype=Object.create(e.prototype)).peekByte=function(){return this.buffer[this.pos]},i.prototype.readByte=function(){return this.buffer[this.pos++]},i.prototype.readUint16=function(){var e=this.buffer.readUInt16BE(this.pos);return this.pos+=2,e},i.prototype.readUint32=function(){var e=this.buffer.readUInt32BE(this.pos);return this.pos+=4,e},i.prototype.readFloat32=function(){var e=this.buffer.readFloatBE(this.pos);return this.pos+=4,e},i.prototype.readFloat64=function(){var e=this.buffer.readDoubleBE(this.pos);return this.pos+=8,e},i.prototype.readChunk=function(e){var t=b.alloc(e);return this.buffer.copy(t,0,this.pos,this.pos+=e),t},(n.prototype=Object.create(t.prototype)).writeByte=function(e){this.latestBuffer[this.latestBufferOffset++]=e,this.latestBufferOffset>=this.latestBuffer.length&&(this.completeBuffers.push(this.latestBuffer),this.latestBuffer=b.alloc(this.defaultBufferLength),this.latestBufferOffset=0),this.byteLength++},n.prototype.writeFloat32=function(e){var t=b.alloc(4);t.writeFloatBE(e,0),this.writeBuffer(t)},n.prototype.writeFloat64=function(e){var t=b.alloc(8);t.writeDoubleBE(e,0),this.writeBuffer(t)},n.prototype.writeString=function(e,t){var n=b.from(e,"utf-8");t(n.length),this.writeBuffer(n)},n.prototype.canWriteBinary=function(e){return e instanceof b},n.prototype.writeBinary=function(e,t){t(e.length),this.writeBuffer(e)},n.prototype.writeBuffer=function(e){if(!(e instanceof b))throw new TypeError("BufferWriter only accepts Buffers");this.latestBufferOffset?this.latestBuffer.length-this.latestBufferOffset>=e.length?(e.copy(this.latestBuffer,this.latestBufferOffset),this.latestBufferOffset+=e.length,this.latestBufferOffset>=this.latestBuffer.length&&(this.completeBuffers.push(this.latestBuffer),this.latestBuffer=b.alloc(this.defaultBufferLength),this.latestBufferOffset=0)):(this.completeBuffers.push(this.latestBuffer.slice(0,this.latestBufferOffset)),this.completeBuffers.push(e),this.latestBuffer=b.alloc(this.defaultBufferLength),this.latestBufferOffset=0):this.completeBuffers.push(e),this.byteLength+=e.length},n.prototype.result=function(){for(var e=b.alloc(this.byteLength),t=0,n=0;n<this.completeBuffers.length;n++){var r=this.completeBuffers[n];r.copy(e,t,0,r.length),t+=r.length}return this.latestBufferOffset&&this.latestBuffer.copy(e,t,0,this.latestBufferOffset),this.stringFormat?e.toString(this.stringFormat):e},"function"==typeof b&&(g.addReader(function(e,t){if(e instanceof b)return new i(e);if("hex"===t||"base64"===t){var n=b.from(e,t);return new i(n)}}),g.addWriter(function(e){return e&&"buffer"!==e?"hex"===e||"base64"===e?new n(e):void 0:new n})),(y.prototype=Object.create(e.prototype)).peekByte=function(){var e=this.hex.substring(this.pos,2);return parseInt(e,16)},y.prototype.readByte=function(){var e=this.hex.substring(this.pos,this.pos+2);return this.pos+=2,parseInt(e,16)},y.prototype.readChunk=function(e){var t=this.hex.substring(this.pos,this.pos+2*e);return this.pos+=2*e,"function"==typeof b?b.from(t,"hex"):new o(t)},(v.prototype=Object.create(t.prototype)).writeByte=function(e){if(e<0||255<e)throw new Error("Byte value out of range: "+e);var t=e.toString(16);1==t.length&&(t="0"+t),this.$hex+=t},v.prototype.canWriteBinary=function(e){return e instanceof o||"function"==typeof b&&e instanceof b},v.prototype.writeBinary=function(e,t){if(e instanceof o)t(e.length()),this.$hex+=e.$hex;else{if(!("function"==typeof b&&e instanceof b))throw new TypeError("HexWriter only accepts BinaryHex or Buffers");t(e.length),this.$hex+=e.toString("hex")}},v.prototype.result=function(){return"buffer"===this.finalFormat&&"function"==typeof b?b.from(this.$hex,"hex"):new o(this.$hex).toString(this.finalFormat)},v.prototype.writeString=function(e,t){var n=o.fromUtf8String(e);t(n.length()),this.$hex+=n.$hex},g.addReader(function(e,t){return e instanceof o||e.$hex?new y(e.$hex):"hex"===t?new y(e):void 0}),g.addWriter(function(e){if("hex"===e)return new v}),g}();return e.addSemanticEncode(0,function(e){if(e instanceof Date)return e.toISOString()}).addSemanticDecode(0,function(e){return new Date(e)}).addSemanticDecode(1,function(e){return new Date(e)}),e})?e.apply(i,t):e)||(r.exports=n)}).call(this,e(9).Buffer)},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.get=function(e,t,n){var r=o.default.get(this.getStandardOrigin()+t.url).set(t.headers).query(e);return s.call(this,r,t,n)},t.post=function(e,t,n,r){var i=o.default.post(this.getStandardOrigin()+n.url).query(e).set(n.headers).send(t);return s.call(this,i,n,r)},t.patch=function(e,t,n,r){var i=o.default.patch(this.getStandardOrigin()+n.url).query(e).set(n.headers).send(t);return s.call(this,i,n,r)},t.del=function(e,t,n){var r=o.default.delete(this.getStandardOrigin()+t.url).set(t.headers).query(e);return s.call(this,r,t,n)};var r,o=(r=n(76))&&r.__esModule?r:{default:r};n(0);function a(r){var i=(new Date).getTime(),e=(new Date).toISOString(),o=console&&console.log?console:window&&window.console&&window.console.log?window.console:console;o.log("<<<<<"),o.log("[".concat(e,"]"),"\n",r.url,"\n",r.qs),o.log("-----"),r.on("response",function(e){var t=(new Date).getTime()-i,n=(new Date).toISOString();o.log(">>>>>>"),o.log("[".concat(n," / ").concat(t,"]"),"\n",r.url,"\n",r.qs,"\n",e.text),o.log("-----")})}function s(e,i,o){var s=this;return this._config.logVerbosity&&(e=e.use(a)),this._config.proxy&&this._modules.proxy&&(e=this._modules.proxy.call(this,e)),this._config.keepAlive&&this._modules.keepAlive&&(e=this._modules.keepAlive(e)),e.timeout(i.timeout).end(function(t,n){var e,r={};if(r.error=null!==t,r.operation=i.operation,n&&n.status&&(r.statusCode=n.status),t){if(t.response&&t.response.text&&!s._config.logVerbosity)try{r.errorData=JSON.parse(t.response.text)}catch(e){r.errorData=t}else r.errorData=t;return r.category=s._detectErrorCategory(t),o(r,null)}try{e=JSON.parse(n.text)}catch(e){return r.errorData=n,r.error=!0,o(r,null)}return e.error&&1===e.error&&e.status&&e.message&&e.service?(r.errorData=e,r.statusCode=e.status,r.error=!0,r.category=s._detectErrorCategory(r),o(r,null)):(e.error&&e.error.message&&(r.errorData=e.error),o(r,e))})}},function(e,n,t){var r;r="undefined"!=typeof window?window:"undefined"!=typeof self?self:(console.warn("Using browser-only version of superagent in non-browser environment"),this);var i=t(77),o=t(78),s=t(10),a=t(79),u=t(81);function c(){}var f=n=e.exports=function(e,t){return"function"==typeof t?new n.Request("GET",e).end(t):1==arguments.length?new n.Request("GET",e):new n.Request(e,t)};n.Request=v,f.getXHR=function(){if(!(!r.XMLHttpRequest||r.location&&"file:"==r.location.protocol&&r.ActiveXObject))return new XMLHttpRequest;try{return new ActiveXObject("Microsoft.XMLHTTP")}catch(e){}try{return new ActiveXObject("Msxml2.XMLHTTP.6.0")}catch(e){}try{return new ActiveXObject("Msxml2.XMLHTTP.3.0")}catch(e){}try{return new ActiveXObject("Msxml2.XMLHTTP")}catch(e){}throw Error("Browser-only version of superagent could not find XHR")};var l="".trim?function(e){return e.trim()}:function(e){return e.replace(/(^\s*|\s*$)/g,"")};function h(e){if(!s(e))return e;var t=[];for(var n in e)p(t,n,e[n]);return t.join("&")}function p(t,n,e){if(null!=e)if(Array.isArray(e))e.forEach(function(e){p(t,n,e)});else if(s(e))for(var r in e)p(t,n+"["+r+"]",e[r]);else t.push(encodeURIComponent(n)+"="+encodeURIComponent(e));else null===e&&t.push(encodeURIComponent(n))}function d(e){for(var t,n,r={},i=e.split("&"),o=0,s=i.length;o<s;++o)-1==(n=(t=i[o]).indexOf("="))?r[decodeURIComponent(t)]="":r[decodeURIComponent(t.slice(0,n))]=decodeURIComponent(t.slice(n+1));return r}function g(e){return/[\/+]json($|[^-\w])/.test(e)}function y(e){this.req=e,this.xhr=this.req.xhr,this.text="HEAD"!=this.req.method&&(""===this.xhr.responseType||"text"===this.xhr.responseType)||void 0===this.xhr.responseType?this.xhr.responseText:null,this.statusText=this.req.xhr.statusText;var t=this.xhr.status;1223===t&&(t=204),this._setStatusProperties(t),this.header=this.headers=function(e){for(var t,n,r,i,o=e.split(/\r?\n/),s={},a=0,u=o.length;a<u;++a)-1!==(t=(n=o[a]).indexOf(":"))&&(r=n.slice(0,t).toLowerCase(),i=l(n.slice(t+1)),s[r]=i);return s}(this.xhr.getAllResponseHeaders()),this.header["content-type"]=this.xhr.getResponseHeader("content-type"),this._setHeaderProperties(this.header),null===this.text&&e._responseType?this.body=this.xhr.response:this.body="HEAD"!=this.req.method?this._parseBody(this.text?this.text:this.xhr.response):null}function v(e,t){var r=this;this._query=this._query||[],this.method=e,this.url=t,this.header={},this._header={},this.on("end",function(){var t,n=null,e=null;try{e=new y(r)}catch(e){return(n=new Error("Parser is unable to parse the response")).parse=!0,n.original=e,r.xhr?(n.rawResponse=void 0===r.xhr.responseType?r.xhr.responseText:r.xhr.response,n.status=r.xhr.status?r.xhr.status:null,n.statusCode=n.status):(n.rawResponse=null,n.status=null),r.callback(n)}r.emit("response",e);try{r._isResponseOK(e)||(t=new Error(e.statusText||"Unsuccessful HTTP response"))}catch(e){t=e}t?(t.original=n,t.response=e,t.status=e.status,r.callback(t,e)):r.callback(null,e)})}function b(e,t,n){var r=f("DELETE",e);return"function"==typeof t&&(n=t,t=null),t&&r.send(t),n&&r.end(n),r}f.serializeObject=h,f.parseString=d,f.types={html:"text/html",json:"application/json",xml:"text/xml",urlencoded:"application/x-www-form-urlencoded",form:"application/x-www-form-urlencoded","form-data":"application/x-www-form-urlencoded"},f.serialize={"application/x-www-form-urlencoded":h,"application/json":JSON.stringify},f.parse={"application/x-www-form-urlencoded":d,"application/json":JSON.parse},a(y.prototype),y.prototype._parseBody=function(e){var t=f.parse[this.type];return this.req._parser?this.req._parser(this,e):(!t&&g(this.type)&&(t=f.parse["application/json"]),t&&e&&(e.length||e instanceof Object)?t(e):null)},y.prototype.toError=function(){var e=this.req,t=e.method,n=e.url,r="cannot "+t+" "+n+" ("+this.status+")",i=new Error(r);return i.status=this.status,i.method=t,i.url=n,i},f.Response=y,i(v.prototype),o(v.prototype),v.prototype.type=function(e){return this.set("Content-Type",f.types[e]||e),this},v.prototype.accept=function(e){return this.set("Accept",f.types[e]||e),this},v.prototype.auth=function(e,t,n){1===arguments.length&&(t=""),"object"==typeof t&&null!==t&&(n=t,t=""),n=n||{type:"function"==typeof btoa?"basic":"auto"};return this._auth(e,t,n,function(e){if("function"==typeof btoa)return btoa(e);throw new Error("Cannot use basic auth, btoa is not a function")})},v.prototype.query=function(e){return"string"!=typeof e&&(e=h(e)),e&&this._query.push(e),this},v.prototype.attach=function(e,t,n){if(t){if(this._data)throw Error("superagent can't mix .send() and .attach()");this._getFormData().append(e,t,n||t.name)}return this},v.prototype._getFormData=function(){return this._formData||(this._formData=new r.FormData),this._formData},v.prototype.callback=function(e,t){if(this._shouldRetry(e,t))return this._retry();var n=this._callback;this.clearTimeout(),e&&(this._maxRetries&&(e.retries=this._retries-1),this.emit("error",e)),n(e,t)},v.prototype.crossDomainError=function(){var e=new Error("Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.");e.crossDomain=!0,e.status=this.status,e.method=this.method,e.url=this.url,this.callback(e)},v.prototype.buffer=v.prototype.ca=v.prototype.agent=function(){return console.warn("This is not supported in browser version of superagent"),this},v.prototype.pipe=v.prototype.write=function(){throw Error("Streaming is not supported in browser version of superagent")},v.prototype._isHost=function(e){return e&&"object"==typeof e&&!Array.isArray(e)&&"[object Object]"!==Object.prototype.toString.call(e)},v.prototype.end=function(e){return this._endCalled&&console.warn("Warning: .end() was called twice. This is not supported in superagent"),this._endCalled=!0,this._callback=e||c,this._finalizeQueryString(),this._end()},v.prototype._end=function(){var n=this,r=this.xhr=f.getXHR(),e=this._formData||this._data;this._setTimeouts(),r.onreadystatechange=function(){var e=r.readyState;if(2<=e&&n._responseTimeoutTimer&&clearTimeout(n._responseTimeoutTimer),4==e){var t;try{t=r.status}catch(e){t=0}if(!t){if(n.timedout||n._aborted)return;return n.crossDomainError()}n.emit("end")}};function t(e,t){0<t.total&&(t.percent=t.loaded/t.total*100),t.direction=e,n.emit("progress",t)}if(this.hasListeners("progress"))try{r.onprogress=t.bind(null,"download"),r.upload&&(r.upload.onprogress=t.bind(null,"upload"))}catch(e){}try{this.username&&this.password?r.open(this.method,this.url,!0,this.username,this.password):r.open(this.method,this.url,!0)}catch(e){return this.callback(e)}if(this._withCredentials&&(r.withCredentials=!0),!this._formData&&"GET"!=this.method&&"HEAD"!=this.method&&"string"!=typeof e&&!this._isHost(e)){var i=this._header["content-type"],o=this._serializer||f.serialize[i?i.split(";")[0]:""];!o&&g(i)&&(o=f.serialize["application/json"]),o&&(e=o(e))}for(var s in this.header)null!=this.header[s]&&this.header.hasOwnProperty(s)&&r.setRequestHeader(s,this.header[s]);return this._responseType&&(r.responseType=this._responseType),this.emit("request",this),r.send(void 0!==e?e:null),this},f.agent=function(){return new u},["GET","POST","OPTIONS","PATCH","PUT","DELETE"].forEach(function(r){u.prototype[r.toLowerCase()]=function(e,t){var n=new f.Request(r,e);return this._setDefaults(n),t&&n.end(t),n}}),u.prototype.del=u.prototype.delete,f.get=function(e,t,n){var r=f("GET",e);return"function"==typeof t&&(n=t,t=null),t&&r.query(t),n&&r.end(n),r},f.head=function(e,t,n){var r=f("HEAD",e);return"function"==typeof t&&(n=t,t=null),t&&r.query(t),n&&r.end(n),r},f.options=function(e,t,n){var r=f("OPTIONS",e);return"function"==typeof t&&(n=t,t=null),t&&r.send(t),n&&r.end(n),r},f.del=b,f.delete=b,f.patch=function(e,t,n){var r=f("PATCH",e);return"function"==typeof t&&(n=t,t=null),t&&r.send(t),n&&r.end(n),r},f.post=function(e,t,n){var r=f("POST",e);return"function"==typeof t&&(n=t,t=null),t&&r.send(t),n&&r.end(n),r},f.put=function(e,t,n){var r=f("PUT",e);return"function"==typeof t&&(n=t,t=null),t&&r.send(t),n&&r.end(n),r}},function(e,t,n){function r(e){if(e)return function(e){for(var t in r.prototype)e[t]=r.prototype[t];return e}(e)}(e.exports=r).prototype.on=r.prototype.addEventListener=function(e,t){return this._callbacks=this._callbacks||{},(this._callbacks["$"+e]=this._callbacks["$"+e]||[]).push(t),this},r.prototype.once=function(e,t){function n(){this.off(e,n),t.apply(this,arguments)}return n.fn=t,this.on(e,n),this},r.prototype.off=r.prototype.removeListener=r.prototype.removeAllListeners=r.prototype.removeEventListener=function(e,t){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var n,r=this._callbacks["$"+e];if(!r)return this;if(1==arguments.length)return delete this._callbacks["$"+e],this;for(var i=0;i<r.length;i++)if((n=r[i])===t||n.fn===t){r.splice(i,1);break}return 0===r.length&&delete this._callbacks["$"+e],this},r.prototype.emit=function(e){this._callbacks=this._callbacks||{};for(var t=new Array(arguments.length-1),n=this._callbacks["$"+e],r=1;r<arguments.length;r++)t[r-1]=arguments[r];if(n){r=0;for(var i=(n=n.slice(0)).length;r<i;++r)n[r].apply(this,t)}return this},r.prototype.listeners=function(e){return this._callbacks=this._callbacks||{},this._callbacks["$"+e]||[]},r.prototype.hasListeners=function(e){return!!this.listeners(e).length}},function(e,t,n){"use strict";var i=n(10);function r(e){if(e)return function(e){for(var t in r.prototype)e[t]=r.prototype[t];return e}(e)}(e.exports=r).prototype.clearTimeout=function(){return clearTimeout(this._timer),clearTimeout(this._responseTimeoutTimer),delete this._timer,delete this._responseTimeoutTimer,this},r.prototype.parse=function(e){return this._parser=e,this},r.prototype.responseType=function(e){return this._responseType=e,this},r.prototype.serialize=function(e){return this._serializer=e,this},r.prototype.timeout=function(e){if(!e||"object"!=typeof e)return this._timeout=e,this._responseTimeout=0,this;for(var t in e)switch(t){case"deadline":this._timeout=e.deadline;break;case"response":this._responseTimeout=e.response;break;default:console.warn("Unknown timeout option",t)}return this},r.prototype.retry=function(e,t){return 0!==arguments.length&&!0!==e||(e=1),e<=0&&(e=0),this._maxRetries=e,this._retries=0,this._retryCallback=t,this};var o=["ECONNRESET","ETIMEDOUT","EADDRINFO","ESOCKETTIMEDOUT"];r.prototype._shouldRetry=function(e,t){if(!this._maxRetries||this._retries++>=this._maxRetries)return!1;if(this._retryCallback)try{var n=this._retryCallback(e,t);if(!0===n)return!0;if(!1===n)return!1}catch(e){console.error(e)}if(t&&t.status&&500<=t.status&&501!=t.status)return!0;if(e){if(e.code&&~o.indexOf(e.code))return!0;if(e.timeout&&"ECONNABORTED"==e.code)return!0;if(e.crossDomain)return!0}return!1},r.prototype._retry=function(){return this.clearTimeout(),this.req&&(this.req=null,this.req=this.request()),this._aborted=!1,this.timedout=!1,this._end()},r.prototype.then=function(e,t){if(!this._fullfilledPromise){var i=this;this._endCalled&&console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises"),this._fullfilledPromise=new Promise(function(n,r){i.end(function(e,t){e?r(e):n(t)})})}return this._fullfilledPromise.then(e,t)},r.prototype.catch=function(e){return this.then(void 0,e)},r.prototype.use=function(e){return e(this),this},r.prototype.ok=function(e){if("function"!=typeof e)throw Error("Callback required");return this._okCallback=e,this},r.prototype._isResponseOK=function(e){return!!e&&(this._okCallback?this._okCallback(e):200<=e.status&&e.status<300)},r.prototype.getHeader=r.prototype.get=function(e){return this._header[e.toLowerCase()]},r.prototype.set=function(e,t){if(i(e)){for(var n in e)this.set(n,e[n]);return this}return this._header[e.toLowerCase()]=t,this.header[e]=t,this},r.prototype.unset=function(e){return delete this._header[e.toLowerCase()],delete this.header[e],this},r.prototype.field=function(e,t){if(null==e)throw new Error(".field(name, val) name can not be empty");if(this._data&&console.error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()"),i(e)){for(var n in e)this.field(n,e[n]);return this}if(Array.isArray(t)){for(var r in t)this.field(e,t[r]);return this}if(null==t)throw new Error(".field(name, val) val can not be empty");return"boolean"==typeof t&&(t=""+t),this._getFormData().append(e,t),this},r.prototype.abort=function(){return this._aborted||(this._aborted=!0,this.xhr&&this.xhr.abort(),this.req&&this.req.abort(),this.clearTimeout(),this.emit("abort")),this},r.prototype._auth=function(e,t,n,r){switch(n.type){case"basic":this.set("Authorization","Basic "+r(e+":"+t));break;case"auto":this.username=e,this.password=t;break;case"bearer":this.set("Authorization","Bearer "+e)}return this},r.prototype.withCredentials=function(e){return null==e&&(e=!0),this._withCredentials=e,this},r.prototype.redirects=function(e){return this._maxRedirects=e,this},r.prototype.maxResponseSize=function(e){if("number"!=typeof e)throw TypeError("Invalid argument");return this._maxResponseSize=e,this},r.prototype.toJSON=function(){return{method:this.method,url:this.url,data:this._data,headers:this._header}},r.prototype.send=function(e){var t=i(e),n=this._header["content-type"];if(this._formData&&console.error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()"),t&&!this._data)Array.isArray(e)?this._data=[]:this._isHost(e)||(this._data={});else if(e&&this._data&&this._isHost(this._data))throw Error("Can't merge these send calls");if(t&&i(this._data))for(var r in e)this._data[r]=e[r];else"string"==typeof e?(n||this.type("form"),n=this._header["content-type"],this._data="application/x-www-form-urlencoded"==n?this._data?this._data+"&"+e:e:(this._data||"")+e):this._data=e;return!t||this._isHost(e)||n||this.type("json"),this},r.prototype.sortQuery=function(e){return this._sort=void 0===e||e,this},r.prototype._finalizeQueryString=function(){var e=this._query.join("&");if(e&&(this.url+=(0<=this.url.indexOf("?")?"&":"?")+e),this._query.length=0,this._sort){var t=this.url.indexOf("?");if(0<=t){var n=this.url.substring(t+1).split("&");"function"==typeof this._sort?n.sort(this._sort):n.sort(),this.url=this.url.substring(0,t)+"?"+n.join("&")}}},r.prototype._appendQueryString=function(){console.trace("Unsupported")},r.prototype._timeoutError=function(e,t,n){if(!this._aborted){var r=new Error(e+t+"ms exceeded");r.timeout=t,r.code="ECONNABORTED",r.errno=n,this.timedout=!0,this.abort(),this.callback(r)}},r.prototype._setTimeouts=function(){var e=this;this._timeout&&!this._timer&&(this._timer=setTimeout(function(){e._timeoutError("Timeout of ",e._timeout,"ETIME")},this._timeout)),this._responseTimeout&&!this._responseTimeoutTimer&&(this._responseTimeoutTimer=setTimeout(function(){e._timeoutError("Response timeout of ",e._responseTimeout,"ETIMEDOUT")},this._responseTimeout))}},function(e,t,n){"use strict";var i=n(80);function r(e){if(e)return function(e){for(var t in r.prototype)e[t]=r.prototype[t];return e}(e)}(e.exports=r).prototype.get=function(e){return this.header[e.toLowerCase()]},r.prototype._setHeaderProperties=function(e){var t=e["content-type"]||"";this.type=i.type(t);var n=i.params(t);for(var r in n)this[r]=n[r];this.links={};try{e.link&&(this.links=i.parseLinks(e.link))}catch(e){}},r.prototype._setStatusProperties=function(e){var t=e/100|0;this.status=this.statusCode=e,this.statusType=t,this.info=1==t,this.ok=2==t,this.redirect=3==t,this.clientError=4==t,this.serverError=5==t,this.error=(4==t||5==t)&&this.toError(),this.created=201==e,this.accepted=202==e,this.noContent=204==e,this.badRequest=400==e,this.unauthorized=401==e,this.notAcceptable=406==e,this.forbidden=403==e,this.notFound=404==e,this.unprocessableEntity=422==e}},function(e,t,n){"use strict";t.type=function(e){return e.split(/ *; */).shift()},t.params=function(e){return e.split(/ *; */).reduce(function(e,t){var n=t.split(/ *= */),r=n.shift(),i=n.shift();return r&&i&&(e[r]=i),e},{})},t.parseLinks=function(e){return e.split(/ *, */).reduce(function(e,t){var n=t.split(/ *; */),r=n[0].slice(1,-1);return e[n[1].split(/ *= */)[1].slice(1,-1)]=r,e},{})},t.cleanHeader=function(e,t){return delete e["content-type"],delete e["content-length"],delete e["transfer-encoding"],delete e.host,t&&(delete e.authorization,delete e.cookie),e}},function(e,t){function n(){this._defaults=[]}["use","on","once","set","query","type","accept","auth","withCredentials","sortQuery","retry","ok","redirects","timeout","buffer","serialize","parse","ca","key","pfx","cert"].forEach(function(e){n.prototype[e]=function(){return this._defaults.push({fn:e,arguments:arguments}),this}}),n.prototype._setDefaults=function(t){this._defaults.forEach(function(e){t[e.fn].apply(t,e.arguments)})},e.exports=n}],i.c=r,i.d=function(e,t,n){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(t,e){if(1&e&&(t=i(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(i.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var r in t)i.d(n,r,function(e){return t[e]}.bind(null,r));return n},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="",i(i.s=11);function i(e){if(r[e])return r[e].exports;var t=r[e]={i:e,l:!1,exports:{}};return n[e].call(t.exports,t,t.exports,i),t.l=!0,t.exports}var n,r});
  })();
});

require.register("uuid/index.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "uuid");
  (function() {
    var v1 = require('./v1');
var v4 = require('./v4');

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;
  })();
});

require.register("uuid/lib/bytesToUuid.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "uuid");
  (function() {
    /**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
  return ([
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]]
  ]).join('');
}

module.exports = bytesToUuid;
  })();
});

require.register("uuid/lib/rng-browser.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "uuid");
  (function() {
    // Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto
// implementation. Also, find the complete implementation of crypto on IE11.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  module.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  module.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}
  })();
});

require.register("uuid/v1.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "uuid");
  (function() {
    var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

var _nodeId;
var _clockseq;

// Previous uuid creation time
var _lastMSecs = 0;
var _lastNSecs = 0;

// See https://github.com/uuidjs/uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189
  if (node == null || clockseq == null) {
    var seedBytes = rng();
    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [
        seedBytes[0] | 0x01,
        seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]
      ];
    }
    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  }

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;
  })();
});

require.register("uuid/v4.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "uuid");
  (function() {
    var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;
  })();
});
require.register("settings.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.subscribeKey = exports.publishKey = void 0;
var publishKey = "pub-c-e9385c4d-c32a-4141-890f-72d799313b56";
exports.publishKey = publishKey;
var subscribeKey = "sub-c-962c2828-83b0-11e9-bc52-62d0381cfb44";
exports.subscribeKey = subscribeKey;
});

;require.alias("mithril/mithril.js", "mithril");
require.alias("mithril-stream/stream.js", "mithril-stream");
require.alias("moment/moment.js", "moment");
require.alias("pubnub/dist/web/pubnub.min.js", "pubnub");
require.alias("uuid/lib/rng-browser.js", "uuid/lib/rng");
require.alias("uuid/lib/rng-browser.js", "uuid/lib/rng.js");require.register("___globals___", function(exports, require, module) {
  

// Auto-loaded modules from config.npm.globals.
window.m = require("mithril");
window.Stream = require("mithril-stream");


});})();require('___globals___');

"use strict";

/* jshint ignore:start */
(function () {
  var WebSocket = window.WebSocket || window.MozWebSocket;
  var br = window.brunch = window.brunch || {};
  var ar = br['auto-reload'] = br['auto-reload'] || {};
  if (!WebSocket || ar.disabled) return;
  if (window._ar) return;
  window._ar = true;

  var cacheBuster = function cacheBuster(url) {
    var date = Math.round(Date.now() / 1000).toString();
    url = url.replace(/(\&|\\?)cacheBuster=\d*/, '');
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'cacheBuster=' + date;
  };

  var browser = navigator.userAgent.toLowerCase();
  var forceRepaint = ar.forceRepaint || browser.indexOf('chrome') > -1;
  var reloaders = {
    page: function page() {
      window.location.reload(true);
    },
    stylesheet: function stylesheet() {
      [].slice.call(document.querySelectorAll('link[rel=stylesheet]')).filter(function (link) {
        var val = link.getAttribute('data-autoreload');
        return link.href && val != 'false';
      }).forEach(function (link) {
        link.href = cacheBuster(link.href);
      }); // Hack to force page repaint after 25ms.

      if (forceRepaint) setTimeout(function () {
        document.body.offsetHeight;
      }, 25);
    },
    javascript: function javascript() {
      var scripts = [].slice.call(document.querySelectorAll('script'));
      var textScripts = scripts.map(function (script) {
        return script.text;
      }).filter(function (text) {
        return text.length > 0;
      });
      var srcScripts = scripts.filter(function (script) {
        return script.src;
      });
      var loaded = 0;
      var all = srcScripts.length;

      var onLoad = function onLoad() {
        loaded = loaded + 1;

        if (loaded === all) {
          textScripts.forEach(function (script) {
            eval(script);
          });
        }
      };

      srcScripts.forEach(function (script) {
        var src = script.src;
        script.remove();
        var newScript = document.createElement('script');
        newScript.src = cacheBuster(src);
        newScript.async = true;
        newScript.onload = onLoad;
        document.head.appendChild(newScript);
      });
    }
  };
  var port = ar.port || 9485;
  var host = br.server || window.location.hostname || 'localhost';

  var connect = function connect() {
    var connection = new WebSocket('ws://' + host + ':' + port);

    connection.onmessage = function (event) {
      if (ar.disabled) return;
      var message = event.data;
      var reloader = reloaders[message] || reloaders.page;
      reloader();
    };

    connection.onerror = function () {
      if (connection.readyState) connection.close();
    };

    connection.onclose = function () {
      window.setTimeout(connect, 1000);
    };
  };

  connect();
})();
/* jshint ignore:end */
;
//# sourceMappingURL=vendor.js.map