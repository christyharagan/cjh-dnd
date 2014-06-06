'use strict';

module.exports.utils = require('./utils');
module.exports.module = function () {
  var angular = require('angular');

  angular.module('cjh-dnd', [])
    .directive('cjh-dnd-source', require('./directives/dnd/source'))
    .directive('cjh-dnd-target', require('./directives/dnd/target'))
    .directive('cjh-dnd-tree', require('./directives/dnd/tree'));
};