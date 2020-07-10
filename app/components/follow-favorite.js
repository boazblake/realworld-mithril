import Http from "Http"
import { log } from "Utils"

const deleteArticleUrl = (slug) => `articles/${slug}`
const favoriteArticleUrl = (slug) => `articles/${slug}/favorite`
const followAuthorUrl = (author) => `profiles/${author}/follow`

const deleteArticleTask = (http) => (mdl) =>
  http.deleteTask(mdl)(favoriteArticleUrl(mdl.slug))

const favoriteArticleTask = (http) => (mdl) =>
  http.postTask(mdl)(favoriteArticleUrl(mdl.slug))()

const unFavoriteArticleTask = (http) => (mdl) =>
  http.deleteTask(mdl)(favoriteArticleUrl(mdl.slug))

const followAuthorTask = (http) => (mdl) => (author) =>
  http.postTask(mdl)(followAuthorUrl(author))()

const unFollowAuthorTask = (http) => (mdl) => (author) =>
  http.deleteTask(mdl)(followAuthorUrl(author))

export const FollowFavorite = ({ attrs: { mdl, data } }) => {
  const toggleArticleLike = ({ favorited }) => {
    const onError = log("toggleArticleLike err-art")
    const onSuccess = ({ article: { favorited, favoritesCount } }) => {
      data.favorited = favorited
      data.favoritesCount = favoritesCount
    }

    let toggle = favorited ? unFavoriteArticleTask : favoriteArticleTask
    toggle(Http)(mdl).fork(onError, onSuccess)
  }

  const toggleAuthorFollow = ({ author: { username, following } }) => {
    const onError = log("toggleAuthorFollow, err-auth")
    const onSuccess = ({ profile: { following } }) =>
      (data.author.following = following)

    let toggle = following ? unFollowAuthorTask : followAuthorTask
    toggle(Http)(mdl)(username).fork(onError, onSuccess)
  }

  const deleteArticle = (slug) => {
    const onError = log("deleteArticle, err-auth")
    const onSuccess = (s) => {
      console.log(s)
      m.route.set("/home")
    }
    deleteArticleTask(Http)(mdl).fork(onError, onSuccess)
  }

  return {
    view: ({
      attrs: {
        mdl,
        data: {
          author: { username, image, following },
          favoritesCount,
          favorited,
          createdAt,
          slug,
        },
      },
    }) => {
      return m(".article-meta", [
        m(
          m.route.Link,
          { href: `profile/${username}` },
          m("img", { src: image })
        ),
        m(".info", [
          m(
            m.route.Link,
            { class: "author", href: `profile/${username}` },
            username
          ),
          m("span.date", createdAt),
        ]),
        mdl.user.username == username
          ? [
              m(
                m.route.Link,
                {
                  class: "btn btn-sm btn-outline-secondary",
                  href: `/editor/${slug}`,
                  selector: "button",
                },
                [m("i.ion-edit.p-5"), "Edit Article"]
              ),
              m(
                "button.btn.btn-sm.btn-outline-danger.m-5",
                { onclick: (e) => deleteArticle(slug) },
                [m("i.ion-trash-a.m-5"), "Delete Article "]
              ),
            ]
          : [
              m(
                "button.btn.btn-sm.btn-outline-secondary",
                { onclick: (e) => toggleAuthorFollow(data) },
                [
                  following
                    ? [m("i.ion-minus-round"), ` Unfollow ${username} `]
                    : [m("i.ion-plus-round"), ` Follow ${username} `],
                ]
              ),
              m(
                "button.btn.btn-sm.btn-outline-primary.m-5",
                { onclick: (e) => toggleArticleLike(data) },
                [
                  m("i.ion-heart.m-5"),
                  favorited ? " Unfavorite Article " : " Favorite Article ",
                  m("span.counter", `( ${favoritesCount} )`),
                ]
              ),
            ],
      ])
    },
  }
}
