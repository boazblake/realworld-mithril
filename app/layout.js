const Header = () => {
  return {
    view: ({ attrs: { mdl } }) => m(".header", mdl.page)
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
