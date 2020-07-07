const SideBar = () => {
  const selectTag = (data, tag) => (e) => data.tags.selected.push(tag)

  return {
    view: ({ attrs: { mdl, data } }) => {
      return m(".sidebar", [
        m("p", "Popular Tags"),
        m(
          ".tag-list",
          data.tags.tagList.map((tag) =>
            m(".tag-pill tag-default", { onclick: selectTag(data, tag) }, tag)
          )
        ),
      ])
    },
  }
}

export default SideBar
