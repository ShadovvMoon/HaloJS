/*
 * Copyright (c) 2013, Samuel Colbran <contact@samuco.net>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 
 * Redistributions in binary form must reproduce the above copyright notice, this
 * list of conditions and the following disclaimer in the documentation and/or
 * other materials provided with the distribution.
 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var objc = window.objc;

//Console colours
//----------------------------------------
var colours = {'':0x0, 'white':0x343aa0};
function halo_console(message, color)
{
	if (!color || !(color in colours))
		color='white';

	objc.hconsole(message, colours[color]);
}

//Javascript console function override
//----------------------------------------
var console = {};
console.log = function(message)
{
    halo_console(message);
}
console.debug = function(message)
{
    objc.console_(message);
}
setInterval = function(callback, delay)
{
	objc.timer__(callback, delay);
}

//Loads a javascript file in the src directory
//----------------------------------------
function require(script)
{
	objc.require_(script);
}

function valid_pointer(pointer)
{
    return (pointer > 0);
}
//Reading values
//----------------------------------------
function memcmp(pointer, value)
{
    if (valid_pointer(pointer)) return objc.memcompare__(pointer,value);
    return false;
}
function readChar(pointer)
{
    if (valid_pointer(pointer)) return objc.readInt8_(pointer);
    return -1;
}
function readShort(pointer)
{
    if (valid_pointer(pointer)) return objc.readInt16_(pointer);
    return -1;
}
function readInt(pointer)
{
    if (valid_pointer(pointer)) return objc.readInt32_(pointer);
    return -1;
}
function readFloat(pointer)
{
    if (valid_pointer(pointer)) return parseFloat(objc.readFloat_(pointer));
    return -1;
}
function readUTF8String(pointer)
{
    if (valid_pointer(pointer)) return objc.readUTF8String_(pointer);
    return -1;
}
function readUTF16String(pointer)
{
    if (valid_pointer(pointer)) return objc.readUTF16String_(pointer);
    return -1;
}

//Reading values
//----------------------------------------
function writeFloat(pointer, value)
{
    if (valid_pointer(pointer)) return objc.writeFloat__(pointer, value);
    return -1;
}

//Override these methods in script.js
//----------------------------------------
var loop_interval = 1000;
function setup() {}
function loop() {}
function map_begin(map_name) {}
function map_end(map_name) {}

//Wrappers
//----------------------------------------
var players_updated = false;
function run_loop()
{
    players_updated = false;
    loop();
}
function run_map_begin(map_name)
{
    map_begin(map_name);
}
function run_map_end(map_name)
{
    map_end(map_name);
}

//Code caves (override)
//----------------------------------------
//Return true if you want to display the chat message normally
function on_chat(color, message, some_int) {return true;}

//Start the scripts
//----------------------------------------
require("script.js");

setup();
setInterval(run_loop, loop_interval);