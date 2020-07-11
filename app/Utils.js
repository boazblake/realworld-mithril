export const log = (m) => (v) => {
  console.log(m, v)
  return v
}

export const sanitizeImg = (url) =>
  url && url.match(/\.(jpeg|jpg|gif|png|svg)$/) ? url : null

export const errorViewModel = (err) =>
  Object.keys(err).map((k) => ({ key: k, values: err[k] }))
