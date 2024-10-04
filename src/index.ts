export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'POST') {
      return handlePostRequestPage(request, env);
    }
    if (request.url.includes('favs=true')) {
      return handleGetFavsPage(env);
    }
    return handleGetRequestPage();
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
  return data as ScheduleResp;
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

    const daySchedule = scheduleData?.schedule as TodaySchedule[]
    for (const item of daySchedule) {
      if (!item.aired || !item.page) {
        continue
      }

      const checkValue = await env.FAVS.get(item.page);
      if (!checkValue) {
        continue;
      }

      const timeObj = new Date(`${currentDate}T${item.time}:00.00Z`);
      if (timeObj > currentTime) {
        continue // Skip items that are not aired yet
      }

      let animeData: AnimePage | null = null;
      try {
        animeData = JSON.parse(checkValue);
      } catch (error) {
        animeData = null;
      }

      if (!animeData) {
        continue // Skip items that are not in the KV
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
        caption: `<blockquote><b>${animeData.title || item.title}</b></blockquote>\n───────────────────\n➤ <b>Season: ${animeData.season.toString().padStart(2, "0")}</b>\n➤ <b>Episode: ${(previousEpisode + 1).toString().padStart(2, "0")}</b>\n➤ <b>Time: ${timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: "Africa/Nairobi" })}</b>\n➤ <b>Page: <a href="https://subsplease.org/shows/${item.page}">Subsplease Link</a></b>\n───────────────────\n<blockquote expandable><i>${animeData.summary}</i></blockquote>`,
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
interface ScheduleResp {
  tz: string;
  schedule: TodaySchedule[] | WeekSchedule;
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

interface WeekSchedule {
  Monday: TodaySchedule[];
  Tuesday: TodaySchedule[]
  Wednesday: TodaySchedule[]
  Thursday: TodaySchedule[]
  Friday: TodaySchedule[]
  Saturday: TodaySchedule[]
  Sunday: TodaySchedule[]
}

function parseScheduleOptions(schedule: WeekSchedule): string {
  let optionsHtml = '';
  for (const day of Object.keys(schedule)) {
    const daySchedule = schedule[day as keyof WeekSchedule];
    daySchedule.forEach((show: TodaySchedule) => {
      const date = new Date()
      const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
      date.setDate(date.getDate() + ((dayIndex + 7) - date.getDay()) % 7);
      const formattedDate = date.toISOString().split('T')?.[0];
      optionsHtml += `<option value="${show.page}" data-timestamp="${formattedDate}">${show.title} (${day.slice(0, 3)})</option>`;
    });
  }
  return optionsHtml;
}


async function handlePostRequestPage(request: Request, env: Env): Promise<Response> {
  let isFavs = false;
  try {
    const formData = await request.formData();
    const page = formData.get('page') as string;
    const title = formData.get('title') as string;
    const season = parseInt(formData.get('season') as string, 10);
    const episode = parseInt(formData.get('episode') as string, 10);
    const summary = formData.get('summary') as string;
    const image_url = formData.get('image_url') as string;
    const timestamp = formData.get('timestamp') as string;
    isFavs = (formData.get('isFavs') as string) == "1";

    if (page && title && !isNaN(season) && !isNaN(episode) && summary) {
      const newAnime: AnimePage = {
        title,
        season,
        episode,
        summary,
        timestamp,
        image_url
      }
      await env.FAVS.put(page.toString(), JSON.stringify(newAnime));
      return new Response(renderMessagePage(false, `"${page}" has been ${isFavs ? "edited on" : "added to"} your FAVS.`, isFavs), { headers: { 'Content-Type': 'text/html' } });
    } else {
      throw new Error('All fields are required and season/episode must be valid numbers.');
    }
  } catch (error: any) {
    return new Response(renderMessagePage(true, `Error ${isFavs ? "editing" : "adding"} anime to favourites: ${error?.message || "Unknown error"}`, isFavs), { headers: { 'Content-Type': 'text/html' } });
  }
}

async function handleGetRequestPage(): Promise<Response> {
  const subspleaseResponse = await fetch('https://subsplease.org/api/?f=schedule&tz=Etc/GMT');
  const subspleaseData = (await subspleaseResponse.json()) as ScheduleResp;
  const options = parseScheduleOptions(subspleaseData.schedule as WeekSchedule);
  return new Response(formPage(options), { headers: { 'Content-Type': 'text/html' } });
}

async function handleGetFavsPage(env: Env): Promise<Response> {
  const favourites = await parseFavourites(env)
  return new Response(renderDetailPage(favourites), { headers: { 'Content-Type': 'text/html' } });
}

async function parseFavourites(env: Env): Promise<string> {
  let favouritesHtml = ''
  let favkeys: any = [];
  let cursor = null;
  do {
    const listResponse: any = await env.FAVS.list({ cursor });
    favkeys = favkeys.concat(listResponse.keys);
    cursor = listResponse.cursor;
  } while (cursor);

  for (const key of favkeys) {
    if (!key?.name) continue
    const value = await env.FAVS.get(key.name);
    if (!value) continue
    let animeData: AnimePage | null = null;
    try {
      animeData = JSON.parse(value);
    } catch (error) {
      animeData = null;
    }
    if (animeData) favouritesHtml += renderFavItem(key.name, animeData)
  }

  if (!favouritesHtml) {
    favouritesHtml = "<p class='font-medium text-white/50 mx-auto my-5'>No favourites yet</p>"
  }

  return favouritesHtml
}

const templatePage = `
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">

  <title>Jin Woo Worker</title>
  <meta property="og:title" content="Jin Woo Worker" />

  <meta name="description" content="Notifications update form for Jin Woo Animes telegram channel">
  <meta property="og:description" content="Notifications update form for Jin Woo Animes telegram channel" />

  <meta property="og:url" content="https://animespworker.micminn872837.workers.dev" />

 
  <meta property="og:image" content="https://i.postimg.cc/pd7gnj4H/sl2-1.jpg" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="500" />
  <meta property="og:image:height" content="500" />

  <meta name="theme-color" content="#000" />
  <meta name="color-scheme" content="light dark" />

  <link rel="icon" type="image/png" href="https://i.postimg.cc/jS4R51CP/sl2-1.png" />
  <link rel="apple-touch-icon" href="https://i.postimg.cc/pd7gnj4H/sl2-1.jpg" />

  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="Jin Woo Worker" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

  <meta name="display" content="standalone">
  <link rel="manifest" crossorigin="use-credentials"
    href="https://gist.githubusercontent.com/Mike-M-87/c4bb8d50dd4c5181aebd69978d594fb4/raw/4fe12844f9f252e14a7eebe159bdf9222c45c9c7/manifest1.json" />

  <script src="https://cdn.tailwindcss.com"></script>
</head>


<style>
  .maincontainer {
    background-image: url("https://r4.wallpaperflare.com/wallpaper/683/96/3/solo-leveling-sung-jin-woo-manga-anime-boys-hd-wallpaper-333b13cd2dc9fbf52f06e2e7d83be858.jpg");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    position: fixed;
    top: 0;
    left: 0;
    min-width: 100vw;
    min-height: 100vh;
    z-index: -1;
  }
  summary::marker {
    content: none;
    display: none;
    visibility: hidden;
  }
  summary {
    cursor: pointer;
    list-style: none;
  }
</style>
`


function renderMessagePage(isError: boolean, messageContent: string, isFavs: boolean): string {
  return `
${templatePage}

<body>
  <div class="maincontainer"></div>
  <section class="px-3 py-10 text-white flex min-h-svh h-full w-svw flex-col justify-center items-center">

    <div
      class="w-full max-w-3xl py-7 px-5 sm:p-10 mt-5 bg-black bg-opacity-60 backdrop-blur-md border shadow-[5px_0_5px_5px] shadow-white/10 border-white/40 rounded-2xl">

      <h3 class="text-xl mb-5 font-semibold leading-6 tracking-tighter ${isError ? 'text-red-500' : 'text-green-500'}">
        ${messageContent}
      </h3>


      <a href="/${isFavs ? '?favs=true' : ''}"
        class="w-fit mx-auto px-4 py-3 bg-opacity-60 hover:bg-opacity-70 backdrop-blur-md rounded-full text-sm bg-black text-white border border-white/60 shadow-[5px_5px_5px_5px] shadow-white/10">
        Go Back
      </a>
    </div>
  </section>
</body>

</html>`;
}

function renderDetailPage(favs: string): string {
  return `
${templatePage}
<body>
  <div class="maincontainer"></div>
  <section class="px-3 py-10 text-white flex min-h-svh h-full w-svw flex-col justify-center items-center">

    <div class="text-foreground font-semibold text-2xl tracking-tighter mx-auto flex items-center gap-2">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />
        </svg>
      </div>
      Edit your Favourite Animes
    </div>

    <div
      class="w-full max-w-3xl py-7 px-5 sm:p-10 mt-5 bg-black bg-opacity-60 backdrop-blur-md border shadow-[5px_0_5px_5px] shadow-white/10 border-white/40 rounded-2xl">

      <div class="flex flex-col">
        <h3 class="text-xl font-semibold leading-6 tracking-tighter">
          Favourites
        </h3>
        <p class="text-sm font-medium text-white/50">
          Manage your favourite anime list.
        </p>
      </div>

      <div class="flex mt-5 flex-col gap-4 sm:max-h-[67vh] max-h-[66vh] overflow-y-auto">
        ${favs}
      </div>
    </div>

    <a href="/"
      class="w-fit mx-auto mt-5 px-4 py-3 bg-opacity-60 hover:bg-opacity-70 backdrop-blur-md rounded-full text-sm bg-black text-white border border-white/60 shadow-[5px_5px_5px_5px] shadow-white/10">
      Back to Home
    </a>

  </section>
</body>
</html>
`
}

function renderFavItem(checkKey: string, anime: AnimePage): string {
  return ` 
<details class="hover:bg-black/20 border shadow-[5px_0_5px_5px] shadow-white/10 border-white/40 rounded-xl">
  <summary class="flex items-center gap-2 p-3">
    <span class="-mt-px">${anime.title}</span>
    <div class="ml-auto">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
        stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  </summary>

  <form method="post" class="flex flex-col gap-4 px-3 pb-3">
    <input type="hidden" value="${anime.timestamp}" name="timestamp">
    <input readonly value="${checkKey}" name="page"
      class="bg-transparent mt- text-white/50 text-sm outline-none border-none">
    <input type="hidden" value="1" name="isFavs">

    <div
      class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
      <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
        Title
      </label>
      <input
        class="block w-full border-0 bg-transparent py-1 text-sm  placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground"
        maxlength="150" required type="text" name="title" autocomplete="off" value="${anime.title}">
    </div>


    <div
      class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">

      <label
        class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">Season
      </label>

      <div class="flex items-center">
        <input required type="number" name="season" value="${anime.season}"
          class="block w-full border-0 bg-transparent py-1 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground">
      </div>
    </div>



    <div
      class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
      <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
        Episode (Last Aired, 0 if none)
      </label>
      <div class="flex items-center">
        <input required type="number" name="episode" value="${anime.episode}"
          class="block w-full border-0 bg-transparent py-1 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground">
      </div>
    </div>


    <div
      class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
      <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
        Summary
      </label>
      <div class="flex items-center">
        <textarea
          class="block w-full border-0 bg-transparent py-1 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground"
          rows="3" maxlength="700" required name="summary">${anime.summary}</textarea>
      </div>
    </div>



    <div
      class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
      <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
        Image Url (Optional)
      </label>
      <div class="flex items-center">
        <input type="text" name="image_url" placeholder="https://..." autocomplete="off"
          value="${anime.image_url}"
          class="block w-full border-0 bg-transparent py-1 text-sm  placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
      </div>
    </div>

    <button
      class="w-full hover:bg-white/90 px-4 py-3 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-black"
      type="submit">
      Save
    </button>

  </form>
</details>
`;
}


function formPage(options: string): string {
  return `
${templatePage}
<body>
  <div class="maincontainer"></div>
  <section class="px-3 py-10 text-white flex min-h-svh h-full w-svw flex-col justify-center items-center">

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
      class="w-full max-w-3xl py-7 px-5 sm:p-10 mt-5 bg-black bg-opacity-60 backdrop-blur-md border shadow-[5px_0_5px_5px] shadow-white/10 border-white/40 rounded-2xl">

      <div class="flex flex-col">
        <h3 class="text-xl font-semibold leading-6 tracking-tighter">Receive notifications for this anime</h3>
        <p class="mt-1 text-sm font-medium text-white/50">Enter the anime details below.
        </p>
      </div>


      <form method="post" class="mt-5 flex flex-col gap-4">
        <input type="hidden" id="animeTimestamp" name="timestamp">
        <input type="hidden" value="" name="isFavs">

        <div
          class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
          <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
            Anime Page (Subsplease)
          </label>
          <select required name="page" id="animeSelect" onchange="updateTitle()"
            class="block w-full border-0 bg-transparent py-1 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
            <option value="" selected>Select an Anime</option>
            ${options}
          </select>
        </div>

        <div
          class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
          <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
            Title
          </label>
          <input maxlength="150" id="animeTitle" required type="text" name="title" placeholder="Demon Slayer"
            autocomplete="off"
            class="block w-full border-0 bg-transparent py-1 text-sm  placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
        </div>

        <div
          class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
          <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
            Season
          </label>
          <div class="flex items-center">
            <input required type="number" name="season" value="1"
              class="block w-full border-0 bg-transparent py-1 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground">
          </div>
        </div>

        <div
          class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
          <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
            Episode (Last Aired, 0 if none)</label>
          <div class="flex items-center">
            <input required type="number" name="episode" value="0"
              class="block w-full border-0 bg-transparent py-1 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground">
          </div>
        </div>

        <div
          class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
          <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
            Summary
          </label>
          <div class="flex items-center">
            <textarea rows="3" maxlength="700" id="animeSummary" required name="summary"
              class="block w-full border-0 bg-transparent py-1 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground"></textarea>
          </div>
        </div>

        <div
          class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
          <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
            Image Url (Optional)
          </label>
          <div class="flex items-center">
            <input type="text" name="image_url" placeholder="https://..." autocomplete="off"
              class="block w-full border-0 bg-transparent py-1 text-sm  placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
          </div>
        </div>

        <button
          class="w-full p-4 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-black"
          type="submit">Add
        </button>

      </form>
    </div>

    <a href="/?favs=true"
      class="w-fit mx-auto mt-5 px-4 py-3 bg-opacity-60 hover:bg-opacity-70 backdrop-blur-md rounded-full text-sm bg-black text-white border border-white/60 shadow-[5px_5px_5px_5px] shadow-white/10">
      Go to Favourites
    </a>

  </section>
  <script>
    function updateTitle() {
      const selectElement = document.getElementById('animeSelect');
      const titleInput = document.getElementById('animeTitle');
      const summaryInput = document.getElementById('animeSummary')
      const selectedOption = selectElement.options[selectElement.selectedIndex];
      const timestampInput = document.getElementById('animeTimestamp');
      timestampInput.value = selectedOption?.value ? selectedOption.getAttribute('data-timestamp') : ""
      titleInput.value = selectedOption?.value ? selectedOption.text : ""
      summaryInput.value = selectedOption?.value ? ("Watch " + selectedOption.text) : ""
    }
  </script>
</body>
</html>
`;
}