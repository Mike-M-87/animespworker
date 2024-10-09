import { templatePage } from "./layout";

export function renderMessagePage(isError: boolean, messageContent: string, isEditing: boolean): string {
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


      <a href="/${isEditing ? '?favs=true' : ''}"
        class="w-fit mx-auto px-4 py-3 bg-opacity-60 hover:bg-opacity-70 backdrop-blur-md rounded-full text-sm bg-black text-white border border-white/60 shadow-[5px_5px_5px_5px] shadow-white/10">
        Go Back
      </a>
    </div>
  </section>
</body>

</html>`;
}
