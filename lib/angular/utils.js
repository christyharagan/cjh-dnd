'use strict';

module.exports.clone = function (element, parent) {
  var coords = element.getBoundingClientRect();
  var clone = element.cloneNode(true);
  clone.style.width = coords.width + 'px';
  clone.style.height = coords.height + 'px';
  clone.style.top = coords.top + 'px';
  clone.style.left = coords.left + 'px';

  parent.appendChild(element);
};