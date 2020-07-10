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
      return rej(e.response.errors);
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
  return sessionStorage.getItem("token") ? {
    authorization: sessionStorage.getItem("token")
  } : "";
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
      return call(getUserToken())("GET")(mdl)(url)(null);
    };
  },
  deleteTask: function deleteTask(mdl) {
    return function (url) {
      return call(getUserToken())("DELETE")(mdl)(url)(null);
    };
  },
  postTask: function postTask(mdl) {
    return function (url) {
      return function (data) {
        return call(getUserToken())("POST")(mdl)(url)(data);
      };
    };
  },
  putTask: function putTask(mdl) {
    return function (url) {
      return function (data) {
        return call(getUserToken())("PUT")(mdl)(url)(data);
      };
    };
  }
};
var _default = Http;
exports["default"] = _default;
});

;require.register("Utils.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = void 0;

var log = function log(m) {
  return function (v) {
    console.log(m, v);
    return v;
  };
};

exports.log = log;
});

;require.register("components/articles.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Articles = void 0;

var _Http = _interopRequireDefault(require("Http"));

var _Utils = require("Utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var favoriteArticleUrl = function favoriteArticleUrl(slug) {
  return "articles/".concat(slug, "/favorite");
};

var favoriteArticleTask = function favoriteArticleTask(http) {
  return function (mdl) {
    return function (slug) {
      return http.postTask(mdl)(favoriteArticleUrl(slug))();
    };
  };
};

var unFavoriteArticleTask = function unFavoriteArticleTask(http) {
  return function (mdl) {
    return function (slug) {
      return http.deleteTask(mdl)(favoriteArticleUrl(slug));
    };
  };
};

var ArticlePreview = function ArticlePreview(_ref) {
  var _ref$attrs = _ref.attrs,
      mdl = _ref$attrs.mdl,
      article = _ref$attrs.article;
  var data = article;

  var toggleArticleLike = function toggleArticleLike(favorited, slug) {
    var onError = (0, _Utils.log)("toggleArticleLike err-art");

    var onSuccess = function onSuccess(_ref2) {
      var _ref2$article = _ref2.article,
          favorited = _ref2$article.favorited,
          favoritesCount = _ref2$article.favoritesCount;
      data.favorited = favorited;
      data.favoritesCount = favoritesCount;
    };

    var toggle = favorited ? unFavoriteArticleTask : favoriteArticleTask;
    toggle(_Http["default"])(mdl)(slug).fork(onError, onSuccess);
  };

  return {
    view: function view() {
      return m(".article-preview", [m(".article-meta", [m(m.route.Link, {
        href: "/profile/".concat(data.username),
        options: {
          replace: true
        }
      }, m("img", {
        src: data.image
      })), m(".info", [m(m.route.Link, {
        "class": "author",
        href: "/profile/".concat(data.username),
        options: {
          replace: true
        }
      }, data.username), m("span.date", data.createdAt)]), m("button.btn btn-outline-primary btn-sm pull-xs-right", {
        onclick: function onclick(e) {
          return toggleArticleLike(data.favorited, data.slug);
        },
        "class": data.favorited && "active"
      }, [m("i.ion-heart.p-5"), m("span", data.favoritesCount)])]), m(m.route.Link, {
        "class": "preview-link",
        href: "/article/".concat(data.slug)
      }, [m("h1", data.title), m("p", data.description), m("ul.tag-list", data.tagList.map(function (tag) {
        return m("li.tag-default tag-pill tag-outline", tag);
      })), m("span", "Read more...")])]);
    }
  };
};

var Articles = function Articles() {
  return {
    view: function view(_ref3) {
      var _ref3$attrs = _ref3.attrs,
          mdl = _ref3$attrs.mdl,
          data = _ref3$attrs.data;
      return data.articles.length ? data.articles.map(function (article) {
        return m(ArticlePreview, {
          mdl: mdl,
          data: data,
          article: article
        });
      }) : m("p", "No articles are here... yet.");
    }
  };
};

exports.Articles = Articles;
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

;require.register("components/comments.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Comments = void 0;

var _Http = _interopRequireDefault(require("Http"));

var _Utils = require("Utils");

var _ramda = require("ramda");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var getCommentsTask = function getCommentsTask(http) {
  return function (mdl) {
    return function (slug) {
      return http.getTask(mdl)("articles/".concat(slug, "/comments"));
    };
  };
};

var deleteCommentTask = function deleteCommentTask(http) {
  return function (mdl) {
    return function (slug) {
      return function (id) {
        return http.deleteTask(mdl)("articles/".concat(slug, "/comments/").concat(id));
      };
    };
  };
};

var trimBody = (0, _ramda.over)((0, _ramda.lensProp)("body"), _ramda.trim);

var submitTask = function submitTask(http) {
  return function (mdl) {
    return function (comment) {
      return http.postTask(mdl)("articles/".concat(mdl.slug, "/comments"))({
        comment: comment
      });
    };
  };
};

var CommentForm = function CommentForm(_ref) {
  var _ref$attrs = _ref.attrs,
      mdl = _ref$attrs.mdl,
      reload = _ref$attrs.reload;
  var comment = {
    body: ""
  };
  var onError = (0, _Utils.log)("Error with form ");

  var onSuccess = function onSuccess() {
    comment.body = "";
    reload();
  };

  var submit = function submit(comment) {
    return submitTask(_Http["default"])(mdl)(trimBody(comment)).fork(onError, onSuccess);
  };

  return {
    oninit: function oninit() {
      return comment.body = "";
    },
    view: function view(_ref2) {
      var mdl = _ref2.attrs.mdl;
      return m("form.card.comment-form", [m(".card-block", m("textarea.form-control", {
        rows: 3,
        placeholder: "Write a comment ...",
        onchange: function onchange(e) {
          return comment.body = e.target.value;
        },
        value: comment.body
      })), m(".card-footer", [m("img.comment-author-img", {
        src: mdl.user.image
      }), m("button.btn.btn-sm.btn-primary", {
        onclick: function onclick(e) {
          return submit(comment);
        }
      }, " Post Comment ")])]);
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
          id = _ref3$attrs$comment.id,
          deleteComment = _ref3$attrs.deleteComment;
      return m(".card", [m(".card-block", m("p.card-text", body)), m(".card-footer", [m(m.route.Link, {
        "class": "comment-author"
      }, m("img.comment-author-img", {
        src: image
      })), " ", m.trust("&nbsp;"), " ", m(m.route.Link, {
        "class": "comment-author"
      }, username), m("span.date-posted", createdAt), username == mdl.user.username && m("span.mod-options", [m("i.ion-trash-a", {
        onclick: function onclick(e) {
          return deleteComment(id);
        }
      })])])]);
    }
  };
};

var Comments = function Comments(_ref4) {
  var mdl = _ref4.attrs.mdl;
  var data = {
    comments: []
  };

  var loadComments = function loadComments(mdl) {
    var onSuccess = function onSuccess(_ref5) {
      var comments = _ref5.comments;
      return data.comments = comments;
    };

    var onError = (0, _Utils.log)("error with coomments");
    getCommentsTask(_Http["default"])(mdl)(mdl.slug).fork(onError, onSuccess);
  };

  var _deleteComment = function deleteComment(id) {
    var onSuccess = function onSuccess(_ref6) {
      var comments = _ref6.comments;
      return data.comments = comments;
    };

    var onError = (0, _Utils.log)("error with coomments");
    deleteCommentTask(_Http["default"])(mdl)(mdl.slug)(id).chain(function (x) {
      return getCommentsTask(_Http["default"])(mdl)(mdl.slug);
    }).fork(onError, onSuccess);
  };

  return {
    oninit: function oninit(_ref7) {
      var mdl = _ref7.attrs.mdl;
      return loadComments(mdl);
    },
    view: function view(_ref8) {
      var mdl = _ref8.attrs.mdl;
      return m(".row", m(".col-xs-12.col-md-8.offset-md-2", [m(CommentForm, {
        mdl: mdl,
        reload: function reload() {
          return loadComments(mdl);
        }
      }), data.comments.map(function (c) {
        return m(Comment, {
          mdl: mdl,
          comment: c,
          deleteComment: function deleteComment(id) {
            return _deleteComment(id);
          }
        });
      })]));
    }
  };
};

exports.Comments = Comments;
});

