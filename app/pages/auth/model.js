export * from "./model.validate"

export const loginTask = (http) => (mdl) => (user) =>
  http.postTask(mdl)("users/login")({ user })

export const registerTask = (http) => (mdl) => (user) =>
  http.postTask(mdl)("users")({ user })
