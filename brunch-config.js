// See http://brunch.io for documentation.
exports.files = {
  javascripts: {
    joinTo: {
      "vendor.js": /^(?!app)/, // Files that are not in `app` dir.
      "app.js": /^app/
    }
  },
  stylesheets: {
    joinTo: {
      "app.css": [
        (path) => path.includes(".scss"),
        (path) => path.includes(".css")
      ]
    }
  }
}

exports.plugins = {
  babel: { presets: ["@babel/env"] }
}

exports.paths = {
  public: "docs"
}

exports.npm = {
  globals: { m: "mithril", Stream: "mithril-stream" }
}
