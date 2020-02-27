import Layout from "./layout.js"
import Home from "./pages/home/index"
import Article from "./pages/article/index"
import Profile from "./pages/profile/index"

const routes = (mdl) => {
  return {
    "/home": {
      onmatch: () => {},
      render: () => m(Layout, { mdl }, m(Home, { mdl })),
    },

    "/article/:slug": {
      onmatch: ({ slug }) => {
        mdl.slug = slug
      },
      render: () => m(Layout, { mdl }, m(Article, { mdl })),
    },

    "/profile/:slug": {
      onmatch: ({ slug }) => {
        mdl.slug = slug
      },
      render: () => m(Layout, { mdl }, m(Profile, { mdl })),
    },
  }
}

export default routes
