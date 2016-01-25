"use strict";

(function(){
  angular
  .module("AJAX", [])
  .factory("AJAX", AJAXFactory);

  function AJAXFactory(){
    return AJAX;
  }

  function AJAX(method, url, options, callback){
    var request = {};
    if(options.params) url += "?" + queryString(options.params);
    if(!options.headers) options.headers = {};

    (function hasETag(){
      var ETag = localStorage.getItem(url);
      if(localStorage && ETag) options.headers["If-None-Match"] = '"' + ETag + '"';
    }());

    (function send(){
      var http = request.http = new XMLHttpRequest();
      http.open((method || "get"), url);
      if(options.headers) Object.keys(options.headers).forEach(function(header){
        http.setRequestHeader(header, options.headers[header]);
      });
      http.onreadystatechange = function(){
        if(http.readyState === 4) parseResponse();
      }
      http.send();
    }());

    function parseResponse(){
      var response = request.http.response;
      var headers = parseHeaders();
      var ETag = (headers.ETag || headers.Etag || headers.etag || "").replace(/[^a-z0-9]/g, "");
      var rateLimit = headers["X-RateLimit-Remaining"];
      if(localStorage && ETag){
        if(request.http.status === 304){
          response = localStorage.getItem(ETag);
          headers = JSON.parse(localStorage.getItem(ETag + "-header"));
        }else{
          try{
            localStorage.setItem(request.http.responseURL, ETag);
            localStorage.setItem(ETag, response);
            localStorage.setItem(ETag + "-header", JSON.stringify(headers));
          }catch(e){
            console.log("LocalStorage maxed out; clearing...");
            localStorage.clear();
          }
        }
      }
      if(rateLimit) console.log("Rate limit remaining: " + rateLimit);
      callback(JSON.parse(response), headers, request.http);
    }

    function parseHeaders(){
      var output = {}, headerString = request.http.getAllResponseHeaders();
      headerString.split(/\n/).forEach(function(line){
        var split = -1, key = "", val = "";
        if((split = line.indexOf(":")) < 0) return;
        key = line.substring(0, split).trim();
        val = line.substring(split + 1).trim();
        output[key] = val;
      });
      return output;
    }

    function queryString(hash){
      var key, pairs = [], output = "";
      for(key in hash) pairs.push([key, hash[key]].join("="));
      return pairs.join("&");
    }
  }

}());
