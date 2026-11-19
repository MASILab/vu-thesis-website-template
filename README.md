# Vanderbilt dissertation — Eleventy + Pandoc

One set of Markdown chapters produces:

| Output | Tool | Command |
|---|---|---|
| Website (interactive demos, KaTeX, APA citations) | Eleventy 3 | `npm start` / `npm run build` → `_site/` |
| PDF in the official [Vanderbilt 2026 LaTeX template](https://www.overleaf.com/latex/templates/vanderbilt-university-dissertation-template-2026/bpfmrtczfgwj) | pandoc → LaTeX → latexmk | `npm run pdf` → `build/thesis.pdf` |
| `.tex` (e.g. for Overleaf, together with `export/latex/*.sty`) | pandoc | `npm run tex` → `build/thesis.tex` |

Requirements: Node 20+, pandoc 3.2+, a TeX distribution with `latexmk`, and `rsvg-convert` (`brew install librsvg`) for SVG figures.

## How the PDF matches the template

`export/latex/vanderbilt.latex` uses the Graduate School's preamble, title page, copyright,
dedication and acknowledgments pages, front-matter sequence, spacing and pagination
**verbatim**. `sfchap.sty` and `sfsection.sty` are copied unchanged. Only your text comes from
`content/_data/thesis.yaml`. The Lua filter writes figures (`[h]`, `\centering`, caption below),
tables (`[b]`, `\scriptsize`, `tabularx` at `0.6\textwidth`, booktabs) and underlines exactly the way
the template's sample chapters do.

To verify this, the template's own sample content was run through this pipeline and compared with the
original compiled PDF at 100 dpi. 14 of 15 pages were pixel-identical. The remaining page differs only in
the kerning of one pair of curly quotes that were typed directly in the original source.

Per-element overrides: `{placement="t"}` on a figure, `{#tbl:x placement=h width=0.9\textwidth}` in a
table caption.

## Layout

```
content/
  _data/thesis.yaml        title, name, major, date, committee, optional pages (shared by 11ty + pandoc)
  chapters/01-*.md ...     chapters in Pandoc Markdown, in filename order. Front matter: just `title:`
  references.bib           BibTeX library (PDF: natbib + apalike, as in the template)
  figures/                 images (SVG/PNG/JPG); reference as /figures/x.svg
  demos/                   JS for interactive demos
  _includes/, assets/      web layouts + CSS (deliberately minimal)
export/
  latex/vanderbilt.latex   pandoc template = the Vanderbilt template + placeholders
  latex/sfchap.sty, sfsection.sty   unchanged from the template
  apa.csl                  APA 7 for web citations
  filters/web-to-print.lua demos → static figures, template-style figures/tables, SVG → PDF
scripts/export.js          joins the chapters and runs pandoc and latexmk
```

## Writing syntax (works in every output)

```markdown
Citation [@knuth1984] or several [@a; @b].

Inline $E=mc^2$, display:
$$ \hat\beta = (X^\top X)^{-1} X^\top y $$

![Caption text, may contain $x$.](/figures/plot.svg){#fig:plot width=70%}

| a | b |
|---|---|
| 1 | 2 |

: Table caption. {#tbl:results}

Footnote.[^1]

[^1]: Text.

::: {.demo #fig:sine fallback="/figures/sine.png" caption="Caption for both outputs."}
<canvas id="c"></canvas>
<script type="module" src="/demos/sine.js"></script>
:::
```

In the PDF, a `demo` block becomes a figure that uses the `fallback` image and adds a note pointing readers to `site-url`.

## Known limitations / next steps

- Citations on the web only support plain keys (`[@key]`). They don't support locators or prefixes like `[see @key, p. 3]`; pandoc does, in the PDF.
- Cross-references such as `@fig:plot` aren't wired up yet (pandoc-crossref + a markdown-it plugin).
- The List of Abbreviations (`nomencl`) stays commented out, as it is in the template.
- Tables with merged cells fall back to pandoc's `longtable`, which doesn't match the template's table style.
