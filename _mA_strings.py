import re
ma = open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_mA.txt", encoding="utf-8").read()
strings = re.findall(r'"([^"\\]{3,60})"', ma)
out = sorted(set(strings))
open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_mA_strings.txt", "w", encoding="utf-8").write("\n".join(out))
print(len(out), "strings")
