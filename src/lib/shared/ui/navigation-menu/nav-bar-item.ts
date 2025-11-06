import type { Icon } from '@/shared/types';

interface NavBarItem {
	title: string;
	href: string;
	icon: Icon;
	active: boolean;
}

export type { NavBarItem };
