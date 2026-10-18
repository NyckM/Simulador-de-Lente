# Lens diagram 0.2.6

`LensDiagram.h` / `LensCore.cpp` expose the same edited prescription and `trace()` function as the render. Recording a path is optional and does not change the renderer's calculation. Geometry is generated independently of the expensive ray atlas; there is no image render or CUDA allocation for UI drawing.

After Effects: `LensUI.h` draws via Drawbot in a no-data Effect Controls parameter, disk ID 98, and writes surface selection into the existing EDIT parameter. Other disk IDs are unchanged. SmartFX skips the no-data UI parameter. No comp overlay or unrelated context events are handled.

Nuke: `../nuke/panel` reads node knobs on the GUI thread, calls `bruxos_lens_diagram` via ctypes, and paints a dockable Qt widget. No worker thread calls Nuke. The native diagram function has no global host state and writes only when the supplied buffer fits. ABI argument order is documented at its export in LensCore.cpp. The panel uses numeric getValue for enumeration controls, undo transactions and setValueAt for animated knobs.

The existing engine edits one surface at a time. Changing selection transfers the current multipliers to the new surface; this feature does not introduce a per-surface edit array. The representative 2D ray bundles show axial and off-axis meridional tracing. Depth composition and image-space creative effects are not represented by additional rays.

Validation: work/build_lens_026_hosts.py, work/test_ae_lens_ui.py, work/test_nuke_lens_panel.py. Tests cover real native drawing callbacks against mocked Drawbot, native geometry for 295 prescriptions, Qt mouse/control events, animated edits, and CPU/CUDA render regressions. The real AE and Nuke GUI are unverified.
