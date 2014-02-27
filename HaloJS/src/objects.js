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


//Helper functions
//----------------------------------------
function objectPointer(object_id)
{
    if (object_id < 0)
        return -1;
    
    var pointer = 0x400506E8 + object_id * 12 + 0x8;
    if (pointer > 0)
        return readInt(pointer);
    return -1;
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
    
    var tag_current_address = tag_address;
    for (var i = 0; i < tag_array_size; i++)
    {
        if (memcmp(tag_current_address,"ihev"))
        {
            var pointer    = readInt(tag_current_address+16);
            var tag_id     = readInt(tag_current_address+12);
            var tag_name   = readUTF8String(pointer);
            tags[tag_name] = tag_id;
        }
        tag_current_address+=32;
    }
}

//Object classes
//----------------------------------------
var max_players = 16;
var max_objects = 2048;
var dead_object = -1;

function newObject(id)
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
            if (pointer > 0)
            {
                var metaID  = readShort(pointer);
                var tagID   = readInt(tag_address + (metaID * 32) + 12);
                return tagID;
            }
            return -1;
        }
        this.tag_name = function()
        {
            var pointer = this.pointer();
            if (pointer > 0)
            {
                var metaID  = readShort(pointer);
                var address = (tag_address + (metaID * 32));
                var tag_name   = readUTF8String(readInt(address+16));

                return tag_name;
            }
            return -1;
        }
        this.x = function()
        {
            if (this.id != dead_object) return readFloat(this.pointer() + 0x5c);
            return 0.0;
        }
        this.y = function()
        {
            if (this.id != dead_object) return readFloat(this.pointer() + 0x60);
            return 0.0;
        }
        this.z = function()
        {
            if (this.id != dead_object) return readFloat(this.pointer() + 0x64);
            return 0.0;
        }
        this.setX = function(value)
        {
            if (this.id != dead_object) return writeFloat(this.pointer() + 0x5c, value);
            return -1;
        }
        this.setY = function(value)
        {
            if (this.id != dead_object) return writeFloat(this.pointer() + 0x60, value);
            return -1;
        }
        this.setZ = function(value)
        {
            if (this.id != dead_object) return writeFloat(this.pointer() + 0x64, value);
            return -1;
        }
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
    objects[i].id = i;
}

function get_player(i)
{
    var object_id = playerObjectId(i);
    var player = players[i];
    player.id = object_id;
    return player;
}
function get_object(i)
{
    var obj = objects[i];
    //obj.id = i;
    return objects[i];
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
        var tag_id = objects[i].tag_id();
        if (tag_id != null && tag_id != -1)
        {
            if (tag_ids.indexOf(tag_id) > -1)
            {
                found_objects.push(objects[i]);
            }
        }
    }
    return found_objects;
}