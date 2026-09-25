import pathlib
import re

p = pathlib.Path(r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html")
s = p.read_text(encoding="utf-8", errors="replace")

# Find function Pv
for name in ["function Pv", "function Loe", "function gne", "function Tie"]:
    print(name, s.find(name))

i = s.find("function Pv(")
print("\n=== Pv ===")
print(s[i:i+3500] if i>=0 else "no Pv")

# create/edit overlay
for name in ["function RecordEditor", "function ObjectEditor", "function EditDrawer", "prefill", "function Csv"]:
    print(name, s.find(name))

# find d= and f= for create/edit
k = s.find("onEdit:(ae,_e)=>f({moduleKey:ae,record:_e})")
print("\n=== around onEdit assignment ===")
print(s[k-800:k+200])
