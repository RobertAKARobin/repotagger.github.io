"use strict";

(function(){
  angular
  .module("AJAX", [])
  .factory("AJAX", AJAXFactory);

  function AJAXFactory(){
    return function AJAX(method, url, options, callback){
      var http = new XMLHttpRequest();
      if(options.params) url += "?" + queryString(options.params);
      console.log(url);
      http.open((method || "get"), url);
      if(options.headers) Object.keys(options.headers).forEach(function(header){
        http.setRequestHeader(header, options.headers[header]);
      });
      http.onreadystatechange = function(){
        if(http.readyState === 4){
          callback(JSON.parse(http.response), parseHeaders(http), http);
        }
      }
      http.send();
    }
    function queryString(hash){
      var key, pairs = [], output = "";
      for(key in hash) pairs.push([key, hash[key]].join("="));
      return pairs.join("&");
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
  }

}());
