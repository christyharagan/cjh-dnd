'use strict';

var library = require('../../library');

module.exports = function () {
  return {
    restrict: 'E',
    scope: {
      tag: '@',
      model: '=',
      selectionType: '@',
      sort: '@',
      onOver: '&',
      onDrag: '&',
      onOut: '&',
      onDrop: '&'
    },
    transclude: 'element',
    compile: function () {
      var postLink = function ($scope, $element) {
        var element = $element[0];

        // TODO: Find Parent dnd-target
        var target = {
          element: element,
          model: $scope.model,
          selectionType: $scope.selectionType,
          sort: $scope.sort,
          onOver: $scope.onOver,
          onDrag: $scope.onDrag,
          onOut: $scope.onOut,
          onDrop: $scope.onDrop
        };
        library.addTarget(target);

        $scope.on('$destroy', function () {
          library.removeTarget(target);
        });
      };
      return { post: postLink };
    }
  };
};