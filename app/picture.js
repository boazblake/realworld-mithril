const initCam = (video, mdl) => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
      mdl.stream = stream
      video.srcObject = stream
      video.play()
    })
  }
}

const draw = (mdl) => {
  let video = document.getElementById("video")
  let image = new Image()
  document
    .getElementById("canvas")
    .getContext("2d")
    .drawImage(video, 0, 0, 640, 480)
  image.src = document.getElementById("canvas").toDataURL("image/webp")
  mdl.card[mdl.side] = image
  m.route.set("/addcard")
}

const Picture = () => {
  return {
    view: ({ attrs: { mdl } }) =>
      m(".container", [
        m("video", {
          id: "video",
          oncreate: ({ dom }) => initCam(dom, mdl),
          width: 640,
          height: 480,
          autoplay: true,
          playsinline: true
        }),
        m("canvas", {
          style: { display: "none" },
          id: "canvas",
          width: 640,
          height: 480
        }),
        m("button", { onclick: () => draw(mdl) }, "Save")
      ]),
    onremove: ({ attrs: { mdl } }) =>
      mdl.stream.getTracks().forEach((t) => {
        t.stop()
      })
  }
}

export default Picture
