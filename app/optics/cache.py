"""Byte-bounded LRU for immutable numerical intermediates."""
from collections import OrderedDict
from threading import RLock

class ByteCache:
    def __init__(self,max_bytes,max_entries=24):
        self.max_bytes=max_bytes;self.max_entries=max_entries;self._lock=RLock();self.clear()

    def clear(self):
        with self._lock:
            self._items=OrderedDict();self.bytes=0;self.hits=0;self.misses=0;self.evictions=0

    def get(self,key):
        with self._lock:
            item=self._items.get(key)
            if item is None:self.misses+=1;return None
            self._items.move_to_end(key);self.hits+=1;return item[0]

    def put(self,key,value,size):
        with self._lock:
            if size>self.max_bytes:return False
            previous=self._items.pop(key,None)
            if previous:self.bytes-=previous[1]
            while self._items and (self.bytes+size>self.max_bytes or len(self._items)>=self.max_entries):
                _,(_,old_size)=self._items.popitem(last=False);self.bytes-=old_size;self.evictions+=1
            self._items[key]=(value,size);self.bytes+=size;return True

    def info(self):
        with self._lock:return dict(entries=len(self._items),bytes=self.bytes,max_bytes=self.max_bytes,max_entries=self.max_entries,hits=self.hits,misses=self.misses,evictions=self.evictions)
