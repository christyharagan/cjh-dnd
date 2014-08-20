'use strict';

var dndSourceFactory = require('./source');

module.exports = function (getCoords, move) {
  var dndSource = dndSourceFactory(getCoords, move);

  return {
    destroy: function (node) {
      node.dndSource.destroy();
      delete node.dndSource;
    },

    addNode: function (node) {
      if (!node.dndSource) {
        node.dndSource = {};
      }

      var makeDraggable = node.dndSource.makeDraggable || node.root.dndSource.makeDraggable;
      var unmakeDraggable = node.dndSource.unmakeDraggable || node.root.dndSource.unmakeDraggable;
      var getTargets = node.dndSource.getTargets || node.root.dndSource.getTargets;

      var sourceArgs = {
        model: node,
        element: node.dndSource.element,

        getTargets: getTargets,

        makeDraggable: makeDraggable,
        unmakeDraggable: unmakeDraggable,

        onDragStart: node.dndSource.onDragStart,

        onDrag: node.dndSource.onDrag,

        onDrop: node.dndSource.onDrop
      };

      node.dndSource = dndSource(sourceArgs);
    }
  };
};