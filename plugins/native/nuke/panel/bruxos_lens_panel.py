"""Dockable lens editor. Uses the same native surfaces and Snell tracing as the OFX render."""
import ctypes
import json
from pathlib import Path
import nuke
try:
    from PySide6 import QtCore, QtGui, QtWidgets
except ImportError:
    from PySide2 import QtCore, QtGui, QtWidgets
LANGUAGE = "PT-BR"
WORDS = {
    "PT-BR": ["Lente e luz", "Usar nó selecionado", "Selecione um nó Bruxosdovfx Desfoque.", "Clique em uma superfície para editá-la.", "Mostrar raios bloqueados", "Superfície", "Curvatura", "Espaçamento", "Diâmetro", "Índice", "Diafragma f/", "Foco (m)", "Distância (m)", "Sensor (mm)", "Plano do sensor", "Dispersão", "Luz → vidros → diafragma → sensor"],
    "EN": ["Lens and light", "Use selected node", "Select a Bruxosdovfx Defocus node.", "Click a surface to edit it.", "Show blocked rays", "Surface", "Curvature", "Spacing", "Diameter", "Index", "Aperture f/", "Focus (m)", "Distance (m)", "Sensor (mm)", "Sensor plane", "Dispersion", "Light → glass → aperture → sensor"],
    "ZH-CN": ["镜头与光线", "使用所选节点", "请选择 Bruxosdovfx 散焦节点。", "点击表面进行编辑。", "显示被阻挡的光线", "表面", "曲率", "间距", "直径", "折射率", "光圈 f/", "对焦（米）", "距离（米）", "传感器（毫米）", "传感器平面", "色散", "光线 → 镜片 → 光圈 → 传感器"],
}
KEYS = ["PRESET", "EDIT", "CURVATURE", "SPACING", "DIAMETER", "INDEX_OFFSET", "FSTOP", "FOCUS", "SOURCE_DISTANCE", "SENSOR", "FILMBACK", "BLADES", "IRIS_ROTATION", "DISPERSION"]
BLADES = [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 32]
class NativeDiagram:
    def __init__(self):
        path = Path(__file__).parent / "engine" / "BruxosdovfxNuke.ofx"
        self.library = ctypes.CDLL(str(path))
        self.call = self.library.bruxos_lens_diagram
        self.call.argtypes = [ctypes.POINTER(ctypes.c_double), ctypes.c_int, ctypes.c_void_p, ctypes.c_int]
        self.call.restype = ctypes.c_int
    def diagram(self, values):
        values = list(values)
        values[11] = BLADES[max(0, min(13, int(values[11])))]
        array = (ctypes.c_double * 14)(*values)
        size = self.call(array, 14, None, 0)
        if size < 1 or size > 4000000:
            raise RuntimeError("Invalid lens geometry")
        buffer = ctypes.create_string_buffer(size)
        if self.call(array, 14, buffer, size) != size:
            raise RuntimeError("Lens diagram changed during read")
        return json.loads(buffer.value.decode("utf-8"))
