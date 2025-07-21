
export const templatePage = `
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0,viewport-fit=cover">

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
    href="https://gist.githubusercontent.com/Mike-M-87/c4bb8d50dd4c5181aebd69978d594fb4/raw/deaa0dc3e3018a0f577a3df3137332ee9762ea91/manifest1.json" />

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
  html:has(.no-scrollbar)::-webkit-scrollbar {
    display: none;
  }
</style>

<script>
  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) {
    document.body.style.paddingTop = '2.5rem';
  }
</script>
`