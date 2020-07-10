import { without } from "ramda"

export const FeedNav = ({ attrs: { fetchData } }) => {
  return {
    view: ({ attrs: { mdl, data } }) => {
      return m(
        ".feed-toggle",
        m("ul.nav nav-pills outline-active", [
          mdl.state.isLoggedIn() &&
            m(
              "li.nav-item",
              m(
                `a.nav-link ${data.tags.current == "feed" && "active"}`,
                {
                  onclick: (e) => {
                    data.tags.current = "feed"
                    fetchData(mdl)
                  },
                },
                "Your Feed"
              )
            ),

          m(
            "li.nav-item",
            m(
              `a.nav-link ${data.tags.current == "" && "active"}`,
              {
                onclick: (e) => {
                  data.tags.current = ""
                  fetchData(mdl)
                },
              },
              "Global Feed"
            )
          ),

          data.tags.selected.map((tag) =>
            m(
              "li.nav-item",
              m(`a.nav-link ${data.tags.current == tag && "active"}`, [
                m(
                  "span",
                  {
                    onclick: (e) => {
                      data.tags.current = tag
                      fetchData(mdl)
                    },
                  },
                  `# ${tag}`
                ),
                m("i.ion-close-circled.p-5", {
                  onclick: (e) =>
                    (data.tags.selected = without(tag, data.tags.selected)),
                }),
              ])
            )
          ),
        ])
      )
    },
  }
}
