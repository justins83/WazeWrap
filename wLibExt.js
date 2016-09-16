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

/* global W,wLib */

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
    }

    function extendModel(){
        var model = wLib.Model;
        model.getPrimaryStreetID = function(segmentID){
            return W.model.segments.get(segmentID).attributes.primaryStreetID;
        };
        model.getCityID = function(primaryStreetID){
            return W.model.streets.get(primaryStreetID).cityID;
        };
        model.getCityName = function(primaryStreetID){
            return W.model.cities.get(getCityID(primaryStreetID)).attributes.Name;
        };
        model.getStateName = function(primaryStreetID){
            return W.model.states.get(getStateID(primaryStreetID)).Name;
        };
        model.getStateID = function(primaryStreetID){
            return W.model.cities.get(primaryStreetID).attributes.stateID;
        };
        model.getCountryID = function(primaryStreetID){
            return W.model.cities.get(getCityID(primaryStreetID)).attributes.CountryID;
        };
        model.getCountryName = function(primaryStreetID){
            return W.model.countries.get(getCountryID(primaryStreetID)).name;
        };
    }

})();
