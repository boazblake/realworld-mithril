import Http from "Http"
import { log } from "Utils"

const favoriteArticleUrl = (slug) => `articles/${slug}/favorite`
const favoriteArticleTask = (http) => (mdl) => (slug) =>
  http.postTask(mdl)(favoriteArticleUrl(slug))()

const unFavoriteArticleTask = (http) => (mdl) => (slug) =>
  http.deleteTask(mdl)(favoriteArticleUrl(slug))

const ArticlePreview = ({ attrs: { mdl, article } }) => {
  let data = article
  const toggleArticleLike = (favorited, slug) => {
    const onError = log("toggleArticleLike err-art")
    const onSuccess = ({ article: { favorited, favoritesCount } }) => {
      data.favorited = favorited
      data.favoritesCount = favoritesCount
    }

    let toggle = favorited ? unFavoriteArticleTask : favoriteArticleTask
    toggle(Http)(mdl)(slug).fork(onError, onSuccess)
  }

  return {
    view: () => {
      return m(".article-preview", [
        m(".article-meta", [
          m(
            m.route.Link,
            { href: `/profile/${data.username}`, options: { replace: true } },
            m("img", { src: data.image })
          ),

          m(".info", [
            m(
              m.route.Link,
              {
                class: "author",
                href: `/profile/${data.username}`,
                options: { replace: true },
              },
              data.username
            ),
            m("span.date", data.createdAt),
          ]),
          m(
            "button.btn btn-outline-primary btn-sm pull-xs-right",
            {
              onclick: (e) => toggleArticleLike(data.favorited, data.slug),
              class: data.favorited && "active",
            },
            [m("i.ion-heart.p-5"), m("span", data.favoritesCount)]
          ),
        ]),
        m(
          m.route.Link,
          { class: "preview-link", href: `/article/${data.slug}` },
          [
            m("h1", data.title),
            m("p", data.description),
            m(
              "ul.tag-list",
              data.tagList.map((tag) =>
                m("li.tag-default tag-pill tag-outline", tag)
              )
            ),
            m("span", "Read more..."),
          ]
        ),
      ])
    },
  }
}

export const Articles = () => {
  return {
    view: ({ attrs: { mdl, data } }) => {
      return data.articles.length
        ? data.articles.map((article) =>
            m(ArticlePreview, { mdl, data, article })
          )
        : m("p", "No articles are here... yet.")
    },
  }
}
