import Http from "Http"
import { validateLoginTask, loginTask } from "./model"

const Login = () => {
  const state = { errors: {}, isSubmitted: false, isValid: false }
  const data = {
    email: "",
    password: "",
  }

  const validate = (e) => {
    const onSuccess = (s) => {
      state.isValid = true
    }

    const onError = (errors) => {
      state.isValid = false
      state.errors = errors
    }

    validateLoginTask(data).fork(onError, onSuccess)
  }

  const onSubmit = (mdl) => {
    const onSuccess = ({ user }) => {
      state.isValid = true
      sessionStorage.setItem("token", `Token ${user.token}`)
      sessionStorage.setItem("user", JSON.stringify(user))
      mdl.user = user
      m.route.set("/home")
    }

    const onError = (errors) => {
      state.isValid = false
      state.errors = errors
      console.log(state.errors)
    }

    state.isSubmitted = true
    validateLoginTask(data).chain(loginTask(Http)(mdl)).fork(onError, onSuccess)
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
                  }),
                  state.errors.password &&
                    m(".error-messages", m("span", state.errors.password))
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
