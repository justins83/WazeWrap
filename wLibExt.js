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
            W.model.states.get(getStateID(primaryStreetID)).Name;   
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
            return getCityName(segObj.attributes.primaryStreetID);
        };

        model.getStateNameFromSegmentObj = function(segObj){
            return getStateName(segObj.attributes.primaryStreetID);
        };

        model.getAllRoundaboutSegmentsFromObj = function(segObj){
            var originalSegID = segObj.model.attributes.id;
            var RASegments = new Array;

            
        };

        model.isRoundaboutSegment = function(segmentID){
            if(W.model.segments.get(segmentID).attributes.junctionID === null)
                return false;
            else
                return true;
        };

    };

})();
