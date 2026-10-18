; Simulador de Desfoque da Bruxosdovfx — instalador NSIS (gerado no Linux, roda no Windows x64)
; Mesma pasta, AppId e atalhos do instalador Inno anterior: atualiza por cima sem entrada duplicada.
Unicode true
ManifestDPIAware true
!ifdef FAST
  SetCompressor zlib
!else
  SetCompressor /SOLID lzma
  SetCompressorDictSize 64
!endif
!ifndef VERSION
  !define VERSION "1.2.17"
!endif
!ifndef DIST
  !define DIST "dist/SimuladorDeDesfoque"
!endif
!define APPNAME "Simulador de Desfoque da Bruxosdovfx"
!define APPEXE "SimuladorDeDesfoque.exe"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\{73771560-FCC7-496D-8AF7-270792D59B79}_is1"

Name "${APPNAME}"
OutFile "../Versao-Atual-1.2.17/Simulador-de-Desfoque-Bruxosdovfx-${VERSION}-Setup-Windows-x64.exe"
InstallDir "$LOCALAPPDATA\Programs\BruxosdovfxDesfoque"
RequestExecutionLevel user
BrandingText "Bruxosdovfx · ${VERSION}"
VIProductVersion "${VERSION}.0"
VIAddVersionKey /LANG=0 "ProductName" "${APPNAME}"
VIAddVersionKey /LANG=0 "CompanyName" "Bruxosdovfx"
VIAddVersionKey /LANG=0 "FileVersion" "${VERSION}"
VIAddVersionKey /LANG=0 "ProductVersion" "${VERSION}"
VIAddVersionKey /LANG=0 "FileDescription" "Instalador — ${APPNAME}"

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!define MUI_ICON "native/app.ico"
!define MUI_UNICON "native/app.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "native/installer/wizard-photo-164x314.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "native/installer/wizard-photo-164x314.bmp"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APPEXE}"
!define MUI_LANGDLL_ALLLANGUAGES

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "PortugueseBR"
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_RESERVEFILE_LANGDLL

LangString SecApp ${LANG_PORTUGUESEBR} "Aplicativo (obrigatório)"
LangString SecApp ${LANG_ENGLISH} "Application (required)"
LangString SecApp ${LANG_SIMPCHINESE} "应用程序（必需）"
LangString SecDesk ${LANG_PORTUGUESEBR} "Atalho na área de trabalho"
LangString SecDesk ${LANG_ENGLISH} "Desktop shortcut"
LangString SecDesk ${LANG_SIMPCHINESE} "桌面快捷方式"
LangString MsgRunning ${LANG_PORTUGUESEBR} "O Simulador de Desfoque está aberto. Ele será fechado para continuar a instalação."
LangString MsgRunning ${LANG_ENGLISH} "The Blur Simulator is running. It will be closed to continue the installation."
LangString MsgRunning ${LANG_SIMPCHINESE} "模糊模拟器正在运行，将关闭以继续安装。"
LangString MsgWebView ${LANG_PORTUGUESEBR} "Instalando Microsoft WebView2..."
LangString MsgWebView ${LANG_ENGLISH} "Installing Microsoft WebView2..."
LangString MsgWebView ${LANG_SIMPCHINESE} "正在安装 Microsoft WebView2..."
LangString Msg64 ${LANG_PORTUGUESEBR} "Este aplicativo requer Windows 64 bits."
LangString Msg64 ${LANG_ENGLISH} "This application requires 64-bit Windows."
LangString Msg64 ${LANG_SIMPCHINESE} "此应用程序需要 64 位 Windows。"

Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "$(Msg64)"
    Abort
  ${EndIf}
  !insertmacro MUI_LANGDLL_DISPLAY
FunctionEnd

Function CloseApp
  nsExec::ExecToStack 'cmd /c tasklist /FI "IMAGENAME eq ${APPEXE}" /NH'
  Pop $0
  Pop $1
  StrCpy $2 $1 22
  ${If} $2 == "${APPEXE}"
    MessageBox MB_ICONINFORMATION|MB_OK "$(MsgRunning)" /SD IDOK
    nsExec::Exec 'taskkill /IM ${APPEXE} /T'
    Sleep 1500
    nsExec::Exec 'taskkill /IM ${APPEXE} /T /F'
    Sleep 500
  ${EndIf}
FunctionEnd

Function NeedsWebView2
  StrCpy $R0 "1"
  SetRegView 32
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  SetRegView lastused
  ${If} $0 != ""
  ${AndIf} $0 != "0.0.0.0"
    StrCpy $R0 "0"
  ${EndIf}
  ReadRegStr $0 HKCU "Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${If} $0 != ""
  ${AndIf} $0 != "0.0.0.0"
    StrCpy $R0 "0"
  ${EndIf}
FunctionEnd

Section "$(SecApp)" SecMain
  SectionIn RO
  Call CloseApp
  SetOutPath "$INSTDIR"
  ; versão anterior: remove arquivos do app (preserva dados do usuário, que ficam fora desta pasta)
  RMDir /r "$INSTDIR\_internal\web"
  File /r "${DIST}/*"
  SetOutPath "$INSTDIR\native\depth\worker"
  File "optics/depth_worker.py"
  File "optics/dvd_adapter.py"
  File "optics/worker_status.py"
  File "optics/model_cache.py"
  SetOutPath "$INSTDIR"
  File "DESKTOP.md"
  File "REVISAO-1.2.10.md"
  File "REALISMO-1.2.15.md"
  ; desinstalador antigo (Inno) substituído por este
  Delete "$INSTDIR\unins000.exe"
  Delete "$INSTDIR\unins000.dat"
  WriteUninstaller "$INSTDIR\Desinstalar.exe"
  CreateDirectory "$SMPROGRAMS\Bruxosdovfx"
  CreateShortCut "$SMPROGRAMS\Bruxosdovfx\${APPNAME}.lnk" "$INSTDIR\${APPEXE}"
  Delete "$SMPROGRAMS\Optica Lab\Optica Lab.lnk"
  RMDir "$SMPROGRAMS\Optica Lab"
  Delete "$DESKTOP\Optica Lab.lnk"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "Bruxosdovfx"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\${APPEXE}"
  WriteRegStr HKCU "${UNINSTKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" '"$INSTDIR\Desinstalar.exe"'
  WriteRegStr HKCU "${UNINSTKEY}" "QuietUninstallString" '"$INSTDIR\Desinstalar.exe" /S'
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1
  Call NeedsWebView2
  ${If} $R0 == "1"
    DetailPrint "$(MsgWebView)"
    SetOutPath "$PLUGINSDIR"
    File "native/windows/MicrosoftEdgeWebview2Setup.exe"
    ExecWait '"$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe" /silent /install'
    SetOutPath "$INSTDIR"
  ${EndIf}
SectionEnd

Section /o "$(SecDesk)" SecDesktop
  CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${APPEXE}"
SectionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_FUNCTION_DESCRIPTION_END

Section "Uninstall"
  nsExec::Exec 'taskkill /IM ${APPEXE} /T /F'
  Delete "$SMPROGRAMS\Bruxosdovfx\${APPNAME}.lnk"
  RMDir "$SMPROGRAMS\Bruxosdovfx"
  Delete "$DESKTOP\${APPNAME}.lnk"
  RMDir /r "$INSTDIR\_internal"
  RMDir /r "$INSTDIR\native"
  Delete "$INSTDIR\${APPEXE}"
  Delete "$INSTDIR\*.md"
  Delete "$INSTDIR\Desinstalar.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "${UNINSTKEY}"
SectionEnd
