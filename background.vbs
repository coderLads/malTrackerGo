Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run chr(34) & "run.cmd" & Chr(34), 0
Set WshShell = Nothing