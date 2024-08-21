export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return new Response('Hello World!');
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

		const previousTime = new Date(currentTime);
		previousTime.setDate(previousTime.getDate() - 7);
		const previousDate = previousTime.toISOString().split('T')[0];

		let favkeys: any = [];
		let cursor = null;
		do {
			const listResponse: any = await env.FAVS.list({ cursor });
			favkeys = favkeys.concat(listResponse.keys);
			cursor = listResponse.cursor;
		} while (cursor);
		const favs = favkeys.map((f: any) => f.name)


		for (const item of scheduleData.schedule) {
			if (!favs.includes(item.page) || !item.aired) {
				continue;
			}

			const timeObj = new Date(`${currentDate}T${item.time}:00.00Z`);
			if (timeObj > currentTime) {
				continue
			}

			const checkKey = `${item.page}-${currentDate}`;
			const checkValue = await env.SENT.get(checkKey);
			if (checkValue) {
				continue; // Skip already sent items
			}

			const previousCheckKey = `${item.page}-${previousDate}`;
			const previousCheckValue = await env.SENT.get(previousCheckKey);
			const previousCheckNumber = parseInt(previousCheckValue || "0")

			const description = await env.FAVS.get(item.page)

			const newPhoto = {
				chat_id: env.TELBOT_CHAT,
				photo: item.image_url ? `https://subsplease.org${item.image_url.replace(/\\\//g, '/')}` : "https://picsum.photos/225/318",
				caption: `<blockquote><b>${item.title}</b></blockquote>\n─────────────────────\n${previousCheckNumber ? (`➥ <b><i>Episode: ${(previousCheckNumber + 1).toString().padStart(2, "0")}</i></b>`) : "➥ <b><i>Aired: true</i></b>"}\n➤ <b><i>Time: ${timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: "Africa/Nairobi" })}</i></b>\n➥ <b><i>Page:</i></b> <a href="https://subsplease.org/shows/${item.page}">Subsplease Link</a>\n─────────────────────\n<blockquote expandable>${description || ("Watch " + item.title)}</blockquote>`,
				parse_mode: 'HTML',
			};
			await sendNotification(newPhoto, env);
			await env.SENT.put(checkKey, (previousCheckNumber ? (previousCheckNumber + 1).toString() : currentTime.toUTCString()));
		}
	} catch (error: any) {
		return error?.message || "Could not process schedule"
	}
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
