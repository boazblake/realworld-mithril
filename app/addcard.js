const AddCard = ({ attrs: { mdl } }) => {
  const state = {
    name: undefined,
    back: mdl.back,
    front: mdl.front
  }

  const takeImage = (side, mdl) => m.route.set("/picture", { mdl, side })

  const saveIdCard = (idCard) => {
    mdl.idCards.push(idCard)
    m.route.set("/home")
  }

  return {
    view: ({ attrs: { mdl } }) =>
      m(".container.columns", [
        m("", [
          m("label", "NAME: "),
          m("input", {
            type: "text",
            oninput: (e) => (state.name = e.target.value)
          })
        ]),
        m(
          ".column.col-12",
          state.front
            ? m("img", { src: state.front.src })
            : m(".empty", { onclick: (e) => takeImage("front", mdl) }, [
                m("Camera"),
                m("p", "Add Front")
              ])
        ),
        m(
          ".column.col-12",
          state.back
            ? m("img", { src: state.back.src })
            : m(".empty", { onclick: () => takeImage("back", mdl) }, [
                m("Camera"),
                m("p", "Add Back")
              ])
        ),
        m("button", { onclick: (e) => saveIdCard(state) }, "SAVE")
      ])
  }
}

export default AddCard
