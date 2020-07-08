export const FollowFavorite = () => {
  return {
    view: ({
      attrs: {
        mdl,
        data: {
          author: { username, image },
          createdAt,
          slug,
        },
      },
    }) => {
      return m(
        ".article-actions",
        m(".article-meta", [
          m(
            m.route.Link,
            { href: `profile/${username}` },
            m("img", { src: image })
          ),
          m(".info", [
            m(
              m.route.Link,
              { class: "author", href: `profile/${username}` },
              username
            ),
            m("span.date", createdAt),
          ]),
          mdl.user.username == username
            ? m(
                m.route.Link,
                {
                  class: "btn btn-sm btn-outline-secondary",
                  href: `/editor/${slug}`,
                  selector: "button",
                },
                [m("i.ion-edit"), "Edit Article"]
              )
            : m("button.btn.btn-sm.btn-outline-secondary", [
                m("i.ion-plus-round"),
                " ",
                m.trust("&nbsp;"),
                ` Follow ${username} `,
                m("span.counter", "(10)"),
              ]),
          " ",
          m.trust("&nbsp;"),
          m.trust("&nbsp;"),
          " ",
          m("button.btn.btn-sm.btn-outline-primary", [
            m("i.ion-heart"),
            " ",
            m.trust("&nbsp;"),
            " Favorite Post ",
            m("span.counter", "(29)"),
          ]),
        ])
      )
    },
  }
}
