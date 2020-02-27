const getTagsTask = (http) => (mdl) => http.getTask(mdl)("tags")
const getArticlesTask = (http) => (mdl) => (state) => (data) =>
  http.getTask(mdl)(
    `articles?limit=20&offset=${state.offset}&tag=${data.tags.current}`
  )

export const loadDataTask = (http) => (mdl) => (state) => (data) =>
  Task.of((tags) => (articles) => ({ ...tags, ...articles }))
    .ap(getTagsTask(http)(mdl))
    .ap(getArticlesTask(http)(mdl)(state)(data))
