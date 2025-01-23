<script lang="ts">
	import { page } from "$app/state";
	import ThemeSwitch from "$lib/components/ThemeSwitch.svelte";
	import { Toaster } from "$lib/components/ui/sonner";
	import * as Dialog from "$lib/components/ui/dialog";
	import CurrencySwitch from "$lib/components/CurrencySwitch.svelte";
	import { buttonVariants } from "$lib/components/ui/button";
	import { ModeWatcher } from "mode-watcher";
	import "../app.css";

	let { children } = $props();
</script>

<ModeWatcher disableTransitions={false} />
<Toaster position="top-right" />
<main class="flex min-h-[100svh] items-start justify-center py-6">
	<div class="container max-w-7xl px-6">
		{@render children()}
	</div>
</main>
<div class="fixed bottom-4 right-4 flex gap-2">
	<Dialog.Root>
		<Dialog.Trigger
			class="{page.url.pathname !== '/' ? 'hidden' : ''} {buttonVariants({
				variant: 'outline',
				size: 'sm',
			})} h-auto"
		>
			About
		</Dialog.Trigger>
		<Dialog.Content class="max-w-xs sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>About</Dialog.Title>
				<Dialog.Description class="text-left">
					A simple app created to track the value of Counter-Strike cases.
				</Dialog.Description>
				<Dialog.Description class="text-left">
					Prices & currencies are automatically refreshed after loading when there is no cooldown
					time (4 hours). Calculated values are not 100% accurate, but they give some indication of
					the actual value of cases. Values are cached in database, so if you have new items, you
					can press ‘Update inventory’ button. Same applies to profile information. You can also
					check value of a particular case over time by clicking on it and analyzing the chart.
				</Dialog.Description>
			</Dialog.Header>
		</Dialog.Content>
	</Dialog.Root>
	<CurrencySwitch />
	<ThemeSwitch />
</div>
