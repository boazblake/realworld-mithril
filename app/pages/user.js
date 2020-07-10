import Http from "Http"
import { log } from "Utils"

const logout = () => {
  sessionStorage.clear()
  m.route.set("/home")
}

const submitTask = (http) => (mdl) => (data) => http.putTask(mdl)("user")(data)

const User = ({
  attrs: {
    mdl: {
      user: { image, username, password, bio, email },
    },
  },
}) => {
  let data = { image, username, password, bio, email }
  const submit = (mdl, data) => {
    const onSuccess = ({ user }) => {
      sessionStorage.setItem("user", JSON.stringify(user))
      mdl.user = user
      console.log(mdl.user)
      m.route.set("/home")
    }
    const onError = log("error")
    submitTask(Http)(mdl)(data).fork(onError, onSuccess)
  }

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
                    m("textarea.form-control.form-control-lg", {
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
                    { onclick: (e) => submit(mdl, data) },
                    " Update Settings "
                  ),
                  m(
                    "button.btn.btn-outline-danger.pull-xs-right",
                    { onclick: (e) => logout(mdl, data) },
                    "Or click here to logout."
                  ),
                ])
              ),
            ])
          )
        )
      ),
  }
}

export default User
