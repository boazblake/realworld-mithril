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
require.register("app.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.routes = void 0;

var _mithril = _interopRequireDefault(require("mithril"));

var _mithrilStream = _interopRequireDefault(require("mithril-stream"));

var _moment = _interopRequireDefault(require("moment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var NewMsg = {
  view: function view(_ref) {
    var _ref$attrs = _ref.attrs,
        msg = _ref$attrs.msg,
        model = _ref$attrs.model;
    return (0, _mithril["default"])(".new-msg ".concat(model.user.id() == msg.id ? "mine" : "friend"), {
      onclick: function onclick() {
        return model.current = msg;
      }
    }, [(0, _mithril["default"])(".msg-top", [(0, _mithril["default"])(".from", msg.from), (0, _mithril["default"])(".time", (0, _moment["default"])(msg.time).fromNow())]), (0, _mithril["default"])(".msg-bottom", (0, _mithril["default"])("code.content", msg.msg))]);
  }
};
var Hamburger = {
  view: function view(_ref2) {
    var model = _ref2.attrs.model;
    return (0, _mithril["default"])("button.hamburger.btn", {
      onclick: function onclick() {
        return model.toggleNav(!model.toggleNav());
      }
    }, model.toggleNav() ? "X" : _mithril["default"].trust("&#9776"));
  }
};
var Nav = {
  view: function view(_ref3) {
    var model = _ref3.attrs.model;
    return (0, _mithril["default"])(".nav", {}, [(0, _mithril["default"])("code.code", "Proof of concept app for chat built in mithril and using pubnub"), (0, _mithril["default"])("button.btn", {
      onclick: function onclick() {
        model.user.name("");

        _mithril["default"].route.set("/login");
      }
    }, "logout")]);
  }
};
var Header = {
  open: false,
  view: function view(_ref4) {
    var model = _ref4.attrs.model;
    return (0, _mithril["default"])(".header", {}, [(0, _mithril["default"])(Hamburger, {
      model: model
    })]);
  }
};
var Body = {
  view: function view(_ref5) {
    var model = _ref5.attrs.model;
    return (0, _mithril["default"])(".body", model.msgs.map(function (msg, idx) {
      return (0, _mithril["default"])(NewMsg, {
        key: idx,
        msg: msg,
        model: model
      });
    }));
  }
};
var Footer = {
  newMsg: (0, _mithrilStream["default"])(""),
  view: function view(_ref6) {
    var state = _ref6.state,
        model = _ref6.attrs.model;
    return (0, _mithril["default"])("form.footer", {}, [(0, _mithril["default"])("textarea.input", {
      onkeyup: function onkeyup(e) {
        return state.newMsg(e.target.value);
      },
      value: state.newMsg(),
      placeholder: "Add message here"
    }), (0, _mithril["default"])("button.btn", {
      onclick: function onclick(e) {
        var ctx = {
          id: model.user.id(),
          from: model.user.name(),
          msg: state.newMsg(),
          time: (0, _moment["default"])()
        };
        model.chat.publish({
          channel: "mithril-chat",
          message: JSON.stringify(ctx)
        });
        state.newMsg("");
      },
      disabled: state.newMsg().length < 2
    }, "send")]);
  }
};
var Layout = {
  view: function view(_ref7) {
    var children = _ref7.children,
        model = _ref7.attrs.model;
    return [(0, _mithril["default"])(Header, {
      model: model
    }), model.toggleNav() && (0, _mithril["default"])(Nav, {
      model: model
    }), children];
  }
};
var Chat = {
  view: function view(_ref8) {
    var model = _ref8.attrs.model;
    return (0, _mithril["default"])(".chat", (0, _mithril["default"])(Body, {
      model: model
    }), (0, _mithril["default"])(Footer, {
      model: model
    }));
  }
};
var Login = {
  view: function view(_ref9) {
    var model = _ref9.attrs.model;
    return (0, _mithril["default"])("form.login", {
      onsubmit: function onsubmit(e) {
        e.preventDefault();
      }
    }, [(0, _mithril["default"])("h1.h1", "Enter a username to start chatting"), (0, _mithril["default"])("input.input", {
      onkeyup: function onkeyup(e) {
        return model.user.name(e.target.value);
      },
      placeholder: "minimum 2 letters"
    }), (0, _mithril["default"])("button.btn", {
      onclick: function onclick() {
        _mithril["default"].route.set("/chat");
      },
      disabled: model.user.name().length < 3
    }, "login")]);
  }
};

var routes = function routes(model) {
  return {
    "/login": {
      render: function render() {
        return (0, _mithril["default"])(Login, {
          model: model
        });
      }
    },
    "/chat": {
      onmatch: function onmatch() {
        return model.user.name() ? (0, _mithril["default"])(Layout, {
          model: model
        }, (0, _mithril["default"])(Chat, {
          model: model
        })) : _mithril["default"].route.set("/login");
      },
      render: function render() {
        return (0, _mithril["default"])(Layout, {
          model: model
        }, (0, _mithril["default"])(Chat, {
          model: model
        }));
      }
    }
  };
};

exports.routes = routes;
});

;require.register("index.js", function(exports, require, module) {
"use strict";

var _mithril = _interopRequireDefault(require("mithril"));

var _mithrilStream = _interopRequireDefault(require("mithril-stream"));

var _app = require("./app.js");

var _pubnub = _interopRequireDefault(require("pubnub"));

var _settings = require("../settings.js");

var _uuid = require("uuid");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var root = document.body;
var pubnub = new _pubnub["default"]({
  publishKey: _settings.publishKey,
  subscribeKey: _settings.subscribeKey
});
pubnub.subscribe({
  channels: ["mithril-chat"]
});
var model = {
  toggleNav: (0, _mithrilStream["default"])(false),
  chat: pubnub,
  user: {
    name: (0, _mithrilStream["default"])(""),
    id: (0, _mithrilStream["default"])((0, _uuid.v1)())
  },
  msgs: []
};
model.chat.addListener({
  message: function message(_ref) {
    var _message = _ref.message;
    model.msgs.push(JSON.parse(_message));

    _mithril["default"].redraw();
  }
});

_mithril["default"].route(root, "/login", (0, _app.routes)(model));
});

;require.register("initialize.js", function(exports, require, module) {
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  require("./index.js");
});
});

;require.register("___globals___", function(exports, require, module) {
  

// Auto-loaded modules from config.npm.globals.
window.m = require("mithril");
window.Stream = require("mithril-stream");


});})();require('___globals___');


//# sourceMappingURL=app.js.map