;require.register("components/feed-nav.js", function(exports, require, module) {
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
      return m(".feed-toggle", m("ul.nav nav-pills outline-active", [mdl.state.isLoggedIn() && m("li.nav-item", m("a.nav-link ".concat(data.tags.current == "feed" && "active"), {
        onclick: function onclick(e) {
          data.tags.current = "feed";
          fetchData(mdl);
        }
      }, "Your Feed")), m("li.nav-item", m("a.nav-link ".concat(data.tags.current == "" && "active"), {
        onclick: function onclick(e) {
          data.tags.current = "";
          fetchData(mdl);
        }
      }, "Global Feed")), data.tags.selected.map(function (tag) {
        return m("li.nav-item", m("a.nav-link ".concat(data.tags.current == tag && "active"), [m("span", {
          onclick: function onclick(e) {
            data.tags.current = tag;
            fetchData(mdl);
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

;require.register("components/follow-favorite.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FollowFavorite = void 0;

var _Http = _interopRequireDefault(require("Http"));

var _Utils = require("Utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var deleteArticleUrl = function deleteArticleUrl(slug) {
  return "articles/".concat(slug);
};

var favoriteArticleUrl = function favoriteArticleUrl(slug) {
  return "articles/".concat(slug, "/favorite");
};

var followAuthorUrl = function followAuthorUrl(author) {
  return "profiles/".concat(author, "/follow");
};

var deleteArticleTask = function deleteArticleTask(http) {
  return function (mdl) {
    return http.deleteTask(mdl)(favoriteArticleUrl(mdl.slug));
  };
};

var favoriteArticleTask = function favoriteArticleTask(http) {
  return function (mdl) {
    return http.postTask(mdl)(favoriteArticleUrl(mdl.slug))();
  };
};

var unFavoriteArticleTask = function unFavoriteArticleTask(http) {
  return function (mdl) {
    return http.deleteTask(mdl)(favoriteArticleUrl(mdl.slug));
  };
};

var followAuthorTask = function followAuthorTask(http) {
  return function (mdl) {
    return function (author) {
      return http.postTask(mdl)(followAuthorUrl(author))();
    };
  };
};

var unFollowAuthorTask = function unFollowAuthorTask(http) {
  return function (mdl) {
    return function (author) {
      return http.deleteTask(mdl)(followAuthorUrl(author));
    };
  };
};

var FollowFavorite = function FollowFavorite(_ref) {
  var _ref$attrs = _ref.attrs,
      mdl = _ref$attrs.mdl,
      data = _ref$attrs.data;

  var toggleArticleLike = function toggleArticleLike(_ref2) {
    var favorited = _ref2.favorited;
    var onError = (0, _Utils.log)("toggleArticleLike err-art");

    var onSuccess = function onSuccess(_ref3) {
      var _ref3$article = _ref3.article,
          favorited = _ref3$article.favorited,
          favoritesCount = _ref3$article.favoritesCount;
      data.favorited = favorited;
      data.favoritesCount = favoritesCount;
    };

    var toggle = favorited ? unFavoriteArticleTask : favoriteArticleTask;
    toggle(_Http["default"])(mdl).fork(onError, onSuccess);
  };

  var toggleAuthorFollow = function toggleAuthorFollow(_ref4) {
    var _ref4$author = _ref4.author,
        username = _ref4$author.username,
        following = _ref4$author.following;
    var onError = (0, _Utils.log)("toggleAuthorFollow, err-auth");

    var onSuccess = function onSuccess(_ref5) {
      var following = _ref5.profile.following;
      return data.author.following = following;
    };

    var toggle = following ? unFollowAuthorTask : followAuthorTask;
    toggle(_Http["default"])(mdl)(username).fork(onError, onSuccess);
  };

  var deleteArticle = function deleteArticle(slug) {
    var onError = (0, _Utils.log)("deleteArticle, err-auth");

    var onSuccess = function onSuccess(s) {
      console.log(s);
      m.route.set("/home");
    };

    deleteArticleTask(_Http["default"])(mdl).fork(onError, onSuccess);
  };

  return {
    view: function view(_ref6) {
      var _ref6$attrs = _ref6.attrs,
          mdl = _ref6$attrs.mdl,
          _ref6$attrs$data = _ref6$attrs.data,
          _ref6$attrs$data$auth = _ref6$attrs$data.author,
          username = _ref6$attrs$data$auth.username,
          image = _ref6$attrs$data$auth.image,
          following = _ref6$attrs$data$auth.following,
          favoritesCount = _ref6$attrs$data.favoritesCount,
          favorited = _ref6$attrs$data.favorited,
          createdAt = _ref6$attrs$data.createdAt,
          slug = _ref6$attrs$data.slug;
      return m(".article-meta", [m(m.route.Link, {
        href: "profile/".concat(username)
      }, m("img", {
        src: image
      })), m(".info", [m(m.route.Link, {
        "class": "author",
        href: "profile/".concat(username)
      }, username), m("span.date", createdAt)]), mdl.user.username == username ? [m(m.route.Link, {
        "class": "btn btn-sm btn-outline-secondary",
        href: "/editor/".concat(slug),
        selector: "button"
      }, [m("i.ion-edit.p-5"), "Edit Article"]), m("button.btn.btn-sm.btn-outline-danger.m-5", {
        onclick: function onclick(e) {
          return deleteArticle(slug);
        }
      }, [m("i.ion-trash-a.m-5"), "Delete Article "])] : [m("button.btn.btn-sm.btn-outline-secondary", {
        onclick: function onclick(e) {
          return toggleAuthorFollow(data);
        }
      }, [following ? [m("i.ion-minus-round"), " Unfollow ".concat(username, " ")] : [m("i.ion-plus-round"), " Follow ".concat(username, " ")]]), m("button.btn.btn-sm.btn-outline-primary.m-5", {
        onclick: function onclick(e) {
          return toggleArticleLike(data);
        }
      }, [m("i.ion-heart.m-5"), favorited ? " Unfavorite Article " : " Favorite Article ", m("span.counter", "( ".concat(favoritesCount, " )"))])]]);
    }
  };
};

exports.FollowFavorite = FollowFavorite;
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

var _loader = require("./loader");

Object.keys(_loader).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _loader[key];
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

var _articles = require("./articles");

Object.keys(_articles).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _articles[key];
    }
  });
});

var _followFavorite = require("./follow-favorite");

Object.keys(_followFavorite).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _followFavorite[key];
    }
  });
});

var _comments = require("./comments");

Object.keys(_comments).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _comments[key];
    }
  });
});

