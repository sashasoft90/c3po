<script lang="ts">
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { cn } from '$lib/utils.js';
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import LoginAvatar from '$lib/components/features/login-avatar/login-avatar.svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import type { Icon, NavBarItem } from '@/widgets/nav-bar/entities';
	import type { Component } from 'svelte';
	import { ModeWatcherToggle } from '@/ui/mode-watcher-toggle';
	import { ModeWatcher } from 'mode-watcher';

	interface Props {
		navBarItems: NavBarItem[];
		class?: string;
	}

	let { navBarItems, class: className }: Props = $props();

	type ListItemProps = HTMLAttributes<HTMLAnchorElement> & {
		title: string;
		href: string;
		icon: Icon;
	};
</script>

{#snippet ListItem(
	{
		title,
		icon,
		href,
		class: classNameListItem,
		...restPropsListItem
	}: ListItemProps)
}
	{@const IconComponent = icon}
	<NavigationMenu.Link>
		{#snippet child()}
			<a
				{href}
				class={cn(
      "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      "flex gap-1 m-0.5 sm:m-1 p-3 lg:p-2 items-center rounded-md",
      "select-none leading-none no-underline outline-none transition-colors",
      classNameListItem
     )}
				{...restPropsListItem}

				title={title}
			>
				<IconComponent class="size-10 sm:size-6 lg:size-5" />
				<span class="hidden sm:block">{title}</span>
			</a>
		{/snippet}
	</NavigationMenu.Link>
{/snippet}

<ModeWatcher />

<div class={cn("flex bg-sidebar w-full items-center", className)}>
	<NavigationMenu.Root>
		<NavigationMenu.List class="gap-0 sm:gap-2">
			{#each navBarItems as item, i (i)}
				<NavigationMenu.Item>
					{@render ListItem({
						href: item.href,
						title: item.title,
						icon: item.icon,
					})}
				</NavigationMenu.Item>
			{/each}
		</NavigationMenu.List>
	</NavigationMenu.Root>
	<div class="w-full"></div>
	<ModeWatcherToggle/>
	<LoginAvatar class="m-3.5 sm:m-4 lg:m-3"/>
</div>