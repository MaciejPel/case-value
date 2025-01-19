<script lang="ts">
	import { navigating, page } from "$app/state";
	import { applyAction, enhance } from "$app/forms";
	import { goto, invalidateAll } from "$app/navigation";
	import { browser } from "$app/environment";
	import type { ActionData, PageData } from "./$types";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import Input from "$lib/components/ui/input/input.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import * as Popover from "$lib/components/ui/popover";
	import Label from "$lib/components/ui/label/label.svelte";
	import * as Select from "$lib/components/ui/select";
	import * as Table from "$lib/components/ui/table";
	import { toast } from "svelte-sonner";
	import TimeChart from "$lib/components/TimeChart.svelte";
	import {
		ArrowLeft,
		SquareArrowOutUpRight,
		Search,
		EllipsisVertical,
		LoaderCircle,
	} from "lucide-svelte";
	import { currencyStore } from "$lib/stores/currencyStore.svelte";
	import { tableStore, tableStoreOptions } from "$lib/stores/tableStore.svelte";

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let userInput = $state(page.params.name);
	let caseIdFilter = $state("");
	let processing = $state(false);

	const currencies: {
		[key: string]: { name: string; currencyFormatter: (price: string) => string };
	} = {
		USD: { name: "USD", currencyFormatter: (price) => `$ ${price}` },
		PLN: { name: "PLN", currencyFormatter: (price) => ` ${price} zł` },
		EUR: { name: "EUR", currencyFormatter: (price) => `€ ${price}` },
	};

	let itemsObj = $derived(
		data.items.reduce(
			(acc, v) => {
				acc[v.id] = { name: v.name, iconHash: v.iconHash };
				return acc;
			},
			{} as { [key: string]: { name: string; iconHash: string } },
		),
	);
	let inventoryOverTime = $derived(
		Object.values(
			data.inventoryOverTime.reduce(
				(acc, v) => {
					const dateKey = v.createdAt.toISOString();
					const item = { id: v.id, price: v.price, count: v.count, sum: v.sum };
					if (!acc[dateKey]) acc[dateKey] = { date: v.createdAt, items: [] };
					acc[dateKey].items.push(item);
					return acc;
				},
				{} as {
					[key: string]: {
						date: Date;
						items: { id: string; price: number; count: number; sum: number }[];
					};
				},
			),
		),
	);
	let lastUpdate = $derived(inventoryOverTime.at(-1));
	let currentCurrencyRate = $derived(
		currencyStore.value === "USD"
			? 1
			: data.currencyRatesOverTime.find(
					(v) =>
						v.code === currencyStore.value &&
						v.createdAt.toISOString() === lastUpdate?.date.toISOString(),
				)?.rate || 0,
	);
	let totalCaseCount = $derived(lastUpdate?.items.reduce((acc, v) => acc + v.count, 0));
	let totalCaseValue = $derived(
		lastUpdate?.items.reduce((acc, v) => acc + v.count * v.price * currentCurrencyRate, 0) || 0,
	);
	let sortedData = $derived(
		[...(lastUpdate?.items || [])].sort((a, b) => {
			const key = tableStore.value.by as "name" | "price" | "count" | "sum";
			const direction = tableStore.value.order === "ASC" ? 1 : -1;
			if (key === "name") return direction * itemsObj[a.id].name.localeCompare(itemsObj[b.id].name);
			return direction * ((a[key] as number) - (b[key] as number));
		}),
	);

	$effect(() => {
		processing = navigating.type === "goto";
	});
</script>

<svelte:head>
	<title>{data.profileInfo.nick} | case value</title>
