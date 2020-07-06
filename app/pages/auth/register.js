import Http from "Http"
import { validateRegisterTask, registerTask } from "./model"

const Register = () => {
  const state = { errors: {}, isSubmitted: false, isValid: false }
  const data = {
    username: "",
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

    validateRegisterTask(data).fork(onError, onSuccess)
  }

  const onSubmit = (mdl) => {
    const onSuccess = ({ user }) => {
      state.isValid = true
      mdl.user = user
      sessionStorage.setItem("token", `Token ${user.token}`)
      m.route.set("/home")
      console.log("success", user)
    }

    const onError = (errors) => {
      state.isValid = false
      state.errors = errors
      console.log(errors)
    }

    state.isSubmitted = true
    validateRegisterTask(data)
      .chain(registerTask(Http)(mdl))
      .fork(onError, onSuccess)
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
              m("h1.text-xs-center", "Sign Up"),
              m(
                "p.text-xs-center",
                m(m.route.Link, { href: "/login" }, "Have an account?"),
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
                    placeholder: "Your Name",
                    onchange: (e) => (data.username = e.target.value),
                    value: data.username,
                    onblur: (e) => state.isSubmitted && validate,
                  }),
                  state.errors.username &&
                    state.errors.username.map((error) =>
                      m(".error-messages", m("span", error))
                    )
                ),

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
