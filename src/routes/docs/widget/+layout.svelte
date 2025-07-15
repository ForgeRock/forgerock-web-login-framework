<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script>
  import SideNav from '../side-nav.svelte';
</script>

<main class="container container-main">
  <SideNav header="Widget Docs">
    <ul>
      <li><a href="/docs/widget">Overview</a></li>
      <li><a href="/docs/widget/quick-start">Quick Start</a></li>
      <li><a href="/docs/widget/full-api">Full API</a></li>
      <li><a href="/docs/widget/features">Features</a></li>
      <li><a href="/docs/widget/theming">Theming</a></li>
      <li><a href="/docs/widget/tutorials">Tutorials</a></li>
      <li><a href="/docs/widget/roadmap">Roadmap</a></li>
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
