// ==UserScript==
// @name         ZTE-Web-Script
// @version      0.1
// @description  Automatically loading ZTE-Web-Script
// @match        https://192.168.0.1/*
// @match        https://192.168.1.1/*
// @match        https://192.168.2.1/*
// @match        http://192.168.0.1/*
// @match        http://192.168.1.1/*
// @match        http://192.168.2.1/*
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    function handleResponse(responseText, onload) {
        var script = document.createElement('script');
        script.textContent = responseText;
        document.head.appendChild(script);
        if (onload) onload();
    }

    function loadScript(url, onload, onerror) {
        if (typeof GM_xmlhttpRequest !== "undefined") {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    handleResponse(response.responseText, onload);
                },
                onerror: onerror
            });
        } else {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        handleResponse(xhr.responseText, onload);
                    } else {
                        if (onerror) onerror();
                    }
                }
            };
            xhr.onerror = onerror;
            xhr.send();
        }
    }

    loadScript("https://cdn.jsdelivr.net/gh/tpoechtrager/ZTE-Web-Script/zte.js", function() {
        console.log("ZTE-Web-Script loaded and executed.");
    }, function() {
        alert("Failed to load the ZTE-Web-Script");
    });

})();
