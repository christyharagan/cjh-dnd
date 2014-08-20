'use strict';

var _ = require('underscore');
var _targetTreeMixin = require('../targetTreeDecorator');
var dndSourceFactory = require('../source');

var CSS_TRANSFORM = _.filter(['webkitTransform', 'transform', '-webkit-transform', 'webkit-transform',
  '-moz-transform', 'moz-transform', 'MozTransform', 'mozTransform', 'msTransform'], function (cssProp) {
  return document.documentElement.style[cssProp] !== undefined;
})[0];

module.exports.getSourceCoords = function (source) {
  return source.origElement.getBoundingClientRect();
};

module.exports.move = function (restriction) {
  if (restriction instanceof HTMLElement) {
    var restrictionElement = restriction;
    restriction = function (source, deltaX, deltaY) {
      var boundingBox = restrictionElement.getBoundingClientRect();

      if ((source.origCoords.top + deltaY) < boundingBox.top) {
        deltaY = boundingBox.top - source.origCoords.top;
      } else if (boundingBox.top !== boundingBox.bottom && (source.origCoords.bottom + deltaY) > boundingBox.bottom) {
        deltaY = boundingBox.bottom - source.origCoords.bottom;
      }

      if ((source.origCoords.left + deltaX) < boundingBox.left) {
        deltaX = boundingBox.left - source.origCoords.left;
      } else if ((source.origCoords.right + deltaX) > boundingBox.right) {
        deltaX = boundingBox.right - source.origCoords.right;
      }

      return {
        x: deltaX,
        y: deltaY
      };
    };
  }

  return function (source) {
    var deltaX = source.x - source.startX;
    var deltaY = source.y - source.startY;
    var delta = !restriction ? {x: deltaX, y: deltaY} : restriction(source, deltaX, deltaY);

    source.element.style[CSS_TRANSFORM] = 'translate3d(' + (delta.x) + 'px, ' + (delta.y) + 'px, 0)';

    return {
      top: source.origCoords.top + delta.y,
      left: source.origCoords.left + delta.x,
      bottom: source.origCoords.bottom + delta.y,
      right: source.origCoords.right + delta.x
    };
  };
};

module.exports.createTempNode = function (element, parent, indexForTemp) {
  module.exports.insertTempElement(element, parent, indexForTemp);
  return parent.addNode({
    dndTarget: {element: element}
  }, indexForTemp);
};

module.exports.insertTempElement = function (tempElement, parent, indexForTemp) {
  var parentElement = parent.dndTarget.element;
  if (parent.children.length === indexForTemp) {
    parentElement.appendChild(tempElement);
  } else {
    parentElement.insertBefore(tempElement, parent.children[indexForTemp + 1].dndTarget.element);
  }
};

module.exports.removeTempNode = function (node) {
  var element = node.dndTarget.element;

  element.parentNode.removeChild(element);

  node.parent.removeNode(node.index);
};

module.exports.clone = function (element, parent) {
  var parentCoords = element.getBoundingClientRect();
  var coords = element.getBoundingClientRect();
  var clone = element.cloneNode(true);
  clone.style.width = coords.width + 'px';
  clone.style.height = coords.height + 'px';
  clone.style.top = (coords.top - parentCoords.top) + 'px';
  clone.style.left = (coords.left - parentCoords.left) + 'px';

  parent.appendChild(clone);

  return clone;
};

