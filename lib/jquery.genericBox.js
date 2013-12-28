/*
* GenericBox - jQuery Plugin
* Simple lightbox and fancybox alternative
*
* Examples and documentation at:
*
* Copyright (c) 2013 Dan LE VAN
*
* Version: 1.0 (2013/08/15)
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
  $.fn.gb = function (options) {
    var dataKey = '_gb';
    var el = $(this.first());
    var instance = el.data(dataKey);

    // create an instance (and store it) if it hasn't been created
    if (!instance) {
      var dataOptions = el.data('options');
      if (typeof dataOptions === 'string') {
        console.warn('The data-options provided is not a valid JSON: ' + dataOptions);
        dataOptions = {};
      }

      instance = new GenericBox(
        el[0],
        $.extend(
          true,
          {},
          dataOptions ? dataOptions : {},
          options ? options : {}
        )
      );

      el.data(dataKey, instance);
    }

    // override options
    else if(options) {
      instance.options = $.extend(true, {}, instance.options, options);
    }

    return instance;
  };

  ///////////////////////////////////////////////////////
  // Defaults
  ///////////////////////////////////////////////////////
  $.fn.gb.defaults = {
    css: {
      wrap: 'gb',
      close: 'gbClose',
      box: 'gbBox',
      overlay: 'gbOverlay',
      visible: 'visible',
    },

    // hide box on overlay click
    hideOnClickOverlay: true,

    // hide box on esc key pressed
    hideOnEsc: true,

    // remove the focus on the button clicked
    blurTrigger: true,

    // callback
    onShow: null,
    onHide: null,
    onHideStart: null,
  };

  ///////////////////////////////////////////////////////
  // Generic box implementation
  ///////////////////////////////////////////////////////

  function GenericBox(box, options) {
    var that = this;
    this.el = box;
    this.$el = $(box);

    // merge options with default
    this.options = $.extend(true, {}, $.fn.gb.defaults, options);

    // get the element size
    var width = that.$el.outerWidth();
    var height = that.$el.outerHeight();

    //
    // basic generic box elements
    //
    that.$el
      .wrap('<div class="' + that.options.css.wrap + '">')
      .addClass(that.options.css.box)

      // center the box
      .css({
        display: 'block',
        visibility: 'hidden',
        position: 'fixed',
        top: '50%',
        left: '50%',
        marginTop: '-' + (Math.round(height/2)) + 'px', //TODO: border offset
        marginLeft: '-' + (Math.round(width/2)) + 'px', //TODO: border offset
      })

      // disable wheel action of the body
      .on('mousewheel.gb', function(e) {
        e.preventDefault();
      });

    //
    // close button
    //
    that.$close = $('<div class="' + that.options.css.close + '">')

      // close action
      .on('click', function() {
        that.hide();
      })

      // in the element
      .prependTo(that.$el);

    //
    // overlay
    //
    that.$overlay = $('<div>')
      .addClass(that.options.css.overlay)

      // full screen the box
      .css({
        visibility: 'hidden',
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
      })

      // disable wheel action of the body
      .on('mousewheel.gb', function(e) {
        e.preventDefault();
      })

      // in the wrapper but before the element
      .insertBefore(that.$el);

    // if gb is called gb().show(), we have to make sure that the content is
    // flushed to the DOM or the css animation will fail
    that.$overlay.flushCss();

    ///////////////////////////////////////////////////////
    // Public methods
    ///////////////////////////////////////////////////////

    //
    // Shows the popup
    //
    this.show = function() {

      // get the element size
      var width = that.$el.outerWidth();
      var height = that.$el.outerHeight();

      // show overlay
      that.$overlay
        .css({
          visibility: 'visible',
        })
        .addClass(that.options.css.visible);

      // show element
      that.$el
        .css({
          visibility: 'visible',
          marginTop: '-' + (Math.round(height/2)) + 'px', //TODO: border offset
          marginLeft: '-' + (Math.round(width/2)) + 'px', //TODO: border offset
        })
        .addClass(that.options.css.visible);

      // listen to keyboard
      if (that.options.hideOnEsc) {
        $(window).on('keydown.gb', onKeyPress);
      }

      // register overlay click
      if (that.options.hideOnClickOverlay) {
        that.$overlay.on('click.gb', function() { that.hide(); });
      }

      // blur the document element button
      if (that.options.blurTrigger) {
        $(':focus').blur();
      }

      return that;
    };

    //
    // Hides the popup
    //
    this.hide = function() {

      // unregister keypress event
      if (that.options.hideOnEsc) {
        $(window).off('keydown.gb', onKeyPress);
      }

      // unregister overlay click
      if (that.options.hideOnClickOverlay) {
        that.$overlay.off('click.gb');
      }

      // before hide callback
      if ($.isFunction(that.options.onHideStart)) {
        that.options.onHideStart.call(that);
      }

      // hide overlay
      that.$overlay
        .removeClass(that.options.css.visible)
        .css({
          visibility: 'hidden',
        });

      // hide element
      that.$el
        .removeClass(that.options.css.visible)
        .css({
          visibility: 'hidden',
        });

      // after hide callback
      if ($.isFunction(that.options.onHide)) {
        that.options.onHide.call(that);
      }

      return that;
    };

    //
    // Destroys the popup items (including original item)
    //
    this.destroy = function() {
      that.$el
        .parents('.' + that.options.css.wrap)
        .remove();
    };

    ///////////////////////////////////////////////////////
    // Private methods
    ///////////////////////////////////////////////////////

    var keys = {
      ESC: 27,
    };

    function onKeyPress(e) {
      switch (e.keyCode) {
        case keys.ESC:
          that.hide();
          break;
        default:
          return;
      }

      // Cancel event if function did not return:
      e.stopImmediatePropagation();
      e.preventDefault();
    };
  };

  ///////////////////////////////////////////////////////
  // Jquery extension
  ///////////////////////////////////////////////////////

  //
  // Flushes the css to the DOM
  // ref: http://timtaubert.de/blog/2012/09/css-transitions-for-dynamically-created-dom-elements/
  //
  $.fn.flushCss = function() {

    // calling this will flush any pending css to be written
    window.getComputedStyle(this[0]).visibility;
    return this;
  };
}));