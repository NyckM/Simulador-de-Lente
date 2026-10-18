"""Materialize HF snapshot files for local model loading on Windows."""
import os,shutil,uuid
from pathlib import Path

def model_file(repo,name,download):
    """Use regular files with their original extensions, independent of HF symlinks."""
    cached=Path(os.path.normpath(download(repo,name))).expanduser()
    try:
        target=cached.resolve(strict=True)
        if not target.is_file() or target.stat().st_size==0:
            raise OSError('arquivo vazio ou inválido')
    except OSError as e:
        raise RuntimeError(f'Profundidade: arquivo {name} ausente ou inacessível no cache. Verifique o download. {e}') from e
    # HF snapshots can contain Windows symlinks. Preserve the extension because
    # DiffSynth chooses safetensors versus torch.load by the filename suffix.
    cache_home=Path(os.environ.get('HF_HOME',str(Path.home()/'.cache/huggingface')))
    folder=cache_home/'optica-model-files'/repo.replace('/','--')/cached.parent.name
    folder.mkdir(parents=True,exist_ok=True)
    local=folder/name
    if local.is_file() and not local.is_symlink() and local.stat().st_size==target.stat().st_size:
        return str(local)
    temporary=folder/(name+'.'+uuid.uuid4().hex+'.tmp')
    try:
        try:os.link(target,temporary)
        except OSError:shutil.copyfile(target,temporary)
        os.replace(temporary,local)
    finally:
        temporary.unlink(missing_ok=True)
    if not local.is_file():raise RuntimeError(f'Profundidade: não foi possível preparar {name} para leitura.')
    return str(local)

def model_directory(repo,names):
    from huggingface_hub import snapshot_download
    snapshot=Path(os.path.normpath(snapshot_download(repo,allow_patterns=names)))
    paths=[Path(model_file(repo,name,lambda _repo,filename:str(snapshot/filename))) for name in names]
    folder=paths[0].parent
    if any(p.parent!=folder for p in paths):raise RuntimeError('Arquivos do modelo pertencem a revisões diferentes.')
    return str(folder)
