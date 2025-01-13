import { browser } from "$app/environment";

export const tableStoreOptions = {
	by: ["name", "count", "price", "sum"],
	order: ["ASC", "DESC"],
	view: ["grid", "list"],
};

export class TableStore {
	value = $state({ by: "sum", order: "DESC", view: "grid" });
	key = "table_config";

	constructor() {
		if (browser) {
			let item = JSON.parse(localStorage.getItem(this.key) || "{}");
			if (
				!item ||
				!tableStoreOptions.by.includes(item.by) ||
				!tableStoreOptions.order.includes(item.order) ||
				!tableStoreOptions.view.includes(item.view)
			)
				item = { by: "sum", order: "DESC", view: "grid" };
			this.value = item;
		}

		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(this.key, JSON.stringify(this.value));
			});
			return () => {};
		});
	}
}

export const tableStore = new TableStore();
