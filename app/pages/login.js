import Http from "Http"

export const loginTask = (http) => (mdl) => (user) =>
  http.postTask(mdl)("users/login")({ user })

const Login = () => {
  const state = { errors: {} }
  const data = {
    email: "",
    password: "",
  }

  const onSubmit = (mdl) => {
    const onSuccess = ({ user }) => {
      sessionStorage.setItem("token", `Token ${user.token}`)
      sessionStorage.setItem("user", JSON.stringify(user))
      mdl.user = user
      m.route.set("/home")
    }

    const onError = (errors) => {
      state.errors = errors
      console.log(state.errors)
    }

    loginTask(Http)(mdl)(data).fork(onError, onSuccess)
  }

  return {
    view: ({ attrs: { mdl } }) =>
      m(
        "div.auth-page",
        m(
          "div.container.page",
          m(
            "div.row",
            m("div.col-md-6.offset-md-3.col-xs-12", [
              m("h1.text-xs-center", "Login"),
              m(
                "p.text-xs-center",
                m(m.route.Link, { href: "/register" }, "Need an account?"),
                state.errors["email or password"] &&
                  m(
                    ".error-messages",
                    m(
                      "span",
                      `email or password  ${state.errors["email or password"]}`
                    )
                  )
              ),
              m("form", [
                m(
                  "fieldset.form-group",
                  m("input.form-control.form-control-lg", {
                    type: "text",
                    placeholder: "email",
                    onchange: (e) => (data.email = e.target.value),
                    value: data.email,
                    onblur: (e) => state.isSubmitted && validate,
                  }),
                  state.errors.email &&
                    m(".error-messages", m("span", state.errors.email))
                ),
                m(
                  "fieldset.form-group",
                  m("input.form-control.form-control-lg", {
                    type: "password",
                    placeholder: "password",
                    onchange: (e) => (data.password = e.target.value),
                    value: data.password,
                    onblur: (e) => state.isSubmitted && validate,
                  })
                ),
                m(
                  "button.btn.btn-lg.btn-primary.pull-xs-right",
                  { type: "submit", onclick: (e) => onSubmit(mdl) },
                  "Login"
                ),
              ]),
            ])
          )
        )
      ),
  }
}

export default Login
