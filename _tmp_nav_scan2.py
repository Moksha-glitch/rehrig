import pathlib

p = pathlib.Path(r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html")
s = p.read_text(encoding="utf-8", errors="replace")

# How moduleKey is dispatched
i = s.find("e.moduleKey===")
print("=== moduleKey dispatch ===")
print(s[i-300:i+2500])

print("\n\n=== onOpenRecord ===")
j = s.find("onOpenRecord")
print(s[j-200:j+800])
