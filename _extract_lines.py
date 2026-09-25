import re
PATH = r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html"
text = open(PATH, encoding="utf-8", errors="replace").read()
lines = text.split("\n")

targets = [
    "Une", "mA", "FB", "Foe", "Gne", "Hne", "Ine", "Jne", "Lne", "One", "Rne",
    "Sne", "Tne", "Vne", "Wne", "ene", "nne", "Ii", "Dne", "Pne", "Mne", "Ene",
    "Bne", "Cne", "Fne", "Gne", "Hne", "Ine", "Jne", "Kne", "Lne", "Nne", "One",
]
for name in targets:
    for i, line in enumerate(lines):
        if re.search(rf"function {re.escape(name)}\(", line):
            out = rf"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_{name}.txt"
            open(out, "w", encoding="utf-8").write(line)
            print(name, "line", i + 1, "len", len(line))
            break
    else:
        # search in full text for first occurrence
        m = re.search(rf"function {re.escape(name)}\(", text)
        if m:
            # grab until next function at start of line pattern (imperfect)
            end = text.find("\nfunction ", m.start() + 10)
            if end < 0:
                end = m.start() + 50000
            chunk = text[m.start() : min(end, m.start() + 80000)]
            open(rf"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_{name}.txt", "w", encoding="utf-8").write(chunk)
            print(name, "inline chunk len", len(chunk))
        else:
            print(name, "NOT FOUND")

# Extract Une fully from line file
une_line = open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_Une.txt", encoding="utf-8").read()
print("\nUne f.kind", re.findall(r"f\.kind===\"([^\"]+)\"", une_line))
print("Une returns", re.findall(r"return o\.default\.createElement\(([A-Za-z_$][A-Za-z0-9_$]*)", une_line))
