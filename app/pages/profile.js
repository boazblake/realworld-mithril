import Http from "Http"
import { Banner, Loader, Articles, Paginator } from "components"

const getProfileTask = (http) => (mdl) => (username) =>
  http.getTask(mdl)(`profiles/${username}`)

const getAuthorArticlesTask = (http) => (mdl) => (state) => (username) =>
  http.getTask(mdl)(
    `articles?limit=${state.limit}&offset=${state.offset}&author=${username}`
  )

const getAuthorFavoriteArticlesTask = (http) => (mdl) => (state) => (
  username
) =>
  http.getTask(mdl)(
    `articles?limit=${state.limit}&offset=${state.offset}&favorited=${username}`
  )

export const loadDataTask = (http) => (mdl) => (state) =>
  state.showFaveArticles
    ? getAuthorFavoriteArticlesTask(http)(mdl)(state)(mdl.slug)
    : getAuthorArticlesTask(http)(mdl)(state)(mdl.slug)

export const loadInitDataTask = (http) => (mdl) => (state) =>
  Task.of((profile) => (authorArticles) => ({
    ...profile,
    authorArticles,
  }))
    .ap(getProfileTask(http)(mdl)(mdl.slug))
    .ap(getAuthorArticlesTask(http)(mdl)(state)(mdl.slug))

const Profile = ({ attrs: { mdl } }) => {
  const data = {
    authorArticles: { articles: [], articlesCount: 0 },
    authorFavoriteArticles: { articles: [], articlesCount: 0 },
  }

  const state = {
    pageStatus: "loading",
    feedStatus: "loading",
    showFaveArticles: false,
    limit: 5,
    offset: 0,
    total: 0,
    error: null,
  }

  const loadData = (mdl) => {
    const onSuccess = (result) => {
      state.showFaveArticles
        ? (data.authorFavoriteArticles = result)
        : (data.authorArticles = result)

      state.total = state.showFaveArticles
        ? data.authorFavoriteArticles.articlesCount
        : data.authorArticles.articlesCount
      state.feedStatus = "success"
    }

    const onError = (error) => {
      console.log("error", error)
      state.error = error
      state.feedStatus = "error"
    }

    state.feedStatus = "loading"
    loadDataTask(Http)(mdl)(state).fork(onError, onSuccess)
  }

  const loadInitData = (mdl) => {
    const onSuccess = ({ authorArticles, profile }) => {
      data.authorArticles = authorArticles
      data.profile = profile
      state.pageStatus = "success"
      state.feedStatus = "success"
      state.total = data.authorArticles.articlesCount
    }

    const onError = (error) => {
      console.log("error", error)
      state.error = error
      state.pageStatus = "error"
      m.route.set("/home")
    }

    state.pageStatus = "loading"
    loadInitDataTask(Http)(mdl)(state).fork(onError, onSuccess)
  }

  const selectFeed = (toShowFaveArticles) => {
    state.showFaveArticles = toShowFaveArticles
    state.offset = 0
    loadData(mdl)
  }

  return {
    oninit: ({ attrs: { mdl } }) => loadInitData(mdl),
    view: ({ attrs: { mdl } }) => {
      return m(
        ".profile-page",

        state.pageStatus == "loading" &&
          m(Loader, [m("h1.logo-font", "Loading ...")]),
        state.pageStatus == "error" &&
          m(Banner, [m("h1.logo-font", `Error Loading Data: ${state.error}`)]),
        state.pageStatus == "success" && [
          m(
            ".user-info",
            m(
              ".container",
              m(
                ".row",
                m(".col-xs-12.col-md-10.offset-md-1", [
                  m("img.user-img", { src: data.profile.image }),
                  m("h4", data.profile.username),
                  m("p", data.profile.bio),
                  data.profile.username !== mdl.user.username
                    ? m("button.btn.btn-sm.btn-outline-secondary.action-btn", [
                        m("i.ion-plus-round"),
                        " ",
                        m.trust("&nbsp;"),
                        `Follow ${data.profile.username}`,
                      ])
                    : m(
                        "button.btn.btn-sm.btn-outline-secondary.action-btn",
                        {
                          onclick: (e) =>
                            m.route.set(`/settings/${data.profile.username}`),
                        },
                        [
                          m("i.ion-gear-a"),
                          " ",
                          m.trust("&nbsp;"),
                          `Edit Profile Settings`,
                        ]
                      ),
                ])
              )
            )
          ),
          m(
            ".container",
            m(
              ".row",
              m(".col-xs-12.col-md-10.offset-md-1", [
                m(
                  ".articles-toggle",
                  m("ul.nav.nav-pills.outline-active", [
                    m(
                      "li.nav-item",
                      m(
                        `a.nav-link ${!state.showFaveArticles && "active"}`,
                        {
                          onclick: (e) => selectFeed(false),
                        },
                        "My Articles"
                      )
                    ),
                    m(
                      "li.nav-item",
                      m(
                        `a.nav-link ${state.showFaveArticles && "active"}`,
                        {
                          onclick: (e) => selectFeed(true),
                        },
                        "Favorited Articles"
                      )
                    ),
                  ])
                ),
                state.feedStatus == "loading" && "Loading Articles...",
                state.feedStatus == "error" &&
                  m(Banner, [
                    m("h1.logo-font", `Error Loading Data: ${state.error}`),
                  ]),
                (state.feedStatus = "sucess" && [
                  state.showFaveArticles
                    ? m(Articles, { mdl, data: data.authorFavoriteArticles })
                    : m(Articles, { mdl, data: data.authorArticles }),

                  m(Paginator, {
                    mdl,
                    state,
                    fetchDataFor: (offset) => {
                      state.offset = offset
                      loadData(mdl)
                    },
                  }),
                ]),
              ])
            )
          ),
        ]
      )
    },
  }
}

export default Profile
