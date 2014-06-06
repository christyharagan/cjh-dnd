'use strict';

var overlapsH = function (a, b) {
  return a.left <= b.right && b.left <= a.right;
};

var overlapsV = function (a, b) {
  return a.top <= b.bottom && b.top <= a.bottom;
};

var overlaps = function (a, b) {
  return  overlapsH(a, b) && overlapsV(a, b);
};

var relOverlapH = function (a, b) {
  if (a.right < b.left) {
    return -1;
  } else if (a.left > b.right) {
    return 1;
  } else {
    return 0;
  }
};

var relOverlapV = function (a, b) {
  if (a.bottom < b.top) {
    return -1;
  } else if (a.top > b.bottom) {
    return 1;
  } else {
    return 0;
  }
};

var horizontalOverlap = function (a, b) {
  if (b.right > a.right) {
    if (b.left < a.left) {
      return a.right - a.left;
    } else {
      return a.right - b.left;
    }
  } else {
    if (a.left < b.left) {
      return b.right - b.left;
    } else {
      return b.right - a.left;
    }
  }
};

var verticalOverlap = function (a, b) {
  if (b.bottom > a.bottom) {
    if (b.top < a.top) {
      return a.bottom - a.top;
    } else {
      return a.bottom - b.top;
    }
  } else {
    if (a.top < b.top) {
      return b.bottom - b.top;
    } else {
      return b.bottom - a.top;
    }
  }
};

var getOverlap = function(sourceCoords, targetCoords, selectionType) {
  switch (selectionType) {
    case 'v':
      return verticalOverlap(sourceCoords, targetCoords);
    case 'h':
      return horizontalOverlap(sourceCoords, targetCoords);
    case 'a':
      return verticalOverlap(sourceCoords, targetCoords) * horizontalOverlap(sourceCoords, targetCoords);
  }
};

module.exports.createOverlapTree = function (sourceCoords, targets, sort, selectionType) {
  var overlapTree = createOverlapTree(sourceCoords, targets, sort, selectionType, 0);
  if (selectionType && overlapTree.length > 0) {
    delete overlapTree[0].overlap;
  }
  return overlapTree;
};

var createOverlapTree = function (sourceCoords, targets, sort, selectionType, mostOverlap) {
  var mostOverlappedNode;
  var overlapTree = [];
  if (sort) {
    if (targets.length > 0) {
      if ((sort === 'h' && overlapsV(sourceCoords, targets[0].getCoords())) || (sort === 'v' && overlapsH(sourceCoords, targets[0].getCoords()))) {
        var lower = 0;
        var upper = targets.length - 1;

        while (true) {
          var i = ((upper - lower) >> 1) + lower;

          var target = targets[i];
          var r = sort === 'h' ? relOverlapH(sourceCoords, target.getCoords()) : relOverlapV(sourceCoords, target.getCoords());
          if (r === -1) {
            if (lower === i) {
              return [];
            } else {
              upper = i - 1;
            }
          } else if (r === 1) {
            if (upper === i) {
              return [];
            } else {
              lower = i + 1;
            }
          } else {
            var overlap = getOverlap(sourceCoords, target.getCoords(), selectionType);
            var childOverlapNode = createOverlapNode(target, sourceCoords, target.selectionType || selectionType, mostOverlap, overlap);
            if (childOverlapNode && childOverlapNode.overlap) {
              mostOverlap = childOverlapNode.overlap;
            }
            mostOverlappedNode = populateOverlapTree(overlapTree, targets, i, sourceCoords, target.selectionType || selectionType, mostOverlap, sort);

            if (mostOverlappedNode) {
              overlapTree.push(mostOverlappedNode);
            } else if (childOverlapNode && selectionType) {
              overlapTree.push(childOverlapNode);
            }

            break;
          }
        }
      }
    }
  } else {
    mostOverlappedNode = populateOverlapTree(overlapTree, targets, -1, sourceCoords, selectionType, mostOverlap, sort);
    if (mostOverlappedNode) {
      overlapTree.push(mostOverlappedNode);
    }
  }

  return overlapTree;
};

