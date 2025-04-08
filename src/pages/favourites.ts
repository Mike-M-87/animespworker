import { templatePage } from "./layout";

export function renderDetailPage(favs: string): string {
  return `
${templatePage}
<body>
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
      Edit your Favourite Animes
    </div>

    <div
      class="w-full max-w-3xl py-7 px-5 sm:p-10 mt-5 bg-black bg-opacity-60 backdrop-blur-md border shadow-[5px_0_5px_5px] shadow-white/10 border-white/40 rounded-2xl overflow-y-auto">

      <div class="flex flex-col">
        <h3 class="text-xl font-semibold">
          Favourites
        </h3>
        <p class="text-sm font-medium text-white/50">
          Manage your favourite anime list.
        </p>
      </div>

      <div class="flex mt-5 flex-col gap-4 sm:max-h-[67vh] max-h-[66vh]">
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