import { renderDetailPage } from "./pages/favourites";
import { renderFavItem } from "./pages/form";
import { formPage } from "./pages/home";
import { renderMessagePage } from "./pages/message";
import { AnimePage, ScheduleResp, TelPhotoReq, TelbotResp, TodaySchedule, WeekSchedule } from "./types";

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
  const res2 = await processCustomSchedule(env)
  if (res || res2) {
    await fetch(`https://api.telegram.org/bot${env.TELBOT_KEY}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: env.TELBOT_OWNER_CHAT,
        text: `<blockquote expandable>❌❌❌ Error: ${(res ? `SP Schedule: ` + res : "") + (res2 ? `\nCustom Schedule: ` + res2 : "")} </blockquote>`,
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
      if (!item.aired || !item.page) continue

      let timeObj = new Date(`${currentDate}T${item.time}:00.00Z`);
      if (isNaN(timeObj.getTime())) timeObj = currentTime
      if (timeObj > currentTime) continue // Skip items that are not within time yet

      const checkValue = await env.FAVS.get(item.page);
      if (!checkValue) continue;

      let animeData: AnimePage
      try {
        animeData = JSON.parse(checkValue);
      } catch (error) {
        continue
      }

      if (animeData.timestamp == currentDate) continue; // Skip already sent items

      if (!animeData.image_url) {
        animeData.image_url = item.image_url ? `https://subsplease.org${item.image_url.replace(/\\\//g, '/')}` : "https://picsum.photos/225/318"
      }

      const newPhoto = createChatPhoto(env.TELBOT_CHAT, animeData, timeObj, false)

      await sendNotification(newPhoto, env);

      const newAnimeData = {
        ...animeData,
        episode: animeData.episode + 1,
        timestamp: currentDate
      }

      await env.FAVS.put(item.page, JSON.stringify(newAnimeData));
    }
    return null
  } catch (error: any) {
    return error?.message || "Could not process schedule"
  }
}


async function processCustomSchedule(env: Env) {
  try {
    const currentTime = new Date()
    const currentDate = currentTime.toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay()

    const favKeys = await getFavKeys(env)

    for (const key of favKeys) {
      if (!key?.name) continue
      const value = await env.FAVS.get(key.name);
      if (!value) continue

      let animeData: AnimePage
      try {
        animeData = JSON.parse(value);
      } catch (error) {
        continue
      }


      if (animeData.customDay === undefined) continue
      if (animeData.customDay !== dayOfWeek) continue
      if (animeData.timestamp == currentDate) continue; // Skip already sent items

      let timeObj = new Date(`${currentDate}T${animeData.customTime}:00.00Z`);
      if (isNaN(timeObj.getTime())) timeObj = currentTime
      if (timeObj > currentTime) continue;

      const newPhoto = createChatPhoto(env.TELBOT_CHAT, animeData, timeObj, true)
      await sendNotification(newPhoto, env);
      const newAnimeData = {
        ...animeData,
        episode: animeData.episode + 1,
        timestamp: currentDate
      }

      await env.FAVS.put(animeData.page, JSON.stringify(newAnimeData));
    }
  } catch (error: any) {
    return error?.message || "Could not process custom schedule"
  }
}

function createChatPhoto(telbotChatId: string, animeData: AnimePage, timeAired: Date, isCustom: boolean): TelPhotoReq {
  if (!animeData.image_url) animeData.image_url = "https://picsum.photos/423/600";

  const title = `<blockquote><b>${animeData.title}</b></blockquote>`;
  const separator = "───────────────────";
  const season = `➤ <b>Season: ${animeData.season.toString().padStart(2, "0")}</b>`;
  const episode = `➤ <b>Episode: ${(animeData.episode + 1).toString().padStart(2, "0")}</b>`;
  const time = `➤ <b>Time: ${timeAired.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: "Africa/Nairobi" })}</b>`;

  const subspleasePage = `➤ <b>Page: <a href="https://subsplease.org/shows/${animeData.page}">Subsplease Link</a></b>`;
  const nyaaPage = `➤ <b>Page (mini): <a href="${animeData.customSourceLink}">Nyaa Link</a></b>`;
  const summary = `<blockquote expandable><i>${animeData.summary}</i></blockquote>`;

  const caption = [
    title,
    separator,
    season,
    episode,
    isCustom ? time : subspleasePage,
    nyaaPage,
    separator,
    summary
  ].join('\n');

  const newPhoto = {
    chat_id: telbotChatId,
    photo: animeData.image_url,
    caption: caption,
    parse_mode: 'HTML',
  };
  return newPhoto;
}


