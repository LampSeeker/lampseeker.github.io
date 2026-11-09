import { UserConfig } from "./src/config"

const userConfig: UserConfig = {
  root_page_id: "ec55b029-aea6-837e-811d-017848583280",
  mount: {
    manual: true,
    // Databases on the root page with this checkbox property are synced
    // automatically (only checked pages). Entries below just pin a folder/URL.
    auto_public_property: "공개여부",
    databases: [
      {
        database_id: "f695b029-aea6-82ea-a34f-016e7e6cfd45",
        target_folder: "posts",
        query_filter: {
          property: "공개여부",
          checkbox: {
            equals: true,
          },
        },
      },
      {
        database_id: "92b3f165-8e02-49ca-9c68-b7996c2dbaeb",
        target_folder: "projects",
        query_filter: {
          property: "공개여부",
          checkbox: {
            equals: true,
          },
        },
      },
      {
        database_id: "36f5b029-aea6-80e8-b159-f72e8deb05f8",
        target_folder: "study",
        query_filter: {
          property: "공개여부",
          checkbox: {
            equals: true,
          },
        },
      },
    ],
    pages: [
      {
        page_id: "3705b029-aea6-8008-8344-f163a072acbc",
        target_folder: ".",
        url: "/about/",
      },
    ],
  },
}

export default userConfig
