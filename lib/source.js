'use strict';

var _overlapTree = require('./overlapTree');

var createSource = function (model, element, destroy) {
  var source = {
    isDisabled: false,
    destroy: function () {
      source.isDisable = true;
      if (destroy) {
        destroy();
      }
    },
    model: model,
    origElement: element
  };
  return source;
};

module.exports = function (getCoords, move, getXY) {
  return function (args) {
    var source = createSource(args.model, args.element, args.destroy);

    source.onDragStart = function (e) {
      if (!source.isDisabled) {
        if (!source.isDragging) {
          var xy = getXY(e);

          source.e = e;
          if (args.getTargets) {
            source.targets = args.getTargets(source);
          }

          var srcCoords = getCoords(source);
          source.origCoords = {
            left: srcCoords.left,
            right: srcCoords.right,
            top: srcCoords.top,
            bottom: srcCoords.bottom
          };

          source.element = args.makeDraggable(source);

          source.isDragging = true;

          source.e = e;
          source.startX = xy.x;
          source.startY = xy.y;
          source.lastX = xy.x;
          source.lastY = xy.y;
          source.lastCoords = source.origCoords;
          source.lastOverlapTree = null;
          source.lastOverlapTreeByRoot = null;

          if (args.onDragStart) {
            args.onDragStart(source);
          }

          return true;
        }
      }
      return false;
    };

    source.onDrag = function (e) {
      if (!source.isDisabled) {
        if (source.isDragging) {
          var xy = getXY(e);

          source.e = e;
          source.x = xy.x;
          source.y = xy.y;

          source.coords = move(source);

          if (source.targets && source.targets.length > 0) {
            source.overlapTree = _overlapTree.createOverlapTree(source, source.coords, source.targets, args.selectionType, 0, args.allowSourceChildren);
          }

          if (args.onDrag) {
            args.onDrag(source);
          }

          if (source.overlapTree) {
            source.overlapTreeByRoot = [];
            source.overlapTree.children.forEach(function (node) {
              var targetNode = node.dndOverlap.target;
              var root = targetNode.root || targetNode;
              if (root.dndTarget.onDrag) {
                if (!root.dndTarget.seen) {
                  root.dndTarget.seen = [root, [], []];
                  if (source.lastOverlapTreeByRoot) {
                    for (var i = 0; i < source.lastOverlapTreeByRoot.length; i++) {
                      var prevOverlapNodeForRoot = source.lastOverlapTreeByRoot[i];
                      if (prevOverlapNodeForRoot[0] === root) {
                        root.dndTarget.seen[2] = prevOverlapNodeForRoot[1];
                        delete source.lastOverlapTreeByRoot[i];
                        break;
                      }
                    }
                  }

                  source.overlapTreeByRoot.push(root.dndTarget.seen);
                }
                root.dndTarget.seen[1].push(node);
              }
            });
            source.overlapTree.children.forEach(function (node) {
              var targetNode = node.dndOverlap.target;
              var root = targetNode.root || targetNode;
              delete root.dndTarget.seen;
            });
            source.overlapTreeByRoot.forEach(function (nodesByRoot) {
              nodesByRoot[0].dndTarget.onDrag(source, nodesByRoot[1], nodesByRoot[2]);
            });
            if (source.lastOverlapTreeByRoot) {
              source.lastOverlapTreeByRoot.forEach(function (nodesByRoot) {
                nodesByRoot[0].dndTarget.onDrag(source, [], nodesByRoot[1]);
              });
            }

            source.lastOverlapTreeByRoot = source.overlapTreeByRoot;
            source.lastOverlapTree = source.overlapTree;
          }

          source.lastCoords = source.coords;
          source.lastX = source.x;
          source.lastY = source.y;

          return true;
        }
      }
      return false;
    };

    source.onDrop = function (e) {
      if (source.isDragging) {
        source.isDragging = false;
        source.e = e;

        args.unmakeDraggable(source);

        if (args.onDrop) {
          args.onDrop(source);
        }
        if (source.overlapTreeByRoot) {
          source.overlapTreeByRoot.forEach(function (nodesByRoot) {
            var target = nodesByRoot[0].dndTarget;
            if (target.onDrop) {
              target.onDrop(source, nodesByRoot[1]);
            }
          });
        }

        source = createSource(source.model, source.origElement, source.destroy);
      }
    };

    return source;
  };
};