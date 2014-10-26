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

  //////////////////////////////////////////////////////////////////////////////
  // Jquery plugin
  //////////////////////////////////////////////////////////////////////////////

  $.fn.gb = function (options) {
    var dataKey = '_gb';

    var result = this.map(function() {

      var el = $(this);
      var instance = el.data(dataKey);

      // already created
      if (instance) {
        return instance;
      }

      // create an instance (and store it)
      var dataOptions = el.data('gb');
      if (typeof dataOptions === 'string') {
        console.warn(
          'The data-options provided is not a valid JSON: ' + dataOptions
        );
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
      return instance;
    });

    return result.length === 1 ? result[0] : result;
  };

  //////////////////////////////////////////////////////////////////////////////
  // Defaults
  //////////////////////////////////////////////////////////////////////////////

  $.fn.gb.defaults = {
    css: {
      wrap: 'gb',
      close: 'gbClose',
      box: 'gbBox',
      popup: 'gbPopup',
      overlay: 'gbOverlay',
      visible: 'visible',
    },

    // hide box on overlay click
    hideOnClickOverlay: true,

    // hide box on esc key
    hideOnEsc: true,

    // remove the focus on the button clicked
    blurTrigger: true,

    // locks the scrolling of the background when there is a popup
    lockBackgroundScroll: true,

    // when gb is initialized (DOM ready)
    onInitialize: null,

    // before show is starting (DOM not ready)
    onShowStart: null,

    // box is ready (DOM ready)
    onShow: null,

    // before hide is called
    onHideStart: null,

    // box is starting to hide
    onHide: null,

    // animation events (show or hide)
    onAnimationStart: null,
    onAnimationEnd: null,

    // show animation events
    onShowAnimationStart: null,
    onShowAnimationEnd: null,

    // hide animation events
    onHideAnimationStart: null,
    onHideAnimationEnd: null,

    // key pressed
    onKey: null,
  };

  //////////////////////////////////////////////////////////////////////////////
  // Generic box implementation
  //////////////////////////////////////////////////////////////////////////////

  function GenericBox(box, options) {
    var that = this;
    that.el = box;
    that.$el = $(box);
    that.isVisible = false;

    // merge options with default
    that.options = $.extend(true, {}, $.fn.gb.defaults, options);

    // built
    buildBody();
    handleScrolling(); // handle the scrolling of the elements
    registerEvents();

    trigger('initialize');

    // if gb is called gb().show(), we have to make sure that the content is
    // flushed to the DOM or the css animation will fail
    flushCss();

    ////////////////////////////////////////////////////////////////////////////
    // Public methods
    ////////////////////////////////////////////////////////////////////////////

    //
    // Shows the popup
    //
    that.show = function show() {
      var that = this;

      // already shown
      if (that.isVisible) {
        return;
      }

      // event before show
      if (!proceedTrigger('showStart')) {
        return;
      }

      // container visible
      that.$container
        .addClass(that.options.css.visible);

      // listen to keyboard
      // bind the event first (LIFO)
      bindFirst(window, 'keydown.gb', onKeyPress);

      // register overlay click
      if (that.options.hideOnClickOverlay) {
        that.$overlay.on('click.gb', function() { that.hide(); });
      }

      // blur the document element button
      if (that.options.blurTrigger) {
        $(':focus').blur();
      }

      // event after show
      trigger('show');

      that.isVisible = true;

      return that; // chaining
    };

    //
    // Hides the popup
    //
    that.hide = function hide() {

      var that = this;

      // already hidden
      if (!that.isVisible) {
        return;
      }

      // event before hide
      if (!proceedTrigger('hideStart')) {
        return;
      }

      // unregister keypress event
      $(window).off('keydown.gb', onKeyPress);

      // unregister overlay click
      if (that.options.hideOnClickOverlay) {
        that.$overlay.off('click.gb');
      }

      // hide container
      that.$container
        .removeClass(that.options.css.visible);

      // event after hide
      trigger('hide');

      that.isVisible = false;

      return that; // chaining
    };

    //
    // Event binding
    //
    that.on = function on(name, fn) {
      that.$container.on(name, fn);

      return that; // chaining
    };

    //
    // Event binding one
    //
    that.one = function one(name, fn) {
      that.$container.one(name, fn);

      return that; // chaining
    };

    //
    // Event unbinding
    //
    that.off = function(name, fn) {
      that.$container.off(name, fn);

      return that;
    };

    //
    // Destroys the popup items (including original item)
    //
    that.destroy = function destroy() {
      that.$container.remove();
    };

    //////////////////////////////////////////////////////////////////////////////
    // Private methods
    //////////////////////////////////////////////////////////////////////////////

    //
    // Build the skeleton
    //
    function buildBody() {
      // element
      that.$el
        .addClass(that.options.css.popup)

        // display the element (hidden by the wrapper)
        .css({
          'display': 'block',
          'pointer-events': 'auto',
        });

      // wrapper
      that.$el
        .wrap('<div class="' + that.options.css.box + '">');

      that.$wrapper = that.$el.parent()
        .css({
          'pointer-events': 'none',
        });

      // container
      that.$container = that.$wrapper
        .wrap('<div class="' + that.options.css.wrap + '">')
        .parent();

      // overlay
      that.$overlay = $('<div>')
        .addClass(that.options.css.overlay)

        // in the wrapper but before the element
        .insertBefore(that.$wrapper);

      // close button
      that.$close = $('<div class="' + that.options.css.close + '">')

        .css({
          'pointer-events': 'auto',
        })

        // close action
        .on('click', function() {
          that.hide();
        })

        // after the element (for z-index)
        .prependTo(that.$wrapper);
    }

    //
    // Binds an event in front of the list (LIFO)
    //
    function bindFirst(obj, name, fn) {

      // push it in
      $(obj).on(name, fn);

      // retrieve the last item and put in in front
      var handlers = $._data(obj, 'events')[name.split('.')[0]];
      var handler = handlers.pop();
      handlers.splice(0, 0, handler);
    }

    //
    // Triggers an event
    //
    function trigger() {
      that.$container.trigger.apply(that.$container, arguments);
    }

    //
    // Triggers and event and allow back communication
    //
    function proceedTrigger(name) {

      var event = jQuery.Event(name);
      event.isActionPrevented = false;
      event.preventAction = function() {
        this.isActionPrevented = true;
      };

      trigger(event);

      return !event.isActionPrevented;
    }

    //
    // Disable wheel action of the body
    //
    function handleScrolling() {
      if (!that.options.lockBackgroundScroll) {
        return;
      }

      that.$overlay.on(
        'DOMMouseScroll mousewheel.gb',
        preventScroll
      );

      that.$close.on(
        'DOMMouseScroll mousewheel.gb',
        preventScroll
      );

      that.$el.on(
        'DOMMouseScroll mousewheel.gb',
        preventScrollPropagation
      );
    }

    //
    // Registers event
    //
    function registerEvents() {

      // from the options, look for any on* property and bind to the event
      $.each(that.options, function(key, value) {
        if (key.indexOf('on') === 0) {

          // remove on and change the first letter to lower case
          var name = key.substring(2);
          name = name[0].toLowerCase() + name.slice(1);

          // attach event
          that.$container.on(name, value);
        }
      });

      // animation start events
      that.$wrapper.on(
        'webkitAnimationStart mozAnimationStart MSAnimationStart ' +
        'oanimationstart animationstart',
        function() {
          trigger('animationStart');

          if (that.isVisible) {
            trigger('showAnimationStart');
          }
          else {
            trigger('hideAnimationStart');
          }
        }
      );

      // animation end events
      that.$wrapper.on(
        'webkitAnimationEnd mozAnimationEnd MSAnimationEnd ' +
        'oanimationend animationend',
        function() {
          trigger('animationEnd');

          if (that.isVisible) {
            trigger('showAnimationEnd');
          }
          else {
            trigger('hideAnimationEnd');
          }
        }
      );

      // partial support for transitions
      that.$wrapper.on(
        'webkitTransitionEnd MSTransitionEnd otransitionend transitionend',
        function() {
          trigger('transitionEnd');

          if (that.isVisible) {
            trigger('showTransitionEnd');
          }
          else {
            trigger('hideTransitionEnd');
          }
        }
      );
    }

    var keys = {
      ESC: 27,
    };

    //
    // Handler for key press
    //
    function onKeyPress(e) {

      switch (e.keyCode) {
        case keys.ESC:

          if (that.options.hideOnEsc) {
            that.hide();
          }

          // handled, don't bubble up
          e.stopImmediatePropagation();
          e.preventDefault();
          return;

        // proceed
        default:
          break;
      }
    }

    //
    // Prevents the scroll propagation of the parent
    //
    function preventScroll(e) {
      e.stopPropagation();
      e.preventDefault();
      e.returnValue = false;
      return false;
    }

    //
    // Prevents the scroll propagation of the parent
    //
    function preventScrollPropagation(e) {
      var $this = $(this);
      var scrollTop = this.scrollTop;
      var scrollHeight = this.scrollHeight;
      var height = $this.height();
      var delta = e.originalEvent.wheelDelta;
      var paddingTop = parseInt($this.css('paddingTop')) || 0;
      var paddingBottom = parseInt($this.css('paddingTop')) || 0;
      var up = delta > 0;

      // Scrolling down, but this will take us past the bottom.
      if (!up && -delta >
        scrollHeight - height - scrollTop - paddingTop - paddingBottom
      ) {
        $this.scrollTop(scrollHeight);
        return preventScroll(e);
      }

      // Scrolling up, but this will take us past the top.
      else if (up && delta > scrollTop) {
        $this.scrollTop(0);
        return preventScroll(e);
      }
    }

    //
    // Flushes the css to the DOM
    // http://timtaubert.de/blog/2012/09/css-transitions-for-dynamically-created-dom-elements/
    //
    function flushCss() {
      try {
        // calling this will flush any pending css to be written
        var x = window.getComputedStyle(that.$container[0]).visibility;
      }
      catch(err) {
      }
    }
  }

}));
