#!/usr/bin/env node
// Concatenate chapters -> build/thesis.md, then pandoc -> LaTeX (Vanderbilt template) -> PDF.
//   node scripts/export.js        build/thesis.pdf
//   node scripts/export.js tex    build/thesis.tex only (e.g. to upload to Overleaf)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { load as yamlLoad } from "js-yaml";

const target = process.argv[2] ?? "pdf";
const root = process.cwd();
const build = path.join(root, "build");
fs.mkdirSync(path.join(build, "figures"), { recursive: true });

// 1. Chapters -> one Markdown file; front-matter `title` (or `part`) becomes the heading.
const chapterDir = path.join(root, "content/chapters");
const files = fs.readdirSync(chapterDir).filter((f) => f.endsWith(".md")).sort();
let md = "";
for (const f of files) {
	const raw = fs.readFileSync(path.join(chapterDir, f), "utf8");
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	const data = m ? yamlLoad(m[1]) ?? {} : {};
	const body = m ? raw.slice(m[0].length) : raw;
	const slug = path.basename(f, ".md").replace(/^\d+-/, "");
	// `part:` files become \part{...} (see the Lua filter); everything else is a chapter.
	md += data.part
		? `# ${data.part} {.part #part:${slug}}\n\n${body.trim()}\n\n`
		: `# ${data.title ?? slug} {#ch:${slug}}\n\n${body.trim()}\n\n`;
}
fs.writeFileSync(path.join(build, "thesis.md"), md);

// 2. SVG figures -> PDF for pdflatex.
for (const f of fs.readdirSync(path.join(root, "content/figures"))) {
	if (!f.endsWith(".svg")) continue;
	const stem = path.basename(f, ".svg");
	run("rsvg-convert", ["-f", "pdf", "-o", path.join(build, "figures", stem + ".pdf"), path.join(root, "content/figures", f)]);
}

// 3. pandoc -> build/thesis.tex
run("pandoc", [
	"build/thesis.md",
	"--from=markdown",
	"--metadata-file=content/_data/thesis.yaml",
	"--lua-filter=export/filters/web-to-print.lua",
	"--top-level-division=chapter",
	"--bibliography=content/references.bib",
	"--natbib",
	"--template=export/latex/vanderbilt.latex",
	"--standalone",
	"-o", "build/thesis.tex",
]);
// LaTeX runs inside build/, so point \bibliography at the real file.
const texPath = path.join(build, "thesis.tex");
const tex = fs.readFileSync(texPath, "utf8").replace(/\\bibliography\{content\/references(\.bib)?\}/, `\\bibliography{${path.join(root, "content/references")}}`);
fs.writeFileSync(texPath, tex);
if (target === "tex") {
	console.log("✓ build/thesis.tex  (needs export/latex/sfchap.sty + sfsection.sty alongside it)");
	process.exit(0);
}

// 4. latexmk (sfchap.sty / sfsection.sty are found via TEXINPUTS)
run("latexmk", ["-pdf", "-interaction=nonstopmode", "-halt-on-error", "-silent", "-cd", "build/thesis.tex"], {
	TEXINPUTS: `${path.join(root, "export/latex")}//:`,
});
console.log("✓ build/thesis.pdf");

function run(cmd, args, env = {}) {
	execFileSync(cmd, args, { stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, ...env } });
}
