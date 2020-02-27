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
var process;
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
require.register("Http.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.parseHttpSuccess = exports.parseHttpError = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var api = "https://conduit.productionready.io/api/";

var onProgress = function onProgress(mdl) {
  return function (e) {
    if (e.lengthComputable) {
      mdl.state.loadingProgress.max = e.total;
      mdl.state.loadingProgress.value = e.loaded;
      m.redraw();
    }
  };
};

function onLoad() {
  return false;
}

var onLoadStart = function onLoadStart(mdl) {
  return function (e) {
    mdl.state.isLoading = true;
    return false;
  };
};

var onLoadEnd = function onLoadEnd(mdl) {
  return function (e) {
    mdl.state.isLoading = false;
    mdl.state.loadingProgress.max = 0;
    mdl.state.loadingProgress.value = 0;
    return false;
  };
};

var xhrProgress = function xhrProgress(mdl) {
  return {
    config: function config(xhr) {
      xhr.onprogress = onProgress(mdl);
      xhr.onload = onLoad;
      xhr.onloadstart = onLoadStart(mdl);
      xhr.onloadend = onLoadEnd(mdl);
    }
  };
};

var parseHttpError = function parseHttpError(mdl) {
  return function (rej) {
    return function (e) {
      mdl.state.isLoading = false;
      return rej(e.response);
    };
  };
};

exports.parseHttpError = parseHttpError;

var parseHttpSuccess = function parseHttpSuccess(mdl) {
  return function (res) {
    return function (data) {
      mdl.state.isLoading = false;
      return res(data);
    };
  };
};

exports.parseHttpSuccess = parseHttpSuccess;

var getUserToken = function getUserToken() {
  return window.sessionStorage.getItem("user-token") ? window.sessionStorage.getItem("user-token") : "";
};

var call = function call(_headers) {
  return function (method) {
    return function (mdl) {
      return function (url) {
        return function (body) {
          mdl.state.isLoading = true;
          return new Task(function (rej, res) {
            return m.request(_objectSpread({
              method: method,
              url: api + url,
              headers: _objectSpread({
                "content-type": "application/json"
              }, _headers),
              body: body,
              withCredentials: false
            }, xhrProgress(mdl))).then(parseHttpSuccess(mdl)(res), parseHttpError(mdl)(rej));
          });
        };
      };
    };
  };
};

var Http = {
  getTask: function getTask(mdl) {
    return function (url) {
      return call({})("GET")(mdl)(url)(null);
    };
  }
};
var _default = Http;
exports["default"] = _default;
});

;require.register("app.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _layout = _interopRequireDefault(require("./layout.js"));

var _index = _interopRequireDefault(require("./pages/home/index"));

var _index2 = _interopRequireDefault(require("./pages/article/index"));

var _index3 = _interopRequireDefault(require("./pages/profile/index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var routes = function routes(mdl) {
  return {
    "/home": {
      onmatch: function onmatch() {},
      render: function render() {
        return m(_layout["default"], {
          mdl: mdl
        }, m(_index["default"], {
          mdl: mdl
        }));
      }
    },
    "/article/:slug": {
      onmatch: function onmatch(_ref) {
        var slug = _ref.slug;
        mdl.slug = slug;
      },
      render: function render() {
        return m(_layout["default"], {
          mdl: mdl
        }, m(_index2["default"], {
          mdl: mdl
        }));
      }
    },
    "/profile/:slug": {
      onmatch: function onmatch(_ref2) {
        var slug = _ref2.slug;
        mdl.slug = slug;
      },
      render: function render() {
        return m(_layout["default"], {
          mdl: mdl
        }, m(_index3["default"], {
          mdl: mdl
        }));
      }
    }
  };
};

var _default = routes;
exports["default"] = _default;
});

;require.register("components/banner.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Banner = void 0;

var Banner = function Banner() {
  return {
    view: function view(_ref) {
      var children = _ref.children;
      return m(".banner", m(".container", children));
    }
  };
};

exports.Banner = Banner;
});

