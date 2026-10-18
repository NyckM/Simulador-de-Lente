#!/usr/bin/env python3
"""Gera Downloads-1.2.17-Manifesto.json (nome, tamanho e SHA-256 de cada arquivo da release).
Uso: python tools/make-release-manifest.py "J:\\...\\outputs\\Versao-Atual-1.2.17"
"""
import hashlib,json,sys,pathlib
folder=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.')
files=[p for p in sorted(folder.iterdir()) if p.is_file() and p.suffix.lower() in ('.exe','.zip')]
items=[]
for p in files:
    h=hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda:f.read(1<<20),b''):h.update(chunk)
    items.append({'file':p.name,'bytes':p.stat().st_size,'sha256':h.hexdigest(),'url':f'https://github.com/NyckM/Simulador-de-Lente/releases/download/V1.2.17/{p.name}'})
out=folder/'Downloads-1.2.17-Manifesto.json'
out.write_text(json.dumps({'release':'V1.2.17','files':items},indent=2,ensure_ascii=False),encoding='utf-8')
print(out,len(items),'arquivos')
