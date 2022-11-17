<script>
  import TopNav from './top-nav.svelte';
  import SideNav from './side-nav.svelte';
</script>

<svelte:head>
  <link
    rel="preload"
    as="font"
    type="font/woff2"
    href="/open-sans/open-sans-v29-latin-regular.woff2"
    crossorigin="anonymous"
  />

  <meta charset="utf-8" />
  <title>Web Login Framework | ForgeRock</title>
  <link rel="icon" href="/favicon.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css" />

  <style>
    /**
      * Self-hosting Open Sans for better privacy, potential performance and control
      * Reference: https://wpspeedmatters.com/self-host-google-fonts/
      */
    /* open-sans-300 - latin */
    @font-face {
      font-display: swap;
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 300;
      src: local(''), url('/open-sans/open-sans-v29-latin-300.woff2') format('woff2');
    }
    /* open-sans-regular - latin */
    @font-face {
      font-display: swap;
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 400;
      src: local(''), url('/open-sans/open-sans-v29-latin-regular.woff2') format('woff2');
    }
    /* open-sans-700 - latin */
    @font-face {
      font-display: swap;
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 700;
      src: local(''), url('/open-sans/open-sans-v29-latin-700.woff2') format('woff2');
    }

    :root {
      --font-family: 'Open Sans';
    }

    /* Typographic scale: https://type-scale.com/?size=16&scale=1.250&text=A%20Visual%20Type%20Scale&font=Poppins&fontweight=400&bodyfont=body_font_default&bodyfontweight=400&lineheight=1.75&backgroundcolor=%23ffffff&fontcolor=%23000000&preview=false */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-bottom: calc(var(--typography-spacing-vertical) * 0.5);
    }

    h1 {
      --font-size: 4.209rem;
      --typography-spacing-vertical: 3.9rem;

      font-weight: 300;
      margin-top: calc(var(--typography-spacing-vertical) * 2);
      text-align: center;
    }

    h2 {
      --font-size: 3.157rem;
      --typography-spacing-vertical: 2rem;
    }

    * + h2 {
      margin-top: calc(var(--typography-spacing-vertical) * 3);
    }

    h3 {
      --font-size: 2.369rem;
      --typography-spacing-vertical: 2.6rem;

      font-weight: 300;
    }

    * + h3 {
      margin-top: calc(var(--typography-spacing-vertical) * 2);
    }

    h4 {
      --font-size: 1.333rem;
      --typography-spacing-vertical: 1.3rem;
    }

    h5 {
      --font-size: 1rem;
      --typography-spacing-vertical: 1.3rem;
    }

    [data-theme='light'],
    :root:not([data-theme='dark']) {
      --code-background-color: hsl(205deg, 20%, 94%);
      --muted-color: hsl(205deg, 10%, 30%);
      --primary: hsl(195deg, 85%, 21%);
    }

    @media only screen and (prefers-color-scheme: dark) {
      :root:not([data-theme='light']) {
        --code-background-color: #090d10;
        --muted-color: hsl(205deg, 10%, 70%);
        --primary: hsl(195deg, 85%, 81%);
      }
    }

    @media (min-width: 576px) {
      :root {
        --font-size: 16px;
      }
    }
    @media (min-width: 768px) {
      :root {
        --font-size: 16px;
      }
    }
    @media (min-width: 992px) {
      :root {
        --font-size: 16px;
      }
    }
    @media (min-width: 1200px) {
      :root {
        --font-size: 16px;
      }
    }
  </style>
</svelte:head>

<TopNav />

<slot />

<footer class="container">&copy; Copyright 2020 ForgeRock AS. All Rights Reserved.</footer>

<style>
  footer {
    border: 0px solid var(--muted-border-color);
    border-top-width: 1px;
    margin-top: 3rem;
    padding-top: 3rem;
    text-align: center;
  }
</style>
