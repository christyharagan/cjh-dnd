'use strict';

module.exports.alignedTreeTargetSelector = function(alignment) {
  return {
    overlap: function (source, sourceCoords, target) {
      var targetCoords = target.dndTarget.getCoords();

      var newOverlap = !source.overlapTree || source.overlapTree.children.length === 0 || source.overlapTree.children[0].dndOverlap.target.root !== target.root;

      var deltaX = source.x - source.lastX;
      var deltaY = source.y - source.lastY;

      return {
        overlap: module.exports.alignedTreeTargetOverlap(sourceCoords, targetCoords, alignment, deltaX, deltaY, newOverlap, source.x, source.y),
        position: newOverlap ? 'e' : (alignment === 'v' ? (deltaY < 0 ? 't' : 'b') : (deltaX < 0 ? 'l' : 'r'))
      };
    },
    gt: function (a, b) {
      return a.overlap > b.overlap;
    },
    initial: function () {
      return {
        overlap: 0,
        position: 'e'
      };
    }
  };
};

module.exports.alignedTreeTargetOverlap = function (sourceCoords, targetCoords, alignment, deltaX, deltaY, newOverlap, touchX, touchY) {
  if (targetCoords.bottom < sourceCoords.top || targetCoords.top > sourceCoords.bottom || targetCoords.right < sourceCoords.left || targetCoords.left > sourceCoords.right) {
    return 0;
  }

  var height, width;
  if (newOverlap) {
    if (alignment === 'v') {
      height = sourceCoords.bottom - sourceCoords.top;
      if (targetCoords.bottom > touchY && targetCoords.top < touchY) {
        return height;
      } else if (targetCoords.bottom < touchY) {
        return height - (touchY - targetCoords.bottom);
      } else {
        return height - (targetCoords.top - touchY);
      }
    } else if (alignment === 'h') {
      width = sourceCoords.right - sourceCoords.left;
      if (targetCoords.right > touchX && targetCoords.left < touchX) {
        return width;
      } else if (targetCoords.right < touchX) {
        return width - (touchX - targetCoords.left);
      } else {
        return width - (targetCoords.right - touchX);
      }
    }
  } else {
    if (alignment === 'v') {
      height = sourceCoords.bottom - sourceCoords.top;
      if (deltaY < 0) {
        if (targetCoords.bottom > sourceCoords.top && targetCoords.top < sourceCoords.top) {
          return height;
        } else {
          return height - (targetCoords.top - sourceCoords.top);
        }
      } else {
        if (targetCoords.bottom > sourceCoords.bottom && targetCoords.top < sourceCoords.bottom) {
          return height;
        } else {
          return height - (sourceCoords.bottom - targetCoords.bottom);
        }
      }
    } else if (alignment === 'h') {
      width = sourceCoords.right - sourceCoords.left;
      if (deltaX < 0) {
        if (targetCoords.right > sourceCoords.left && targetCoords.left < sourceCoords.left) {
          return width;
        } else {
          return width - (targetCoords.left - sourceCoords.left);
        }
      } else {
        if (targetCoords.right > sourceCoords.right && targetCoords.left < sourceCoords.right) {
          return width;
        } else {
          return width - (sourceCoords.right - targetCoords.right);
        }
      }
    }
  }
};