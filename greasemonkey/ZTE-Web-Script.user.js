// ==UserScript==
// @name         ZTE-Web-Script
// @version      0.1
// @description  Automatically loading ZTE-Web-Script 
// @include      http://192.168.1.1/*
// @include      http://192.168.2.1/*
// ==/UserScript==
//--- The @grant directive is used to restore the proper sandbox.

var ztes = document.createElement("script");
ztes.type = "text/javascript";
ztes.src = "https://cdn.jsdelivr.net/gh/tpoechtrager/ZTE-Web-Script/zte.js";
$("head").append(ztes);