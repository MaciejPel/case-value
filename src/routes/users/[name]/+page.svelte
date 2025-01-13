<script lang="ts">
	import type { PageData } from "./$types";
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import Input from "$lib/components/ui/input/input.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import {
		ArrowLeft,
		SquareArrowOutUpRight,
		Search,
		EllipsisVertical,
		LoaderCircle,
	} from "lucide-svelte";
	import { currencyStore } from "$lib/stores/currencyStore.svelte";
	import * as Popover from "$lib/components/ui/popover";
	import { tableStore } from "$lib/stores/tableStore.svelte";
	import Label from "$lib/components/ui/label/label.svelte";
	import * as Select from "$lib/components/ui/select";
	import * as Table from "$lib/components/ui/table";
	import { browser } from "$app/environment";
	import TimeChart from "$lib/components/TimeChart.svelte";

	let { data }: { data: PageData } = $props();

	let userInput = $state(data.search);
	let processing = $state(false);

	const currencies: {
		[key: string]: { name: string; currencyFormatter: (price: string) => string };
	} = {
		USD: { name: "USD", currencyFormatter: (price) => `$ ${price}` },
		PLN: { name: "PLN", currencyFormatter: (price) => ` ${price} zł` },
		EUR: { name: "EUR", currencyFormatter: (price) => `€ ${price}` },
	};

	const currentCurrencyRate = $derived(
		currencyStore.value === "USD"
			? 1
			: data.currencyRate.find((v) => v.code === currencyStore.value)?.rate || 0,
	);
	const inventorySum = $derived(
		data.inventory.reduce((acc, v) => acc + v.sum * currentCurrencyRate, 0),
	);
</script>

<svelte:head>
	<title>{data.profileInfo.nick} | CaseValue</title>
</svelte:head>

