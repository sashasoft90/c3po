<script lang="ts">
	import '../app.css';
	import favicon from '@/app/assets/favicon.svg';
	import { NavBar } from '@/widgets/nav-bar';
	import { default as navBarItems } from '@/entities/nav-bar';

	let { children } = $props();
	let pageTitle = $state<string | undefined>(undefined);

	$effect(() => {
		console.debug(pageTitle);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>C3PO{pageTitle ? ' - ' + pageTitle : ''}</title>
</svelte:head>

<div id="body-wrapper" class="flex min-h-screen flex-col">
	<NavBar {navBarItems} bind:pageTitle></NavBar>
	<div class="m-2 p-2">
		{@render children?.()}
	</div>
</div>
