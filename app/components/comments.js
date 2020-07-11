import Http from "Http"
import { log, sanitizeImg } from "Utils"
import { lensProp, over, trim } from "ramda"

const getCommentsTask = (http) => (mdl) => (slug) =>
  http.getTask(mdl)(`articles/${slug}/comments`)

const deleteCommentTask = (http) => (mdl) => (slug) => (id) =>
  http.deleteTask(mdl)(`articles/${slug}/comments/${id}`)

const trimBody = over(lensProp("body"), trim)

const submitTask = (http) => (mdl) => (comment) =>
  http.postTask(mdl)(`articles/${mdl.slug}/comments`)({ comment })

const CommentForm = ({ attrs: { mdl, reload } }) => {
  const comment = { body: "" }

  const onError = log("Error with form ")

  const onSuccess = () => {
    comment.body = ""
    reload()
  }

  const submit = (comment) =>
    submitTask(Http)(mdl)(trimBody(comment)).fork(onError, onSuccess)

  return {
    oninit: () => (comment.body = ""),
    view: ({ attrs: { mdl } }) =>
      m("form.card.comment-form", [
        m(
          ".card-block",
          m("textarea.form-control", {
            rows: 3,
            placeholder: "Write a comment ...",
            onchange: (e) => (comment.body = e.target.value),
            value: comment.body,
          })
        ),
        m(".card-footer", [
          m("img.comment-author-img", { src: sanitizeImg(mdl.user.image) }),
          m(
            "button.btn.btn-sm.btn-primary",
            { onclick: (e) => submit(comment) },
            " Post Comment "
          ),
        ]),
      ]),
  }
}

const Comment = () => {
  return {
    view: ({
      attrs: {
        mdl,
        comment: {
          author: { image, username },
          body,
          createdAt,
          id,
        },
        deleteComment,
      },
    }) =>
      m(".card", [
        m(".card-block", m("p.card-text", body)),
        m(".card-footer", [
          m(
            m.route.Link,
            {
              href: `/profile/${username}`,
              class: "comment-author m-5",
            },
            m("img.comment-author-img", {
              src: sanitizeImg(image),
            })
          ),

          m(
            m.route.Link,
            {
              href: `/profile/${username}`,
              class: "comment-author m-5",
            },
            username
          ),

          m("span.date-posted", createdAt),
          username == mdl.user.username &&
            m("span.mod-options", [
              m("i.ion-trash-a", { onclick: (e) => deleteComment(id) }),
            ]),
        ]),
      ]),
  }
}

export const Comments = ({ attrs: { mdl } }) => {
  const data = { comments: [] }

  const loadComments = (mdl) => {
    const onSuccess = ({ comments }) => (data.comments = comments)

    const onError = log("error with coomments")

    getCommentsTask(Http)(mdl)(mdl.slug).fork(onError, onSuccess)
  }

  const deleteComment = (id) => {
    const onSuccess = ({ comments }) => (data.comments = comments)

    const onError = log("error with coomments")

    deleteCommentTask(Http)(mdl)(mdl.slug)(id)
      .chain((x) => getCommentsTask(Http)(mdl)(mdl.slug))
      .fork(onError, onSuccess)
  }

  return {
    oninit: ({ attrs: { mdl } }) => loadComments(mdl),
    view: ({ attrs: { mdl } }) =>
      m(
        ".row",
        m(".col-xs-12.col-md-8.offset-md-2", [
          m(CommentForm, { mdl, reload: () => loadComments(mdl) }),
          data.comments.map((c) =>
            m(Comment, {
              mdl,
              comment: c,
              deleteComment: (id) => deleteComment(id),
            })
          ),
        ])
      ),
  }
}
