<script lang="ts">
  // noinspection ES6UnusedImports
  import * as Avatar from "@/shared/ui/avatar";

  let { ...restProps } = $props();
</script>

<Avatar.Root {...restProps}>
  <Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
  <Avatar.Fallback>CN</Avatar.Fallback>
</Avatar.Root>
