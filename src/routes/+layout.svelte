<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from "mode-watcher";
	import ModeWatcherToggle from '@/ui/mode_watcher_toggle/mode_watcher_toggle.svelte';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>
<ModeWatcher />
<ModeWatcherToggle/>
{@render children?.()}

<div class="fixed bottom-0 right-0 p-4 accent-red-800">asd</div>
