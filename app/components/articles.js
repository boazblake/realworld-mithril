import { ArticlePreview } from "components"

export const Articles = () => {
  return {
    view: ({ attrs: { mdl, data } }) =>
      data.articles.any()
        ? data.articles.map((article) =>
            m(ArticlePreview, { mdl, data, article })
          )
        : m("p", "No articles are here... yet."),
  }
}
