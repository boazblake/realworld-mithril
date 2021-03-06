import Http from "Http"
import { errorViewModel } from "Utils"
import { compose, lensProp, over, split, trim, uniq } from "ramda"

export const loadArticleTask = (http) => (mdl) => (slug) =>
  http.getTask(mdl)(`articles/${slug}`)

const formatTags = over(lensProp("tagList"), compose(uniq, split(" "), trim))

export const submitArticleTask = (http) => (mdl) => (article) =>
  http.postTask(mdl)("articles")({ article })

const Editor = ({ attrs: { mdl } }) => {
  let data = {
    description: "",
    title: "",
    body: "",
    tagList: "",
  }
  const state = {
    disabled: false,
  }

  const initEditor = (mdl) => {
    state.disabled = false
    const onSuccess = ({ article }) => (data = article)

    const onError = (errors) => (state.errors = errorViewModel(errors))

    if (mdl.slug !== "/editor") {
      loadArticleTask(Http)(mdl)(mdl.slug).fork(onError, onSuccess)
    }
  }

  const submitData = (data) => {
    state.disabled = true
    const onSuccess = ({ article: { slug } }) => m.route.set(`/article/${slug}`)

    const onError = (errors) => {
      state.errors = errorViewModel(errors)
      state.disabled = false
    }

    submitArticleTask(Http)(mdl)(data).fork(onError, onSuccess)
  }

  return {
    oninit: ({ attrs: { mdl } }) => initEditor(mdl),
    view: () =>
      m(
        ".editor-page",
        m(
          ".container.page",
          m(
            ".row",
            m(
              ".col-md-10.offset-md-1.col-xs-12",
              m("form", [
                state.errors &&
                  state.errors.map((e) =>
                    m(
                      ".error-messages",
                      m(
                        "ul",
                        `${e.key}`,
                        e.values.map((error) => m("li", error))
                      )
                    )
                  ),
                m(
                  "fieldset.form-group",
                  m("input.form-control.form-control-lg", {
                    type: "text",
                    disabled: state.disabled,
                    placeholder: "Article Title",
                    onchange: (e) => (data.title = e.target.value),
                    value: data.title,
                  })
                ),

                m(
                  "fieldset.form-group",
                  m("input.form-control.form-control-lg", {
                    type: "text",
                    disabled: state.disabled,
                    placeholder: "What's this article about?",
                    onchange: (e) => (data.description = e.target.value),
                    value: data.description,
                  })
                ),

                m(
                  "fieldset.form-group",
                  m("textarea.form-control.form-control-lg", {
                    rows: 8,
                    placeholder: "Write your article (in markdown)",
                    disabled: state.disabled,
                    onchange: (e) => (data.body = e.target.value),
                    value: data.body,
                  })
                ),

                m(
                  "fieldset.form-group",
                  m("input.form-control.form-control-lg", {
                    type: "text",
                    disabled: state.disabled,
                    placeholder: "Enter tags",
                    onchange: (e) => (data.tagList = e.target.value),
                    value: data.tagList,
                  })
                ),

                m(
                  "button.btn-lg.pull-xs-right.btn-primary",
                  { onclick: (e) => submitData(data) },
                  " Publish Article "
                ),
              ])
            )
          )
        )
      ),
  }
}
export default Editor
