// ==UserScript==
// @name         WazeWrap Beta
// @namespace    https://greasyfork.org/users/30701-justins83-waze
// @version      0.2.9.b3
// @description  A base library for WME script writers
// @author       JustinS83/MapOMatic
// @include      https://beta.waze.com/*editor/*
// @include      https://www.waze.com/*editor/*
// @exclude      https://www.waze.com/*user/editor/*
// @grant        none
// ==/UserScript==

/* global W */
/* global WazeWrap */

var WazeWrap = {};

(function() {

	function bootstrap(tries) {
		tries = tries || 1;
		if (window.W &&
			window.W.map &&
			window.W.model &&
			window.W.loginManager.user &&
			$) {
			init();
		} else if (tries < 1000) {
			setTimeout(function () { bootstrap(tries++); }, 200);
		} else {
			console.log('WazeWrap failed to load');
		}
	}

    bootstrap();

    function init(){
		console.log("WazeWrap initializing...");
		
        var oldLib = window.WazeWrap;
        var root = this;

		WazeWrap.Version = GM_info.script.version;
		WazeWrap.isBetaEditor = /beta/.test(location.href);

        //SetUpRequire();

		WazeWrap.test = "test";
        
		WazeWrap.Geometry = new Geometry;
		WazeWrap.Model = new Model;
		WazeWrap.Interface = new Interface;
		WazeWrap.User = new User;
		WazeWrap.Util = new Util;
		WazeWrap.Require = new Require;
	        WazeWrap.String = new String;
		
        root.WazeWrap = WazeWrap;

        console.log('WazeWrap Loaded');
    };


    function SetUpRequire(){
                if(this.isBetaEditor || typeof window.require !== "undefined")
                     return;

                console.log("Setting d2's require fix...");

		// setup one global var and put all in
		var WMEAPI = {};

		// detect URL of WME source code
		WMEAPI.scripts = document.getElementsByTagName('script');
		WMEAPI.url=null;
		for (i=0;i<WMEAPI.scripts.length;i++){
			if (WMEAPI.scripts[i].src.indexOf('/assets-editor/js/app')!=-1)
			{
				WMEAPI.url=WMEAPI.scripts[i].src;
				break;
			}
		}
		if (WMEAPI.url==null)
			throw new Error("WME Hack: can't detect WME main JS");


		// setup a fake require and require.define
		WMEAPI.require=function (e) {
			if (WMEAPI.require.define.modules.hasOwnProperty(e))
				return WMEAPI.require.define.modules[e];
			else
				console.error('Require failed on ' + e, WMEAPI.require.define.modules);
			return null;
		};

		WMEAPI.require.define=function (m) {
			if (WMEAPI.require.define.hasOwnProperty('modules')==false)
				WMEAPI.require.define.modules={};
			for (var p in m){
				WMEAPI.require.define.modules[p]=m[p];
			}
		};

		// save the original webpackJsonp function
		WMEAPI.tmp = window.webpackJsonp;

		// taken from WME code: this function is a wrapper that setup the API and may call recursively other functions
		WMEAPI.t = function (n) {
			if (WMEAPI.s[n]) return WMEAPI.s[n].exports;
			var r = WMEAPI.s[n] = {
				exports: {},
				id: n,
				loaded: !1
			};
			return WMEAPI.e[n].call(r.exports, r, r.exports, WMEAPI.t), r.loaded = !0, r.exports;
		};

		// e is a copy of all WME funcs because function t need to access to this list
		WMEAPI.e=[];

		// the patch
		window.webpackJsonp = function(a, i) {
		// our API but we will use it only to build the require stuffs
		var api={};
		// taken from WME code. a is [1], so...
		for (var o, d, u = 0, l = []; u < a.length; u++) d = a[u], WMEAPI.r[d] && l.push.apply(l, WMEAPI.r[d]), WMEAPI.r[d] = 0;
		
		var unknownCount=0;
		var classname, funcStr;
		
		// copy i in e and keep a link from classname to index in e
		for (o in i){
			WMEAPI.e[o] = i[o];
			funcStr = i[o].toString();
			classname = funcStr.match(/CLASS_NAME:\"([^\"]*)\"/);
			if (classname){
				// keep the link.
				api[classname[1].replace(/\./g,'/').replace(/^W\//, 'Waze/')]={index: o, func: WMEAPI.e[o]};
			}
			else{
				api['Waze/Unknown/' + unknownCount]={index: o, func: WMEAPI.e[o]};
				unknownCount++;
			}
			
		}
		
		// taken from WME code: it calls the original webpackJsonp and do something else, but I don't really know what.
		// removed the call to the original webpackJsonp: still works...
		//for (tmp && tmp(a, i); l.length;) l.shift().call(null, t);
		for (; l.length;) l.shift().call(null, WMEAPI.t);
		WMEAPI.s[0] = 0;
		
		// run the first func of WME. This first func will call recusrsively all funcs needed to setup the API.
		// After this call, s will contain all instanciables classes.
		//var ret = WMEAPI.t(0);
		
		// now, build the requires thanks to the link we've built in var api.
		var module={};
		var apiFuncName;
		unknownCount=0;
		
		for (o in i){
			funcStr = i[o].toString();
			classname = funcStr.match(/CLASS_NAME:\"([^\"]*)\"/);
			if (classname){
				module={};
				apiFuncName = classname[1].replace(/\./g,'/').replace(/^W\//, 'Waze/');
				module[apiFuncName]=WMEAPI.t(api[apiFuncName].index);
				WMEAPI.require.define(module);
			}
			else{
				var matches = funcStr.match(/SEGMENT:"segment",/);
				if (matches){
					module={};
					apiFuncName='Waze/Model/ObjectType';
					module[apiFuncName]=WMEAPI.t(api['Waze/Unknown/' + unknownCount].index);
					WMEAPI.require.define(module);
				}
				unknownCount++;
			}
		}
		 

		// restore the original func
		window.webpackJsonp=WMEAPI.tmp;

		// set the require public if needed
		// if so: others scripts must wait for the window.require to be available before using it.
		window.require = WMEAPI.require;
		// all available functions are in WMEAPI.require.define.modules
		// console.debug this variable to read it:
		// console.debug('Modules: ', WMEAPI.require.define.modules);
		
		// run your script here:
		// setTimeout(yourscript);
		
		// again taken from WME code. Not sure about what it does.
		//if (i[0]) return ret;
		};

		// some kind of global vars and init
		WMEAPI.s = {};
		WMEAPI.r = {
			0: 0
		};

		// hacking finished

		// load again WME through our patched func
		WMEAPI.WMEHACK_Injected_script = document.createElement("script");
		WMEAPI.WMEHACK_Injected_script.setAttribute("type", "application/javascript");
		WMEAPI.WMEHACK_Injected_script.src = WMEAPI.url;
		document.body.appendChild(WMEAPI.WMEHACK_Injected_script);
                console.log("d2 fix complete");
	}

    function Geometry(){
        //var geometry = WazeWrap.Geometry;

        //Converts to "normal" GPS coordinates
        this.ConvertTo4326 = function (long, lat){
            var projI=new OpenLayers.Projection("EPSG:900913");
            var projE=new OpenLayers.Projection("EPSG:4326");
            return (new OpenLayers.LonLat(long, lat)).transform(projI,projE);
        };
    
        this.ConvertTo900913 = function (long, lat){
            var projI=new OpenLayers.Projection("EPSG:900913");
            var projE=new OpenLayers.Projection("EPSG:4326");
            return (new OpenLayers.LonLat(long, lat)).transform(projE,projI);
        };

        //Converts the Longitudinal offset to an offset in 4326 gps coordinates
        this.CalculateLongOffsetGPS = function(longMetersOffset, long, lat)
        {
            var R= 6378137; //Earth's radius
            var dLon = longMetersOffset / (R * Math.cos(Math.PI * lat / 180)); //offset in radians
            var lon0 = dLon * (180 / Math.PI); //offset degrees

            return lon0;
        };

        //Converts the Latitudinal offset to an offset in 4326 gps coordinates
        this.CalculateLatOffsetGPS = function(latMetersOffset, lat)
        {
            var R= 6378137; //Earth's radius
            var dLat = latMetersOffset/R;
            var lat0 = dLat * (180  /Math.PI); //offset degrees

            return lat0;
        };
		
		/**
		 * Checks if the given geometry is on screen
         * @function WazeWrap.Geometry.isGeometryInMapExtent
         * @param {OpenLayers.Geometry} Geometry to check if any part of is in the current viewport
         */
		this.isLonLatInMapExtent = function (lonLat) {
            'use strict';
            return lonLat && W.map.getExtent().containsLonLat(lonLat);
        };
		
		/**
		 * Checks if the given geometry is on screen
         * @function WazeWrap.Geometry.isGeometryInMapExtent
         * @param {OpenLayers.Geometry} Geometry to check if any part of is in the current viewport
         */
		this.isGeometryInMapExtent = function (geometry) {
            'use strict';
            return geometry && geometry.getBounds &&
                W.map.getExtent().intersectsBounds(geometry.getBounds());
        };
		
		/**
		 * Calculates the distance between two given points, returned in meters
         * @function WazeWrap.Geometry.calculateDistance
         * @param {OpenLayers.Geometry.Point} An array of OL.Geometry.Point with which to measure the total distance. A minimum of 2 points is needed.
         */
		this.calculateDistance = function(pointArray) {
			if(pointArray.length < 2)
				return 0;

			var line = new OpenLayers.Geometry.LineString(pointArray);
			length = line.getGeodesicLength(W.map.getProjectionObject());
			return length; //multiply by 3.28084 to convert to feet
		};
		
		this.findClosestSegment = function(mygeometry, ignorePLR, ignoreUnnamedPR){
			var onscreenSegments = WazeWrap.Model.getOnscreenSegments();
			var minDistance = Infinity;
			var closestSegment;
			
			for (s in onscreenSegments) {
				if (!onscreenSegments.hasOwnProperty(s))
					continue;

				segmentType = onscreenSegments[s].attributes.roadType;
				if (segmentType === 10 || segmentType === 3 || segmentType === 16 || segmentType === 18 || segmentType === 19 || segmentType === 5) //10 ped boardwalk, 16 stairway, 18 railroad, 19 runway, 3 freeway, 5 walking trail
					continue;
					
				if(ignorePLR)
					if(segmentType === 20) //PLR
						continue;

				if(ignoreUnnamedPR)
					if(segmentType === 17 && WazeWrap.Model.getStreetName(onscreenSegments[s].attributes.primaryStreetID) === null) //PR
						continue;


				distanceToSegment = mygeometry.distanceTo(onscreenSegments[s].geometry, {details: true});

				if (distanceToSegment.distance < minDistance) {
					minDistance = distanceToSegment.distance;
					closestSegment = onscreenSegments[s];
				}
			}
			return closestSegment;
		};
    };

    function Model(){

        this.getPrimaryStreetID = function(segmentID){
            return W.model.segments.get(segmentID).attributes.primaryStreetID;
        };

        this.getStreetName = function(primaryStreetID){
            return W.model.streets.get(primaryStreetID).name;
        };

        this.getCityID = function(primaryStreetID){
            return W.model.streets.get(primaryStreetID).cityID;
        };

        this.getCityName = function(primaryStreetID){
            return W.model.cities.get(this.getCityID(primaryStreetID)).attributes.Name;
        };

        this.getStateName = function(primaryStreetID){
            return W.model.states.get(getStateID(primaryStreetID)).Name;   
        };

        this.getStateID = function(primaryStreetID){
            return W.model.cities.get(primaryStreetID).attributes.stateID;
        };

        this.getCountryID = function(primaryStreetID){
            return W.model.cities.get(this.getCityID(primaryStreetID)).attributes.CountryID;
        };

        this.getCountryName = function(primaryStreetID){
            return W.model.countries.get(getCountryID(primaryStreetID)).name;
        };

        this.getCityNameFromSegmentObj = function(segObj){
            return this.getCityName(segObj.attributes.primaryStreetID);
        };

        this.getStateNameFromSegmentObj = function(segObj){
            return this.getStateName(segObj.attributes.primaryStreetID);
        };

        //returns an array of segmentIDs for all segments that are part of the same roundabout as the passed segment
        this.getAllRoundaboutSegmentsFromObj = function(segObj){
            if(segObj.model.attributes.junctionID === null)
                return null;

            return W.model.junctions.objects[segObj.model.attributes.junctionID].segIDs;
        };

        this.getAllRoundaboutJunctionNodesFromObj = function(segObj){
            var RASegs = this.getAllRoundaboutSegmentsFromObj(segObj);
            var RAJunctionNodes = [];
            for(i=0; i< RASegs.length; i++){
                RAJunctionNodes.push(W.model.nodes.objects[W.model.segments.get(RASegs[i]).attributes.toNodeID]);

            }
            return RAJunctionNodes;
        };

        this.isRoundaboutSegmentID = function(segmentID){
            if(W.model.segments.get(segmentID).attributes.junctionID === null)
                return false;
            else
                return true;
        };

        this.isRoundaboutSegmentObj = function(segObj){
            if(segObj.model.attributes.junctionID === null)
                return false;
            else
                return true;
        };
		
		this.getOnscreenSegments = function(){
			var segments = W.model.segments.objects;
			var mapExtent = W.map.getExtent();
			var onScreenSegments = [];
			var seg;

			for (s in segments) {
				if (!segments.hasOwnProperty(s))
					continue;

				seg = W.model.segments.get(s);
				if (mapExtent.intersectsBounds(seg.geometry.getBounds()))
					onScreenSegments.push(seg);
			}
			return onScreenSegments;
		};

/**
         * Defers execution of a callback function until the WME map and data 
         * model are ready. Call this function before calling a function that 
         * causes a map and model reload, such as W.map.moveTo(). After the 
         * move is completed the callback function will be executed.
         * @function WazeWrap.Model.onModelReady
         * @param {Function} callback The callback function to be executed.
         * @param {Boolean} now Whether or not to call the callback now if the
         * model is currently ready.
         * @param {Object} context The context in which to call the callback.
         */
        this.onModelReady = function (callback, now, context) {
            var deferModelReady = function () {
                return $.Deferred(function (dfd) {
                    var resolve = function () {
                        dfd.resolve();
                        W.model.events.unregister('mergeend', null, resolve);
                    };
                    W.model.events.register('mergeend', null, resolve);
                }).promise();
            };
            var deferMapReady = function () {
                return $.Deferred(function (dfd) {
                    var resolve = function () {
                        dfd.resolve();
                        W.vent.off('operationDone', resolve);
                    };
                    W.vent.on('operationDone', resolve);
                }).promise();
            };

            if (typeof callback === 'function') {
                context = context || callback;
                if (now && WazeWrap.Util.mapReady() && WazeWrap.Util.modelReady()) {
                    callback.call(context);
                } else {
                    $.when(deferMapReady() && deferModelReady()).
                        then(function () {
                            callback.call(context);
                        });
                }
            }
        };
		
		/**
         * Retrives a route from the Waze Live Map.
         * @class
         * @name wLib.Model.RouteSelection
         * @param firstSegment The segment to use as the start of the route.
         * @param lastSegment The segment to use as the destination for the route.
         * @param {Array|Function} callback A function or array of funcitons to be 
         * executed after the route
         * is retrieved. 'This' in the callback functions will refer to the 
         * RouteSelection object.
         * @param {Object} options A hash of options for determining route. Valid 
         * options are:
         * fastest: {Boolean} Whether or not the fastest route should be used. 
         * Default is false, which selects the shortest route.
         * freeways: {Boolean} Whether or not to avoid freeways. Default is false.
         * dirt: {Boolean} Whether or not to avoid dirt roads. Default is false.
         * longtrails: {Boolean} Whether or not to avoid long dirt roads. Default 
         * is false.
         * uturns: {Boolean} Whether or not to allow U-turns. Default is true.
         * @return {wLib.Model.RouteSelection} The new RouteSelection object.
         * @example: // The following example will retrieve a route from the Live Map and select the segments in the route.
         * selection = W.selectionManager.selectedItems;
         * myRoute = new wLib.Model.RouteSelection(selection[0], selection[1], function(){this.selectRouteSegments();}, {fastest: true});
         */
        this.RouteSelection = function (firstSegment, lastSegment, callback, options) {
            var i,
                n,
                start = this.getSegmentCenterLonLat(firstSegment),
                end = this.getSegmentCenterLonLat(lastSegment);
            this.options = {
                fastest: options && options.fastest || false,
                freeways: options && options.freeways || false,
                dirt: options && options.dirt || false,
                longtrails: options && options.longtrails || false,
                uturns: options && options.uturns || true
            };
            this.requestData = {
                from: 'x:' + start.x + ' y:' + start.y + ' bd:true',
                to: 'x:' + end.x + ' y:' + end.y + ' bd:true',
                returnJSON: true,
                returnGeometries: true,
                returnInstructions: false,
                type: this.options.fastest ? 'HISTORIC_TIME' : 'DISTANCE',
                clientVersion: '4.0.0',
                timeout: 60000,
                nPaths: 3,
                options: this.setRequestOptions(this.options)
            };
            this.callbacks = [];
            if (callback) {
                if (!(callback instanceof Array)) {
                    callback = [callback];
                }
                for (i = 0, n = callback.length; i < n; i++) {
                    if ('function' === typeof callback[i]) {
                        this.callbacks.push(callback[i]);
                    }
                }
            }
            this.routeData = null;
            this.getRouteData();
        };

		this.RouteSelection.prototype = 
            /** @lends wLib.Model.RouteSelection.prototype */ {
                
            /**
             * Formats the routing options string for the ajax request.
             * @private
             * @param {Object} options Object containing the routing options.
             * @return {String} String containing routing options.
             */
            setRequestOptions: function (options) {
                return 'AVOID_TOLL_ROADS:' + (options.tolls ? 't' : 'f') + ',' +
                    'AVOID_PRIMARIES:' + (options.freeways ? 't' : 'f') + ',' +
                    'AVOID_TRAILS:' + (options.dirt ? 't' : 'f') + ',' +
                    'AVOID_LONG_TRAILS:' + (options.longtrails ? 't' : 'f') + ',' +
                    'ALLOW_UTURNS:' + (options.uturns ? 't' : 'f');
            },
            
            /**
             * Gets the center of a segment in LonLat form.
             * @private
             * @param segment A Waze model segment object.
             * @return {OpenLayers.LonLat} The LonLat object corresponding to the
             * center of the segment.
             */
            getSegmentCenterLonLat: function (segment) {
                var x, y, componentsLength, midPoint;
                if (segment) {
                    componentsLength = segment.geometry.components.length;
                    midPoint = Math.floor(componentsLength / 2);
                    if (componentsLength % 2 === 1) {
                        x = segment.geometry.components[midPoint].x;
                        y = segment.geometry.components[midPoint].y;
                    } else {
                        x = (segment.geometry.components[midPoint - 1].x +
                            segment.geometry.components[midPoint].x) / 2;
                        y = (segment.geometry.components[midPoint - 1].y +
                            segment.geometry.components[midPoint].y) / 2;
                    }
                    return new OL.Geometry.Point(x, y).
                        transform(W.map.getProjectionObject(), 'EPSG:4326');
                }

            },
            
            /**
             * Gets the route from Live Map and executes any callbacks upon success.
             * @private
             * @returns The ajax request object. The responseJSON property of the 
             * returned object
             * contains the route information.
             *
             */
            getRouteData: function () {
                var i,
                    n,
                    that = this;
                return $.ajax({
                    dataType: 'json',
                    url: this.getURL(),
                    data: this.requestData,
                    dataFilter: function (data, dataType) {
                        return data.replace(/NaN/g, '0');
                    },
                    success: function (data) {
                        that.routeData = data;
                        for (i = 0, n = that.callbacks.length; i < n; i++) {
                            that.callbacks[i].call(that);
                        }
                    }
                });
            },
            
            /**
             * Extracts the IDs from all segments on the route.
             * @private
             * @return {Array} Array containing an array of segment IDs for
             * each route alternative.
             */
            getRouteSegmentIDs: function () {
                var i, j, route, len1, len2, segIDs = [],
                    routeArray = [],
                    data = this.routeData;
                if ('undefined' !== typeof data.alternatives) {
                    for (i = 0, len1 = data.alternatives.length; i < len1; i++) {
                        route = data.alternatives[i].response.results;
                        for (j = 0, len2 = route.length; j < len2; j++) {
                            routeArray.push(route[j].path.segmentId);
                        }
                        segIDs.push(routeArray);
                        routeArray = [];
                    }
                } else {
                    route = data.response.results;
                    for (i = 0, len1 = route.length; i < len1; i++) {
                        routeArray.push(route[i].path.segmentId);
                    }
                    segIDs.push(routeArray);
                }
                return segIDs;
            },
            
            /**
             * Gets the URL to use for the ajax request based on country.
             * @private
             * @return {String} Relative URl to use for route ajax request.
             */
            getURL: function () {
                if (W.model.countries.get(235) || W.model.countries.get(40)) {
                    return '/RoutingManager/routingRequest';
                } else if (W.model.countries.get(106)) {
                    return '/il-RoutingManager/routingRequest';
                } else {
                    return '/row-RoutingManager/routingRequest';
                }
            },
            
            /**
             * Selects all segments on the route in the editor.
             * @param {Integer} routeIndex The index of the alternate route.
             * Default route to use is the first one, which is 0.
             */
            selectRouteSegments: function (routeIndex) {
                var i, n, seg,
                    segIDs = this.getRouteSegmentIDs()[Math.floor(routeIndex) || 0],
                    segments = [];
                if ('undefined' === typeof segIDs) {
                    return;
                }
                for (i = 0, n = segIDs.length; i < n; i++) {
                    seg = W.model.segments.get(segIDs[i]);
                    if ('undefined' !== seg) {
                        segments.push(seg);
                    }
                }
                return W.selectionManager.select(segments);
            }
        };
    };
	
	function User(){
		this.Rank = function(){
			return W.loginManager.user.normalizedLevel;
		};

		this.Username = function(){
			return W.loginManager.user.userName;
		};

		this.isCM = function(){
			if(W.loginManager.user.editableCountryIDs.length > 0)
				return true;
			else
				return false;
		};
		
		this.isAM = function(){
			return W.loginManager.user.isAreaManager;
		};
	};
	
	function Require(){
		this.DragElement = function(){
			var myDragElement = OL.Class({
			started: !1,
			stopDown: !0,
			dragging: !1,
			touch: !1,
			last: null ,
			start: null ,
			lastMoveEvt: null ,
			oldOnselectstart: null ,
			interval: 0,
			timeoutId: null ,
			forced: !1,
			active: !1,
			initialize: function(e) {
				this.map = e,
				this.uniqueID = myDragElement.baseID--
			},
			callback: function(e, t) {
				if (this[e])
					return this[e].apply(this, t)
			},
			dragstart: function(e) {
				e.xy = new OL.Pixel(e.clientX - this.map.viewPortDiv.offsets[0],e.clientY - this.map.viewPortDiv.offsets[1]);
				var t = !0;
				return this.dragging = !1,
				(OL.Event.isLeftClick(e) || OL.Event.isSingleTouch(e)) && (this.started = !0,
				this.start = e.xy,
				this.last = e.xy,
				OL.Element.addClass(this.map.viewPortDiv, "olDragDown"),
				this.down(e),
				this.callback("down", [e.xy]),
				OL.Event.stop(e),
				this.oldOnselectstart || (this.oldOnselectstart = document.onselectstart ? document.onselectstart : OL.Function.True),
				document.onselectstart = OL.Function.False,
				t = !this.stopDown),
				t
			},
			forceStart: function() {
				var e = arguments.length > 0 && void 0 !== arguments[0] && arguments[0];
				return this.started = !0,
				this.endOnMouseUp = e,
				this.forced = !0,
				this.last = {
					x: 0,
					y: 0
				},
				this.callback("force")
			},
			forceEnd: function() {
				if (this.forced)
					return this.endDrag()
			},
			dragmove: function(e) {
				return this.map.viewPortDiv.offsets && (e.xy = new OL.Pixel(e.clientX - this.map.viewPortDiv.offsets[0],e.clientY - this.map.viewPortDiv.offsets[1])),
				this.lastMoveEvt = e,
				!this.started || this.timeoutId || e.xy.x === this.last.x && e.xy.y === this.last.y || (this.interval > 0 && (this.timeoutId = window.setTimeout(OL.Function.bind(this.removeTimeout, this), this.interval)),
				this.dragging = !0,
				this.move(e),
				this.oldOnselectstart || (this.oldOnselectstart = document.onselectstart,
				document.onselectstart = OL.Function.False),
				this.last = e.xy),
				!0
			},
			dragend: function(e) {
				if (e.xy = new OL.Pixel(e.clientX - this.map.viewPortDiv.offsets[0],e.clientY - this.map.viewPortDiv.offsets[1]),
				this.started) {
					var t = this.start !== this.last;
					this.endDrag(),
					this.up(e),
					this.callback("up", [e.xy]),
					t && this.callback("done", [e.xy])
				}
				return !0
			},
			endDrag: function() {
				this.started = !1,
				this.dragging = !1,
				this.forced = !1,
				OL.Element.removeClass(this.map.viewPortDiv, "olDragDown"),
				document.onselectstart = this.oldOnselectstart
			},
			down: function(e) {},
			move: function(e) {},
			up: function(e) {},
			out: function(e) {},
			mousedown: function(e) {
				return this.dragstart(e)
			},
			touchstart: function(e) {
				return this.touch || (this.touch = !0,
				this.map.events.un({
					mousedown: this.mousedown,
					mouseup: this.mouseup,
					mousemove: this.mousemove,
					click: this.click,
					scope: this
				})),
				this.dragstart(e)
			},
			mousemove: function(e) {
				return this.dragmove(e)
			},
			touchmove: function(e) {
				return this.dragmove(e)
			},
			removeTimeout: function() {
				if (this.timeoutId = null ,
				this.dragging)
					return this.mousemove(this.lastMoveEvt)
			},
			mouseup: function(e) {
				if (!this.forced || this.endOnMouseUp)
					return this.started ? this.dragend(e) : void 0
			},
			touchend: function(e) {
				if (e.xy = this.last,
				!this.forced)
					return this.dragend(e)
			},
			click: function(e) {
				return this.start === this.last
			},
			activate: function(e) {
				this.$el = e,
				this.active = !0;
				var t = $(this.map.viewPortDiv);
				return this.$el.on("mousedown.drag-" + this.uniqueID, $.proxy(this.mousedown, this)),
				this.$el.on("touchstart.drag-" + this.uniqueID, $.proxy(this.touchstart, this)),
				$(document).on("mouseup.drag-" + this.uniqueID, $.proxy(this.mouseup, this)),
				t.on("mousemove.drag-" + this.uniqueID, $.proxy(this.mousemove, this)),
				t.on("touchmove.drag-" + this.uniqueID, $.proxy(this.touchmove, this)),
				t.on("touchend.drag-" + this.uniqueID, $.proxy(this.touchend, this))
			},
			deactivate: function() {
				return this.active = !1,
				this.$el.off(".drag-" + this.uniqueID),
				$(this.map.viewPortDiv).off(".drag-" + this.uniqueID),
				$(document).off(".drag-" + this.uniqueID),
				this.touch = !1,
				this.started = !1,
				this.forced = !1,
				this.dragging = !1,
				this.start = null ,
				this.last = null ,
				OL.Element.removeClass(this.map.viewPortDiv, "olDragDown")
			},
			adjustXY: function(e) {
				var t = OL.Util.pagePosition(this.map.viewPortDiv);
				return e.xy.x -= t[0],
				e.xy.y -= t[1]
			},
			CLASS_NAME: "W.Handler.DragElement"
			});
                 myDragElement.baseID = 0;
				 return myDragElement;
		 };
	
		this.DivIcon = OpenLayers.Class({
			className: null ,
			$div: null ,
			events: null ,
			initialize: function(e, t) {
				this.className = e,
					this.moveWithTransform = !!t,
					this.$div = $("<div />").addClass(e),
					this.div = this.$div.get(0),
					this.imageDiv = this.$div.get(0);
			},
			destroy: function() {
				this.erase(),
					this.$div = null;
			},
			clone: function() {
				return new i(this.className);
			},
			draw: function(e) {
				return this.moveWithTransform ? (this.$div.css({
					transform: "translate(" + e.x + "px, " + e.y + "px)"
				}),
												 this.$div.css({
					position: "absolute"
				})) : this.$div.css({
					position: "absolute",
					left: e.x,
					top: e.y
				}),
					this.$div.get(0);
			},
			moveTo: function(e) {
				null !== e && (this.px = e),
					null === this.px ? this.display(!1) : this.moveWithTransform ? this.$div.css({
					transform: "translate(" + this.px.x + "px, " + this.px.y + "px)"
				}) : this.$div.css({
					left: this.px.x,
					top: this.px.y
				});
			},
			erase: function() {
				this.$div.remove();
			},
			display: function(e) {
				this.$div.toggle(e);
			},
			isDrawn: function() {
				return !!this.$div.parent().length;
			},
			bringToFront: function() {
				if (this.isDrawn()) {
					var e = this.$div.parent();
					this.$div.detach().appendTo(e);
				}
			},
			forceReflow: function() {
				return this.$div.get(0).offsetWidth;
			},
			CLASS_NAME: "Waze.DivIcon"
		});
	};
	
	
	function Util(){
		/**
         * Function to defer function execution until an element is present on 
         * the page.
         * @function WazeWrap.Util.waitForElement
         * @param {String} selector The CSS selector string or a jQuery object 
         * to find before executing the callback.
         * @param {Function} callback The function to call when the page 
         * element is detected.
         * @param {Object} [context] The context in which to call the callback.
         */
        this.waitForElement = function (selector, callback, context) {
            var jqObj;

            if (!selector || typeof callback !== 'function') {
                return;
            }

            jqObj = typeof selector === 'string' ?
                $(selector) : selector instanceof $ ? selector : null;

            if (!jqObj.size()) {
                window.requestAnimationFrame(function () {
                    WazeWrap.Util.waitForElement(selector, callback, context);
                });
            } else {
                callback.call(context || callback);
            }
        };

         /**
         * Function to track the ready state of the map.
         * @function WazeWrap.Util.mapReady
         * @return {Boolean} Whether or not a map operation is pending or 
         * undefined if the function has not yet seen a map ready event fired.
         */
        this.mapReady = function () {
            var mapReady = true;
            W.vent.on('operationPending', function () {
                mapReady = false;
            });
            W.vent.on('operationDone', function () {
                mapReady = true;
            });
            return function () {
                return mapReady;
            };
        } ();

         /**
         * Function to track the ready state of the model.
         * @function WazeWrap.Util.modelReady
         * @return {Boolean} Whether or not the model has loaded objects or 
         * undefined if the function has not yet seen a model ready event fired.
         */
        this.modelReady = function () {
            var modelReady = true;
            W.model.events.register('mergestart', null, function () {
                modelReady = false;
            });
            W.model.events.register('mergeend', null, function () {
                modelReady = true;
            });
            return function () {
                return modelReady;
            };
        } ();
	};

    function Interface() {
        /**
         * Generates id for message bars.
         * @private
         */
        var getNextID = function () {
            var id = 1;
            return function () {
                return id++;
            };
        } ();
		
        this.Shortcut = OL.Class(this, /** @lends WazeWrap.Interface.Shortcut.prototype */ {
            name: null,
            desc: null,
            group: null,
            title: null,
            shortcut: {},
            callback: null,
            scope: null,
            groupExists: false,
            actionExists: false,
            eventExists: false,
            defaults: {
                group: 'default'
            },
                
            /**
             * Creates a new {WazeWrap.Interface.Shortcut}.
             * @class
             * @name WazeWrap.Interface.Shortcut
             * @param name {String} The name of the shortcut.
             * @param desc {String} The description to display for the shortcut
             * @param group {String} The name of the shortcut group.
             * @param title {String} The title to display for this group in the Keyboard shortcuts list
             * @param shortcut {String} The shortcut key(s). The shortcut  
             * should be of the form 'i' where i is the keyboard shortuct or 
             * include modifier keys  such as 'CSA+i', where C = the control 
             * key, S = the shift key, A = the alt key, and i = the desired 
             * keyboard shortcut. The modifier keys are optional.
             * @param callback {Function} The function to be called by the 
             * shortcut.
             * @param scope {Object} The object to be used as this by the 
             * callback.
             * @return {WazeWrap.Interface.Shortcut} The new shortcut object.
             * @example //Creates new shortcut and adds it to the map.
             * shortcut = new WazeWrap.Interface.Shortcut('myName', 'myGroup', 'C+p', callbackFunc, null).add();
             */
            initialize: function (name, desc, group, title, shortcut, callback, scope) {
                if ('string' === typeof name && name.length > 0 &&
                    'string' === typeof shortcut &&
                    'function' === typeof callback) {
                    this.name = name;
                    this.desc = desc;
                    this.group = group || this.defaults.group;
                    this.title = title;
                    this.callback = callback;
                    this.shortcut[shortcut] = name;
                    if ('object' !== typeof scope) {
                        this.scope = null;
                    } else {
                        this.scope = scope;
                    }
                    return this;
                }
            },
                
            /**
            * Determines if the shortcut's group already exists.
            * @private
            */
            doesGroupExist: function () {
                this.groupExists = 'undefined' !== typeof W.accelerators.Groups[this.group] &&
                undefined !== typeof W.accelerators.Groups[this.group].members;
                return this.groupExists;
            },
                
            /**
            * Determines if the shortcut's action already exists.
            * @private
            */
            doesActionExist: function () {
                this.actionExists = 'undefined' !== typeof W.accelerators.Actions[this.name];
                return this.actionExists;
            },
                
            /**
            * Determines if the shortcut's event already exists.
            * @private
            */
            doesEventExist: function () {
                this.eventExists = 'undefined' !== typeof W.accelerators.events.listeners[this.name] &&
                W.accelerators.events.listeners[this.name].length > 0 &&
                this.callback === W.accelerators.events.listeners[this.name][0].func &&
                this.scope === W.accelerators.events.listeners[this.name][0].obj;
                return this.eventExists;
            },
                
            /**
            * Creates the shortcut's group.
            * @private
            */
            createGroup: function () {
                W.accelerators.Groups[this.group] = [];
                W.accelerators.Groups[this.group].members = [];
                if(this.title && !I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group]){
                    I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group] = [];
                    I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group].description = this.title;
                    I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group].members = [];
                }
            },
                
            /**
            * Registers the shortcut's action.
            * @private
            */
            addAction: function () {
                if(this.title)
                    I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group].members[this.name] = this.desc;
                W.accelerators.addAction(this.name, { group: this.group });
            },
                
            /**
            * Registers the shortcut's event.
            * @private
            */
            addEvent: function () {
                W.accelerators.events.register(this.name, this.scope, this.callback);
            },
                
            /**
            * Registers the shortcut's keyboard shortcut.
            * @private
            */
            registerShortcut: function () {
                W.accelerators._registerShortcuts(this.shortcut);
            },
                
            /**
            * Adds the keyboard shortcut to the map.
            * @return {WazeWrap.Interface.Shortcut} The keyboard shortcut.
            */
            add: function () {
                /* If the group is not already defined, initialize the group. */
                if (!this.doesGroupExist()) {
                    this.createGroup();
                }

                /* Clear existing actions with same name */
                if (this.doesActionExist()) {
                    W.accelerators.Actions[this.name] = null;
                }
                this.addAction();

                /* Register event only if it's not already registered */
                if (!this.doesEventExist()) {
                    this.addEvent();
                }

                /* Finally, register the shortcut. */
                this.registerShortcut();
                return this;
            },
                
            /**
            * Removes the keyboard shortcut from the map.
            * @return {WazeWrap.Interface.Shortcut} The keyboard shortcut.
            */
            remove: function () {
                if (this.doesEventExist()) {
                    W.accelerators.events.unregister(this.name, this.scope, this.callback);
                }
                if (this.doesActionExist()) {
                    delete W.accelerators.Actions[this.name];
                }
                //remove shortcut?
                return this;
            },
                
            /**
            * Changes the keyboard shortcut and applies changes to the map.
            * @return {WazeWrap.Interface.Shortcut} The keyboard shortcut.
            */
            change: function (shortcut) {
                if (shortcut) {
                    this.shortcut = {};
                    this.shortcut[shortcut] = this.name;
                    this.registerShortcut();
                }
                return this;
            }
        }),

		this.Tab = OL.Class(this, {
            /** @lends WazeWrap.Interface.Tab */
            TAB_SELECTOR: '#user-tabs ul.nav-tabs',
            CONTENT_SELECTOR: '#user-info div.tab-content',
            callback: null,
            $content: null,
            context: null,
            $tab: null,
            
            /**
             * Creates a new WazeWrap.Interface.Tab. The tab is appended to the WME 
             * editor sidebar and contains the passed HTML content.
             * @class
             * @name WazeWrap.Interface.Tab
             * @param {String} name The name of the tab. Should not contain any 
             * special characters.
             * @param {String} content The HTML content of the tab.
             * @param {Function} [callback] A function to call upon successfully 
             * appending the tab.
             * @param {Object} [context] The context in which to call the callback 
             * function.
                     * @return {WazeWrap.Interface.Tab} The new tab object.
             * @example //Creates new tab and adds it to the page.
             * new WazeWrap.Interface.Tab('thebestscriptever', '<div>Hello World!</div>');
             */
            initialize: function (name, content, callback, context) {
                var idName, i = 0;
                if (name && 'string' === typeof name &&
                    content && 'string' === typeof content) {
                    if (callback && 'function' === typeof callback) {
                        this.callback = callback;
                        this.context = context || callback;
                    }
                    /* Sanitize name for html id attribute */
                    idName = name.toLowerCase().replace(/[^a-z-_]/g, '');
                    /* Make sure id will be unique on page */
                    while (
                        $('#sidepanel-' + (i ? idName + i : idName)).length > 0) {
                        i++;
                    }
                    if (i) {
                        idName = idName + i;
                    }
                    /* Create tab and content */
                    this.$tab = $('<li/>')
                        .append($('<a/>')
                            .attr({
                                'href': '#sidepanel-' + idName,
                                'data-toggle': 'tab',
                            })
                            .text(name));
                    this.$content = $('<div/>')
                        .addClass('tab-pane')
                        .attr('id', 'sidepanel-' + idName)
                        .html(content);

                    this.appendTab();
                }
            },

            append: function (content) {
                this.$content.append(content);
            },

            appendTab: function () {
                WazeWrap.Util.waitForElement(
                    this.TAB_SELECTOR + ',' + this.CONTENT_SELECTOR,
                    function () {
                        $(this.TAB_SELECTOR).append(this.$tab);
                        $(this.CONTENT_SELECTOR).first().append(this.$content);
                        if (this.callback) {
                            this.callback.call(this.context);
                        }
                    }, this);
            },

            clearContent: function () {
                this.$content.empty();
            },

            destroy: function () {
                this.$tab.remove();
                this.$content.remove();
            }
        });

		this.AddLayerCheckbox = function(group, checkboxText, checked, callback){
			group = group.toLowerCase();
        var normalizedText = checkboxText.toLowerCase().replace(/\s/g, '_');
        var checkboxID = "layer-switcher-item_" + normalizedText;
        var groupPrefix = 'layer-switcher-group_';
        var groupClass = groupPrefix + group.toLowerCase();
        sessionStorage[normalizedText] = checked;

        var CreateParentGroup = function(groupChecked){
            var groupList = $('.layer-switcher').find('.list-unstyled.togglers');
            var checkboxText = group.charAt(0).toUpperCase() + group.substr(1);
            var newLI = $('<li class="group">');
            newLI.html([
                '<div class="controls-container toggler">',
                '<input class="' + groupClass + '" id="' + groupClass + '" type="checkbox" ' + (groupChecked ? 'checked' : '') +'>',
                '<label for="' + groupClass + '">',
                '<span class="label-text">'+ checkboxText + '</span>',
                '</label></div>',
                '<ul class="children"></ul>'
                ].join(' '));

            groupList.append(newLI);
            $('#' + groupClass).change(function(){sessionStorage[groupClass] = this.checked;});
        };

        if(group !== "issues" && group !== "places" && group !== "road" && group !== "display") //"non-standard" group, check its existence
            if($('.'+groupClass).length === 0){ //Group doesn't exist yet, create it
                var isParentChecked = (typeof sessionStorage[groupClass] == "undefined" ? true : sessionStorage[groupClass]=='true');
                CreateParentGroup(isParentChecked);  //create the group
                sessionStorage[groupClass] = isParentChecked;

                Waze.app.modeController.model.bind('change:mode', function(model, modeId, context){ //make it reappear after changing modes
                    CreateParentGroup((sessionStorage[groupClass]=='true'));
                });
            }

        var buildLayerItem = function(isChecked){
            var groupChildren = $("."+groupClass).parent().parent().find('.children').not('.extended');
            $li = $('<li>');
            $li.html([
                '<div class="controls-container toggler">',
                '<input type="checkbox" id="' + checkboxID + '"  class="' + checkboxID + ' toggle">',
                '<label for="' + checkboxID + '"><span class="label-text">' + checkboxText + '</span></label>',
                '</div>',
            ].join(' '));

            groupChildren.append($li);
            $('#' + checkboxID).prop('checked', isChecked);
            $('#' + checkboxID).change(function(){callback(this.checked); sessionStorage[normalizedText] = this.checked;});
            if(!$('#' + groupClass).is(':checked')){
                $('#' + checkboxID).prop('disabled', true);
                callback(false);
            }

            $('#' + groupClass).change(function(){$('#' + checkboxID).prop('disabled', !this.checked); callback(this.checked);});
        };


        Waze.app.modeController.model.bind('change:mode', function(model, modeId, context){
            buildLayerItem((sessionStorage[normalizedText]=='true'));
        });

        buildLayerItem(checked);
	};
    };
	this.String = function(){
		this.toTitleCase = function(){
			return str.replace(/(?:^|\s)\w/g, function(match) {
				return match.toUpperCase();
				};
		};
    	});
}.call(this));
