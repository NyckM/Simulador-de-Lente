#!/usr/bin/env python3
"""Gera js/filters3d.js: o motor de filtros e o visor 3D do vidro saem do código do app
(app/web/filter-stack.js), sem cópia manual. Rode depois de mudar os filtros no app:
    python tools/build-filters3d.py
"""
import pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
src=(ROOT/'app/web/filter-stack.js').read_text(encoding='utf-8').splitlines()
start=next(i for i,l in enumerate(src) if l.startswith('const GlassViewer='))
end=next(i for i,l in enumerate(src) if l.startswith("document.addEventListener('optica-layout-ready'"))
engine='\n'.join(src[start:end])
runner=(ROOT/'tools/filters3d-runner.js').read_text(encoding='utf-8')
out="'use strict';\n// GERADO por tools/build-filters3d.py a partir de app/web/filter-stack.js (Simulador de Desfoque 1.2.17).\n// Não edite à mão: mude o app ou tools/filters3d-runner.js e rode o script.\n{\n"+engine+"\n"+runner+"\n}\n"
(ROOT/'js/filters3d.js').write_text(out,encoding='utf-8');print('js/filters3d.js',len(out))
