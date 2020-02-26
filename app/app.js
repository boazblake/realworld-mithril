import Layout from "./layout.js"
import Home from "./home.js"
import AddCard from "./addcard.js"
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
      render: () => m(Layout, { mdl }, m(AddCard, { mdl }))
    },
    "/picture": {
      onmatch: ({ side }) => {
        mdl.side = side
        mdl.page = `${side} picture`
      },
      render: () => m(Layout, { mdl }, m(Picture, { mdl }))
    },
    "/:idcard": {
      onmatch: ({ idcard }) => {
        mdl.page = idcard
      },
      render: () => m(Layout, { mdl }, m(Card, { mdl }))
    }
  }
}

export default routes
