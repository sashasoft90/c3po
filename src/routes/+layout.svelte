<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import NavBar from '@/widgets/nav-bar/nav-bar.svelte';
	import navBarItems from '$lib/pages/store/routes';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<NavBar navBarItems={navBarItems}></NavBar>

<div id="body-wrapper" class="flex m-2 p-2 flex-col min-h-screen">
	{@render children?.()}
</div>
