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
	objc.console_(message);
}

//Loads a javascript file in the src directory
//----------------------------------------
function require(script)
{
	objc.require_(script);
}

//Reading values
//----------------------------------------
function memcmp(pointer, value)
{
    return objc.memcompare__(pointer,value);
}
function readChar(pointer)
{
    return objc.readInt8_(pointer);
}
function readShort(pointer)
{
    return objc.readInt16_(pointer);
}
function readInt(pointer)
{
    return objc.readInt32_(pointer);
}
function readFloat(pointer)
{
    return parseFloat(objc.readFloat_(pointer));
}
function readUTF8String(pointer)
{
    return objc.readUTF8String_(pointer);
}
function readUTF16String(pointer)
{
    return objc.readUTF16String_(pointer);
}

//Helper functions
//----------------------------------------
function objectPointer(object_id)
{
    if (object_id < 0)
        return -1;
    
    var pointer = 0x400506E8 + object_id * 12 + 0x8;
    return readInt(pointer);
}
function playerObjectId(player_number)
{
    var pointer = 0x402AAFFC + 0x200 * player_number;
    return readShort(pointer);
}

//Tag classes
//----------------------------------------
var tags = {};
var tag_address = 0x40440028;
var tag_array_size = 5000; //Need to read this from memory

function updateTags()
{
    tags = {};
    for (var i = 0; i < tag_array_size; i++)
    {
        if (memcmp(tag_address,"ihev"))
        {
            var pointer = readInt(tag_address+16);
            var tag_id = readInt(tag_address+12);
            var tag_name = readUTF8String(pointer);
            tags[tag_name] = tag_id;
        }
        tag_address+=32;
    }
}

//Object classes
//----------------------------------------
var max_players = 16;
var max_objects = 2048;
var dead_object = -1;

function newObject()
{
    return new function(id)
    {
        this.id = id;
        this.exists = function()
        {
            if (this.id < 1)
                return false;
            
            return true;
        }
        this.pointer = function()
        {
            if (this.id != dead_object)
                return objectPointer(this.id);
            return -1;
        }
        this.tag_id = function()
        {
            var pointer = this.pointer();
            if (pointer != dead_object)
            {
                return readShort(pointer + 0x2);
            }
            return -1;
        }
        this.x = function()
        {
            if (this.id != dead_object)
                return readFloat(this.pointer() + 0x5c);
            return 0.0;
        };
        this.y = function()
        {
            if (this.id != dead_object)
                return readFloat(this.pointer() + 0x60);
            return 0.0;
        };
        this.z = function()
        {
            if (this.id != dead_object)
                return readFloat(this.pointer() + 0x64);
            return 0.0;
        };
    };
}

var players = [];
for (var i=0; i < max_players; i++)
{
    players[i] = newObject(playerObjectId(i));
}
var objects = [];
for (var i=0; i < max_objects; i++)
{
    objects[i] = newObject(i);
}

function updatePlayers()
{
    if (players_updated)
        return;
    for (var i=0; i < max_players; i++)
    {
        var object_id = playerObjectId(i);
        var player = players[i];
        player.id = object_id;
    }
    players_updated = true;
}
function get_player(i)
{
    var object_id = playerObjectId(i);
    var player = players[i];
    player.id = object_id;
    return player;
}
function findObjects(name)
{
    var tag_ids = [];
    for (var tag_name in tags)
    {
        if (tag_name.indexOf(name) != -1)
        {
            tag_ids.push(tags[tag_name]);
        }
    }
    var found_objects = [];
    for (var i=0; i < max_objects; i++)
    {
        if (objects[i].tag_id() in tag_ids)
        {
            found_objects.push(objects[i]);
        }
    }
    return found_objects;
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
    updateTags();
    map_begin(map_name);
}
function run_map_end(map_name)
{
    tags = {};
    map_end(map_name);
}

//Start the script
//----------------------------------------
require("script.js");