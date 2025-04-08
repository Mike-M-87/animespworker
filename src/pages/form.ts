
import { AnimePage } from "../types";

export function renderFavItem(anime: AnimePage): string {
  return ` 
<details class="hover:bg-black/20 border shadow-[5px_0_5px_5px] shadow-white/10 border-white/40 rounded-xl overflow-scroll">
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
    <input readonly value="${anime.page}" name="page"
      class="bg-transparent text-white/50 text-sm outline-none border-none">

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
      <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
        Nyaa Link
      </label>
      <input type="url" name="sourcelink" value="${anime?.customSourceLink}"
        placeholder="Quick search: https://nyaa.si/?..." autocomplete="off"
        class="block w-full border-0 bg-transparent py-1 text-sm  placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
    </div>

    ${anime?.customDay !== undefined && anime.customDay >= 0 ? `
    <div
      class="rounded-xl border focus-within:border-sky-200 px-3 py-1.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
      <label class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
        Link & Day/Time
      </label>
      <div class="w-full flex sm:flex-row flex-col sm:items-center gap-2 py-1">
        
        <div class="flex w-full items-center justify-between gap-2">
          <select name="customDay" required
            class="w-1/2 p-1 border border-white/20 bg-transparent rounded-lg text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
            <option value="">Select a Day</option>
            <option ${anime.customDay == 0 ? 'selected' : ''} value="0">Sunday</option>
            <option ${anime.customDay == 1 ? 'selected' : ''} value="1">Monday</option>
            <option ${anime.customDay == 2 ? 'selected' : ''} value="2">Tuesday</option>
            <option ${anime.customDay == 3 ? 'selected' : ''} value="3">Wednesday</option>
            <option ${anime.customDay == 4 ? 'selected' : ''} value="4">Thursday</option>
            <option ${anime.customDay == 5 ? 'selected' : ''} value="5">Friday</option>
            <option ${anime.customDay == 6 ? 'selected' : ''} value="6">Saturday</option>
          </select>
          <input type="time" required name="customTime" value="${anime?.customTime}"
            class="w-1/2 p-1 bg-transparent text-sm border border-white/20 rounded-lg">
        </div>
      </div>
    </div>
    `: ''}

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
        Episode (Last Aired, 0 if new/none)
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
        <input type="url" name="image_url" placeholder="https://..." autocomplete="off"
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