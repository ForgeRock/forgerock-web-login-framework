<script>
  export let header;
</script>

<aside class="side-nav">
  <header class="page-header">{header}</header>
  <nav class="nav-secondary">
    <slot />
  </nav>
</aside>

<style>
  .side-nav {
    width: 20%;
    margin-right: 20px;
  }
  .page-header {
    font-size: 1.5rem;
    line-height: 2.6rem;
    margin-bottom: 1.99rem;
    margin-top: 1.3rem;
    text-align: left;
  }
</style>
