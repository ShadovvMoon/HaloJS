//
//  SMHaloHUD.m
//  HaloHUD
//
//  Created by Samuco on 11/23/13.
//  Copyright (c) 2013. All rights reserved.
//

#import "SMHaloJS.h"
#import "mach_override.h"
#import <JavaScriptCore/JavaScriptCore.h>

void (*consolePrintf)(int color, const char *format, ...) = (void *)0x1588a8;
int8_t (*oldChat)(int, const uint16_t *, int);
static int8_t textChatOverride(int unknownZero, const uint16_t *message, int unknownSize)
{
    JSContextRef ctx = [[javascript_webview mainFrame] globalContext];
    JSStringRef script = JSStringCreateWithCFString((CFStringRef)@"return on_chat(c,m,i)");
    
    JSStringRef c = JSStringCreateWithUTF8CString("c");
    JSStringRef m = JSStringCreateWithUTF8CString("m");
    JSStringRef i = JSStringCreateWithUTF8CString("i");
    JSStringRef argumentNames[] = { c,m,i };
    JSObjectRef fn = JSObjectMakeFunction(ctx, NULL, 3, argumentNames, script, NULL, 0, NULL);
    
    NSString *ocmessage = [NSString stringWithFormat:@"%S", message];
    JSStringRef jsmessage = JSStringCreateWithCFString((CFStringRef)ocmessage);
    
    JSValueRef  arguments[3];
    arguments[0] = JSValueMakeNumber(ctx, unknownZero);
    arguments[1] = JSValueMakeString(ctx, jsmessage);
    arguments[2] = JSValueMakeNumber(ctx, unknownSize);
    
    JSValueRef return_value = JSObjectCallAsFunction(ctx, fn, NULL, 3, arguments, NULL);
    BOOL returned_number = JSValueToBoolean(ctx, return_value);
    if (returned_number)
        return oldChat(unknownZero, message, unknownSize);
    return 0;
}

@implementation SMHaloJS

- (id)initWithMode:(MDPluginMode)mode
{
	self = [super init];
	if (self != nil)
	{
        NSString *base_url = [[[NSBundle bundleForClass:[SMHaloJS class]] resourcePath] stringByAppendingPathComponent:@"src/"];
        
        javascript_webview = [[WebView alloc] init];
        [[javascript_webview mainFrame] loadHTMLString:@"" baseURL:[NSURL fileURLWithPath:base_url]];
        
        scriptObject = [javascript_webview windowScriptObject];
        [scriptObject setValue:self forKey:@"objc"];
        
        [self executeScript:@"halojs.js"];
        
        //Override functions
        mach_override_ptr((void *)0x14D9A4, textChatOverride, (void **)&oldChat);
	}
	return self;
}

- (void)mapDidBegin:(NSString *)mapName
{
    [self runScript:[NSString stringWithFormat:@"run_map_begin(\"%@\");", mapName]];
}

- (void)mapDidEnd:(NSString *)mapName
{
    [self runScript:[NSString stringWithFormat:@"run_map_end(\"%@\");", mapName]];
}

//Methods for javascript file
//--------------------------------
-(void)hconsole:(NSString*)message :(NSNumber*)color
{
    const char *string = [message cStringUsingEncoding:NSUTF8StringEncoding];
    consolePrintf([color intValue], string);
}
-(void)console:(NSString*)message
{
    NSLog(@"%@", message);
}
-(void)require:(NSString*)script
{
    [self executeScript:script];
}
-(void)callbackTimer:(NSTimer*)t
{
    WebScriptObject *callback = [t userInfo];
    JSObjectRef ref = [callback JSObject];
    JSContextRef ctx = [[javascript_webview mainFrame] globalContext];
    JSObjectCallAsFunction(ctx, ref, NULL, 0, NULL, NULL);
}
-(void)timer:(WebScriptObject*)callback :(NSNumber*)interval
{
    [NSTimer scheduledTimerWithTimeInterval: [interval floatValue]/1000.0
                                     target:self
                                   selector:@selector(callbackTimer:)
                                   userInfo:callback
                                    repeats:YES];
}

//Code caves
//--------------------------------
-(NSNumber*)halochatfunction:(NSNumber*)color :(NSString*)message :(NSNumber*)size
{
    const uint16_t *msg = [[message dataUsingEncoding:NSUTF16StringEncoding] bytes];
    return [NSNumber numberWithChar:oldChat([color intValue], (const uint16_t*)msg, [size intValue])];
}

