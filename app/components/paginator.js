export const Paginator = () => {
  return {
    view: ({ attrs: { state, fetchDataFor } }) => {
      let total = Math.ceil(state.total / state.limit) + 1
      let current = state.offset / state.limit + 1
      let range = [...Array(total).keys()].slice(1)
      return (
        state.total > state.limit &&
        m(
          "ul.pagination",
          range.map((page, idx) => {
            return m(
              `li.page-item ${page == current && "active"}`,
              m(
                ".page-link active",
                {
                  onclick: (e) => fetchDataFor(idx * state.limit),
                },
                page
              )
            )
          })
        )
      )
    },
  }
}
