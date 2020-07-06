const getTagsTask = (http) => (mdl) => http.getTask(mdl)("tags")
export const getArticlesTask = (http) => (mdl) => (state) => (data) =>
  data.tags.current == "feed"
    ? http.getTask(mdl)(`articles/feed?limit=20&offset=${state.offset}`)
    : http.getTask(mdl)(
        `articles?limit=20&offset=${state.offset}&tag=${data.tags.current}`
      )

export const loadDataTask = (http) => (mdl) => (state) => (data) =>
  Task.of((tags) => (articles) => ({ ...tags, ...articles }))
    .ap(getTagsTask(http)(mdl))
    .ap(getArticlesTask(http)(mdl)(state)(data))
