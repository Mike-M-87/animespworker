import { templatePage } from "./layout";

export function formPage(options: string): string {
  return `
${templatePage}

<body class="no-scrollbar">
  <div class="maincontainer"></div>
  <section class="px-3 py-10 text-white flex min-h-svh h-full w-svw flex-col justify-center items-center">

    <div class="text-foreground font-semibold text-2xl mx-auto flex items-center gap-2">
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
        <h3 class="text-xl font-semibold">Receive notifications for this anime</h3>

        <div class="flex items-center gap-2 flex-wrap justify-between">
          <p class="mt-1 text-sm font-medium text-white/50">Enter the anime details below.</p>
          <label class="inline-flex items-center gap-1 mt-1 cursor-pointer" title="Subsplease/MyAnimeList">
            <a href="https://subsplease.org/schedule" target="_blank"><span
                class="text-sm underline font-medium text-white/50">SP</span></a>
            <input id="animeSource" type="checkbox" value="" class="sr-only peer">
            <div
              class="relative w-10 h-3 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[-4px] after:start-[0px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600">
            </div>
            <a href="https://myanimelist.net" target="_blank"><span
                class="text-sm underline font-medium text-white/50">MAL</span></a>
          </label>
        </div>
      </div>


      <form method="post" class="mt-5 flex flex-col gap-4">

        <div id="subspleasePicker"
          class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
          <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
            Anime Page (Subsplease)
          </label>
          <select required name="page" id="subspleaseSelect" onchange="updateInputs()"
            class="block w-full border-0 bg-transparent py-1 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
            <option value="" selected>Select an Anime</option>
            ${options}
          </select>
        </div>

        <div id="malPicker" hidden
          class="rounded-xl border focus-within:border-sky-200 px-3 py-2 duration-200 focus-within:ring focus-within:ring-sky-300/30">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
              MAL/MALsync Url
            </label>
            <button class="bg-white text-black p-1 rounded-md text-xs hover:bg-opacity-90" onclick="getMalInfo()"
              type="button">
              <svg height="16" width="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path
                  d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
              </svg>
            </button>
          </div>
          <div class="flex items-center">
            <input disabled type="url" name="mal_url" id="malUrl" placeholder="https://..." autocomplete="off"
              class="block w-full border-0 bg-transparent py-1 text-sm  placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
          </div>
          <div class="flex sm:flex-row flex-col sm:items-center gap-2">
            <input disabled name="page" id="customPage" style="pointer-events: none;"
              onkeypress="event.preventDefault()" placeholder="anime-page (auto)"
              class="bg-transparent border rounded-lg p-1 w-full text-white/50 text-sm outline-none border-white/20">

            <div class="sm:ml-auto flex justify-between items-center gap-2">
              <select disabled name="customDay" id="customDaySelect"
                class="bg-transparent p-1 border border-white/20 rounded-lg text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
                <option value="" selected>Select a Day</option>
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </select>
              <input type="time" name="customTime" id="customTimeInput" value="16:00" disabled
                class="bg-transparent p-1 text-sm border border-white/20 rounded-lg">
            </div>
          </div>

        </div>

        <div
          class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
          <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
            Title
          </label>
          <input maxlength="150" id="animeTitle" required type="text" name="title" placeholder="Demon Slayer..."
            autocomplete="off"
            class="block w-full border-0 bg-transparent py-1 text-sm  placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
        </div>


        <div
          class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
          <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
            Nyaa Search
          </label>
          <input type="url" name="sourcelink" id="customSourceLink" required placeholder="https://nyaa.si/?..."
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
              class="block w-full border-0 bg-transparent py-1 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7">
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
            <textarea placeholder="This anime is about..." rows="3" maxlength="700" id="animeSummary" required
              name="summary" autocomplete="off"
              class="block w-full border-0 bg-transparent py-1 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground"></textarea>
          </div>
        </div>

        <div
          class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
          <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
            Image Url (Optional)
          </label>
          <div class="flex items-center">
            <input type="url" name="image_url" id="imageUrl" placeholder="https://..." autocomplete="off"
              class="block w-full border-0 bg-transparent py-1 text-sm  placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
          </div>
        </div>

        <button
          class="w-full p-4 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-black"
          type="submit">Add
        </button>

      </form>
    </div>

    <a href="?favs=true"
      class="w-fit mx-auto mt-5 px-4 py-3 bg-opacity-60 hover:bg-opacity-70 backdrop-blur-md rounded-full text-sm bg-black text-white border border-white/60 shadow-[5px_5px_5px_5px] shadow-white/10">
      Go to Favourites
    </a>

  </section>
  <script>
    const subspleaseSelect = document.getElementById('subspleaseSelect');
    const titleInput = document.getElementById('animeTitle');
    const summaryInput = document.getElementById('animeSummary')
    const imageUrl = document.getElementById('imageUrl')
    const malPicker = document.getElementById('malPicker')
    const subspleasePicker = document.getElementById('subspleasePicker')
    const malUrlInput = document.getElementById('malUrl')
    const customPageInput = document.getElementById('customPage')
    const customDayInput = document.getElementById('customDaySelect')
    const customTimeInput = document.getElementById('customTimeInput')
    const customSourceLink = document.getElementById('customSourceLink')


    function updateInputs() {
      const selectedOption = subspleaseSelect.options[subspleaseSelect.selectedIndex];
      const selectedTitle = selectedOption?.value ? selectedOption.text.split(" (")?.[0] : ""
      titleInput.value = selectedTitle
      summaryInput.value = selectedTitle ? ("Watch " + selectedTitle) : ""
      customSourceLink.value = "https://nyaa.si/?f=0&c=0_0&q=[Judas]+" + selectedTitle.replace(/ /g, "+").toLowerCase()
    }

    document.getElementById('animeSource').addEventListener('change', function () {
      if (this.checked) {
        subspleasePicker.hidden = true
        subspleaseSelect.required = false
        subspleaseSelect.disabled = true

        malPicker.hidden = false

        malUrlInput.required = true
        malUrlInput.disabled = false

        customPageInput.required = true
        customPageInput.disabled = false

        customDayInput.required = true
        customDayInput.disabled = false

        customTimeInput.required = true
        customTimeInput.disabled = false
      } else {
        subspleasePicker.hidden = false
        subspleaseSelect.required = true
        subspleaseSelect.disabled = false
        titleInput.value = ""
        summaryInput.value = ""
        imageUrl.value = ""

        malPicker.hidden = true

        malUrlInput.required = false
        malUrlInput.disabled = true

        customPageInput.required = false
        customPageInput.disabled = true

        customDayInput.required = false
        customDayInput.disabled = true

        customTimeInput.required = false
        customTimeInput.disabled = true
      }
    })

    async function getMalInfo() {
      const malUrl = malUrlInput.value
      if (!malUrl) return
      let animeId = ""
      if (malUrl.includes("myanimelist.net")) {
        animeId = malUrl.split('/anime/')[1].split('/')?.[0];
      } else if (malUrl.includes("malsync.moe")) {
        animeId = malUrl.split('/')?.pop();
      }
      if (!animeId) {
        alert("Invalid MyAnimeList Url");
        return
      }
      const response = await fetch("https://api.malsync.moe/mal/anime/" + animeId)
      const data = await response.json()
      if (data.id) {
        titleInput.value = data.title
        summaryInput.value = "Watch " + data.title
        imageUrl.value = getHigherQualityImageUrl(data.image)
        customPageInput.value = data.title.replace(/ /g, "-").toLowerCase()
        customSourceLink.value = "https://nyaa.si/?f=0&c=0_0&q=[Judas]+" + data.title.replace(/ /g, "+").toLowerCase()
      } else alert("Invalid MyAnimeList Url")
    }

    function getHigherQualityImageUrl(url) {
      const urlParts = url.split('/')
      const filename = urlParts.pop()
      const extension = filename.split('.').pop()
      const largeFilename = filename.slice(0, -extension.length - 1) + 'l.' + extension
      return [...urlParts, largeFilename].join('/')
    }
  </script>
</body>

</html>`;
}