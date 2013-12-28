/*
* GenericTip - jQuery Plugin
* Simple tooltip
*
* Examples and documentation at:
*
* Copyright (c) 2013 Dan LE VAN
*
* Version: 1.0 (2013/09/19)
* Requires: jQuery v1.3+
*
* Licensed under the MIT license:
*   http://www.opensource.org/licenses/mit-license.php
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
  $.fn.gti = function (options, args) {
    var dataKey = '_gti';
    var el = $(this.first());
    var instance = el.data(dataKey);

    // create an instance (and store it) if it hasn't been created
    if (!instance) {
      instance = new GenericInput(el[0], options);
      el.data(dataKey, instance);
    }

    return instance;
  };

  ///////////////////////////////////////////////////////
  // Defaults
  ///////////////////////////////////////////////////////
  $.fn.gti.defaults = {

    // css classes
    css: {
      wrap: 'gti',
    },

    // prefilled tags
    tags: [],
  };

  ///////////////////////////////////////////////////////
  // Generic box implementation
  ///////////////////////////////////////////////////////

  function GenericInput(item, options) {
    var that = this;

    // elements
    this.element = item;
    this.$element = $(item);

    // merge options with default
    this.options = $.extend(true, {}, $.fn.gti.defaults, options);

    // list of tags
    this.tags = [];

    ///////////////////////////////////////////////////////
    // Public methods
    ///////////////////////////////////////////////////////

    //
    // Adds a tag to the list
    //
    this.add = function(tag, _updateUI, _updateValue) {
      var tagValue = tag ? tag.trim() : null;
      if (!tagValue) {
        return;
      }

      // add to internal list
      this.tags.push(tagValue);

      // update the ui
      if (_updateUI === undefined || _updateUI) {
        updateUI();
      }

      // update the raw value
      if (_updateValue === undefined || _updateValue) {
        updateValue();
      }
    };

    //
    // Removes a tag from the list
    //
    this.remove = function(tag) {
      // find the tag
      var index = this.tags.indexOf(tag);
      if (index < 0) {
        return;
      }

      // remove from internal
      this.tags.splice(index, 1);

      // update the ui
      updateUI();

      // update the raw value
      updateValue();
    };

    ///////////////////////////////////////////////////////
    // Private
    ///////////////////////////////////////////////////////

    function init() {

      // html
      that.$wrapper = $('<div>')
        .addClass(that.options.css.wrap)
        .append('<ul>')
        .append('<div><input type="text" /></div></div>');

      // convert the input
      that.$value = that.$element
        .after(that.$wrapper)
        .attr('type', 'hidden');

      // remove tags
      that.$tags = that.$wrapper
        .find('ul')
        .on('click', 'li .close', function() {
          var tag = $(this).parent().find('.text').html();
          that.remove(tag);
        });

      // initialize default
      var tags = that.options.tags.length>0 ? that.options.tags : that.$value.val().split(',');
      for(var i=0; i<tags.length; i++) {
        that.add(tags[i], true, false);
      }

      // add/edit tags
      that.$input = that.$wrapper
        .find('input')
        .on('keydown', keyDownEvent)
        .on('blur', convertTextToTag);
    };

    //
    // Keydown event handler
    //

    var keys = {
      ENTER: 13,
      SPACE: 32,
      BACKSPACE: 8,
      COMMA: 188,
    };

    function keyDownEvent(e) {
      switch (e.keyCode) {
        case keys.ENTER:
        case keys.SPACE:
        case keys.COMMA:
          e.preventDefault();

          convertTextToTag();
          break;
        case keys.BACKSPACE:

          // remove last tag
          if (that.$input.val() === '') {
            var $lastTag = that.$tags.children().last();
            if ($lastTag.length > 0) {
              e.preventDefault();

              var lastTag = $lastTag.find('.text').html()
              that.$input.val(lastTag);
              that.remove(lastTag);
            }
          }
          break;
        default:
          return;
      }
    };

    //
    // Converts input text value to tag
    //
    function convertTextToTag() {
      if (that.$input.val() === '') {
        return;
      }

      that.add(that.$input.val());
      that.$input.val('');
    };

    //
    // Updates the ui
    //
    function updateUI() {
      that.$tags.html('');
      that.tags.forEach(function(tag) {
        that.$tags.append(
          template(tag)
        );
      });
    };

    //
    // Updates the raw value of the hidden input
    //
    function updateValue() {
      that.$value
        .val(that.tags.join(','))
        .trigger('change');
    };

    //
    // Tag item template
    //
    function template(tag) {
      return '<li>'
        + '<div class="text">' + tag + '</div>'
        + '<div class="close"></div>'
        + '</li>';
    };

    ///////////////////////////////////////////////////////
    // Run
    ///////////////////////////////////////////////////////

    init();
  };

  ///////////////////////////////////////////////////////
  // Jquery extension
  ///////////////////////////////////////////////////////

  //
  // Flushes the css to the DOM
  //
  $.fn.flushCss = function() {

    // calling this will flush any pending css to be written
    window.getComputedStyle(this[0]).visibility;
    return this;
  };
}));