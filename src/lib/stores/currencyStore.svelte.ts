import { browser } from "$app/environment";
import { currencies } from "$lib/constants";

export class CurrencyStore {
	value = $state(currencies[0]);
	key = "currency";

	constructor() {
		if (browser) {
			let item = localStorage.getItem(this.key) || currencies[0];
			if (!currencies.includes(item)) item = currencies[0];
			this.value = item;
		}

		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(this.key, this.value);
			});
			return () => {};
		});
	}
}

export const currencyStore = new CurrencyStore();
