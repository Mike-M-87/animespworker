export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'POST') {
			const formData = await request.formData();

			const pagevalue = formData.get('page');
			const page = typeof pagevalue === "string" ? pagevalue.split("https://subsplease.org/shows/")?.[1]?.replace(/\//g, '') : null;
			const title = formData.get('title') as string;
			const season = parseInt(formData.get('season') as string, 10); // Parse season as integer
			const episode = parseInt(formData.get('episode') as string, 10); // Parse episode as integer
			const summary = formData.get('summary') as string;
			const image_url = formData.get('image_url') as string;

			try {
				if (page && title && !isNaN(season) && !isNaN(episode) && summary) {
					const newAnime: AnimePage = {
						title,
						season,
						episode,
						summary,
						timestamp: "",
						image_url
					}
					await env.FAVS.put(page.toString(), JSON.stringify(newAnime));
					return new Response(renderMessagePage(false, `"${title}" has been added to your FAVS.`), { headers: { 'Content-Type': 'text/html' } });
				} else {
					throw new Error('All fields are required and season/episode must be valid numbers.');
				}
			} catch (error: any) {
				return new Response(renderMessagePage(true, 'Error adding anime to favourite: ' + error.message), { headers: { 'Content-Type': 'text/html' } });
			}
		}
		return new Response(formPage(), { headers: { 'Content-Type': 'text/html' } });
	},
	async scheduled(event, env, ctx): Promise<void> {
		await RunAction(env)
	},
} satisfies ExportedHandler<Env>;


async function RunAction(env: Env) {
	console.log("I ran");
	const res = await processSchedule(env)
	if (res) {
		await fetch(`https://api.telegram.org/bot${env.TELBOT_KEY}/sendMessage`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				chat_id: env.TELBOT_CHAT,
				text: `<blockquote expandable>❌❌❌ Error: ${res}</blockquote>`,
				parse_mode: 'HTML',
			})
		});
	}
}

async function getSchedule() {
	const url = "https://subsplease.org/api?f=schedule&h=true&tz=Etc/GMT";

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error("Subsplease response not ok " + response?.statusText)
	}
	const data = await response.json();
	return data as TodayScheduleResp;
}


async function sendNotification(photodata: TelPhotoReq, env: Env) {
	const response = await fetch(`https://api.telegram.org/bot${env.TELBOT_KEY}/sendPhoto`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(photodata)
	});
	const telresp = (await response.json()) as TelbotResp;
	if (telresp) {
		if (!telresp.ok) {
			throw new Error(`Telegram errorcode: ${telresp.error_code} -> ${telresp.description}`)
		}
	} else {
		throw new Error("Empty telegram response")
	}
}

async function processSchedule(env: Env) {
	try {
		const scheduleData = await getSchedule();
		const currentTime = new Date()
		const currentDate = currentTime.toISOString().split('T')[0];


		// let favkeys: any = [];
		// let cursor = null;
		// do {
		// 	const listResponse: any = await env.FAVS.list({ cursor });
		// 	favkeys = favkeys.concat(listResponse.keys);
		// 	cursor = listResponse.cursor;
		// } while (cursor);
		// const favs = favkeys.map((f: any) => f.name)


		for (const item of scheduleData.schedule) {
			const checkValue = await env.FAVS.get(item.page);
			if (!checkValue || !item.aired) {
				continue;
			}

			const timeObj = new Date(`${currentDate}T${item.time}:00.00Z`);
			if (timeObj > currentTime) {
				continue
			}

			let animeData: AnimePage | null = null;
			try {
				animeData = JSON.parse(checkValue);
			} catch (error) {
				animeData = null;
			}

			if (!animeData) {
				animeData = {
					season: 1,
					episode: 0,
					timestamp: "",
					image_url: "",
					title: item.title,
					summary: "Watch " + item.title
				}
			}

			if (!animeData.image_url) {
				animeData.image_url = item.image_url ? `https://subsplease.org${item.image_url.replace(/\\\//g, '/')}` : "https://picsum.photos/225/318"
			}

			if (animeData.timestamp == currentDate) {
				continue; // Skip already sent items
			}

			const previousEpisode = animeData.episode;

			const newPhoto = {
				chat_id: env.TELBOT_CHAT,
				photo: animeData.image_url,
				caption: `<blockquote><b>${item.title}</b></blockquote>\n───────────────────\n➤ <b>Season: ${animeData.season.toString().padStart(2, "0")}</b>\n➤ <b>Episode: ${(previousEpisode + 1).toString().padStart(2, "0")}</b>\n➤ <b>Time: ${timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: "Africa/Nairobi" })}</b>\n➤ <b>Page: <a href="https://subsplease.org/shows/${item.page}">Subsplease Link</a></b>\n───────────────────\n<blockquote expandable><i>${animeData.summary}</i></blockquote>`,
				parse_mode: 'HTML',
			};

			await sendNotification(newPhoto, env);

			const newAnimeData = {
				...animeData,
				episode: previousEpisode + 1,
				timestamp: currentDate
			}

			await env.FAVS.put(item.page, JSON.stringify(newAnimeData));
		}
		return null
	} catch (error: any) {
		return error?.message || "Could not process schedule"
	}
}

