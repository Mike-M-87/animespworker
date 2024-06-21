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
		await fetch(`https://api.telegram.org/bot${env.TELBOT_KEY}/sendMessage?chat_id=${env.TELBOT_CHAT}&text=❌❌❌ Error Getting Schedule: ${res}`)
	}
}


const favs = [
	"re-monster",
	"wind-breaker",
	"boku-no-hero-academia",
	"kaijuu-8-gou",
	"dragon-raja",
	"mushoku-tensei-s2",
	"kimetsu-no-yaiba-hashira-geiko-hen",
	"sentai-daishikaku",
	"girls-band-cry",
	"dead-dead-demons-dededede-destruction"
];

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

		for (const item of scheduleData.schedule) {
			if (!favs.includes(item.page)) {
				continue; // Skip non-favorite items
			}

			const timeObj = new Date(`${currentDate}T${item.time}:00.00Z`);
			if (timeObj > currentTime) {
				continue
			}

			const checkKey = `${item.page}-${currentDate}`;
			const alreadySent = await env.SENT.get(checkKey);
			if (alreadySent) {
				continue; // Skip already sent items
			}

			const newPhoto = {
				chat_id: env.TELBOT_CHAT,
				photo: item.image_url ? `https://subsplease.org${item.image_url.replace(/\\\//g, '/')}` : "https://picsum.photos/225/318",
				caption: `*${item.title}*\n_Time:_ ${timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: "Africa/Nairobi" })}\n_Aired:_ ${item.aired}\n_Page:_ [Subsplease Link](https://subsplease.org/shows/${item.page})\n\n`,
				parse_mode: 'Markdown',
			};

			await sendNotification(newPhoto, env);
			await env.SENT.put(checkKey, currentTime.toISOString());
		}
		return null
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
