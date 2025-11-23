<script lang="ts">
  import "../app.css";
  import favicon from "@/app/assets/favicon.svg";
  import { NavBar } from "@/widgets/nav-bar";
  import { default as navBarItems } from "@/entities/nav-bar";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { isAuthenticated } from "@/shared/api/auth";

  let { children } = $props();
  let pageTitle = $state<string | undefined>(undefined);

  $effect(() => {
    console.debug(pageTitle);
  });

  // Check authentication on client-side
  $effect(() => {
    if (browser) {
      const isLoginPage = page.url.pathname === "/login";
      const authenticated = isAuthenticated();

      // Redirect to login if not authenticated and not on login page
      if (!authenticated && !isLoginPage) {
        goto("/login");
      }

      // Redirect to home if authenticated and on login page
      if (authenticated && isLoginPage) {
        goto("/");
      }
    }
  });
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
