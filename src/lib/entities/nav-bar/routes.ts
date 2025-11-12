import HouseIcon from "@lucide/svelte/icons/house";
import CalendarDays from "@lucide/svelte/icons/calendar-days";
import { type NavBarItem } from "@/shared/ui/navigation-menu";

const navBarItems: NavBarItem[] = [
  {
    title: "Home",
    href: "/",
    icon: HouseIcon,
    active: true,
  },
  {
    title: "Planner",
    href: "/planner",
    icon: CalendarDays,
    active: true,
  },
];

export default navBarItems;
