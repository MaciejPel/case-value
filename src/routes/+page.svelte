<script lang="ts">
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Search } from "lucide-svelte";

	let userInput = $state("");
	let processing = $state(false);
</script>

<svelte:head>
	<title>Search | case value</title>
</svelte:head>
<div class="flex h-[calc(100svh-3rem)] items-center justify-center">
	<form
		method="post"
		class="flex w-full max-w-96 items-center gap-2"
		use:enhance={({ cancel }) => {
			processing = true;
			cancel();
			goto(`/users/${userInput}`);
		}}
	>
		<div class="flex w-full flex-col gap-2">
			<h2 class="text-center text-3xl font-semibold">case value</h2>
			<div class="flex items-center gap-2">
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
			</div>
		</div>
	</form>
</div>
