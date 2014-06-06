'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var sampleData = require('./sampleData');

var overlapTree = require('../../lib/overlapTree');

var c = function (top, bottom, left, right) {
  return {
    top: top,
    bottom: bottom,
    left: left,
    right: right
  };
};

var setup = function () {
  return sampleData();
};

describe('overlapTree', function () {
  describe('#createOverlapTree', function () {
    it('should return an empty tree when no targets overlap', function () {
      var $ = setup();

      var overlap = overlapTree.createOverlapTree(c(0, 8, 0, 8), $.targets);

      expect(overlap).to.be.a('array').and.has.lengthOf(0);
    });
    it('should return all overlapping targets when no selection type specified', function () {
      var $ = setup();

      var overlap = overlapTree.createOverlapTree(c(22, 36, 27, 50), $.targets);

      console.log(overlap[0].node.getCoords());

      expect(overlap).to.eql($.overlapTree);
    });
    it('should return the most overlapping target when a selection type is specified', function () {
      var $ = setup();

      var overlap = overlapTree.createOverlapTree(c(25, 50, 27, 50), $.targets, null, 'v');

      expect(overlap).to.eql($.selectedOverlapTree);
    });
    it('should return the most overlapping target when a selection type and sort type is specified', function () {
      var $ = setup();

      var overlap = overlapTree.createOverlapTree(c(24, 50, 27, 50), $.targets, 'v', 'v');

      expect(overlap).to.eql($.selectedOverlapTree);
    });
  });

  describe('#partitionOverlapTree', function () {
    it('should return all overlaps as new overlaps when there is no previous overlap tree', function () {
      var $ = setup();

      var partitionedOverlapTree = overlapTree.partitionOverlapTree($.overlapTree);

      expect(partitionedOverlapTree).to.be.an('array').and.has.lengthOf(3);

      expect(partitionedOverlapTree[0]).to.be.eql($.overlapTree);

      expect(partitionedOverlapTree[1]).to.be.an('array').and.has.lengthOf(0);
      expect(partitionedOverlapTree[2]).to.be.an('array').and.has.lengthOf(0);
    });
    it('should correctly partition overlaps when there is a previous overlap tree', function () {
      var $ = setup();

      var partitionedOverlapTree = overlapTree.partitionOverlapTree($.overlapTree, $.previousOverlapTree);

      expect(partitionedOverlapTree).to.be.eql($.partitionedOverlapTree);
    });
  });

  describe('#iterateTree', function () {
    it('should call the callback function once for each node in the tree', function () {
      var $ = setup();

      var cb = sinon.spy();

      overlapTree.iterateTree($.overlapTree, cb);

      expect(cb).to.have.callCount(5);
      expect(cb.getCall(0)).to.have.been.calledWith($.targets[1]);
      expect(cb.getCall(1)).to.have.been.calledWith($.targets[1].children[0]);
      expect(cb.getCall(2)).to.have.been.calledWith($.targets[1].children[0].children[0]);
      expect(cb.getCall(3)).to.have.been.calledWith($.targets[2]);
      expect(cb.getCall(4)).to.have.been.calledWith($.targets[2].children[0]);
    });
  });

  describe('#iteratePartitionedOverlapTree', function () {
    it('should call the correct callback function once for each node in the partitioned tree', function () {
      var $ = setup();

      var cb1 = sinon.spy();
      var cb2 = sinon.spy();
      var cb3 = sinon.spy();

      overlapTree.iteratePartitionedOverlapTree($.partitionedOverlapTree, cb1, cb2, cb3);

      expect(cb1).to.have.callCount(2);
      expect(cb1.getCall(0)).to.have.been.calledWith($.targets[2]);
      expect(cb1.getCall(1)).to.have.been.calledWith($.targets[2].children[0]);

      expect(cb2).to.have.callCount(2);
      expect(cb2.getCall(0)).to.have.been.calledWith($.targets[0]);
      expect(cb2.getCall(1)).to.have.been.calledWith($.targets[0].children[0]);

      expect(cb3).to.have.callCount(3);
      expect(cb3.getCall(0)).to.have.been.calledWith($.targets[1]);
      expect(cb3.getCall(1)).to.have.been.calledWith($.targets[1].children[0]);
      expect(cb3.getCall(2)).to.have.been.calledWith($.targets[1].children[0].children[0]);
    });
  });
});