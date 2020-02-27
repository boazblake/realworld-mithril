const getProfileTask = (http) => (mdl) => (username) =>
  http.getTask(mdl)(`profiles/${username}`)

const getArticlesTask = (http) => (mdl) => (state) => (username) =>
  http.getTask(mdl)(
    `articles?limit=20&offset=${state.offset}&author=${username}`
  )

export const loadDataTask = (http) => (mdl) => (state) => (data) =>
  Task.of((profile) => (articles) => ({ ...profile, ...articles }))
    .ap(getProfileTask(http)(mdl)(mdl.slug))
    .ap(getArticlesTask(http)(mdl)(state)(mdl.slug))
