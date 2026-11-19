import { load as yamlLoad } from "js-yaml";
import citations from "eleventy-plugin-citations";
import { katex } from "@mdit/plugin-katex";
import markdownItAttrs from "markdown-it-attrs";
import markdownItContainer from "markdown-it-container";
import markdownItFootnote from "markdown-it-footnote";
import implicitFigures from "markdown-it-implicit-figures";

// Pandoc table captions: a paragraph starting with ": " right after a table
// becomes its <caption>; a trailing {#tbl:id} becomes the table's id.
function pandocTableCaptions(md) {
	md.core.ruler.push("pandoc_table_captions", (state) => {
		const t = state.tokens;
		for (let i = 0; i < t.length - 3; i++) {
			if (t[i].type !== "table_close" || t[i + 1].type !== "paragraph_open") continue;
			const inline = t[i + 2];
			if (!/^:\s/.test(inline.content)) continue;
			inline.children[0].content = inline.children[0].content.replace(/^:\s+/, "");
			const [open, , close] = t.splice(i + 1, 3);
			let j = i;
			while (t[j].type !== "table_open") j--;
			const id = open.attrGet("id");
			if (id) t[j].attrSet("id", id);
			open.tag = close.tag = "caption";
			open.attrs = null;
			t.splice(j + 1, 0, open, inline, close);
		}
	});
}

export default function (eleventyConfig) {
	// ---- Shared thesis metadata (also passed to pandoc via --metadata-file) ----
	eleventyConfig.addDataExtension("yaml", (contents) => yamlLoad(contents));

	// ---- Citations: pandoc-style [@key] syntax, same .bib + CSL as the print export ----
	eleventyConfig.addPlugin(citations, {
		bibliography: ["content/references.bib"],
		style: "export/apa.csl",
	});

	// ---- Markdown: KaTeX math, attributes, figures, footnotes, demo blocks ----
	eleventyConfig.amendLibrary("md", (md) => {
		md.use(katex, { output: "html" })
			.use(markdownItAttrs)
			.use(implicitFigures, { figcaption: true })
			.use(markdownItFootnote)
			// ::: {.demo fallback="/figures/x.svg" caption="..."}  ...raw HTML/JS...  :::
			// On the web the inner HTML runs; in PDF/DOCX a Lua filter swaps in the fallback image.
			.use(markdownItContainer, "demo", {
				validate: (params) => /^\s*(\{\s*\.demo\b|demo\b)/.test(params),
				render(tokens, idx) {
					const tok = tokens[idx];
					if (tok.nesting === 1) {
						const id = tok.attrGet("id");
						return `<figure class="demo"${id ? ` id="${id}"` : ""}>\n<div class="demo-stage">\n`;
					}
					// find the matching opening token to read its caption
					let depth = 0;
					for (let i = idx - 1; i >= 0; i--) {
						if (tokens[i].type === "container_demo_close") depth++;
						if (tokens[i].type === "container_demo_open" && depth-- === 0) {
							const cap = tokens[i].attrGet("caption");
							return `</div>\n${cap ? `<figcaption>${md.renderInline(cap)}</figcaption>\n` : ""}</figure>\n`;
						}
					}
					return "</div></figure>\n";
				},
			})
			.use(pandocTableCaptions);
	});

	// ---- Collections: chapters ordered by filename (01-, 02-, ...) ----
	eleventyConfig.addCollection("chapters", (api) =>
		api.getFilteredByGlob("content/chapters/*.md").sort((a, b) => a.inputPath.localeCompare(b.inputPath)),
	);

	// ---- Static files ----
	eleventyConfig.addPassthroughCopy("content/figures");
	eleventyConfig.addPassthroughCopy("content/demos");
	eleventyConfig.addPassthroughCopy("content/assets");
	eleventyConfig.addPassthroughCopy({ "node_modules/katex/dist": "assets/katex" });

	return {
		dir: { input: "content", output: "_site" },
		// Keep chapters as pure Pandoc Markdown: no Nunjucks pre-processing, so LaTeX
		// like `{{x}}` is safe and the same files feed pandoc unchanged.
		markdownTemplateEngine: false,
		htmlTemplateEngine: "njk",
	};
}
