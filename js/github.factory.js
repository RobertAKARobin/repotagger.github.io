"use strict";

(function(){
  angular
  .module("Github", [
    "AJAX"
  ])
  .factory("Github", GithubFactory);

  GithubFactory.$inject = [
    "AJAX"
  ];

  function GithubFactory(AJAX){
    return Github;

    function Github(name, access_token, whenComplete){
      var request = this;
      var tagsWithCounts = {};
      var data = {};

      (function initialize(){
        data.repos = [];
        data.tags = [];
        data.untagged = 0;
        request.whenComplete = whenComplete;
        AJAX("GET", "https://api.github.com/users/" + name + "/repos", {
          params: {
            per_page: 100,
            access_token: access_token
          }
        }, verifyAPIResponse);
      }());

      function verifyAPIResponse(response, headers, httpObject){
        var links = parseLinks(headers.Link);
        console.log("Rate limit: " + headers["X-RateLimit-Remaining"])
        if([200, 304].indexOf(httpObject.status) < 0){
          request.whenComplete({error: httpObject.status, body: response});
        }else{
          data.repos = data.repos.concat(response);
          if(links.next) AJAX("GET", links.next, {}, verifyAPIResponse);
          else collectAllData();
        }
      }

      function collectAllData(){
        data.repos.forEach(parseTags);
        data.tags = (function countTags(){
          var out = [];
          Object.keys(tagsWithCounts).forEach(function(tag){
            out.push({name: tag, count: tagsWithCounts[tag]});
          });
          return out;
        }());
        request.whenComplete(data);
      }

      function parseLinks(linkString){
        var links = {};
        if(!linkString) return true;
        linkString.split(",").forEach(function(line){
          var pair = line.split(";");
          var rel = pair[1].replace(/rel="(.*)"/, "$1").trim();
          var url = pair[0].replace(/<(.*)>/, "$1").trim();
          links[rel] = url;
        });
        return links;
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

  }

}());
