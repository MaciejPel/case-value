<script lang="ts">
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { buttonVariants } from "$lib/components/ui/button";
	import { currencyStore } from "$lib/stores/currencyStore.svelte";
	import { currencies } from "../constants";
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="{buttonVariants({ variant: 'outline', size: 'sm' })} h-auto">
		<span>{currencyStore.value}</span>
		<span class="sr-only">Toggle theme</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		{#each currencies as currency}
			<DropdownMenu.Item onclick={() => (currencyStore.value = currency)}>
				{currency}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
