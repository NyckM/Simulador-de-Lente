[Setup]
AppId=BruxosdovfxDepthLensNuke
AppName=Simulador de Desfoque da Bruxosdovfx â€” Nuke OFX beta
AppVersion=0.2.1
AppPublisher=Bruxosdovfx
DefaultDirName={commoncf64}\OFX\Nuke
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..\..\..
OutputBaseFilename=Bruxosdovfx-Desfoque-Nuke-0.2.1-Setup-Windows-x64
SetupIconFile=..\app.ico
DisableProgramGroupPage=yes
WizardStyle=modern
Compression=lzma2
[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
[Files]
Source: "..\..\..\Bruxosdovfx-Desfoque-Nuke-0.2.1-Windows\BruxosdovfxNuke.ofx.bundle\*"; DestDir: "{app}\BruxosdovfxNuke.ofx.bundle"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\..\..\Bruxosdovfx-Desfoque-Nuke-0.2.1-Windows\README.md"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueNuke"; Flags: ignoreversion
Source: "..\..\..\Bruxosdovfx-Desfoque-Nuke-0.2.1-Windows\LICENSE*"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueNuke"; Flags: ignoreversion
Source: "..\..\..\Bruxosdovfx-Desfoque-Nuke-0.2.1-Windows\CUDA-EULA.txt"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueNuke"; Flags: ignoreversion
Source: "..\..\..\Bruxosdovfx-Desfoque-Nuke-0.2.1-Windows\data\*"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueNuke\data"; Flags: ignoreversion recursesubdirs createallsubdirs

Source: "..\..\..\Bruxosdovfx-Desfoque-Nuke-0.2.1-Windows\validation\*"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueNuke\validation"; Flags: ignoreversion recursesubdirs createallsubdirs

Source: "..\ae\LAYERS-DEPTH.md"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueNuke"; Flags: ignoreversion
