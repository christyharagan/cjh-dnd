'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var match = sinon.match;

chai.use(sinonChai);

var source = require('../../lib/source');

var sampleData = require('./sampleData');

var newC = function(x, y, $) {
  return {
    top: $.origCoords.top + y,
    bottom: $.origCoords.bottom + y,
    left: $.origCoords.left + x,
    right: $.origCoords.right + x
  };
};

var getCoords = function (element) {
  return element;
};

var setup = function () {
  var $ = sampleData();
  $.makeDraggable = sinon.spy(function (element) {
    return element;
  });
  $.unmakeDraggable = sinon.spy(function (element) {
    return element;
  });
  $.getTargets = function () {
    return $.targets;
  };
  $.onDragStart = sinon.spy();
  $.onDrag = sinon.spy();
  $.onDrop = sinon.spy();
  var move = function (element, x, y) {
    element.left += x;
    element.right += x;
    element.top += y;
    element.bottom += y;
    return element;
  };
  $.move = sinon.spy(move);


  $.sourceFactory = source(getCoords, $.move);
  $.origCoords = {
    left: 0,
    right: 15,
    top: 0,
    bottom: 15
  };
  $.element = {
    left: 0,
    right: 15,
    top: 0,
    bottom: 15
  };
  $.sourceArgs = {
    element: $.element,
    makeDraggable: $.makeDraggable,
    unmakeDraggable: $.unmakeDraggable,
    getTargets: $.getTargets,
    onDragStart: $.onDragStart,
    onDrag: $.onDrag,
    onDrop: $.onDrop
  };
  return $;
};

describe('source', function () {
  it('should call makeDraggable and onDragStart when drag event starts, and unmakeDraggable and onDrop when drag event stops', function () {
    var $ = setup();

    var source = $.sourceFactory($.sourceArgs);

    var e = {};

    source.onDragStart(e);

    expect($.onDragStart).to.have.been.calledOnce.and.calledWith(e);
    expect($.makeDraggable).to.have.been.calledOnce.and.calledWith($.element);

    var e2 = {};

    source.onDrop(e2);

    expect($.onDrop).to.have.been.calledOnce.and.calledWith(e2);
    expect($.unmakeDraggable).to.have.been.calledOnce.and.calledWith($.element);
  });
  it('should call onDrag with an empty overlap tree when no targets overlap', function () {
    var $ = setup();

    var source = $.sourceFactory($.sourceArgs);

    var e = {};

    source.onDragStart(e);
    source.onDrag(e, 1, 1);

    expect($.move).to.have.been.calledOnce.and.calledWith($.element, 1, 1, 1, 1, match($.origCoords));
    expect($.onDrag).to.have.been.calledOnce.and.calledWith(e, $.element, match({over: [], out: [], drag: []}));
    expect($.element).to.eql(newC(1, 1, $));
  });
  it('should call onDrag with a correctly populated overlap tree when targets overlap', function () {
    var $ = setup();

    var source = $.sourceFactory($.sourceArgs);

    var e = {};

    source.onDragStart(e);
    source.onDrag(e, 16, 15);

    expect($.onDrag).to.have.been.calledOnce.and.calledWith(e, $.element, match($.partitionedOverlapTreeNoPrior));

    source.onDrag(e, 12, 7);
    expect($.move).to.have.been.calledTwice.and.calledWith($.element, 12, 7, 16, 15, match($.origCoords));
    expect($.onDrag).to.have.been.calledTwice.and.calledWith(e, $.element, match($.partitionedOverlapTree));
    expect($.element).to.eql(newC(28, 22, $));
  });
});