interface AnimePage {
	title: string;
	image_url: string;
	season: number;
	episode: number;
	summary: string;
	timestamp: string
}
interface TodaySchedule {
	title: string;
	page: string;
	image_url: string;
	time: string;
	aired: boolean;
}

// Type for the entire schedule response
interface TodayScheduleResp {
	tz: string;
	schedule: TodaySchedule[];
}

interface TelPhotoReq {
	chat_id: string;
	photo: string;
	caption: string;
	parse_mode: string;
}

interface TelbotResp {
	ok: boolean;
	error_code: number;
	description: string;
}


function renderMessagePage(isError: boolean, messageContent: string): string {
	return `
	<!DOCTYPE html>
	<html>
	<head>
	  <title>Success</title>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <script src="https://cdn.tailwindcss.com"></script>
	</head>

	<style>
	  .maincontainer {
	    background-image: url("https://r4.wallpaperflare.com/wallpaper/683/96/3/solo-leveling-sung-jin-woo-manga-anime-boys-hd-wallpaper-333b13cd2dc9fbf52f06e2e7d83be858.jpg");
	    background-position: center;
	    background-repeat: no-repeat;
	    background-size: cover;
	  }
	</style>

	<body>
	  <div class="maincontainer text-white flex h-svh w-svw bg-black flex-col justify-center items-center">
	    <div
	      class="w-full max-w-3xl p-10 bg-black bg-opacity-60 backdrop-blur-lg border dark:border-b-white/50 dark:border-t-white/50 border-b-white/20 sm:border-t-white/20 shadow-[20px_0_20px_20px] shadow-slate-500/10 dark:shadow-white/20 rounded-lg border-white/20 border-l-white/20 border-r-white/20 sm:shadow-sm lg:rounded-xl lg:shadow-none">

	      <div class="flex flex-col">
	        <h3 class="text-xl font-semibold leading-6 tracking-tighter ${isError ? "text-red-500" : "text-green-500"}">
	          ${messageContent}
					</h3>
				</div>

				<a href="https://animespworker.micminn872837.workers.dev"
					class="w-fit mx-auto mt-6 p-4 hover:bg-black hover:text-white hover:ring hover:ring-white transition duration-300 flex items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-black" > Go
					Back
				</a>
			</div>
  	</div>
	</body>
	</html>`;
}


