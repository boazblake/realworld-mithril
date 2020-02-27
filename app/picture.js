const initCam = (video, mdl) => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: 426,
          height: 202,
          facingMode: { camera: "environment" }
        }
      })
      .then(
        (stream) => {
          mdl.stream = stream
          video.srcObject = stream
          video.play()
          mdl.video = video
        },
        (e) => console.log(e)
      )
  }
}

const draw = (mdl) => {
  let image = new Image()
  document
    .getElementById("canvas")
    .getContext("2d")
    .drawImage(mdl.video, 0, 0, 426, 202)
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
          width: 426,
          height: 202,
          autoplay: true,
          playsinline: true
        }),
        m("canvas", {
          style: { display: "none" },
          id: "canvas"
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
