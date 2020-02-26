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
  sass: {
    mode: "native",
    sourceMapEmbed: true,
    includePaths: ["node_modules/spectre.css/src/**/*.scss"]
  },
  imagemin: {
    plugins: {
      "imagemin-gifsicle": true,
      "imagemin-jpegtran": true,
      "imagemin-optipng": true,
      "imagemin-svgo": true
    },
    pattern: /\.(gif|jpg|jpeg|jpe|jif|jfif|jfi|png|svg|svgz)$/
  },
  copycat: {
    // fonts: [
    //   "bower_components/material-design-iconic-font",
    //   "bower_components/font-awesome/fonts"
    // ],
    images: ["app/assets/images"],
    verbose: true, //shows each file that is copied to the destination directory
    onlyChanged: true //only copy a file if it's modified time has changed (only effective when using brunch watch)
  },
  swPrecache: {
    swFileName: "service-worker.js",
    options: {
      autorequire: ["app/assets/index.html"],
      staticFileGlobs: [
        "docs/app.css",
        "docs/app.js",
        "docs/vendor.js",
        "docs/index.html"
      ],
      stripPrefix: "docs/"
    }
  },
  "@babel": { presets: ["env"] }
}

exports.paths = {
  public: "docs"
}

exports.npm = {
  globals: { m: "mithril", Stream: "mithril-stream" },
  styles: {
    "spectre.css": [
      "dist/spectre.css",
      "dist/spectre-exp.css",
      "dist/spectre-icons.css"
    ]
  }
}
