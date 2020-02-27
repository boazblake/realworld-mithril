import Http from "Http"
import { loadDataTask } from "./model"

const Profile = () => {
  const data = {}
  const state = {
    status: "loading",
    limit: 20,
    offset: 0,
    total: 0,
    error: null,
  }

  const onSuccess = ({ articles, profile }) => {
    data.articles = articles
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
      m("div.profile-page", [
        m(
          "div.user-info",
          m(
            "div.container",
            m(
              "div.row",
              m("div.col-xs-12.col-md-10.offset-md-1", [
                m("img.user-img[src='http://i.imgur.com/Qr71crq.jpg']"),
                m("h4", "Eric Simons"),
                m(
                  "p",
                  " Cofounder @GoThinkster, lived in Aol's HQ for a few months, kinda looks like Peeta from the Hunger Games "
                ),
                m("button.btn.btn-sm.btn-outline-secondary.action-btn", [
                  m("i.ion-plus-round"),
                  " ",
                  m.trust("&nbsp;"),
                  " Follow Eric Simons ",
                ]),
              ])
            )
          )
        ),
        m(
          "div.container",
          m(
            "div.row",
            m("div.col-xs-12.col-md-10.offset-md-1", [
              m(
                "div.articles-toggle",
                m("ul.nav.nav-pills.outline-active", [
                  m(
                    "li.nav-item",
                    m("a.nav-link.active[href='']", "My Articles")
                  ),
                  m(
                    "li.nav-item",
                    m("a.nav-link[href='']", "Favorited Articles")
                  ),
                ])
              ),
              m("div.article-preview", [
                m("div.article-meta", [
                  m(
                    "a[href='']",
                    m("img[src='http://i.imgur.com/Qr71crq.jpg']")
                  ),
                  m("div.info", [
                    m("a.author[href='']", "Eric Simons"),
                    m("span.date", "January 20th"),
                  ]),
                  m("button.btn.btn-outline-primary.btn-sm.pull-xs-right", [
                    m("i.ion-heart"),
                    " 29 ",
                  ]),
                ]),
                m("a.preview-link[href='']", [
                  m("h1", "How to build webapps that scale"),
                  m("p", "This is the description for the post."),
                  m("span", "Read more..."),
                ]),
              ]),
              m("div.article-preview", [
                m("div.article-meta", [
                  m(
                    "a[href='']",
                    m("img[src='http://i.imgur.com/N4VcUeJ.jpg']")
                  ),
                  m("div.info", [
                    m("a.author[href='']", "Albert Pai"),
                    m("span.date", "January 20th"),
                  ]),
                  m("button.btn.btn-outline-primary.btn-sm.pull-xs-right", [
                    m("i.ion-heart"),
                    " 32 ",
                  ]),
                ]),
                m("a.preview-link[href='']", [
                  m(
                    "h1",
                    "The song you won't ever stop singing. No matter how hard you try."
                  ),
                  m("p", "This is the description for the post."),
                  m("span", "Read more..."),
                  m("ul.tag-list", [
                    m("li.tag-default.tag-pill.tag-outline", "Music"),
                    m("li.tag-default.tag-pill.tag-outline", "Song"),
                  ]),
                ]),
              ]),
            ])
          )
        ),
      ]),
  }
}

export default Profile
