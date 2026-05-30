import { UserConfig } from "./src/config"

const userConfig: UserConfig = {
  base_url: "https://lampseeker-github-io.pages.dev",
  root_page_id: "ec55b029-aea6-837e-811d-017848583280",
  mount: {
    manual: true,
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
        database_id: "3635b029-aea6-80e2-835d-cbe9bc8776c7",
        target_folder: "projects/ark-raiders-rl",
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