module.exports.createSource = function (model, element, dragParent, getTargets, makeDraggable, unmakeDraggable, onDragStart, onDrag, onDrop, shouldClone, selectionType, getXY) {
  var parentBackup;
  var styleBackup;

  var _makeDraggable = function (source) {
    var node = source.model;
    var nodeElement = source.origElement;
    node.dndSource.originalInnerHTML = nodeElement.innerHTML;

    var draggableElement;
    var nodeCoords = nodeElement.getBoundingClientRect();
    var parentCoords = dragParent.getBoundingClientRect();
    var coords = {
      width: nodeCoords.width + 'px',
      height: nodeCoords.height + 'px',
      top: (nodeCoords.top - parentCoords.top) + 'px',
      left: (nodeCoords.left - parentCoords.left) + 'px'
    };

    if (shouldClone(node)) {
      draggableElement = module.exports.clone(nodeElement, dragParent);
    } else {
      parentBackup = nodeElement.parentNode;
      nodeElement.parentNode.removeChild(nodeElement);
      dragParent.appendChild(nodeElement);
      draggableElement = nodeElement;
      styleBackup = {
        display: nodeElement.style.display,
        position: nodeElement.style.position,
        zIndex: nodeElement.style['z-index']
      };
    }
    draggableElement.style.display = 'block';
    draggableElement.style.position = 'absolute';
    draggableElement.style['z-index'] = 50000;

    draggableElement.style.width = coords.width;
    draggableElement.style.height = coords.height;
    draggableElement.style.top = coords.top;
    draggableElement.style.left = coords.left;

    if (makeDraggable) {
      makeDraggable(source, draggableElement);
    }

    return draggableElement;
  };
  var _unmakeDraggable = function (source) {
    var node = source.model;

    if (shouldClone(node)) {
      dragParent.removeChild(source.element);
    } else {
      dragParent.removeChild(source.element);
      parentBackup.appendChild(source.element);

      source.element.style.display = styleBackup.display;
      source.element.style.position = styleBackup.position;
      source.element.style['z-index'] = styleBackup['z-index'];

      parentBackup = undefined;
      styleBackup = undefined;
    }
    if (unmakeDraggable) {
      unmakeDraggable(source);
    }
  };

  var sourceArgs = {
    model: model,
    element: element,

    getTargets: getTargets,

    makeDraggable: _makeDraggable,
    unmakeDraggable: _unmakeDraggable,

    onDragStart: onDragStart,
    onDrag: onDrag,
    onDrop: onDrop,

    selectionType: selectionType
  };

  var move = module.exports.move(dragParent);

  var dndSource = dndSourceFactory(module.exports.getSourceCoords, move, getXY);
  return dndSource(sourceArgs);
};

module.exports.createTree = function (element, tree, draggable, droppable, reorderable, createTempNode, removeTempNode, createNode, moveNode) {
  if (droppable || reorderable) {
    if (!tree.dndTarget) {
      tree.dndTarget = {};
    }
    var targetTreeMixin = _targetTreeMixin(function (element) {
        return element.getBoundingClientRect();
      },
      createTempNode, removeTempNode, createNode, moveNode);

    tree.dndTarget.element = element;

    tree.addDecorator(targetTreeMixin);
  }

  if (draggable || reorderable) {
    if (!tree.dndSource) {
      tree.dndSource = {};
    }
    tree.dndSource.element = element;
    tree.dndSource.isDragging = false;
  }
};

module.exports.createNode = function (element, node, draggable, droppable, reorderable, getXY) {
  if (node.root) {
    if (droppable || reorderable) {
      if (!node.dndTarget) {
        node.dndTarget = {};
      }
      node.dndTarget.element = element;

    }
    if (draggable || reorderable) {
      if (!node.dndSource) {
        node.dndSource = {};
      }
      node.dndSource.element = element;

      var makeDraggable = node.dndSource.makeDraggable || (node.root ? node.root.dndSource.makeDraggable : null);
      var unmakeDraggable = node.dndSource.unmakeDraggable || (node.root ? node.root.dndSource.unmakeDraggable : null);
      var getTargets = node.dndSource.getTargets || (node.root ? node.root.dndSource.getTargets : null);
      var shouldClone = function (node) {
        return (node.dndSource.clone !== undefined && node.dndSource.clone) || (node.dndSource.clone === undefined && node.root.dndSource.clone);
      };
      var selectionType = node.dndSource.selectionType || (node.root ? node.root.dndSource.selectionType : null);
      var dragParent = node.dndSource.dragParent || (node.root ? node.root.dndSource.dragParent : element.parentNode);

      var onDragStart = node.dndSource.onDragStart;

      node.dndSource.onDragStart = function (source) {
        if (reorderable) {
          node.dndTarget.isOriginal = true;
          node.root.dndTarget.onDragStart(source);
        }

        if (onDragStart) {
          onDragStart(source);
        }
      };

      var onDrop = node.dndSource.onDrop;
      node.dndSource.onDrop = function (source) {
        if (reorderable) {
          delete node.dndTarget.isOriginal;
        }

        if (onDrop) {
          onDrop(source);
        }
      };

      node.dndSource = module.exports.createSource(node,
        element,
        dragParent,
        getTargets,
        makeDraggable,
        unmakeDraggable,
        node.dndSource.onDragStart,
        node.dndSource.onDrag,
        node.dndSource.onDrop,
        shouldClone,
        selectionType,
        getXY);

      var _onDragStart = node.dndSource.onDragStart;
      node.dndSource.onDragStart = function (e) {
        if (!node.root.dndSource.isDragging) {
          node.root.dndSource.isDragging = true;
          _onDragStart(e);
        }
      };
      var _onDrop = node.dndSource.onDrop;
      node.dndSource.onDrop = function (e) {
        if (node.root.dndSource.isDragging) {
          delete node.root.dndSource.isDragging;
          _onDrop(e);
        }
      };
    }
  }
};