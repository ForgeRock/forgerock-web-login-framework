<script>
  import SideNav from "../side-nav.svelte";
</script>

<main class="container container-main">
  <SideNav header="Contributing">
    <ul>
      <li><a href="/docs/contributing">Overview</a></li>
      <li><a href="/docs/contributing/design">Design</a></li>
      <li><a href="/docs/contributing/development">Development</a></li>
      <li><a href="/docs/contributing/testing">Testing</a></li>
      <li><a href="/docs/contributing/styling">Styling</a></li>
      <li><a href="/docs/contributing/faqs">FAQs</a></li>
      <li><a href="/docs/contributing/roadmap">Roadmap</a></li>
    </ul>
  </SideNav>
  <div class="document">
    <slot />
  </div>
</main>

<style>
  .container-main {
    display: flex;
  }
  .document {
    width: 80%;
  }
</style>
