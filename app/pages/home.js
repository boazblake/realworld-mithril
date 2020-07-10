import Http from "Http"
import {
  Banner,
  Loader,
  Paginator,
  Articles,
  FeedNav,
  SideBar,
} from "components"

const getTagsTask = (http) => (mdl) => http.getTask(mdl)("tags")
const getArticlesTask = (http) => (mdl) => (state) => (data) =>
  data.tags.current == "feed"
    ? http.getTask(mdl)(`articles/feed?limit=20&offset=${state.offset}`)
    : http.getTask(mdl)(
        `articles?limit=20&offset=${state.offset}&tag=${data.tags.current}`
      )

const loadDataTask = (http) => (mdl) => (state) => (data) =>
  Task.of((tags) => (articles) => ({ ...tags, ...articles }))
    .ap(getTagsTask(http)(mdl))
    .ap(getArticlesTask(http)(mdl)(state)(data))

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
      return m(".home-page", [
        !mdl.state.isLoggedIn() &&
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

                state.feedStatus == "success"
                  ? state.total
                    ? [
                        m(Articles, { mdl, data }),

                        m(Paginator, {
                          mdl,
                          state,
                          fetchDataFor: (offset) => {
                            state.offset = offset
                            loadArticles(mdl)
                          },
                        }),
                      ]
                    : m("p.pull-xs-left", "No articles are here... yet.")
                  : "",
              ]),

              m(".col-md-3", m(SideBar, { mdl, data })),
            ])
          ),
      ])
    },
  }
}

export default Home
