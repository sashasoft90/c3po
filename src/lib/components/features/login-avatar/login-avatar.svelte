<script lang="ts">
	import * as Avatar from '@/ui/avatar'

	let {...restProps} = $props();
</script>

<Avatar.Root {...restProps}>
	<Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
	<Avatar.Fallback>CN</Avatar.Fallback>
</Avatar.Root>