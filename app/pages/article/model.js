const getCommentsTask = (http) => (mdl) => (slug) =>
  http.getTask(mdl)(`articles/${slug}/comments`)
const getArticleTask = (http) => (mdl) => (slug) =>
  http.getTask(mdl)(`articles/${slug}`)

export const loadDataTask = (http) => (mdl) => (slug) =>
  Task.of((article) => (comments) => ({ ...article, ...comments }))
    .ap(getArticleTask(http)(mdl)(slug))
    .ap(getCommentsTask(http)(mdl)(slug))
