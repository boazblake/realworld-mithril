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
            mdl.state.isLoggedIn()
              ? [
                  m(
                    "li.nav-item",
                    m(m.route.Link, { class: "nav-link", href: "/editor" }, [
                      m("i.ion-compose.p-5"),
                      "New Article",
                    ])
                  ),
                  m(
                    "li.nav-item",
                    m(
                      m.route.Link,
                      {
                        class: "nav-link",
                        href: `/settings/${mdl.user.username}`,
                      },
                      [m("i.ion-gear-a.p-5"), "Settings"]
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