;require.register("components/index.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _banner = require("./banner");

Object.keys(_banner).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _banner[key];
    }
  });
});

var _paginator = require("./paginator");

Object.keys(_paginator).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _paginator[key];
    }
  });
});
});

;require.register("components/paginator.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Paginator = void 0;

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var Paginator = function Paginator() {
  return {
    view: function view(_ref) {
      var _ref$attrs = _ref.attrs,
          mdl = _ref$attrs.mdl,
          state = _ref$attrs.state,
          fetchDataFor = _ref$attrs.fetchDataFor;
      var total = state.total / state.limit;
      var current = state.offset / state.limit;

      var range = _toConsumableArray(Array(total).keys()).slice(1);

      return m("ul.pagination", range.map(function (page) {
        return m("li.page-item ".concat(page == current && "active"), m(".page-link active", {
          onclick: function onclick(e) {
            return fetchDataFor(page);
          }
        }, page));
      }));
    }
  };
};

exports.Paginator = Paginator;
});

;require.register("footer.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var footer = function footer() {
  return {
    view: function view() {
      return m("footer", m("div", {
        "class": "container"
      }, [m("a", {
        "class": "logo-font",
        href: "/"
      }, "conduit"), m("span", {
        "class": "attribution"
      }, [" An interactive learning project from ", m("a", {
        href: "https://thinkster.io"
      }, "Thinkster"), ". Code ", m.trust("&amp;"), " design licensed under MIT. "])]));
    }
  };
};

var _default = footer;
exports["default"] = _default;
});

;require.register("header.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var Header = function Header() {
  return {
    view: function view(_ref) {
      var mdl = _ref.attrs.mdl;
      return m("nav.navbar navbar-light", m(".container", m("a.navbar-brand", {
        href: "#"
      }, "conduit"), m("ul.nav navbar-nav pull-xs-right", [m("li.nav-item", m("a.nav-link active", "Home")), m("li.nav-item", m("a.nav-link", "New Post ")), m("li.nav-item", m("a.nav-link", "Settings ")), m("li.nav-item", m("a.nav-link", "Sign up / Login"))])));
    }
  };
};

var _default = Header;
exports["default"] = _default;
});

;require.register("http.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.parseHttpSuccess = exports.parseHttpError = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var api = "https://conduit.productionready.io/api/";

var onProgress = function onProgress(mdl) {
  return function (e) {
    if (e.lengthComputable) {
      mdl.state.loadingProgress.max = e.total;
      mdl.state.loadingProgress.value = e.loaded;
      m.redraw();
    }
  };
};

function onLoad() {
  return false;
}

var onLoadStart = function onLoadStart(mdl) {
  return function (e) {
    mdl.state.isLoading = true;
    return false;
  };
};

var onLoadEnd = function onLoadEnd(mdl) {
  return function (e) {
    mdl.state.isLoading = false;
    mdl.state.loadingProgress.max = 0;
    mdl.state.loadingProgress.value = 0;
    return false;
  };
};

var xhrProgress = function xhrProgress(mdl) {
  return {
    config: function config(xhr) {
      xhr.onprogress = onProgress(mdl);
      xhr.onload = onLoad;
      xhr.onloadstart = onLoadStart(mdl);
      xhr.onloadend = onLoadEnd(mdl);
    }
  };
};

var parseHttpError = function parseHttpError(mdl) {
  return function (rej) {
    return function (e) {
      mdl.state.isLoading = false;
      return rej(e.response);
    };
  };
};

exports.parseHttpError = parseHttpError;

var parseHttpSuccess = function parseHttpSuccess(mdl) {
  return function (res) {
    return function (data) {
      mdl.state.isLoading = false;
      return res(data);
    };
  };
};

exports.parseHttpSuccess = parseHttpSuccess;

var getUserToken = function getUserToken() {
  return window.sessionStorage.getItem("user-token") ? window.sessionStorage.getItem("user-token") : "";
};

var call = function call(_headers) {
  return function (method) {
    return function (mdl) {
      return function (url) {
        return function (body) {
          mdl.state.isLoading = true;
          return new Task(function (rej, res) {
            return m.request(_objectSpread({
              method: method,
              url: api + url,
              headers: _objectSpread({
                "content-type": "application/json"
              }, _headers),
              body: body,
              withCredentials: false
            }, xhrProgress(mdl))).then(parseHttpSuccess(mdl)(res), parseHttpError(mdl)(rej));
          });
        };
      };
    };
  };
};

var Http = {
  getTask: function getTask(mdl) {
    return function (url) {
      return call({})("GET")(mdl)(url)(null);
    };
  }
};
var _default = Http;
exports["default"] = _default;
});

