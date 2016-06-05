"use strict";

(function(){
  angular.module('repotagger')
  .factory('d3Service', d3ServiceFunc)
  .directive('circlesViz', CirclesDirective)

  d3ServiceFunc.$inject = ['$document', '$q', '$rootScope']
  function d3ServiceFunc($document, $q, $rootScope) {
    var d = $q.defer();
    function onScriptLoad() {
      // Load client in the browser
      $rootScope.$apply(function() { d.resolve(window.d3); });
    }
    // Create a script tag with d3 as the source
    // and call our onScriptLoad callback when it
    // has been loaded
    var scriptTag = $document[0].createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.async = true;
    scriptTag.src = 'http://d3js.org/d3.v3.min.js';
    scriptTag.onreadystatechange = function () {
      if (this.readyState == 'complete') onScriptLoad();
    }
    scriptTag.onload = onScriptLoad;

    var s = $document[0].getElementsByTagName('body')[0];
    s.appendChild(scriptTag);

    return {
      d3: function() { return d.promise; }
    };
  }

  CirclesDirective.$inject = ['d3Service']
  function CirclesDirective(d3Service) {
    return {
      scope: {
        data: '='
      },
      link: function(scope, element, attrs) {
        // window.onresize = function() {
        //   return scope.$apply();
        // };
        // scope.$watch(function(){
        //     return angular.element(window)[0].innerWidth;
        //   }, function(){
        //     return scope.render(scope.data);
        //   }
        // );

        // watch for data changes and re-render
        scope.$watch('data', function(newVals, oldVals) {
          return scope.render(newVals);
        }, true);

        // define render function
        scope.render = function(data){

          d3Service.d3().then(function(d3) {
            var mainWidth = angular.element(document.querySelector('main').clientWidth);
            var diameter = mainWidth[0];

            d3.selectAll(".bubble").remove();

            var bubble = d3.layout.pack()
            .sort(null)
            .size([diameter, diameter])
            .padding(1.5);

            var svg = d3.select(".circles")
            .append('svg')
            .attr("width", diameter)
            .attr("height", diameter)
            .attr("class", "bubble")

            data = scope.data.tags.map(function(d){ d.value = d["count"]; return d; });

            var nodes = bubble.nodes({children:data}).filter(function(d) {return !d.children; });

            var bubbles = svg.append("g")
            .attr("transform", "translate(0,0)")
            .selectAll(".bubble")
            .data(nodes)
            .enter()

            bubbles.append("circle")
            .attr("r", function(d){ return d.r; })
            .attr("cx", function(d){ return d.x; })
            .attr("cy", function(d){ return d.y; })
            .style("fill", "#9cf")
            .on("mouseover", function(){
              d3.select(this).style("fill", "#ccc")
            })
            .on("mouseout", function(){
              d3.select(this).style("fill", "#9cf")
            })

            bubbles.append("text")
            .attr("x", function(d){ return d.x; })
            .attr("y", function(d){ return d.y + 5; })
            .attr("text-anchor", "middle")
            .text(function(d) { return d.name.substring(0, d.r / 3); })
            .style({
                "fill":"#369",
                "font-family":"Helvetica Neue, Helvetica, Arial, san-serif",
                "font-size": "12px"
            });
          })
        }
      }
    }
  }

})();
