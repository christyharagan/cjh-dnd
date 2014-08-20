'use strict';

var facade = require('cjh-tree').tree;
var _ = require('underscore');

var overlapsH = function (a, b) {
  return a.left < b.right && b.left < a.right;
};

var overlapsV = function (a, b) {
  return a.top < b.bottom && b.top < a.bottom;
};

var overlaps = function (a, b) {
  return  overlapsH(a, b) && overlapsV(a, b);
};

var relOverlapH = function (a, b) {
  if (a.right <= b.left) {
    return -1;
  } else if (a.left >= b.right) {
    return 1;
  } else {
    return 0;
  }
};

var relOverlapV = function (a, b) {
  if (a.bottom <= b.top) {
    return -1;
  } else if (a.top >= b.bottom) {
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

var getOverlap = function (source, sourceCoords, target, selectionType) {
  if (_.isString(selectionType)) {
    var targetCoords = target.dndTarget.getCoords();
    switch (selectionType) {
      case 'v':
        return verticalOverlap(sourceCoords, targetCoords);
      case 'h':
        return horizontalOverlap(sourceCoords, targetCoords);
      case 'a':
        return verticalOverlap(sourceCoords, targetCoords) * horizontalOverlap(sourceCoords, targetCoords);
    }
  } else {
    return selectionType.overlap(source, sourceCoords, target);
  }
};

module.exports.createOverlapTree = function (source, sourceCoords, targets, selectionType, allowSourceChildren) {
  var dndOverlap = {};
  if (selectionType) {
    if (_.isString(selectionType)) {
      dndOverlap.overlap = 0;
    } else {
      dndOverlap.overlap = selectionType.initial();
    }
  }

  var sort;
  if (targets.children) {
    sort = targets.dndTarget.sort;
    targets = targets.children;
  }

  return populateOverlapNode(facade({dndOverlap: dndOverlap}), source, sourceCoords, targets, sort, selectionType, allowSourceChildren);
};

var populateOverlapNode = function (overlapNode, source, sourceCoords, targets, sort, selectionType, allowSourceChildren) {
  if (targets.length > 0) {
    if (sort) {
      if ((sort === 'h' && overlapsV(sourceCoords, targets[0].dndTarget.getCoords())) || (sort === 'v' && overlapsH(sourceCoords, targets[0].dndTarget.getCoords()))) {
        var lower = 0;
        var upper = targets.length - 1;

        while (true) {
          var i = ((upper - lower) >> 1) + lower;

          var target = targets[i];
          var r = sort === 'h' ? relOverlapH(sourceCoords, target.dndTarget.getCoords()) : relOverlapV(sourceCoords, target.dndTarget.getCoords());
          if (r === -1) {
            if (lower === i) {
              break;
            } else {
              upper = i - 1;
            }
          } else if (r === 1) {
            if (upper === i) {
              break;
            } else {
              lower = i + 1;
            }
          } else {
            populateOverlapNodeFromPoint(overlapNode, targets, i, lower, upper, source, sourceCoords, target.dndTarget.selectionType || selectionType, sort, allowSourceChildren);

            break;
          }
        }
      }
    } else {
      populateOverlapNodeFromPoint(overlapNode, targets, 0, 0, targets.length - 1, source, sourceCoords, selectionType, sort, allowSourceChildren);
    }
  }

  return overlapNode;
};

var populateOverlapNodeFromPoint = function (overlapNode, targets, i, lower, upper, source, sourceCoords, selectionType, sort, allowSourceChildren) {
  var target;
  var l = i - 1;
  var childOverlapNode;

  while (l >= lower) {
    target = targets[l];

    if (allowSourceChildren || (source && target.parent !== source)) {
      childOverlapNode = createOverlapNode(overlapNode, target, source, sourceCoords, selectionType, allowSourceChildren);
      if (!childOverlapNode && sort) {
        break;
      }
    }

    l--;
  }

  var u = i;
  while (u <= upper) {
    target = targets[u];

    if (allowSourceChildren || (source && target.parent !== source)) {
      childOverlapNode = createOverlapNode(overlapNode, target, source, sourceCoords, selectionType, allowSourceChildren);
      if (!childOverlapNode && sort) {
        break;
      }
    }

    u++;
  }
};

var createOverlapNode = function (parentNode, target, source, sourceCoords, selectionType, allowSourceChildren) {
  var overlapNode;

  if (!selectionType) {
    if (overlaps(sourceCoords, target.dndTarget.getCoords())) {
      overlapNode = parentNode.addNode({dndOverlap: {target: target}});
      populateOverlapNode(overlapNode, source, sourceCoords, target.children, null, null, allowSourceChildren);
    }
  } else {
    var overlap = getOverlap(source, sourceCoords, target, selectionType);

    var rootNode = parentNode.root ? parentNode.root : parentNode;

    var isBiggerOverlap = _.isString(selectionType) ? overlap > rootNode.dndOverlap.overlap : selectionType.gt(overlap, rootNode.dndOverlap.overlap);

    if (isBiggerOverlap) {
      overlapNode = parentNode.addNode({dndOverlap: {
        target: target,
        thisOverlap: overlap
      }});
      if (target.children.length === 0 || (!allowSourceChildren && target === source.model)) {
        rootNode.dndOverlap.overlap = overlap;
        if (parentNode.children.length === 2) {
          parentNode.removeNode(0);
        }
      } else {
        populateOverlapNode(overlapNode, source, sourceCoords, target.children, target.dndTarget.sort, selectionType, allowSourceChildren);
        if (overlapNode.children === 0) {
          // TODO: Potentially different behaviour may wish to be implemented here:
          // The current implementation will assume the parentNode as the current most overlapped.
          // However, other behaviours may include discounting this node's overlap from the parent
          // and re-evaluating that subtracted value from the most overlap value.
        }
        if (parentNode.children.length === 2) {
          parentNode.removeNode(0);
        }
      }
    }
  }
  return overlapNode;
};

var setOverlapType = function (nodes, type) {
  nodes.forEach(function (node) {
    node.dndOverlap.type = type;
    setOverlapType(node.children, type);
  });
};

module.exports.partitionOverlapTree = function (overlapTree, prevOverlapTree) {
  if (!prevOverlapTree || prevOverlapTree.children.length === 0) {
    overlapTree.dndOverlap.type = 'over';
    setOverlapType(overlapTree.children, 'over');

    return overlapTree;
  } else if (overlapTree.children.length === 0) {
    prevOverlapTree.dndOverlap.type = 'out';
    setOverlapType(prevOverlapTree.children, 'out');

    return prevOverlapTree;
  } else {
    overlapTree.dndOverlap.type = 'drag';
    var pot = facade({dndOverlap: overlapTree.dndOverlap});

    overlapTree.children.forEach(function (overlapNode) {
      var found = false;

      for (var j = 0; j < prevOverlapTree.children.length; j++) {
        var prevOverlapNode = prevOverlapTree.children[j];

        if (prevOverlapNode.dndOverlap.target === overlapNode.dndOverlap.target) {
          found = true;
          prevOverlapTree.removeNode(j);

          var childPOT = module.exports.partitionOverlapTree(overlapNode, prevOverlapNode);
          childPOT.dndOverlap.type = 'drag';

          pot.addNode(childPOT);

          break;
        }
      }

      if (!found) {
        overlapNode.dndOverlap.type = 'over';
        pot.addNode(overlapNode);
        setOverlapType(overlapNode.children, 'over');
      }
    });

    prevOverlapTree.children.forEach(function (prevOverlapNode) {
      prevOverlapNode.dndOverlap.type = 'out';
      pot.addNode(prevOverlapNode);
      setOverlapType(prevOverlapNode.children, 'out');
    });

    return pot;
  }
};

var iteratePartitionedOverlapTree = function (pot, onOver, onOut, onDrag) {
  switch (pot.dndOverlap.type) {
    case 'over':
      module.exports.iterateTree(pot, onOver);
      break;
    case 'out':
      module.exports.iterateTree(pot, onOut);
      break;
    case 'drag':
      onDrag(pot);

      pot.children.forEach(function (node) {
        iteratePartitionedOverlapTree(node, onOver, onOut, onDrag);
      });
      break;
  }
};

module.exports.iterateTree = function (pot, cb) {
  cb(pot);
  pot.children.forEach(function (node) {
    module.exports.iterateTree(node, cb);
  });
};

module.exports.iteratePartitionedOverlapTree = function (partitionedOverlapTree, onOver, onOut, onDrag) {
  iteratePartitionedOverlapTree(partitionedOverlapTree, onOver, onOut, onDrag);
};

var pluckAndFilter = function (arr, property) {
  return _.pluck(_.filter(arr, function (obj) {
    return obj !== undefined && obj !== null;
  }), property);
};

module.exports.potSelect = function (partitionedOverlapTree, type, decorator, properties) {
  var nodes = _.pluck(_.pluck(_.filter(partitionedOverlapTree.children, function (node) {
    return node.dndOverlap.type === type;
  }), 'dndOverlap'), 'target');

  if (decorator) {
    nodes = pluckAndFilter(nodes, decorator);

    if (properties) {
      nodes = _.compose(_.each(properties, function (property) {
        return function (_nodes) {
          return pluckAndFilter(_nodes, property);
        };
      }))(nodes);
    }
  }
  return nodes;
};