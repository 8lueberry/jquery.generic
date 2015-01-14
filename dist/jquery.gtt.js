/*
 * Generic - jQuery Plugin
 *
 * Example and documentation at: http://danlevan.github.io/jquery.generic/
 *
 * Copyright (c) 2014 Dan Le Van
 *
 * Version: 1.0.0 (Wed Jan 14 2015)
 * Requires: jQuery v1.7+
 * * Licensed under the MIT license:
 *   https://raw.github.com/danlevan/jquery.generic/master/LICENSE
 */
(function(factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(['jquery'], factory);
  } else {
      // Browser globals
      factory(jQuery);
  }
}(function($) {

  ///////////////////////////////////////////////////////
  // Jquery plugin
  ///////////////////////////////////////////////////////
  $.fn.gt = function (options, args) {
    var dataKey = '_gt';
    var el = $(this.first());
    var instance = el.data(dataKey);

    // create an instance (and store it) if it hasn't been created
    if (!instance) {
      instance = new GenericTip(el[0], options);
      el.data(dataKey, instance);
    }

    return instance;
  };

  ///////////////////////////////////////////////////////
  // Defaults
  ///////////////////////////////////////////////////////
  $.fn.gt.defaults = {
    css: {
      tooltip: 'gt',
      visible: 'visible',
    },
  };

  ///////////////////////////////////////////////////////
  // Generic box implementation
  ///////////////////////////////////////////////////////

  function GenericTip(item, options) {
    var that = this;

    // elements
    this.element = item;
    this.$element = $(item);

    // merge options with default
    this.options = $.extend(true, {}, $.fn.gt.defaults, options);

    // see what type of tooltip
    var data = that.$element.attr('title');
    that.$element.removeAttr('title');

    // create the tooltip element
    var elPosition = getPosition(that.$element);
    that.$tooltip = $('<div>')
      .addClass(that.options.css.tooltip)

      // position
      .css({
        visibility: 'hidden',
        position: 'absolute',
        top: elPosition.top + elPosition.height,
        left: elPosition.left,
      })

      // text
      .html(data)

      // mouse events
      .on('mouseover', function() {
        that.show();
      })
      .on('mouseout', function() {
        that.hide();
      });

    that.$element.after(that.$tooltip);

    // makes sure the element is flushed to the layout engine
    // ref: http://timtaubert.de/blog/2012/09/css-transitions-for-dynamically-created-dom-elements/
    window.getComputedStyle(that.$tooltip[0]).visibility;

    ///////////////////////////////////////////////////////
    // Public methods
    ///////////////////////////////////////////////////////

    this.show = function(data) {
      that.$tooltip
        .addClass(that.options.css.visible)
        .css({
          visibility: 'visible',
        });
    };

    this.hide = function() {
      that.$tooltip
        .removeClass(that.options.css.visible)
        .css({
          visibility: 'hidden',
        });
    };

    ///////////////////////////////////////////////////////
    // Private
    ///////////////////////////////////////////////////////

    function getPosition(object) {
      var $object = $(object);
      var senderPos = $object.offset();

      return {
        top: senderPos.top,
        left: senderPos.left,
        width: $object.outerWidth(),
        height: $object.outerHeight()
      };
    };
  };
}));
