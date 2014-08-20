'use strict';

var facade = require('cjh-tree').facade;

var t = function(top, bottom, left, right, children) {
  return function(node) {
    var _node = node.addNode({
      dndTarget: {
        getCoords: function(){
          return {top:top, bottom:bottom, left:left, right:right};
        }
      }
    });
    if (children) {
      children.forEach(function(child){
        child(_node);
      });
    }
  };
};

var o = function(t, children) {
  return function(node) {
    node.dndOverlap = {target:t};
    if (children) {
      children.forEach(function(child){
        var _node = node.addNode({});
        child(_node);
      });
    }
  };
};

module.exports = function() {
  var targets = facade({});

  t(10, 20, 20, 60, [t(15, 18, 15, 18)])(targets);
  t(20, 30, 20, 60, [t(20, 25, 25, 30, [t(22, 25, 25, 30)])])(targets);
  t(35, 50, 20, 60, [t(35, 45, 40, 50), t(45, 50, 55, 60)])(targets);

  var overlap0 = facade();
  o(targets.children[0])(overlap0);

  var overlap1 = facade();
  o(targets.children[1],
    [o(targets.children[1].children[0],
      [o(targets.children[1].children[0].children[0])])])(overlap1);

  var overlap2 = facade();
  o(targets.children[2],
    [o(targets.children[2].children[0])])(overlap2);

//  var overlapTree = facade();
//  overlapTree.addNode(overlap1);
//  overlapTree.addNode(overlap2);
//
//  var previousOverlapTree = facade();
//  previousOverlapTree.addNode(overlap0);
//  previousOverlapTree.addNode(overlap1);

  return {
    overlap0: overlap0,
    overlap1: overlap1,
    overlap2: overlap2,
    targets: targets
//    overlapTree: overlapTree,
//    selectedOverlapTree: overlap2,
//    previousOverlapTree: previousOverlapTree,
//    partitionedOverlapTreeNoPrior: {
//      over: [overlap0, overlap1],
//      out: [],
//      drag: []
//    },
//    partitionedOverlapTree: {
//      over: [overlap2],
//      out: [overlap0],
//      drag: [{
//        node: targets.children[1],
//        childPOT: {
//          over: [],
//          out: [],
//          drag: [
//            {
//              node: targets.children[1].children[0],
//              childPOT: {
//                over: [],
//                out: [],
//                drag: [
//                  {
//                    node: targets.children[1].children[0].children[0]
//                  }
//                ]
//              }
//            }
//          ]
//        }
//      }]
//    }
  };
};