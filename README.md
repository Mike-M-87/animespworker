# AnimeSPworker
Cloudflare worker which is scheduled-triggered to fetch new weekly anime releases from a source, filters the titles based on a KV that can be populated from the worker's root page route and sends a notification via telegram

## Setup

Create your worker

```bash
npm create cloudflare@latest --myanimeworker
```

### Wrangler Configuration (`wrangler.toml`)
The worker is configured using wrangler

The configuration is defined in the `wrangler.toml` file. Set your worker variables and settings here.

_Example of my `wrangler.toml`:_

```toml
#:schema node_modules/wrangler/config-schema.json
name = "animespworker"
main = "src/index.ts"
compatibility_date = "2023-05-24"
compatibility_flags = ["nodejs_compat"]
kv_namespaces = [
  { binding = "FAVS", id = "<kv namespace id>" },
]

[vars]
TELBOT_KEY="<telegram bot api key>"
TELBOT_CHAT="<telegram chat/channel id>"
TELBOT_OWNER_CHAT="<chat id of owner>" # Currently not used

[triggers]
crons = ["*/30 * * * *"] #every 30 minutes
```


### KV Namespace

This worker interacts with a KV namespace named `FAVS` as defined in `wrangler.toml` Make sure the namespace is properly created and bound in your Cloudflare account before deploying.

If the KV uses a different name, properly rename it on your `wrangler.toml` and the envs on `worker-configuration.d.ts`


## Running

```bash
npm install
```
### Fetch Events

To run the worker locally for handling `fetch` events:

```bash
npx wrangler dev
```

### Scheduled Events

To test scheduled events locally:

```bash
npx wrangler dev --test-scheduled
```
Then navigate to:
```
http://localhost:8787/__scheduled?cron=*+*+*+*+*
```
to run the schedule function immediately


## Deployment

To deploy the worker to Cloudflare:

```bash
npx wrangler deploy
```

This will push your latest changes to the Cloudflare environment and activate the scheduled triggers.

### Further Configuration

Refer to the Cloudflare Workers documentation for more details on customizing the configuration: https://developers.cloudflare.com/workers/