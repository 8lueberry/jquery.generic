[download-min]: http://danlevan.github.io/jquery.generic/dist/jquery.genericBox.min.js  "Minified version"
[download-map]: http://danlevan.github.io/jquery.generic/dist/jquery.genericBox.min.js.map  "Minified map file"
[download-dev]: http://danlevan.github.io/jquery.generic/dist/jquery.genericBox.js  "Not minified version"
[download-css]: http://danlevan.github.io/jquery.generic/dist/css/gb.css  "Optional css"
[page-example]: http://danlevan.github.io/jquery.generic/dist/examples/gb.html
[page-license]: https://raw.githubusercontent.com/danlevan/jquery.generic/master/LICENSE

[See the demo page][page-example]

# GenericBox

> GenericBox is a tiny jQuery popup plugin that doesn't handle any styling or animations in the lib. Instead, everything is customizable via css (or javascript) by you. The plugin only handles the html skeleton, events and key bindings.

## Installation

- Directly
  - [jquery.genericBox.js][download-dev] ([map][download-map], [min][download-min])
  - [gb.css][download-css] (Optional)
- Bower: `$ bower install jquery-generic`
- NPM: `$ npm install jquery-generic`
- Git: `$ git clone git://github.com/danlevan/jquery-generic.git`

## Requirement

