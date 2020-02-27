const Header = () => {
  const goBack = (mdl) =>
    mdl.name ? m.route.set(`/${mdl.name}`) : m.route.set("/addcard")

  return {
    view: ({ attrs: { mdl } }) =>
      m(".header", [
        m.route.get() !== "/home" &&
          m("button.btn", { onclick: () => m.route.set("/home") }, "HOME"),
        m.route.get() !== "/addcard" &&
          m.route.get() !== "/home" &&
          m("button.btn", { onclick: (e) => goBack(mdl) }, "BACK"),
        mdl.page
      ])
  }
}

const Layout = () => {
  return {
    view: ({ children, attrs: { mdl } }) => {
      return m(".container", [
        m(Header, { mdl }),
        children,
        m("pre", JSON.stringify(mdl, null, 4))
      ])
    }
  }
}

export default Layout
