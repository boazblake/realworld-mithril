import m from "mithril"
import Stream from "mithril-stream"
import { routes } from "./app.js"
import PubNub from "pubnub"
import { publishKey, subscribeKey } from "../settings.js"
import { v1 } from "uuid"
const root = document.body

var pubnub = new PubNub({
  publishKey,
  subscribeKey
})
pubnub.subscribe({ channels: ["mithril-chat"] })

const model = {
  chat: pubnub,
  user: {
    name: Stream(""),
    id: Stream(v1())
  },
  msgs: []
}

model.chat.addListener({
  message: ({ message }) => {
    console.log(message)
    model.msgs.push(JSON.parse(message))
    m.redraw()
  }
})

m.route(root, "/login", routes(model))
