import Http from "Http"
import { loadDataTask, getArticlesTask } from "./model"
import { Banner, Loader, Paginator, ArticlePreview } from "components"
import { SideBar } from "./sidebar"
import { FeedNav } from "./feednav.js"

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

  const loadInitData = (mdl) => {
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
    state.status = "loading"
    loadDataTask(Http)(mdl)(state)(data).fork(onError, onSuccess)
  }

  const loadArticles = (mdl) => {
    const onSuccess = ({ articles, articlesCount }) => {
      data.articles = articles
      state.total = articlesCount
      state.status = "success"
    }

    const onError = (error) => {
      console.log("error", error)
      state.error = error
      state.status = "error"
    }
    state.status = "loading"
    getArticlesTask(Http)(mdl)(state)(data).fork(onError, onSuccess)
  }

  return {
    oninit: ({ attrs: { mdl } }) => loadInitData(mdl),
    view: ({ attrs: { mdl } }) => {
      return m(".home", [
        !mdl.user &&
          m(Banner, [
            m("h1.logo-font", "conduit"),
            m("p", "A place to share your knowledge."),
          ]),

        state.status == "error" &&
          m(Banner, [m("h1.logo-font", `Error Loading Data: ${state.error}`)]),

        state.status == "success" &&
          m(
            ".container page",
            m(".row", [
              m(".col-md-9", [
                m(FeedNav, { fetchData: loadArticles, mdl, data }),
                data.articles.map((article) =>
                  m(ArticlePreview, { mdl, data, article })
                ),

                state.status == "loading" &&
                  m(Loader, [m("h1.logo-font", "Loading ...")]),

                m(Paginator, {
                  mdl,
                  state,
                  fetchDataFor: (offset) => {
                    state.offset = offset * state.limit
                    loadArticles(mdl)
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
