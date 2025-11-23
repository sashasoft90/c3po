<script lang="ts">
  import { LoginForm } from "@/widgets/login-form";
  import type { ActionData } from "./$types.js";

  let { form }: { form?: ActionData } = $props();
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
  <div class="flex w-full max-w-sm flex-col gap-6">
    <LoginForm {form} />
  </div>
</div>
