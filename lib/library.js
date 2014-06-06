'use strict';

var targets = {};

module.exports = {
  getTargets: function (srcArgs) {
    var _targets = [];
    for (var i = 0; i < srcArgs.tags.length; i++) {
      var target = targets[srcArgs.tags[i]];
      if (target) {
        _targets.push(target);
      }
    }
    return _targets;
  },

  addTarget: function (target) {
    targets[target.tag] = target;
  },

  removeTarget: function (target) {
    delete targets[target.tag];
  }
};