"""Regenerate export/reference.docx (Word styles used by pandoc) with basic
Vanderbilt-like defaults: Times New Roman, 12pt, double-spaced body, 1in margins.
Alternatively, replace export/reference.docx with the Graduate School's Word template
(keep pandoc's style names: Normal, Body Text, Heading 1..., Caption, Bibliography).

    python3 scripts/make-reference-docx.py
"""
import re, subprocess, zipfile, tempfile, os

out = "export/reference.docx"
tmp = tempfile.mktemp(suffix=".docx")
subprocess.run(["pandoc", "-o", tmp, "--print-default-data-file", "reference.docx"], check=True)

with zipfile.ZipFile(tmp) as zin, zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == "word/styles.xml":
            s = data.decode()
            # default run font + size (24 half-points = 12pt)
            s = re.sub(r"<w:rFonts [^>]*/>", '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>', s)
            s = re.sub(r'<w:sz w:val="\d+"/>', '<w:sz w:val="24"/>', s)
            s = re.sub(r'<w:szCs w:val="\d+"/>', '<w:szCs w:val="24"/>', s)
            # headings: black, not theme blue
            s = re.sub(r'<w:color w:val="[0-9A-Fa-f]{6}"(?: w:themeColor="[^"]*")?(?: w:themeShade="[^"]*")?/>', '<w:color w:val="000000"/>', s)
            # double-space Body Text / First Paragraph
            for sid in ("BodyText", "FirstParagraph"):
                s = re.sub(rf'(<w:style [^>]*w:styleId="{sid}"[^>]*>.*?<w:pPr>)', r'\1<w:spacing w:line="480" w:lineRule="auto"/>', s, count=1, flags=re.S)
            data = s.encode()
        elif item.filename == "word/document.xml":
            s = data.decode()
            s = re.sub(r"<w:pgMar [^>]*/>", '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>', s)
            data = s.encode()
        zout.writestr(item, data)
os.remove(tmp)
print("wrote", out)
