# Vanderbilt dissertation — Eleventy + Pandoc

One set of Markdown chapters produces three outputs:

| Output | Tool | Command |
|---|---|---|
| Website (interactive demos, KaTeX, APA citations) | Eleventy 3 | `npm start` / `npm run build` → `_site/` |
| PDF in the layout of the [Vanderbilt 2026 LaTeX template](https://www.overleaf.com/latex/templates/vanderbilt-university-dissertation-template-2026/bpfmrtczfgwj) | pandoc → LaTeX → latexmk | `npm run pdf` → `build/thesis.pdf` |
| Standalone `.tex` (e.g. to upload to Overleaf) | pandoc | `npm run tex` → `build/thesis.tex` |
| Word | pandoc | `npm run docx` → `build/thesis.docx` |

`npm run export` builds the PDF and the Word file.

Requirements: Node 20+, pandoc 3.2+, a TeX distribution with `latexmk`, and `rsvg-convert` (`brew install librsvg`) for converting SVG figures.

## Layout

```
content/
  _data/thesis.yaml        title, author, committee, front matter, print settings (shared by 11ty + pandoc)
  chapters/01-*.md ...     chapters in Pandoc Markdown, in filename order. Front matter: just `title:`
  references.bib           BibTeX library
  figures/                 images (SVG/PNG); reference as /figures/x.svg
  demos/                   JS for interactive demos
  _includes/, assets/      web layouts + CSS (deliberately minimal)
export/
  vanderbilt.latex         pandoc LaTeX template that mirrors the Overleaf template
  reference.docx           Word styles (regenerate: python3 scripts/make-reference-docx.py)
  apa.csl                  APA 7 (used by the web output and the Word export)
  filters/web-to-print.lua turns demos into static figures, fixes image paths, SVG→PDF/PNG
scripts/export.js          joins the chapters and runs pandoc/latexmk
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

In the PDF and Word file, a `demo` block becomes a figure that uses the `fallback` image and adds a note pointing readers to `site-url`.

## Known limitations / next steps

- Citations on the web only support plain keys (`[@key]`). They don't support locators or prefixes like `[see @key, p. 3]`, which [eleventy-plugin-citations](https://github.com/leaverou/eleventy-plugin-citations) doesn't handle. Pandoc does.
- Cross-references such as `@fig:plot` aren't wired up yet. Options are [pandoc-crossref](https://github.com/lierdakil/pandoc-crossref) for print plus a small markdown-it plugin for the web.
- The PDF uses natbib with `apalike` to match the Overleaf template. The web and Word outputs use APA 7 CSL, so the reference formatting is close but not identical.
- The Word output has no Vanderbilt title page or front matter, only a table of contents and the chapters. For a submission-ready Word file, start from the Graduate School's Word template and save it as `export/reference.docx`, keeping pandoc's style names.
- Check the title page wording, chapter heading style and font size against the current Graduate School guidelines. Edit `export/vanderbilt.latex` to match.
