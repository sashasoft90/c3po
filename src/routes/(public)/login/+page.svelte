<script lang="ts">
  import { LoginPage } from "@/pages/login-page";
  import type { ActionData } from "./$types";

  let { form }: { form: ActionData } = $props();
</script>

<LoginPage {form} />
