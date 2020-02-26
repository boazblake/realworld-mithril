const IdCards = () => {
  return {
    view: ({ attrs: { card } }) => {
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

const resetState = (mdl) => {
  mdl.card.front = undefined
  mdl.card.back = undefined
  mdl.card.name = undefined
}

const Home = ({ attrs: { mdl } }) => {
  return {
    oninit: () => resetState(mdl),
    view: ({ attrs: { mdl } }) =>
      m(".container.columns", [
        mdl.idCards && mdl.idCards.map((card) => m(IdCards, { mdl, card })),
        m("button.empty.col-12", { onclick: AddCard }, [
          m(".icon icon-photo"),
          m("p", "Add a New Card")
        ])
      ])
  }
}

export default Home
