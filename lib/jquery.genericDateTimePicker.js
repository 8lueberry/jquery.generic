/*
 * Generic - jQuery Plugin
 *
 * Example and documentation at: http://danlevan.github.io/jquery.generic
 *
 * Copyright (c) 2014 Dan LE VAN
 *
 * Version: 0.1.2 (Thu Nov 06 2014)
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

  $.fn.gdt = function (options) {
    var dataKey = '_gdt';
    var el = $(this.first());
    var result = this.map(function() {

      var el = $(this);
      var instance = el.data(dataKey);

      // already created
      if (instance) {
        return instance;
      }

      // create an instance (and store it)
      var dataOptions = el.data('gdt');
      if (typeof dataOptions === 'string') {
        console.warn(
          'The data-options provided is not a valid JSON: ' + dataOptions
        );
        dataOptions = {};
      }

      instance = new GenericDateTimePicker(
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

  ///////////////////////////////////////////////////////
  // Defaults
  ///////////////////////////////////////////////////////
  $.fn.gdt.defaults = {

    // the css class used
    css: {
      input: 'gdt-input',
      container: 'gdt-container',
      box: 'gdt-box',
      close: 'gdt-close',
      visible: 'visible',
      outside: 'outside',
      selected: 'selected',
      today: 'today',
      calendar: {
        container: 'gdt-calendar',
        year: 'gdt-year',
        month: 'gdt-month',
        'outside-month': 'outside-month',
      },
      time: {
        container: 'gdt-time',
      },
      helper: {
        container: 'gdt-helper',
      },
    },

    // hide box on esc key
    hideOnEsc: true,

    // whether the picker is inline or shown on input focus
    inline: false,

    // selected date
    selectDate: null,

    // the low date limit
    minDate: null,

    // the high date limit
    maxDate: null,

    // exclusion dates (array or function)
    disabledDates: [],

    // ms delay before parsing on input change
    inputParseDelay: 500,

    // when date is not specified, this is the default date to show the picker
    showCalendar: new Date(),

    // the time at which to show first (instead of 12am)
    showTime: 8*60,

    // minute interval between time
    showIntervalTime: 30,

    // numbers of years to render
    yearsBefore: 2,
    yearsAfter: 2,

    // when the selection changes
    onChange: null,

    // when the date is selected
    onDateSelected: null,

    // when the time is selected
    onTimeSelected: null,

    // the 3rd party engine
    parseEngine: {

      // text used
      i18n: {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
          'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      },

      // date to string
      format: function(date) {
        var month = (date.getMonth() + 1);
        var day = date.getDate();

        return date.getFullYear() +
          '/' + (month<10 ? '0' : '') + month +
          '/' + (day<10 ? '0': '') + day +
          ' ' + this.formatTime(date.getHours(), date.getMinutes());
      },

      // hours minute to string
      formatTime: function(hours, minutes) {
        return (hours%12 === 0 ? 12 : hours%12) + ':' +
          (minutes<10 ? '0' : '') + minutes +
          (hours>=12 ? 'PM' : 'AM');
      },

      // string to date
      parse: function(string) {
        var dateTime = string.split(' ');

        // parse date
        var date = dateTime[0].split('/');
        var year = date.length>0 ? parseInt(date[0]) : NaN;
        var month = date.length>1 ? parseInt(date[1]) - 1 : NaN;
        var day = (date.length>2 ? parseInt(date[2]) : NaN) || 1;

        // parse time
        var hours = 0;
        var minutes = 0;
        if (dateTime.length > 1) {
          var time = dateTime[1].split(':');
          hours = (time.length>0 ? parseInt(time[0]) : NaN) || 0;
          minutes = (time.length>1 ? parseInt(time[1]) : NaN) || 0;

          if (time.length>0 && hours<12 &&
            time[Math.min(time.length-1, 1)].toLowerCase().indexOf('pm') >= 0
          ) {
            hours += 12;
          }
        }

        return new Date(year, month, day, hours, minutes);
      },
    },
  };

  ///////////////////////////////////////////////////////
  // Implementation
  ///////////////////////////////////////////////////////
  function GenericDateTimePicker(el, options) {
    var that = this;
    that.$el = $(el);
    that.isVisible = false;

    // merge options with default
    this.options = $.extend(true, {}, $.fn.gdt.defaults, options);

    // init selected date
    initSelection();

    // built
    buildBody();

    // if gb is called gb().show(), we have to make sure that the content is
    // flushed to the DOM or the css animation will fail
    flushCss();

    ///////////////////////////////////////////////////////
    // Public methods
    ///////////////////////////////////////////////////////

    //
    // Shows the picker
    //
    that.show = function() {

      if (that.isVisible) {
        return;
      }

      // show
      that.$container.addClass(that.options.css.visible);

      // automatically scroll to start of time or selected time
      scrollToTime(that.selectedTime !== null ?
        that.selectedTime :
        that.options.showTime
      );

      // listen to keyboard on input
      if (that.options.hideOnEsc) {
        $(window).on('keydown.gdt', that, onKeyPress);
      }

      that.isVisible = true;
      trigger('show');

      return that; // chaining
    };

    //
    // Hides the picker
    //
    this.hide = function() {

      if (!that.isVisible) {
        return;
      }

      // stop listening to keyboard
      if (that.options.hideOnEsc) {
        $(window).off('keydown.gdt', that, onKeyPress);
      }

      // hide
      that.$container.removeClass(that.options.css.visible);

      that.isVisible = false;
      trigger('hide');

      return that; // chaining
    };

    //
    // Selects a date
    //
    this.selectDate = function(selectedDate) {
      updateSelection(selectedDate);

      return that;
    };

    ///////////////////////////////////////////////////////
    // Private
    ///////////////////////////////////////////////////////

    //
    // Initialize the date selection
    //
    function initSelection() {

      that.selectedTime = null;
      that.selectedDate = null;

      // specified a selected date in the option
      if (that.options.selectDate &&
        !isNaN(that.options.selectDate.getTime())
      ) {
        updateSelection(that.options.selectDate, 'init');

        // initialize the input
        var value = that.options.parseEngine.format.call(
          that.options.parseEngine,
          that.options.selectDate
        );
        that.$el.val(value);
      }

      // specified selected date in the input
      else if(that.$el.val() !== '') {
        updateSelection(that.$el.val(), 'init');
      }

      // default date to show in the calendar
      that.currentDate = that.selectedDate ?
        new Date(that.selectedDate) : that.options.showCalendar;
    }

    //
    // Updates the selected date
    //
    function updateSelection(selectedDate, context) {

      var dateParsed = parseDate(selectedDate);

      // parse time
      var time = dateParsed ?
        dateParsed.getHours()*60 + dateParsed.getMinutes() :
        null;

      if (that.selectedTime !== time) {
        that.selectedTime = time;
        trigger('selectedTimeChanged', {
          time: that.selectedTime,
          context: context,
        });
      }

      // parse date
      var date = dateParsed;
      if (date) {
        date.setHours(0,0,0,0);
      }

      if (that.selectedDate !== date) {
        that.selectedDate = date;
        trigger('selectedDateChanged', {
          date: that.selectedDate,
          context: context,
        });
      }
    }

    //
    // Builds the body
    //
    function buildBody() {

      // container
      that.$container = $('<div class="' + that.options.css.container + '">');

      // box
      that.$box = $('<div class="' + that.options.css.box + '">')
        .appendTo(that.$container);

      // close
      that.$close = $('<div class="' + that.options.css.close + '">')
        .appendTo(that.$box);

      // year
      that.$calendarYearContainer = $('<div class="' +
        that.options.css.calendar.year + '">')
        .appendTo(that.$box);

      // month
      that.$calendarMonthContainer = $('<div class="' +
        that.options.css.calendar.month + '">')
        .appendTo(that.$box);

      // helper buttons
      that.$helperContainer = $('<div class="' +
        that.options.css.helper.container + '">')
        .html('<ul>' +
          '<li class="today"><button>Today</button></li>' +
          '<li class="tomorrow"><button>Tomorrow</button></li>' +
          '<li class="next-week"><button>Next week</button></li>' +
          '<li class="next-month"><button>Next month</button></li>' +
          '<li class="next-year"><button>Next year</button></li>' +
          '</ul>')
        .appendTo(that.$box);

      // calendar
      that.$calendarContainer = $('<div class="' +
        that.options.css.calendar.container + '">')
        .appendTo(that.$box);

      redrawCalendar();

      // time
      that.$timeContainer = $('<div class="' +
        that.options.css.time.container + '">')
        .appendTo(that.$box);

      redrawTime();

      that.$el.addClass(that.options.css.input);
      that.$container.insertAfter(that.$el);
    }

    //
    // Handles the events of the elements
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

      that.$close.on('click.gdt', that.hide);

      // register UI input event
      handleInputEvents();

      // maintain focus of the input on box operations
      if (!that.options.inline) {
        that.$box

          // disable blur events of the input when operating inside the popup
          .on('mouseover.gdt', function() {
            that.$el.off('blur.gdt', that.hide);
          })
          .on('mouseout.gdt', function() {
            that.$el.on('blur.gdt', that.hide);
          });
      }

      handleCalendarEvents();
      handleTimeEvents();

      that.$container
        .on('selectedDateChanged', closeIfSelected)
        .on('selectedTimeChanged', closeIfSelected);

      handleHelperEvents();
    }

    //
    // Events related to the input
    //
    function handleInputEvents() {

      // show and hide
      if (!that.options.inline) {
        that.$el
          .on('focus.gdt', that.show)
          .on('click.gdt', that.show)
          .on('blur.gdt', that.hide);
      }

      // input directly from the input
      that.$el.on('keyup.gdt', getInputActionHandler());

      // update the input in real time
      that.$container
        .on('selectedDateChanged', function(e, value) {
          if (value.context === 'input') {
            return;
          }

          updateInput();
        })
        .on('selectedTimeChanged', function(e, value) {
          if (value.context === 'input') {
            return;
          }

          updateInput();
        });
    }

    //
    // Input keyup event handler
    //
    function getInputActionHandler() {
      var inputTimeout = null;
      var previousValue = '';

      function handleInputAction() {

        var value = that.$el.val();

        // don't update if value hasn't changed
        if (previousValue === value) {
          return;
        }

        previousValue = value;

        updateSelection(value, 'input');
      }

      return function(e) {
        // we don't want to update too fast
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(
          handleInputAction,
          that.options.inputParseDelay
        );
      };
    }

    //
    // Events related to the calendar
    //
    function handleCalendarEvents() {

      // handle UI action

      that.$calendarYearContainer
        .on('DOMMouseScroll mousewheel.gb', preventScroll)
        .on('click.gdt', 'li', handleYearSelected);

      that.$calendarMonthContainer
        .on('DOMMouseScroll mousewheel.gb', preventScroll)
        .on('click.gdt', 'li', handleMonthSelected);

      that.$calendarContainer
        .on('DOMMouseScroll mousewheel.gb', preventScroll)
        .on('click.gdt', 'td', handleDaySelected);

      // handle date selection events
      that.$container
        .on('selectedDateChanged', function(e, value) {

          if (that.selectedDate && !isNaN(that.selectedDate.getTime())) {
            that.currentDate = new Date(that.selectedDate);
          }

          redrawCalendar();
          redrawTime();
        });
    }

    //
    // Action when the year is selected
    //
    function handleYearSelected(e) {
      var $this = $(this);

      // don't allow to select outside the range
      if ($this.hasClass(that.options.css.outside)) {
        return;
      }

      that.currentDate.setYear($this.data('year'));
      redrawCalendar();
    }

    //
    // Action when the month is selected
    //
    function handleMonthSelected(e) {
      var $this = $(this);

      // don't allow to select outside the range
      if ($this.hasClass(that.options.css.outside)) {
        return;
      }

      that.currentDate.setMonth($this.data('month'));
      redrawCalendar();
    }

    //
    // Action when the day is selected
    //
    function handleDaySelected(e) {
      var $this = $(this);

      // don't allow to select outside the range
      if ($this.hasClass(that.options.css.outside)) {
        return;
      }

      // update the css selected
      that.$calendarContainer
        .find('td.' + that.options.css.selected)
        .removeClass(that.options.css.selected);

      $this
        .addClass(that.options.css.selected);

      that.selectedDate = new Date(parseInt($this.data('date')));
      trigger('selectedDateChanged', {
        date: that.selectedDate,
        context: 'popup',
      });

      // callback
      trigger('dateSelected', that.selectedDate);
    }

    /**
     * Events related to the time
     */
    function handleTimeEvents() {

      // UI action
      that.$timeContainer
        .on('DOMMouseScroll mousewheel.gb', preventScrollPropagation)
        .on('click.gdt', 'li', function(e) {
          var $this = $(this);

          // don't allow to select outside the range
          if ($this.hasClass(that.options.css.outside)) {
            return;
          }

          // update the css selected
          that.$timeContainer
            .find('.' + that.options.css.selected)
            .removeClass(that.options.css.selected);

          $this
            .addClass(that.options.css.selected);

          that.selectedTime = parseInt($this.data('time'));
          trigger('selectedTimeChanged', {
            time: that.selectedTime,
            context: 'popup',
          });

          // callback
          trigger('timeSelected', that.selectedTime);
        });

      // date selection changed
      that.$container.on('selectedTimeChanged', function(e, value) {

        if (value.context === 'popup') {
          return;
        }

        // draw time
        redrawTime();
      });
    }

    //
    // Helper events
    //
    function handleHelperEvents() {

      function selectDay(days, months, years) {
        return function() {
          var day = new Date();

          if (days) {
            day.setDate(day.getDate() + days);
          }

          if (months) {
            day.setMonth(day.getMonth() + months);
          }

          if (years) {
            day.setFullYear(day.getFullYear() + years);
          }

          day.setHours(0,0,0,0);
          updateSelection(day, 'helper');
        };
      }

      that.$helperContainer
        .on('click.gdt', 'li.today button', selectDay(0))
        .on('click.gdt', 'li.tomorrow button', selectDay(1))
        .on('click.gdt', 'li.next-week button', selectDay(7))
        .on('click.gdt', 'li.next-month button', selectDay(null, 1))
        .on('click.gdt', 'li.next-year button', selectDay(null, null, 1));
    }

    //
    // Triggers an event
    //
    function trigger() {
      if (!that.$container) {
        return;
      }

      that.$container.trigger.apply(that.$container, arguments);
    }

    //
    // Close picker helper
    //
    function closeIfSelected() {

      // inline, don't close
      if (that.options.inline) {
        return;
      }

      // don't close if a date or time is not selected
      if (!that.selectedDate || !that.selectedTime) {
        return;
      }

      that.$el.focus();
      that.hide();

      // e.stopImmediatePropagation();
      // e.preventDefault();
    }

    //
    // If a string is passed, parse it
    // If a date is passed, clone it
    //
    function parseDate(date) {
      if (typeof date === 'string') {
        try{
          return that.options.parseEngine.parse.call(
            that.options.parseEngine,
            date
          );
        }
        catch(err) {
          console.error(err);
          return null;
        }
      }

      return new Date(date);
    }

    //
    // Updates the input value
    //
    function updateInput() {

      // need a date and time to update
      if (!that.selectedDate || !that.selectedTime) {
        that.$el.val('');
        return;
      }

      // merge date and time
      var dateValue = new Date(that.selectedDate);
      if (that.selectedTime !== null) {
        dateValue.setHours(0, that.selectedTime);
      }

      // call the parse engine
      var value = that.options.parseEngine.format.call(
        that.options.parseEngine,
        dateValue
      );

      that.$el.val(value);
      that.$el.trigger('change', value); // need to manually call this

      trigger('change', dateValue);
    }

    //
    // Updates the calendar html
    //
    function redrawCalendar() {

      that.$calendarContainer
        .html('')
        .append(getCalendarHtml(that.currentDate, that.selectedDate));

      that.$calendarYearContainer
        .html('')
        .append(getYearHtml(that.currentDate));

      that.$calendarMonthContainer
        .html('')
        .append(getMonthHtml(that.currentDate));
    }

    /**
     * Redraws the time
     */
    function redrawTime() {

      selectTime(that.selectedTime);

      that.$timeContainer
        .html('')
        .append(getTimeHtml());
    }

    //
    // Add the 'selected' class to the selected time
    //
    function selectTime(time) {
      that.$timeContainer
        .find('.' + that.options.css.selected)
        .removeClass(that.options.css.selected);

      that.$timeContainer
        .find('li[data-time=' + time + ']')
        .addClass(that.options.css.selected);
    }

    function isOutside(year, month, day, minute) {
      var minYear = -1;
      var minMonth = -1;
      var minDay = -1;
      var minMinute = -1;

      if (that.options.minDate && !isNaN(that.options.minDate.getTime())) {
        minYear = that.options.minDate.getFullYear();
        minMonth = that.options.minDate.getMonth();
        minDay = that.options.minDate.getDate();
        minMinute = that.options.minDate.getHours()*60 +
          that.options.minDate.getMinutes();
      }

      var maxYear = Infinity;
      var maxMonth = Infinity;
      var maxDay = Infinity;
      var maxMinute = -1;

      if (that.options.maxDate && !isNaN(that.options.maxDate.getTime())) {
        maxYear = that.options.maxDate.getFullYear();
        maxMonth = that.options.maxDate.getMonth();
        maxDay = that.options.maxDate.getDate();
        maxMinute = that.options.minDate.getHours()*60 +
          that.options.minDate.getMinutes();
      }

      var result = false;

      // verify year
      result |= (minYear > year);
      result |= (maxYear < year);

      // verify month
      if (month !== undefined) {
        result |= ((minYear === year) && minMonth > month);
        result |= ((maxYear === year) && maxMonth < month);
      }

      // verify day
      if (day !== undefined) {
        result |= ((minYear === year) && (minMonth === month) &&
          (minDay > day));
        result |= ((maxYear === year) && (maxMonth === month) &&
          (maxDay < day));
      }

      // verify minutes
      if (minute !== undefined) {
        result |= ((minYear === year) && (minMonth === month) &&
          (minDay === day) && minMinute > minute);
        result |= ((maxYear === year) && (maxMonth === month) &&
          (maxDay === day) && maxMinute < minute);
      }

      // verify excluded dates
      if (month !== undefined &&
        day !== undefined &&
        that.options.disabledDates
      ) {

        // one date
        if (that.options.disabledDates instanceof Date) {
          result |= (date.getFullYear() === year) &&
            (date.getMonth() === month) &&
            (date.getDate() === day);
        }

        // function
        else if ($.isFunction(that.options.disabledDates)) {
          result |= that.options.disabledDates.call(this,
            year,
            month,
            day,
            minute
          );
        }

        // list of dates
        else if (that.options.disabledDates instanceof Array) {
          for(var i=0; i<that.options.disabledDates.length; i++) {
            var date = that.options.disabledDates[i];
            result |= (date.getFullYear() === year) &&
              (date.getMonth() === month) &&
              (date.getDate() === day);
          }
        }
      }

      return result;
    }

    function getYearHtml(currentDate) {
      var date = new Date(currentDate);
      var currentYear = date.getFullYear();

      var $container = $('<ol>');

      for (var i=currentYear-that.options.yearsBefore;
        i<=currentYear+that.options.yearsAfter; i++
      ) {
        var $item = $('<li>')
          .data('year', i)
          .html(i)
          .appendTo($container);

        if (currentYear === i) {
          $item.addClass(that.options.css.selected);
        }

        if (isOutside(i)) {
          $item.addClass(that.options.css.outside);
        }
      }

      return $container;
    }

    function getMonthHtml(currentDate) {
      var date = new Date(currentDate);
      var currentMonth = date.getMonth();

      var $container = $('<ol>');

      for(var i=0; i<12; i++) {
        var $item = $('<li>')
          .data('month', i)
          .html(that.options.parseEngine.i18n.months[i])
          .appendTo($container);

        if (currentMonth === i) {
          $item.addClass(that.options.css.selected);
        }

        if (isOutside(date.getFullYear(), i)) {
          $item.addClass(that.options.css.outside);
        }
      }

      return $container;
    }

    //
    // Builds the calendar html
    //
    function getCalendarHtml(currentDate, selectedDate) {

      var date = new Date(currentDate);
      var month = date.getMonth();
      var year = date.getYear();

      date.setDate(1);
      date.setDate(1 - date.getDay()); // start of week of the month
      date.setHours(0,0,0,0); // no time

      var today = new Date();
      today.setHours(0,0,0,0); // no time

      var $container = $('<table>');

      // do the header
      var $header = $('<tr>').appendTo($container);
      for(var h=0; h<7; h++) {
        $('<th>')
          .html(that.options.parseEngine.i18n.days[h])
          .appendTo($header);
      }

      // weeks
      for (var i=0; i<6; i++) {
        var $row = $('<tr>').appendTo($container);

        // days
        for (var j=0; j<=6; j++) {
          var $col = $('<td>').appendTo($row);

          // outside of current month
          if (date.getMonth() !== month || date.getYear() !== year) {
            $col.addClass(that.options.css.calendar['outside-month']);
          }

          // selected
          if (selectedDate && (date.getTime() === selectedDate.getTime())) {
            $col.addClass(that.options.css.selected);
          }

          // outside allowed range
          if (isOutside(date.getFullYear(), date.getMonth(), date.getDate())) {
            $col.addClass(that.options.css.outside);
          }

          // today
          else if (date.getTime() === today.getTime()) {
            $col.addClass(that.options.css.today);
          }

          $col.data('date', date.getTime());
          $col.html('<span>' + date.getDate() + '</span>');

          date.setDate(date.getDate() + 1);

        }
      }

      return $container;
    }

    //
    // Build the time html
    //
    function getTimeHtml() {

      var $container = $('<ol>');

      var time = 0;
      while(time < 24*60) {
        var $item = $('<li>')
          .data('time', time)
          .attr('data-time', time)
          .html(that.options.parseEngine.formatTime.call(
            that.options.parseEngine,
            Math.floor(time/60),
            time%60)
          )
          .appendTo($container);

        if (that.selectedTime === time) {
          $item.addClass(that.options.css.selected);
        }

        if (that.selectedDate &&
          isOutside(
            that.selectedDate.getFullYear(),
            that.selectedDate.getMonth(),
            that.selectedDate.getDate(),
            time)
        ) {
          $item.addClass(that.options.css.outside);
        }

        time += that.options.showIntervalTime;
      }

      return $container;
    }

    var keys = {
      ESC: 27,
      TAB: 9,
    };

    //
    // Window keypress event
    //

    function onKeyPress(e) {
      switch (e.keyCode) {
        case keys.ESC:
          that.hide();
          e.stopImmediatePropagation();
          e.preventDefault();
          break;

        case keys.TAB:
          that.hide();
          break;

        default:
          break;
      }
    }

    //
    // Scrolls to the specified time
    //
    function scrollToTime(time) {
      var $time = that.$timeContainer
        .find('li[data-time=' + time+ ']');

      if ($time.length > 0) {
        var scroll = $time.position().top +
          that.$timeContainer.scrollTop() -
          that.$timeContainer.position().top - // ajustment
          that.$timeContainer.outerHeight()/2 + // middle container
          $time.outerHeight()/2; // middle element

        that.$timeContainer.scrollTop(scroll);
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

    registerEvents();
    trigger('initialize');

    if (that.options.inline) {
      that.show();
    }
  }

}));
