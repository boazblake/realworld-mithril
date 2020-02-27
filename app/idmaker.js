const IdMaker = ({ attrs: { mdl } }) => {
  const state = {
    name: mdl.card.name,
    back: mdl.card.back,
    front: mdl.card.front
  }

  const takeImage = (side, mdl) => {
    mdl.side = side

    m.route.set("/picture")
  }

  const saveIdCard = (idCard) => {
    mdl.idCards.push(idCard)
    m.route.set("/home")
  }

  return {
    view: ({ attrs: { mdl } }) =>
      m(".container.columns", [
        m(".form-group", [
          m("label", "NAME: "),
          m("input", {
            type: "text",
            value: state.name,
            oninput: (e) => (state.name = e.target.value)
          })
        ]),
        m(
          ".column.col-12",
          state.front
            ? m("img", { src: state.front.src })
            : m(".card.empty", { onclick: (e) => takeImage("front", mdl) }, [
                m(".icon icon-photo"),
                m("p", "Add Front")
              ])
        ),
        m(
          ".column.col-12",
          state.back
            ? m("img", { src: state.back.src })
            : m(".card.empty", { onclick: () => takeImage("back", mdl) }, [
                m(".icon icon-photo"),
                m("p", "Add Back")
              ])
        ),
        m("button.btn.btn-lg", { onclick: (e) => saveIdCard(state) }, "SAVE")
      ])
  }
}

export default IdMaker
