<script lang="ts">
  import "../app.css";
  import favicon from "@/app/assets/favicon.svg";
  import { NavBar } from "@/widgets/nav-bar";
  import { default as navBarItems } from "@/entities/nav-bar";

  let { children } = $props();
  let pageTitle = $state<string | undefined>(undefined);
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>C3PO{pageTitle ? " - " + pageTitle : ""}</title>
</svelte:head>

<div id="body-wrapper" class="flex h-screen flex-col overflow-hidden">
  <NavBar {navBarItems} bind:pageTitle class="shrink-0"></NavBar>
  <div class="m-2 mt-2 mb-2 flex min-h-0 flex-1 flex-col overflow-hidden">
    {@render children?.()}
  </div>
</div>
