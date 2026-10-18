"""Stable error codes for local model setup and inference."""
def diagnostic(error):
    details=str(error);s=details.lower()
    if 'out of memory' in s or 'cuda error: memory' in s:
        code='gpu_memory';hint='Reduza a resolução máxima ou feche outros programas que usam a GPU. A qualidade não foi reduzida automaticamente.'
    elif 'no space' in s or 'disk full' in s or getattr(error,'winerror',None)==112:
        code='disk_space';hint='Escolha uma pasta em um disco com mais espaço livre.'
    elif 'no module named' in s or 'cannot import' in s:
        code='dependencies';hint='Reinstale o ambiente deste modelo ou selecione um Python compatível.'
    elif 'cuda indispon' in s or 'not compiled with cuda' in s:
        code='cuda_unavailable';hint='Use um ambiente PyTorch CUDA e uma GPU NVIDIA compatível.'
    elif 'permission' in s or 'access denied' in s or 'acesso negado' in s:
        code='access';hint='Escolha uma pasta gravável e feche programas que estejam bloqueando o arquivo.'
    elif 'checksum' in s or 'hash' in s or 'download incompleto' in s:
        code='cache_integrity';hint='Baixe novamente o arquivo incompleto. Os outros pesos permanecem no cache.'
    elif any(x in s for x in ('timeout','timed out','connection','http','network','download')):
        code='download';hint='Confira a conexão e tente novamente. Downloads completos serão reutilizados.'
    else:code='model_error';hint='Abra os detalhes do diagnóstico e verifique o ambiente do modelo.'
    return dict(error=details[-3000:],code=code,hint=hint)