;require.register("index.js", function(exports, require, module) {
"use strict";

var _app = _interopRequireDefault(require("./app.js"));

var _model = _interopRequireDefault(require("./model.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var root = document.body;
var winW = window.innerWidth;

if (module.hot) {
  module.hot.accept();
}

if ('development' !== "production") {
  console.log("Looks like we are in development mode!");
} else {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js").then(function (registration) {
        console.log("⚙️ SW registered: ", registration);
      })["catch"](function (registrationError) {
        console.log("🧟 SW registration failed: ", registrationError);
      });
    });
  }
} // set display profiles


var getProfile = function getProfile(w) {
  if (w < 668) return "phone";
  if (w < 920) return "tablet";
  return "desktop";
};

var checkWidth = function checkWidth(winW) {
  var w = window.innerWidth;

  if (winW !== w) {
    winW = w;
    var lastProfile = _model["default"].settings.profile;
    _model["default"].settings.profile = getProfile(w);
    if (lastProfile != _model["default"].settings.profile) m.redraw();
  }

  return requestAnimationFrame(checkWidth);
};

_model["default"].settings.profile = getProfile(winW);
checkWidth(winW);
m.route(root, "/home", (0, _app["default"])(_model["default"]));
});

;require.register("initialize.js", function(exports, require, module) {
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  require("./index.js");
});
});

;require.register("layout.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _header = _interopRequireDefault(require("./header.js"));

var _footer = _interopRequireDefault(require("./footer.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Layout = function Layout() {
  return {
    view: function view(_ref) {
      var children = _ref.children,
          mdl = _ref.attrs.mdl;
      return m("", [m(_header["default"], {
        mdl: mdl
      }), children, m(_footer["default"], {
        mdl: mdl
      })]);
    }
  };
};

var _default = Layout;
exports["default"] = _default;
});

;require.register("model.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var model = {
  state: {
    isLoading: false,
    loadingProgress: {
      max: 0,
      value: 0
    }
  },
  settings: {},
  page: ""
};
var _default = model;
exports["default"] = _default;
});

