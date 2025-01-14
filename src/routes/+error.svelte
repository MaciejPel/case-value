<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
</script>

<div class="flex h-[calc(100svh-3rem)] flex-col items-center justify-center gap-4 py-6">
	<div class="flex flex-col items-center">
		<h1 class="font-mono text-6xl font-semibold">{page.status}</h1>
		{page.error?.message || "Unknown error"}
	</div>
	<Button href="/">Home</Button>
</div>
