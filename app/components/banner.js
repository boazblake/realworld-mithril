export const Banner = () => {
  return {
    view: ({ children }) => m(".banner", m(".container", children)),
  }
}