var _feedNav = require("./feed-nav");

Object.keys(_feedNav).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _feedNav[key];
    }
  });
});

var _sidebar = require("./sidebar");

Object.keys(_sidebar).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _sidebar[key];
    }
  });
});
});

;require.register("components/loader.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Loader = void 0;

var Loader = function Loader() {
  return {
    view: function view(_ref) {
      var children = _ref.children;
      return m(".container", m(".banner", m(".container", children)));
    }
  };
};

exports.Loader = Loader;
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
          state = _ref$attrs.state,
          fetchDataFor = _ref$attrs.fetchDataFor;
      var total = Math.ceil(state.total / state.limit) + 1;
      var current = state.offset / state.limit + 1;

      var range = _toConsumableArray(Array(total).keys()).slice(1);

      return state.total > state.limit && m("ul.pagination", range.map(function (page, idx) {
        return m("li.page-item ".concat(page == current && "active"), m(".page-link active", {
          onclick: function onclick(e) {
            return fetchDataFor(idx * state.limit);
          }
        }, page));
      }));
    }
  };
};

exports.Paginator = Paginator;
});

;require.register("components/sidebar.js", function(exports, require, module) {
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

;require.register("index.js", function(exports, require, module) {
"use strict";

var _routes = _interopRequireDefault(require("./routes.js"));

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

if (sessionStorage.getItem("user")) {
  _model["default"].user = JSON.parse(sessionStorage.getItem("user"));
}

m.route(root, "/home", (0, _routes["default"])(_model["default"]));
});

;require.register("initialize.js", function(exports, require, module) {
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  require("./index.js");
});
});

