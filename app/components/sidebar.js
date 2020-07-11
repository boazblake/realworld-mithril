import { uniq } from "ramda"

export const SideBar = () => {
  const selectTag = (data, tag) =>
    (data.tags.selected = uniq(data.tags.selected.concat([tag])))

  return {
    view: ({ attrs: { data } }) => {
      const isSelected = (tag) =>
        data.tags.selected.includes(tag) && "tag-selected"

      return m(".sidebar", [
        m("p", "Popular Tags"),
        m(
          ".tag-list",
          data.tags.tagList.map((tag) =>
            m(
              "a.tag-pill.tag-default",
              {
                class: isSelected(tag),
                onclick: (e) => selectTag(data, tag),
              },
              tag
            )
          )
        ),
      ])
    },
  }
}