;require.register("pages/article/index.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Http = _interopRequireDefault(require("Http"));

var _model = require("./model");

var _components = require("components");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var FollowComponent = function FollowComponent() {
  return {
    view: function view(_ref) {
      var _ref$attrs = _ref.attrs,
          mdl = _ref$attrs.mdl,
          _ref$attrs$data = _ref$attrs.data,
          username = _ref$attrs$data.username,
          image = _ref$attrs$data.image,
          createdAt = _ref$attrs$data.createdAt;
      return m("div.article-meta", [m(m.route.Link, {
        href: "profile/".concat(username)
      }, m("img", {
        src: image
      })), m("div.info", [m(m.route.Link, {
        "class": "author",
        href: "profile/".concat(username)
      }, username), m("span.date", createdAt)]), m("button.btn.btn-sm.btn-outline-secondary", [m("i.ion-plus-round"), " ", m.trust("&nbsp;"), " Follow ".concat(username, " "), m("span.counter", "(10)")]), " ", m.trust("&nbsp;"), m.trust("&nbsp;"), " ", m("button.btn.btn-sm.btn-outline-primary", [m("i.ion-heart"), " ", m.trust("&nbsp;"), " Favorite Post ", m("span.counter", "(29)")])]);
    }
  };
};

var CommentForm = function CommentForm() {
  return {
    view: function view(_ref2) {
      var mdl = _ref2.attrs.mdl;
      return m("form.card.comment-form", [m("div.card-block", m("textarea.form-control[placeholder='Write a comment...'][rows='3']")), m("div.card-footer", [m("img.comment-author-img[src='http://i.imgur.com/Qr71crq.jpg']"), m("button.btn.btn-sm.btn-primary", " Post Comment ")])]);
    }
  };
};

var Comment = function Comment() {
  return {
    view: function view(_ref3) {
      var _ref3$attrs = _ref3.attrs,
          mdl = _ref3$attrs.mdl,
          _ref3$attrs$comment = _ref3$attrs.comment,
          _ref3$attrs$comment$a = _ref3$attrs$comment.author,
          image = _ref3$attrs$comment$a.image,
          username = _ref3$attrs$comment$a.username,
          body = _ref3$attrs$comment.body,
          createdAt = _ref3$attrs$comment.createdAt,
          id = _ref3$attrs$comment.id;
      return m("div.card", [m("div.card-block", m("p.card-text", body)), m("div.card-footer", [m(m.route.Link, {
        "class": "comment-author"
      }, m("img.comment-author-img", {
        src: image
      })), " ", m.trust("&nbsp;"), " ", m(m.route.Link, {
        "class": "comment-author"
      }, username), m("span.date-posted", createdAt)])]);
    }
  };
};

var ArticleComments = function ArticleComments() {
  return {
    view: function view(_ref4) {
      var _ref4$attrs = _ref4.attrs,
          mdl = _ref4$attrs.mdl,
          comments = _ref4$attrs.comments;
      return [m(CommentForm, {
        mdl: mdl
      }), comments.map(function (c) {
        return m(Comment, {
          mdl: mdl,
          comment: c
        });
      })];
    }
  };
};

var Article = function Article() {
  var data = {};
  var state = {
    status: "loading",
    error: null
  };

  var onSuccess = function onSuccess(_ref5) {
    var article = _ref5.article,
        comments = _ref5.comments;
    data.article = article;
    data.comments = comments;
    console.log("data", data);
    state.status = "success";
  };

  var onError = function onError(error) {
    console.log("error", error);
    state.error = error;
    state.status = "error";
  };

  var loadData = function loadData(mdl) {
    state.status = "loading";
    (0, _model.loadDataTask)(_Http["default"])(mdl)(mdl.slug).fork(onError, onSuccess);
  };

  return {
    oninit: function oninit(_ref6) {
      var mdl = _ref6.attrs.mdl;
      return loadData(mdl);
    },
    view: function view(_ref7) {
      var mdl = _ref7.attrs.mdl;
      return m("div.article-page", [state.status == "loading" && m(_components.Banner, [m("h1.logo-font", "Loading ...")]), state.status == "error" && m(_components.Banner, [m("h1.logo-font", "Error Loading Data: ".concat(state.error))]), state.status == "success" && [m("div.banner", m("div.container", [m("h1", data.article.title), m(FollowComponent, {
        mdl: mdl,
        data: data.article.author
      })])), m("div.container.page", [m("div.row.article-content", m("div.col-md-12", data.article.body)), m("hr"), m("div.article-actions", m(FollowComponent, {
        mdl: mdl,
        data: data.article.author
      })), m("div.row", m("div.col-xs-12.col-md-8.offset-md-2", m(ArticleComments, {
        mdl: mdl,
        comments: data.comments
      })))])]]);
    }
  };
};

var _default = Article;
exports["default"] = _default;
});

;require.register("pages/article/model.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadDataTask = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var getCommentsTask = function getCommentsTask(http) {
  return function (mdl) {
    return function (slug) {
      return http.getTask(mdl)("articles/".concat(slug, "/comments"));
    };
  };
};

