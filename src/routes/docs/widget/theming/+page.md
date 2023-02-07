<script>
  import Image from '../../image.svelte';
</script>

# Theming

The widget can be themed quite easily through a [Tailwind configuration file](https://tailwindcss.com/docs/configuration). There is also a light and [dark mode for the default theme](https://tailwindcss.com/docs/dark-mode). Below we will show you how to utilize these features.

## Dark mode

<Image>

![Screenshot of modal Widget with dark mode](/img/modal-widget-dark.png)

</Image>

Taking advantage of the Widget's light and dark mode is simple. We use [Tailwind's optional `<body>` class](https://tailwindcss.com/docs/dark-mode) to trigger the mode. You can manually add `tw_dark` to the `<body>` element to "force" dark mode.

```html
<body class="tw_dark"></body>
```

Or, you can programmatically do it like this:

```html
<body>
  <script>
    const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkTheme) {
      document.body.classList.add('tw_dark');
    }
  </script>
  <!-- Rest of HTML -->
</body>
```

## Theme configuration

The Login Widget uses [Tailwind CSS](https://tailwindcss.com/) as its styling library. [Reconfiguring the theme](https://tailwindcss.com/docs/theme) to use different colors, fonts and sizing is done through providing new values to the [configuration file](https://github.com/cerebrl/forgerock-web-login-framework/blob/main/tailwind.config.cjs) and rebuilding the Widget.

### Steps

1. Clone the [ForgeRock Web Login Framework](https://github.com/cerebrl/forgerock-web-login-framework)
2. Install the npm dependencies: `npm i`
3. Run the development script: `npm run dev`
4. Run Storybook to view your changes: `npm run storybook`
5. Open the `tailwind.config.cjs` file and adjust your theme via the `extend` property

As an example, let's say you wanted to lighten the body color for _only_ the light mode and use a burnt orange shade as the primary color for both light and dark.

```js
// tailwind.config.cjs
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}', './.storybook/preview-head.html'],
  darkMode: 'class',
  presets: [require('./themes/default/config.cjs')],
  theme: {
    extend: {
      colors: {
        body: {
          light: '#e2e8f0',
        },
        primary: {
          dark: '#a16207',
          light: '#92400e',
        },
      },
    },
  },
};
```

#### Screenshot

<Image>

![Screenshot of customized modal Login Widget](/img/customized-modal-widget-light.png)

</Image>

Anything configurable in Tailwind is configurable in this theme. The custom config properties (what we call "tokens") that our default theme uses can be found in [the `/theme/default/tokens.cjs` file](https://github.com/cerebrl/forgerock-web-login-framework/blob/main/themes/default/tokens.cjs). But, do not directly modify the theme files, only modify the root `tailwind.config.cjs` file in order to preserve your upgrade path.

### Supported customization

Currently, customization is restricted to the following:

1. Colors
2. Fonts
3. Type sizes
4. Spacing
5. Breakpoints