;require.register("layout/footer.js", function(exports, require, module) {
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

;require.register("layout/header.js", function(exports, require, module) {
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
      }, "conduit"), m("ul.nav navbar-nav pull-xs-right", mdl.state.isLoggedIn() ? [m("li.nav-item", m(m.route.Link, {
        "class": "nav-link",
        href: "/editor"
      }, [m("i.ion-compose.p-5"), "New Article"])), m("li.nav-item", m(m.route.Link, {
        "class": "nav-link",
        href: "/settings/".concat(mdl.user.username)
      }, [m("i.ion-gear-a.p-5"), "Settings"])), m("li.nav-item", m(m.route.Link, {
        "class": "nav-link",
        href: "/profile/".concat(mdl.user.username)
      }, mdl.user.username))] : [m("li.nav-item", m(m.route.Link, {
        "class": "nav-link",
        href: "/register"
      }, "Sign up")), m("li.nav-item", m(m.route.Link, {
        "class": "nav-link",
        href: "/login"
      }, "Login"))])));
    }
  };
};

var _default = Header;
exports["default"] = _default;
});

;require.register("layout/index.js", function(exports, require, module) {
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
    },
    isLoggedIn: function isLoggedIn() {
      return sessionStorage.getItem("token");
    }
  },
  settings: {},
  page: "",
  user: {}
};
var _default = model;
exports["default"] = _default;
});

;require.register("pages/article.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Http = _interopRequireDefault(require("Http"));

var _components = require("components");

var _marked = _interopRequireDefault(require("marked"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var getArticleTask = function getArticleTask(http) {
  return function (mdl) {
    return function (slug) {
      return http.getTask(mdl)("articles/".concat(slug));
    };
  };
};

var Article = function Article() {
  var data = {};
  var state = {
    status: "loading",
    error: null
  };

  var onSuccess = function onSuccess(_ref) {
    var article = _ref.article,
        comments = _ref.comments;
    data.article = article;
    data.comments = comments;
    state.status = "success";
  };

  var onError = function onError(error) {
    console.log("error", error);
    state.error = error;
    state.status = "error";
  };

  var loadData = function loadData(mdl) {
    state.status = "loading";
    getArticleTask(_Http["default"])(mdl)(mdl.slug).fork(onError, onSuccess);
  };

  return {
    oninit: function oninit(_ref2) {
      var mdl = _ref2.attrs.mdl;
      return loadData(mdl);
    },
    view: function view(_ref3) {
      var mdl = _ref3.attrs.mdl;
      return m(".article-page", [state.status == "loading" && m(_components.Banner, [m("h1.logo-font", "Loading ...")]), state.status == "error" && m(_components.Banner, [m("h1.logo-font", "Error Loading Data: ".concat(state.error))]), state.status == "success" && [m(".banner", m(".container", [m("h1", data.article.title), m(_components.FollowFavorite, {
        mdl: mdl,
        data: data.article
      })])), m(".container.page", [m(".row.article-content", m(".col-md-12.text-justify", m.trust((0, _marked["default"])(data.article.body)))), m("hr"), m(".article-actions", [m(_components.FollowFavorite, {
        mdl: mdl,
        data: data.article
      })]), m(_components.Comments, {
        mdl: mdl,
        comments: data.comments,
        reloadArticle: function reloadArticle() {
          return loadData(mdl);
        }
      })])]]);
    }
  };
};

var _default = Article;
exports["default"] = _default;
});

;require.register("pages/editor.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.submitArticleTask = exports.loadArticleTask = void 0;

var _Http = _interopRequireDefault(require("Http"));

var _ramda = require("ramda");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var loadArticleTask = function loadArticleTask(http) {
  return function (mdl) {
    return function (slug) {
      return http.getTask(mdl)("articles/".concat(slug));
    };
  };
};

exports.loadArticleTask = loadArticleTask;
var formatTags = (0, _ramda.over)((0, _ramda.lensProp)("tagList"), (0, _ramda.compose)(_ramda.uniq, (0, _ramda.split)(" "), _ramda.trim));

var submitArticleTask = function submitArticleTask(http) {
  return function (mdl) {
    return function (article) {
      return http.postTask(mdl)("articles")({
        article: formatTags(article)
      });
    };
  };
};

exports.submitArticleTask = submitArticleTask;

var Editor = function Editor(_ref) {
  var mdl = _ref.attrs.mdl;
  var data = {};
  var state = {};

  var initEditor = function initEditor(mdl) {
    var onSuccess = function onSuccess(_ref2) {
      var article = _ref2.article;
      data = article;
      console.log(data);
    };

    var onError = function onError(errors) {
      state.errors = errors;
    };

    if (mdl.slug) {
      loadArticleTask(_Http["default"])(mdl)(mdl.slug).fork(onError, onSuccess);
    }
  };

  var submitData = function submitData(data) {
    var onSuccess = function onSuccess(_ref3) {
      var slug = _ref3.article.slug;
      m.route.set("/article/".concat(slug));
    };

    var onError = function onError(errors) {
      state.errors = errors;
    };

    submitArticleTask(_Http["default"])(mdl)(data).fork(onError, onSuccess);
  };

  return {
    oninit: function oninit(_ref4) {
      var mdl = _ref4.attrs.mdl;
      return initEditor(mdl);
    },
    view: function view() {
      return m(".editor-page", m(".container.page", m(".row", m(".col-md-10.offset-md-1.col-xs-12", m("form", [m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "text",
        placeholder: "Article Title",
        onchange: function onchange(e) {
          return data.title = e.target.value;
        },
        value: data.title
      })), m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "text",
        placeholder: "What's this article about?",
        onchange: function onchange(e) {
          return data.description = e.target.value;
        },
        value: data.description
      })), m("fieldset.form-group", m("textarea.form-control.form-control-lg", {
        rows: 8,
        placeholder: "Write your article (in markdown)",
        onchange: function onchange(e) {
          return data.body = e.target.value;
        },
        value: data.body
      })), m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "text",
        placeholder: "Enter tags",
        onchange: function onchange(e) {
          return data.tagList = e.target.value;
        },
        value: data.tagList
      })), m("button.btn-lg.pull-xs-right.btn-primary", {
        onclick: function onclick(e) {
          return submitData(data);
        }
      }, " Publish Article ")])))));
    }
  };
};

