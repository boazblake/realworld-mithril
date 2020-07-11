import Http from "Http"
import { errorViewModel } from "Utils"

const registerTask = (http) => (mdl) => (user) =>
  http.postTask(mdl)("users")({ user })

const Register = () => {
  const state = { errors: [] }
  const data = {
    username: "",
    email: "",
    password: "",
  }

  const onSubmit = (mdl) => {
    const onSuccess = ({ user }) => {
      mdl.user = user
      sessionStorage.setItem("token", `Token ${user.token}`)
      m.route.set("/home")
      console.log("success", user)
    }

    const onError = (errors) => (state.errors = errorViewModel(errors))

    state.isSubmitted = true
    registerTask(Http)(mdl)(data).fork(onError, onSuccess)
  }

  return {
    view: ({ attrs: { mdl } }) =>
      m(
        ".auth-page",
        m(
          ".container.page",
          m(
            ".row",
            m(".col-md-6.offset-md-3.col-xs-12", [
              m("h1.text-xs-center", "Sign Up"),
              m(
                "p.text-xs-center",
                m(m.route.Link, { href: "/login" }, "Have an account?")
              ),

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

              m("form", [
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
                    placeholder: "email",
                    onchange: (e) => (data.email = e.target.value),
                    value: data.email,
                  })
                ),
                m(
                  "fieldset.form-group",
                  m("input.form-control.form-control-lg", {
                    type: "password",
                    placeholder: "password",
                    onchange: (e) => (data.password = e.target.value),
                    value: data.password,
                  })
                ),
                m(
                  "button.btn.btn-lg.btn-primary.pull-xs-right",
                  { type: "submit", onclick: (e) => onSubmit(mdl) },
                  "Sign Up"
                ),
              ]),
            ])
          )
        )
      ),
  }
}

export default Register
