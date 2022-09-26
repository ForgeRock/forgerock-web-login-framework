<script lang="ts">
  /**
   * TODO: If there's a better way to do this, change to it
   */
  import '../../../package/widget.css';
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    /**
      * This style block allows for the vertical expansion of the html
      * and body element to full height regardless of context height.
      */
    html,
    body,
    .root {
      height: 100%;
      min-height: 100%;
      background-color: #f6f8fa;
    }
    /**
      * This ensures those with dark theme on, they don't get a flash of a
      * bright white background before the remaining CSS loads and darkens it.
      */
    @media (prefers-color-scheme: dark) {
      html,
      body,
      .root {
        background-color: black;
        color: white;
      }
    }
  </style>
</svelte:head>

<slot />
