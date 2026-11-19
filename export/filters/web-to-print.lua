-- Adapts the web-oriented Markdown for the Vanderbilt LaTeX template:
--  * site-absolute paths (/figures/x.svg) -> files on disk
--  * SVG -> PDF, pre-converted by scripts/export.js into build/figures
--  * ::: {.demo fallback=... caption=...} blocks -> static figure + "see online" note
--  * tables, figures and underlines -> exactly the markup the Vanderbilt template's
--    sample chapters use (so the PDF matches it)

local cwd = pandoc.system.get_working_directory()
local site_url = ""

local function resolve(src)
  if src:sub(1, 1) == "/" then src = cwd .. "/content" .. src end
  local stem = src:match("([^/]+)%.svg$")
  if stem then src = cwd .. "/build/figures/" .. stem .. ".pdf" end
  return src
end

local function md_inlines(text)
  local blocks = pandoc.read(text or "", "markdown").blocks
  return blocks[1] and blocks[1].content or pandoc.Inlines{}
end

local function latex(blocks)
  return (pandoc.write(pandoc.Pandoc(blocks), "latex"):gsub("%s+$", ""))
end

function Meta(meta)
  if meta["site-url"] then site_url = pandoc.utils.stringify(meta["site-url"]) end
end

function Image(img)
  img.src = resolve(img.src)
  return img
end

function Div(div)
  if not div.classes:includes("demo") then return nil end
  local caption = md_inlines(div.attributes.caption)
  local note = pandoc.Inlines{ pandoc.Space(), pandoc.Emph("An interactive version is available in the online edition") }
  if site_url ~= "" then
    note:insert(pandoc.Space())
    note:insert(pandoc.Emph{ pandoc.Str("("), pandoc.Link(site_url, site_url), pandoc.Str(")") })
  end
  note:insert(pandoc.Str("."))
  local full = caption:clone()
  full:extend(note)

  local fb = div.attributes.fallback
  if not fb then return pandoc.Para(full) end
  local fig = pandoc.Figure(pandoc.Plain{ pandoc.Image(caption, resolve(fb)) }, { pandoc.Plain(full) }, { id = div.identifier })
  fig.caption.short = caption -- List of Figures shows the caption without the "online" note
  return fig
end

local ALIGN = { AlignLeft = "l", AlignRight = "r", AlignCenter = "c", AlignDefault = "l" }

