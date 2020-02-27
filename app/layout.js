import Header from "./header.js"
import Footer from "./footer.js"

const Layout = () => {
  return {
    view: ({ children, attrs: { mdl } }) =>
      m("", [m(Header, { mdl }), children, m(Footer, { mdl })]),
  }
}

export default Layout