</svelte:head>
<div class="flex w-full flex-col gap-4">
	<div class="flex gap-2">
		<Button href="/" size="icon" variant="outline" class="shrink-0"><ArrowLeft /></Button>
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
						href="https://steamcommunity.com/id/{page.params.name}"
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
							<form
								method="post"
								use:enhance={() => {
									return async ({ result }) => {
										if (result.status === 200) {
											toast("Profile updated");
											invalidateAll();
										} else toast(form?.message || "Something went wrong");
										await applyAction(result);
									};
								}}
								action="?/updateProfile"
							>
								<DropdownMenu.Item>
									<input
										type="submit"
										value="Update profile"
										class="h-full w-full text-left outline-0"
									/>
								</DropdownMenu.Item>
							</form>
							<form
								method="post"
								use:enhance={() => {
									return async ({ result }) => {
										if (result.status === 200) {
											toast("Inventory updated");
											invalidateAll();
										} else toast(form?.message || "Something went wrong");
										await applyAction(result);
									};
								}}
								action="?/updateInventory"
							>
								<DropdownMenu.Item>
									<input
										type="submit"
										value="Update inventory"
										class="h-full w-full text-left outline-0"
									/>
								</DropdownMenu.Item>
							</form>
							<DropdownMenu.Item disabled={true}>Update prices</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<div class="flex flex-col text-sm">
					<div class="flex justify-between gap-4 border-y-[1px] p-2">
						<span class="text-nowrap">Last price update</span>
						<span class="text-nowrap">{lastUpdate?.date.toLocaleString()}</span>
					</div>
					<div class="flex justify-between gap-4 p-2">
						<span>Case count</span>
						<span>{totalCaseCount}</span>
					</div>
					<div class="flex justify-between gap-4 border-y-[1px] p-2">
						<span>Total case value</span>
						<span>
							{currencies[currencyStore.value].currencyFormatter(totalCaseValue.toFixed(2))}
						</span>
					</div>
				</div>
			</div>
		</div>
		<div class="flex w-full flex-col gap-4">
			<div
				class="relative h-full min-h-96 w-full grow rounded-xl border-[1px] p-6 {!browser ||
				!lastUpdate?.items.length
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
											<Select.Trigger class="capitalize">{tableStore.value.view}</Select.Trigger>
											<Select.Content>
												<Select.Group>
													{#each tableStoreOptions.view as option}
														<Select.Item value={option} class="capitalize">{option}</Select.Item>
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
													{#each tableStoreOptions.by as option}
														<Select.Item value={option} class="capitalize">{option}</Select.Item>
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
													{#each tableStoreOptions.order as option}
														<Select.Item value={option} class="capitalize">{option}</Select.Item>
													{/each}
												</Select.Group>
											</Select.Content>
										</Select.Root>
									</div>
								</div>
							</div>
						</Popover.Content>
					</Popover.Root>
					{#if !sortedData.length}
						<div>Cases not found in this profile</div>
					{:else if tableStore.value.view === "grid"}
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							{#each sortedData as entry (entry.id)}
								<div
									class="flex cursor-pointer flex-col justify-between gap-2 rounded-xl p-2 hover:bg-primary-foreground"
									onclick={() => {
										if (caseIdFilter === entry.id) caseIdFilter = "";
										else caseIdFilter = entry.id;
									}}
								>
									<div class="relative">
										<img
											src="https://community.cloudflare.steamstatic.com/economy/image/{itemsObj[
												entry.id
											].iconHash}"
											alt={itemsObj[entry.id].name}
										/>
										<Badge variant="secondary" class="absolute left-0 top-0 cursor-default">
											{entry.count}x
										</Badge>
										<Badge variant="secondary" class="absolute right-0 top-0 cursor-default">
											{currencies[currencyStore.value].currencyFormatter(
												(entry.price * currentCurrencyRate).toFixed(2),
											)}
										</Badge>
										{#if entry.id === caseIdFilter}
											<div
												class="absolute bottom-0 right-0 h-4 w-4 animate-pulse rounded-full bg-teal-300"
											></div>
										{/if}
										<div class="text-balance text-center text-xs">{itemsObj[entry.id].name}</div>
									</div>
									<div class="flex flex-col items-center gap-2">
										<Badge variant="default" class="cursor-default self-center">
											{currencies[currencyStore.value].currencyFormatter(
												(entry.sum * currentCurrencyRate).toFixed(2),
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
										<Table.Head class="w-24">Image</Table.Head>
										<Table.Head class="text-nowrap">Name</Table.Head>
										<Table.Head class="text-nowrap text-right">Count</Table.Head>
										<Table.Head class="text-nowrap text-right">Price</Table.Head>
										<Table.Head class="text-nowrap text-right">Sum</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each sortedData as entry (entry.id)}
										<Table.Row
											class="cursor-pointer"
											onclick={() => {
												if (caseIdFilter === entry.id) caseIdFilter = "";
												else caseIdFilter = entry.id;
											}}
										>
											<Table.Cell>
												<img
													src="https://community.cloudflare.steamstatic.com/economy/image/{itemsObj[
														entry.id
													].iconHash}"
													alt={itemsObj[entry.id].name}
												/>
											</Table.Cell>
											<Table.Cell class="text-nowrap">{itemsObj[entry.id].name}</Table.Cell>
											<Table.Cell class="text-nowrap text-right">{entry.count}</Table.Cell>
											<Table.Cell class="text-nowrap text-right">
												{currencies[currencyStore.value].currencyFormatter(
													(entry.price * currentCurrencyRate).toFixed(2),
												)}
											</Table.Cell>
											<Table.Cell class="text-nowrap text-right">
												{currencies[currencyStore.value].currencyFormatter(
													(entry.sum * currentCurrencyRate).toFixed(2),
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
			{#if browser && data.inventoryOverTime.length}
				<div class="min-h-96 grow">
					{#if caseIdFilter}
						<TimeChart
							data={data.inventoryOverTime
								.filter((v) => v.id === caseIdFilter)
								.map((v) => ({
									time: v.createdAt,
									value: Number((v.price * currentCurrencyRate).toFixed(2)),
								}))}
						/>
					{:else}
						<TimeChart
							data={inventoryOverTime.map((v) => {
								const value = v.items.reduce((acc, v) => acc + v.price * v.count, 0);
								return { time: v.date, value: Number((value * currentCurrencyRate).toFixed(2)) };
							})}
						/>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
