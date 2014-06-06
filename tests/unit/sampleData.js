'use strict';

var t = function (top, bottom, left, right, children) {
  return {
    getCoords: function () {
      return {top:top, bottom:bottom, left:left, right:right};
    },
    children: children || []
  };
};

module.exports = function() {
  var targets = [
    t(10, 20, 20, 60, [t(15, 18, 15, 18)]),
    t(20, 30, 20, 60, [t(20, 25, 25, 30, [t(22, 25, 25, 30)])]),
    t(35, 50, 20, 60, [t(35, 45, 45, 50), t(45, 50, 55, 60)])
  ];

  var overlap0 = {
    node: targets[0],
    children: [
      {
        node: targets[0].children[0]
      }
    ]
  };
  var overlap1 = {
    node: targets[1],
    children: [
      {
        node: targets[1].children[0],
        children: [
          {
            node: targets[1].children[0].children[0]
          }
        ]
      }
    ]
  };
  var overlap2 = {
    node: targets[2],
    children: [
      {
        node: targets[2].children[0]
      }
    ]
  };

  return {
    targets: targets,
    overlapTree: [overlap1, overlap2],
    selectedOverlapTree: [overlap2],
    previousOverlapTree: [overlap0, overlap1],
    partitionedOverlapTree: {
      over: [overlap2],
      out: [overlap0],
      drag: [{
        node: targets[1],
        childPOT: {
          over: [],
          out: [],
          drag: [
            {
              node: targets[1].children[0],
              childPOT: {
                over: [],
                out: [],
                drag: [
                  {
                    node: targets[1].children[0].children[0]
                  }
                ]
              }
            }
          ]
        }
      }]
    }
  };
};