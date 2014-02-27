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

//Required scripts
require("objects.js");

//Script attributes
var loop_interval = 0.2; //ms

//Setup - Called when the plugin is first initialised
var warthogs = null;
function setup()
{
}


var starttime;

var map_started = false;
function loop()
{
    if (!map_started)
        return;
    
    var WARTHOG_CURVE_Z_ORIGIN_OFFSET = 5;
    var WARTHOG_CURVE_ALTITUDE = 4;
    
    if (!warthogs)
    {
        starttime = new Date().getTime();
        warthogs = findObjects("warthog");
        for (i in warthogs)
        {
            warthogs[i].base_x = warthogs[i].x();
            warthogs[i].base_z = warthogs[i].z()+WARTHOG_CURVE_Z_ORIGIN_OFFSET;
        }
    }
    
    var end = new Date().getTime();
    var time = end - starttime;
    var timeElapsed = parseFloat(time/1000.0);
    
    if (timeElapsed > 10)
    for (var i=0; i<warthogs.length; i++)
    {
        warthogs[i].setX(parseFloat(warthogs[i].base_x + Math.cos(timeElapsed*5.0) * WARTHOG_CURVE_ALTITUDE));
        warthogs[i].setZ(parseFloat(warthogs[i].base_z + Math.sin(timeElapsed*5.0) * WARTHOG_CURVE_ALTITUDE));
    }
}

function map_begin(map_name)
{
    updateTags();
    map_started = true;
}

function map_end(map_name)
{
	halo_console("Finished " + map_name);
}