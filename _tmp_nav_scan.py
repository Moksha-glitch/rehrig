import pathlib
import re

p = pathlib.Path(r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html")
s = p.read_text(encoding="utf-8", errors="replace")

needles = [
    "function AppShell",
    "function Shell",
    "function MainWorkspace",
    "setView(",
    "moduleKey",
    "kind:\"list\"",
    "kind:\"record\"",
    "function renderModule",
    "function ModuleView",
    "function GlobalView",
    "onOpenRecord",
    "openRecord",
    "slide-over",
    "slideOver",
    "function RecordDrawer",
    "function RecordModal",
    "function RecordWorkspace",
    "function ObjectWorkspace",
]
for n in needles:
    print(n, s.find(n))

# find how modules are rendered
i = s.find("kind:\"list\"")
print("\n--- around first kind:list ---")
print(s[i-200:i+400] if i>=0 else "none")

# find router-like switch
for n in ["e.moduleKey===", "moduleKey==", "e.kind===", "kind===\"list\""]:
    print(n, s.find(n))
