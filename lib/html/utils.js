'use strict';

var _ = require('underscore');

var CSS_TRANSFORM = _.filter(['webkitTransform', 'transform', '-webkit-transform', 'webkit-transform',
  '-moz-transform', 'moz-transform', 'MozTransform', 'mozTransform', 'msTransform'], function (cssProp) {
  return document.documentElement.style[cssProp] !== undefined;
});

module.exports.move = function (element, x, y) {
  element.style[CSS_TRANSFORM] = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
};

module.exports.getCoords = function (element) {
  return element.getBoundingClientRect();
};
