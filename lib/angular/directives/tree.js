'use strict';

var htmlUtils = require('../../html/utils');
var ngUtils = require('../utils');
var _targetTreeMixin = require('../../targetTreeDecorator');
var sourceTreeMixin = require('../../sourceTreeDecorator')(htmlUtils.getCoords, htmlUtils.move);
var library = require('../../library');

module.exports = function () {
  return {
    restrict: 'E',
    scope: {
      tags: '@',
      tree: '=',
      createTemp: '&',
      removeTemp: '&',
      replaceWithTemp: '&',
      restoreElement: '&',
      makeDraggable: '&',
      unmakeDraggable: '&',
      clone: '@',
      onSourceDragStart: '&',
      onSourceDrag: '&',
      onSourceDrop: '&',
      onTargetOver: '&',
      onTargetDrag: '&',
      onTargetOut: '&',
      onTargetDrop: '&'
    },
    transclude: 'element',
    compile: function () {
      var preLink = function ($scope, $element) {
        var element = $element[0];

        var targetTreeMixin = _targetTreeMixin(htmlUtils.getCoords, $scope.createTemp, $scope.removeTemp, $scope.replaceWithTemp, $scope.restoreElement);

        $scope.tree.dndSource.tags = [$scope.tag];
        $scope.tree.dndTarget.element = element;

        var parentBackup;

        $scope.tree.dndSource.makeDraggable = function (statementElement) {
          if ($scope.makeDraggable) {
            $scope.makeDraggable(statementElement);
          }
          if ($scope.clone) {
            return ngUtils.clone(statementElement, element);
          } else {
            parentBackup = statementElement.parentNode;
            statementElement.parentNode.removeChild(statementElement);
            element.appendChild(statementElement);
          }
        };
        $scope.tree.dndSource.unmakeDraggable = function (clone, statementElement) {
          if ($scope.clone) {
            element.removeChild(clone);
            if ($scope.unmakeDraggable) {
              $scope.unmakeDraggable(statementElement);
            }
          } else {
            element.removeChild(statementElement);
            parentBackup.appendChild(statementElement);
          }
          if ($scope.unmakeDraggable) {
            $scope.unmakeDraggable(statementElement);
          }
        };

        $scope.tree.dndTarget.element = element;

        $scope.tree.addDecorator(targetTreeMixin);
        $scope.tree.addDecorator(sourceTreeMixin);

        $scope.on('$destroy', function () {
          $scope.tree.destroy();
        });
      };
      return {pre: preLink};
    }
  };
};