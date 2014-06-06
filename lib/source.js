'use strict';

var _overlapTree = require('./overlapTree');

module.exports = function (getCoords, move) {
  return function (args) {
    var element;

    var isDisabled = false;
    var isDragging = false;

    var startX = null;
    var startY = null;
    var lastX = null;
    var lastY = null;

    var coords;
    var origCoords;

    var overlapTree;
    var prevOverlapTree;

    var targets;

    var onDragStart = function (e) {
      if (!isDisabled) {
        if (!isDragging) {
          targets = args.getTargets(args);

          element = args.makeDraggable(args.element);

          var srcCoords = getCoords(element);
          origCoords = {
            left: srcCoords.left,
            right: srcCoords.right,
            top: srcCoords.top,
            bottom: srcCoords.bottom
          };
          coords = {
            left: srcCoords.left,
            right: srcCoords.right,
            top: srcCoords.top,
            bottom: srcCoords.bottom
          };

          isDragging = true;

          if (args.onDragStart) {
            args.onDragStart(e, element);
          }

          return true;
        }
      }
      return false;
    };

    var onDrag = function (e, x, y) {
      if (!isDisabled) {
        if (isDragging) {

          if (!startX) {
            startX = x;
            startY = y;
          } else {
            lastX = x;
            lastY = y;
          }

          var lastCoords = coords;
          var newCoords = move(element, lastX - startX, lastY - startY, origCoords);

          if (newCoords.top !== lastCoords.top || newCoords.bottom !== lastCoords.bottom || newCoords.left !== lastCoords.left || newCoords.right !== lastCoords.right) {
            overlapTree = _overlapTree.createOverlapTree(newCoords, targets, args.sort, args.selectionType, 0);
            var partitionedOverlapTree = _overlapTree.partitionOverlapTree(overlapTree, prevOverlapTree);

            if (args.onDrag) {
              args.onDrag(e, element, partitionedOverlapTree);
            }

            _overlapTree.iteratePartitionedOverlapTree(partitionedOverlapTree, function (overTarget) {
              if (overTarget.onOver) {
                overTarget.onOver(e, element, args.model, partitionedOverlapTree);
              }
            }, function (outTarget) {
              if (outTarget.onOut) {
                outTarget.onOut(e, element, args.model, partitionedOverlapTree);
              }
            }, function (dragTarget) {
              if (dragTarget.onDrag) {
                dragTarget.onDrag(e, element, args.model, partitionedOverlapTree);
              }
            });

            return true;
          }
        }
      }
      return false;
    };

    var onDrop = function (e) {
      if (isDragging) {
        isDragging = false;
        startX = null;
        startY = null;
        lastX = null;
        lastY = null;

        if (args.onDragEnd) {
          args.onDragEnd(e, element, overlapTree);
        }

        _overlapTree.iterateTree(overlapTree, function (dropTarget, isLeaf) {
          if (dropTarget.onDrop) {
            dropTarget.onDrop(e, element, args.model, overlapTree, isLeaf);
          }
        });

        args.unmakeDraggable(element, args.element);
        element = null;
      }
    };

    var source = {
      onDragStart: onDragStart,
      onDrag: onDrag,
      onDrop: onDrop,
      disable: function () {
        isDisabled = true;
      },
      enable: function () {
        isDisabled = false;
      },
      isDisabled: function () {
        return isDisabled;
      },
      destroy: function () {
        source.disable();
        if (args.destroy) {
          args.destroy();
        }
      }
    };

    return source;
  };
};