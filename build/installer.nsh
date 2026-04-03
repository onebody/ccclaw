!macro customHeader
  !system "echo 'Building Ccclaw-Lite Windows Installer'"
!macroend

!macro preInit
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  SetRegView 32
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
!macroend

!macro customInit
  ${ifNot} ${UAC_IsInnerInstance}
    ${if} ${UAC_IsAdmin}
      UserInfo::GetAccountType
      Pop $0
      ${if} $0 != "Admin"
        MessageBox MB_ICONSTOP "需要管理员权限安装到当前目录。$\n$\n请右键点击安装程序并选择'以管理员身份运行'。"
        Quit
      ${endif}
    ${endif}
  ${endif}
!macroend

!macro customInstall
  SetRegView 64
  WriteRegStr HKLM "Software\Ccclaw" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "Software\Ccclaw" "Version" "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ccclaw" "DisplayName" "Ccclaw Lite"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ccclaw" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ccclaw" "Publisher" "秋芝2046"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ccclaw" "UninstallString" "$INSTDIR\Uninstall Ccclaw.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ccclaw" "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ccclaw" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ccclaw" "NoRepair" 1
  SetRegView 32
  WriteRegStr HKLM "Software\Ccclaw" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "Software\Ccclaw" "Version" "${APP_VERSION}"
!macroend

!macro customUnInstall
  SetRegView 64
  DeleteRegKey HKLM "Software\Ccclaw"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ccclaw"
  DeleteRegValue HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
  DeleteRegValue HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation
  SetRegView 32
  DeleteRegKey HKLM "Software\Ccclaw"
  DeleteRegValue HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
  DeleteRegValue HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation
!macroend

!macro customRemoveFiles
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\locales"
  Delete "$INSTDIR\*.*"
!macroend
