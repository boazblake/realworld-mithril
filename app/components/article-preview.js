export const ArticlePreview = () => {
  return {
    view: ({
      attrs: {
        article: {
          author: { image, username },
          createdAt,
          favoritesCount,
          title,
          description,
          tagList,
          slug,
        },
      },
    }) => {
      return m(".article-preview", [
        m(".article-meta", [
          m(
            m.route.Link,
            { href: `/profile/${username}`, options: { replace: true } },
            m("img", { src: image })
          ),

          m(".info", [
            m(
              m.route.Link,
              {
                class: "author",
                href: `/profile/${username}`,
                options: { replace: true },
              },
              username
            ),
            m("span.date", createdAt),
          ]),
          m(
            "button.btn btn-outline-primary btn-sm pull-xs-right",

            [m("i.ion-heart"), m("span", favoritesCount)]
          ),
        ]),
        m(m.route.Link, { class: "preview-link", href: `/article/${slug}` }, [
          m("h1", title),
          m("p", description),
          m(
            "ul.tag-list",
            tagList.map((tag) => m("li.tag-default tag-pill tag-outline", tag))
          ),
          m("span", "Read more..."),
        ]),
      ])
    },
  }
}
