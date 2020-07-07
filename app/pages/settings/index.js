import { loadTask } from "./model"

const Settings = ({ attrs: { mdl } }) => {
  let data = JSON.parse(JSON.stringify(mdl.user))
  return {
    view: ({ attrs: { mdl } }) =>
      m(
        ".settings-page",
        m(
          ".container.page",
          m(
            ".row",
            m(".col-md-6.offset-md-3.col-xs-12", [
              m("h1.text-xs-center", "Your Settings"),
              m(
                "form",
                m("fieldset", [
                  m(
                    "fieldset.form-group",
                    m("input.form-control.form-control-lg", {
                      type: "text",
                      placeholder: "URL of profile picture",
                      onchange: (e) => (data.image = e.target.value),
                      value: data.image,
                    })
                  ),
                  m(
                    "fieldset.form-group",
                    m("input.form-control.form-control-lg", {
                      type: "text",
                      placeholder: "Your Name",
                      onchange: (e) => (data.username = e.target.value),
                      value: data.username,
                    })
                  ),
                  m(
                    "fieldset.form-group",
                    m("input.form-control.form-control-lg", {
                      type: "text",
                      placeholder: "Short bio about you",
                      onchange: (e) => (data.bio = e.target.value),
                      value: data.bio,
                    })
                  ),
                  m(
                    "fieldset.form-group",
                    m(
                      "fieldset.form-group",
                      m("input.form-control.form-control-lg", {
                        type: "text",
                        placeholder: "Email",
                        onchange: (e) => (data.email = e.target.value),
                        value: data.email,
                      })
                    )
                  ),
                  m(
                    "fieldset.form-group",
                    m(
                      "fieldset.form-group",
                      m("input.form-control.form-control-lg", {
                        type: "password",
                        placeholder: "Password",
                        onchange: (e) => (data.password = e.target.value),
                        value: data.password,
                      })
                    )
                  ),
                  m(
                    "button.btn.btn-lg.btn-primary.pull-xs-right",
                    " Update Settings "
                  ),
                ])
              ),
            ])
          )
        )
      ),
  }
}

export default Settings