var _default = Editor;
exports["default"] = _default;
});

;require.register("pages/home.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Http = _interopRequireDefault(require("Http"));

var _components = require("components");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
        return data.tags.current == "feed" ? http.getTask(mdl)("articles/feed?limit=20&offset=".concat(state.offset)) : http.getTask(mdl)("articles?limit=20&offset=".concat(state.offset, "&tag=").concat(data.tags.current));
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
    feedStatus: "loading",
    pageStatus: "loading",
    limit: 20,
    offset: 0,
    total: 0,
    error: null
  };

  var loadInitData = function loadInitData(mdl) {
    var onSuccess = function onSuccess(_ref) {
      var articles = _ref.articles,
          articlesCount = _ref.articlesCount,
          tags = _ref.tags;
      data.articles = articles;
      state.total = articlesCount;
      data.tags.tagList = tags;
      state.pageStatus = "success";
      state.feedStatus = "success";
    };

    var onError = function onError(error) {
      console.log("error", error);
      state.error = error;
      state.pageStatus = "error";
    };

    state.pageStatus = "loading";
    loadDataTask(_Http["default"])(mdl)(state)(data).fork(onError, onSuccess);
  };

  var loadArticles = function loadArticles(mdl) {
    var onSuccess = function onSuccess(_ref2) {
      var articles = _ref2.articles,
          articlesCount = _ref2.articlesCount;
      data.articles = articles;
      state.total = articlesCount;
      state.feedStatus = "success";
    };

    var onError = function onError(error) {
      console.log("error", error);
      state.error = error;
      state.feedStatus = "error";
    };

    state.feedStatus = "loading";
    getArticlesTask(_Http["default"])(mdl)(state)(data).fork(onError, onSuccess);
  };

  return {
    oninit: function oninit(_ref3) {
      var mdl = _ref3.attrs.mdl;
      return loadInitData(mdl);
    },
    view: function view(_ref4) {
      var mdl = _ref4.attrs.mdl;
      return m(".home-page", [!mdl.state.isLoggedIn() && m(_components.Banner, [m("h1.logo-font", "conduit"), m("p", "A place to share your knowledge.")]), state.pageStatus == "loading" && m(_components.Loader, [m("h1.logo-font", "Loading Data")]), state.pageStatus == "error" && m(_components.Banner, [m("h1.logo-font", "Error Loading Data: ".concat(state.error))]), state.pageStatus == "success" && m(".container page", m(".row", [m(".col-md-9", [m(_components.FeedNav, {
        fetchData: loadArticles,
        mdl: mdl,
        data: data
      }), state.feedStatus == "loading" && m("p", "Loading Articles ..."), state.feedStatus == "success" ? state.total ? [m(_components.Articles, {
        mdl: mdl,
        data: data
      }), m(_components.Paginator, {
        mdl: mdl,
        state: state,
        fetchDataFor: function fetchDataFor(offset) {
          state.offset = offset;
          loadArticles(mdl);
        }
      })] : m("p.pull-xs-left", "No articles are here... yet.") : ""]), m(".col-md-3", m(_components.SideBar, {
        mdl: mdl,
        data: data
      }))]))]);
    }
  };
};

var _default = Home;
exports["default"] = _default;
});

