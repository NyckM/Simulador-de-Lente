import nuke
import nukescripts
import bruxos_lens_panel
nukescripts.panels.registerWidgetAsPanel("bruxos_lens_panel.BruxosLensPanel", bruxos_lens_panel.WORDS[bruxos_lens_panel.LANGUAGE][0], "com.bruxosdovfx.lens.diagram", create=False)