var getArticleTask = function getArticleTask(http) {
  return function (mdl) {
    return function (slug) {
      return http.getTask(mdl)("articles/".concat(slug));
    };
  };
};

var loadDataTask = function loadDataTask(http) {
  return function (mdl) {
    return function (slug) {
      return Task.of(function (article) {
        return function (comments) {
          return _objectSpread({}, article, {}, comments);
        };
      }).ap(getArticleTask(http)(mdl)(slug)).ap(getCommentsTask(http)(mdl)(slug));
    };
  };
};

exports.loadDataTask = loadDataTask;
});

;require.register("pages/home/article-preview.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ArticlePreview = void 0;

var ArticlePreview = function ArticlePreview() {
  return {
    view: function view(_ref) {
      var _ref$attrs$article = _ref.attrs.article,
          _ref$attrs$article$au = _ref$attrs$article.author,
          image = _ref$attrs$article$au.image,
          username = _ref$attrs$article$au.username,
          createdAt = _ref$attrs$article.createdAt,
          favoritesCount = _ref$attrs$article.favoritesCount,
          title = _ref$attrs$article.title,
          description = _ref$attrs$article.description,
          tagList = _ref$attrs$article.tagList,
          slug = _ref$attrs$article.slug;
      return m(".article-preview", [m(".article-meta", [m(m.route.Link, {
        href: "/profile/".concat(username)
      }, m("img", {
        src: image
      })), m(".info", [m(m.route.Link, {
        "class": "author",
        href: "/profile/".concat(username)
      }, username), m("span.date", createdAt)]), m("button.btn btn-outline-primary btn-sm pull-xs-right", [m("i.ion-heart"), m("span", favoritesCount)])]), m(m.route.Link, {
        "class": "preview-link",
        href: "/article/".concat(slug)
      }, [m("h1", title), m("p", description), m("ul.tag-list", tagList.map(function (tag) {
        return m("li.tag-default tag-pill tag-outline", tag);
      })), m("span", "Read more...")])]);
    }
  };
};

exports.ArticlePreview = ArticlePreview;
});

;require.register("pages/home/feednav.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FeedNav = void 0;

var _ramda = require("ramda");

var FeedNav = function FeedNav(_ref) {
  var fetchData = _ref.attrs.fetchData;
  return {
    view: function view(_ref2) {
      var _ref2$attrs = _ref2.attrs,
          mdl = _ref2$attrs.mdl,
          data = _ref2$attrs.data;
      return m(".feed-toggle", m("ul.nav nav-pills outline-active", [m("li.nav-item", m(".nav-link ".concat(data.tags.current == "" && "active"), {
        onclick: function onclick(e) {
          data.tags.current = "";
          fetchData(mdl.mdl);
        }
      }, "Global Feed")), data.tags.selected.map(function (tag) {
        return m("li.nav-item", m(".nav-link ".concat(data.tags.current == tag && "active"), [m("span", {
          onclick: function onclick(e) {
            data.tags.current = tag;
            fetchData(mdl.mdl);
          }
        }, tag), m("i.ion-close-circled", {
          onclick: function onclick(e) {
            return data.tags.selected = (0, _ramda.without)(tag, data.tags.selected);
          }
        })]));
      })]));
    }
  };
};

exports.FeedNav = FeedNav;
});