;require.register("pages/login.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.loginTask = void 0;

var _Http = _interopRequireDefault(require("Http"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var loginTask = function loginTask(http) {
  return function (mdl) {
    return function (user) {
      return http.postTask(mdl)("users/login")({
        user: user
      });
    };
  };
};

exports.loginTask = loginTask;

var Login = function Login() {
  var state = {
    errors: {}
  };
  var data = {
    email: "",
    password: ""
  };

  var onSubmit = function onSubmit(mdl) {
    var onSuccess = function onSuccess(_ref) {
      var user = _ref.user;
      sessionStorage.setItem("token", "Token ".concat(user.token));
      sessionStorage.setItem("user", JSON.stringify(user));
      mdl.user = user;
      m.route.set("/home");
    };

    var onError = function onError(errors) {
      state.errors = errors;
      console.log(state.errors);
    };

    loginTask(_Http["default"])(mdl)(data).fork(onError, onSuccess);
  };

  return {
    view: function view(_ref2) {
      var mdl = _ref2.attrs.mdl;
      return m("div.auth-page", m("div.container.page", m("div.row", m("div.col-md-6.offset-md-3.col-xs-12", [m("h1.text-xs-center", "Login"), m("p.text-xs-center", m(m.route.Link, {
        href: "/register"
      }, "Need an account?"), state.errors["email or password"] && m(".error-messages", m("span", "email or password  ".concat(state.errors["email or password"])))), m("form", [m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "text",
        placeholder: "email",
        onchange: function onchange(e) {
          return data.email = e.target.value;
        },
        value: data.email,
        onblur: function onblur(e) {
          return state.isSubmitted && validate;
        }
      }), state.errors.email && m(".error-messages", m("span", state.errors.email))), m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "password",
        placeholder: "password",
        onchange: function onchange(e) {
          return data.password = e.target.value;
        },
        value: data.password,
        onblur: function onblur(e) {
          return state.isSubmitted && validate;
        }
      })), m("button.btn.btn-lg.btn-primary.pull-xs-right", {
        type: "submit",
        onclick: function onclick(e) {
          return onSubmit(mdl);
        }
      }, "Login")])]))));
    }
  };
};

var _default = Login;
exports["default"] = _default;
});

;require.register("pages/profile.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.loadInitDataTask = exports.loadDataTask = void 0;

var _Http = _interopRequireDefault(require("Http"));

var _components = require("components");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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

var getAuthorArticlesTask = function getAuthorArticlesTask(http) {
  return function (mdl) {
    return function (state) {
      return function (username) {
        return http.getTask(mdl)("articles?limit=".concat(state.limit, "&offset=").concat(state.offset, "&author=").concat(username));
      };
    };
  };
};

var getAuthorFavoriteArticlesTask = function getAuthorFavoriteArticlesTask(http) {
  return function (mdl) {
    return function (state) {
      return function (username) {
        return http.getTask(mdl)("articles?limit=".concat(state.limit, "&offset=").concat(state.offset, "&favorited=").concat(username));
      };
    };
  };
};

var loadDataTask = function loadDataTask(http) {
  return function (mdl) {
    return function (state) {
      return state.showFaveArticles ? getAuthorFavoriteArticlesTask(http)(mdl)(state)(mdl.slug) : getAuthorArticlesTask(http)(mdl)(state)(mdl.slug);
    };
  };
};

exports.loadDataTask = loadDataTask;

var loadInitDataTask = function loadInitDataTask(http) {
  return function (mdl) {
    return function (state) {
      return Task.of(function (profile) {
        return function (authorArticles) {
          return _objectSpread({}, profile, {
            authorArticles: authorArticles
          });
        };
      }).ap(getProfileTask(http)(mdl)(mdl.slug)).ap(getAuthorArticlesTask(http)(mdl)(state)(mdl.slug));
    };
  };
};

exports.loadInitDataTask = loadInitDataTask;

var Profile = function Profile(_ref) {
  var mdl = _ref.attrs.mdl;
  var data = {
    authorArticles: {
      articles: [],
      articlesCount: 0
    },
    authorFavoriteArticles: {
      articles: [],
      articlesCount: 0
    }
  };
  var state = {
    pageStatus: "loading",
    feedStatus: "loading",
    showFaveArticles: false,
    limit: 5,
    offset: 0,
    total: 0,
    error: null
  };

  var loadData = function loadData(mdl) {
    var onSuccess = function onSuccess(result) {
      state.showFaveArticles ? data.authorFavoriteArticles = result : data.authorArticles = result;
      state.total = state.showFaveArticles ? data.authorFavoriteArticles.articlesCount : data.authorArticles.articlesCount;
      state.feedStatus = "success";
    };

    var onError = function onError(error) {
      console.log("error", error);
      state.error = error;
      state.feedStatus = "error";
    };

    state.feedStatus = "loading";
    loadDataTask(_Http["default"])(mdl)(state).fork(onError, onSuccess);
  };

  var loadInitData = function loadInitData(mdl) {
    var onSuccess = function onSuccess(_ref2) {
      var authorArticles = _ref2.authorArticles,
          profile = _ref2.profile;
      data.authorArticles = authorArticles;
      data.profile = profile;
      state.pageStatus = "success";
      state.feedStatus = "success";
      state.total = data.authorArticles.articlesCount;
    };

    var onError = function onError(error) {
      console.log("error", error);
      state.error = error;
      state.pageStatus = "error";
      m.route.set("/home");
    };

    state.pageStatus = "loading";
    loadInitDataTask(_Http["default"])(mdl)(state).fork(onError, onSuccess);
  };

  var selectFeed = function selectFeed(toShowFaveArticles) {
    state.showFaveArticles = toShowFaveArticles;
    state.offset = 0;
    loadData(mdl);
  };

  return {
    oninit: function oninit(_ref3) {
      var mdl = _ref3.attrs.mdl;
      return loadInitData(mdl);
    },
    view: function view(_ref4) {
      var mdl = _ref4.attrs.mdl;
      return m(".profile-page", state.pageStatus == "loading" && m(_components.Loader, [m("h1.logo-font", "Loading ...")]), state.pageStatus == "error" && m(_components.Banner, [m("h1.logo-font", "Error Loading Data: ".concat(state.error))]), state.pageStatus == "success" && [m(".user-info", m(".container", m(".row", m(".col-xs-12.col-md-10.offset-md-1", [m("img.user-img", {
        src: data.profile.image
      }), m("h4", data.profile.username), m("p", data.profile.bio), data.profile.username !== mdl.user.username ? m("button.btn.btn-sm.btn-outline-secondary.action-btn", [m("i.ion-plus-round"), " ", m.trust("&nbsp;"), "Follow ".concat(data.profile.username)]) : m("button.btn.btn-sm.btn-outline-secondary.action-btn", {
        onclick: function onclick(e) {
          return m.route.set("/settings/".concat(data.profile.username));
        }
      }, [m("i.ion-gear-a"), " ", m.trust("&nbsp;"), "Edit Profile Settings"])])))), m(".container", m(".row", m(".col-xs-12.col-md-10.offset-md-1", [m(".articles-toggle", m("ul.nav.nav-pills.outline-active", [m("li.nav-item", m("a.nav-link ".concat(!state.showFaveArticles && "active"), {
        onclick: function onclick(e) {
          return selectFeed(false);
        }
      }, "My Articles")), m("li.nav-item", m("a.nav-link ".concat(state.showFaveArticles && "active"), {
        onclick: function onclick(e) {
          return selectFeed(true);
        }
      }, "Favorited Articles"))])), state.feedStatus == "loading" && "Loading Articles...", state.feedStatus == "error" && m(_components.Banner, [m("h1.logo-font", "Error Loading Data: ".concat(state.error))]), state.feedStatus = "sucess" && [state.showFaveArticles ? m(_components.Articles, {
        mdl: mdl,
        data: data.authorFavoriteArticles
      }) : m(_components.Articles, {
        mdl: mdl,
        data: data.authorArticles
      }), m(_components.Paginator, {
        mdl: mdl,
        state: state,
        fetchDataFor: function fetchDataFor(offset) {
          state.offset = offset;
          loadData(mdl);
        }
      })]])))]);
    }
  };
};

var _default = Profile;
exports["default"] = _default;
});

