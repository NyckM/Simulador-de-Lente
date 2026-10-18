"""Twelve wavelength quadrature bands with an approximate RGB sensor response.
This preserves neutral RGB exposure; it is not spectral scene reconstruction.
"""
import math
WAVELENGTHS=tuple((420+(i+.5)*280/12)/1000 for i in range(12))
def response(nm):
    def g(mu,sigma):return math.exp(-.5*((nm-mu)/sigma)**2)
    return (g(610,43)+.10*g(430,22),g(545,35),g(455,30))
raw=[response(w*1000) for w in WAVELENGTHS]
normalizers=[sum(row[c] for row in raw) for c in range(3)]
WEIGHTS=tuple(tuple(12*row[c]/normalizers[c] for c in range(3)) for row in raw)