var populateOverlapTree = function (overlapTree, targets, i, sourceCoords, selectionType, mostOverlap, sort) {
  var target;
  var l = i;
  var lower = 0;
  var upper = targets.length - 1;

  var mostOverlapped;
  var childOverlapNode;

  while (l > lower) {
    l--;
    target = targets[l];

    childOverlapNode = checkAndCreateOverlapNode(target, sourceCoords, selectionType, mostOverlap);
    if (childOverlapNode) {
      if (selectionType) {
        mostOverlapped = childOverlapNode;
        mostOverlap = childOverlapNode.overlap;
      } else {
        overlapTree.splice(0, 0, childOverlapNode);
      }
    } else if (sort) {
      break;
    }
  }

  var u = i;
  while (u < upper) {
    u++;
    target = targets[u];

    childOverlapNode = checkAndCreateOverlapNode(target, sourceCoords, selectionType, mostOverlap);
    if (childOverlapNode) {
      if (selectionType) {
        mostOverlapped = childOverlapNode;
        mostOverlap = childOverlapNode.overlap;
      } else {
        overlapTree.push(childOverlapNode);
      }
    } else if (sort) {
      break;
    }
  }

  return mostOverlapped;
};

var checkAndCreateOverlapNode = function (target, sourceCoords, selectionType, mostOverlap) {
  if (!selectionType) {
    if (overlaps(sourceCoords, target.getCoords())) {
      return createOverlapNode(target, sourceCoords);
    }
  } else {
    var overlap = getOverlap(sourceCoords, target.getCoords(), selectionType);

    if (overlap > mostOverlap) {
      var childOverlapNode = createOverlapNode(target, sourceCoords, selectionType, mostOverlap, overlap);
      if (childOverlapNode.overlap > mostOverlap) {
        return childOverlapNode;
      }
    }
  }
};

var createOverlapNode = function (target, sourceCoords, selectionType, mostOverlap, nodeOverlap) {
  var overlapNode = {
    node: target
  };

  if (target.children && target.children.length > 0) {
    var overlapTree = createOverlapTree(sourceCoords, target.children, target.sort, selectionType, mostOverlap);
    if (overlapTree.length > 0) {
      if (selectionType) {
        nodeOverlap = nodeOverlap - overlapTree[0].overlap;
        if (nodeOverlap < overlapTree[0].overlap) {
          overlapNode.children = overlapTree;
          overlapNode.overlap = overlapTree[0].overlap;
          delete overlapTree[0].overlap;
        } else {
          overlapNode.overlap = nodeOverlap;
        }
      } else {
        overlapNode.children = overlapTree;
      }
    } else if (selectionType) {
      overlapNode.overlap = nodeOverlap;
    }
  } else if (selectionType) {
    overlapNode.overlap = nodeOverlap;
  }

  return overlapNode;
};

module.exports.partitionOverlapTree = function (overlapTree, prevOverlapTree) {
  if (!prevOverlapTree || prevOverlapTree.length === 0) {
    return [overlapTree, [], []];
  } else {
    var overTree = [];
    var dragTree = [];

    overlapTree.forEach(function (overlapNode) {
      var found = false;

      for (var j = 0; j < prevOverlapTree.length; j++) {
        var prevOverlapNode = prevOverlapTree[j];
        if (prevOverlapNode.node === overlapNode.node) {
          found = true;
          prevOverlapTree.splice(j, 1);

          var dragNode = {
            node: overlapNode.node
          };
          if (overlapNode.children) {
            dragNode.childPOT = module.exports.partitionOverlapTree(overlapNode.children, prevOverlapNode.children);
          }

          dragTree.push(dragNode);

          break;
        }
      }
      if (!found) {
        overTree.push(overlapNode);
      }
    });

    return {
      over: overTree,
      out: prevOverlapTree,
      drag: dragTree
    };
  }
};

module.exports.iterateTree = function (onTree, cb) {
  onTree.forEach(function (overNode) {
    cb(overNode.node, !overNode.children || overNode.children.length === 0);
    if (overNode.children) {
      module.exports.iterateTree(overNode.children, cb);
    }
  });
};

module.exports.iteratePartitionedOverlapTree = function (partitionedOverlapTree, onOver, onOut, onDrag) {
  module.exports.iterateTree(partitionedOverlapTree.out, onOut);
  module.exports.iterateTree(partitionedOverlapTree.over, onOver);

  partitionedOverlapTree.drag.forEach(function (dragNode) {
    onDrag(dragNode.node);
    if (dragNode.childPOT) {
      module.exports.iteratePartitionedOverlapTree(dragNode.childPOT, onOver, onOut, onDrag);
    }
  });
};
