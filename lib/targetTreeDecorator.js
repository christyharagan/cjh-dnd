'use strict';

module.exports = function (getCoords, createTempNode, removeTempNode, createNode, moveNode) {
  var getLeafNode = function (overTree) {
    if (!overTree.children || overTree.children.length === 0) {
      return overTree;
    } else {
      return getLeafNode(overTree.children[0]);
    }
  };

  var getSrcTgtMid = function (source, tgtNode) {
    var srcRect = getCoords(source.element);
    var tgtRect = getCoords(tgtNode.dndTarget.element);

    var srcMid;
    var tgtHeight = tgtRect.bottom - tgtRect.top;
    var position = source.overlapTree.dndOverlap.overlap.position;

    if (srcRect.bottom - srcRect.top > tgtHeight) {
      if (position === 't') {
        srcMid = (2 * srcRect.top + tgtHeight) / 2;
      } else if (position === 'b') {
        srcMid = (2 * srcRect.bottom - tgtHeight) / 2;
      } else {
        srcMid = source.y;
      }
    } else {
      srcMid = (srcRect.top + srcRect.bottom) / 2;
    }
    var tgtMid = (tgtRect.top + tgtRect.bottom) / 2;

    return srcMid === tgtMid ? 0 : (srcMid < tgtMid ? -1 : 1);
  };

  return {
    init: function (node) {
      if (!node.dndTarget) {
        node.dndTarget = {};
      }

      if (node.root) {
        node.dndTarget.getCoords = function () {
          return getCoords(node.dndTarget.element);
        };

        if (!node.dndTarget.model) {
          node.dndTarget.model = node;
        }
      } else {
        var temp;

        var setTemp = function (indexForTemp, parent, replacedNode, source, leafNode) {
          if (temp && temp.node) {
            if (temp.node.parent === parent && temp.node.index < indexForTemp) {
              indexForTemp--;
            }
          }
          removeTemp();

          temp = {};
          if (replacedNode) {
            temp.replacedNode = replacedNode;
          }

          temp.node = createTempNode(indexForTemp, parent, replacedNode, source, leafNode);
          temp.node.dndTarget.isTemp = true;
          if (!temp.node.dndTarget.getCoords) {
            temp.node.dndTarget.getCoords = function() {
              return getCoords(node.dndTarget.element);
            };
          }
        };

        var removeTemp = function () {
          if (temp) {
            removeTempNode(temp.node, temp.replacedNode);
            delete temp.replacedNode.dndTarget.isTemp;
            temp = null;
          }
        };

        node.dndTarget.onDragStart = function(source) {
          setTemp(source.origElement, null, null, source.model, source, source.model);
        };

        node.dndTarget.onDrag = function (source, overlapTreeForRoot, prevOverlapTreeForRoot) {
          if (overlapTreeForRoot.length === 0) {
            removeTemp();
          } else {
            overlapTreeForRoot = overlapTreeForRoot[0];
            var leafNode = getLeafNode(overlapTreeForRoot).dndOverlap.target;

            if (!leafNode.dndTarget.isTemp) {
              var parent = leafNode.parent;

              var shouldReplace = node.dndTarget.shouldReplace;

              if (shouldReplace && shouldReplace(source, leafNode, overlapTreeForRoot, prevOverlapTreeForRoot, 0)) {
                setTemp(null, null, parent.children[leafNode.index], source, leafNode);
              } else {
                var mid = getSrcTgtMid(source, leafNode);
                if (mid < 0) {
                  if (leafNode.index === 0 || (!parent.children[leafNode.index - 1].dndTarget.isTemp)){
                    if (leafNode.index > 0 && shouldReplace && shouldReplace(source, leafNode, overlapTreeForRoot, prevOverlapTreeForRoot, -1)) {
                      setTemp(null, null, parent.children[leafNode.index - 1], source, leafNode);
                    } else {
                      setTemp(leafNode.index, parent, null, source, leafNode);
                    }
                  }
                } else if (mid > 0) {
                  if (leafNode.index === parent.children.length - 1 || (!parent.children[leafNode.index + 1].dndTarget.isTemp)){
                    if (leafNode.index < parent.children.length - 1 && shouldReplace && shouldReplace(source, leafNode, overlapTreeForRoot, prevOverlapTreeForRoot, 1)) {
                      setTemp(null, null, parent.children[leafNode.index + 1], source, leafNode);
                    } else {
                      setTemp(leafNode.index + 1, parent, null, source, leafNode);
                    }
                  }
                }
              }
            }
          }
        };

        var onDrop = node.dndTarget.onDrop;
        node.dndTarget.onDrop = function (source, overlapTreeForRoot) {
          if (temp) {
            var _temp = temp;
            var srcNode = source.model;

            removeTemp();

            if (srcNode.root === node && !_temp.replacedNode) {
              if (_temp.node.parent === srcNode.parent && srcNode.index < _temp.node.index) {
                _temp.node.index--;
              }
              moveNode(source, _temp.node.index, _temp.node.parent);
            } else {
              createNode(source, _temp.node.index, _temp.node.parent);
            }

            if (onDrop) {
              onDrop(source, overlapTreeForRoot, _temp);
            }
          } else if (onDrop) {
            onDrop(source, overlapTreeForRoot);
          }
        };
      }
    }
  };
};