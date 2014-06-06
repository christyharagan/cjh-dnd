'use strict';

module.exports = function (getCoords, createTemp, removeTemp, replaceWithTemp, restoreElement) {
  var getLeafNode = function (overTree) {
    if (overTree[1].length === 0) {
      return overTree[0];
    } else {
      return getLeafNode(overTree[1][0]);
    }
  };

  var handleAddTemp = function (e, srcNode, tgtNode, partitionedOverTree) {
    var indexForTemp = shouldAddTemp(srcNode, tgtNode);
    if (indexForTemp > -1) {
      var temp = createTemp(e, srcNode, tgtNode, indexForTemp, partitionedOverTree);
      tgtNode.parentList.dndTarget.tempContainer.addTemp(temp, indexForTemp);
    }
  };

  var createTempDndTarget = function (tempContainer, nodeList) {
    tempContainer.target = {
      element: tempContainer.temp,
      parent: nodeList.parentNode.dndTarget,
      children: []
    };
    nodeList.parentNode.dndTarget.splice(tempContainer.index, 0, tempContainer.target);
  };

  var removeTempDndTarget = function (tempContainer, nodeList) {
    nodeList.parentNode.dndTarget.splice(tempContainer.index, 1);
  };

  var shouldAddTemp = function (srcNode, tgtNode) {
    var srcRect = getCoords(srcNode);
    var tgtRect = getCoords(tgtNode);

    var srcMid = (srcRect.top + srcRect.bottom) / 2;
    var tgtMid = (tgtRect.top + tgtRect.bottom) / 2;

    var previousTempContainer = tgtNode.root.dndTarget.getTempContainer();
    if (srcMid < tgtMid) {
      if (previousTempContainer !== tgtNode.parentList.dndTarget.tempContainer || tgtNode.parentList.dndTarget.tempContainer.index !== tgtNode.index) {
        return tgtNode.index;
      }
    } else if (srcMid > tgtMid) {
      if (previousTempContainer !== tgtNode.parentList.dndTarget.tempContainer || tgtNode.parentList.dndTarget.tempContainer.index !== tgtNode.index + 1) {
        return tgtNode.index + 1;
      }
    }
    return -1;
  };

  return {
    root: {
      init: function (root) {
        var tempContainer;

        root.dndTarget.onDrop = function (e) {
          tempContainer.onDrop(e);
        };
        root.dndTarget.setTempContainer = function (container) {
          if (tempContainer) {
            tempContainer.removeTemp();
          }
          tempContainer = container;
        };
        root.dndTarget.getTempContainer = function () {
          return tempContainer;
        };
        if (!root.dndTarget.model) {
          root.dndTarget.model = root;
        }
        if (!root.dndTarget.selectionType) {
          root.dndTarget.selectionType = 'v';
        }
        if (!root.dndTarget.sort) {
          root.sort = 'v';
        }

        if (root.dndTarget.announceTarget) {
          root.dndTarget.announceTarget(root.dndTarget);
        }

        return root;
      }
    },

    node: {
      destroy: function (node) {
        if (node.dndTarget.dndTarget) {
          node.dndTarget.dndTarget.remove();
          delete node.dndTarget;
        }
      }
    },

    nodeList: {
      init: function (nodeList) {
        var tempContainer = {
          temp: null,
          index: -1,

          wasReplaced: false,
          replacedNode: null,

          onDrop: function (e, srcNode) {
            removeTemp(nodeList, tempContainer.temp, tempContainer.index);

            if (srcNode.root === nodeList.root) {
              nodeList.root.moveNode(srcNode, nodeList, tempContainer.index);
            } else {
              nodeList.addNode({dndTarget: {srcNode: srcNode}}, tempContainer.index);
            }
          },

          addTemp: function (temp, index, wasReplaced, replacedNode) {
            tempContainer.temp = temp;
            tempContainer.index = index;
            tempContainer.wasReplaced = wasReplaced;
            tempContainer.replacedNode = replacedNode;

            createTempDndTarget(tempContainer, nodeList);

            nodeList.root.dndTarget.setTempContainer(tempContainer);
          },

          removeTemp: function () {
            removeTempDndTarget(tempContainer, nodeList);

            if (tempContainer.wasReplaced) {
              restoreElement(nodeList, tempContainer.replacedNode, tempContainer.temp, tempContainer.index);

              tempContainer.wasReplaced = false;
              tempContainer.replacedNode = null;
            } else {
              removeTemp(nodeList, tempContainer.temp, tempContainer.index);
            }

            tempContainer.temp = null;
            tempContainer.index = -1;
          }
        };
        nodeList.dndTarget = {
          tempContainer: tempContainer
        };
      },

      addNode: function (node) {
        var onOver, onDrag, onOut, onDrop;

        if (!node.dndTarget) {
          node.dndTarget = {};
        } else {
          onOver = node.dndTarget.onOver;
          onDrag = node.dndTarget.onDrag;
          onOut = node.dndTarget.onOut;
          onDrop = node.dndTarget.onDrop;
        }
        node.dndTarget.onOver = function (e, srcNode, partitionedOverTree, isLeaf) {
          if (node.model.shouldReplace && node.model.shouldReplace(e, srcNode, node, partitionedOverTree)) {
            var temp = replaceWithTemp(e, srcNode, node, partitionedOverTree);
            node.parentList.dndTarget.tempContainer.addTemp(temp, node.index, true, node);
          } else {
            handleAddTemp(e, srcNode, node, partitionedOverTree);
          }
          if (onOver) {
            onOver(e, srcNode, partitionedOverTree, isLeaf);
          }
        };
        node.dndTarget.onDrag = function (e, srcNode, partitionedOverTree, isLeaf) {
          handleAddTemp(e, srcNode, node, partitionedOverTree);
          if (onDrag) {
            onDrag(e, srcNode, partitionedOverTree, isLeaf);
          }
        };
        node.dndTarget.onOut = function (e, srcNode, partitionedOverTree, isLeaf) {
          if (node.parentList.dndTarget.tempContainer.temp && getLeafNode(partitionedOverTree[0]).element === node.parentList.dndTarget.temp) {
            node.parentList.dndTarget.setTempContainer(null);
          }
          if (onOut) {
            onOut(e, srcNode, partitionedOverTree, isLeaf);
          }
        };
        node.dndTarget.onDrop = function (e, srcNode, overTree, isLeaf) {
          node.root.dndTarget.onDrop(e);
          if (onDrop) {
            onDrop(e, srcNode, overTree, isLeaf);
          }
        };

        if (!node.dndTarget.model) {
          node.dndTarget.model = node;
        }
        if (!node.dndTarget.children) {
          node.dndTarget.children = [];
        }
        node.dndTarget.parent = node.parentList.parentNode.dndTarget;
        node.parentList.parentNode.dndTarget.children.push.splice(node.index, 0, node.dndTarget);
      }
    }
  };
};