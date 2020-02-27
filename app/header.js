const Header = () => {
  return {
    view: ({ attrs: { mdl } }) =>
      m(
        "nav.navbar navbar-light",
        m(
          ".container",
          m("a.navbar-brand", { href: "#" }, "conduit"),
          m("ul.nav navbar-nav pull-xs-right", [
            m("li.nav-item", m("a.nav-link active", "Home")),
            m("li.nav-item", m("a.nav-link", "New Post ")),
            m("li.nav-item", m("a.nav-link", "Settings ")),
            m("li.nav-item", m("a.nav-link", "Sign up / Login")),
          ])
        )
      ),
  }
}

export default Header
