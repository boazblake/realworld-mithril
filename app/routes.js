import Layout from "./layout/index"
import Home from "./pages/home"
import Article from "./pages/article"
import Profile from "./pages/profile"
import Register from "./pages/register"
import Login from "./pages/login"
import User from "./pages/user"
import Editor from "./pages/editor"

const routes = (mdl) => {
  return {
    "/home": {
      onmatch: (_, b) => {
        mdl.slug = b
      },
      render: () => m(Layout, { mdl }, m(Home, { mdl })),
    },

    "/editor": {
      onmatch: (_, b) => {
        mdl.slug = b
      },
      render: () => m(Layout, { mdl }, m(Editor, { mdl, key: mdl.slug })),
    },

    "/editor/:slug": {
      onmatch: ({ slug }) => {
        mdl.slug = slug
      },
      render: () => m(Layout, { mdl }, m(Editor, { mdl })),
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

    "/settings/:slug": {
      onmatch: ({ slug }) => {
        mdl.slug = slug
      },
      render: () => m(Layout, { mdl }, m(User, { mdl, key: mdl.slug })),
    },

    "/login": {
      onmatch: (_, b) => {
        mdl.slug = b
      },
      render: () => m(Layout, { mdl }, m(Login, { mdl })),
    },

    "/register": {
      onmatch: (_, b) => {
        mdl.slug = b
      },
      render: () => m(Layout, { mdl }, m(Register, { mdl })),
    },
  }
}

export default routes
