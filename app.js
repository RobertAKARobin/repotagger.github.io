"use strict";

(function(){
  angular
  .module("repotagger", [ ])
  .config(["$locationProvider", AppConfig])
  .factory("APIQuery", APIQuery)
  .controller("MainController", MainController);

  function AppConfig($locationProvider){
    $locationProvider.html5Mode(true);
  }

  APIQuery.$inject = [ "$http" ];
  function APIQuery($http){
    var q;
    var pvt = {};
    return function(name){
      q = this;
      q.name = name;
      pvt.tagCounts = {};
      q.status = 100;
      q.page = 0;
      q.last = null;
      q.repos = [];
      q.tags = [];
      q.untagged = 0;
      q.page = 0;
      send("https://api.github.com/users/" + q.name + "/repos", {
        params:{ per_page: "100", access_token: "03b86161b45561bc7448eebac1c2a4491ebbf941"}
      });
    }
    function send(url, options){
      q.page += 1;
      if(!options) options = {};
      if(!options.headers) options.headers = {};
      pvt.etag = localStorage.getItem(q.name + "," + q.page);
      options.headers["If-None-Match"] = '"' + pvt.etag + '"';
      $http.get(url, options).error(cached).then(parsed);
    }
    function cached(a,status,b,options){
      if(status === 304){
        console.log("Retrieving from cache...");
        handle(JSON.parse(localStorage.getItem(pvt.etag)), JSON.parse(localStorage.getItem(pvt.etag + "-header")));
      }else q.status = status;
    }
    function parsed(response){
      var headers = response.headers();
      var ETag = (headers.ETag || headers.Etag || headers.etag || "").replace(/[^a-z0-9]/g, "");
      console.log("Rate limit remaining: " + headers["x-ratelimit-remaining"]);
      try{
        localStorage.setItem(q.name + "," + q.page, ETag);
        localStorage.setItem(ETag, JSON.stringify(response.data));
        localStorage.setItem(ETag + "-header", JSON.stringify(headers));
      }catch(e){
        console.log("Local storage maxed out! Clearing...");
        localStorage.clear();
      }
      handle(response.data, headers);
    }

    function handle(data, headers){
      var links = {}, string = (headers.link || headers.Link);
      if(string) string.split(",").forEach(function(line){
        var pair = line.split(";");
        var rel = pair[1].replace(/rel="(.*)"/, "$1").trim();
        links[rel] = pair[0].replace(/<(.*)>/, "$1").trim();
      });
      if(links.last) q.last = "/" + links.last.substring(links.last.length - 1);
      if(links.next) send(links.next);
      else q.status = 200;
      data.forEach(function(repo){
        var tagMatcher = /\[[^\]]+\]/;
        repo.description_sans_tags = (repo.description || "").replace(tagMatcher, "").trim();
        if(repo.description && (tagMatcher.test(repo.description))){
          repo.tags = repo.description.match(tagMatcher)[0].toLowerCase().replace(/[\[\]]/g, "").trim();
          repo.tags = (repo.tags === "") ? [] : repo.tags.split(/, */);
          repo.tags.forEach(function(tag){
            pvt.tagCounts[tag] = (pvt.tagCounts[tag] || 0) + 1;
          });
        }else q.untagged += 1;
      });
      q.tags = [];
      Object.keys(pvt.tagCounts).forEach(function(tag){
        q.tags.push({name: tag, count: pvt.tagCounts[tag]});
      });
      q.repos = q.repos.concat(data);
    }
  }

  MainController.$inject = [ "$location", "APIQuery" ];
  function MainController($location, APIQuery){
    var vm = this;
    vm.status = 0;
    vm.name = $location.search().name;
    vm.tagSort = "name";
    vm.tagSortAscend = true;
    vm.repoSort = "name";
    vm.repoSortAscend = false;

    vm.startAPIQuery = function(){
      $location.search("name", vm.name.toLowerCase());
      vm.data = new APIQuery(vm.name);
    };
    vm.submitForm = function($event){
      if($event.keyCode == 13) vm.startAPIQuery();
    }
    vm.shouldFlash = function(){
      return (vm.name.toLowerCase() === "repotagger" ? "flash" : null);
    }
    vm.filterOn = function(tag){
      $location.search("tag", (tag ? tag : null));
    };
    vm.filterer = function(repo){
      var filter = $location.search().tag;
      if(repo.tags && repo.tags.indexOf(filter) > -1) return true;
      else if(filter === "tagged" && repo.tags && repo.tags.length > 0) return true;
      else if(filter === "untagged" && (!repo.tags || repo.tags.length < 1)) return true;
      else if(!filter || filter === "all") return true;
      else return false;
    }
    vm.repoSortBy = function(what){
      vm.repoSortAscend = !(vm.repoSortAscend);
      vm.repoSort = what;
    }
    vm.init = function(){
      if(!vm.name) vm.name = "repotagger";
      vm.startAPIQuery();
    }
  }
}());
