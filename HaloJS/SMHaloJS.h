//
//  SMHaloHUD.h
//  HaloHUD
//
//  Created by Samuco on 11/23/13.
//  Copyright (c) 2013. All rights reserved.
//

// This class is set as the principle class in Info.plist
// It is important this class' name is unique, so use your favorite prefix

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>
#import "MDPlugin.h"

@interface SMHaloJS : NSObject <MDPlugin>
{
    WebView *javascript_webview;
    WebScriptObject *scriptObject;
}
@end
