<script lang="ts">
  import "../../app.css";
  import favicon from "@/app/assets/favicon.svg";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>C3PO - Login</title>
</svelte:head>

{@render children?.()}
