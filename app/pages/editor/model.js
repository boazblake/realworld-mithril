export const loadArticleTask = (http) => (mdl) => (slug) =>
  http.getTask(mdl)(`articles/${slug}`)

export const submitArticleTask = (http) => (mdl) => (article) =>
  http.postTask(mdl)("articles")({ article })
