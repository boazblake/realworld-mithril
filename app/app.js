import Layout from "./layout.js"
import Home from "./home.js"
import Card from "./card.js"
import Picture from "./picture.js"

const routes = (mdl) => {
  return {
    "/home": {
      onmatch: () => {
        mdl.page = "ID Cards"
      },
      render: () => m(Layout, { mdl }, m(Home, { mdl }))
    },
    "/addcard": {
      onmatch: () => {
        mdl.page = "Add New Card"
      },
      render: () => m(Layout, { mdl }, m(Card, { mdl }))
    },
    "/picture": {
      onmatch: () => {
        mdl.page = `${mdl.side}picture`
      },
      render: () => m(Layout, { mdl }, m(Picture, { mdl }))
    },
    "/:idcard": {
      onmatch: () => {
        !mdl.card.name && m.route.set("/home")
        mdl.page = mdl.card.name
      },
      render: () => m(Layout, { mdl }, m(Card, { mdl }))
    }
  }
}

export default routes
