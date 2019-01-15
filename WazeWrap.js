// ==UserScript==
// @name         WazeWrap
// @namespace    https://greasyfork.org/users/30701-justins83-waze
// @version      2019.01.15.01
// @description  A base library for WME script writers
// @author       JustinS83/MapOMatic
// @include      https://beta.waze.com/*editor*
// @include      https://www.waze.com/*editor*
// @exclude      https://www.waze.com/*user/editor/*
// @grant        none
// ==/UserScript==

/* global W */
/* global WazeWrap */

  var WazeWrap = {Ready: false, Version: "2019.01.15.01"};

(function() {
    'use strict';
  
	
    function bootstrap(tries) {
        tries = tries || 1;
	if(!location.href.match(/^https:\/\/(www|beta)\.waze\.com\/(?!user\/)(.{2,6}\/)?editor\/?.*$/))
		return;
	    
        if (W && W.map &&
            W.model && W.loginManager.user &&
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

        WazeWrap.isBetaEditor = /beta/.test(location.href);

        //SetUpRequire();
    	W.map.events.register("moveend", this, RestoreMissingSegmentFunctions);
    	W.map.events.register("zoomend", this, RestoreMissingSegmentFunctions);
        RestoreMissingSegmentFunctions();
	RestoreMissingOLKMLSupport();

        WazeWrap.Geometry = new Geometry();
        WazeWrap.Model = new Model();
        WazeWrap.Interface = new Interface();
        WazeWrap.User = new User();
        WazeWrap.Util = new Util();
        WazeWrap.Require = new Require();
        WazeWrap.String = new String();
		
	WazeWrap.getSelectedFeatures = function(){
		return W.selectionManager.getSelectedFeatures();
	}

	WazeWrap.hasSelectedFeatures = function(){
		return W.selectionManager.hasSelectedFeatures();
	}
	
	WazeWrap.selectFeature = function(feature){
		if(!W.selectionManager.select)
			return W.selectionManager.selectFeature(feature);

		return W.selectionManager.select(feature);
	}
	
	WazeWrap.selectFeatures = function(featureArray){
		if(!W.selectionManager.select)
			return W.selectionManager.selectFeatures(featureArray);
		return W.selectionManager.select(featureArray);
	}
	
	WazeWrap.hasPlaceSelected = function(){
		return (W.selectionManager.hasSelectedFeatures() && W.selectionManager.getSelectedFeatures()[0].model.type === "venue");
	}
	    
	WazeWrap.hasSegmentSelected = function(){
		return (W.selectionManager.hasSelectedFeatures() && W.selectionManager.getSelectedFeatures()[0].model.type === "segment");
	}
	    
	WazeWrap.hasMapCommentSelected = function(){
		return (W.selectionManager.hasSelectedFeatures() && W.selectionManager.getSelectedFeatures()[0].model.type === "mapComment");
	}

	WazeWrap.Ready = true;
        window.WazeWrap = WazeWrap;

        console.log('WazeWrap Loaded');
    }
	
	

    function RestoreMissingSegmentFunctions(){
        if(W.model.segments.getObjectArray().length > 0){
            W.map.events.unregister("moveend", this, RestoreMissingSegmentFunctions);
            W.map.events.unregister("zoomend", this, RestoreMissingSegmentFunctions);
            if(typeof W.model.segments.getObjectArray()[0].model.getDirection == "undefined")
                W.model.segments.getObjectArray()[0].__proto__.getDirection = function(){return (this.attributes.fwdDirection ? 1 : 0) + (this.attributes.revDirection ? 2 : 0);};
            if(typeof W.model.segments.getObjectArray()[0].model.isTollRoad == "undefined")
                W.model.segments.getObjectArray()[0].__proto__.isTollRoad = function(){ return (this.attributes.fwdToll || this.attributes.revToll);};
        }
    }
	
	function RestoreMissingOLKMLSupport(){
		if(!OL.Format.KML){
			OL.Format.KML=OL.Class(OL.Format.XML,{namespaces:{kml:"http://www.opengis.net/kml/2.2",gx:"http://www.google.com/kml/ext/2.2"},kmlns:"http://earth.google.com/kml/2.0",placemarksDesc:"No description available",foldersName:"OL export",foldersDesc:"Exported on "+new Date,extractAttributes:!0,kvpAttributes:!1,extractStyles:!1,extractTracks:!1,trackAttributes:null,internalns:null,features:null,styles:null,styleBaseUrl:"",fetched:null,maxDepth:0,initialize:function(a){this.regExes=
            {trimSpace:/^\s*|\s*$/g,removeSpace:/\s*/g,splitSpace:/\s+/,trimComma:/\s*,\s*/g,kmlColor:/(\w{2})(\w{2})(\w{2})(\w{2})/,kmlIconPalette:/root:\/\/icons\/palette-(\d+)(\.\w+)/,straightBracket:/\$\[(.*?)\]/g};this.externalProjection=new OL.Projection("EPSG:4326");OL.Format.XML.prototype.initialize.apply(this,[a])},read:function(a){this.features=[];this.styles={};this.fetched={};return this.parseData(a,{depth:0,styleBaseUrl:this.styleBaseUrl})},parseData:function(a,b){"string"==typeof a&&
                (a=OL.Format.XML.prototype.read.apply(this,[a]));for(var c=["Link","NetworkLink","Style","StyleMap","Placemark"],d=0,e=c.length;d<e;++d){var f=c[d],g=this.getElementsByTagNameNS(a,"*",f);if(0!=g.length)switch(f.toLowerCase()){case "link":case "networklink":this.parseLinks(g,b);break;case "style":this.extractStyles&&this.parseStyles(g,b);break;case "stylemap":this.extractStyles&&this.parseStyleMaps(g,b);break;case "placemark":this.parseFeatures(g,b)}}return this.features},parseLinks:function(a,
b){if(b.depth>=this.maxDepth)return!1;var c=OL.Util.extend({},b);c.depth++;for(var d=0,e=a.length;d<e;d++){var f=this.parseProperty(a[d],"*","href");f&&!this.fetched[f]&&(this.fetched[f]=!0,(f=this.fetchLink(f))&&this.parseData(f,c))}},fetchLink:function(a){if(a=OL.Request.GET({url:a,async:!1}))return a.responseText},parseStyles:function(a,b){for(var c=0,d=a.length;c<d;c++){var e=this.parseStyle(a[c]);e&&(this.styles[(b.styleBaseUrl||"")+"#"+e.id]=e)}},parseKmlColor:function(a){var b=
                null;a&&(a=a.match(this.regExes.kmlColor))&&(b={color:"#"+a[4]+a[3]+a[2],opacity:parseInt(a[1],16)/255});return b},parseStyle:function(a){for(var b={},c=["LineStyle","PolyStyle","IconStyle","BalloonStyle","LabelStyle"],d,e,f=0,g=c.length;f<g;++f)if(d=c[f],e=this.getElementsByTagNameNS(a,"*",d)[0])switch(d.toLowerCase()){case "linestyle":d=this.parseProperty(e,"*","color");if(d=this.parseKmlColor(d))b.strokeColor=d.color,b.strokeOpacity=d.opacity;(d=this.parseProperty(e,"*","width"))&&(b.strokeWidth=
d);break;case "polystyle":d=this.parseProperty(e,"*","color");if(d=this.parseKmlColor(d))b.fillOpacity=d.opacity,b.fillColor=d.color;"0"==this.parseProperty(e,"*","fill")&&(b.fillColor="none");"0"==this.parseProperty(e,"*","outline")&&(b.strokeWidth="0");break;case "iconstyle":var h=parseFloat(this.parseProperty(e,"*","scale")||1);d=32*h;var i=32*h,j=this.getElementsByTagNameNS(e,"*","Icon")[0];if(j){var k=this.parseProperty(j,"*","href");if(k){var l=this.parseProperty(j,"*","w"),m=this.parseProperty(j,
"*","h");OL.String.startsWith(k,"http://maps.google.com/mapfiles/kml")&&(!l&&!m)&&(m=l=64,h/=2);l=l||m;m=m||l;l&&(d=parseInt(l)*h);m&&(i=parseInt(m)*h);if(m=k.match(this.regExes.kmlIconPalette))l=m[1],m=m[2],k=this.parseProperty(j,"*","x"),j=this.parseProperty(j,"*","y"),k="http://maps.google.com/mapfiles/kml/pal"+l+"/icon"+(8*(j?7-j/32:7)+(k?k/32:0))+m;b.graphicOpacity=1;b.externalGraphic=k}}if(e=this.getElementsByTagNameNS(e,"*","hotSpot")[0])k=parseFloat(e.getAttribute("x")),j=parseFloat(e.getAttribute("y")),
                    l=e.getAttribute("xunits"),"pixels"==l?b.graphicXOffset=-k*h:"insetPixels"==l?b.graphicXOffset=-d+k*h:"fraction"==l&&(b.graphicXOffset=-d*k),e=e.getAttribute("yunits"),"pixels"==e?b.graphicYOffset=-i+j*h+1:"insetPixels"==e?b.graphicYOffset=-(j*h)+1:"fraction"==e&&(b.graphicYOffset=-i*(1-j)+1);b.graphicWidth=d;b.graphicHeight=i;break;case "balloonstyle":(e=OL.Util.getXmlNodeValue(e))&&(b.balloonStyle=e.replace(this.regExes.straightBracket,"${$1}"));break;case "labelstyle":if(d=this.parseProperty(e,
"*","color"),d=this.parseKmlColor(d))b.fontColor=d.color,b.fontOpacity=d.opacity}!b.strokeColor&&b.fillColor&&(b.strokeColor=b.fillColor);if((a=a.getAttribute("id"))&&b)b.id=a;return b},parseStyleMaps:function(a,b){for(var c=0,d=a.length;c<d;c++)for(var e=a[c],f=this.getElementsByTagNameNS(e,"*","Pair"),e=e.getAttribute("id"),g=0,h=f.length;g<h;g++){var i=f[g],j=this.parseProperty(i,"*","key");(i=this.parseProperty(i,"*","styleUrl"))&&"normal"==j&&(this.styles[(b.styleBaseUrl||"")+"#"+e]=this.styles[(b.styleBaseUrl||
"")+i])}},parseFeatures:function(a,b){for(var c=[],d=0,e=a.length;d<e;d++){var f=a[d],g=this.parseFeature.apply(this,[f]);if(g){this.extractStyles&&(g.attributes&&g.attributes.styleUrl)&&(g.style=this.getStyle(g.attributes.styleUrl,b));if(this.extractStyles){var h=this.getElementsByTagNameNS(f,"*","Style")[0];if(h&&(h=this.parseStyle(h)))g.style=OL.Util.extend(g.style,h)}if(this.extractTracks){if((f=this.getElementsByTagNameNS(f,this.namespaces.gx,"Track"))&&0<f.length)g={features:[],feature:g},
                    this.readNode(f[0],g),0<g.features.length&&c.push.apply(c,g.features)}else c.push(g)}else throw"Bad Placemark: "+d;}this.features=this.features.concat(c)},readers:{kml:{when:function(a,b){b.whens.push(OL.Date.parse(this.getChildValue(a)))},_trackPointAttribute:function(a,b){var c=a.nodeName.split(":").pop();b.attributes[c].push(this.getChildValue(a))}},gx:{Track:function(a,b){var c={whens:[],points:[],angles:[]};if(this.trackAttributes){var d;c.attributes={};for(var e=0,f=this.trackAttributes.length;e<
f;++e)d=this.trackAttributes[e],c.attributes[d]=[],d in this.readers.kml||(this.readers.kml[d]=this.readers.kml._trackPointAttribute)}this.readChildNodes(a,c);if(c.whens.length!==c.points.length)throw Error("gx:Track with unequal number of when ("+c.whens.length+") and gx:coord ("+c.points.length+") elements.");var g=0<c.angles.length;if(g&&c.whens.length!==c.angles.length)throw Error("gx:Track with unequal number of when ("+c.whens.length+") and gx:angles ("+c.angles.length+") elements.");for(var h,
i,e=0,f=c.whens.length;e<f;++e){h=b.feature.clone();h.fid=b.feature.fid||b.feature.id;i=c.points[e];h.geometry=i;"z"in i&&(h.attributes.altitude=i.z);this.internalProjection&&this.externalProjection&&h.geometry.transform(this.externalProjection,this.internalProjection);if(this.trackAttributes){i=0;for(var j=this.trackAttributes.length;i<j;++i)h.attributes[d]=c.attributes[this.trackAttributes[i]][e]}h.attributes.when=c.whens[e];h.attributes.trackId=b.feature.id;g&&(i=c.angles[e],h.attributes.heading=
parseFloat(i[0]),h.attributes.tilt=parseFloat(i[1]),h.attributes.roll=parseFloat(i[2]));b.features.push(h)}},coord:function(a,b){var c=this.getChildValue(a).replace(this.regExes.trimSpace,"").split(/\s+/),d=new OL.Geometry.Point(c[0],c[1]);2<c.length&&(d.z=parseFloat(c[2]));b.points.push(d)},angles:function(a,b){var c=this.getChildValue(a).replace(this.regExes.trimSpace,"").split(/\s+/);b.angles.push(c)}}},parseFeature:function(a){for(var b=["MultiGeometry","Polygon","LineString","Point"],
c,d,e,f=0,g=b.length;f<g;++f)if(c=b[f],this.internalns=a.namespaceURI?a.namespaceURI:this.kmlns,d=this.getElementsByTagNameNS(a,this.internalns,c),0<d.length){if(b=this.parseGeometry[c.toLowerCase()])e=b.apply(this,[d[0]]),this.internalProjection&&this.externalProjection&&e.transform(this.externalProjection,this.internalProjection);else throw new TypeError("Unsupported geometry type: "+c);break}var h;this.extractAttributes&&(h=this.parseAttributes(a));c=new OL.Feature.Vector(e,h);a=a.getAttribute("id")||
                    a.getAttribute("name");null!=a&&(c.fid=a);return c},getStyle:function(a,b){var c=OL.Util.removeTail(a),d=OL.Util.extend({},b);d.depth++;d.styleBaseUrl=c;!this.styles[a]&&!OL.String.startsWith(a,"#")&&d.depth<=this.maxDepth&&!this.fetched[c]&&(c=this.fetchLink(c))&&this.parseData(c,d);return OL.Util.extend({},this.styles[a])},parseGeometry:{point:function(a){var b=this.getElementsByTagNameNS(a,this.internalns,"coordinates"),a=[];if(0<b.length)var c=b[0].firstChild.nodeValue,
                    c=c.replace(this.regExes.removeSpace,""),a=c.split(",");b=null;if(1<a.length)2==a.length&&(a[2]=null),b=new OL.Geometry.Point(a[0],a[1],a[2]);else throw"Bad coordinate string: "+c;return b},linestring:function(a,b){var c=this.getElementsByTagNameNS(a,this.internalns,"coordinates"),d=null;if(0<c.length){for(var c=this.getChildValue(c[0]),c=c.replace(this.regExes.trimSpace,""),c=c.replace(this.regExes.trimComma,","),d=c.split(this.regExes.splitSpace),e=d.length,f=Array(e),g,h,i=0;i<e;++i)if(g=
d[i].split(","),h=g.length,1<h)2==g.length&&(g[2]=null),f[i]=new OL.Geometry.Point(g[0],g[1],g[2]);else throw"Bad LineString point coordinates: "+d[i];if(e)d=b?new OL.Geometry.LinearRing(f):new OL.Geometry.LineString(f);else throw"Bad LineString coordinates: "+c;}return d},polygon:function(a){var a=this.getElementsByTagNameNS(a,this.internalns,"LinearRing"),b=a.length,c=Array(b);if(0<b)for(var d=0,e=a.length;d<e;++d)if(b=this.parseGeometry.linestring.apply(this,[a[d],!0]))c[d]=
                        b;else throw"Bad LinearRing geometry: "+d;return new OL.Geometry.Polygon(c)},multigeometry:function(a){for(var b,c=[],d=a.childNodes,e=0,f=d.length;e<f;++e)a=d[e],1==a.nodeType&&(b=this.parseGeometry[(a.prefix?a.nodeName.split(":")[1]:a.nodeName).toLowerCase()])&&c.push(b.apply(this,[a]));return new OL.Geometry.Collection(c)}},parseAttributes:function(a){var b={},c=a.getElementsByTagName("ExtendedData");c.length&&(b=this.parseExtendedData(c[0]));for(var d,e,f,a=a.childNodes,c=0,g=
a.length;c<g;++c)if(d=a[c],1==d.nodeType&&(e=d.childNodes,1<=e.length&&3>=e.length)){switch(e.length){case 1:f=e[0];break;case 2:f=e[0];e=e[1];f=3==f.nodeType||4==f.nodeType?f:e;break;default:f=e[1]}if(3==f.nodeType||4==f.nodeType)if(d=d.prefix?d.nodeName.split(":")[1]:d.nodeName,f=OL.Util.getXmlNodeValue(f))f=f.replace(this.regExes.trimSpace,""),b[d]=f}return b},parseExtendedData:function(a){var b={},c,d,e,f,g=a.getElementsByTagName("Data");c=0;for(d=g.length;c<d;c++){e=g[c];f=e.getAttribute("name");
var h={},i=e.getElementsByTagName("value");i.length&&(h.value=this.getChildValue(i[0]));this.kvpAttributes?b[f]=h.value:(e=e.getElementsByTagName("displayName"),e.length&&(h.displayName=this.getChildValue(e[0])),b[f]=h)}a=a.getElementsByTagName("SimpleData");c=0;for(d=a.length;c<d;c++)h={},e=a[c],f=e.getAttribute("name"),h.value=this.getChildValue(e),this.kvpAttributes?b[f]=h.value:(h.displayName=f,b[f]=h);return b},parseProperty:function(a,b,c){var d,a=this.getElementsByTagNameNS(a,b,c);try{d=OL.Util.getXmlNodeValue(a[0])}catch(e){d=
    null}return d},write:function(a){OL.Util.isArray(a)||(a=[a]);for(var b=this.createElementNS(this.kmlns,"kml"),c=this.createFolderXML(),d=0,e=a.length;d<e;++d)c.appendChild(this.createPlacemarkXML(a[d]));b.appendChild(c);return OL.Format.XML.prototype.write.apply(this,[b])},createFolderXML:function(){var a=this.createElementNS(this.kmlns,"Folder");if(this.foldersName){var b=this.createElementNS(this.kmlns,"name"),c=this.createTextNode(this.foldersName);b.appendChild(c);a.appendChild(b)}this.foldersDesc&&
        (b=this.createElementNS(this.kmlns,"description"),c=this.createTextNode(this.foldersDesc),b.appendChild(c),a.appendChild(b));return a},createPlacemarkXML:function(a){var b=this.createElementNS(this.kmlns,"name");b.appendChild(this.createTextNode(a.style&&a.style.label?a.style.label:a.attributes.name||a.id));var c=this.createElementNS(this.kmlns,"description");c.appendChild(this.createTextNode(a.attributes.description||this.placemarksDesc));var d=this.createElementNS(this.kmlns,"Placemark");null!=
        a.fid&&d.setAttribute("id",a.fid);d.appendChild(b);d.appendChild(c);b=this.buildGeometryNode(a.geometry);d.appendChild(b);a.attributes&&(a=this.buildExtendedData(a.attributes))&&d.appendChild(a);return d},buildGeometryNode:function(a){var b=a.CLASS_NAME,b=this.buildGeometry[b.substring(b.lastIndexOf(".")+1).toLowerCase()],c=null;b&&(c=b.apply(this,[a]));return c},buildGeometry:{point:function(a){var b=this.createElementNS(this.kmlns,"Point");b.appendChild(this.buildCoordinatesNode(a));return b},multipoint:function(a){return this.buildGeometry.collection.apply(this,
[a])},linestring:function(a){var b=this.createElementNS(this.kmlns,"LineString");b.appendChild(this.buildCoordinatesNode(a));return b},multilinestring:function(a){return this.buildGeometry.collection.apply(this,[a])},linearring:function(a){var b=this.createElementNS(this.kmlns,"LinearRing");b.appendChild(this.buildCoordinatesNode(a));return b},polygon:function(a){for(var b=this.createElementNS(this.kmlns,"Polygon"),a=a.components,c,d,e=0,f=a.length;e<f;++e)c=0==e?"outerBoundaryIs":"innerBoundaryIs",
        c=this.createElementNS(this.kmlns,c),d=this.buildGeometry.linearring.apply(this,[a[e]]),c.appendChild(d),b.appendChild(c);return b},multipolygon:function(a){return this.buildGeometry.collection.apply(this,[a])},collection:function(a){for(var b=this.createElementNS(this.kmlns,"MultiGeometry"),c,d=0,e=a.components.length;d<e;++d)(c=this.buildGeometryNode.apply(this,[a.components[d]]))&&b.appendChild(c);return b}},buildCoordinatesNode:function(a){var b=this.createElementNS(this.kmlns,"coordinates"),
        c;if(c=a.components){for(var d=c.length,e=Array(d),f=0;f<d;++f)a=c[f],e[f]=this.buildCoordinates(a);c=e.join(" ")}else c=this.buildCoordinates(a);c=this.createTextNode(c);b.appendChild(c);return b},buildCoordinates:function(a){this.internalProjection&&this.externalProjection&&(a=a.clone(),a.transform(this.internalProjection,this.externalProjection));return a.x+","+a.y},buildExtendedData:function(a){var b=this.createElementNS(this.kmlns,"ExtendedData"),c;for(c in a)if(a[c]&&"name"!=c&&"description"!=
c&&"styleUrl"!=c){var d=this.createElementNS(this.kmlns,"Data");d.setAttribute("name",c);var e=this.createElementNS(this.kmlns,"value");if("object"==typeof a[c]){if(a[c].value&&e.appendChild(this.createTextNode(a[c].value)),a[c].displayName){var f=this.createElementNS(this.kmlns,"displayName");f.appendChild(this.getXMLDoc().createCDATASection(a[c].displayName));d.appendChild(f)}}else e.appendChild(this.createTextNode(a[c]));d.appendChild(e);b.appendChild(d)}return this.isSimpleContent(b)?null:b},
                                                                      CLASS_NAME:"OpenLayers.Format.KML"});
		}
	}

    function Geometry(){
        //var geometry = WazeWrap.Geometry;

        //Converts to "normal" GPS coordinates
        this.ConvertTo4326 = function (long, lat){
            var projI=new OL.Projection("EPSG:900913");
            var projE=new OL.Projection("EPSG:4326");
            return (new OL.LonLat(long, lat)).transform(projI,projE);
        };

        this.ConvertTo900913 = function (long, lat){
            var projI=new OL.Projection("EPSG:900913");
            var projE=new OL.Projection("EPSG:4326");
            return (new OL.LonLat(long, lat)).transform(projE,projI);
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
         * @param {OL.Geometry} Geometry to check if any part of is in the current viewport
         */
        this.isLonLatInMapExtent = function (lonLat) {
            return lonLat && W.map.getExtent().containsLonLat(lonLat);
        };

        /**
		 * Checks if the given geometry is on screen
         * @function WazeWrap.Geometry.isGeometryInMapExtent
         * @param {OL.Geometry} Geometry to check if any part of is in the current viewport
         */
        this.isGeometryInMapExtent = function (geometry) {
            return geometry && geometry.getBounds &&
                W.map.getExtent().intersectsBounds(geometry.getBounds());
        };

        /**
		 * Calculates the distance between two given points, returned in meters
         * @function WazeWrap.Geometry.calculateDistance
         * @param {OL.Geometry.Point} An array of OL.Geometry.Point with which to measure the total distance. A minimum of 2 points is needed.
         */
        this.calculateDistance = function(pointArray) {
            if(pointArray.length < 2)
                return 0;

            var line = new OL.Geometry.LineString(pointArray);
            var length = line.getGeodesicLength(W.map.getProjectionObject());
            return length; //multiply by 3.28084 to convert to feet
        };

        this.findClosestSegment = function(mygeometry, ignorePLR, ignoreUnnamedPR){
            var onscreenSegments = WazeWrap.Model.getOnscreenSegments();
            var minDistance = Infinity;
            var closestSegment;

            for (var s in onscreenSegments) {
                if (!onscreenSegments.hasOwnProperty(s))
                    continue;

                let segmentType = onscreenSegments[s].attributes.roadType;
                if (segmentType === 10 || segmentType === 16 || segmentType === 18 || segmentType === 19) //10 ped boardwalk, 16 stairway, 18 railroad, 19 runway, 3 freeway
                    continue;

                if(ignorePLR && segmentType === 20) //PLR
                    continue;

                if(ignoreUnnamedPR)
                    if(segmentType === 17 && WazeWrap.Model.getStreetName(onscreenSegments[s].attributes.primaryStreetID) === null) //PR
                        continue;


                let distanceToSegment = mygeometry.distanceTo(onscreenSegments[s].geometry, {details: true});

                if (distanceToSegment.distance < minDistance) {
                    minDistance = distanceToSegment.distance;
                    closestSegment = onscreenSegments[s];
                    closestSegment.closestPoint = new OL.Geometry.Point(distanceToSegment.x1, distanceToSegment.y1);
                }
            }
            return closestSegment;
        };
    }

    function Model(){

        this.getPrimaryStreetID = function(segmentID){
            return W.model.segments.getObjectById(segmentID).attributes.primaryStreetID;
        };

        this.getStreetName = function(primaryStreetID){
            return W.model.streets.getObjectById(primaryStreetID).name;
        };

        this.getCityID = function(primaryStreetID){
            return W.model.streets.getObjectById(primaryStreetID).cityID;
        };

        this.getCityName = function(primaryStreetID){
            return W.model.cities.getObjectById(this.getCityID(primaryStreetID)).attributes.Name;
        };

        this.getStateName = function(primaryStreetID){
            return W.model.states.getObjectById(getStateID(primaryStreetID)).Name;
        };

        this.getStateID = function(primaryStreetID){
            return W.model.cities.getObjectById(primaryStreetID).attributes.stateID;
        };

        this.getCountryID = function(primaryStreetID){
            return W.model.cities.getObjectById(this.getCityID(primaryStreetID)).attributes.CountryID;
        };

        this.getCountryName = function(primaryStreetID){
            return W.model.countries.getObjectById(getCountryID(primaryStreetID)).name;
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

            return W.model.junctions.objects[segObj.model.attributes.junctionID].attributes.segIDs;
        };

        this.getAllRoundaboutJunctionNodesFromObj = function(segObj){
            var RASegs = this.getAllRoundaboutSegmentsFromObj(segObj);
            var RAJunctionNodes = [];
            for(i=0; i< RASegs.length; i++){
                RAJunctionNodes.push(W.model.nodes.objects[W.model.segments.getObjectById(RASegs[i]).attributes.toNodeID]);

            }
            return RAJunctionNodes;
        };

        this.isRoundaboutSegmentID = function(segmentID){
            if(W.model.segments.getObjectById(segmentID).attributes.junctionID === null)
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

            for (var s in segments) {
                if (!segments.hasOwnProperty(s))
                    continue;

                seg = W.model.segments.getObjectById(s);
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
             * @return {OL.LonLat} The LonLat object corresponding to the
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
                if (W.model.countries.getObjectById(235) || W.model.countries.getObjectById(40)) {
                    return '/RoutingManager/routingRequest';
                } else if (W.model.countries.getObjectById(106)) {
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
                    seg = W.model.segments.getObjectById(segIDs[i]);
                    if ('undefined' !== seg) {
                        segments.push(seg);
                    }
                }
                return WazeWrap.selectFeatures(segments);
            }
        };
    }

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
    }

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
                        t.on("mouseup.drag-" + this.uniqueID, $.proxy(this.mouseup, this)),
                        t.on("mousemove.drag-" + this.uniqueID, $.proxy(this.mousemove, this)),
                        t.on("touchmove.drag-" + this.uniqueID, $.proxy(this.touchmove, this)),
                        t.on("touchend.drag-" + this.uniqueID, $.proxy(this.touchend, this))
                },
                deactivate: function() {
                    return this.active = !1,
                        this.$el.off(".drag-" + this.uniqueID),
                        $(this.map.viewPortDiv).off(".drag-" + this.uniqueID),
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

        this.DivIcon = OL.Class({
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
            CLASS_NAME: "W.DivIcon"
        });
    }


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
		
		this.OrthogonalizeGeometry = function (geometry, threshold = 12) {
			var nomthreshold = threshold, // degrees within right or straight to alter
				lowerThreshold = Math.cos((90 - nomthreshold) * Math.PI / 180),
				upperThreshold = Math.cos(nomthreshold * Math.PI / 180);

			function Orthogonalize() {
				var nodes = geometry,
					points = nodes.slice(0, -1).map(function (n) {
						var p = n.clone().transform(new OL.Projection("EPSG:900913"), new OL.Projection("EPSG:4326"));
						p.y = lat2latp(p.y);
						return p;
					}),
					corner = {i: 0, dotp: 1},
					epsilon = 1e-4,
					i, j, score, motions;

				// Triangle
				if (nodes.length === 4) {
					for (i = 0; i < 1000; i++) {
						motions = points.map(calcMotion);

						var tmp = addPoints(points[corner.i], motions[corner.i]);
						points[corner.i].x = tmp.x;
						points[corner.i].y = tmp.y;

						score = corner.dotp;
						if (score < epsilon)
							break;
					}

					var n = points[corner.i];
					n.y = latp2lat(n.y);
					var pp = n.transform(new OL.Projection("EPSG:4326"), new OL.Projection("EPSG:900913"));

					var id = nodes[corner.i].id;
					for (i = 0; i < nodes.length; i++) {
						if (nodes[i].id != id)
							continue;

						nodes[i].x = pp.x;
						nodes[i].y = pp.y;
					}

					return nodes;
				} else {
					var best,
						originalPoints = nodes.slice(0, -1).map(function (n) {
							var p = n.clone().transform(new OL.Projection("EPSG:900913"), new OL.Projection("EPSG:4326"));
							p.y = lat2latp(p.y);
							return p;
						});
						score = Infinity;

					for (i = 0; i < 1000; i++) {
						motions = points.map(calcMotion);
						for (j = 0; j < motions.length; j++) {
							var tmp = addPoints(points[j], motions[j]);
							points[j].x = tmp.x;
							points[j].y = tmp.y;
						}
						var newScore = squareness(points);
						if (newScore < score) {
							best = [].concat(points);
							score = newScore;
						}
						if (score < epsilon)
							break;
					}

					points = best;

					for (i = 0; i < points.length; i++) {
						// only move the points that actually moved
						if (originalPoints[i].x !== points[i].x || originalPoints[i].y !== points[i].y) {
							var n = points[i];
							n.y = latp2lat(n.y);
							var pp = n.transform(new OL.Projection("EPSG:4326"), new OL.Projection("EPSG:900913"));

							var id = nodes[i].id;
							for (j = 0; j < nodes.length; j++) {
								if (nodes[j].id != id)
									continue;

								nodes[j].x = pp.x;
								nodes[j].y = pp.y;
							}
						}
					}

					// remove empty nodes on straight sections
					for (i = 0; i < points.length; i++) {
						var dotp = normalizedDotProduct(i, points);
						if (dotp < -1 + epsilon) {
							id = nodes[i].id;
							for (j = 0; j < nodes.length; j++) {
								if (nodes[j].id != id)
									continue;

								nodes[j] = false;
							}
						}
					}

					return nodes.filter(item => item !== false);
				}

				function calcMotion(b, i, array) {
					var a = array[(i - 1 + array.length) % array.length],
						c = array[(i + 1) % array.length],
						p = subtractPoints(a, b),
						q = subtractPoints(c, b),
						scale, dotp;

					scale = 2 * Math.min(euclideanDistance(p, {x: 0, y: 0}), euclideanDistance(q, {x: 0, y: 0}));
					p = normalizePoint(p, 1.0);
					q = normalizePoint(q, 1.0);

					dotp = filterDotProduct(p.x * q.x + p.y * q.y);

					// nasty hack to deal with almost-straight segments (angle is closer to 180 than to 90/270).
					if (array.length > 3) {
						if (dotp < -0.707106781186547)
							dotp += 1.0;
					} else if (dotp && Math.abs(dotp) < corner.dotp) {
						corner.i = i;
						corner.dotp = Math.abs(dotp);
					}

					return normalizePoint(addPoints(p, q), 0.1 * dotp * scale);
				}
			};
			
			function lat2latp(lat) {
				return 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * (Math.PI / 180) / 2));
			}

			function latp2lat(a) {
				return 180 / Math.PI * (2 * Math.atan(Math.exp(a * Math.PI / 180)) - Math.PI / 2);
			}

			function squareness(points) {
				return points.reduce(function (sum, val, i, array) {
					var dotp = normalizedDotProduct(i, array);

					dotp = filterDotProduct(dotp);
					return sum + 2.0 * Math.min(Math.abs(dotp - 1.0), Math.min(Math.abs(dotp), Math.abs(dotp + 1)));
				}, 0);
			}

			function normalizedDotProduct(i, points) {
				var a = points[(i - 1 + points.length) % points.length],
					b = points[i],
					c = points[(i + 1) % points.length],
					p = subtractPoints(a, b),
					q = subtractPoints(c, b);

				p = normalizePoint(p, 1.0);
				q = normalizePoint(q, 1.0);

				return p.x * q.x + p.y * q.y;
			}

			function subtractPoints(a, b) {
				return {x: a.x - b.x, y: a.y - b.y};
			}

			function addPoints(a, b) {
				return {x: a.x + b.x, y: a.y + b.y};
			}

			function euclideanDistance(a, b) {
				var x = a.x - b.x, y = a.y - b.y;
				return Math.sqrt((x * x) + (y * y));
			}

			function normalizePoint(point, scale) {
				var vector = {x: 0, y: 0};
				var length = Math.sqrt(point.x * point.x + point.y * point.y);
				if (length !== 0) {
					vector.x = point.x / length;
					vector.y = point.y / length;
				}

				vector.x *= scale;
				vector.y *= scale;

				return vector;
			}

			function filterDotProduct(dotp) {
				if (lowerThreshold > Math.abs(dotp) || Math.abs(dotp) > upperThreshold)
					return dotp;

				return 0;
			}

			this.isDisabled = function (nodes) {
				var points = nodes.slice(0, -1).map(function (n) {
					var p = n.toLonLat().transform(new OL.Projection("EPSG:900913"), new OL.Projection("EPSG:4326"));
					return {x: p.lat, y: p.lon};
				});

				return squareness(points);
			};
			
			return Orthogonalize();
		};
    }

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

        this.Shortcut = class Shortcut{
		constructor(name, desc, group, title, shortcut, callback, scope){
			if ('string' === typeof name && name.length > 0 && 'string' === typeof shortcut && 'function' === typeof callback) {
				this.name = name;
				this.desc = desc;
				this.group = group || this.defaults.group;
				this.title = title;
				this.callback = callback;
				this.shortcut = {};
				this.shortcut[shortcut] = name;
				if ('object' !== typeof scope) 
					this.scope = null;
				else 
					this.scope = scope;
				this.groupExists = false;
				this.actionExists = false;
				this.eventExists = false;
				this.defaults = {group: 'default'};

				return this;
			}
		}

		/**
		* Determines if the shortcut's action already exists.
		* @private
		*/
		doesGroupExist(){
			this.groupExists = 'undefined' !== typeof W.accelerators.Groups[this.group] &&
			undefined !== typeof W.accelerators.Groups[this.group].members;
			return this.groupExists;
		}

		/**
		* Determines if the shortcut's action already exists.
		* @private
		*/
		doesActionExist() {
			this.actionExists = 'undefined' !== typeof W.accelerators.Actions[this.name];
			return this.actionExists;
		}

		/**
		* Determines if the shortcut's event already exists.
		* @private
		*/
		doesEventExist() {
			this.eventExists = 'undefined' !== typeof W.accelerators.events.listeners[this.name] &&
			W.accelerators.events.listeners[this.name].length > 0 &&
			this.callback === W.accelerators.events.listeners[this.name][0].func &&
			this.scope === W.accelerators.events.listeners[this.name][0].obj;
			return this.eventExists;
		}

		/**
		* Creates the shortcut's group.
		* @private
		*/
		createGroup() {
			W.accelerators.Groups[this.group] = [];
			W.accelerators.Groups[this.group].members = [];

			if(this.title && !I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group]){
				I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group] = [];
				I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group].description = this.title;
				I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group].members = [];
			}
		}

		/**
		* Registers the shortcut's action.
		* @private
		*/
		addAction(){
			if(this.title)
				I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group].members[this.name] = this.desc;
			W.accelerators.addAction(this.name, { group: this.group });
		}

		/**
		* Registers the shortcut's event.
		* @private
		*/
		addEvent(){
			W.accelerators.events.register(this.name, this.scope, this.callback);
		}

		/**
		* Registers the shortcut's keyboard shortcut.
		* @private
		*/
		registerShortcut() {
			W.accelerators._registerShortcuts(this.shortcut);
		}

		/**
		* Adds the keyboard shortcut to the map.
		* @return {WazeWrap.Interface.Shortcut} The keyboard shortcut.
		*/
		add(){
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
		}

		/**
		* Removes the keyboard shortcut from the map.
		* @return {WazeWrap.Interface.Shortcut} The keyboard shortcut.
		*/
		remove() {
			if (this.doesEventExist()) {
				W.accelerators.events.unregister(this.name, this.scope, this.callback);
			}
			if (this.doesActionExist()) {
				delete W.accelerators.Actions[this.name];
			}
			//remove shortcut?
			return this;
		}

		/**
		* Changes the keyboard shortcut and applies changes to the map.
		* @return {WazeWrap.Interface.Shortcut} The keyboard shortcut.
		*/
		change (shortcut) {
			if (shortcut) {
				this.shortcut = {};
				this.shortcut[shortcut] = this.name;
				this.registerShortcut();
			}
			return this;
		}
	}

		this.Tab = class Tab{
			constructor(name, content, callback, context){
				this.TAB_SELECTOR = '#user-tabs ul.nav-tabs';
				this.CONTENT_SELECTOR = '#user-info div.tab-content';
				this.callback = null;
				this.$content = null;
				this.context = null;
				this.$tab = null;
				
				 let idName, i = 0;
				
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
					let that = this;
					if (W.prefs) {
						W.prefs.on('change:isImperial', function(){that.appendTab();});
					}
					W.app.modeController.model.bind('change:mode', function(){that.appendTab();});
						}
					}
			
			append(content){
				this.$content.append(content);
			}
			
			appendTab(){
				WazeWrap.Util.waitForElement(
					this.TAB_SELECTOR + ',' + this.CONTENT_SELECTOR,
					function () {
						$(this.TAB_SELECTOR).append(this.$tab);
						$(this.CONTENT_SELECTOR).first().append(this.$content);
						if (this.callback) {
							this.callback.call(this.context);
						}
					}, this);
			}
			
			clearContent(){
				this.$content.empty();
			}
			
			destroy(){
				this.$tab.remove();
				this.$content.remove();
			}
		}

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

                    W.app.modeController.model.bind('change:mode', function(model, modeId, context){ //make it reappear after changing modes
                        CreateParentGroup((sessionStorage[groupClass]=='true'));
                    });
                }

            var buildLayerItem = function(isChecked){
                var groupChildren = $("."+groupClass).parent().parent().find('.children').not('.extended');
                let $li = $('<li>');
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

                $('#' + groupClass).change(function(){$('#' + checkboxID).prop('disabled', !this.checked); callback(!this.checked ? false : sessionStorage[normalizedText]=='true');});
            };


            W.app.modeController.model.bind('change:mode', function(model, modeId, context){
                buildLayerItem((sessionStorage[normalizedText]=='true'));
            });

            buildLayerItem(checked);
        };
    }

    function String(){
        this.toTitleCase = function(str){
            return str.replace(/(?:^|\s)\w/g, function(match) {
                return match.toUpperCase();
            });
        };
    }
}.call(this));
