import Http from "Http"
import { loadDataTask, getArticlesTask } from "./model"
import { Banner, Loader, Paginator, Articles } from "components"
import SideBar from "./sidebar"
import FeedNav from "./feednav.js"

const Home = () => {
  const data = {
    tags: { tagList: [], selected: [], current: "" },
    articles: {},
  }
  const state = {
    feedStatus: "loading",
    pageStatus: "loading",
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
      state.pageStatus = "success"
      state.feedStatus = "success"
    }

    const onError = (error) => {
      console.log("error", error)
      state.error = error
      state.pageStatus = "error"
    }
    state.pageStatus = "loading"
    loadDataTask(Http)(mdl)(state)(data).fork(onError, onSuccess)
  }

  const loadArticles = (mdl) => {
    const onSuccess = ({ articles, articlesCount }) => {
      data.articles = articles
      state.total = articlesCount
      state.feedStatus = "success"
    }

    const onError = (error) => {
      console.log("error", error)
      state.error = error
      state.feedStatus = "error"
    }

    state.feedStatus = "loading"
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

        state.pageStatus == "loading" &&
          m(Loader, [m("h1.logo-font", `Loading Data`)]),

        state.pageStatus == "error" &&
          m(Banner, [m("h1.logo-font", `Error Loading Data: ${state.error}`)]),

        state.pageStatus == "success" &&
          m(
            ".container page",
            m(".row", [
              m(".col-md-9", [
                m(FeedNav, { fetchData: loadArticles, mdl, data }),

                state.feedStatus == "loading" && m("p", "Loading Articles ..."),

                state.feedStatus == "success" && m(Articles, { mdl, data }),

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
