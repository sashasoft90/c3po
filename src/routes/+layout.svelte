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



<div id="body-wrapper" class="flex flex-col min-h-screen">
	<NavBar navBarItems={navBarItems}></NavBar>
	<div class="p-2 m-2">
		{@render children?.()}
	</div>
</div>
