'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var sampleData = require('./sampleData');

var setup = function () {
  return sampleData();
};

describe('', function () {
  describe('#createOverlapTree', function () {
    it('should return an empty tree when no targets overlap', function () {
      var $ = setup();

    });
  });
});