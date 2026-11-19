---
title: Introduction
---

This template keeps every chapter in plain [Pandoc Markdown](https://pandoc.org/MANUAL.html#pandocs-markdown),
so the same file renders as a web page (Eleventy) and as a PDF in the official Vanderbilt LaTeX template (pandoc).

## Citations

Cite with Pandoc syntax and keys from `content/references.bib` [@knuth1984].
Multiple sources are separated by semicolons [@lamport1994; @victor2011].

## Equations

Inline math uses single dollars, e.g. $E = mc^2$ or $\alpha_{ij} = \frac{1}{n}$.
Display math uses double dollars:

$$
\hat{\beta} = \left( X^\top X \right)^{-1} X^\top y
$$

## Footnotes

Footnotes work on the web and in the PDF.[^1]

[^1]: Like this one.