async function handlePostRequestPage(request: Request, env: Env): Promise<Response> {
  let isEdit = false;
  try {
    const formData = await request.formData();
    const page = formData.get('page') as string;

    let animeData: AnimePage | undefined
    if (page) {
      const checkValue = await env.FAVS.get(page);
      if (checkValue) {
        try {
          animeData = JSON.parse(checkValue);
          isEdit = true
        } catch (error) {
          ;
        }
      }
    }

    const title = formData.get('title') as string;
    const season = parseInt(formData.get('season') as string, 10);
    const episode = parseInt(formData.get('episode') as string, 10);
    const summary = formData.get('summary') as string;
    const image_url = formData.get('image_url') as string;
    const customDay = formData.get('customDay') as string;
    const customTime = formData.get('customTime') as string;
    const customSourceLink = formData.get('sourcelink') as string;

    if (page && title && !isNaN(season) && !isNaN(episode) && summary) {
      const newAnime: AnimePage = {
        page,
        title,
        season,
        episode,
        summary: summary.replace(/['"`]/g, ''),
        customDay: customDay ? parseInt(customDay, 10) : undefined,
        customTime: customTime ? customTime : undefined,
        customSourceLink: customSourceLink,
        timestamp: animeData?.timestamp || "",
        image_url
      }
      await env.FAVS.put(page, JSON.stringify(newAnime));
      return new Response(renderMessagePage(false, `"${page}" has been ${isEdit ? "edited on" : "added to"} your FAVS.`, isEdit), { headers: { 'Content-Type': 'text/html' } });
    } else {
      throw new Error('All fields are required and season/episode must be valid numbers.');
    }
  } catch (error: any) {
    return new Response(renderMessagePage(true, `Error ${isEdit ? "editing" : "adding"} anime to favourites: ${error?.message || "Unknown error"}`, isEdit), { headers: { 'Content-Type': 'text/html' } });
  }
}

async function handleGetRequestPage(): Promise<Response> {
  try {
    const subspleaseResponse = await fetch('https://subsplease.org/api/?f=schedule&tz=Etc/GMT');
    const subspleaseData = (await subspleaseResponse.json()) as ScheduleResp;
    let optionsHtml = '';
    const fullSchedule = subspleaseData.schedule as WeekSchedule;
    for (const day of Object.keys(fullSchedule)) {
      const daySchedule = fullSchedule[day as keyof WeekSchedule];
      daySchedule.forEach((show: TodaySchedule) => {
        optionsHtml += `<option value="${show.page}">${show.title} (${day.slice(0, 3)})</option>`;
      });
    }
    return new Response(formPage(optionsHtml), { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    return new Response(renderMessagePage(true, `Error fetching anime schedule: ${error?.message || "Unknown error"}`, false), { headers: { 'Content-Type': 'text/html' } });
  }
}


async function getFavKeys(env: Env) {
  let favkeys: any = [];
  let cursor = null;
  do {
    const listResponse: any = await env.FAVS.list({ cursor });
    favkeys = favkeys.concat(listResponse.keys);
    cursor = listResponse.cursor;
  } while (cursor);
  return favkeys
}

async function handleGetFavsPage(env: Env): Promise<Response> {
  try {
    let favouritesHtml = ''
    const favkeys = await getFavKeys(env)
    for (const key of favkeys) {
      if (!key?.name) continue
      const value = await env.FAVS.get(key.name);
      if (!value) continue
      let animeData: AnimePage
      try {
        animeData = JSON.parse(value);
      } catch (error) {
        continue;
      }
      favouritesHtml += renderFavItem(animeData)
    }

    if (!favouritesHtml) {
      favouritesHtml = "<p class='font-medium text-white/50 mx-auto my-5'>No favourites yet</p>"
    }

    return new Response(renderDetailPage(favouritesHtml), { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    return new Response(renderMessagePage(true, `Error fetching favourites: ${error?.message || "Unknown error"}`, false), { headers: { 'Content-Type': 'text/html' } });
  }
}