jQuery 1.7+ ([download page](http://jquery.com/download/))

## Features

- Extremely flexible
- Lightweight: 1.5k .min.gz
- No obscure styling options to be passed
- Styles and anims entirely in css, by you
- Supports animations libraries like [animate.css](http://daneden.github.io/animate.css/)
- Esc key, overlay click to close
- Multiple popup support (esc key works as expected)
- The background doesn't scroll when you're scrolling the popup
- Can be included as an AMD module
- Events (show, hide, animation end...)
- Free to use and modify [MIT][page-license]

## Browser support

You decide! Animations and styling can entirely be done by css.

## Why another library?

> There are many popup jQuery plugins available but most of them either do too much, have obscure styling settings, are buggy or aren't flexible enough. Styling and animations should not be part of the library and you should have full control of your popups. If you're going to learn how to style a popup, might as well learn it with css.

# Getting started

## Step 1

Include jquery and genericBox

```html
<!-- Optional css, add this inside the head -->
<link rel="stylesheet" href="http://danlevan.github.io/jquery.generic/dist/css/gb.css" />

...

<!-- Add this at the end, before the closing body tag -->
<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<script src="http://danlevan.github.io/jquery.generic/dist/jquery.genericBox.min.js"></script>
```

## Step 2

Create a div with the popup content and hide it

```html
<!-- hide it and style it the way you want -->
<div id="#popup"
  style="display:none; background-color:#fff; width:400px; height:200px;"
  data-style="overlay-fade center scale">
  ...
</div>
```

## Step 3

Call genericBox

```js
$(function() {
  $('#popup').gb().show();
})
```

## That's it

<button id="button-getting-started" onclick="$('#popup-example').gb().show();">Result</button>

# How it works

Your html popup

```html
<!-- your popup -->
<div id="popup">
  ...
</div>
```

becomes

```html
<div class="gb-container"> <!-- main container -->

  <!-- Overlay background
    Usually styled to be full screen with a dark or bright color
  -->
  <div class="gb-overlay"></div>

  <!-- Contains close and popup
    Apply animations to this element. You can also use this to center your popup
  -->
  <div class="gb-box">

    <!-- close button
      Since it's inside gb-box, it's easy to position it at the top, left, ...
    -->
    <div class="gb-close"></div>

    <!-- your popup -->
    <div id="popup" class="gb-popup">
      ...
    </div>
  </div>
</div>
```

and when show() is called, the class 'visible' is added to the root container

```html
<div class="gb-container visible">
  ...
</div>
```

## Note

When calling the chained jQuery function for the first time, the skeleton is built to the DOM and the instance of genericBox is returned. Subsequent calls to gb() will return the initial instance.

```js
var instance1 = $('#popup').gb({...});

// here, the options are ignored because it's being called a second time
var instance2 = $('#popup').gb({...});

// instance1 === instance2 are the same instance
```

This allows you to forget about keeping an instance and do something like

```js
$('button').on('click', function() { // can click the button multiple times
  $('#popup')
    .gb({...}) // only read the options the first time
    .show(); // show it, all the time
});
```

# API
## Methods

Method | Description
--- | ---
show() | Shows the popup
hide() | Hides the popup
on(eventName, handler) | Attach a handler to an event (See the list of events here)
one(eventName, handler) | Attach a handler to an event once and then detach automatically after the first call (See the list of events here )
off(eventName, handler) | Detach a handler from an event (See the list of events here)

### Usage example

```js
$('#popup')
  .gb()
  .show() // show it
  .hide(); // hide it
```

## Options

Option | Type | Description | Default
--- | --- | --- | ---
css	| Object | You can change the default class name used. | ```{ container:  'gb-container', close:      'gb-close', box:        'gb-box', popup:      'gb-popup', overlay:    'gb-overlay', style:      'gb-style', visible:    'visible' }```
data | Object | You can change the data keys to use for styling. e.g. ```data-style``` | ```{ style: 'style' }```
hideOnClickOverlay | Boolean | Whether to hide the popup when the overlay is clicked. | true
hideOnEsc | Boolean | Whether to hide the popup when the esc key is pressed. | true
lockBackgroundScroll | Boolean | Whether to disable scrolling of the body when the popup is shown. | true
blurTrigger	| Boolean | Whether to blur (unfocus) the body button, preventing the body button to be pressed by accidental keyboard events. | true
onInitialize | function | Method binded to the 'initialize' event |
onShow | function | Method binded to the 'show' event |
onHide | function | Method binded to the 'hide' event |
onShowStart	| function | Method binded to the 'showStart' event |
onHideStart	| function | Method binded to the 'hideStart' event |
onAnimationStart | function | Method binded to the 'animationStart' event |
onAnimationEnd | function | Method binded to the 'animationEnd' event |
onShowAnimationStart | function | Method binded to the 'showAnimationStart' event |
onShowAnimationEnd | function | Method binded to the 'showAnimationEnd' event |
onHideAnimationStart | function | Method binded to the 'hideAnimationStart' event |
onHideAnimationEnd | function | Method binded to the 'hideAnimationEnd' event |

Option passed as html data attribute

```html
<div id="popup" data-gb='{"hideOnEsc": true, "hideOnClickOverlay": false}'>
  ...
</div>
```

or option passed when constructing the genericBox

```js
$('#popup')
  .gb({
     hideOnClickOverlay: false,
     hideOnEsc: true,
   })
   .show();
```

## Events

Event | Description
--- | ---
initialize | When genericBox finished building (DOM ready).
show | When the popup is showing. If there are no animations, the popup is visible at this point.
hide | When the popup is hidden. If there are no animations, the popup is hidden at this point.
showStart	| Before the popup starts showing.
hideStart | Before the popup starts hiding.
animationStart | When any animation is starting (show or hide).
animationEnd | When any animation ended (show or hide).
showAnimationStart | When the show animation is starting.
showAnimationEnd | When the show animation ended.
hideAnimationStart | When the hide animation is starting.
hideAnimationEnd | When the hide animation ended.

Note that transition events are not supported. This is due to the difference in behavior of every browsers. You can still use at your own risk.

- transitionEnd
- showTransitionEnd
- hideTransitionEnd

There are no transitionStart events supported by any browsers.

### See it in action

<button id="button-event">Popup</button>
<div id="log-event" class="log"></div>

### How to attach to an event

As an option (see the options documentation)

```js
$('#popup').gb({
   onShow: function() {
     console.log('Showing popup');
   },
   onHide: function() {
     console.log('Hiding popup');
   }
 }).show();
```

Attach to an existing instance

```js
var gb-popup = $('#popup').gb();
...
gb-popup
  .on('show', function() {
    console.log('Showing popup');
  })

  // yay, chaining
  .on('hide', function() {
    console.log('Hiding popup');
  });
```

### Cancel a default action

You can cancel showing and hiding on the 'showStart' and 'hideStart' events.

```js
$('#popup')
  .gb({
     onHideStart: function(e) {
       console.log('Cancel hiding');
       e.preventAction();
     }
   })
   .show();
```

# Optional css

The optional css is the starting point to customize your popup. It contains all the logic for centering, full screen, animations etc. All the examples use this helper css.
It was written using Stylus and you can download the source here gbTemplate.styl.

## How to use

Add ```data-style``` attribute to your popup

```html
<!-- your popup -->
<div id="popup" data-style="overlay-fade center scale ...">
</div>
```

You can mix and match the options.

Option | Description
--- | ---
overlay-fade | Light fading transition of the overlay on show and hide
overlay-light | Lighten the overlay (not as dark but still transparent)
overlay-white | Use a bright overlay
close-hide | Hides the close button
center | Centers the popup
fullscreen | Makes the popup full screen
scale | Light appearing animation of the box. It complements well the 'overlay-fade' and 'center' options.
anim-1s | Helper class for 1 second animations

# Examples

You can see examples on the [demo page][page-example]

---

[MIT][page-license] &copy; Dan Le Van
