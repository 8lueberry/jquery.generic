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
    var instance = el.data(dataKey);

    // create an instance (and store it) if it hasn't been created
    if (!instance) {
      instance = new GenericDateTimePicker(el[0], options);
      el.data(dataKey, instance);
    }

    return instance;
  };

  ///////////////////////////////////////////////////////
  // Defaults
  ///////////////////////////////////////////////////////
  $.fn.gdt.defaults = {

    // the css class used
    css: {
      input: 'gdtInput',
      picker: 'gdtPicker',
      visible: 'visible',
      calendar: {
        container: 'gdtCalendar',
        today: 'today',
        past: 'past',
        selected: 'selected',
        buttonPrev: 'prev',
        buttonNext: 'next',
      },
      time: {
        container: 'gdtTime',
        past: 'past',
        selected: 'selected',
      }
    },

    // the parent item where the position will be used to show the datepicker
    parent: null,

    // whether the picker is inline or shown on input focus
    inline: false,

    // selected date
    date: null,

    // the date limit (grey out older dates)
    pastDate: null,

    // allow to select past date
    selectPast: true,

    // the 3rd party engine
    parseEngine: {

      // text used
      i18n: {
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
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
          (hours>=12 ? 'pm' : 'am');
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

          if (time.length>0 && hours<12 && time[Math.min(time.length-1, 1)].toLowerCase().indexOf('pm') >= 0) {
            hours += 12;
          }
        }

        return new Date(year, month, day, hours, minutes);
      },
    },

    // ms delay before parsing on input change
    inputParseDelay: 500,

    // when date is not specified, this is the default date to show the picker
    startDate: new Date(),

    // the time at which to show first (instead of 12am)
    startTime: 8*60,

    // minute interval between time
    intervalTime: 30,

    // when the selection changes
    onChange: null,

    // when the date is selected
    onDateSelected: null,

    // when the time is selected
    onTimeSelected: null,
  };

  ///////////////////////////////////////////////////////
  // Implementation
  ///////////////////////////////////////////////////////
  function GenericDateTimePicker(el, options) {
    var that = this;

    // members
    this.$el = $(el);
    this.options = $.extend(true, {}, $.fn.gdt.defaults, options);

    ///////////////////////////////////////////////////////
    // Public methods
    ///////////////////////////////////////////////////////

    //
    // Shows the picker
    //
    this.show = function() {

      // reposition
      var elPosition = getPosition(that.options.parent || el);
      that.$picker
        .css({
          visibility: 'visible',
        })
        .addClass(that.options.css.visible);

      // automatically scroll to start of time or selected time
      scrollToTime(that.selectedTime !== null ?
        that.selectedTime :
        that.options.startTime
      );

      // listen to keyboard on input
      that.$el
        .on('keydown.gdt', that, onKeyPressInput);

      // listen to keyboard in general
      $(window)
        .on('keydown.gb', that, onKeyPress);

      return that;
    };

    //
    // Hides the picker
    //
    this.hide = function() {

      // stop listening to keyboard
      $(window).off('keydown.gb', that, onKeyPress);
      that.$el.off('keydown.gdt', that, onKeyPressInput);

      that.$picker
        .removeClass(that.options.css.visible)
        .css({
          visibility: 'hidden',
        });

      return that;
    };

    //
    // Sets the date limit (grey out before date)
    //
    this.setPastDate = function(date) {
      that.options.pastDate = date;
      updateCalendar();
      redrawInput();

      return that;
    };

    //
    // Selects a date
    //
    this.selectDate = function(date) {
      var dateClone = parseDate(date);

      // extract time
      that.selectedTime = dateClone.getHours()*60 + dateClone.getMinutes();

      // extract date
      dateClone.setHours(0,0,0,0);
      that.selectedDate = dateClone;

      redrawPicker();
      redrawInput();

      return that;
    };

    ///////////////////////////////////////////////////////
    // Private
    ///////////////////////////////////////////////////////

    //
    // Constructor
    //
    function init() {

      // current month to show in the calendar
      that.currentDate = that.options.startDate;

      // selection
      that.selectedTime = null;
      that.selectedDate = null;

      // specified a date
      if (that.options.date) {

        // remove time
        that.selectedDate = new Date(that.options.date);
        that.selectedDate.setHours(0,0,0,0);

        // extract time
        that.selectedTime = that.options.date.getHours() * 60 +
          that.options.date.getMinutes();

        that.currentDate = new Date(that.selectedDate);

        redrawInput();
      }

      // parse input
      else if(that.$el.val() !== '') {
        parseInput();

        if (that.selectedDate) {
          that.currentDate = new Date(that.selectedDate);
        }
      }

      //
      // Start building html
      //

      // build the calendar popup
      that.$el
        .addClass(that.options.css.input);

      // picker

      that.$picker = $('<div>')
        .addClass(that.options.css.picker);

      if (that.options.inline) {
        that.$picker
          .css({
            visibility: 'visible',
          })
          .addClass(that.options.css.visible);
      }
      else{
        that.$picker
          .css({
            visibility: 'hidden',
          })
          .on('mouseover.gdt', function() {
            that.$el.off('blur', that.hide);
          })
          .on('mouseout.gdt', function() {
            that.$el.on('blur', that.hide);
          })
          .on('click.gdt', function(e) {
            that.$el.focus();
          });
      }

      that.$picker.insertBefore(that.options.parent || that.$el);

      // picker calendar section
      that.$calendarContainer = $('<div class="'+ that.options.css.calendar.container +'">')
        .on('click', 'button.' + that.options.css.calendar.buttonPrev, function() {
          that.currentDate.setMonth(that.currentDate.getMonth() - 1);
          updateCalendar();
        })
        .on('click', 'button.' + that.options.css.calendar.buttonNext, function() {
          that.currentDate.setMonth(that.currentDate.getMonth() + 1);
          updateCalendar();
        })
        .on('click.gdt', 'td', function(e) {
          var $this = $(this);
          if (!that.options.selectPast && $this.hasClass(that.options.css.calendar.past)) {
            return;
          }

          that.$calendarContainer
            .find('.' + that.options.css.calendar.selected)
            .removeClass(that.options.css.calendar.selected);

          $this
            .addClass(that.options.css.calendar.selected);

          that.selectedDate = new Date(parseInt($this.attr('data')));
          redrawInput();

          // callback
          if ($.isFunction(that.options.onDateSelected)) {
            that.options.onDateSelected.call(that, that.selectedDate);
          }

          // hide if done
          if (!that.options.inline) {
            closePickerIfDone(e);
          }
        })
        .appendTo(that.$picker);

      updateCalendar();

      // picker time section
      that.$timeContainer = $('<div class="'+ that.options.css.time.container +'">')
        .html(getTimeHtml())
        .on('mousewheel.gdt', function(e) {
          if ((this.scrollTop <= 0) &&
            (e.originalEvent.wheelDelta > 0) ||
            (this.clientHeight + this.scrollTop >= this.scrollHeight) &&
            (e.originalEvent.wheelDelta < 0)
          ) {
            e.preventDefault();
          }
        })
        .on('click.gdt', 'li', function(e) {
          var $this = $(this);
          if (!that.options.selectPast &&
            $this.hasClass(that.options.css.calendar.past)
          ) {
            return;
          }

          that.$timeContainer
            .find('.' + that.options.css.time.selected)
            .removeClass(that.options.css.time.selected);

          $this
            .addClass(that.options.css.time.selected);

          that.selectedTime = parseInt($this.attr('data'));
          redrawInput();

          // callback
          if ($.isFunction(that.options.onTimeSelected)) {
            that.options.onTimeSelected.call(that, that.selectedTime);
          }

          // hide if done
          if (!that.options.inline) {
            closePickerIfDone(e);
          }
        })
        .appendTo(that.$picker);

      // input focus
      that.$el
        .on('keyup.gdt', keyUpInput());

      if (!that.options.inline) {
        that.$el
          .on('focus.gdt', that.show)
          .on('click.gdt', that.show)
          .on('blur.gdt', that.hide);
      }

      // events
      that.$el.on('selectionChange', function() {
        redrawPicker();

        var dateValue = new Date(that.selectedDate);
        if (that.selectedTime !== null) {
          dateValue.setHours(0, that.selectedTime);
        }

        // callback
        if ($.isFunction(that.options.onChange)) {
          that.options.onChange.call(this, dateValue);
        }
      });
    }

    //
    // Input keyup event handler
    //
    function keyUpInput() {
      var inputTimeout = null;
      var previousValue = '';

      return function(e) {
        // we don't want to update too fast
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(function() {

          // update only when the value changed
          if (previousValue === that.$el.val()) {
            return;
          }

          previousValue = that.$el.val();
          parseInput();

        }, that.options.inputParseDelay);
      };
    }

    //
    // Close picker helper
    //
    function closePickerIfDone(e) {
      if (that.selectedDate !== null && that.selectedTime !== null) {
        that.$el.focus();
        that.hide();
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }

    //
    // If a string is passed, parse it
    // If a date is passed, clone it
    //
    function parseDate(date) {
      if (typeof date === 'string') {
        try{
          return that.options.parseEngine.parse.call(that.options.parseEngine, date);
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
    function redrawInput() {

      if (that.selectedDate === null || that.selectedTime === null) {
        that.$el.val('');
        return;
      }

      // merge date and time
      var dateValue = new Date(that.selectedDate);

      if (that.selectedTime !== null) {
        dateValue.setHours(0, that.selectedTime);
      }

      // call the parse engine
      var value = that.options.parseEngine.format.call(that.options.parseEngine, dateValue);
      that.$el.val(value);
      that.$el.trigger('change', value);

      // callback
      if ($.isFunction(that.options.onChange)) {
        that.options.onChange.call(this, dateValue);
      }
    }

    //
    // Parses the input and update the selected date
    //
    function parseInput() {

      // parse the string
      var date = parseDate(that.$el.val());

      // invalid date
      if (!date || isNaN(date.getTime())) {
        that.selectedDate = null;
        that.selectedTime = null;
      }
      else{
        // extract time
        that.selectedTime = date.getHours()*60 + date.getMinutes();

        // extract date
        date.setHours(0,0,0,0);
        that.selectedDate = date;
      }

      // trigger the change
      that.$el.trigger('selectionChange', that.selectedDate, that.selectedTime);
    }

    //
    // Update the UI based on the current selection
    //
    function redrawPicker() {

      // select date
      if (that.selectedDate) {
        that.currentDate = new Date(that.selectedDate);
      }

      // select time
      selectTime(that.selectedTime);

      // draw calendar
      updateCalendar();

      // scroll to time
      if (that.selectedTime !== null) {
        scrollToTime(that.selectedTime);
      }
    }

    //
    // Build the time html
    //
    function getTimeHtml() {
      var html = '<ol>';

      var time = 0;
      while(time < 24*60) {

        html += '<li class="'
          + (that.selectedTime === time ? that.options.css.time.selected : '')
          + '" data="'+ time +'">'
          + that.options.parseEngine.formatTime.call(that.options.parseEngine, Math.floor(time/60), time%60)
          + '</li>'

        time += that.options.intervalTime;
      }

      html += '</ol>';
      return html;
    }

    //
    // Add the 'selected' class to the selected time
    //
    function selectTime(time) {
      that.$timeContainer
        .find('.' + that.options.css.time.selected)
        .removeClass(that.options.css.time.selected);

      that.$timeContainer
        .find('li[data='+ time +']')
        .addClass(that.options.css.time.selected);
    }

    //
    // Scrolls to the specified time
    //
    function scrollToTime(time) {
      var $time = that.$timeContainer
        .find('li[data='+ time+']');

      if ($time.length > 0) {
        var scroll = $time.position().top;
        scroll += that.$timeContainer.scrollTop();

        that.$timeContainer.scrollTop(scroll);
      }
    }

    //
    // Updates the calendar html
    //
    function updateCalendar() {
      that.$calendarContainer
        .html('<header>'
          + '<button tabindex="-1" class="'+ that.options.css.calendar.buttonPrev +'"></button>'
          + that.options.parseEngine.i18n.months[that.currentDate.getMonth()] + ' ' + that.currentDate.getFullYear()
          + '<button tabindex="-1" class="'+ that.options.css.calendar.buttonNext +'"></button>'
          + '</header>'
          + getCalendarHtml(that.currentDate)
        );
    }

    //
    // Builds the calendar html
    //
    function getCalendarHtml(date) {

      date = new Date(date);
      date.setDate(1); // begginning of the month
      date.setHours(0,0,0,0); // no time

      var month = date.getMonth();

      var today = new Date();
      today.setHours(0,0,0,0); // no time

      var past = null;
      if (that.options.pastDate) {
        past = parseDate(that.options.pastDate);
      }
      else{
        past = new Date();
      }
      past.setHours(0,0,0,0); // no time



      // deselect selected date if past
      if (!that.options.selectPast && that.selectedDate < past) {
        that.selectedDate = null;
      }

      // do the header
      var html = '<table>';
      html += '<tr>';
      for(var i = 0; i <= 6; i++ ) {
        html += '<th>';
        html += that.options.parseEngine.i18n.days[i];
        html += '</th>';
      }
      html += '</tr><tr>';

      // this loop is for is weeks (rows)
      for (var i = 0; i < 9; i++) {
        // this loop is for weekdays (cells)
        for (var j = 0; j <= 6; j++) {

          html += '<td class="';

          // today
          if (date.getTime() === today.getTime()) {
            html += that.options.css.calendar.today;
          }

          // past
          if (date < past) {
            html += ' ' + that.options.css.calendar.past;
          }

          if ((i > 0 || date.getDay() <= j) && (date.getMonth() === month)) {

            // selected
            if (that.selectedDate && (date.getTime() === that.selectedDate.getTime())) {
              html += ' ' + that.options.css.calendar.selected;
            }

            var dateDay = date.getDate();
            html += '" data="'+ date.getTime() +'">' + dateDay;
            date.setDate(dateDay + 1);
          }
          else {
            html += '">';
          }

          html += '</td>';
        }

        // stop making rows if we've run out of days
        if (date.getDate() === 1) {
          break;
        }
        else{
          html += '</tr><tr>';
        }
      }
      html += '</tr></table>';

      return html;
    }

    //
    // Gets the position of an object
    //
    function getPosition(object) {
      var $object = $(object);
      var senderPos = $object.offset();

      return {
        top: senderPos.top,
        left: senderPos.left,
        width: $object.outerWidth(),
        height: $object.outerHeight()
      };
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
          break;

        case keys.TAB:
          that.hide();
          return;

        default:
          return;
      }

      // Cancel event if function did not return:
      e.stopImmediatePropagation();
      e.preventDefault();
    }

    //
    // Input change
    //
    function onKeyPressInput() {
      var value = that.$el.val();

      // try to parse and select the right date
    }

    // run constructor
    init();
  }

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
