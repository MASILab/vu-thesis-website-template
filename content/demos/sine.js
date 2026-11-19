// Minimal interactive demo. Any JS/library works here; it only runs on the web.
const canvas = document.getElementById("sine-canvas");
const slider = document.getElementById("sine-k");
const ctx = canvas.getContext("2d");

function draw() {
	const k = Number(slider.value);
	const { width: w, height: h } = canvas;
	ctx.clearRect(0, 0, w, h);
	ctx.strokeStyle = getComputedStyle(document.body).color;
	ctx.lineWidth = 2;
	ctx.beginPath();
	for (let px = 0; px <= w; px++) {
		const x = (px / w) * 2 * Math.PI;
		const y = h / 2 - Math.sin(k * x) * (h / 2 - 10);
		px ? ctx.lineTo(px, y) : ctx.moveTo(px, y);
	}
	ctx.stroke();
}
slider.addEventListener("input", draw);
draw();
