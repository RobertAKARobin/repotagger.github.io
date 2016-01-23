"use strict";

var h = (function helpers(){
  return {
    forEach: forEach,
    jsonp: jsonp,
    getQueryStringParameters: getQueryStringParameters
  }
  function jsonp(url){
    console.log(url);
    if(jsonp.element) document.head.removeChild(jsonp.element);
    jsonp.element = document.createElement("SCRIPT");
    jsonp.element.src = url;
    document.head.appendChild(jsonp.element);
  }
  function getQueryStringParameters(){
    var queryString = location.search.replace(/^\?/,"");
    var parameters = {};
    if(queryString.trim()){
      h.forEach(queryString.split(/&/g), function(pair){
        pair = pair.split(/=/);
        parameters[pair[0]] = (pair[1] || null);
      });
    }
    return parameters;
  }
  function forEach(list, doWhat){
    var i = 0, l = list.length;
    for(i = 0; i < l; i++){
      if(doWhat(list[i]) === "break") break;
    }
  }
}());

var app = (function App(){
  var baseURL = "https://api.github.com/";
  return {
    repos: [],
    tags: {},
    rateLimit: 0,
    startAPIQuery: startAPIQuery,
    verifyAPIresponse: verifyAPIresponse
  }

  function startAPIQuery(parameters){
    var type = (/^org/.test(parameters.type)) ? "orgs" : "users";
    h.jsonp(baseURL + type + "/" + parameters.name + "/repos?" + [
      "per_page=100",
      "callback=app.verifyAPIresponse",
      "access_token=03b86161b45561bc7448eebac1c2a4491ebbf941"
    ].join("&"));
  }

  function verifyAPIresponse(response){
    app.rateLimit = response.meta["X-RateLimit-Remaining"];
    if(app.rateLimit < 1) console.log("No more requests allowed.");
    else loadRemainingRepos(response);
  }

  function loadRemainingRepos(response){
    var shouldLoadNextPage = false;
    app.repos = app.repos.concat(response.data);
    h.forEach(response.meta.Link, function(link){
      if(link[1].rel === "next"){
        shouldLoadNextPage = true;
        h.jsonp(link[0]);
        return "break";
      }
    });
    if(!shouldLoadNextPage) processRepos();
  }

  function processRepos(){
    h.forEach(app.repos, function(repo){
      if(repo.description) parseTags(repo);
    });
  }

  function parseTags(repo){
    var tagMatcher = /\[[^\]]*\]/;
    repo.tags = repo.description.match(tagMatcher)[0].toLowerCase().replace(/[\[\]]/g, "");
    repo.tags = (repo.tags.trim() === "") ? [] : repo.tags.split(/, */);
    repo.description = repo.description.replace(tagMatcher, "");
    h.forEach(repo.tags, function(tag){
      if(!app.tags[tag]) app.tags[tag] = 0;
      app.tags[tag] += 1;
    });
  }

}());

window.onload = function(){

  (function shouldMakeAPIQuery(){
    var parameters = h.getQueryStringParameters();
    if(!parameters.name) console.log("Bugger");
    else app.startAPIQuery(parameters);
  }());

  eachDirective("data-repeat", function(element, attribute){
    attribute = attribute.split(/ *in */i);
    
  });

  function eachDirective(attrName, callback){
    var elements = document.querySelectorAll("[" + attrName + "]");
    h.forEach(elements, function(element){
      callback(element, element.getAttribute(attrName));
    });
  }

}