class LensCanvas(QtWidgets.QWidget):
    surfaceSelected = QtCore.Signal(int)
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMinimumSize(280, 240)
        self.diagram = None
        self.blocked = False
        self.setSizePolicy(QtWidgets.QSizePolicy.Expanding, QtWidgets.QSizePolicy.Expanding)
    def transform(self):
        left, right, height = self.diagram["bounds"]
        scale = max(.001, min((self.width()-32)/(right-left), (self.height()-55)/(2*height)))
        return scale, self.width()/2-(left+right)/2*scale, (self.height()+10)/2
    def point(self, p):
        scale, cx, cy = self.transform()
        return QtCore.QPointF(cx+p[0]*scale, cy-p[1]*scale)
    def paintEvent(self, event):
        painter = QtGui.QPainter(self)
        painter.setRenderHint(QtGui.QPainter.Antialiasing)
        painter.fillRect(self.rect(), QtGui.QColor("#0e161b"))
        d = self.diagram
        if not d:
            return
        def path(points):
            result = QtGui.QPainterPath(self.point(points[0]))
            for p in points[1:]: result.lineTo(self.point(p))
            return result
        left, right, height = d["bounds"]
        painter.setPen(QtGui.QPen(QtGui.QColor("#34464f"), 1))
        painter.drawLine(self.point([left, 0]), self.point([right, 0]))
        for i, s in enumerate(d["surfaces"][:-1]):
            if s["index"] > 1 and not s["stop"]:
                shape = path(s["points"] + list(reversed(d["surfaces"][i+1]["points"])))
                shape.closeSubpath()
                painter.fillPath(shape, QtGui.QColor(35, 157, 174, 65))
        for ray in d["rays"]:
            if not ray["transmitted"] and not self.blocked: continue
            color = [QtGui.QColor(255, 100, 65, 100), QtGui.QColor(104, 250, 140, 100), QtGui.QColor(95, 165, 255, 100)][ray["channel"]]
            if not ray["transmitted"]: color = QtGui.QColor(150, 155, 155, 70)
            pen = QtGui.QPen(color, 1)
            if not ray["transmitted"]: pen.setStyle(QtCore.Qt.DashLine)
            painter.setPen(pen)
            painter.drawPath(path(ray["points"]))
        for s in d["surfaces"]:
            painter.setPen(QtGui.QPen(QtGui.QColor("#ffce68" if s["id"] == d["selected"] else "#68d5df"), 2.5 if s["id"] == d["selected"] else 1.2))
            if s["stop"]:
                painter.setPen(QtGui.QPen(QtGui.QColor("#dce4e9"), 3))
                for sign in [-1, 1]: painter.drawLine(self.point([s["z"], sign*s["diameter"]/2]), self.point([s["z"], sign*d["iris"]]))
            else: painter.drawPath(path(s["points"]))
            if s["id"] == d["selected"]:
                p = self.point([s["z"], -s["diameter"]/2])
                painter.drawText(p+QtCore.QPointF(-5, 15), str(s["id"]))
        painter.setPen(QtGui.QPen(QtGui.QColor("#ffce68"), 2))
        painter.drawLine(self.point([d["sensor"], -self.sensor/2]), self.point([d["sensor"], self.sensor/2]))
        painter.setPen(QtGui.QColor("#d5e1e7"))
        painter.drawText(10, 20, d["name"])
        if 0 < d["selected"] <= len(d["surfaces"]):
            s = d["surfaces"][d["selected"]-1]
            painter.drawText(10, 37, WORDS[LANGUAGE][5]+" "+str(s["id"])+" · R %.3f mm · n %.4f · t %.3f mm" % (s["radius"], s["index"], s["thickness"]))
        painter.drawText(10, self.height()-10, WORDS[LANGUAGE][16])
    def mousePressEvent(self, event):
        if not self.diagram: return
        click = event.position() if hasattr(event, "position") else event.localPos()
        best, selected = 14., 0
        for s in self.diagram["surfaces"]:
            for p in s["points"]:
                q = self.point(p)
                distance = ((q.x()-click.x())**2+(q.y()-click.y())**2)**.5
                if distance < best: best, selected = distance, s["id"]
        if selected: self.surfaceSelected.emit(selected)
