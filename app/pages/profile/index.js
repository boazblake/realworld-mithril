import Http from "Http"
import { loadDataTask } from "./model"
import { Banner, Loader, ArticlePreview } from "components"

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
    console.log("data", data)
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
    view: () =>
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
                  m("button.btn.btn-sm.btn-outline-secondary.action-btn", [
                    m("i.ion-plus-round"),
                    " ",
                    m.trust("&nbsp;"),
                    `Follow ${data.profile.username}`,
                  ]),
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
                  ? data.authorFavoriteArticles.articles.map((article) =>
                      m(ArticlePreview, { article })
                    )
                  : data.authorArticles.articles.map((article) =>
                      m(ArticlePreview, { article })
                    ),
              ])
            )
          ),
        ]
      ),
  }
}

export default Profile
