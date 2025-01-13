<script lang="ts">
	import ThemeSwitch from "$lib/components/ThemeSwitch.svelte";
	import { ModeWatcher } from "mode-watcher";
	import "../app.css";
	import CurrencySwitch from "$lib/components/CurrencySwitch.svelte";

	let { children } = $props();
</script>

<ModeWatcher disableTransitions={false} />
<main class="flex min-h-[100svh] items-start justify-center py-6">
	<div class="container max-w-7xl px-6">
		{@render children()}
	</div>
</main>
<div class="fixed bottom-4 right-4 flex gap-2">
	<CurrencySwitch />
	<ThemeSwitch />
</div>
