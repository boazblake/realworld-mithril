import Http from "Http"
import { Banner, Loader, Articles } from "components"

const getProfileTask = (http) => (mdl) => (username) =>
  http.getTask(mdl)(`profiles/${username}`)

const getAuthorArticlesTask = (http) => (mdl) => (state) => (username) =>
  http.getTask(mdl)(
    `articles?limit=20&offset=${state.offset}&author=${username}`
  )

const getAuthorFavoriteArticlesTask = (http) => (mdl) => (state) => (
  username
) =>
  http.getTask(mdl)(
    `articles?limit=20&offset=${state.offset}&favorited=${username}`
  )

export const loadDataTask = (http) => (mdl) => (state) =>
  Task.of((profile) => (authorArticles) => (authorFavoriteArticles) => ({
    ...profile,
    authorArticles,
    authorFavoriteArticles,
  }))
    .ap(getProfileTask(http)(mdl)(mdl.slug))
    .ap(getAuthorArticlesTask(http)(mdl)(state)(mdl.slug))
    .ap(getAuthorFavoriteArticlesTask(http)(mdl)(state)(mdl.slug))

const Profile = () => {
  const data = {}
  const state = {
    status: "loading",
    showFaveArticles: false,
    limit: 20,
    offset: 0,
    total: 0,
    error: null,
  }

  const onSuccess = ({ authorArticles, authorFavoriteArticles, profile }) => {
    data.authorArticles = authorArticles
    data.authorFavoriteArticles = authorFavoriteArticles
    data.profile = profile
    state.status = "success"
  }

  const onError = (error) => {
    console.log("error", error)
    state.error = error
    state.status = "error"
  }

  const loadData = (mdl) => {
    state.status = "loading"
    loadDataTask(Http)(mdl)(state).fork(onError, onSuccess)
  }
  return {
    oninit: ({ attrs: { mdl } }) => loadData(mdl),
    view: ({ attrs: { mdl } }) =>
      m(
        ".profile-page",

        state.status == "loading" &&
          m(Loader, [m("h1.logo-font", "Loading ...")]),
        state.status == "error" &&
          m(Banner, [m("h1.logo-font", `Error Loading Data: ${state.error}`)]),
        state.status == "success" && [
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
                        `.nav-link ${!state.showFaveArticles && "active"}`,
                        {
                          onclick: (e) => (state.showFaveArticles = false),
                        },
                        "My Articles"
                      )
                    ),
                    m(
                      "li.nav-item",
                      m(
                        `.nav-link ${state.showFaveArticles && "active"}`,
                        {
                          onclick: (e) => (state.showFaveArticles = true),
                        },
                        "Favorited Articles"
                      )
                    ),
                  ])
                ),
                state.showFaveArticles
                  ? m(Articles, { mdl, data: data.authorFavoriteArticles })
                  : m(Articles, { mdl, data: data.authorArticles }),
              ])
            )
          ),
        ]
      ),
  }
}

export default Profile
