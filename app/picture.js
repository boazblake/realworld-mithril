const OverLay = {
  view: () =>
    m(
      "svg",
      {
        viewBox: "0 0 100 100",
        id: "picture-overlay"
      },
      [
        m("path", {
          d: "M-25,10 L-50,10 L-50,35",
          fill: "none",
          stroke: "white",
          "stroke-width": "3"
        }),
        m("path", {
          d: "M-50,65 L-50,90 L-25,90",
          fill: "none",
          stroke: "white",
          "stroke-width": "3"
        }),
        m("path", {
          d: "M125,90 L150,90 L150,65",
          fill: "none",
          stroke: "white",
          "stroke-width": "3"
        }),
        m("path", {
          d: "M150,35 L150,10 L125,10",
          fill: "none",
          stroke: "white",
          "stroke-width": "3"
        })
      ]
    )
}

const initCam = (video, mdl) => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: 670,
          height: 300,
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
    .drawImage(mdl.video, 0, 0, 670, 300)
  image.src = document.getElementById("canvas").toDataURL("image/webp")
  mdl.card[mdl.side] = image
  m.route.set("/addcard")
}

const Picture = () => {
  return {
    view: ({ attrs: { mdl } }) =>
      m(".container", [
        m("", { id: "picture-container" }, [
          m("video", {
            id: "video",
            oncreate: ({ dom }) => initCam(dom, mdl),
            autoplay: true,
            playsinline: true
          }),
          m(OverLay),
          m("canvas", {
            id: "canvas"
          })
        ]),
        m("button", { onclick: () => draw(mdl) }, "Save")
      ]),
    onremove: ({ attrs: { mdl } }) =>
      mdl.stream.getTracks().forEach((t) => {
        t.stop()
      })
  }
}

export default Picture
