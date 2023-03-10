<script>
  import Image from '../../image.svelte';

  export let data;
</script>

# Roadmap

## Stage and callback customization

This is a potential future feature that will provide the ability to customize both the visual aspects to how the callbacks and custom stages render, but also provide a way to customize the functionality of how these callbacks and stages work. This means that the structure, the style and the behavior of how the forms render will be customizable by writing custom Svelte components all while preserving the upgrade path of the framework and requiring little knowledge about how the { data.package.name } and { data.app.name } are built.
