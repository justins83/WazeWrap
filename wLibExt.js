// ==UserScript==
// @name         wLibExt
// @namespace    
// @version      0.1
// @description  A library to wrap the Waze API
// @author       JustinS83/MapOMatic
// @include      https://beta.waze.com/*editor/*
// @include      https://www.waze.com/*editor/*
// @exclude      https://www.waze.com/*user/editor/*
// @require      https://greasyfork.org/scripts/9794-wlib/code/wLib.js?version=106259
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

function bootstrap(tries) {
        tries = tries || 1;
        if (window.wLib) {
            init();
        } else if (tries < 1000) {
            setTimeout(function () { bootstrap(tries++); }, 200);
        } else {
            console.log('wLibExt failed to load');
        }
    }

    bootstrap();

    function init(){
        console.log('wLibExt Loaded');
        extendModel();
        extendGeometry();
    };

    function extendGeometry(){
        var geometry = wLib.Geometry;

        //Converts to "normal" GPS coordinates
        geometry.ConvertTo4326 = function (long, lat){
            var projI=new OpenLayers.Projection("EPSG:900913");
            var projE=new OpenLayers.Projection("EPSG:4326");
            return (new OpenLayers.LonLat(long, lat)).transform(projI,projE);
        };
    
        geometry.ConvertTo900913 = function (long, lat){
            var projI=new OpenLayers.Projection("EPSG:900913");
            var projE=new OpenLayers.Projection("EPSG:4326");
            return (new OpenLayers.LonLat(long, lat)).transform(projE,projI);
        };

        //Converts the Longitudinal offset to an offset in 4326 gps coordinates
        geometry.CalculateLongOffsetGPS = function(longMetersOffset, long, lat)
        {
            var R= 6378137; //Earth's radius
            var dLon = longMetersOffset / (R * Math.cos(Math.PI * lat / 180)); //offset in radians
            var lon0 = dLon * (180 / Math.PI); //offset degrees

            return lon0;
        };

        //Converts the Latitudinal offset to an offset in 4326 gps coordinates
        geometry.CalculateLatOffsetGPS = function(latMetersOffset, lat)
        {
            var R= 6378137; //Earth's radius
            var dLat = latMetersOffset/R;
            var lat0 = dLat * (180  /Math.PI); //offset degrees

            return lat0;
        };
    };

    function extendModel(){
        var model = wLib.Model;

        model.getPrimaryStreetID = function(segmentID){
            return W.model.segments.get(segmentID).attributes.primaryStreetID;
        };

        model.getStreetName = function(primaryStreetID){
            return W.model.streets.get(PrimaryStreetID).name;
        };

        model.getCityID = function(primaryStreetID){
            return W.model.streets.get(primaryStreetID).cityID;
        };

        model.getCityName = function(primaryStreetID){
            return W.model.cities.get(model.getCityID(primaryStreetID)).attributes.Name;
        };

        model.getStateName = function(primaryStreetID){
            return W.model.states.get(getStateID(primaryStreetID)).Name;   
        };

        model.getStateID = function(primaryStreetID){
            return W.model.cities.get(primaryStreetID).attributes.stateID;
        };

        model.getCountryID = function(primaryStreetID){
            return W.model.cities.get(model.getCityID(primaryStreetID)).attributes.CountryID;
        };

        model.getCountryName = function(primaryStreetID){
            return W.model.countries.get(getCountryID(primaryStreetID)).name;
        };

        model.getCityNameFromSegmentObj = function(segObj){
            return model.getCityName(segObj.attributes.primaryStreetID);
        };

        model.getStateNameFromSegmentObj = function(segObj){
            return model.getStateName(segObj.attributes.primaryStreetID);
        };

        //returns an array of segmentIDs for all segments that are part of the same roundabout as the passed segment
        model.getAllRoundaboutSegmentsFromObj = function(segObj){
            if(segObj.model.attributes.junctionID === null)
                return null;

            return W.model.junctions.objects[segObj.model.attributes.junctionID].segIDs;
        };

        model.getAllRoundaboutJunctionNodesFromObj = function(segObj){
            var RASegs = model.getAllRoundaboutSegmentsFromObj(segObj);
            var RAJunctionNodes = [];
            for(i=0; i< RASegs.length; i++){
                RAJunctionNodes.push(W.model.nodes.objects[W.model.segments.get(RASegs[i]).attributes.toNodeID]);

            }
            return RAJunctionNodes;
        };

        model.isRoundaboutSegmentID = function(segmentID){
            if(W.model.segments.get(segmentID).attributes.junctionID === null)
                return false;
            else
                return true;
        };

        model.isRoundaboutSegmentObj = function(segObj){
            if(segObj.model.attributes.junctionID === null)
                return false;
            else
                return true;
        };

    };

})();
