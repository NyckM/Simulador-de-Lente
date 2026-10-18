[Setup]
AppId={{68234DAD-FA8B-4DE5-A7B0-3D956EC53DE1}
AppName=Simulador de Desfoque da Bruxosdovfx - After Effects
AppVersion=0.2.1
AppPublisher=Bruxosdovfx
DefaultDirName={autopf}\Adobe\Common\Plug-ins\7.0\MediaCore\Bruxosdovfx
DisableProgramGroupPage=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..\..\..
OutputBaseFilename=Bruxosdovfx-Desfoque-AE-0.2.1-Setup-Windows-x64
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName=Bruxosdovfx Desfoque - After Effects
UninstallFilesDir={commonappdata}\Bruxosdovfx\DesfoqueAE\Uninstall

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Files]
Source: "bin\BruxosdovfxDesfoque.aex"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\optica_cuda.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\bruxos_layers_cuda.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueAE"; Flags: ignoreversion
Source: "..\..\data\*"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueAE\data"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "LICENSES.md"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueAE"; Flags: ignoreversion

Source: "CUDA-EULA.txt"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueAE"; Flags: ignoreversion

Source: "LAYERS-DEPTH.md"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueAE"; Flags: ignoreversion

Source: "..\..\..\Bruxosdovfx-Desfoque-AE-0.2.1-Windows\validation\*"; DestDir: "{commonappdata}\Bruxosdovfx\DesfoqueAE\validation"; Flags: ignoreversion recursesubdirs createallsubdirs
