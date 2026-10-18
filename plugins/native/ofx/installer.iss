[Setup]
AppId=BruxosdovfxDepthLensResolve
AppName=Simulador de Desfoque da Bruxosdovfx â€” Resolve OFX
AppVersion=0.2.1
AppPublisher=Bruxosdovfx
DefaultDirName={commoncf64}\OFX\Plugins
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..\..\..
OutputBaseFilename=Bruxosdovfx-Desfoque-Resolve-0.2.1-Setup-Windows-x64
SetupIconFile=..\app.ico
DisableProgramGroupPage=yes
WizardStyle=modern
Compression=lzma2
[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
[Files]
Source: "..\..\..\Bruxosdovfx-Desfoque-Resolve-0.2.1-Windows\BruxosdovfxDesfoque.ofx.bundle\*"; DestDir: "{app}\BruxosdovfxDesfoque.ofx.bundle"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\..\..\Bruxosdovfx-Desfoque-Resolve-0.2.1-Windows\README.md"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueResolve"; Flags: ignoreversion
Source: "..\..\..\Bruxosdovfx-Desfoque-Resolve-0.2.1-Windows\LICENSE*"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueResolve"; Flags: ignoreversion
Source: "..\..\..\Bruxosdovfx-Desfoque-Resolve-0.2.1-Windows\CUDA-EULA.txt"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueResolve"; Flags: ignoreversion
Source: "..\..\..\Bruxosdovfx-Desfoque-Resolve-0.2.1-Windows\data\*"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueResolve\data"; Flags: ignoreversion recursesubdirs createallsubdirs

Source: "..\ae\LAYERS-DEPTH.md"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueResolve"; Flags: ignoreversion

Source: "..\..\..\Bruxosdovfx-Desfoque-Resolve-0.2.1-Windows\validation\*"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueResolve\validation"; Flags: ignoreversion recursesubdirs createallsubdirs
