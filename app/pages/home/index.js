import Http from "Http"
import { loadDataTask } from "./model"
import { Banner, Paginator } from "components"
import { SideBar } from "./sidebar"
import { FeedNav } from "./feednav.js"
import { ArticlePreview } from "./article-preview"

const Home = () => {
  const data = {
    tags: { tagList: [], selected: [], current: "" },
    articles: {},
  }
  const state = {
    status: "loading",
    limit: 20,
    offset: 0,
    total: 0,
    error: null,
  }

  const onSuccess = ({ articles, articlesCount, tags }) => {
    data.articles = articles
    state.total = articlesCount
    data.tags.tagList = tags
    state.status = "success"
  }

  const onError = (error) => {
    console.log("error", error)
    state.error = error
    state.status = "error"
  }

  const loadData = (mdl) => {
    state.status = "loading"
    loadDataTask(Http)(mdl)(state)(data).fork(onError, onSuccess)
  }

  return {
    oninit: ({ attrs: { mdl } }) => loadData(mdl),
    view: ({ attrs: mdl }) => {
      return m(".home", [
        m(Banner, [
          m("h1.logo-font", "conduit"),
          m("p", "A place to share your knowledge."),
        ]),
        state.status == "loading" &&
          m(Banner, [m("h1.logo-font", "Loading ...")]),
        state.status == "error" &&
          m(Banner, [m("h1.logo-font", `Error Loading Data: ${state.error}`)]),
        state.status == "success" &&
          m(
            ".container page",
            m(".row", [
              m(".col-md-9", [
                m(FeedNav, { fetchData: loadData, mdl, data }),
                data.articles.map((article) =>
                  m(ArticlePreview, { mdl, data, article })
                ),
                m(Paginator, {
                  mdl,
                  state,
                  fetchDataFor: (offset) => {
                    state.offset = offset * state.limit
                    loadData(mdl.mdl)
                  },
                }),
              ]),
              m(".col-md-3", m(SideBar, { mdl, data })),
            ])
          ),
      ])
    },
  }
}

export default Home
