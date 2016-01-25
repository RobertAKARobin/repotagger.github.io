"use strict";

(function(){
  var AJAX = {};

  angular
  .module("Github", [ "AJAX" ])
  .factory("Github", GithubFactory);

  GithubFactory.$inject = [ "AJAX" ];

  function GithubFactory($AJAX){
    AJAX = $AJAX;
    return Github;
  }

  function Github(name, access_token, whenComplete){
    var request = this;
    var tagsWithCounts = {};
    var data = {};

    (function loadRepos(){
      data.repos = [];
      data.tags = [];
      data.untagged = 0;
      request.whenComplete = whenComplete;
      queryAPI("https://api.github.com/users/" + name + "/repos", {
        params: { per_page: 100, access_token: access_token }
      });
    }());

    function queryAPI(url, options){
      AJAX("GET", url, options, checkForErrors);
    }

    function checkForErrors(response, headers, httpObject){
      if([200, 304].indexOf(httpObject.status) < 0){
        request.whenComplete({error: httpObject.status, body: response});
      }else{
        data.repos = data.repos.concat(response);
        checkIfMorePages(headers);
      }
    }

    function checkIfMorePages(headers){
      var links = {};
      if(headers.Link){
        headers.Link.split(",").forEach(function(line){
          var pair = line.split(";");
          var rel = pair[1].replace(/rel="(.*)"/, "$1").trim();
          links[rel] = pair[0].replace(/<(.*)>/, "$1").trim();
        });
      }
      if(links.next) queryAPI(links.next, {});
      else parseData();
    }

    function parseData(){
      data.repos.forEach(parseTags);
      Object.keys(tagsWithCounts).forEach(function(tag){
        data.tags.push({name: tag, count: tagsWithCounts[tag]});
      });
      request.whenComplete(data);
    }

    function parseTags(repo){
      var tagMatcher = /\[[^\]]+\]/;
      repo.description_sans_tags = (repo.description || "").replace(tagMatcher, "").trim();
      if(repo.description && (tagMatcher.test(repo.description))){
        repo.tags = repo.description.match(tagMatcher)[0].toLowerCase().replace(/[\[\]]/g, "");
        repo.tags = (repo.tags.trim() === "") ? [] : repo.tags.split(/, */);
        repo.tags.forEach(function(tag){
          tagsWithCounts[tag] = (tagsWithCounts[tag] || 0) + 1;
        });
      }else data.untagged += 1;
    }
  }
}());
