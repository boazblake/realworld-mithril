const Header = () => {
  return {
    view: ({ attrs: { mdl } }) =>
      m(
        "nav.navbar navbar-light",
        m(
          ".container",
          m("a.navbar-brand", { href: "#" }, "conduit"),
          m(
            "ul.nav navbar-nav pull-xs-right",
            mdl.user
              ? [
                  m(
                    "li.nav-item",
                    m(
                      m.route.Link,
                      { class: "nav-link", href: "/editor" },
                      "New Article"
                    )
                  ),
                  m(
                    "li.nav-item",
                    m(
                      m.route.Link,
                      {
                        class: "nav-link",
                        href: `/settings/${mdl.user.username}`,
                      },
                      "Settings"
                    )
                  ),
                  m(
                    "li.nav-item",
                    m(
                      m.route.Link,
                      {
                        class: "nav-link",
                        href: `/profile/${mdl.user.username}`,
                      },
                      mdl.user.username
                    )
                  ),
                ]
              : [
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
                    m(
                      m.route.Link,
                      { class: "nav-link", href: "/login" },
                      "Login"
                    )
                  ),
                ]
          )
        )
      ),
  }
}

export default Header
