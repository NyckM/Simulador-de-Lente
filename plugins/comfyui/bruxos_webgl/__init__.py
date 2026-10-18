from .nodes import BruxosWebGLDepth, BruxosArtisticFilter

NODE_CLASS_MAPPINGS = {"BruxosWebGLDepth": BruxosWebGLDepth, "BruxosArtisticFilter": BruxosArtisticFilter}
NODE_DISPLAY_NAME_MAPPINGS = {"BruxosWebGLDepth": "Bruxos · Depth Bokeh WebGL2"}
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
