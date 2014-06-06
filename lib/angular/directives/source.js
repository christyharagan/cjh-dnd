'use strict';

var ngUtils = require('../utils');
var utils = require('../../html/utils');
var _source = require('../../source')(utils.getCoords, utils.move);
var library = require('../../library');

module.exports = function () {
  return {
    restrict: 'E',
    scope: {
      tags: '@',
      model: '=',
      clone: '@',
      dragParent: '@',
      makeDraggable: '&',
      unmakeDraggable: '&',
      onDragStart: '&',
      onDrag: '&',
      onDrop: '&',
      source: '='
    },
    transclude: 'element',
    compile: function () {
      var postLink = function ($scope, $element) {
        var element = $element[0];

        var parentBackup;
        var makeDraggable = function (statementElement) {
          if ($scope.makeDraggable) {
            $scope.makeDraggable(statementElement);
          }
          if ($scope.clone) {
            return ngUtils.clone(statementElement, $scope.dragParent);
          } else {
            $scope.makeDraggable(statementElement);
            parentBackup = statementElement.parentNode;
            statementElement.parentNode.removeChild(statementElement);
            $scope.dragParent.appendChild(statementElement);
          }
        };
        var unmakeDraggable = function (clone, statementElement) {
          if ($scope.clone) {
            $scope.dragParent.removeChild(clone);
            if ($scope.unmakeDraggable) {
              $scope.unmakeDraggable(statementElement);
            }
          } else {
            $scope.dragParent.removeChild(statementElement);
            parentBackup.appendChild(statementElement);
          }
          if ($scope.unmakeDraggable) {
            $scope.unmakeDraggable(statementElement);
          }
        };

        $scope.source = _source({
          tags: $scope.tags,
          getTargets: library.getTargets,
          model: $scope.model,
          element: element,
          makeDraggable: makeDraggable,
          unmakeDraggable: unmakeDraggable,
          onDragStart: $scope.onDragStart,
          onDrag: $scope.onDrag,
          onDrop: $scope.onDrop
        });

        $scope.on('$destroy', function () {
          $scope.source.destroy();
        });
      };
      return { post: postLink };
    }
  };
};