;require.register("pages/register.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Http = _interopRequireDefault(require("Http"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var registerTask = function registerTask(http) {
  return function (mdl) {
    return function (user) {
      return http.postTask(mdl)("users")({
        user: user
      });
    };
  };
};

var errorViewModel = function errorViewModel(err) {
  return Object.keys(err).map(function (k) {
    return {
      key: k,
      values: err[k]
    };
  });
};

var Register = function Register() {
  var state = {
    errors: []
  };
  var data = {
    username: "",
    email: "",
    password: ""
  };

  var onSubmit = function onSubmit(mdl) {
    var onSuccess = function onSuccess(_ref) {
      var user = _ref.user;
      mdl.user = user;
      sessionStorage.setItem("token", "Token ".concat(user.token));
      m.route.set("/home");
      console.log("success", user);
    };

    var onError = function onError(errors) {
      state.errors = errorViewModel(errors);
      console.log(errors);
    };

    state.isSubmitted = true;
    registerTask(_Http["default"])(mdl)(data).fork(onError, onSuccess);
  };

  return {
    view: function view(_ref2) {
      var mdl = _ref2.attrs.mdl;
      return m(".auth-page", m(".container.page", m(".row", m(".col-md-6.offset-md-3.col-xs-12", [m("h1.text-xs-center", "Sign Up"), m("p.text-xs-center", m(m.route.Link, {
        href: "/login"
      }, "Have an account?")), state.errors && state.errors.map(function (e) {
        return m(".error-messages", m("ul", "".concat(e.key), e.values.map(function (error) {
          return m("li", error);
        })));
      }), m("form", [m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "text",
        placeholder: "Your Name",
        onchange: function onchange(e) {
          return data.username = e.target.value;
        },
        value: data.username
      })), m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "text",
        placeholder: "email",
        onchange: function onchange(e) {
          return data.email = e.target.value;
        },
        value: data.email
      })), m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "password",
        placeholder: "password",
        onchange: function onchange(e) {
          return data.password = e.target.value;
        },
        value: data.password
      })), m("button.btn.btn-lg.btn-primary.pull-xs-right", {
        type: "submit",
        onclick: function onclick(e) {
          return onSubmit(mdl);
        }
      }, "Sign Up")])]))));
    }
  };
};

var _default = Register;
exports["default"] = _default;
});

