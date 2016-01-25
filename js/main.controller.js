"use strict";

(function(){
  angular
  .module("repotagger", [ "Github" ])
  .controller("MainController", MainController);

  MainController.$inject = [ "Github", "$location", "$scope" ];

  function MainController(Github, $location, $scope){
    var vm = this;
    var ghQuery = {};
    vm.status = 0;
    vm.name = $location.search().name;
    vm.tagSort = "name";
    vm.tagSortAscend = true;
    vm.repoSort = "name";
    vm.repoSortReverse = false;
    vm.startAPIQuery = startAPIQuery;

    (function onLoad(){
      if(vm.name) startAPIQuery();
    }());

    vm.filterOn = function(tag){
      $location.search("tag", (tag ? tag : null));
    };
    vm.filterer = function(repo){
      var filter = $location.search().tag;
      if(repo.tags && repo.tags.indexOf(filter) > -1) return true;
      else if(filter === "untagged" && (!repo.tags || repo.tags.length < 1)) return true;
      else if(!filter || filter === "all") return true;
      else return false;
    }
    vm.repoSortBy = function(byWhat){
      vm.repoSortReverse = !(vm.repoSortReverse);
      vm.repoSort = byWhat;
    }

    function startAPIQuery(){
      vm.status = 100;
      vm.repos = [];
      vm.tags = [];
      vm.untagged = 0;
      $location.search("name", vm.name.toLowerCase());
      new Github(vm.name, "03b86161b45561bc7448eebac1c2a4491ebbf941", function(data){
        if(data.error) vm.status = data.error;
        else{
          vm.status = 200;
          vm.repos = data.repos;
          vm.tags = data.tags;
          vm.untagged = data.untagged;
        }
        $scope.$apply();
      });
    }

  }

}());
