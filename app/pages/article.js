import Http from "Http"
import { Banner, FollowFavorite, Comments } from "components"
import md from "marked"

const getArticleTask = (http) => (mdl) => (slug) =>
  http.getTask(mdl)(`articles/${slug}`)

const Article = () => {
  const data = {}
  const state = {
    status: "loading",
    error: null,
  }

  const onSuccess = ({ article, comments }) => {
    data.article = article
    data.comments = comments
    state.status = "success"
  }

  const onError = (error) => {
    console.log("error", error)
    state.error = error
    state.status = "error"
  }

  const loadData = (mdl) => {
    state.status = "loading"
    getArticleTask(Http)(mdl)(mdl.slug).fork(onError, onSuccess)
  }

  return {
    oninit: ({ attrs: { mdl } }) => loadData(mdl),
    view: ({ attrs: { mdl } }) =>
      m(".article-page", [
        state.status == "loading" &&
          m(Banner, [m("h1.logo-font", "Loading ...")]),
        state.status == "error" &&
          m(Banner, [m("h1.logo-font", `Error Loading Data: ${state.error}`)]),

        state.status == "success" && [
          m(
            ".banner",
            m(".container", [
              m("h1", data.article.title),
              m(FollowFavorite, {
                mdl,
                data: data.article,
              }),
            ])
          ),
          m(".container.page", [
            m(
              ".row.article-content",
              m(".col-md-12.text-justify", m.trust(md(data.article.body)))
            ),
            m("hr"),

            m(".article-actions", [
              m(FollowFavorite, {
                mdl,
                data: data.article,
              }),
            ]),
            m(Comments, {
              mdl,
              comments: data.comments,
              reloadArticle: () => loadData(mdl),
            }),
          ]),
        ],
      ]),
  }
}

export default Article
