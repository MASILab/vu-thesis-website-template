---
title: Methods
---

## Static figures

A paragraph containing only an image becomes a numbered figure; the alt text is the caption.
Use SVG or PNG — SVGs are converted to PDF automatically for print.

![A simple example figure. Captions can include math such as $y = \sin x$.](/figures/example.svg){#fig:example width=70%}

## Interactive demos

Wrap any HTML/JavaScript in a `demo` block. On the web it runs; in the PDF it is replaced
by the `fallback` image with the same caption plus a note pointing to the online version.

::: {.demo #fig:sine-demo fallback="/figures/example.svg" caption="Drag the slider to change the frequency of $\sin(kx)$."}
<canvas id="sine-canvas" width="600" height="200" style="max-width:100%"></canvas>
<label>k = <input id="sine-k" type="range" min="1" max="10" value="2"></label>
<script type="module" src="/demos/sine.js"></script>
:::

## Tables

| Model    | Accuracy | Params |
|:---------|---------:|-------:|
| Baseline |    0.81  |   1.2M |
| Ours     |    0.89  |   1.4M |

: Example results table. {#tbl:results}

The method follows standard practice [@knuth1984].
