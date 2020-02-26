const Header = () => {
  return {
    view: ({ attrs: { mdl } }) =>
      m(".header", [
        m.route.get() !== "/home" &&
          m("button.btn", { onclick: () => m.route.set("/home") }, "HOME"),
        mdl.page
      ])
  }
}

const Layout = () => {
  return {
    view: ({ children, attrs: { mdl } }) => {
      return m(".container", [m(Header, { mdl }), children])
    }
  }
}

export default Layout
