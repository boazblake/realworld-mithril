export const log = (m) => (v) => {
  console.log(m, v)
  return v
}

const secureImg = (url) =>
  url.match(/(https)./) ? url : url.replace("http", "https")

export const sanitizeImg = (url) =>
  url && url.match(/\.(jpeg|jpg|gif|png|svg)$/) ? secureImg(url) : ""

export const errorViewModel = (err) =>
  Object.keys(err).map((k) => ({ key: k, values: err[k] }))
