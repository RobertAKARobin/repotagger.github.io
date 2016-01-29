"use strict";

(function(){
// .module("repotagger", [ "GH_API", "ngCookies" ])
  angular
  .module("repotagger", [ "GH_API" ])
  .config(["$locationProvider", AppConfig])
  .controller("MainController", MainController);

  function AppConfig($locationProvider){
    $locationProvider.html5Mode(true);
  }

// MainController.$inject = [ "GH_API", "$cookies", "$location", "$scope" ];
  MainController.$inject = [ "GH_API", "$location", "$scope" ];

// function MainController(GH_API, $cookies, $location, $scope){
  function MainController(GH_API, $location, $scope){
    var vm = this;
    vm.status = 0;
    vm.name = $location.search().name;
    vm.tagSort = "name";
    vm.tagSortAscend = true;
    vm.repoSort = "name";
    vm.repoSortReverse = false;
    vm.startAPIQuery = startAPIQuery;

    (function onLoad(){
      var access_token = $location.search().token;
      // if(access_token){
      //   $location.search("token", null);
      //   $cookies.put("gh_access_token", access_token, {
      //     expires: new Date("Jan 1 2100")
      //   });
      // }
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
      vm.repoSortReverse = !(vm.repoSortReverse);
      vm.repoSort = byWhat;
    }

    function startAPIQuery(){
      // var access_token = $cookies.get("gh_access_token");
      var access_token = "03b86161b45561bc7448eebac1c2a4491ebbf941";
      vm.status = 100;
      vm.repos = [];
      vm.tags = [];
      vm.untagged = 0;
      $location.search("name", vm.name.toLowerCase());
      if(!access_token) redirectToLogin();
      else GH_API("users/" + vm.name + "/repos", completedAPIQuery, {
        params: { access_token: access_token }
      });
    }

    function redirectToLogin(){
      var login_url = (function(){
        if (/(127\.0\.0\.1)|(localhost)/g.test($location.host())) return "http://127.0.0.1:3000";
        else return "http://github_login.robertakarobin.com";
      }());
      location.href = login_url + "?redirect_to=" + encodeURIComponent($location.absUrl());
    }

    function completedAPIQuery(repos){
      var tagsWithCounts = {};
      var tagMatcher = /\[[^\]]+\]/;
      if(repos.error) vm.status = repos.error;
      else{
        (vm.repos = repos).forEach(function(repo){
          repo.description_sans_tags = (repo.description || "").replace(tagMatcher, "").trim();
          if(repo.description && (tagMatcher.test(repo.description))){
            repo.tags = repo.description.match(tagMatcher)[0].toLowerCase().replace(/[\[\]]/g, "");
            repo.tags = (repo.tags.trim() === "") ? [] : repo.tags.split(/, */);
            repo.tags.forEach(function(tag){
              tagsWithCounts[tag] = (tagsWithCounts[tag] || 0) + 1;
            });
          }else vm.untagged += 1;
        });
        Object.keys(tagsWithCounts).forEach(function(tag){
          vm.tags.push({name: tag, count: tagsWithCounts[tag]});
        });
        vm.status = 200;
      }
      $scope.$apply();
    }

  }

}());
