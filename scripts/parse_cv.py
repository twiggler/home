#!/usr/bin/env python3
"""
Parse a Google Docs HTML export and extract the Work Experience section.

Usage:
    python3 scripts/parse_cv.py input.html output.json

Known document structure (confirmed by owner):
    <h2>Work Experience</h2>      ← section heading (H2)
    <p>Company Name</p>           ← first <p> in a block = company name
    <p>Role title</p>             ← subsequent <p> before the list = detail lines
    <p>2020 – 2024</p>
    <ul>
      <li>Bullet point</li>
      ...
    </ul>
    <p>Next Company Name</p>      ← new block starts after previous list ends
    ...
    <h2>Next Section</h2>         ← end of Work Experience

Output JSON schema:
    [
      {
        "company": "Company Name",
        "details": ["Role title", "2020 – 2024"],
        "bullets": ["Bullet point", ...]
      },
      ...
    ]
"""

import sys
import json
import re
from html.parser import HTMLParser


class FlatParser(HTMLParser):
    """Build a flat sequence of (tag, text) from block-level elements."""

    CAPTURE = {"h1", "h2", "h3", "p", "li"}
    # Void elements never emit handle_endtag, so skip them in depth counting.
    VOID = {"area","base","br","col","embed","hr","img","input",
            "link","meta","param","source","track","wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.elements = []   # [{"type": str, "text": str}]
        self._tag = None     # outermost open capture tag
        self._depth = 0      # nesting depth inside that tag
        self._buf = []       # text accumulation buffer

    def handle_starttag(self, tag, attrs):
        if tag in self.VOID:
            return                       # void element: no matching end tag
        if self._tag is not None:
            self._depth += 1
        elif tag in self.CAPTURE:
            self._tag = tag
            self._depth = 0
            self._buf = []

    def handle_endtag(self, tag):
        if self._tag is None:
            return
        if self._depth > 0:
            self._depth -= 1
        elif tag == self._tag:
            text = re.sub(r"\s+", " ", "".join(self._buf)).strip()
            if text:
                self.elements.append({"type": self._tag, "text": text})
            self._tag = None
            self._buf = []

    def handle_data(self, data):
        if self._tag is not None:
            self._buf.append(data)


def extract_work_experience(elements):
    # 1. Locate the Work Experience heading (case-insensitive)
    start_idx = None
    section_tag = None
    for i, el in enumerate(elements):
        if el["type"] in ("h1", "h2", "h3"):
            if "work experience" in el["text"].lower():
                start_idx = i + 1
                section_tag = el["type"]
                break

    if start_idx is None:
        print("WARNING: No 'Work Experience' heading found.", file=sys.stderr)
        return []

    # 2. Collect elements until the next heading at the same level
    section = []
    for el in elements[start_idx:]:
        if el["type"] == section_tag:
            break
        section.append(el)

    # 3. Split into company blocks.
    #    Rule: a new block starts when a <p> is encountered after at least one <li>.
    companies = []
    paras = []
    bullets = []
    seen_li = False

    def flush():
        if not paras and not bullets:
            return
        companies.append({
            "company": paras[0] if paras else "",
            "details": paras[1:] if len(paras) > 1 else [],
            "bullets": bullets[:],
        })

    for el in section:
        if el["type"] == "p":
            if seen_li:
                flush()
                paras = [el["text"]]
                bullets = []
                seen_li = False
            else:
                paras.append(el["text"])
        elif el["type"] == "li":
            seen_li = True
            bullets.append(el["text"])

    flush()  # last block

    return [c for c in companies if c["company"] or c["bullets"]]


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} input.html output.json", file=sys.stderr)
        sys.exit(1)

    in_path, out_path = sys.argv[1], sys.argv[2]

    with open(in_path, encoding="utf-8", errors="replace") as fh:
        html_content = fh.read()

    # Strip <style> and <script> blocks — Google Docs exports contain large CSS
    # blocks that confuse Python's html.parser state machine.
    html_content = re.sub(r"<style[^>]*>.*?</style>", "", html_content, flags=re.DOTALL | re.IGNORECASE)
    html_content = re.sub(r"<script[^>]*>.*?</script>", "", html_content, flags=re.DOTALL | re.IGNORECASE)

    parser = FlatParser()
    parser.feed(html_content)

    entries = extract_work_experience(parser.elements)

    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(entries, fh, ensure_ascii=False, indent=2)

    print(f"Extracted {len(entries)} companies → {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
