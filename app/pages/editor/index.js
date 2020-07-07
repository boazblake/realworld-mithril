import Http from "Http"
import { submitArticleTask, loadArticleTask } from "./model"

const Editor = ({ attrs: { mdl } }) => {
  let data = {}
  const state = {}

  const initEditor = (mdl) => {
    const onSuccess = ({ article }) => {
      data = article
      console.log(data)
    }

    const onError = (errors) => {
      state.errors = errors
    }

    if (mdl.slug) {
      console.log(mdl)
      loadArticleTask(Http)(mdl)(mdl.slug).fork(onError, onSuccess)
    }
  }

  const submitData = (data) => {
    const onSuccess = ({ article: { slug } }) => {
      console.log(slug)
      m.route.set(`/article/${slug}`)
    }

    const onError = (errors) => {
      state.errors = errors
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
                m(
                  "fieldset.form-group",
                  m("input.form-control.form-control-lg", {
                    type: "text",
                    placeholder: "Article Title",
                    onchange: (e) => (data.title = e.target.value),
                    value: data.title,
                  })
                ),

                m(
                  "fieldset.form-group",
                  m("input.form-control.form-control-lg", {
                    type: "text",
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
                    onchange: (e) => (data.body = e.target.value),
                    value: data.body,
                  })
                ),

                m(
                  "fieldset.form-group",
                  m("input.form-control.form-control-lg", {
                    type: "text",
                    placeholder: "Enter tags",
                    onchange: (e) => (data.tags = e.target.value),
                    value: data.tags,
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
