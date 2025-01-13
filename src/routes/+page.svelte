<script lang="ts">
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Search } from "lucide-svelte";

	let userInput = $state("M4k3y");
	let processing = $state(false);
</script>

<svelte:head>
	<title>Search | CaseValue</title>
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
