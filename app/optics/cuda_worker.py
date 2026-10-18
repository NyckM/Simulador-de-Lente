"""Isolated CUDA service for desktop HTTP requests.

Only this child loads the native renderer. A preview deadline terminates our
child, not the host or another application's CUDA context. Inputs must be
uploaded again after recovery. This does not repair a hung GPU driver.
"""
import atexit
import multiprocessing as mp
from multiprocessing import shared_memory
import threading
import time


def _send_render(connection, result):
    """Keep the shared block alive until the host owns an independent copy."""
    import numpy as np
    image, metadata = result
    if image.nbytes < 1024*1024:
        connection.send(('ok', (image, {**metadata, 'workerTransfer': 'pipe'})))
        return
    try:
        block = shared_memory.SharedMemory(create=True, size=image.nbytes)
    except OSError:
        connection.send(('ok', (image, {**metadata, 'workerTransfer': 'pipe'})))
        return
    try:
        view = np.ndarray(image.shape, dtype=image.dtype, buffer=block.buf)
        view[:] = image
        del view
        connection.send(('shared-frame', (dict(name=block.name,shape=image.shape,dtype=image.dtype.str),
                        {**metadata, 'workerTransfer': 'shared-memory-copy'})))
        if connection.recv() != 'frame-copied':
            raise RuntimeError('Invalid shared frame acknowledgement')
    finally:
        block.close()
        block.unlink()


def _serve(connection):
    from . import cuda
    try:
        while True:
            try:
                operation, args, kwargs = connection.recv()
            except EOFError:
                return
            try:
                result = getattr(cuda, operation)(*args, **kwargs)
                if operation == 'render':
                    _send_render(connection, result)
                else:
                    connection.send(('ok', result))
            except (ValueError, TypeError, KeyError) as error:
                connection.send(('invalid', str(error)))
            except Exception as error:
                connection.send(('failed', str(error)))
    finally:
        connection.close()


class CUDAWorker:
    def __init__(self, target=_serve):
        self.target = target
        self.lock = threading.Lock()
        self.process = None
        self.connection = None
        self.generation = 0

    def close(self):
        # Also callable during shutdown while an HTTP thread is waiting.
        process, connection = self.process, self.connection
        self.process = self.connection = None
        if connection is not None:
            connection.close()
        if process is not None:
            if process.is_alive():
                process.terminate()
            process.join(timeout=2)
            if process.is_alive():
                process.kill()
                process.join(timeout=2)

    def _start(self):
        context = mp.get_context('spawn')
        parent, child = context.Pipe()
        process = context.Process(target=self.target, args=(child,), daemon=True,
                                  name='Bruxos CUDA renderer')
        try:
            process.start()
        except Exception:
            parent.close()
            child.close()
            raise
        child.close()
        self.connection, self.process = parent, process
        self.generation += 1

    def call(self, operation, *args, timeout=12., **kwargs):
        started = time.monotonic()
        if not self.lock.acquire(timeout=timeout):
            raise RuntimeError('CUDA ocupado; solicitação descartada. Tente novamente.')
        try:
            if self.process is None or not self.process.is_alive():
                self.close()
                self._start()
            connection = self.connection
            # Send runs in a daemon thread so even a child stuck before reading
            # a large source upload cannot block the HTTP handler indefinitely.
            sent = threading.Event()
            errors = []
            def send():
                try:
                    connection.send((operation, args, kwargs))
                except Exception as error:
                    errors.append(error)
                finally:
                    sent.set()
            threading.Thread(target=send, daemon=True).start()
            remaining = lambda: max(0., timeout - (time.monotonic() - started))
            if not sent.wait(remaining()) or (not errors and not connection.poll(remaining())):
                self.close()
                raise RuntimeError('CUDA excedeu o prazo; processo reiniciado. Reenvie a imagem.')
            if errors:
                raise OSError(str(errors[0]))
            received = threading.Event()
            reply = []
            def receive():
                try:
                    message = connection.recv()
                    if message[0] == 'shared-frame':
                        import numpy as np
                        descriptor, metadata = message[1]
                        block = shared_memory.SharedMemory(name=descriptor['name'])
                        try:
                            image = np.ndarray(descriptor['shape'], dtype=descriptor['dtype'], buffer=block.buf).copy()
                        finally:
                            block.close()
                        connection.send('frame-copied')
                        message = ('ok', (image, metadata))
                    reply.append(message)
                except Exception as error:
                    errors.append(error)
                finally:
                    received.set()
            threading.Thread(target=receive, daemon=True).start()
            if not received.wait(remaining()):
                self.close()
                raise RuntimeError('CUDA excedeu o prazo na transferência; reenvie a imagem.')
            if errors:
                raise OSError(str(errors[0]))
            status, result = reply[0]
            if status == 'invalid':
                raise ValueError(result)
            if status == 'failed':
                self.close()
                raise RuntimeError(result)
            return result
        except (EOFError, OSError, BrokenPipeError) as error:
            self.close()
            raise RuntimeError('Processo CUDA interrompido; reenvie a imagem.') from error
        finally:
            self.lock.release()


_worker = CUDAWorker()
atexit.register(_worker.close)


def info():
    try:
        result = _worker.call('info', timeout=12.)
        return {**result, 'isolated': True, 'workerGeneration': _worker.generation}
    except RuntimeError as error:
        return dict(available=False, backend='webgl', reason=str(error), isolated=True)


def upload(*args, **kwargs):
    return _worker.call('upload', *args, timeout=12., **kwargs)


def render(*args, **kwargs):
    # Offline exports have a separate, longer budget.
    started = time.perf_counter()
    image, metadata = _worker.call('render', *args,
        timeout=12. if kwargs.get('preview') else 600., **kwargs)
    return image, {**metadata, 'isolated': True,
        'workerGeneration': _worker.generation,
        'workerRoundtripMs': (time.perf_counter() - started) * 1000}


def shutdown():
    _worker.close()
