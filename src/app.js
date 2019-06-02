import m from "mithril"
import Stream from "mithril-stream"
import MT from "moment"

const NewMsg = {
  view: ({ attrs: { msg, model } }) =>
    m(
      `.new-msg ${model.user.id() == msg.id ? "mine" : "friend"}`,
      {
        onclick: () => (model.current = msg)
      },
      [
        m(".msg-top", [
          m(".from", msg.from),
          m(".time", MT(msg.time).fromNow())
        ]),
        m(".msg-bottom", m("code.content", msg.msg))
      ]
    )
}

const Hamburger = {
  view: ({ attrs: { model } }) =>
    m(
      "button.hamburger.btn",
      {
        onclick: () => model.toggleMenu(!model.toggleMenu())
      },
      model.toggleMenu() ? "X" : "menu"
    )
}

const Menu = {
  view: ({ attrs: { model } }) =>
    m(".menu", {}, [
      m(Hamburger, { model }),
      m(
        "code.code",
        "Proof of concept app for chat built in mithril and using pubnub"
      ),
      m(
        "button.btn",
        {
          onclick: () => {
            model.user.name("")
            m.route.set("/login")
          }
        },
        "logout"
      )
    ])
}

const Header = {
  open: false,
  view: ({ attrs: { model } }) => m(".header", {}, [m(Hamburger, { model })])
}
const Body = {
  view: ({ attrs: { model } }) =>
    m(
      ".body",
      model.msgs.map((msg, idx) => m(NewMsg, { key: idx, msg, model }))
    )
}
const Footer = {
  newMsg: Stream(""),
  view: ({ state, attrs: { model } }) =>
    m("form.footer", {}, [
      m("input.input", {
        onkeyup: (e) => state.newMsg(e.target.value),
        value: state.newMsg(),
        placeholder: "Add message here"
      }),
      m(
        "button.btn",
        {
          onclick: (e) => {
            let ctx = {
              id: model.user.id(),
              from: model.user.name(),
              msg: state.newMsg(),
              time: MT()
            }
            model.chat.publish({
              channel: "mithril-chat",
              message: JSON.stringify(ctx)
            })
            state.newMsg("")
          },
          disabled: state.newMsg().length < 2
        },
        "send"
      )
    ])
}

const Chat = {
  view: ({ attrs: { model } }) =>
    m(
      ".chat",
      m(Header, { model }),
      model.toggleMenu() && m(Menu, { model }),
      m(Body, { model }),
      m(Footer, { model })
    )
}

const Login = {
  view: ({ attrs: { model } }) =>
    m(
      "form.login",
      {
        onsubmit: (e) => {
          e.preventDefault()
        }
      },
      [
        m("h1.h1", "Enter a username to start chatting"),
        m("input.input", {
          onkeyup: (e) => model.user.name(e.target.value),
          placeholder: "minimum 2 letters"
        }),
        m(
          "button.btn",
          {
            onclick: () => {
              m.route.set("/chat")
            },
            disabled: model.user.name().length < 3
          },
          "login"
        )
      ]
    )
}

export const routes = (model) => ({
  "/login": {
    render: () => {
      return m(Login, { model })
    }
  },
  "/chat": {
    onmatch: () => {
      return model.user.name() ? m(Chat, { model }) : m.route.set("/login")
    },
    render: () => {
      return m(Chat, { model })
    }
  }
})