class BruxosLensPanel(QtWidgets.QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("QWidget { background: #191e22; color: #d5e1e7; } QDoubleSpinBox, QPushButton { background: #252c31; color: #d5e1e7; padding: 4px; border: 1px solid #46535d; } QPushButton:hover { border-color: #68d5df; } QScrollArea { border: 0; }")
        self.node = None
        self.knobs = {}
        self.cached = None
        self.native = None
        self.words = WORDS[LANGUAGE]
        layout = QtWidgets.QVBoxLayout(self)
        self.bindButton = QtWidgets.QPushButton(self.words[1])
        self.bindButton.clicked.connect(self.bindSelected)
        layout.addWidget(self.bindButton)
        self.status = QtWidgets.QLabel(self.words[2]); self.status.setWordWrap(True); layout.addWidget(self.status)
        self.canvas = LensCanvas(); self.canvas.sensor = 36.; layout.addWidget(self.canvas, 1)
        self.blocked = QtWidgets.QCheckBox(self.words[4]); self.blocked.toggled.connect(self.toggleBlocked); layout.addWidget(self.blocked)
        formWidget = QtWidgets.QWidget(); form = QtWidgets.QFormLayout(formWidget)
        self.controls = {}
        specs = [("EDIT",5,0,80,1), ("CURVATURE",6,.6,1.6,.01), ("SPACING",7,.25,2,.01), ("DIAMETER",8,.5,1.5,.01), ("INDEX_OFFSET",9,-.25,.25,.005), ("FSTOP",10,.7,64,.1), ("FOCUS",11,.3,1000,.1), ("SOURCE_DISTANCE",12,.3,1000,.1), ("SENSOR",13,12,44,.5), ("FILMBACK",14,-2,2,.01), ("DISPERSION",15,0,2,.01)]
        for key, label, lo, hi, step in specs:
            spin = QtWidgets.QDoubleSpinBox(); spin.setRange(lo, hi); spin.setSingleStep(step); spin.setDecimals(0 if key == "EDIT" else 3); spin.setKeyboardTracking(False)
            spin.valueChanged.connect(lambda value, k=key: self.edit(k, value))
            self.controls[key] = spin; form.addRow(self.words[label], spin)
        scroll = QtWidgets.QScrollArea(); scroll.setWidgetResizable(True); scroll.setWidget(formWidget); scroll.setMaximumHeight(255); layout.addWidget(scroll)
        self.canvas.surfaceSelected.connect(lambda value: self.edit("EDIT", value))
        self.timer = QtCore.QTimer(self); self.timer.timeout.connect(self.refresh); self.timer.start(250)
        self.bindSelected()
    def toggleBlocked(self, enabled): self.canvas.blocked = enabled; self.canvas.update()
    def bindSelected(self):
        try:
            node = nuke.selectedNode(); knobs = node.knobs()
            if not all(k in knobs for k in KEYS): raise ValueError(self.words[2])
            self.node, self.knobs, self.cached = node, {k: knobs[k] for k in KEYS}, None
            if self.native is None: self.native = NativeDiagram()
            self.refresh()
        except Exception as error:
            self.node = None; self.knobs = {}; self.canvas.diagram = None; self.canvas.update(); self.status.setText(str(error))
    def refresh(self):
        if self.node is None: return
        try:
            values = tuple(float(self.knobs[k].getValue() if hasattr(self.knobs[k], "getValue") else self.knobs[k].value()) for k in KEYS)
            if values == self.cached: return
            diagram = self.native.diagram(values)
            self.canvas.diagram = diagram; self.canvas.sensor = values[9]; self.canvas.update()
            for key, spin in self.controls.items():
                spin.blockSignals(True); spin.setValue(values[KEYS.index(key)]); spin.blockSignals(False)
            self.status.setText(self.node.fullName()+" — "+self.words[3]); self.cached = values
        except Exception as error:
            self.status.setText(str(error)); self.cached = None; self.canvas.diagram = None; self.canvas.update()
    def edit(self, key, value):
        if self.node is None: return
        undo = nuke.Undo(); undo.begin(WORDS[LANGUAGE][0])
        try:
            knob = self.knobs[key]
            if knob.isAnimated(): knob.setValueAt(value, nuke.frame())
            else: knob.setValue(value)
            self.cached = None; self.refresh()
        finally: undo.end()
    def showEvent(self, event): self.timer.start(250); super().showEvent(event)
    def hideEvent(self, event): self.timer.stop(); super().hideEvent(event)
