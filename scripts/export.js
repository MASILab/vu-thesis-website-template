#!/usr/bin/env node
// Concatenate chapters -> build/thesis.md, then run pandoc.
//   node scripts/export.js pdf|tex|docx|all
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { load as yamlLoad } from "js-yaml";

const target = process.argv[2] ?? "all";
const root = process.cwd();
const build = path.join(root, "build");
fs.mkdirSync(path.join(build, "figures"), { recursive: true });

// 1. Chapters -> one Markdown file, front-matter `title` becomes the chapter heading.
const chapterDir = path.join(root, "content/chapters");
const files = fs.readdirSync(chapterDir).filter((f) => f.endsWith(".md")).sort();
let md = "";
for (const f of files) {
	const raw = fs.readFileSync(path.join(chapterDir, f), "utf8");
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	const data = m ? yamlLoad(m[1]) ?? {} : {};
	const body = m ? raw.slice(m[0].length) : raw;
	const slug = path.basename(f, ".md").replace(/^\d+-/, "");
	md += `# ${data.title ?? slug} {#ch:${slug}}\n\n${body.trim()}\n\n`;
}
fs.writeFileSync(path.join(build, "thesis.md"), md);

// 2. SVG figures -> PDF (for LaTeX) and PNG (for Word).
for (const f of fs.readdirSync(path.join(root, "content/figures"))) {
	if (!f.endsWith(".svg")) continue;
	const src = path.join(root, "content/figures", f);
	const stem = path.basename(f, ".svg");
	run("rsvg-convert", ["-f", "pdf", "-o", path.join(build, "figures", stem + ".pdf"), src]);
	run("rsvg-convert", ["-f", "png", "-z", "3", "-o", path.join(build, "figures", stem + ".png"), src]);
}

// 3. Pandoc.
const common = [
	"build/thesis.md",
	"--from=markdown",
	"--metadata-file=content/_data/thesis.yaml",
	"--lua-filter=export/filters/web-to-print.lua",
	"--top-level-division=chapter",
	"--bibliography=content/references.bib",
];

if (["tex", "pdf", "all"].includes(target)) {
	run("pandoc", [...common, "--template=export/vanderbilt.latex", "--natbib", "--standalone", "-o", "build/thesis.tex"]);
	// pandoc writes \bibliography{content/references.bib}; LaTeX runs in build/, so point at the real file.
	const tex = fs.readFileSync("build/thesis.tex", "utf8").replace(/\\bibliography\{content\/references(\.bib)?\}/, `\\bibliography{${path.join(root, "content/references")}}`);
	fs.writeFileSync("build/thesis.tex", tex);
	if (target !== "tex") {
		run("latexmk", ["-pdf", "-interaction=nonstopmode", "-halt-on-error", "-silent", "-cd", "build/thesis.tex"]);
		console.log("✓ build/thesis.pdf");
	} else console.log("✓ build/thesis.tex");
}
if (["docx", "all"].includes(target)) {
	run("pandoc", [...common, "--citeproc", "--csl=export/apa.csl", "--metadata=reference-section-title:References", "--reference-doc=export/reference.docx", "--toc", "--number-sections", "-o", "build/thesis.docx"]);
	console.log("✓ build/thesis.docx");
}

function run(cmd, args) {
	execFileSync(cmd, args, { stdio: ["ignore", "inherit", "inherit"] });
}
