const IdMaker = ({ attrs: { mdl } }) => {
  mdl.state = {
    name: mdl.state.name ? mdl.state.name : mdl.card.name,
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

  const retakeImage = (side, mdl) => {
    mdl.side = side

    m.route.set("/picture")
  }

  return {
    view: ({ attrs: { mdl } }) =>
      m(".container.columns", { id: "idmaker" }, [
        m(".form-group", [
          m("label", "NAME: "),
          m("input", {
            type: "text",
            value: mdl.state.name,
            oninput: (e) => (mdl.state.name = e.target.value)
          })
        ]),
        m(
          ".column.col-12",
          mdl.state.front
            ? m("img", {
                src: mdl.state.front.src,
                onclick: () => retakeImage("front", mdl)
              })
            : m(".card.empty", { onclick: (e) => takeImage("front", mdl) }, [
                m(".icon icon-photo"),
                m("p", "Add Front")
              ])
        ),
        m(
          ".column.col-12",
          mdl.state.back
            ? m("img", {
                src: mdl.state.back.src,
                onclick: () => retakeImage("back", mdl)
              })
            : m(".card.empty", { onclick: () => takeImage("back", mdl) }, [
                m(".icon icon-photo"),
                m("p", "Add Back")
              ])
        ),
        m(
          "button.btn.btn-lg",
          { onclick: (e) => saveIdCard(mdl.state) },
          "SAVE"
        )
      ])
  }
}

export default IdMaker
