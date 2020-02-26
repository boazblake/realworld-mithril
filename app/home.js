import { Camera } from "@mithril-icons/feather/cjs"

const IdCards = () => {
  return {
    view: ({ attrs: { mdl, card } }) => {
      console.log(card)
      return m(".card", [
        m("label", card.name),
        m("img", { width: 100, src: card.front.src })
      ])
    }
  }
}

const AddCard = () =>
  navigator.mediaDevices &&
  navigator.mediaDevices.getUserMedia &&
  m.route.set("/addcard")

const Home = ({ attrs: { mdl } }) => {
  console.log(mdl)
  return {
    view: ({ attrs: { mdl } }) =>
      m(
        ".container.columns",
        mdl.idCards.length > 0
          ? mdl.idCards.map((card) => m(IdCards, { mdl, card }))
          : m("button.empty.col-12", { onclick: AddCard }, [
              m(Camera),
              m("p", "Add a New Card")
            ])
      )
  }
}

export default Home
