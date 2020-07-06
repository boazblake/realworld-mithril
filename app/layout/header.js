const Header = () => {
  return {
    view: ({ attrs: { mdl } }) =>
      m(
        "nav.navbar navbar-light",
        m(
          ".container",
          m("a.navbar-brand", { href: "#" }, "conduit"),
          m("ul.nav navbar-nav pull-xs-right", [
            // m("li.nav-item", m("a.nav-link", "New Post ")),
            // m("li.nav-item", m("a.nav-link", "Settings ")),
            m(
              "li.nav-item",
              m(
                m.route.Link,
                { class: "nav-link", href: "/register" },
                "Sign up"
              )
            ),
            m(
              "li.nav-item",
              m(m.route.Link, { class: "nav-link", href: "/login" }, "Login")
            ),
          ])
        )
      ),
  }
}

export default Header
