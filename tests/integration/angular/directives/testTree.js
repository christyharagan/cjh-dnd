'use strict';

var facade = require('cjh-tree').facade;
var angular = require('angular');
require('ionic');
require('../../../../../lib/angular/index');
angular.module('test', ['ionic', 'wow-program'])
  .controller('test', function ($scope) {
    $scope.tree = facade({test: {}});
    var rootList = $scope.tree.createList();
    var node1 = rootList.addNode({test:{replace:true}, dndSource:{model: 'HELLO'}});
    var node2 = rootList.addNode({test:{}, dndSource:{model: 'WORLD'}});
    var node1List = node2.createList();

    $scope.createTempElement = function(e, srcElement, srcModel) {
      return angular.element('<div>' + srcModel + '</div>');
    };

    $scope.shouldReplace = function(e, srcElement, srcModel, node) {
      return node.test.replace;
    };

    $scope.replaceWithTemp = function(e, srcElement, srcModel, node) {
      var replacedInnerHTML = node.dndTarget.element.innerHTML;
      node.dndTarget.element.innerHTML = srcModel.name;
      return replacedInnerHTML;
    };

    $scope.restoreElement = function(nodeList, replacedNode, tempElement) {
      replacedNode.dndTarget.element.innerHTML = tempElement;
    };

    $scope.makeDraggable = function (statementElement) {
      statementElement.style.opacity = '0.5';
    };
    $scope.unmakeDraggable = function (statementElement) {
      statementElement.style.opacity = '1';
    };
    $scope.onSourceDragStart = function () {

    };
    $scope.onSourceDrag = function () {

    };
    $scope.onSourceDrop = function () {

    };
    $scope.onTargetOver = function () {

    };
    $scope.onTargetDrag = function () {

    };
    $scope.onTargetOut = function () {

    };
    $scope.onTargetDrop = function () {

    };
  });