;require.register("pages/home/index.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Http = _interopRequireDefault(require("Http"));

var _model = require("./model");

var _components = require("components");

var _sidebar = require("./sidebar");

var _feednav = require("./feednav.js");

var _articlePreview = require("./article-preview");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Home = function Home() {
  var data = {
    tags: {
      tagList: [],
      selected: [],
      current: ""
    },
    articles: {}
  };
  var state = {
    status: "loading",
    limit: 20,
    offset: 0,
    total: 0,
    error: null
  };

  var onSuccess = function onSuccess(_ref) {
    var articles = _ref.articles,
        articlesCount = _ref.articlesCount,
        tags = _ref.tags;
    data.articles = articles;
    state.total = articlesCount;
    data.tags.tagList = tags;
    state.status = "success";
  };

  var onError = function onError(error) {
    console.log("error", error);
    state.error = error;
    state.status = "error";
  };

  var loadData = function loadData(mdl) {
    state.status = "loading";
    (0, _model.loadDataTask)(_Http["default"])(mdl)(state)(data).fork(onError, onSuccess);
  };

  return {
    oninit: function oninit(_ref2) {
      var mdl = _ref2.attrs.mdl;
      return loadData(mdl);
    },
    view: function view(_ref3) {
      var mdl = _ref3.attrs;
      return m(".home", [m(_components.Banner, [m("h1.logo-font", "conduit"), m("p", "A place to share your knowledge.")]), state.status == "loading" && m(_components.Banner, [m("h1.logo-font", "Loading ...")]), state.status == "error" && m(_components.Banner, [m("h1.logo-font", "Error Loading Data: ".concat(state.error))]), state.status == "success" && m(".container page", m(".row", [m(".col-md-9", [m(_feednav.FeedNav, {
        fetchData: loadData,
        mdl: mdl,
        data: data
      }), data.articles.map(function (article) {
        return m(_articlePreview.ArticlePreview, {
          mdl: mdl,
          data: data,
          article: article
        });
      }), m(_components.Paginator, {
        mdl: mdl,
        state: state,
        fetchDataFor: function fetchDataFor(offset) {
          state.offset = offset * state.limit;
          loadData(mdl.mdl);
        }
      })]), m(".col-md-3", m(_sidebar.SideBar, {
        mdl: mdl,
        data: data
      }))]))]);
    }
  };
};

var _default = Home;
exports["default"] = _default;
});

;require.register("pages/home/model.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadDataTask = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var getTagsTask = function getTagsTask(http) {
  return function (mdl) {
    return http.getTask(mdl)("tags");
  };
};

var getArticlesTask = function getArticlesTask(http) {
  return function (mdl) {
    return function (state) {
      return function (data) {
        return http.getTask(mdl)("articles?limit=20&offset=".concat(state.offset, "&tag=").concat(data.tags.current));
      };
    };
  };
};

var loadDataTask = function loadDataTask(http) {
  return function (mdl) {
    return function (state) {
      return function (data) {
        return Task.of(function (tags) {
          return function (articles) {
            return _objectSpread({}, tags, {}, articles);
          };
        }).ap(getTagsTask(http)(mdl)).ap(getArticlesTask(http)(mdl)(state)(data));
      };
    };
  };
};

exports.loadDataTask = loadDataTask;
});

;require.register("pages/home/sidebar.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SideBar = void 0;

var SideBar = function SideBar() {
  var selectTag = function selectTag(data, tag) {
    return function (e) {
      return data.tags.selected.push(tag);
    };
  };

  return {
    view: function view(_ref) {
      var _ref$attrs = _ref.attrs,
          mdl = _ref$attrs.mdl,
          data = _ref$attrs.data;
      return m(".sidebar", [m("p", "Popular Tags"), m(".tag-list", data.tags.tagList.map(function (tag) {
        return m(".tag-pill tag-default", {
          onclick: selectTag(data, tag)
        }, tag);
      }))]);
    }
  };
};

exports.SideBar = SideBar;
});

