"use strict";

var h = (function helpers(){
  return {
    forEach: forEach
  }
  function forEach(list, doWhat){
    var i = 0, l = list.length;
    for(i = 0; i < l; i++){
      if(doWhat(list[i]) === "break") break;
    }
  }
}());

(function(){
  angular
  .module("tagrid", [])
  .controller("mainController", [
    "$http",
    "$location",
    MainController
  ]);

  function MainController($http, $location){
    var vm = this;
    var tagsKeyValue = {};
    vm.status = "Load Repos";
    vm.name = $location.search().name;
    vm.repos = [];
    vm.tags = [];
    vm.startAPIQuery = startAPIQuery;

    vm.tagSort = "name";
    vm.tagSortReverse = false;

    vm.filterOn = function(tag){
      $location.search("tag", (tag ? tag : null));
    };
    vm.filterer = function(repo){
      var filter = $location.$$search.tag;
      if(!filter || !tagsKeyValue[filter]) return true;
      else return (repo.tags && repo.tags.indexOf(filter) > -1);
    }

    vm.repoSort = "name";
    vm.repoSortReverse = false;
    vm.repoSortBy = function(byWhat){
      vm.repoSortReverse = !(vm.repoSortReverse);
      vm.repoSort = byWhat;
    }

    function startAPIQuery(){
      vm.repos = [];
      vm.tags = [];
      vm.status = "Loading...";
      $location.search("name", vm.name);
      $location.search("type", vm.type);
      $http.jsonp("https://api.github.com/users/" + vm.name + "/repos", {
        params: {
          per_page: 100,
          access_token: "03b86161b45561bc7448eebac1c2a4491ebbf941",
          callback: "JSON_CALLBACK"
        }
      }).then(verifyAPIResponse);
    }

    function verifyAPIResponse(response){
      var rateLimit = response.data.meta["X-RateLimit-Remaining"];
      console.log("Rate limit: " + rateLimit);
      if(response.data.meta.status !== 200) vm.status = "404. Spell it right?"
      else if(rateLimit < 1) vm.status = "At rate limit. :("
      else loadNextPage(response.data);
    }

    function loadNextPage(response){
      var allPagesLoaded = true;
      if(response.meta.Link){
        h.forEach(response.meta.Link, function(link){
          if(link[1].rel === "next"){
            allPagesLoaded = false;
            $http.jsonp(link[0], {
              params: { callback: "JSON_CALLBACK" }
            }).then(verifyAPIResponse);
            return "break";
          }
        });
      }
      parseResponse(response);
      if(allPagesLoaded) whenAllPagesLoaded();
    }

    function whenAllPagesLoaded(){
      vm.status = "Reload Repos";
    }

    function parseResponse(response){
      h.forEach(response.data, parseTags);
      vm.repos = vm.repos.concat(response.data);
      vm.repos.sort(function(a, b){
        return (a.name > b.name) ? 1 : -1;
      });
      vm.tags = (function makeTagsIntoArray(){
        var tag, output = [];
        for(tag in tagsKeyValue){
          output.push({name: tag, count: tagsKeyValue[tag]});
        }
        return output;
      }());
    }

    function parseTags(repo){
      var tagMatcher = /\[[^\]]*\]/;
      if(repo.description && (repo.tags = repo.description.match(tagMatcher))){
        repo.tags = repo.tags[0].toLowerCase().replace(/[\[\]]/g, "");
        repo.tags = (repo.tags.trim() === "") ? [] : repo.tags.split(/, */);
        repo.tags.sort();
        repo.description_sans_tags = repo.description.replace(tagMatcher, "").trim();
        h.forEach(repo.tags, function(tag){
          if(!tagsKeyValue[tag]) tagsKeyValue[tag] = 0;
          tagsKeyValue[tag] += 1;
        });
      }
    }

  }

}());