function Table(tbl)
  -- ": Caption. {#tbl:id placement=t}" -> attributes on the table, removed from the caption
  local blk = tbl.caption.long[#tbl.caption.long]
  if blk and blk.content then
    local inl = blk.content
    for i = #inl, 1, -1 do
      if inl[i].t == "Str" and inl[i].text:sub(1, 1) == "{" then
        local tail = pandoc.utils.stringify(pandoc.Inlines{ table.unpack(inl, i) })
        local attr = tail:match("^{(.*)}$")
        if attr then
          for k = #inl, i, -1 do inl:remove(k) end
          while #inl > 0 and inl[#inl].t == "Space" do inl:remove(#inl) end
          tbl.identifier = attr:match("#([%w:_%-%.]+)") or tbl.identifier
          for key, val in attr:gmatch('([%w%-]+)="?([^"%s]+)"?') do tbl.attributes[key] = val end
        end
        break
      end
    end
  end

  -- Only simple grids (no merged cells) are rewritten; anything else falls back to pandoc's longtable.
  local rows = {}
  for _, r in ipairs(tbl.head.rows) do table.insert(rows, { r, "head" }) end
  for _, b in ipairs(tbl.bodies) do
    for _, r in ipairs(b.body) do table.insert(rows, { r, "body" }) end
  end
  for _, r in ipairs(rows) do
    for _, c in ipairs(r[1].cells) do
      if c.row_span > 1 or c.col_span > 1 then return tbl end
    end
  end

  -- Column types: Y = the template's ragged-right X column; R/C for right/centered columns.
  local COL = { AlignLeft = "Y", AlignDefault = "Y", AlignRight = "R", AlignCenter = "C" }
  local spec = ""
  for _, cs in ipairs(tbl.colspecs) do spec = spec .. (COL[cs[1]] or "Y") end
  local placement = tbl.attributes.placement or "b"
  local width = tbl.attributes.width or "0.6\\textwidth"

  -- Mirrors Chapter2.tex + tableTest.tex from the Vanderbilt template, line for line.
  local out = {
    "\\begin{table}[" .. placement .. "]",
    "\\scriptsize",
    "\\renewcommand{\\tabcolsep}{0.09cm}",
    "\\centering",
    "\\newcolumntype{Y}{>{\\raggedright\\arraybackslash}X}",
    "\\newcolumntype{R}{>{\\raggedleft\\arraybackslash}X}",
    "\\newcolumntype{C}{>{\\centering\\arraybackslash}X}",
    "",
    "",
    "\\begin{tabularx}{" .. width .. "}{" .. spec .. "} \\\\",
    "\\toprule \\\\",
  }
  local function row(r)
    local cells = {}
    for _, c in ipairs(r.cells) do table.insert(cells, latex(c.contents)) end
    return " " .. table.concat(cells, " & ")
  end
  for _, r in ipairs(tbl.head.rows) do table.insert(out, row(r) .. "  \\\\ \\\\") end
  if #tbl.head.rows > 0 then table.insert(out, "\\midrule \\\\") end
  for _, b in ipairs(tbl.bodies) do
    for _, r in ipairs(b.body) do table.insert(out, row(r) .. "  \\\\ ") end
  end
  table.insert(out, "")
  table.insert(out, "\\bottomrule \\\\")
  table.insert(out, "\\end{tabularx} ")
  table.insert(out, "")
  table.insert(out, "")
  table.insert(out, "")
  table.insert(out, "")
  if #tbl.caption.long > 0 then
    local short = tbl.caption.short and #tbl.caption.short > 0 and ("[" .. latex{ pandoc.Plain(tbl.caption.short) } .. "]") or ""
    table.insert(out, "\\caption" .. short .. "{" .. latex(tbl.caption.long) .. "}")
  end
  if tbl.identifier ~= "" then table.insert(out, "\\label{" .. tbl.identifier .. "}") end
  table.insert(out, "\\end{table}")
  return pandoc.RawBlock("latex", table.concat(out, "\n"))
end

-- Figures in the template's form: \begin{figure}[h] \centering \includegraphics \caption.
-- Override placement per figure with {placement="t"}.
local function graphic(img)
  local opts = {}
  for _, k in ipairs{ "width", "height" } do
    local v = img.attributes[k]
    if v then
      local pct = v:match("^([%d.]+)%%$")
      if pct then v = tostring(tonumber(pct) / 100) .. (k == "width" and "\\textwidth" or "\\textheight") end
      table.insert(opts, k .. "=" .. v)
    end
  end
  if #opts == 0 then
    return "\\pandocbounded{\\includegraphics[keepaspectratio]{" .. img.src .. "}}"
  end
  return "\\includegraphics[" .. table.concat(opts, ",") .. "]{" .. img.src .. "}"
end

function Figure(fig)
  local img
  pandoc.walk_block(pandoc.Div(fig.content), { Image = function(i) img = img or i end })
  if not img then return nil end
  local placement = fig.attributes.placement or img.attributes.placement or "h"
  local out = { "\\begin{figure}[" .. placement .. "]", "\\centering", graphic(img) }
  if #fig.caption.long > 0 then
    local short = fig.caption.short and #fig.caption.short > 0 and ("[" .. latex{ pandoc.Plain(fig.caption.short) } .. "]") or ""
    table.insert(out, " \\caption" .. short .. "{" .. latex(fig.caption.long) .. "}")
  end
  local id = fig.identifier ~= "" and fig.identifier or img.identifier
  if id ~= "" then table.insert(out, "\\label{" .. id .. "}") end
  table.insert(out, "\\end{figure}")
  return pandoc.RawBlock("latex", table.concat(out, "\n"))
end

-- The template underlines with \underline (pandoc would use soul's \ul).
function Underline(u)
  return pandoc.RawInline("latex", "\\underline{" .. latex{ pandoc.Plain(u.content) } .. "}")
end

-- Meta must run before Div so site_url is known.
return {
  { Meta = Meta },
  { Image = Image, Div = Div, Table = Table, Underline = Underline },
  { Figure = Figure }, -- after Div, so demo fallbacks are rendered the same way
}
