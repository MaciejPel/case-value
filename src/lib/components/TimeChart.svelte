<script lang="ts">
	import { onMount } from "svelte";
	import { mode } from "mode-watcher";
	import * as d3 from "d3";

	let { data }: { data: { value: number; time: Date }[] } = $props();

	let chartContainer: HTMLElement;
	let svg: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: d3.ScaleTime<number, number, never>,
		y: d3.ScaleLinear<number, number, never>,
		line: d3.Line<{ value: number; time: Date }>,
		tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
	let width: number, height: number;
	const margin = { top: 10, right: 50, bottom: 70, left: 50 };

	onMount(() => {
		width = chartContainer.clientWidth - margin.left - margin.right;
		height = 600 - margin.top - margin.bottom;

		svg = d3
			.select(chartContainer)
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		x = d3
			.scaleTime()
			.domain(d3.extent(data, (d) => d.time) as [Date, Date])
			.range([0, width]);

		y = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d) => d.value)] as [number, number])
			.nice()
			.range([height, 0]);

		const xAxis = d3.axisBottom<Date>(x).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M"));
		const yAxis = d3.axisLeft(y);

		svg
			.append("g")
			.attr("transform", `translate(0,${height})`)
			.call(xAxis)
			.selectAll("text")
			.attr("transform", "rotate(-45)")
			.style("text-anchor", "end");

		svg.append("g").call(yAxis);

		line = d3
			.line<{ value: number; time: Date }>()
			.x((d) => x(d.time))
			.y((d) => y(d.value));

		svg
			.append("path")
			.datum(data)
			.attr("fill", "none")
			.attr("stroke", "steelblue")
			.attr("stroke-width", 1)
			.attr("d", line);

		tooltip = d3
			.select(chartContainer)
			.append("div")
			.style("position", "absolute")
			.style("background", $mode === "dark" ? "black" : "white")
			.style("color", $mode === "dark" ? "white" : "black")
			.style("border", "1px solid #555")
			.style("padding", "5px")
			.style("border-radius", "4px")
			.style("display", "none");

		svg
			.selectAll("circle")
			.data(data)
			.enter()
			.append("circle")
			.attr("cx", (d) => x(d.time))
			.attr("cy", (d) => y(d.value))
			.attr("r", 5)
			.attr("fill", "steelblue")
			.on("mouseover", (event, d) => {
				tooltip
					.style("display", "block")
					.html(`Time: ${d3.timeFormat("%Y-%m-%d %H:%M")(d.time)}<br>Total value: ${d.value}`)
					.style("left", `${event.pageX - (tooltip.node()?.clientWidth || 0) / 2}px`)
					.style("top", `${event.pageY - 50}px`);
			})
			.on("mouseout", () => {
				tooltip.style("display", "none");
			})
			.on("touchstart", (event, d) => {
				tooltip
					.style("display", "block")
					.html(`Time: ${d3.timeFormat("%Y-%m-%d %H:%M")(d.time)}<br>Total value: ${d.value}`)
					.style(
						"left",
						`${event.targetTouches[0].pageX - (tooltip.node()?.clientWidth || 0) / 2}px`,
					)
					.style("top", `${event.targetTouches[0].pageY - 50}px`);
			})
			.on("touchend", () => {
				tooltip.style("display", "none");
			});
	});

	function updateChart() {
		if (!svg) return;

		x.domain(d3.extent(data, (d) => d.time) as [Date, Date]);
		y.domain([0, d3.max(data, (d) => d.value)] as [number, number]).nice();

		svg.selectAll("*").remove();

		const xAxis = d3.axisBottom<Date>(x).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M"));
		const yAxis = d3.axisLeft(y);

		svg
			.append("g")
			.attr("transform", `translate(0,${height})`)
			.call(xAxis)
			.selectAll("text")
			.attr("transform", "rotate(-45)")
			.style("text-anchor", "end");

		svg.append("g").call(yAxis);

		svg
			.append("path")
			.datum(data)
			.attr("fill", "none")
			.attr("stroke", "steelblue")
			.attr("stroke-width", 1)
			.attr("d", line);

		svg
			.selectAll("circle")
			.data(data)
			.enter()
			.append("circle")
			.attr("cx", (d) => x(d.time))
			.attr("cy", (d) => y(d.value))
			.attr("r", 5)
			.attr("fill", "steelblue")
			.on("mouseover", (event, d) => {
				tooltip
					.style("display", "block")
					.html(`Time: ${d3.timeFormat("%Y-%m-%d %H:%M")(d.time)}<br>Total value: ${d.value}`)
					.style("left", `${event.pageX - (tooltip.node()?.clientWidth || 0) / 2}px`)
					.style("top", `${event.pageY - 50}px`);
			})
			.on("mouseout", () => {
				tooltip.style("display", "none");
			})
			.on("touchstart", (event, d) => {
				tooltip
					.style("display", "block")
					.html(`Time: ${d3.timeFormat("%Y-%m-%d %H:%M")(d.time)}<br>Total value: ${d.value}`)
					.style(
						"left",
						`${event.targetTouches[0].pageX - (tooltip.node()?.clientWidth || 0) / 2}px`,
					)
					.style("top", `${event.targetTouches[0].pageY - 50}px`);
			})
			.on("touchend", () => {
				tooltip.style("display", "none");
			});
	}

	$effect(() => {
		if (data.length) updateChart();
	});
</script>

<div bind:this={chartContainer} class="mb-12 text-xs"></div>