;require.register("pages/user.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Http = _interopRequireDefault(require("Http"));

var _Utils = require("Utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var logout = function logout() {
  sessionStorage.clear();
  m.route.set("/home");
};

var submitTask = function submitTask(http) {
  return function (mdl) {
    return function (data) {
      return http.putTask(mdl)("user")(data);
    };
  };
};

var User = function User(_ref) {
  var _ref$attrs$mdl$user = _ref.attrs.mdl.user,
      image = _ref$attrs$mdl$user.image,
      username = _ref$attrs$mdl$user.username,
      password = _ref$attrs$mdl$user.password,
      bio = _ref$attrs$mdl$user.bio,
      email = _ref$attrs$mdl$user.email;
  var data = {
    image: image,
    username: username,
    password: password,
    bio: bio,
    email: email
  };

  var submit = function submit(mdl, data) {
    var onSuccess = function onSuccess(_ref2) {
      var user = _ref2.user;
      sessionStorage.setItem("user", JSON.stringify(user));
      mdl.user = user;
      console.log(mdl.user);
      m.route.set("/home");
    };

    var onError = (0, _Utils.log)("error");
    submitTask(_Http["default"])(mdl)(data).fork(onError, onSuccess);
  };

  return {
    view: function view(_ref3) {
      var mdl = _ref3.attrs.mdl;
      return m(".settings-page", m(".container.page", m(".row", m(".col-md-6.offset-md-3.col-xs-12", [m("h1.text-xs-center", "Your Settings"), m("form", m("fieldset", [m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "text",
        placeholder: "URL of profile picture",
        onchange: function onchange(e) {
          return data.image = e.target.value;
        },
        value: data.image
      })), m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "text",
        placeholder: "Your Name",
        onchange: function onchange(e) {
          return data.username = e.target.value;
        },
        value: data.username
      })), m("fieldset.form-group", m("textarea.form-control.form-control-lg", {
        placeholder: "Short bio about you",
        onchange: function onchange(e) {
          return data.bio = e.target.value;
        },
        value: data.bio
      })), m("fieldset.form-group", m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "text",
        placeholder: "Email",
        onchange: function onchange(e) {
          return data.email = e.target.value;
        },
        value: data.email
      }))), m("fieldset.form-group", m("fieldset.form-group", m("input.form-control.form-control-lg", {
        type: "password",
        placeholder: "Password",
        onchange: function onchange(e) {
          return data.password = e.target.value;
        },
        value: data.password
      }))), m("button.btn.btn-lg.btn-primary.pull-xs-right", {
        onclick: function onclick(e) {
          return submit(mdl, data);
        }
      }, " Update Settings "), m("button.btn.btn-outline-danger.pull-xs-right", {
        onclick: function onclick(e) {
          return logout(mdl, data);
        }
      }, "Or click here to logout.")]))]))));
    }
  };
};

var _default = User;
exports["default"] = _default;
});

;require.register("routes.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _index = _interopRequireDefault(require("./layout/index"));

var _home = _interopRequireDefault(require("./pages/home"));

var _article = _interopRequireDefault(require("./pages/article"));

var _profile = _interopRequireDefault(require("./pages/profile"));

var _register = _interopRequireDefault(require("./pages/register"));

var _login = _interopRequireDefault(require("./pages/login"));

var _user = _interopRequireDefault(require("./pages/user"));

var _editor = _interopRequireDefault(require("./pages/editor"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var routes = function routes(mdl) {
  return {
    "/home": {
      onmatch: function onmatch(_ref) {
        var slug = _ref.slug;
        mdl.slug = slug;
      },
      render: function render() {
        return m(_index["default"], {
          mdl: mdl
        }, m(_home["default"], {
          mdl: mdl
        }));
      }
    },
    "/editor": {
      onmatch: function onmatch(_ref2) {
        var slug = _ref2.slug;
        mdl.slug = slug;
      },
      render: function render() {
        return m(_index["default"], {
          mdl: mdl
        }, m(_editor["default"], {
          mdl: mdl
        }));
      }
    },
    "/editor/:slug": {
      onmatch: function onmatch(_ref3) {
        var slug = _ref3.slug;
        mdl.slug = slug;
      },
      render: function render() {
        return m(_index["default"], {
          mdl: mdl
        }, m(_editor["default"], {
          mdl: mdl
        }));
      }
    },
    "/article/:slug": {
      onmatch: function onmatch(_ref4) {
        var slug = _ref4.slug;
        mdl.slug = slug;
      },
      render: function render() {
        return m(_index["default"], {
          mdl: mdl
        }, m(_article["default"], {
          mdl: mdl
        }));
      }
    },
    "/profile/:slug": {
      onmatch: function onmatch(_ref5) {
        var slug = _ref5.slug;
        mdl.slug = slug;
      },
      render: function render() {
        return m(_index["default"], {
          mdl: mdl
        }, m(_profile["default"], {
          mdl: mdl,
          key: mdl.slug
        }));
      }
    },
    "/settings/:slug": {
      onmatch: function onmatch(_ref6) {
        var slug = _ref6.slug;
        mdl.slug = slug;
      },
      render: function render() {
        return m(_index["default"], {
          mdl: mdl
        }, m(_user["default"], {
          mdl: mdl,
          key: mdl.slug
        }));
      }
    },
    "/login": {
      onmatch: function onmatch(_ref7) {
        var slug = _ref7.slug;
        mdl.slug = slug;
      },
      render: function render() {
        return m(_index["default"], {
          mdl: mdl
        }, m(_login["default"], {
          mdl: mdl
        }));
      }
    },
    "/register": {
      onmatch: function onmatch(_ref8) {
        var slug = _ref8.slug;
        mdl.slug = slug;
      },
      render: function render() {
        return m(_index["default"], {
          mdl: mdl
        }, m(_register["default"], {
          mdl: mdl
        }));
      }
    }
  };
};

var _default = routes;
exports["default"] = _default;
});

;require.alias("process/browser.js", "process");process = require('process');require.register("___globals___", function(exports, require, module) {
  

// Auto-loaded modules from config.npm.globals.
window.m = require("mithril");
window.Task = require("data.task");


});})();require('___globals___');


//# sourceMappingURL=app.js.map