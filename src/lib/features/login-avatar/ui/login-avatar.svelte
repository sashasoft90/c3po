<script lang="ts">
  // noinspection ES6UnusedImports
  import * as Avatar from "@/shared/ui/avatar";
  import * as DropdownMenu from "@/shared/ui/dropdown-menu";
  import User from "@lucide/svelte/icons/user";
  import LogOut from "@lucide/svelte/icons/log-out";
  import { goto, invalidateAll } from "$app/navigation";
  import { resolve } from "$app/paths";

  let { ...restProps } = $props();

  async function handleLogout() {
    const response = await fetch("/logout", { method: "POST" });
    if (response.ok || response.redirected) {
      await invalidateAll();
      await goto(resolve("/login"));
    }
  }

  async function handleProfile() {
    await goto(resolve("/profile"));
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="cursor-pointer">
    <Avatar.Root {...restProps}>
      <Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
      <Avatar.Fallback>CN</Avatar.Fallback>
    </Avatar.Root>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="mr-2">
    <button onclick={handleProfile} class="block w-full cursor-pointer">
      <DropdownMenu.Item>
        <User class="mr-2 size-6" />
        Profile
      </DropdownMenu.Item>
    </button>
    <DropdownMenu.Separator />
    <button onclick={handleLogout} class="block w-full cursor-pointer">
      <DropdownMenu.Item>
        <LogOut class="mr-2 size-6" />
        Log out
      </DropdownMenu.Item>
    </button>
  </DropdownMenu.Content>
</DropdownMenu.Root>
