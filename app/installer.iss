#ifndef AppVersion
#define AppVersion "0.9.6"
#endif
#ifndef AppDistDir
#define AppDistDir "..\Simulador-de-Desfoque-Bruxosdovfx-0.9.6-Windows\SimuladorDeDesfoque"
#endif
[Setup]
AppId={{73771560-FCC7-496D-8AF7-270792D59B79}
AppName=Simulador de Desfoque da Bruxosdovfx
AppVersion={#AppVersion}
AppPublisher=Bruxosdovfx
DefaultDirName={localappdata}\Programs\BruxosdovfxDesfoque
DefaultGroupName=Bruxosdovfx
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..
OutputBaseFilename=Simulador-de-Desfoque-Bruxosdovfx-{#AppVersion}-Setup-Windows-x64
SetupIconFile=native\app.ico
UninstallDisplayIcon={app}\SimuladorDeDesfoque.exe
Compression=lzma2/fast
SolidCompression=yes
WizardStyle=modern
WizardImageFile=native\installer\wizard-photo-164x314.bmp,native\installer\wizard-photo-328x628.bmp
WizardImageStretch=yes
CloseApplications=yes
RestartApplications=no
DisableProgramGroupPage=yes
[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "chinesesimp"; MessagesFile: "localization\ChineseSimplified.isl"
[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; Flags: unchecked
[Files]
Source: "{#AppDistDir}\*"; DestDir: "{app}"; Excludes: "native\depth\*"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#AppDistDir}\_internal\native\depth\bootstrap\*"; DestDir: "{app}\_internal\native\depth\bootstrap"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#AppDistDir}\_internal\native\depth\worker\*"; DestDir: "{app}\_internal\native\depth\worker"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\..\work\MicrosoftEdgeWebview2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall; Check: NeedsWebView2
Source: "optics\depth_worker.py"; DestDir: "{app}\native\depth\worker"; Flags: ignoreversion
Source: "optics\dvd_adapter.py"; DestDir: "{app}\native\depth\worker"; Flags: ignoreversion
Source: "optics\worker_status.py"; DestDir: "{app}\native\depth\worker"; Flags: ignoreversion
Source: "optics\model_cache.py"; DestDir: "{app}\native\depth\worker"; Flags: ignoreversion
Source: "DESKTOP.md"; DestDir: "{app}"; Flags: ignoreversion
[Icons]
Name: "{group}\Simulador de Desfoque da Bruxosdovfx"; Filename: "{app}\SimuladorDeDesfoque.exe"
Name: "{autodesktop}\Simulador de Desfoque da Bruxosdovfx"; Filename: "{app}\SimuladorDeDesfoque.exe"; Tasks: desktopicon
[InstallDelete]
Type: files; Name: "{autoprograms}\Optica Lab\Optica Lab.lnk"
Type: dirifempty; Name: "{autoprograms}\Optica Lab"
Type: files; Name: "{autodesktop}\Optica Lab.lnk"
[Run]
Filename: "{tmp}\MicrosoftEdgeWebview2Setup.exe"; Parameters: "/silent /install"; StatusMsg: "Instalando Microsoft WebView2..."; Flags: runhidden waituntilterminated; Check: NeedsWebView2
Filename: "{app}\SimuladorDeDesfoque.exe"; Description: "Abrir Simulador de Desfoque da Bruxosdovfx"; Flags: nowait postinstall skipifsilent

[Code]
function NeedsWebView2: Boolean;
var Version: String;
begin
  Result := True;
  if RegQueryStringValue(HKLM32, 'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version) then
    if (Version <> '') and (Version <> '0.0.0.0') then Result := False;
  if Result and RegQueryStringValue(HKCU, 'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version) then
    if (Version <> '') and (Version <> '0.0.0.0') then Result := False;
end;
