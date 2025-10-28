import type { IconProps } from '@lucide/svelte';
import type { Component } from 'svelte';

type Icon = Component<IconProps, object, ''>;

interface NavBarItem {
	title: string;
	href: string;
	icon: Icon;
	active: boolean;
}

export type { NavBarItem };
export type { Icon };
