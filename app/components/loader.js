export const Loader = () => {
  return {
    view: ({ children }) =>
      m(".container", m(".banner", m(".container", children))),
  }
}
