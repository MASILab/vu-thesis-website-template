# Vanderbilt thesis website template

Write your dissertation once in Markdown and get two outputs:

- **A website** (Eleventy) with citations, KaTeX math, figures and interactive JavaScript demos.
- **A PDF** in the official [Vanderbilt 2026 LaTeX template](https://www.overleaf.com/latex/templates/vanderbilt-university-dissertation-template-2026/bpfmrtczfgwj), built with pandoc and LaTeX.

## Installation

You need Node.js 20+, pandoc 3.2+, a TeX distribution that includes `latexmk`, and `rsvg-convert`. On macOS:

```bash
brew install node pandoc librsvg
brew install --cask mactex-no-gui
```

Then install the project's dependencies:

```bash
npm install
```

## Usage

| Command | What it does |
|---|---|
| `npm start` | Live preview of the website at http://localhost:8080 |
| `npm run build` | Builds the static website into `_site/` |
| `npm run pdf` | Builds the dissertation PDF at `build/thesis.pdf` |
| `npm run tex` | Writes `build/thesis.tex` only (for Overleaf, upload it together with `export/latex/*.sty`) |

### Where things go

| File | Contents |
|---|---|
| `content/_data/thesis.yaml` | Title, name, major, date, committee, and the optional copyright, dedication and acknowledgments pages |
| `content/chapters/NN-name.md` | One file per chapter, in filename order. Front matter is just `title:`, and sections start at `##`. |
| `content/references.bib` | BibTeX library |
| `content/figures/` | Images (SVG, PNG or JPG). SVGs are converted to PDF for print automatically. |
| `content/demos/` | JavaScript for the interactive demos |

### Markdown syntax

The same syntax works on the website and in the PDF:

```markdown
Citation [@knuth1984], or several [@a; @b].

Inline math $E=mc^2$, or display math:
$$ \hat\beta = (X^\top X)^{-1} X^\top y $$

![Caption, may contain $x$.](/figures/plot.svg){#fig:plot width=70%}

| Model | Accuracy |
|:------|---------:|
| Ours  |     0.89 |

: Table caption. {#tbl:results}

::: {.demo fallback="/figures/plot.svg" caption="Shown on the web as a live demo, in the PDF as the fallback image."}
<div id="my-demo"></div>
<script type="module" src="/demos/my-demo.js"></script>
:::
```

## About the PDF

`export/latex/vanderbilt.latex` contains the Graduate School's template verbatim (preamble, title page, preliminary pages, spacing and pagination), and `sfchap.sty` and `sfsection.sty` are copied unchanged. When the template's own sample content is built with this pipeline, 14 of the 15 pages are pixel-identical to the original PDF.

Figures default to `[h]` placement and tables to `[b]`, as in the template. To change this, add `{placement="t"}` to a figure, or `placement=t` to a table's caption attributes.

## Limitations

- Website citations support plain keys only. Locators and prefixes such as `[see @key, p. 3]` work in the PDF but not on the website.
- Cross-references such as `@fig:plot` aren't supported yet.
- Tables with merged cells use pandoc's default table style, which doesn't match the template.
