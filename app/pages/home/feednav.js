import { without } from "ramda"

export const FeedNav = ({ attrs: { fetchData } }) => {
  return {
    view: ({ attrs: { mdl, data } }) =>
      m(
        ".feed-toggle",
        m("ul.nav nav-pills outline-active", [
          m(
            "li.nav-item",
            m(
              `.nav-link ${data.tags.current == "" && "active"}`,
              {
                onclick: (e) => {
                  data.tags.current = ""
                  fetchData(mdl.mdl)
                },
              },
              "Global Feed"
            )
          ),

          data.tags.selected.map((tag) =>
            m(
              "li.nav-item",
              m(`.nav-link ${data.tags.current == tag && "active"}`, [
                m(
                  "span",
                  {
                    onclick: (e) => {
                      data.tags.current = tag
                      fetchData(mdl.mdl)
                    },
                  },
                  tag
                ),
                m("i.ion-close-circled", {
                  onclick: (e) =>
                    (data.tags.selected = without(tag, data.tags.selected)),
                }),
              ])
            )
          ),
        ])
      ),
  }
}
