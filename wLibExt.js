// ==UserScript==
// @name         wLibExt
// @namespace    
// @version      0.1
// @description  A library to wrap the Waze API
// @author       JustinS83/MapOMatic
// @include      https://beta.waze.com/*editor/*
// @include      https://www.waze.com/*editor/*
// @exclude      https://www.waze.com/*user/editor/*
// @require      
// @grant        none
// ==/UserScript==

/* global W */

(function() {
    'use strict';

    function bootstrap() {
        
    }

    function init(){

        var Model = new Model;

    };

    function Model(){

        this.getPrimaryStreetID = function(segmentID){
                return W.model.segments.get(segmentID).attributes.primaryStreetID;
                };

        this.getCityID = function(primaryStreetID){
            return W.model.streets.get(primaryStreetID).cityID;
        };

        this.getCityName = function(primaryStreetID){
            return W.model.cities.get(getCityID(primaryStreetID)).attributes.Name;
        };

        this.getStateName = function(primaryStreetID){
            W.model.states.get(getStateID(primaryStreetID)).Name;   
        };

        this.getStateID = function(primaryStreetID){
            return W.model.cities.get(primaryStreetID).attributes.stateID;
        };

        this.getCountryID = function(primaryStreetID){
            return W.model.cities.get(getCityID(primaryStreetID)).attributes.CountryID;
        };

        this.getCountryName = function(primaryStreetID){
            return W.model.countries.get(getCountryID(primaryStreetID)).name;
        };

    };



})();