<div class="flex w-full flex-col gap-4">
	<div class="flex gap-2">
		<Button href="/" size="icon" variant="outline">
			<ArrowLeft />
		</Button>
		<form
			method="post"
			class="flex w-full items-center gap-2"
			use:enhance={({ cancel }) => {
				processing = true;
				cancel();
				goto(`/users/${userInput}`);
			}}
		>
			<Input
				name="user"
				type="text"
				placeholder="Steam profile name"
				bind:value={userInput}
				disabled={processing}
			/>
			<Button type="submit" size="icon" class="shrink-0" disabled={!userInput || processing}>
				<Search />
			</Button>
		</form>
	</div>
	<div class="flex w-full flex-col items-start gap-4 lg:flex-row">
		<div class="top-4 w-full max-w-96 shrink-0 lg:sticky">
			<div class="relative flex flex-col gap-4 rounded-xl border-[1px] p-6">
				<div class="flex items-center justify-start gap-4">
					<img
						src="https://avatars.steamstatic.com/{data.profileInfo.avatarHash}_full.jpg"
						alt={data.profileInfo.nick}
						class="h-12 w-12 rounded-full"
					/>
					<a
						href="https://steamcommunity.com/id/{data.search}"
						target="_blank"
						class="flex items-center gap-2 hover:underline"
					>
						<h2 class="text-lg font-semibold">{data.profileInfo.nick}</h2>
						<SquareArrowOutUpRight size={20} />
					</a>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="absolute right-4 top-4">
							<EllipsisVertical size={16} />
							<span class="sr-only">Profile actions</span>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.Item disabled={true}>Update profile</DropdownMenu.Item>
							<DropdownMenu.Item disabled={true}>Update inventory</DropdownMenu.Item>
							<DropdownMenu.Item disabled={true}>Update prices</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<div class="flex flex-col text-sm">
					<div class="flex justify-between gap-4 border-y-[1px] p-2">
						<span class="text-nowrap">Last price update</span>
						<span class="text-nowrap">{data.profileInfo.updatedAt.toLocaleString()}</span>
					</div>
					<div class="flex justify-between gap-4 p-2">
						<span>Case count</span>
						<span>{data.inventory.reduce((acc, v) => acc + v.count, 0)}</span>
					</div>
					<div class="flex justify-between gap-4 border-y-[1px] p-2">
						<span>Total case value</span>
						<span>
							{currencies[currencyStore.value].currencyFormatter(inventorySum.toFixed(2))}
						</span>
					</div>
				</div>
			</div>
		</div>

		<div class="flex w-full flex-col gap-4">
			<div
				class="relative min-h-96 w-full grow rounded-xl border-[1px] p-6 {!browser
					? 'flex items-center justify-center'
					: ''}"
			>
				{#if !browser}
					<LoaderCircle class="h-16 w-16 animate-spin" />
				{:else}
					<Popover.Root>
						<Popover.Trigger class="absolute right-2 top-2">
							<EllipsisVertical size={16} />
						</Popover.Trigger>
						<Popover.Content align="end" class="w-80">
							<div class="grid gap-4">
								<h4 class="font-medium leading-none">Viewing settings</h4>
								<div class="flex flex-col items-center gap-4">
									<div class="grid w-full grid-cols-2 items-center gap-4">
										<Label>View type</Label>
										<Select.Root
											type="single"
											allowDeselect={false}
											value={tableStore.value.view}
											onValueChange={(newValue) => (tableStore.value.view = newValue)}
										>
											<Select.Trigger class="capitalize">
												{tableStore.value.view}
											</Select.Trigger>
											<Select.Content>
												<Select.Group>
													{#each ["list", "grid"] as field}
														<Select.Item value={field} class="capitalize">{field}</Select.Item>
													{/each}
												</Select.Group>
											</Select.Content>
										</Select.Root>
									</div>
									<div class="grid w-full grid-cols-2 items-center gap-4">
										<Label>Sorting field</Label>
										<Select.Root
											type="single"
											allowDeselect={false}
											value={tableStore.value.by}
											onValueChange={(newValue) => (tableStore.value.by = newValue)}
										>
											<Select.Trigger class="capitalize">
												{tableStore.value.by}
											</Select.Trigger>
											<Select.Content>
												<Select.Group>
													{#each ["name", "count", "price", "sum"] as field}
														<Select.Item value={field} class="capitalize">{field}</Select.Item>
													{/each}
												</Select.Group>
											</Select.Content>
										</Select.Root>
									</div>
									<div class="grid w-full grid-cols-2 items-center gap-4">
										<Label>Sorting direction</Label>
										<Select.Root
											type="single"
											allowDeselect={false}
											value={tableStore.value.order}
											onValueChange={(newValue) => (tableStore.value.order = newValue)}
										>
											<Select.Trigger class="capitalize">
												{tableStore.value.order}
											</Select.Trigger>
											<Select.Content>
												<Select.Group>
													{#each ["ASC", "DESC"] as field}
														<Select.Item value={field} class="capitalize">{field}</Select.Item>
													{/each}
												</Select.Group>
											</Select.Content>
										</Select.Root>
									</div>
								</div>
							</div></Popover.Content
						>
					</Popover.Root>
					{#if tableStore.value.view === "grid"}
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
							{#each data.inventory.sort((a, b) => {
								const key = tableStore.value.by as "name" | "price" | "count" | "sum";
								const direction = tableStore.value.order === "ASC" ? 1 : -1;
								if (key === "name") {
									console.log(direction);
									return direction * a[key].localeCompare(b[key]);
								}
								return direction * ((a[key] as number) - (b[key] as number));
							}) as entry}
								<div
									class="flex flex-col justify-between gap-2 rounded-xl p-2 hover:bg-primary-foreground"
								>
									<div class="relative">
										<img
											src="https://community.cloudflare.steamstatic.com/economy/image/{entry.iconHash}"
											alt={entry.name}
										/>
										<Badge variant="secondary" class="absolute left-0 top-0 cursor-default">
											{entry.count}x
										</Badge>
										<Badge variant="secondary" class="absolute right-0 top-0 cursor-default">
											{currencies[currencyStore.value].currencyFormatter(
												(entry.price * currentCurrencyRate).toFixed(2),
											)}
										</Badge>
										<div class="text-balance text-center text-xs">{entry.name}</div>
									</div>
									<div class="flex flex-col items-center gap-2">
										<Badge variant="default" class="cursor-default self-center">
											{currencies[currencyStore.value].currencyFormatter(
												(entry.price * currentCurrencyRate * entry.count).toFixed(2),
											)}
										</Badge>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="flex w-full flex-col">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head class="w-[100px]">Image</Table.Head>
										<Table.Head>Name</Table.Head>
										<Table.Head class="text-right">Count</Table.Head>
										<Table.Head class="text-right">Price</Table.Head>
										<Table.Head class="text-right">Sum</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each data.inventory.sort((a, b) => {
										const key = tableStore.value.by as "name" | "price" | "count" | "sum";
										const direction = tableStore.value.order === "ASC" ? 1 : -1;
										if (key === "name") {
											console.log(direction);
											return direction * a[key].localeCompare(b[key]);
										}
										return direction * ((a[key] as number) - (b[key] as number));
									}) as entry}
										<Table.Row>
											<Table.Cell>
												<img
													src="https://community.cloudflare.steamstatic.com/economy/image/{entry.iconHash}"
													alt={entry.name}
												/>
											</Table.Cell>
											<Table.Cell>{entry.name}</Table.Cell>
											<Table.Cell class="text-right">{entry.count}</Table.Cell>
											<Table.Cell class="text-right">
												{currencies[currencyStore.value].currencyFormatter(
													(entry.price * currentCurrencyRate).toFixed(2),
												)}
											</Table.Cell>
											<Table.Cell class="text-right">
												{currencies[currencyStore.value].currencyFormatter(
													(entry.price * currentCurrencyRate * entry.count).toFixed(2),
												)}
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					{/if}
				{/if}
			</div>
			{#if browser}
				<div class="min-h-96 grow">
					<TimeChart
						data={data.chartData
							.filter((v) => v.code === currencyStore.value)
							.map((v) => ({ time: v.createdAt, value: v.sum }))}
					/>
				</div>
			{/if}
		</div>
	</div>
</div>
