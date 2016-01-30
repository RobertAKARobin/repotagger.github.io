"use strict";

(function(){
  angular
  .module("repotagger", [ ])
  .config(["$locationProvider", AppConfig])
  .controller("MainController", MainController);

  function AppConfig($locationProvider){
    $locationProvider.html5Mode(true);
  }

  MainController.$inject = [ "$http", "$location", "$scope" ];

  function MainController($http, $location, $scope){
    var vm = this;
    vm.status = 0;
    vm.name = $location.search().name;
    vm.tagSort = "name";
    vm.tagSortAscend = true;
    vm.repoSort = "name";
    vm.repoSortAscend = false;
    vm.startAPIQuery = startAPIQuery;

    (function onLoad(){
      if(!vm.name) vm.name = "repotagger";
      startAPIQuery();
    }());

    vm.submitForm = function($event){
      if($event.keyCode == 13) startAPIQuery();
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
    vm.repoSortBy = function(byWhat){
      vm.repoSortAscend = !(vm.repoSortAscend);
      vm.repoSort = byWhat;
    }

    function startAPIQuery(){
      vm.status = 100;
      vm.repos = [];
      vm.tags = [];
      vm.tagCounts = {};
      vm.untagged = 0;
      vm.page = 0;
      vm.last = null;
      $location.search("name", vm.name.toLowerCase());
      new Query();
    }

    function Query(){
      var q = this;
      send("https://api.github.com/users/" + vm.name + "/repos", {
        params:{ per_page: "100", access_token: "03b86161b45561bc7448eebac1c2a4491ebbf941"}
      });

      function send(url, options){
        vm.page += 1;
        if(!options) options = {};
        if(!options.headers) options.headers = {};
        q.etag = localStorage.getItem(vm.name + "," + vm.page);
        options.headers["If-None-Match"] = '"' + q.etag + '"';
        $http.get(url, options).error(cached).then(parsed);
      }

      function cached(a,status,b,options){
        if(status === 304){
          console.log("Retrieving from cache...");
          handle(JSON.parse(localStorage.getItem(q.etag)), JSON.parse(localStorage.getItem(q.etag + "-header")));
        }else{
          vm.status = 403;
        }
      }

      function parsed(response){
        var headers = response.headers();
        var ETag = (headers.ETag || headers.Etag || headers.etag || "").replace(/[^a-z0-9]/g, "");
        console.log("Rate limit remaining: " + headers["x-ratelimit-remaining"]);
        try{
          localStorage.setItem(vm.name + "," + vm.page, ETag);
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
        if(links.last) vm.last = "/" + links.last.substring(links.last.length - 1);
        if(links.next) send(links.next);
        else vm.status = 200;
        data.forEach(function(repo){
          var tagMatcher = /\[[^\]]+\]/;
          repo.description_sans_tags = (repo.description || "").replace(tagMatcher, "").trim();
          if(repo.description && (tagMatcher.test(repo.description))){
            repo.tags = repo.description.match(tagMatcher)[0].toLowerCase().replace(/[\[\]]/g, "").trim();
            repo.tags = (repo.tags === "") ? [] : repo.tags.split(/, */);
            repo.tags.forEach(function(tag){
              vm.tagCounts[tag] = (vm.tagCounts[tag] || 0) + 1;
            });
          }else vm.untagged += 1;
        });
        vm.tags = [];
        Object.keys(vm.tagCounts).forEach(function(tag){
          vm.tags.push({name: tag, count: vm.tagCounts[tag]});
        });
        vm.repos = vm.repos.concat(data);
      }

    }

  }
}());
