import json
import pathlib
import re

html_path = pathlib.Path(r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html")
out_dir = pathlib.Path(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_tmp_v63_data")
out_dir.mkdir(exist_ok=True)

s = html_path.read_text(encoding="utf-8", errors="replace")
start = s.find("Ii={")
if start < 0:
    raise SystemExit("Ii={ not found")


def scan_object(src, start_idx):
    depth = 0
    in_str = False
    esc = False
    quote = ""
    for j, ch in enumerate(src[start_idx:], start_idx):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == quote:
                in_str = False
            continue
        if ch in ('"', "'"):
            in_str = True
            quote = ch
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return j + 1
    raise SystemExit("unbalanced object")


end = scan_object(s, start)
body = s[start + 3 : end]
print("Ii length", end - start)


def top_level_keys(text):
    depth = 0
    in_str = False
    esc = False
    quote = ""
    keys = []
    i = 0
    while i < len(text):
        ch = text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == quote:
                in_str = False
            i += 1
            continue
        if ch in ('"', "'"):
            in_str = True
            quote = ch
            i += 1
            continue
        if ch in "{[":
            depth += 1
        elif ch in "}]":
            depth -= 1
        elif depth == 1 and (ch.isalpha() or ch == "_"):
            m = i
            while m < len(text) and (text[m].isalnum() or text[m] == "_"):
                m += 1
            if m < len(text) and text[m] == ":":
                keys.append((text[i:m], i))
            i = m
            continue
        i += 1
    return keys


keys = top_level_keys(body)
print("keys", [k for k, _ in keys])

# Extract each array/object value and count
for idx, (key, pos) in enumerate(keys):
    colon = body.find(":", pos)
    val_start = colon + 1
    while val_start < len(body) and body[val_start] in " \n\r\t":
        val_start += 1
    if idx + 1 < len(keys):
        val_end = keys[idx + 1][1]
        chunk = body[val_start:val_end].rstrip().rstrip(",")
    else:
        chunk = body[val_start:].rstrip()
    count = "n/a"
    if chunk.startswith("["):
        # rough object count at depth 1
        depth = 0
        in_str = False
        esc = False
        quote = ""
        items = 0
        for ch in chunk:
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == quote:
                    in_str = False
                continue
            if ch in ('"', "'"):
                in_str = True
                quote = ch
                continue
            if ch == "{":
                if depth == 1:
                    items += 1
                depth += 1
            elif ch == "}":
                depth -= 1
            elif ch == "[":
                depth += 1
            elif ch == "]":
                depth -= 1
        count = items
    print(f"{key:28} {count} chars={len(chunk)}")
    (out_dir / f"{key}.raw.js").write_text(chunk, encoding="utf-8")

print("wrote raw collections to", out_dir)