;require.register("pages/profile/index.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Http = _interopRequireDefault(require("Http"));

var _model = require("./model");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Profile = function Profile() {
  var data = {};
  var state = {
    status: "loading",
    limit: 20,
    offset: 0,
    total: 0,
    error: null
  };

  var onSuccess = function onSuccess(_ref) {
    var articles = _ref.articles,
        profile = _ref.profile;
    data.articles = articles;
    data.profile = profile;
    console.log("data", data);
    state.status = "success";
  };

  var onError = function onError(error) {
    console.log("error", error);
    state.error = error;
    state.status = "error";
  };

  var loadData = function loadData(mdl) {
    state.status = "loading";
    (0, _model.loadDataTask)(_Http["default"])(mdl)(state)(data).fork(onError, onSuccess);
  };

  return {
    oninit: function oninit(_ref2) {
      var mdl = _ref2.attrs.mdl;
      return loadData(mdl);
    },
    view: function view() {
      return m("div.profile-page", [m("div.user-info", m("div.container", m("div.row", m("div.col-xs-12.col-md-10.offset-md-1", [m("img.user-img[src='http://i.imgur.com/Qr71crq.jpg']"), m("h4", "Eric Simons"), m("p", " Cofounder @GoThinkster, lived in Aol's HQ for a few months, kinda looks like Peeta from the Hunger Games "), m("button.btn.btn-sm.btn-outline-secondary.action-btn", [m("i.ion-plus-round"), " ", m.trust("&nbsp;"), " Follow Eric Simons "])])))), m("div.container", m("div.row", m("div.col-xs-12.col-md-10.offset-md-1", [m("div.articles-toggle", m("ul.nav.nav-pills.outline-active", [m("li.nav-item", m("a.nav-link.active[href='']", "My Articles")), m("li.nav-item", m("a.nav-link[href='']", "Favorited Articles"))])), m("div.article-preview", [m("div.article-meta", [m("a[href='']", m("img[src='http://i.imgur.com/Qr71crq.jpg']")), m("div.info", [m("a.author[href='']", "Eric Simons"), m("span.date", "January 20th")]), m("button.btn.btn-outline-primary.btn-sm.pull-xs-right", [m("i.ion-heart"), " 29 "])]), m("a.preview-link[href='']", [m("h1", "How to build webapps that scale"), m("p", "This is the description for the post."), m("span", "Read more...")])]), m("div.article-preview", [m("div.article-meta", [m("a[href='']", m("img[src='http://i.imgur.com/N4VcUeJ.jpg']")), m("div.info", [m("a.author[href='']", "Albert Pai"), m("span.date", "January 20th")]), m("button.btn.btn-outline-primary.btn-sm.pull-xs-right", [m("i.ion-heart"), " 32 "])]), m("a.preview-link[href='']", [m("h1", "The song you won't ever stop singing. No matter how hard you try."), m("p", "This is the description for the post."), m("span", "Read more..."), m("ul.tag-list", [m("li.tag-default.tag-pill.tag-outline", "Music"), m("li.tag-default.tag-pill.tag-outline", "Song")])])])])))]);
    }
  };
};

var _default = Profile;
exports["default"] = _default;
});

;require.register("pages/profile/model.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadDataTask = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var getProfileTask = function getProfileTask(http) {
  return function (mdl) {
    return function (username) {
      return http.getTask(mdl)("profiles/".concat(username));
    };
  };
};

var getArticlesTask = function getArticlesTask(http) {
  return function (mdl) {
    return function (state) {
      return function (username) {
        return http.getTask(mdl)("articles?limit=20&offset=".concat(state.offset, "&author=").concat(username));
      };
    };
  };
};

var loadDataTask = function loadDataTask(http) {
  return function (mdl) {
    return function (state) {
      return function (data) {
        return Task.of(function (profile) {
          return function (articles) {
            return _objectSpread({}, profile, {}, articles);
          };
        }).ap(getProfileTask(http)(mdl)(mdl.slug)).ap(getArticlesTask(http)(mdl)(state)(mdl.slug));
      };
    };
  };
};

exports.loadDataTask = loadDataTask;
});

;require.alias("process/browser.js", "process");process = require('process');require.register("___globals___", function(exports, require, module) {
  

// Auto-loaded modules from config.npm.globals.
window.m = require("mithril");
window.Task = require("data.task");


});})();require('___globals___');


//# sourceMappingURL=app.js.map