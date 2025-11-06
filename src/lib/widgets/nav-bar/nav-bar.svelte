<script lang="ts">
	import { page } from '$app/state';

	import { cn } from '@/shared/utils.js';
	import { LoginAvatar } from '@/features/login-avatar';
	// noinspection ES6UnusedImports
	import * as NavigationMenu from '@/shared/ui/navigation-menu';
	import { type NavBarItem } from '@/shared/ui/navigation-menu';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Icon } from '@/shared/types';
	import { ModeWatcherToggle } from '@/shared/ui/mode-watcher-toggle';
	import { ModeWatcher } from 'mode-watcher';

	interface Props {
		navBarItems: NavBarItem[];
		pageTitle: string | undefined;
	}

	let { navBarItems, pageTitle = $bindable() }: Props = $props();

	type ListItemProps = HTMLAttributes<HTMLAnchorElement> & {
		title: string;
		href: string;
		icon: Icon;
	};

	function isActive(href: string) {
		return page.url.pathname.split('/')[1] === href.split('/')[1];
	}
</script>

{#snippet ListItem({
	title,
	icon,
	href,
	class: classNameListItem,
	...restPropsListItem
}: ListItemProps)}
	{@const IconComponent = icon}
	<NavigationMenu.Link>
		{#snippet child()}
			<a
				{href}
				onclick={() => (pageTitle = title)}
				class={cn(
					'm-1 flex items-center gap-1 rounded-md p-2 leading-none no-underline transition-colors outline-none select-none',
					'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
					'sm:m-1 lg:p-3',
					classNameListItem,
					isActive(href) && 'bg-accent text-accent-foreground'
				)}
				{...restPropsListItem}
				{title}
			>
				<IconComponent class="size-12 sm:size-6 lg:size-5" />
				<span class="hidden sm:block">{title}</span>
			</a>
		{/snippet}
	</NavigationMenu.Link>
{/snippet}

<ModeWatcher />

<div class="flex w-full items-center gap-2 bg-sidebar">
	<NavigationMenu.Root>
		<NavigationMenu.List class="gap-2 sm:gap-2">
			{#each navBarItems as item, i (i)}
				<NavigationMenu.Item>
					{@render ListItem({
						href: item.href,
						title: item.title,
						icon: item.icon
					})}
				</NavigationMenu.Item>
			{/each}
		</NavigationMenu.List>
	</NavigationMenu.Root>
	<div class="w-full"></div>
	<ModeWatcherToggle class="m-3 size-12 sm:m-2 sm:size-8" />
	<LoginAvatar class="m-3 size-12 sm:m-2 sm:size-8" />
</div>
