'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var sampleData = require('./sampleData');
var facade = require('cjh-tree').facade;

var targetTreeDecorator = require('../../lib/targetTreeDecorator');

var getCoords = function (element) {
  return element;
};

var setup = function () {
  var $ = sampleData();

  $.temp = {};

  $.createTemp = sinon.stub().returns($.temp);
  $.removeTemp = sinon.spy();
  $.replaceWithTemp = sinon.stub().returns($.temp);
  $.restoreElement = sinon.spy();

  $.targetTreeDecorator = targetTreeDecorator(getCoords, $.createTemp, $.removeTemp, $.replaceWithTemp, $.restoreElement);

  $.tree = facade({dndTarget: {}}, [$.targetTreeDecorator]);

  $.element1 = {
    top: 0,
    bottom: 10,
    left: 0,
    right: 10
  };
  $.shouldReplace = sinon.stub().returns(true);
  $.element2 = {
    top: 10,
    bottom: 20,
    left: 0,
    right: 10
  };
  $.onOver1 = sinon.spy();
  $.onOver2 = sinon.spy();
  $.onOut1 = sinon.spy();
  $.onOut2 = sinon.spy();
  $.onDrag1 = sinon.spy();
  $.onDrag2 = sinon.spy();
  $.onDrop1 = sinon.spy();
  $.onDrop2 = sinon.spy();

  $.list = $.tree.createList({});
  $.node1 = $.list.addNode({
    dndTarget: {
      element: $.element1,
      shouldReplace: $.shouldReplace,
      onOver: $.onOver1,
      onOut: $.onOut1,
      onDrag: $.onDrag1,
      onDrop: $.onDrop1
    }
  });
  $.node2 = $.list.addNode({
    dndTarget: {
      element: $.element2,
      onOver: $.onOver2,
      onOut: $.onOut2,
      onDrag: $.onDrag2,
      onDrop: $.onDrop2
    }
  });

  return $;
};

describe('targetTreeDecorator', function () {
  it('should setup the dnd targets correctly', function () {
    var $ = setup();

    expect($.node2.dndTarget.parent.children).to.have.length(2);
    expect($.node2.dndTarget.parent.children[0]).to.equal($.node1.dndTarget);
    expect($.node2.dndTarget.parent.children[1]).to.equal($.node2.dndTarget);
  });

  it('should add and remove temp elements as source elements move around', function () {
    var $ = setup();

    var e = {};
    var srcElement = {
      top: 8,
      bottom: 15,
      left: 0,
      right: 10
    };
    var srcModel = {};
    var pt = {
      over: [],
      out: [],
      drag: []
    };
    $.node2.dndTarget.onOver(e, srcElement, srcModel, pt, true);

    expect($.node2.dndTarget.parent.children).to.have.length(3);
    expect($.node2.dndTarget.parent.children[0]).to.equal($.node1.dndTarget);
    expect($.node2.dndTarget.parent.children[1].element).to.equal($.temp);
    expect($.node2.dndTarget.parent.children[2]).to.equal($.node2.dndTarget);

    expect($.onOver2).to.have.been.calledOnce.and.calledWith(e, srcElement, srcModel, pt, true);
    expect($.createTemp).to.have.been.calledOnce.and.calledWith(e, srcElement, srcModel, $.node2.dndTarget, 1, pt);
    expect($.removeTemp).to.not.have.been.called;
    expect($.replaceWithTemp).to.not.have.been.called;
    expect($.restoreElement).to.not.have.been.called;

    srcElement.top = 9;
    srcElement.bottom = 16;
    $.node2.dndTarget.onDrag(e, srcElement, srcModel, pt, true);

    expect($.onDrag2).to.have.been.calledOnce.and.calledWith(e, srcElement, srcModel, pt, true);
    expect($.createTemp).to.have.been.calledOnce;
    expect($.removeTemp).to.not.have.been.called;
    expect($.replaceWithTemp).to.not.have.been.called;
    expect($.restoreElement).to.not.have.been.called;

    srcElement.top = 13;
    srcElement.bottom = 20;
    $.node2.dndTarget.onDrag(e, srcElement, srcModel, pt, true);

    expect($.onDrag2).to.have.been.calledTwice.and.calledWith(e, srcElement, srcModel, pt, true);
    expect($.createTemp).to.have.been.calledTwice.and.calledWith(e, srcElement, srcModel, $.node2.dndTarget, 2, pt);
    expect($.removeTemp).to.have.been.calledOnce.and.calledWith($.tree.dndTarget, $.temp, 1);

    srcElement.top = 30;
    srcElement.bottom = 37;

    pt.over = [
      {element: $.temp}
    ];

    $.node2.dndTarget.onOut(e, srcElement, srcModel, pt, true);

    expect($.onOut2).to.have.been.calledOnce.and.calledWith(e, srcElement, srcModel, pt, true);
    expect($.removeTemp).to.have.been.calledOnce;

    pt.over = [];
    var tempOnOut = sinon.spy($.node2.dndTarget.parent.children[2].onOut);

    tempOnOut(e, srcElement, srcModel, pt, true);

    expect($.removeTemp).to.have.been.calledTwice.and.calledWith($.tree.dndTarget, $.temp, 2);
    expect($.node2.dndTarget.parent.children).to.have.length(2);
  });

  it('should replace and restore temp elements as source elements move around', function () {
    var $ = setup();

    var e = {};
    var srcElement = {
      top: 8,
      bottom: 15,
      left: 0,
      right: 10
    };
    var srcModel = {};
    var pt = {
      over: [],
      out: [],
      drag: []
    };
    $.node1.dndTarget.onOver(e, srcElement, srcModel, pt, true);

    expect($.node1.dndTarget.parent.children).to.have.length(2);
    expect($.node1.dndTarget.parent.children[0]).to.equal($.node1.dndTarget);
    expect($.node1.dndTarget.parent.children[1]).to.equal($.node2.dndTarget);

    expect($.shouldReplace).to.have.been.calledOnce.and.calledWith(e, srcElement, srcModel, $.node1, pt, true);
    expect($.replaceWithTemp).to.have.been.calledOnce.and.calledWith(e, srcElement, srcModel, $.node1, pt, true);

    $.node1.dndTarget.onOut(e, srcElement, srcModel, pt, true);

    expect($.node1.dndTarget.parent.children).to.have.length(2);
    expect($.node1.dndTarget.parent.children[0]).to.equal($.node1.dndTarget);
    expect($.node1.dndTarget.parent.children[1]).to.equal($.node2.dndTarget);

    expect($.restoreElement).to.have.been.calledOnce.and.calledWith($.list, $.node1, $.temp, 0);
  });
});
