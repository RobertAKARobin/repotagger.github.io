"use strict";

(function(){
  angular
  .module("GH_API", [])
  .factory("GH_API", GH_APIFactory);

  function GH_APIFactory(){
    return GH_API;
  }

  function GH_API(url, callback, options){
    var http = {};
    var response = [];
    var headers = {};

    (function setParams(){
      if(!options.params) options.params = {};
      if(!options.params.per_page) options.params.per_page = 100;
    }());

    (function setURL(){
      url = "https://api.github.com/" + url;
      if(Object.keys(options.params).length > 0) url += "?" + queryString(options.params);
    }());

    send(url);

    function send(url){
      var ETag = localStorage.getItem(url);
      http = new XMLHttpRequest();
      http.open((options.method || "get"), url);
      if(!options.headers) options.headers = {};
      if(localStorage && ETag) options.headers["If-None-Match"] = '"' + ETag + '"';
      Object.keys(options.headers).forEach(function(header){
        http.setRequestHeader(header, options.headers[header]);
      });
      http.onreadystatechange = function(){
        var nextPage;
        if(http.readyState === 4){
          if([200, 304].indexOf(http.status) < 0){
            callback({error: http.status, body: http.response});
          }else{
            parseHeaders();
            parseResponse();
            if(http.status === 200 && headers["X-RateLimit-Remaining"]){
              console.log("Rate limit remaining: " + headers["X-RateLimit-Remaining"]);
            }
            if(headers.links.next) send(headers.links.next);
            else callback(response);
          }
        }
      }
      console.log(url);
      http.send();
    }

    function parseHeaders(){
      headers = {links: {}};
      http.getAllResponseHeaders().split(/\n/).forEach(function(line){
        var split = -1, key = "", val = "";
        if((split = line.indexOf(":")) < 0) return;
        key = line.substring(0, split).trim();
        val = line.substring(split + 1).trim();
        headers[key] = val;
      });
      if(headers.Link){
        headers.Link.split(",").forEach(function(line){
          var pair = line.split(";");
          var rel = pair[1].replace(/rel="(.*)"/, "$1").trim();
          headers.links[rel] = pair[0].replace(/<(.*)>/, "$1").trim();
        });
      }
    }

    function parseResponse(){
      var thisPageResponse = http.response;
      var ETag = (headers.ETag || headers.Etag || headers.etag || "").replace(/[^a-z0-9]/g, "");
      if(window.localStorage && ETag){
        if(http.status === 304){
          console.log("Retreving from cache...");
          thisPageResponse = localStorage.getItem(ETag);
          headers = JSON.parse(localStorage.getItem(ETag + "-header"));
        }else{
          try{
            localStorage.setItem(http.responseURL, ETag);
            localStorage.setItem(ETag, thisPageResponse);
            localStorage.setItem(ETag + "-header", JSON.stringify(headers));
          }catch(e){
            console.log("LocalStorage maxed out; clearing...");
            localStorage.clear();
          }
        }
      }
      response = response.concat(JSON.parse(thisPageResponse));
    }

    function queryString(hash){
      var key, pairs = [], output = "";
      for(key in hash) pairs.push([key, hash[key]].join("="));
      return pairs.join("&");
    }
  }

}());