//Value reading
//--------------------------------
-(NSNumber*)memcompare:(NSNumber*)pointer :(NSString*)string_value
{
    if (memcmp((const void*)[pointer integerValue],
               [string_value cStringUsingEncoding:NSUTF8StringEncoding],
               [string_value length]) == 0)
        return [NSNumber numberWithBool:YES];
    return [NSNumber numberWithBool:NO];
}
-(NSNumber*)readInt8:(NSNumber*)pointer
{
    int8_t returnAddress;
    memcpy(&returnAddress, (const void*)[pointer integerValue],sizeof(int8_t));
    return [NSNumber numberWithChar:returnAddress];
}
-(NSNumber*)readInt16:(NSNumber*)pointer
{
    int16_t returnAddress;
    memcpy(&returnAddress, (const void*)[pointer integerValue],sizeof(int16_t));
    return [NSNumber numberWithShort:returnAddress];
}
-(NSNumber*)readInt32:(NSNumber*)pointer
{
    int32_t returnAddress;
    memcpy(&returnAddress, (const void*)[pointer integerValue],sizeof(int32_t));
    return [NSNumber numberWithInteger:returnAddress];
}
-(NSNumber*)readFloat:(NSNumber*)pointer
{
    float returnAddress;
    memcpy(&returnAddress, (const void*)[pointer integerValue],sizeof(float));
    return [NSNumber numberWithFloat:returnAddress];
}
-(NSString *)readUTF16String:(NSNumber*)pointer
{
    mach_vm_address_t pointerToObject = [pointer intValue];
    NSMutableData *mutableData = [[NSMutableData alloc] init];
    short returnAddress;
    while (YES)
    {
        memcpy(&returnAddress, (const void*)pointerToObject, sizeof(short));
        [mutableData appendBytes:&returnAddress length:sizeof(short)];
        if (returnAddress == 0)
        {
            break;
        }
        pointerToObject += sizeof(short);
    }
    NSString *stringRepresentation = [NSString stringWithCharacters:[mutableData bytes] length:[mutableData length] / 2];
    return stringRepresentation;
}
-(NSString *)readUTF8String:(NSNumber*)pointer
{
    mach_vm_address_t pointerToObject = [pointer intValue];
    NSMutableData *mutableData = [[NSMutableData alloc] init];
    char returnAddress;
    while (YES)
    {
        memcpy(&returnAddress, (const void*)pointerToObject, sizeof(char));
        [mutableData appendBytes:&returnAddress length:sizeof(char)];
        if (returnAddress == '\0')
		{
			break;
		}
        pointerToObject += sizeof(char);
    }
    NSString *stringRepresentation = [[NSString alloc] initWithData:mutableData encoding:NSUTF8StringEncoding];
    return stringRepresentation;
}

//Value writing
//--------------------------------
-(void)writeFloat:(NSNumber*)pointer :(NSNumber*)value
{
    mach_vm_address_t address = [pointer intValue];
    float v = [value floatValue];
    memcpy((void*)address, &v, 4);
}

//Supported methods
//--------------------------------
+ (NSString *) webScriptNameForSelector:(SEL)sel
{
    NSString *name=nil;
    if (sel == @selector(console:))
        name = @"console";
    else if (sel == @selector(require:))
        name = @"require";
    else if (sel == @selector(hconsole::))
        name = @"hconsole";
    else if (sel == @selector(readInt8:))
        name = @"readInt8";
    else if (sel == @selector(readInt16:))
        name = @"readInt16";
    else if (sel == @selector(readInt32:))
        name = @"readInt32";
    else if (sel == @selector(readFloat:))
        name = @"readFloat";
    else if (sel == @selector(writeFloat::))
        name = @"writeFloat";
    else if (sel == @selector(memcompare::))
        name = @"memcompare";
    else if (sel == @selector(readUTF8String:))
        name = @"readUTF8String";
    else if (sel == @selector(readUTF16String:))
        name = @"readUTF16String";
    else if (sel == @selector(timer::))
        name = @"timer";
    else if (sel == @selector(halochatfunction:::))
        name = @"halochatfunction";
    return name;
}
//-(NSNumber*)halochatfunction:(NSNumber*)color :(NSString*)message :(NSNumber*)size
+ (BOOL)isSelectorExcludedFromWebScript:(SEL)sel
{
    return ([SMHaloJS webScriptNameForSelector:sel] == nil);
}

//Javascript execution functions
//--------------------------------
-(void)loopFunction:(NSTimer*)t
{
    @autoreleasepool {
        [self runScript:[t userInfo]];
    }
}

-(void)executeScript:(NSString*)script
{
    NSString *script_file  = [[[NSBundle bundleForClass:[SMHaloJS class]] resourcePath] stringByAppendingPathComponent:
                              [NSString stringWithFormat:@"src/%@", script]];
    NSError *e = nil;
    NSString *code = [[NSString alloc] initWithContentsOfFile:script_file encoding:NSUTF8StringEncoding error:&e];
    
    if (!e)
    {
        //NSLog(@"Running %@", script);
        [self runScript:code];
    }
    else NSLog(@"Error: %@", [e description]);
}

- (id)runScript:(NSString*)code
{
    JSValueRef script_exception = NULL;
    JSContextRef ctx = [[javascript_webview mainFrame] globalContext];
    
    JSStringRef src = JSStringCreateWithCFString((CFStringRef)code);
    JSCheckScriptSyntax(ctx, src, NULL, 0, &script_exception);
    
    if (script_exception)
    {
        CFStringRef error = JSStringCopyCFString(CFAllocatorGetDefault(), JSValueToStringCopy(ctx, script_exception, nil));
        NSLog(@"%@", (NSString*)error);
    }
    
	NSString* script = [NSString stringWithFormat:@"try { %@ } catch (e) { e.toString() }", code];
	id data = [scriptObject evaluateWebScript:code];
	if(![data isMemberOfClass:[WebUndefined class]] && ![data isMemberOfClass:[WebScriptObject class]] && ![NSStringFromClass([data class]) isEqualToString:@"__NSCFNumber"])
    {
		NSLog(@"Error: %@ %@", data, NSStringFromClass([data class]));
    }
    return data;
}

@end
