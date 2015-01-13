# GenericDateTime

> bla bla bla

# Installation

- Download the files you need from the dist directory
  - [jquery.genericDateTime.min.js]() ([map]())
    - or [jquery.genericDateTime.js]()
  - [gdt.css]() (Optional)
- Bower: `$ bower install jquery-generic`
- NPM: `$ npm install jquery-generic`
- Git: `$ git clone git://github.com/danlevan/jquery-generic.git`

# What is it?

Blah

## Requirement

jQuery 1.7+ ([download page](http://jquery.com/download/))

## Features

- Extremely flexible
- No obscure styling options to be passed
- Styles and anims entirely in css, by you
- Supports animations libraries like animate.css
- Can be included as an AMD module
- Events (show, hide, animation end...)
- Free to use and modify

## Browser support

You decide! Animations and styling can entirely be done by css.

## License
[MIT](https://raw.githubusercontent.com/danlevan/jquery.generic/master/LICENSE)

# Getting started

## Step 1

Include jquery and jquery.genericDateTime

```html
<!-- Optional css, add this inside the head -->
<link rel="stylesheet" href="path/to/gdt.css" />

<!-- Add this at the end, before the closing body tag -->
<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<script src="path/to/jquery.genericDateTime.min.js"></script>
```

## Step 2

Define an `input` field in your html and initialize it

```html
<input id="my-date-time-input" type="text" />
```

```javascript
$(function() {
  ...
  $('#my-date-time-input').gdt();
})
```

## That's it

When your input has the focus, the picker will appear.

# How it works

# API
## Methods
## Options
