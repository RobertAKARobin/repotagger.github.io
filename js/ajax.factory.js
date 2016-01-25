"use strict";

(function(){
  angular
  .module("AJAX", [])
  .factory("AJAX", AJAXFactory);

  function AJAXFactory(){
    return function AJAX(method, url, options, callback){
      var http = new XMLHttpRequest(), ETag;
      if(options.params) url += "?" + queryString(options.params);
      console.log(url);
      http.open((method || "get"), url);
      if(options.headers) Object.keys(options.headers).forEach(function(header){
        http.setRequestHeader(header, options.headers[header]);
      });
      if(localStorage && (ETag = localStorage.getItem(url))){
        http.setRequestHeader("If-None-Match", '"' + ETag + '"');
      }
      http.onreadystatechange = function(){
        if(http.readyState === 4){
          parseResponse(http, callback);
        }
      }
      http.send();
    }

    function parseResponse(http, callback){
      var response = http.response;
      var headers = parseHeaders(http);
      var ETag = (headers.ETag || headers.Etag || headers.etag).replace(/[^a-z0-9]/g, "");
      if(localStorage){
        if(http.status === 304){
          console.log("Retrieving from cache...");
          response = localStorage.getItem(ETag);
          headers = JSON.parse(localStorage.getItem(ETag + "-header"));
        }else{
          localStorage.setItem(http.responseURL, ETag);
          localStorage.setItem(ETag, response);
          localStorage.setItem(ETag + "-header", JSON.stringify(headers));
        }
      }
      callback(JSON.parse(response), headers, http);
    }

    function parseHeaders(http){
      var output = {}, headerString = http.getAllResponseHeaders();
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
