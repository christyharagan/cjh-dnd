'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);

var source = require('../../lib/source');

var sampleData = require('./sampleData');

var getCoords = function (element) {
  return element;
};
var move = function (element, x, y) {
  element.left += x;
  element.right += x;
  element.top += y;
  element.bottom += y;
  return element;
};

var setup = function () {
  var $ = sampleData();
  $.source = source(getCoords, move)({
    makeDraggable: sinon.spy(function (element) {
      return element;
    }),
    unmakeDraggable: sinon.spy(function (element) {
      return element;
    }),
    getTargets: function() {
      return $.targets;
    },
    onDragStart: sinon.spy(),
    onDrag: sinon.spy(),
    onDrop: sinon.spy()
  });
  return $;
};

describe('source', function () {
  it('should return an empty tree when no targets overlap', function () {
    var $ = setup();

    $.source({});
  });
});