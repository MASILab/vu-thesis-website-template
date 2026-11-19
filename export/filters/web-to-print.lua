-- Adapts web-oriented Markdown for print (LaTeX/PDF and DOCX):
--  * site-absolute paths (/figures/x.svg) -> files on disk
--  * SVG -> PDF (LaTeX) or PNG (DOCX), pre-converted by scripts/export.js into build/figures
--  * ::: {.demo fallback=... caption=...} blocks -> static figure + "see online" note

local cwd = pandoc.system.get_working_directory()
local site_url = ""

local function resolve(src)
  if src:sub(1, 1) == "/" then src = cwd .. "/content" .. src end
  local stem = src:match("([^/]+)%.svg$")
  if stem then
    local ext = FORMAT:match("latex") and ".pdf" or ".png"
    src = cwd .. "/build/figures/" .. stem .. ext
  end
  return src
end

local function md_inlines(text)
  local blocks = pandoc.read(text or "", "markdown").blocks
  return blocks[1] and blocks[1].content or pandoc.Inlines{}
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
  if not fb then
    return pandoc.Para(full)
  end
  local img = pandoc.Image(caption, resolve(fb))
  local fig = pandoc.Figure(pandoc.Plain{ img }, { pandoc.Plain(full) }, { id = div.identifier })
  fig.caption.short = caption -- List of Figures shows the caption without the "online" note
  return fig
end

-- Table captions: ": Caption. {#tbl:id}" -> id on the table, attribute text removed
function Table(tbl)
  local blk = tbl.caption.long[#tbl.caption.long]
  if not blk or not blk.content then return nil end
  local inl = blk.content
  local last = inl[#inl]
  if last and last.t == "Str" then
    local id = last.text:match("^{#([^}]+)}$")
    if id then
      inl:remove(#inl)
      while #inl > 0 and inl[#inl].t == "Space" do inl:remove(#inl) end
      tbl.identifier = id
      return tbl
    end
  end
end

-- Meta must run before Div so site_url is known.
return {
  { Meta = Meta },
  { Image = Image, Div = Div, Table = Table },
}
