const api = "https://conduit.productionready.io/api/"

const onProgress = (mdl) => (e) => {
  if (e.lengthComputable) {
    mdl.state.loadingProgress.max = e.total
    mdl.state.loadingProgress.value = e.loaded
    m.redraw()
  }
}

function onLoad() {
  return false
}

const onLoadStart = (mdl) => (e) => {
  mdl.state.isLoading = true
  return false
}

const onLoadEnd = (mdl) => (e) => {
  mdl.state.isLoading = false
  mdl.state.loadingProgress.max = 0
  mdl.state.loadingProgress.value = 0
  return false
}

const xhrProgress = (mdl) => ({
  config: (xhr) => {
    xhr.onprogress = onProgress(mdl)
    xhr.onload = onLoad
    xhr.onloadstart = onLoadStart(mdl)
    xhr.onloadend = onLoadEnd(mdl)
  },
})

export const parseHttpError = (mdl) => (rej) => (e) => {
  mdl.state.isLoading = false
  return rej(e.response.errors)
}

export const parseHttpSuccess = (mdl) => (res) => (data) => {
  mdl.state.isLoading = false
  return res(data)
}

const getUserToken = () =>
  sessionStorage.getItem("token")
    ? { authorization: sessionStorage.getItem("token") }
    : ""

const call = (_headers) => (method) => (mdl) => (url) => (body) => {
  if (["POST", "PUT", "DELETE"].includes(method) && !mdl.state.isLoggedIn()) {
    if (!["/login", "/register"].includes(mdl.slug)) {
      return Task.rejected(m.route.set("/register"))
    }
  }

  mdl.state.isLoading = true
  return new Task((rej, res) =>
    m
      .request({
        method,
        url: api + url,
        headers: {
          "content-type": "application/json",
          ..._headers,
        },
        body,
        withCredentials: false,
        ...xhrProgress(mdl),
      })
      .then(parseHttpSuccess(mdl)(res), parseHttpError(mdl)(rej))
  )
}

const Http = {
  getTask: (mdl) => (url) => call(getUserToken())("GET")(mdl)(url)(null),
  deleteTask: (mdl) => (url) => call(getUserToken())("DELETE")(mdl)(url)(null),
  postTask: (mdl) => (url) => (data) =>
    call(getUserToken())("POST")(mdl)(url)(data),
  putTask: (mdl) => (url) => (data) =>
    call(getUserToken())("PUT")(mdl)(url)(data),
}

export default Http