function formPage(): string {
	return `
	<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>

<style>
  .maincontainer {
    background-image: url("https://r4.wallpaperflare.com/wallpaper/683/96/3/solo-leveling-sung-jin-woo-manga-anime-boys-hd-wallpaper-333b13cd2dc9fbf52f06e2e7d83be858.jpg");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }
</style>

<body>
  <div
    class="maincontainer px-3 py-5 text-white flex min-h-svh h-full w-svw bg-black flex-col justify-center items-center">

    <div class="text-foreground font-semibold text-2xl tracking-tighter mx-auto flex items-center gap-2">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />
        </svg>
      </div>
      Add Anime to Favourites
    </div>


    <div
      class="w-full max-w-3xl mt-5 bg-black bg-opacity-60 backdrop-blur-lg border dark:border-b-white/50 dark:border-t-white/50 border-b-white/20 sm:border-t-white/20 shadow-[20px_0_20px_20px] shadow-slate-500/10 dark:shadow-white/20 rounded-lg border-white/20 border-l-white/20 border-r-white/20 sm:shadow-sm lg:rounded-xl lg:shadow-none">

      <div class="flex flex-col p-10 pb-5">
        <h3 class="text-xl font-semibold leading-6 tracking-tighter">Receive notifications for this anime</h3>
        <p class="mt-1.5 text-sm font-medium text-white/50">Enter the anime details below.
        </p>
      </div>


      <form method="post" class="p-10 pt-0 flex flex-col gap-4">
        <div>
          <div>
            <div
              class="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
              <div class="flex justify-between">
                <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
                  Page (Subsplease anime page)
                </label>
              </div>
              <input required type="text" name="page" placeholder="https://subsplease.org/shows/demon-slayer"
                autocomplete="off"
                class="block w-full border-0 bg-transparent py-1 text-sm file:my-1 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
            </div>
          </div>
        </div>
        <div>
          <div>
            <div
              class="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
              <div class="flex justify-between">
                <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
                  Title
                </label>
              </div>
              <input required type="text" name="title" placeholder="Demon Slayer" autocomplete="off"
                class="block w-full border-0 bg-transparent py-1 text-sm file:my-1 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
            </div>
          </div>
        </div>
        <div>
          <div>
            <div
              class="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
              <div class="flex justify-between">
                <label
                  class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">Season</label>
              </div>
              <div class="flex items-center">
                <input required type="number" name="season"
                  class="block w-full border-0 bg-transparent py-1 text-sm file:my-1 placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground">
              </div>
            </div>
          </div>
        </div>


        <div>
          <div>
            <div
              class="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
              <div class="flex justify-between">
                <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
                  Last Episode Aired (0 if none)</label>
              </div>
              <div class="flex items-center">
                <input required type="number" name="episode" value="0"
                  class="block w-full border-0 bg-transparent py-1 text-sm file:my-1 placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground">
              </div>
            </div>
          </div>
        </div>

        <div>
          <div>
            <div
              class="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
              <div class="flex justify-between">
                <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
                  Summary
                </label>
              </div>
              <div class="flex items-center">
                <textarea maxlength="700" required name="summary"
                  class="block w-full border-0 bg-transparent py-1 text-sm file:my-1 placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground"></textarea>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div>
            <div
              class="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
              <div class="flex justify-between">
                <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
                  Image Url (Optional. Leave empty to assign default subsplease image)
                </label>
              </div>
              <div class="flex items-center">
                <input type="text" name="image_url" placeholder="https://..." autocomplete="off"
                  class="block w-full border-0 bg-transparent py-1 text-sm file:my-1 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
              </div>
            </div>
          </div>
        </div>

        <button
          class="w-full mt-6 p-4 hover:bg-black hover:text-white hover:ring hover:ring-white transition duration-300 inline-flex items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-black"
          type="submit">Add
        </button>

      </form>

    </div>

    <a href="https://t.me/jinwooanimes"
      class="w-fit mx-auto mt-5 px-4 py-3 gap-2 hover:bg-black hover:text-white hover:ring hover:ring-white transition duration-300 flex items-center justify-center rounded-full text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white border dark:border-white/70 border-white/70  shadow-[10px_5px_10px_10px] shadow-slate-500/10 dark:shadow-white/20">

      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" height="2em" fill="white">
        <path
          d="M248 8C111 8 0 119 0 256S111 504 248 504 496 393 496 256 385 8 248 8zM363 176.7c-3.7 39.2-19.9 134.4-28.1 178.3-3.5 18.6-10.3 24.8-16.9 25.4-14.4 1.3-25.3-9.5-39.3-18.7-21.8-14.3-34.2-23.2-55.3-37.2-24.5-16.1-8.6-25 5.3-39.5 3.7-3.8 67.1-61.5 68.3-66.7 .2-.7 .3-3.1-1.2-4.4s-3.6-.8-5.1-.5q-3.3 .7-104.6 69.1-14.8 10.2-26.9 9.9c-8.9-.2-25.9-5-38.6-9.1-15.5-5-27.9-7.7-26.8-16.3q.8-6.7 18.5-13.7 108.4-47.2 144.6-62.3c68.9-28.6 83.2-33.6 92.5-33.8 2.1 0 6.6 .5 9.6 2.9a10.5 10.5 0 0 1 3.5 6.7A43.8 43.8 0 0 1 363 176.7z" />
      </svg>
      Join Updates Channel
    </a>

  </div>
</body>
</html>`;
}