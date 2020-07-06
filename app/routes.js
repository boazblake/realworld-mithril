import Layout from "./layout/index.js"
import Home from "./pages/home/index"
import Article from "./pages/article/index"
import Profile from "./pages/profile/index"
import Register from "./pages/auth/register"
import Login from "./pages/auth/login"

const routes = (mdl) => {
  return {
    "/home": {
      onmatch: ({ slug }) => {
        mdl.slug = slug
      },
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
      render: () => m(Layout, { mdl }, m(Profile, { mdl, key: mdl.slug })),
    },

    "/login": {
      onmatch: ({ slug }) => {
        mdl.slug = slug
      },
      render: () => m(Layout, { mdl }, m(Login, { mdl })),
    },

    "/register": {
      onmatch: ({ slug }) => {
        mdl.slug = slug
      },
      render: () => m(Layout, { mdl }, m(Register, { mdl })),
    },
  }
}

export default routes
