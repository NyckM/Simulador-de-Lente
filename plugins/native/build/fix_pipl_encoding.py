"""Write the PiPL Pascal name as raw words: SDK tool output uses legacy encoding."""
from pathlib import Path
import sys,re
p=Path(sys.argv[1]);n=int(sys.argv[2]);name=['Bruxosdovfx Desfoque','Bruxosdovfx Defocus','Bruxosdovfx 散焦'][n].encode('utf-8')
data=bytes([len(name)])+name;data+=bytes((-len(data))%4)
words=', '.join(f'0x{int.from_bytes(data[i:i+2],"little"):04X}' for i in range(0,len(data),2))+',\n'
s=p.read_bytes().decode('latin1')
s,count=re.subn(r'("eman",.*?RSCS32\(0\),\s*)RSCS32\(\d+\),\s*".*?",\s*',lambda m:m[1]+f'RSCS32({len(data)}),\n'+words,s,count=1,flags=re.S)
assert count==1,'PiPL name record missing'
p.write_bytes(s.encode('ascii'))
