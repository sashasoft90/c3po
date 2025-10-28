import type {NavBarItem} from '@/widgets/nav-bar';
import HouseIcon from "@lucide/svelte/icons/house";
import CalendarDays from '@lucide/svelte/icons/calendar-days';

const navBarItems: NavBarItem[] = [
	{
		title: "Home",
		href: "/",
		icon: HouseIcon,
		active: true
	},
	{
		title: "Calendar",
		href: "/calendar",
		icon: CalendarDays,
		active: true
	}
];

export default navBarItems;