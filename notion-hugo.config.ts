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
        database_id: "92b3f165-8e02-49ca-9c68-b7996c2dbaeb",
        target_folder: "projects",
      },
      {
        database_id: "3635b029-aea6-80e2-835d-cbe9bc8776c7",
        target_folder: "projects/ark-raiders-rl",
      },
    ],
    pages: [
      {
        page_id: "cbabcf56-2b60-493f-8908-f5b510ffef89",
        target_folder: ".",
        url: "/about/",
      },
    ],
  },
}

export default userConfig
