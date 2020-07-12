const footer = () => {
  return {
    view: () =>
      m(
        "footer",
        m("div", { class: "container" }, [
          m(
            "a",
            {
              class: "logo-font",
              href: "https://github.com/gothinkster/realworld",
            },
            "conduit"
          ),
          m("span", { class: "attribution" }, [
            " An interactive learning project from ",
            m("a", { href: "https://thinkster.io" }, "Thinkster"),
            ". Code ",
            m.trust("&amp;"),
            " design licensed under MIT. ",
          ]),
        ])
      ),
  }
}

export default footer
