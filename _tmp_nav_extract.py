import pathlib
import re

s = pathlib.Path(r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html").read_text(
    encoding="utf-8", errors="replace"
)
i = s.find("getSPAdminAccount")
print("first", i)
print(s[i : i + 400])
print("--- SupportScreen ---")
j = s.find("function SupportScreenV2")
print(s[j : j + 1800])
