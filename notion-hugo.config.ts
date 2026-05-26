import { UserConfig } from "./src/config"

const userConfig: UserConfig = {
  base_url: "https://lampseeker.github.io",
  mount: {
    manual: true,
    databases: [
      {
        database_id: "f695b029-aea6-82ea-a34f-016e7e6cfd45",
        target_folder: "posts",
      },
      {
        database_id: "36c5b029-aea6-8015-b401-e4f78b3ec744",
        target_folder: "projects",
      },
    ],
    pages: [
      {
        page_id: "2f35b029-aea6-83dd-9283-016b5bce45d7",
        target_folder: ".",
      },
    ],
  },
}

export default userConfig
