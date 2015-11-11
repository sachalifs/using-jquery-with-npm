(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/**
 * Module dependencies
 */

global.jQuery = (typeof window !== "undefined" ? window['jQuery'] : typeof global !== "undefined" ? global['jQuery'] : null);
require('tipso');

/**
 * Start tipso
 */

jQuery(function(){
  jQuery('.title-tipso').tipso();
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"tipso":2}],2:[function(require,module,exports){
(function (global){
/*!
 * tipso - A Lightweight Responsive jQuery Tooltip Plugin v1.0.8
 * Copyright (c) 2014-2015 Bojan Petkovski
 * http://tipso.object505.com
 * Licensed under the MIT license
 * http://object505.mit-license.org/
 */
 // CommonJS, AMD or browser globals
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory((typeof window !== "undefined" ? window['jQuery'] : typeof global !== "undefined" ? global['jQuery'] : null));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($) {
  var pluginName = "tipso",
    defaults = {
      speed             : 400,          //Animation speed
      background        : '#55b555',
      titleBackground   : '#333333',
      color             : '#ffffff',
      titleColor        : '#ffffff',
      titleContent      : '',           //Content of the title bar
      showArrow         : true,
      position          : 'top',
      width             : 200,
      maxWidth          : '',
      delay             : 200,
      hideDelay         : 0,
      animationIn       : '',
      animationOut      : '',
      offsetX           : 0,
      offsetY           : 0,
      arrowWidth        : 8,
      tooltipHover      : false,
      content           : null,
      ajaxContentUrl    : null,
      ajaxContentBuffer : 0,
      contentElementId  : null,         //Normally used for picking template scripts
      useTitle          : false,        //Use the title tag as tooptip or not
      templateEngineFunc: null,         //A function that compiles and renders the content
      onBeforeShow      : null,
      onShow            : null,
      onHide            : null
    };

  function Plugin(element, options) {
    this.element = element;
    this.$element = $(this.element);
    this.doc = $(document);
    this.win = $(window);
    this.settings = $.extend({}, defaults, options);

    /*
     * Process and add data-attrs to settings as well for ease of use. Also, if
     * data-tipso is an object then use it as extra settings and if it's not
     * then use it as a title.
     */
    if (typeof(this.$element.data("tipso")) === "object")
    {
      $.extend(this.settings, this.$element.data("tipso"));
    }

    var data_keys = Object.keys(this.$element.data());
    var data_attrs = {};
    for (var i = 0; i < data_keys.length; i++)
    {
      var key = data_keys[i].replace(pluginName, "");
      if (key === "")
      {
        continue;
      }
      //lowercase first letter
      key = key.charAt(0).toLowerCase() + key.slice(1);
      data_attrs[key] = this.$element.data(data_keys[i]);

      //We cannot use extend for data_attrs because they are automatically
      //lowercased. We need to do this manually and extend this.settings with
      //data_attrs
      for (var settings_key in this.settings)
      {
        if (settings_key.toLowerCase() == key)
        {
          this.settings[settings_key] = data_attrs[key];
        }
      }
    }

    this._defaults = defaults;
    this._name = pluginName;
    this._title = this.$element.attr('title');
    this.mode = 'hide';
    this.ieFade = !supportsTransitions;

    //By keeping the original prefered position and repositioning by calling
    //the reposition function we can make for more smart and easier positioning
    //in complex scenarios!
    this.settings.preferedPosition = this.settings.position;

    this.init();
  }

  $.extend(Plugin.prototype, {
    init: function() {
      var obj = this,
        $e = this.$element,
        $doc = this.doc;
      $e.addClass('tipso_style').removeAttr('title');

      if (obj.settings.tooltipHover) {
        var waitForHover = null,
            hoverHelper = null;
        $e.on('mouseover' + '.' + pluginName, function() {
          clearTimeout(waitForHover);
          clearTimeout(hoverHelper);
          hoverHelper = setTimeout(function(){
            obj.show();
          }, 150);
        });
        $e.on('mouseout' + '.' + pluginName, function() {
          clearTimeout(waitForHover);
          clearTimeout(hoverHelper);
          waitForHover = setTimeout(function(){
            obj.hide();
          }, 200);

          obj.tooltip()
            .on('mouseover' + '.' + pluginName, function() {
              obj.mode = 'tooltipHover';
            })
            .on('mouseout' + '.' + pluginName, function() {
              obj.mode = 'show';
              clearTimeout(waitForHover);
              waitForHover = setTimeout(function(){
                obj.hide();
              }, 200);
            })
        ;
        });
      } else {
        $e.on('mouseover' + '.' + pluginName, function() {
          obj.show();
        });
        $e.on('mouseout' + '.' + pluginName, function() {
          obj.hide();
        });
      }
	  if(obj.settings.ajaxContentUrl)
	  {
		obj.ajaxContent = null;
	  }
    },
    tooltip: function() {
      if (!this.tipso_bubble) {
        this.tipso_bubble = $(
          '<div class="tipso_bubble"><div class="tipso_title"></div><div class="tipso_content"></div><div class="tipso_arrow"></div></div>'
        );
      }
      return this.tipso_bubble;
    },
    show: function() {
      var tipso_bubble = this.tooltip(),
        obj = this,
        $win = this.win;

      if (obj.settings.showArrow === false) {
          tipso_bubble.find(".tipso_arrow").hide();
      }
      else {
          tipso_bubble.find(".tipso_arrow").show();
      }

      if (obj.mode === 'hide') {
        if ($.isFunction(obj.settings.onBeforeShow)) {
          obj.settings.onBeforeShow(obj.$element, obj.element, obj);
        }
        if (obj.settings.size) {
            tipso_bubble.addClass(obj.settings.size);
        }
        if (obj.settings.width) {
          tipso_bubble.css({
            background: obj.settings.background,
            color: obj.settings.color,
            width: obj.settings.width
          }).hide();
        } else if (obj.settings.maxWidth){
          tipso_bubble.css({
            background: obj.settings.background,
            color: obj.settings.color,
            maxWidth: obj.settings.maxWidth
          }).hide();
        } else {
          tipso_bubble.css({
            background: obj.settings.background,
            color: obj.settings.color,
            width: 200
          }).hide();
        }
        tipso_bubble.find('.tipso_title').css({
            background: obj.settings.titleBackground,
            color: obj.settings.titleColor
        });
        tipso_bubble.find('.tipso_content').html(obj.content());
        tipso_bubble.find('.tipso_title').html(obj.titleContent());
        reposition(obj);

        $win.on('resize' + '.' + pluginName, function tipsoResizeHandler () {
            obj.settings.position = obj.settings.preferedPosition;
            reposition(obj);
        });

        window.clearTimeout(obj.timeout);
        obj.timeout = null;
        obj.timeout = window.setTimeout(function() {
          if (obj.ieFade || obj.settings.animationIn === '' || obj.settings.animationOut === ''){
            tipso_bubble.appendTo('body').stop(true, true).fadeIn(obj.settings
            .speed, function() {
              obj.mode = 'show';
              if ($.isFunction(obj.settings.onShow)) {
                obj.settings.onShow(obj.$element, obj.element, obj);
              }
            });
          } else {
            tipso_bubble.remove().appendTo('body')
            .stop(true, true)
            .removeClass('animated ' + obj.settings.animationOut)
            .addClass('noAnimation')
            .removeClass('noAnimation')
            .addClass('animated ' + obj.settings.animationIn).fadeIn(obj.settings.speed, function() {
              $(this).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                $(this).removeClass('animated ' + obj.settings.animationIn);
              });
              obj.mode = 'show';
              if ($.isFunction(obj.settings.onShow)) {
                obj.settings.onShow(obj.$element, obj.element, obj);
              }
              $win.off('resize' + '.' + pluginName, null, 'tipsoResizeHandler');
            });
          }
        }, obj.settings.delay);
      }
    },
    hide: function(force) {
      var obj = this,
        $win = this.win,
        tipso_bubble = this.tooltip(),
        hideDelay = obj.settings.hideDelay;

      if (force) {
        hideDelay = 0;
        obj.mode = 'show';
      }

      window.clearTimeout(obj.timeout);
      obj.timeout = null;
      obj.timeout = window.setTimeout(function() {
        if (obj.mode !== 'tooltipHover') {
          if (obj.ieFade || obj.settings.animationIn === '' || obj.settings.animationOut === ''){
            tipso_bubble.stop(true, true).fadeOut(obj.settings.speed,
            function() {
              $(this).remove();
              if ($.isFunction(obj.settings.onHide) && obj.mode === 'show') {
                obj.settings.onHide(obj.$element, obj.element, obj);
              }
              obj.mode = 'hide';
              $win.off('resize' + '.' + pluginName, null, 'tipsoResizeHandler');
            });
          } else {
            tipso_bubble.stop(true, true)
            .removeClass('animated ' + obj.settings.animationIn)
            .addClass('noAnimation').removeClass('noAnimation')
            .addClass('animated ' + obj.settings.animationOut)
            .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
              $(this).removeClass('animated ' + obj.settings.animationOut).remove();
              if ($.isFunction(obj.settings.onHide) && obj.mode === 'show') {
                obj.settings.onHide(obj.$element, obj.element, obj);
              }
              obj.mode = 'hide';
              $win.off('resize' + '.' + pluginName, null, 'tipsoResizeHandler');
            });
          }
        }
      }, hideDelay);
    },
    close: function() {
      this.hide(true);
    },
    destroy: function() {
      var $e = this.$element,
        $win = this.win,
        $doc = this.doc;
      $e.off('.' + pluginName);
      $win.off('resize' + '.' + pluginName, null, 'tipsoResizeHandler');
      $e.removeData(pluginName);
      $e.removeClass('tipso_style').attr('title', this._title);
    },
    titleContent: function() {
        var content,
          $e = this.$element,
          obj = this;
        if (obj.settings.titleContent)
        {
            content = obj.settings.titleContent;
        }
        else
        {
            content = $e.data('tipso-title');
        }
        return content;
    },
    content: function() {
      var content,
        $e = this.$element,
        obj = this,
        title = this._title;
      if (obj.settings.ajaxContentUrl)
      {
		if(obj._ajaxContent)
		{
			content = obj._ajaxContent;
		}
		else 
		{
			obj._ajaxContent = content = $.ajax({
			  type: "GET",
			  url: obj.settings.ajaxContentUrl,
			  async: false
			}).responseText;
			if(obj.settings.ajaxContentBuffer > 0)
			{
				setTimeout(function(){ 
					obj._ajaxContent = null;
				}, obj.settings.ajaxContentBuffer);
			}
			else 
			{
				obj._ajaxContent = null;
			}
		}
      }
      else if (obj.settings.contentElementId)
      {
        content = $("#" + obj.settings.contentElementId).text();
      }
      else if (obj.settings.content)
      {
        content = obj.settings.content;
      }
      else
      {
        if (obj.settings.useTitle === true)
        {
          content = title;
        }
        else
        {
          // Only use data-tipso as content if it's not being used for settings
          if (typeof($e.data("tipso")) === "string")
          {
            content = $e.data('tipso');
          }
        }
      }
      if (obj.settings.templateEngineFunc !== null)
      {
          content = obj.settings.templateEngineFunc(content);
      }
      return content;
    },
    update: function(key, value) {
      var obj = this;
      if (value) {
        obj.settings[key] = value;
      } else {
        return obj.settings[key];
      }
    }
  });

  function realHeight(obj) {
    var clone = obj.clone();
    clone.css("visibility", "hidden");
    $('body').append(clone);
    var height = clone.outerHeight();
    var width = clone.outerWidth();
    clone.remove();
    return {
      'width' : width,
      'height' : height
    };
  }

  var supportsTransitions = (function() {
    var s = document.createElement('p').style,
        v = ['ms','O','Moz','Webkit'];
    if( s['transition'] === '' ) return true;
    while( v.length )
        if( v.pop() + 'Transition' in s )
            return true;
    return false;
  })();

  function removeCornerClasses(obj) {
    obj.removeClass("top_right_corner bottom_right_corner top_left_corner bottom_left_corner");
    obj.find(".tipso_title").removeClass("top_right_corner bottom_right_corner top_left_corner bottom_left_corner");
  }

  function reposition(thisthat) {
    var tipso_bubble = thisthat.tooltip(),
      $e = thisthat.$element,
      obj = thisthat,
      $win = $(window),
      arrow = 10,
      pos_top, pos_left, diff;

    var arrow_color = obj.settings.background;
    var title_content = obj.titleContent();
    if (title_content !== undefined && title_content !== '') {
        arrow_color = obj.settings.titleBackground;
    }

    if ($e.parent().outerWidth() > $win.outerWidth()) {
      $win = $e.parent();
    }

    switch (obj.settings.position)
    {
      case 'top-right':
        pos_left = $e.offset().left + ($e.outerWidth());
        pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: -obj.settings.arrowWidth,
          marginTop: '',
        });
        if (pos_top < $win.scrollTop())
        {
          pos_top = $e.offset().top + $e.outerHeight() + arrow;

          tipso_bubble.find('.tipso_arrow').css({
            'border-bottom-color': arrow_color,
            'border-top-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });

          /*
           * Hide and show the appropriate rounded corners
           */
          removeCornerClasses(tipso_bubble);
          tipso_bubble.addClass("bottom_right_corner");
          tipso_bubble.find(".tipso_title").addClass("bottom_right_corner");
          tipso_bubble.find('.tipso_arrow').css({
            'border-left-color': arrow_color,
          });

          tipso_bubble.removeClass('top-right top bottom left right');
          tipso_bubble.addClass('bottom');
        }
        else
        {
          tipso_bubble.find('.tipso_arrow').css({
            'border-top-color': obj.settings.background,
            'border-bottom-color': 'transparent ',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });

          /*
           * Hide and show the appropriate rounded corners
           */
          removeCornerClasses(tipso_bubble);
          tipso_bubble.addClass("top_right_corner");
          tipso_bubble.find('.tipso_arrow').css({
            'border-left-color': obj.settings.background,
          });

          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('top');
        }
        break;
      case 'top-left':
        pos_left = $e.offset().left - (realHeight(tipso_bubble).width);
        pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: -obj.settings.arrowWidth,
          marginTop: '',
        });
        if (pos_top < $win.scrollTop())
        {
          pos_top = $e.offset().top + $e.outerHeight() + arrow;

          tipso_bubble.find('.tipso_arrow').css({
            'border-bottom-color': arrow_color,
            'border-top-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });

          /*
           * Hide and show the appropriate rounded corners
           */
          removeCornerClasses(tipso_bubble);
          tipso_bubble.addClass("bottom_left_corner");
          tipso_bubble.find(".tipso_title").addClass("bottom_left_corner");
          tipso_bubble.find('.tipso_arrow').css({
            'border-right-color': arrow_color,
          });

          tipso_bubble.removeClass('top-right top bottom left right');
          tipso_bubble.addClass('bottom');
        }
        else
        {
          tipso_bubble.find('.tipso_arrow').css({
            'border-top-color': obj.settings.background,
            'border-bottom-color': 'transparent ',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });

          /*
           * Hide and show the appropriate rounded corners
           */
          removeCornerClasses(tipso_bubble);
          tipso_bubble.addClass("top_left_corner");
          tipso_bubble.find('.tipso_arrow').css({
            'border-right-color': obj.settings.background,
          });

          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('top');
        }
        break;

      /*
       * Bottom right position
       */
      case 'bottom-right':
       pos_left = $e.offset().left + ($e.outerWidth());
       pos_top = $e.offset().top + $e.outerHeight() + arrow;
       tipso_bubble.find('.tipso_arrow').css({
         marginLeft: -obj.settings.arrowWidth,
         marginTop: '',
       });
       if (pos_top + realHeight(tipso_bubble).height > $win.scrollTop() + $win.outerHeight())
       {
         pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;

         tipso_bubble.find('.tipso_arrow').css({
           'border-bottom-color': 'transparent',
           'border-top-color': obj.settings.background,
           'border-left-color': 'transparent',
           'border-right-color': 'transparent'
         });

         /*
          * Hide and show the appropriate rounded corners
          */
         removeCornerClasses(tipso_bubble);
         tipso_bubble.addClass("top_right_corner");
         tipso_bubble.find(".tipso_title").addClass("top_left_corner");
         tipso_bubble.find('.tipso_arrow').css({
           'border-left-color': obj.settings.background,
         });

         tipso_bubble.removeClass('top-right top bottom left right');
         tipso_bubble.addClass('top');
       }
       else
       {
         tipso_bubble.find('.tipso_arrow').css({
           'border-top-color': 'transparent',
           'border-bottom-color': arrow_color,
           'border-left-color': 'transparent',
           'border-right-color': 'transparent'
         });

         /*
          * Hide and show the appropriate rounded corners
          */
         removeCornerClasses(tipso_bubble);
         tipso_bubble.addClass("bottom_right_corner");
         tipso_bubble.find(".tipso_title").addClass("bottom_right_corner");
         tipso_bubble.find('.tipso_arrow').css({
           'border-left-color': arrow_color,
         });

         tipso_bubble.removeClass('top bottom left right');
         tipso_bubble.addClass('bottom');
       }
       break;

       /*
        * Bottom left position
        */
       case 'bottom-left':
        pos_left = $e.offset().left - (realHeight(tipso_bubble).width);
        pos_top = $e.offset().top + $e.outerHeight() + arrow;
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: -obj.settings.arrowWidth,
          marginTop: '',
        });
        if (pos_top + realHeight(tipso_bubble).height > $win.scrollTop() + $win.outerHeight())
        {
          pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;

          tipso_bubble.find('.tipso_arrow').css({
            'border-bottom-color': 'transparent',
            'border-top-color': obj.settings.background,
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });

          /*
           * Hide and show the appropriate rounded corners
           */
          removeCornerClasses(tipso_bubble);
          tipso_bubble.addClass("top_left_corner");
          tipso_bubble.find(".tipso_title").addClass("top_left_corner");
          tipso_bubble.find('.tipso_arrow').css({
            'border-right-color': obj.settings.background,
          });

          tipso_bubble.removeClass('top-right top bottom left right');
          tipso_bubble.addClass('top');
        }
        else
        {
          tipso_bubble.find('.tipso_arrow').css({
            'border-top-color': 'transparent',
            'border-bottom-color': arrow_color,
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });

          /*
           * Hide and show the appropriate rounded corners
           */
          removeCornerClasses(tipso_bubble);
          tipso_bubble.addClass("bottom_left_corner");
          tipso_bubble.find(".tipso_title").addClass("bottom_left_corner");
          tipso_bubble.find('.tipso_arrow').css({
            'border-right-color': arrow_color,
          });

          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('bottom');
        }
        break;
      /*
       * Top position
       */
      case 'top':
        pos_left = $e.offset().left + ($e.outerWidth() / 2) - (realHeight(tipso_bubble).width / 2);
        pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: -obj.settings.arrowWidth,
          marginTop: '',
        });
        if (pos_top < $win.scrollTop())
        {
          pos_top = $e.offset().top + $e.outerHeight() + arrow;

          tipso_bubble.find('.tipso_arrow').css({
            'border-bottom-color': arrow_color,
            'border-top-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });

          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('bottom');
        }
        else
        {
          tipso_bubble.find('.tipso_arrow').css({
            'border-top-color': obj.settings.background,
            'border-bottom-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('top');
        }
        break;
      case 'bottom':
        pos_left = $e.offset().left + ($e.outerWidth() / 2) - (realHeight(tipso_bubble).width / 2);
        pos_top = $e.offset().top + $e.outerHeight() + arrow;
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: -obj.settings.arrowWidth,
          marginTop: '',
        });
        if (pos_top + realHeight(tipso_bubble).height > $win.scrollTop() + $win.outerHeight())
        {
          pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;
          tipso_bubble.find('.tipso_arrow').css({
            'border-top-color': obj.settings.background,
            'border-bottom-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('top');
        }
        else
        {
          tipso_bubble.find('.tipso_arrow').css({
            'border-bottom-color': arrow_color,
            'border-top-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass(obj.settings.position);
        }
        break;
      case 'left':
        pos_left = $e.offset().left - realHeight(tipso_bubble).width - arrow;
        pos_top = $e.offset().top + ($e.outerHeight() / 2) - (realHeight(tipso_bubble).height / 2);
        tipso_bubble.find('.tipso_arrow').css({
          marginTop: -obj.settings.arrowWidth,
          marginLeft: ''
        });
        if (pos_left < $win.scrollLeft())
        {
          pos_left = $e.offset().left + $e.outerWidth() + arrow;
          tipso_bubble.find('.tipso_arrow').css({
            'border-right-color': obj.settings.background,
            'border-left-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('right');
        }
        else
        {
          tipso_bubble.find('.tipso_arrow').css({
            'border-left-color': obj.settings.background,
            'border-right-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass(obj.settings.position);
        }
        break;
      case 'right':
        pos_left = $e.offset().left + $e.outerWidth() + arrow;
        pos_top = $e.offset().top + ($e.outerHeight() / 2) - (realHeight(tipso_bubble).height / 2);
        tipso_bubble.find('.tipso_arrow').css({
          marginTop: -obj.settings.arrowWidth,
          marginLeft: ''
        });
        if (pos_left + arrow + obj.settings.width > $win.scrollLeft() + $win.outerWidth())
        {
          pos_left = $e.offset().left - realHeight(tipso_bubble).width - arrow;
          tipso_bubble.find('.tipso_arrow').css({
            'border-left-color': obj.settings.background,
            'border-right-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('left');
        }
        else
        {
          tipso_bubble.find('.tipso_arrow').css({
            'border-right-color': obj.settings.background,
            'border-left-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass(obj.settings.position);
        }
        break;
    }
    /*
     * Set the position of the arrow for the corner positions
     */
    if (obj.settings.position === 'top-right')
    {
      tipso_bubble.find('.tipso_arrow').css({
        'margin-left': -obj.settings.width / 2
      });
    }
    if (obj.settings.position === 'top-left')
    {
      var tipso_arrow = tipso_bubble.find(".tipso_arrow").eq(0);
      tipso_arrow.css({
        'margin-left': obj.settings.width / 2 - 2 * obj.settings.arrowWidth
      });
    }
    if (obj.settings.position === 'bottom-right')
    {
      var tipso_arrow = tipso_bubble.find(".tipso_arrow").eq(0);
      tipso_arrow.css({
        'margin-left': -obj.settings.width / 2,
        'margin-top': ''
      });
    }
    if (obj.settings.position === 'bottom-left')
    {
      var tipso_arrow = tipso_bubble.find(".tipso_arrow").eq(0);
      tipso_arrow.css({
        'margin-left': obj.settings.width / 2 - 2 * obj.settings.arrowWidth,
        'margin-top': ''
      });
    }

    /*
     * Check out of boundness
     */
    if (pos_left < $win.scrollLeft() && (obj.settings.position === 'bottom' || obj.settings.position === 'top'))
    {
      tipso_bubble.find('.tipso_arrow').css({
        marginLeft: pos_left - obj.settings.arrowWidth
      });
      pos_left = 0;
    }
    if (pos_left + obj.settings.width > $win.outerWidth() && (obj.settings.position === 'bottom' || obj.settings.position === 'top'))
    {
      diff = $win.outerWidth() - (pos_left + obj.settings.width);
      tipso_bubble.find('.tipso_arrow').css({
        marginLeft: -diff - obj.settings.arrowWidth,
        marginTop: ''
      });
      pos_left = pos_left + diff;
    }
    if (pos_left < $win.scrollLeft() &&
       (obj.settings.position === 'left' ||
        obj.settings.position === 'right' ||
        obj.settings.position === 'top-right' ||
        obj.settings.position === 'top-left' ||
        obj.settings.position === 'bottom-right' ||
        obj.settings.position === 'bottom-left'))
    {
      pos_left = $e.offset().left + ($e.outerWidth() / 2) - (realHeight(tipso_bubble).width / 2);
      tipso_bubble.find('.tipso_arrow').css({
        marginLeft: -obj.settings.arrowWidth,
        marginTop: ''
      });
      pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;
      if (pos_top < $win.scrollTop())
      {
        pos_top = $e.offset().top + $e.outerHeight() + arrow;
        tipso_bubble.find('.tipso_arrow').css({
          'border-bottom-color': arrow_color,
          'border-top-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        });
        tipso_bubble.removeClass('top bottom left right');
        removeCornerClasses(tipso_bubble);
        tipso_bubble.addClass('bottom');
      }
      else
      {
        tipso_bubble.find('.tipso_arrow').css({
          'border-top-color': obj.settings.background,
          'border-bottom-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        });
        tipso_bubble.removeClass('top bottom left right');
        removeCornerClasses(tipso_bubble);
        tipso_bubble.addClass('top');
      }
      if (pos_left + obj.settings.width > $win.outerWidth())
      {
        diff = $win.outerWidth() - (pos_left + obj.settings.width);
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: -diff - obj.settings.arrowWidth,
          marginTop: ''
        });
        pos_left = pos_left + diff;
      }
      if (pos_left < $win.scrollLeft())
      {
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: pos_left - obj.settings.arrowWidth
        });
        pos_left = 0;
      }
    }

    /*
     * If out of bounds from the right hand side
     */
    if (pos_left + obj.settings.width > $win.outerWidth() &&
       (obj.settings.position === 'left' ||
        obj.settings.position === 'right' ||
        obj.settings.position === 'top-right' ||
        obj.settings.position === 'top-left' ||
        obj.settings.position === 'bottom-right' ||
        obj.settings.position === 'bottom-right'))
    {
      pos_left = $e.offset().left + ($e.outerWidth() / 2) - (realHeight(tipso_bubble).width / 2);
      tipso_bubble.find('.tipso_arrow').css({
        marginLeft: -obj.settings.arrowWidth,
        marginTop: ''
      });
      pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;
      if (pos_top < $win.scrollTop())
      {
        pos_top = $e.offset().top + $e.outerHeight() + arrow;
        tipso_bubble.find('.tipso_arrow').css({
          'border-bottom-color': arrow_color,
          'border-top-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        });

        removeCornerClasses(tipso_bubble);
        tipso_bubble.removeClass('top bottom left right');
        tipso_bubble.addClass('bottom');
      }
      else
      {
        tipso_bubble.find('.tipso_arrow').css({
          'border-top-color': obj.settings.background,
          'border-bottom-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        });

        /*
         * Hide and show the appropriate rounded corners
         */
        removeCornerClasses(tipso_bubble);
        tipso_bubble.removeClass('top bottom left right');
        tipso_bubble.addClass('top');
      }
      if (pos_left + obj.settings.width > $win.outerWidth())
      {
        diff = $win.outerWidth() - (pos_left + obj.settings.width);
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: -diff - obj.settings.arrowWidth,
          marginTop: ''
        });
        pos_left = pos_left + diff;
      }
      if (pos_left < $win.scrollLeft())
      {
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: pos_left - obj.settings.arrowWidth
        });
        pos_left = 0;
      }
    }
    tipso_bubble.css({
      left: pos_left + obj.settings.offsetX,
      top: pos_top + obj.settings.offsetY
    });

    // If positioned right or left and tooltip is out of bounds change position
    // This position change will be temporary, because preferedPosition is there
    // to help!!
    if (pos_top < $win.scrollTop() && (obj.settings.position === 'right' || obj.settings.position === 'left'))
    {
      $e.tipso('update', 'position', 'bottom');
      reposition(obj);
    }
    if (pos_top + realHeight(tipso_bubble).height > $win.scrollTop() + $win.outerHeight() &&
        (obj.settings.position === 'right' || obj.settings.position === 'left'))
    {
      $e.tipso('update', 'position', 'top');
      reposition(obj);
    }

  }
  $[pluginName] = $.fn[pluginName] = function(options) {
    var args = arguments;
    if (options === undefined || typeof options === 'object') {
      if (!(this instanceof $)) {
        $.extend(defaults, options);
      }
      return this.each(function() {
        if (!$.data(this, 'plugin_' + pluginName)) {
          $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
        }
      });
    } else if (typeof options === 'string' && options[0] !== '_' && options !==
      'init') {
      var returns;
      this.each(function() {
        var instance = $.data(this, 'plugin_' + pluginName);
        if (!instance) {
          instance = $.data(this, 'plugin_' + pluginName, new Plugin(
            this, options));
        }
        if (instance instanceof Plugin && typeof instance[options] ===
          'function') {
          returns = instance[options].apply(instance, Array.prototype.slice
            .call(args, 1));
        }
        if (options === 'destroy') {
          $.data(this, 'plugin_' + pluginName, null);
        }
      });
      return returns !== undefined ? returns : this;
    }
  };
}));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlbnRyeS5qcyIsIm5vZGVfbW9kdWxlcy90aXBzby9zcmMvdGlwc28uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXNcbiAqL1xuXG5nbG9iYWwualF1ZXJ5ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ2pRdWVyeSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnalF1ZXJ5J10gOiBudWxsKTtcbnJlcXVpcmUoJ3RpcHNvJyk7XG5cbi8qKlxuICogU3RhcnQgdGlwc29cbiAqL1xuXG5qUXVlcnkoZnVuY3Rpb24oKXtcbiAgalF1ZXJ5KCcudGl0bGUtdGlwc28nKS50aXBzbygpO1xufSk7IiwiLyohXHJcbiAqIHRpcHNvIC0gQSBMaWdodHdlaWdodCBSZXNwb25zaXZlIGpRdWVyeSBUb29sdGlwIFBsdWdpbiB2MS4wLjhcclxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUgQm9qYW4gUGV0a292c2tpXHJcbiAqIGh0dHA6Ly90aXBzby5vYmplY3Q1MDUuY29tXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxyXG4gKiBodHRwOi8vb2JqZWN0NTA1Lm1pdC1saWNlbnNlLm9yZy9cclxuICovXHJcbiAvLyBDb21tb25KUywgQU1EIG9yIGJyb3dzZXIgZ2xvYmFsc1xyXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcclxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXHJcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAvLyBOb2RlL0NvbW1vbkpTXHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydqUXVlcnknXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ2pRdWVyeSddIDogbnVsbCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCcm93c2VyIGdsb2JhbHNcclxuICAgICAgICBmYWN0b3J5KGpRdWVyeSk7XHJcbiAgICB9XHJcbn0oZnVuY3Rpb24oJCkge1xyXG4gIHZhciBwbHVnaW5OYW1lID0gXCJ0aXBzb1wiLFxyXG4gICAgZGVmYXVsdHMgPSB7XHJcbiAgICAgIHNwZWVkICAgICAgICAgICAgIDogNDAwLCAgICAgICAgICAvL0FuaW1hdGlvbiBzcGVlZFxyXG4gICAgICBiYWNrZ3JvdW5kICAgICAgICA6ICcjNTViNTU1JyxcclxuICAgICAgdGl0bGVCYWNrZ3JvdW5kICAgOiAnIzMzMzMzMycsXHJcbiAgICAgIGNvbG9yICAgICAgICAgICAgIDogJyNmZmZmZmYnLFxyXG4gICAgICB0aXRsZUNvbG9yICAgICAgICA6ICcjZmZmZmZmJyxcclxuICAgICAgdGl0bGVDb250ZW50ICAgICAgOiAnJywgICAgICAgICAgIC8vQ29udGVudCBvZiB0aGUgdGl0bGUgYmFyXHJcbiAgICAgIHNob3dBcnJvdyAgICAgICAgIDogdHJ1ZSxcclxuICAgICAgcG9zaXRpb24gICAgICAgICAgOiAndG9wJyxcclxuICAgICAgd2lkdGggICAgICAgICAgICAgOiAyMDAsXHJcbiAgICAgIG1heFdpZHRoICAgICAgICAgIDogJycsXHJcbiAgICAgIGRlbGF5ICAgICAgICAgICAgIDogMjAwLFxyXG4gICAgICBoaWRlRGVsYXkgICAgICAgICA6IDAsXHJcbiAgICAgIGFuaW1hdGlvbkluICAgICAgIDogJycsXHJcbiAgICAgIGFuaW1hdGlvbk91dCAgICAgIDogJycsXHJcbiAgICAgIG9mZnNldFggICAgICAgICAgIDogMCxcclxuICAgICAgb2Zmc2V0WSAgICAgICAgICAgOiAwLFxyXG4gICAgICBhcnJvd1dpZHRoICAgICAgICA6IDgsXHJcbiAgICAgIHRvb2x0aXBIb3ZlciAgICAgIDogZmFsc2UsXHJcbiAgICAgIGNvbnRlbnQgICAgICAgICAgIDogbnVsbCxcclxuICAgICAgYWpheENvbnRlbnRVcmwgICAgOiBudWxsLFxyXG4gICAgICBhamF4Q29udGVudEJ1ZmZlciA6IDAsXHJcbiAgICAgIGNvbnRlbnRFbGVtZW50SWQgIDogbnVsbCwgICAgICAgICAvL05vcm1hbGx5IHVzZWQgZm9yIHBpY2tpbmcgdGVtcGxhdGUgc2NyaXB0c1xyXG4gICAgICB1c2VUaXRsZSAgICAgICAgICA6IGZhbHNlLCAgICAgICAgLy9Vc2UgdGhlIHRpdGxlIHRhZyBhcyB0b29wdGlwIG9yIG5vdFxyXG4gICAgICB0ZW1wbGF0ZUVuZ2luZUZ1bmM6IG51bGwsICAgICAgICAgLy9BIGZ1bmN0aW9uIHRoYXQgY29tcGlsZXMgYW5kIHJlbmRlcnMgdGhlIGNvbnRlbnRcclxuICAgICAgb25CZWZvcmVTaG93ICAgICAgOiBudWxsLFxyXG4gICAgICBvblNob3cgICAgICAgICAgICA6IG51bGwsXHJcbiAgICAgIG9uSGlkZSAgICAgICAgICAgIDogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgZnVuY3Rpb24gUGx1Z2luKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gJCh0aGlzLmVsZW1lbnQpO1xyXG4gICAgdGhpcy5kb2MgPSAkKGRvY3VtZW50KTtcclxuICAgIHRoaXMud2luID0gJCh3aW5kb3cpO1xyXG4gICAgdGhpcy5zZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XHJcblxyXG4gICAgLypcclxuICAgICAqIFByb2Nlc3MgYW5kIGFkZCBkYXRhLWF0dHJzIHRvIHNldHRpbmdzIGFzIHdlbGwgZm9yIGVhc2Ugb2YgdXNlLiBBbHNvLCBpZlxyXG4gICAgICogZGF0YS10aXBzbyBpcyBhbiBvYmplY3QgdGhlbiB1c2UgaXQgYXMgZXh0cmEgc2V0dGluZ3MgYW5kIGlmIGl0J3Mgbm90XHJcbiAgICAgKiB0aGVuIHVzZSBpdCBhcyBhIHRpdGxlLlxyXG4gICAgICovXHJcbiAgICBpZiAodHlwZW9mKHRoaXMuJGVsZW1lbnQuZGF0YShcInRpcHNvXCIpKSA9PT0gXCJvYmplY3RcIilcclxuICAgIHtcclxuICAgICAgJC5leHRlbmQodGhpcy5zZXR0aW5ncywgdGhpcy4kZWxlbWVudC5kYXRhKFwidGlwc29cIikpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBkYXRhX2tleXMgPSBPYmplY3Qua2V5cyh0aGlzLiRlbGVtZW50LmRhdGEoKSk7XHJcbiAgICB2YXIgZGF0YV9hdHRycyA9IHt9O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhX2tleXMubGVuZ3RoOyBpKyspXHJcbiAgICB7XHJcbiAgICAgIHZhciBrZXkgPSBkYXRhX2tleXNbaV0ucmVwbGFjZShwbHVnaW5OYW1lLCBcIlwiKTtcclxuICAgICAgaWYgKGtleSA9PT0gXCJcIilcclxuICAgICAge1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcbiAgICAgIC8vbG93ZXJjYXNlIGZpcnN0IGxldHRlclxyXG4gICAgICBrZXkgPSBrZXkuY2hhckF0KDApLnRvTG93ZXJDYXNlKCkgKyBrZXkuc2xpY2UoMSk7XHJcbiAgICAgIGRhdGFfYXR0cnNba2V5XSA9IHRoaXMuJGVsZW1lbnQuZGF0YShkYXRhX2tleXNbaV0pO1xyXG5cclxuICAgICAgLy9XZSBjYW5ub3QgdXNlIGV4dGVuZCBmb3IgZGF0YV9hdHRycyBiZWNhdXNlIHRoZXkgYXJlIGF1dG9tYXRpY2FsbHlcclxuICAgICAgLy9sb3dlcmNhc2VkLiBXZSBuZWVkIHRvIGRvIHRoaXMgbWFudWFsbHkgYW5kIGV4dGVuZCB0aGlzLnNldHRpbmdzIHdpdGhcclxuICAgICAgLy9kYXRhX2F0dHJzXHJcbiAgICAgIGZvciAodmFyIHNldHRpbmdzX2tleSBpbiB0aGlzLnNldHRpbmdzKVxyXG4gICAgICB7XHJcbiAgICAgICAgaWYgKHNldHRpbmdzX2tleS50b0xvd2VyQ2FzZSgpID09IGtleSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aGlzLnNldHRpbmdzW3NldHRpbmdzX2tleV0gPSBkYXRhX2F0dHJzW2tleV07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZGVmYXVsdHMgPSBkZWZhdWx0cztcclxuICAgIHRoaXMuX25hbWUgPSBwbHVnaW5OYW1lO1xyXG4gICAgdGhpcy5fdGl0bGUgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ3RpdGxlJyk7XHJcbiAgICB0aGlzLm1vZGUgPSAnaGlkZSc7XHJcbiAgICB0aGlzLmllRmFkZSA9ICFzdXBwb3J0c1RyYW5zaXRpb25zO1xyXG5cclxuICAgIC8vQnkga2VlcGluZyB0aGUgb3JpZ2luYWwgcHJlZmVyZWQgcG9zaXRpb24gYW5kIHJlcG9zaXRpb25pbmcgYnkgY2FsbGluZ1xyXG4gICAgLy90aGUgcmVwb3NpdGlvbiBmdW5jdGlvbiB3ZSBjYW4gbWFrZSBmb3IgbW9yZSBzbWFydCBhbmQgZWFzaWVyIHBvc2l0aW9uaW5nXHJcbiAgICAvL2luIGNvbXBsZXggc2NlbmFyaW9zIVxyXG4gICAgdGhpcy5zZXR0aW5ncy5wcmVmZXJlZFBvc2l0aW9uID0gdGhpcy5zZXR0aW5ncy5wb3NpdGlvbjtcclxuXHJcbiAgICB0aGlzLmluaXQoKTtcclxuICB9XHJcblxyXG4gICQuZXh0ZW5kKFBsdWdpbi5wcm90b3R5cGUsIHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgb2JqID0gdGhpcyxcclxuICAgICAgICAkZSA9IHRoaXMuJGVsZW1lbnQsXHJcbiAgICAgICAgJGRvYyA9IHRoaXMuZG9jO1xyXG4gICAgICAkZS5hZGRDbGFzcygndGlwc29fc3R5bGUnKS5yZW1vdmVBdHRyKCd0aXRsZScpO1xyXG5cclxuICAgICAgaWYgKG9iai5zZXR0aW5ncy50b29sdGlwSG92ZXIpIHtcclxuICAgICAgICB2YXIgd2FpdEZvckhvdmVyID0gbnVsbCxcclxuICAgICAgICAgICAgaG92ZXJIZWxwZXIgPSBudWxsO1xyXG4gICAgICAgICRlLm9uKCdtb3VzZW92ZXInICsgJy4nICsgcGx1Z2luTmFtZSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBjbGVhclRpbWVvdXQod2FpdEZvckhvdmVyKTtcclxuICAgICAgICAgIGNsZWFyVGltZW91dChob3ZlckhlbHBlcik7XHJcbiAgICAgICAgICBob3ZlckhlbHBlciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgb2JqLnNob3coKTtcclxuICAgICAgICAgIH0sIDE1MCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJGUub24oJ21vdXNlb3V0JyArICcuJyArIHBsdWdpbk5hbWUsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHdhaXRGb3JIb3Zlcik7XHJcbiAgICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJIZWxwZXIpO1xyXG4gICAgICAgICAgd2FpdEZvckhvdmVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBvYmouaGlkZSgpO1xyXG4gICAgICAgICAgfSwgMjAwKTtcclxuXHJcbiAgICAgICAgICBvYmoudG9vbHRpcCgpXHJcbiAgICAgICAgICAgIC5vbignbW91c2VvdmVyJyArICcuJyArIHBsdWdpbk5hbWUsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIG9iai5tb2RlID0gJ3Rvb2x0aXBIb3Zlcic7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbignbW91c2VvdXQnICsgJy4nICsgcGx1Z2luTmFtZSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgb2JqLm1vZGUgPSAnc2hvdyc7XHJcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHdhaXRGb3JIb3Zlcik7XHJcbiAgICAgICAgICAgICAgd2FpdEZvckhvdmVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgb2JqLmhpZGUoKTtcclxuICAgICAgICAgICAgICB9LCAyMDApO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIDtcclxuICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAkZS5vbignbW91c2VvdmVyJyArICcuJyArIHBsdWdpbk5hbWUsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgb2JqLnNob3coKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkZS5vbignbW91c2VvdXQnICsgJy4nICsgcGx1Z2luTmFtZSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBvYmouaGlkZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblx0ICBpZihvYmouc2V0dGluZ3MuYWpheENvbnRlbnRVcmwpXHJcblx0ICB7XHJcblx0XHRvYmouYWpheENvbnRlbnQgPSBudWxsO1xyXG5cdCAgfVxyXG4gICAgfSxcclxuICAgIHRvb2x0aXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAoIXRoaXMudGlwc29fYnViYmxlKSB7XHJcbiAgICAgICAgdGhpcy50aXBzb19idWJibGUgPSAkKFxyXG4gICAgICAgICAgJzxkaXYgY2xhc3M9XCJ0aXBzb19idWJibGVcIj48ZGl2IGNsYXNzPVwidGlwc29fdGl0bGVcIj48L2Rpdj48ZGl2IGNsYXNzPVwidGlwc29fY29udGVudFwiPjwvZGl2PjxkaXYgY2xhc3M9XCJ0aXBzb19hcnJvd1wiPjwvZGl2PjwvZGl2PidcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzLnRpcHNvX2J1YmJsZTtcclxuICAgIH0sXHJcbiAgICBzaG93OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHRpcHNvX2J1YmJsZSA9IHRoaXMudG9vbHRpcCgpLFxyXG4gICAgICAgIG9iaiA9IHRoaXMsXHJcbiAgICAgICAgJHdpbiA9IHRoaXMud2luO1xyXG5cclxuICAgICAgaWYgKG9iai5zZXR0aW5ncy5zaG93QXJyb3cgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZChcIi50aXBzb19hcnJvd1wiKS5oaWRlKCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZChcIi50aXBzb19hcnJvd1wiKS5zaG93KCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvYmoubW9kZSA9PT0gJ2hpZGUnKSB7XHJcbiAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihvYmouc2V0dGluZ3Mub25CZWZvcmVTaG93KSkge1xyXG4gICAgICAgICAgb2JqLnNldHRpbmdzLm9uQmVmb3JlU2hvdyhvYmouJGVsZW1lbnQsIG9iai5lbGVtZW50LCBvYmopO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob2JqLnNldHRpbmdzLnNpemUpIHtcclxuICAgICAgICAgICAgdGlwc29fYnViYmxlLmFkZENsYXNzKG9iai5zZXR0aW5ncy5zaXplKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9iai5zZXR0aW5ncy53aWR0aCkge1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmNzcyh7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IG9iai5zZXR0aW5ncy5iYWNrZ3JvdW5kLFxyXG4gICAgICAgICAgICBjb2xvcjogb2JqLnNldHRpbmdzLmNvbG9yLFxyXG4gICAgICAgICAgICB3aWR0aDogb2JqLnNldHRpbmdzLndpZHRoXHJcbiAgICAgICAgICB9KS5oaWRlKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChvYmouc2V0dGluZ3MubWF4V2lkdGgpe1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmNzcyh7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IG9iai5zZXR0aW5ncy5iYWNrZ3JvdW5kLFxyXG4gICAgICAgICAgICBjb2xvcjogb2JqLnNldHRpbmdzLmNvbG9yLFxyXG4gICAgICAgICAgICBtYXhXaWR0aDogb2JqLnNldHRpbmdzLm1heFdpZHRoXHJcbiAgICAgICAgICB9KS5oaWRlKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5jc3Moe1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiBvYmouc2V0dGluZ3MuYmFja2dyb3VuZCxcclxuICAgICAgICAgICAgY29sb3I6IG9iai5zZXR0aW5ncy5jb2xvcixcclxuICAgICAgICAgICAgd2lkdGg6IDIwMFxyXG4gICAgICAgICAgfSkuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX3RpdGxlJykuY3NzKHtcclxuICAgICAgICAgICAgYmFja2dyb3VuZDogb2JqLnNldHRpbmdzLnRpdGxlQmFja2dyb3VuZCxcclxuICAgICAgICAgICAgY29sb3I6IG9iai5zZXR0aW5ncy50aXRsZUNvbG9yXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19jb250ZW50JykuaHRtbChvYmouY29udGVudCgpKTtcclxuICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX3RpdGxlJykuaHRtbChvYmoudGl0bGVDb250ZW50KCkpO1xyXG4gICAgICAgIHJlcG9zaXRpb24ob2JqKTtcclxuXHJcbiAgICAgICAgJHdpbi5vbigncmVzaXplJyArICcuJyArIHBsdWdpbk5hbWUsIGZ1bmN0aW9uIHRpcHNvUmVzaXplSGFuZGxlciAoKSB7XHJcbiAgICAgICAgICAgIG9iai5zZXR0aW5ncy5wb3NpdGlvbiA9IG9iai5zZXR0aW5ncy5wcmVmZXJlZFBvc2l0aW9uO1xyXG4gICAgICAgICAgICByZXBvc2l0aW9uKG9iaik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQob2JqLnRpbWVvdXQpO1xyXG4gICAgICAgIG9iai50aW1lb3V0ID0gbnVsbDtcclxuICAgICAgICBvYmoudGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKG9iai5pZUZhZGUgfHwgb2JqLnNldHRpbmdzLmFuaW1hdGlvbkluID09PSAnJyB8fCBvYmouc2V0dGluZ3MuYW5pbWF0aW9uT3V0ID09PSAnJyl7XHJcbiAgICAgICAgICAgIHRpcHNvX2J1YmJsZS5hcHBlbmRUbygnYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZUluKG9iai5zZXR0aW5nc1xyXG4gICAgICAgICAgICAuc3BlZWQsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIG9iai5tb2RlID0gJ3Nob3cnO1xyXG4gICAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob2JqLnNldHRpbmdzLm9uU2hvdykpIHtcclxuICAgICAgICAgICAgICAgIG9iai5zZXR0aW5ncy5vblNob3cob2JqLiRlbGVtZW50LCBvYmouZWxlbWVudCwgb2JqKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGlwc29fYnViYmxlLnJlbW92ZSgpLmFwcGVuZFRvKCdib2R5JylcclxuICAgICAgICAgICAgLnN0b3AodHJ1ZSwgdHJ1ZSlcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdhbmltYXRlZCAnICsgb2JqLnNldHRpbmdzLmFuaW1hdGlvbk91dClcclxuICAgICAgICAgICAgLmFkZENsYXNzKCdub0FuaW1hdGlvbicpXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnbm9BbmltYXRpb24nKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2FuaW1hdGVkICcgKyBvYmouc2V0dGluZ3MuYW5pbWF0aW9uSW4pLmZhZGVJbihvYmouc2V0dGluZ3Muc3BlZWQsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICQodGhpcykub25lKCd3ZWJraXRBbmltYXRpb25FbmQgbW96QW5pbWF0aW9uRW5kIE1TQW5pbWF0aW9uRW5kIG9hbmltYXRpb25lbmQgYW5pbWF0aW9uZW5kJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ2FuaW1hdGVkICcgKyBvYmouc2V0dGluZ3MuYW5pbWF0aW9uSW4pO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgIG9iai5tb2RlID0gJ3Nob3cnO1xyXG4gICAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob2JqLnNldHRpbmdzLm9uU2hvdykpIHtcclxuICAgICAgICAgICAgICAgIG9iai5zZXR0aW5ncy5vblNob3cob2JqLiRlbGVtZW50LCBvYmouZWxlbWVudCwgb2JqKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgJHdpbi5vZmYoJ3Jlc2l6ZScgKyAnLicgKyBwbHVnaW5OYW1lLCBudWxsLCAndGlwc29SZXNpemVIYW5kbGVyJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIG9iai5zZXR0aW5ncy5kZWxheSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBoaWRlOiBmdW5jdGlvbihmb3JjZSkge1xyXG4gICAgICB2YXIgb2JqID0gdGhpcyxcclxuICAgICAgICAkd2luID0gdGhpcy53aW4sXHJcbiAgICAgICAgdGlwc29fYnViYmxlID0gdGhpcy50b29sdGlwKCksXHJcbiAgICAgICAgaGlkZURlbGF5ID0gb2JqLnNldHRpbmdzLmhpZGVEZWxheTtcclxuXHJcbiAgICAgIGlmIChmb3JjZSkge1xyXG4gICAgICAgIGhpZGVEZWxheSA9IDA7XHJcbiAgICAgICAgb2JqLm1vZGUgPSAnc2hvdyc7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQob2JqLnRpbWVvdXQpO1xyXG4gICAgICBvYmoudGltZW91dCA9IG51bGw7XHJcbiAgICAgIG9iai50aW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKG9iai5tb2RlICE9PSAndG9vbHRpcEhvdmVyJykge1xyXG4gICAgICAgICAgaWYgKG9iai5pZUZhZGUgfHwgb2JqLnNldHRpbmdzLmFuaW1hdGlvbkluID09PSAnJyB8fCBvYmouc2V0dGluZ3MuYW5pbWF0aW9uT3V0ID09PSAnJyl7XHJcbiAgICAgICAgICAgIHRpcHNvX2J1YmJsZS5zdG9wKHRydWUsIHRydWUpLmZhZGVPdXQob2JqLnNldHRpbmdzLnNwZWVkLFxyXG4gICAgICAgICAgICBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob2JqLnNldHRpbmdzLm9uSGlkZSkgJiYgb2JqLm1vZGUgPT09ICdzaG93Jykge1xyXG4gICAgICAgICAgICAgICAgb2JqLnNldHRpbmdzLm9uSGlkZShvYmouJGVsZW1lbnQsIG9iai5lbGVtZW50LCBvYmopO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBvYmoubW9kZSA9ICdoaWRlJztcclxuICAgICAgICAgICAgICAkd2luLm9mZigncmVzaXplJyArICcuJyArIHBsdWdpbk5hbWUsIG51bGwsICd0aXBzb1Jlc2l6ZUhhbmRsZXInKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aXBzb19idWJibGUuc3RvcCh0cnVlLCB0cnVlKVxyXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FuaW1hdGVkICcgKyBvYmouc2V0dGluZ3MuYW5pbWF0aW9uSW4pXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnbm9BbmltYXRpb24nKS5yZW1vdmVDbGFzcygnbm9BbmltYXRpb24nKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2FuaW1hdGVkICcgKyBvYmouc2V0dGluZ3MuYW5pbWF0aW9uT3V0KVxyXG4gICAgICAgICAgICAub25lKCd3ZWJraXRBbmltYXRpb25FbmQgbW96QW5pbWF0aW9uRW5kIE1TQW5pbWF0aW9uRW5kIG9hbmltYXRpb25lbmQgYW5pbWF0aW9uZW5kJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdhbmltYXRlZCAnICsgb2JqLnNldHRpbmdzLmFuaW1hdGlvbk91dCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihvYmouc2V0dGluZ3Mub25IaWRlKSAmJiBvYmoubW9kZSA9PT0gJ3Nob3cnKSB7XHJcbiAgICAgICAgICAgICAgICBvYmouc2V0dGluZ3Mub25IaWRlKG9iai4kZWxlbWVudCwgb2JqLmVsZW1lbnQsIG9iaik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIG9iai5tb2RlID0gJ2hpZGUnO1xyXG4gICAgICAgICAgICAgICR3aW4ub2ZmKCdyZXNpemUnICsgJy4nICsgcGx1Z2luTmFtZSwgbnVsbCwgJ3RpcHNvUmVzaXplSGFuZGxlcicpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sIGhpZGVEZWxheSk7XHJcbiAgICB9LFxyXG4gICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmhpZGUodHJ1ZSk7XHJcbiAgICB9LFxyXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciAkZSA9IHRoaXMuJGVsZW1lbnQsXHJcbiAgICAgICAgJHdpbiA9IHRoaXMud2luLFxyXG4gICAgICAgICRkb2MgPSB0aGlzLmRvYztcclxuICAgICAgJGUub2ZmKCcuJyArIHBsdWdpbk5hbWUpO1xyXG4gICAgICAkd2luLm9mZigncmVzaXplJyArICcuJyArIHBsdWdpbk5hbWUsIG51bGwsICd0aXBzb1Jlc2l6ZUhhbmRsZXInKTtcclxuICAgICAgJGUucmVtb3ZlRGF0YShwbHVnaW5OYW1lKTtcclxuICAgICAgJGUucmVtb3ZlQ2xhc3MoJ3RpcHNvX3N0eWxlJykuYXR0cigndGl0bGUnLCB0aGlzLl90aXRsZSk7XHJcbiAgICB9LFxyXG4gICAgdGl0bGVDb250ZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgY29udGVudCxcclxuICAgICAgICAgICRlID0gdGhpcy4kZWxlbWVudCxcclxuICAgICAgICAgIG9iaiA9IHRoaXM7XHJcbiAgICAgICAgaWYgKG9iai5zZXR0aW5ncy50aXRsZUNvbnRlbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb250ZW50ID0gb2JqLnNldHRpbmdzLnRpdGxlQ29udGVudDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29udGVudCA9ICRlLmRhdGEoJ3RpcHNvLXRpdGxlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgfSxcclxuICAgIGNvbnRlbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgY29udGVudCxcclxuICAgICAgICAkZSA9IHRoaXMuJGVsZW1lbnQsXHJcbiAgICAgICAgb2JqID0gdGhpcyxcclxuICAgICAgICB0aXRsZSA9IHRoaXMuX3RpdGxlO1xyXG4gICAgICBpZiAob2JqLnNldHRpbmdzLmFqYXhDb250ZW50VXJsKVxyXG4gICAgICB7XHJcblx0XHRpZihvYmouX2FqYXhDb250ZW50KVxyXG5cdFx0e1xyXG5cdFx0XHRjb250ZW50ID0gb2JqLl9hamF4Q29udGVudDtcclxuXHRcdH1cclxuXHRcdGVsc2UgXHJcblx0XHR7XHJcblx0XHRcdG9iai5fYWpheENvbnRlbnQgPSBjb250ZW50ID0gJC5hamF4KHtcclxuXHRcdFx0ICB0eXBlOiBcIkdFVFwiLFxyXG5cdFx0XHQgIHVybDogb2JqLnNldHRpbmdzLmFqYXhDb250ZW50VXJsLFxyXG5cdFx0XHQgIGFzeW5jOiBmYWxzZVxyXG5cdFx0XHR9KS5yZXNwb25zZVRleHQ7XHJcblx0XHRcdGlmKG9iai5zZXR0aW5ncy5hamF4Q29udGVudEJ1ZmZlciA+IDApXHJcblx0XHRcdHtcclxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IFxyXG5cdFx0XHRcdFx0b2JqLl9hamF4Q29udGVudCA9IG51bGw7XHJcblx0XHRcdFx0fSwgb2JqLnNldHRpbmdzLmFqYXhDb250ZW50QnVmZmVyKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0b2JqLl9hamF4Q29udGVudCA9IG51bGw7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmIChvYmouc2V0dGluZ3MuY29udGVudEVsZW1lbnRJZClcclxuICAgICAge1xyXG4gICAgICAgIGNvbnRlbnQgPSAkKFwiI1wiICsgb2JqLnNldHRpbmdzLmNvbnRlbnRFbGVtZW50SWQpLnRleHQoKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmIChvYmouc2V0dGluZ3MuY29udGVudClcclxuICAgICAge1xyXG4gICAgICAgIGNvbnRlbnQgPSBvYmouc2V0dGluZ3MuY29udGVudDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlXHJcbiAgICAgIHtcclxuICAgICAgICBpZiAob2JqLnNldHRpbmdzLnVzZVRpdGxlID09PSB0cnVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGNvbnRlbnQgPSB0aXRsZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIE9ubHkgdXNlIGRhdGEtdGlwc28gYXMgY29udGVudCBpZiBpdCdzIG5vdCBiZWluZyB1c2VkIGZvciBzZXR0aW5nc1xyXG4gICAgICAgICAgaWYgKHR5cGVvZigkZS5kYXRhKFwidGlwc29cIikpID09PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBjb250ZW50ID0gJGUuZGF0YSgndGlwc28nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG9iai5zZXR0aW5ncy50ZW1wbGF0ZUVuZ2luZUZ1bmMgIT09IG51bGwpXHJcbiAgICAgIHtcclxuICAgICAgICAgIGNvbnRlbnQgPSBvYmouc2V0dGluZ3MudGVtcGxhdGVFbmdpbmVGdW5jKGNvbnRlbnQpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgfSxcclxuICAgIHVwZGF0ZTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICB2YXIgb2JqID0gdGhpcztcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgb2JqLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gb2JqLnNldHRpbmdzW2tleV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgZnVuY3Rpb24gcmVhbEhlaWdodChvYmopIHtcclxuICAgIHZhciBjbG9uZSA9IG9iai5jbG9uZSgpO1xyXG4gICAgY2xvbmUuY3NzKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICAgICQoJ2JvZHknKS5hcHBlbmQoY2xvbmUpO1xyXG4gICAgdmFyIGhlaWdodCA9IGNsb25lLm91dGVySGVpZ2h0KCk7XHJcbiAgICB2YXIgd2lkdGggPSBjbG9uZS5vdXRlcldpZHRoKCk7XHJcbiAgICBjbG9uZS5yZW1vdmUoKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICd3aWR0aCcgOiB3aWR0aCxcclxuICAgICAgJ2hlaWdodCcgOiBoZWlnaHRcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICB2YXIgc3VwcG9ydHNUcmFuc2l0aW9ucyA9IChmdW5jdGlvbigpIHtcclxuICAgIHZhciBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpLnN0eWxlLFxyXG4gICAgICAgIHYgPSBbJ21zJywnTycsJ01veicsJ1dlYmtpdCddO1xyXG4gICAgaWYoIHNbJ3RyYW5zaXRpb24nXSA9PT0gJycgKSByZXR1cm4gdHJ1ZTtcclxuICAgIHdoaWxlKCB2Lmxlbmd0aCApXHJcbiAgICAgICAgaWYoIHYucG9wKCkgKyAnVHJhbnNpdGlvbicgaW4gcyApXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pKCk7XHJcblxyXG4gIGZ1bmN0aW9uIHJlbW92ZUNvcm5lckNsYXNzZXMob2JqKSB7XHJcbiAgICBvYmoucmVtb3ZlQ2xhc3MoXCJ0b3BfcmlnaHRfY29ybmVyIGJvdHRvbV9yaWdodF9jb3JuZXIgdG9wX2xlZnRfY29ybmVyIGJvdHRvbV9sZWZ0X2Nvcm5lclwiKTtcclxuICAgIG9iai5maW5kKFwiLnRpcHNvX3RpdGxlXCIpLnJlbW92ZUNsYXNzKFwidG9wX3JpZ2h0X2Nvcm5lciBib3R0b21fcmlnaHRfY29ybmVyIHRvcF9sZWZ0X2Nvcm5lciBib3R0b21fbGVmdF9jb3JuZXJcIik7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiByZXBvc2l0aW9uKHRoaXN0aGF0KSB7XHJcbiAgICB2YXIgdGlwc29fYnViYmxlID0gdGhpc3RoYXQudG9vbHRpcCgpLFxyXG4gICAgICAkZSA9IHRoaXN0aGF0LiRlbGVtZW50LFxyXG4gICAgICBvYmogPSB0aGlzdGhhdCxcclxuICAgICAgJHdpbiA9ICQod2luZG93KSxcclxuICAgICAgYXJyb3cgPSAxMCxcclxuICAgICAgcG9zX3RvcCwgcG9zX2xlZnQsIGRpZmY7XHJcblxyXG4gICAgdmFyIGFycm93X2NvbG9yID0gb2JqLnNldHRpbmdzLmJhY2tncm91bmQ7XHJcbiAgICB2YXIgdGl0bGVfY29udGVudCA9IG9iai50aXRsZUNvbnRlbnQoKTtcclxuICAgIGlmICh0aXRsZV9jb250ZW50ICE9PSB1bmRlZmluZWQgJiYgdGl0bGVfY29udGVudCAhPT0gJycpIHtcclxuICAgICAgICBhcnJvd19jb2xvciA9IG9iai5zZXR0aW5ncy50aXRsZUJhY2tncm91bmQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCRlLnBhcmVudCgpLm91dGVyV2lkdGgoKSA+ICR3aW4ub3V0ZXJXaWR0aCgpKSB7XHJcbiAgICAgICR3aW4gPSAkZS5wYXJlbnQoKTtcclxuICAgIH1cclxuXHJcbiAgICBzd2l0Y2ggKG9iai5zZXR0aW5ncy5wb3NpdGlvbilcclxuICAgIHtcclxuICAgICAgY2FzZSAndG9wLXJpZ2h0JzpcclxuICAgICAgICBwb3NfbGVmdCA9ICRlLm9mZnNldCgpLmxlZnQgKyAoJGUub3V0ZXJXaWR0aCgpKTtcclxuICAgICAgICBwb3NfdG9wID0gJGUub2Zmc2V0KCkudG9wIC0gcmVhbEhlaWdodCh0aXBzb19idWJibGUpLmhlaWdodCAtIGFycm93O1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgbWFyZ2luTGVmdDogLW9iai5zZXR0aW5ncy5hcnJvd1dpZHRoLFxyXG4gICAgICAgICAgbWFyZ2luVG9wOiAnJyxcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAocG9zX3RvcCA8ICR3aW4uc2Nyb2xsVG9wKCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcG9zX3RvcCA9ICRlLm9mZnNldCgpLnRvcCArICRlLm91dGVySGVpZ2h0KCkgKyBhcnJvdztcclxuXHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgICAgJ2JvcmRlci1ib3R0b20tY29sb3InOiBhcnJvd19jb2xvcixcclxuICAgICAgICAgICAgJ2JvcmRlci10b3AtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYm9yZGVyLWxlZnQtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogJ3RyYW5zcGFyZW50J1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgLypcclxuICAgICAgICAgICAqIEhpZGUgYW5kIHNob3cgdGhlIGFwcHJvcHJpYXRlIHJvdW5kZWQgY29ybmVyc1xyXG4gICAgICAgICAgICovXHJcbiAgICAgICAgICByZW1vdmVDb3JuZXJDbGFzc2VzKHRpcHNvX2J1YmJsZSk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3MoXCJib3R0b21fcmlnaHRfY29ybmVyXCIpO1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoXCIudGlwc29fdGl0bGVcIikuYWRkQ2xhc3MoXCJib3R0b21fcmlnaHRfY29ybmVyXCIpO1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19hcnJvdycpLmNzcyh7XHJcbiAgICAgICAgICAgICdib3JkZXItbGVmdC1jb2xvcic6IGFycm93X2NvbG9yLFxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgdGlwc29fYnViYmxlLnJlbW92ZUNsYXNzKCd0b3AtcmlnaHQgdG9wIGJvdHRvbSBsZWZ0IHJpZ2h0Jyk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3MoJ2JvdHRvbScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19hcnJvdycpLmNzcyh7XHJcbiAgICAgICAgICAgICdib3JkZXItdG9wLWNvbG9yJzogb2JqLnNldHRpbmdzLmJhY2tncm91bmQsXHJcbiAgICAgICAgICAgICdib3JkZXItYm90dG9tLWNvbG9yJzogJ3RyYW5zcGFyZW50ICcsXHJcbiAgICAgICAgICAgICdib3JkZXItbGVmdC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdib3JkZXItcmlnaHQtY29sb3InOiAndHJhbnNwYXJlbnQnXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAvKlxyXG4gICAgICAgICAgICogSGlkZSBhbmQgc2hvdyB0aGUgYXBwcm9wcmlhdGUgcm91bmRlZCBjb3JuZXJzXHJcbiAgICAgICAgICAgKi9cclxuICAgICAgICAgIHJlbW92ZUNvcm5lckNsYXNzZXModGlwc29fYnViYmxlKTtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5hZGRDbGFzcyhcInRvcF9yaWdodF9jb3JuZXJcIik7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgICAgJ2JvcmRlci1sZWZ0LWNvbG9yJzogb2JqLnNldHRpbmdzLmJhY2tncm91bmQsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICB0aXBzb19idWJibGUucmVtb3ZlQ2xhc3MoJ3RvcCBib3R0b20gbGVmdCByaWdodCcpO1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmFkZENsYXNzKCd0b3AnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ3RvcC1sZWZ0JzpcclxuICAgICAgICBwb3NfbGVmdCA9ICRlLm9mZnNldCgpLmxlZnQgLSAocmVhbEhlaWdodCh0aXBzb19idWJibGUpLndpZHRoKTtcclxuICAgICAgICBwb3NfdG9wID0gJGUub2Zmc2V0KCkudG9wIC0gcmVhbEhlaWdodCh0aXBzb19idWJibGUpLmhlaWdodCAtIGFycm93O1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgbWFyZ2luTGVmdDogLW9iai5zZXR0aW5ncy5hcnJvd1dpZHRoLFxyXG4gICAgICAgICAgbWFyZ2luVG9wOiAnJyxcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAocG9zX3RvcCA8ICR3aW4uc2Nyb2xsVG9wKCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcG9zX3RvcCA9ICRlLm9mZnNldCgpLnRvcCArICRlLm91dGVySGVpZ2h0KCkgKyBhcnJvdztcclxuXHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgICAgJ2JvcmRlci1ib3R0b20tY29sb3InOiBhcnJvd19jb2xvcixcclxuICAgICAgICAgICAgJ2JvcmRlci10b3AtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYm9yZGVyLWxlZnQtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogJ3RyYW5zcGFyZW50J1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgLypcclxuICAgICAgICAgICAqIEhpZGUgYW5kIHNob3cgdGhlIGFwcHJvcHJpYXRlIHJvdW5kZWQgY29ybmVyc1xyXG4gICAgICAgICAgICovXHJcbiAgICAgICAgICByZW1vdmVDb3JuZXJDbGFzc2VzKHRpcHNvX2J1YmJsZSk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3MoXCJib3R0b21fbGVmdF9jb3JuZXJcIik7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZChcIi50aXBzb190aXRsZVwiKS5hZGRDbGFzcyhcImJvdHRvbV9sZWZ0X2Nvcm5lclwiKTtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogYXJyb3dfY29sb3IsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICB0aXBzb19idWJibGUucmVtb3ZlQ2xhc3MoJ3RvcC1yaWdodCB0b3AgYm90dG9tIGxlZnQgcmlnaHQnKTtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5hZGRDbGFzcygnYm90dG9tJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgICAgJ2JvcmRlci10b3AtY29sb3InOiBvYmouc2V0dGluZ3MuYmFja2dyb3VuZCxcclxuICAgICAgICAgICAgJ2JvcmRlci1ib3R0b20tY29sb3InOiAndHJhbnNwYXJlbnQgJyxcclxuICAgICAgICAgICAgJ2JvcmRlci1sZWZ0LWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JvcmRlci1yaWdodC1jb2xvcic6ICd0cmFuc3BhcmVudCdcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIC8qXHJcbiAgICAgICAgICAgKiBIaWRlIGFuZCBzaG93IHRoZSBhcHByb3ByaWF0ZSByb3VuZGVkIGNvcm5lcnNcclxuICAgICAgICAgICAqL1xyXG4gICAgICAgICAgcmVtb3ZlQ29ybmVyQ2xhc3Nlcyh0aXBzb19idWJibGUpO1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmFkZENsYXNzKFwidG9wX2xlZnRfY29ybmVyXCIpO1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19hcnJvdycpLmNzcyh7XHJcbiAgICAgICAgICAgICdib3JkZXItcmlnaHQtY29sb3InOiBvYmouc2V0dGluZ3MuYmFja2dyb3VuZCxcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5yZW1vdmVDbGFzcygndG9wIGJvdHRvbSBsZWZ0IHJpZ2h0Jyk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3MoJ3RvcCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIC8qXHJcbiAgICAgICAqIEJvdHRvbSByaWdodCBwb3NpdGlvblxyXG4gICAgICAgKi9cclxuICAgICAgY2FzZSAnYm90dG9tLXJpZ2h0JzpcclxuICAgICAgIHBvc19sZWZ0ID0gJGUub2Zmc2V0KCkubGVmdCArICgkZS5vdXRlcldpZHRoKCkpO1xyXG4gICAgICAgcG9zX3RvcCA9ICRlLm9mZnNldCgpLnRvcCArICRlLm91dGVySGVpZ2h0KCkgKyBhcnJvdztcclxuICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICBtYXJnaW5MZWZ0OiAtb2JqLnNldHRpbmdzLmFycm93V2lkdGgsXHJcbiAgICAgICAgIG1hcmdpblRvcDogJycsXHJcbiAgICAgICB9KTtcclxuICAgICAgIGlmIChwb3NfdG9wICsgcmVhbEhlaWdodCh0aXBzb19idWJibGUpLmhlaWdodCA+ICR3aW4uc2Nyb2xsVG9wKCkgKyAkd2luLm91dGVySGVpZ2h0KCkpXHJcbiAgICAgICB7XHJcbiAgICAgICAgIHBvc190b3AgPSAkZS5vZmZzZXQoKS50b3AgLSByZWFsSGVpZ2h0KHRpcHNvX2J1YmJsZSkuaGVpZ2h0IC0gYXJyb3c7XHJcblxyXG4gICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgICAnYm9yZGVyLWJvdHRvbS1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgJ2JvcmRlci10b3AtY29sb3InOiBvYmouc2V0dGluZ3MuYmFja2dyb3VuZCxcclxuICAgICAgICAgICAnYm9yZGVyLWxlZnQtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICdib3JkZXItcmlnaHQtY29sb3InOiAndHJhbnNwYXJlbnQnXHJcbiAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgLypcclxuICAgICAgICAgICogSGlkZSBhbmQgc2hvdyB0aGUgYXBwcm9wcmlhdGUgcm91bmRlZCBjb3JuZXJzXHJcbiAgICAgICAgICAqL1xyXG4gICAgICAgICByZW1vdmVDb3JuZXJDbGFzc2VzKHRpcHNvX2J1YmJsZSk7XHJcbiAgICAgICAgIHRpcHNvX2J1YmJsZS5hZGRDbGFzcyhcInRvcF9yaWdodF9jb3JuZXJcIik7XHJcbiAgICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKFwiLnRpcHNvX3RpdGxlXCIpLmFkZENsYXNzKFwidG9wX2xlZnRfY29ybmVyXCIpO1xyXG4gICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgICAnYm9yZGVyLWxlZnQtY29sb3InOiBvYmouc2V0dGluZ3MuYmFja2dyb3VuZCxcclxuICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICB0aXBzb19idWJibGUucmVtb3ZlQ2xhc3MoJ3RvcC1yaWdodCB0b3AgYm90dG9tIGxlZnQgcmlnaHQnKTtcclxuICAgICAgICAgdGlwc29fYnViYmxlLmFkZENsYXNzKCd0b3AnKTtcclxuICAgICAgIH1cclxuICAgICAgIGVsc2VcclxuICAgICAgIHtcclxuICAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19hcnJvdycpLmNzcyh7XHJcbiAgICAgICAgICAgJ2JvcmRlci10b3AtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICdib3JkZXItYm90dG9tLWNvbG9yJzogYXJyb3dfY29sb3IsXHJcbiAgICAgICAgICAgJ2JvcmRlci1sZWZ0LWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogJ3RyYW5zcGFyZW50J1xyXG4gICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgIC8qXHJcbiAgICAgICAgICAqIEhpZGUgYW5kIHNob3cgdGhlIGFwcHJvcHJpYXRlIHJvdW5kZWQgY29ybmVyc1xyXG4gICAgICAgICAgKi9cclxuICAgICAgICAgcmVtb3ZlQ29ybmVyQ2xhc3Nlcyh0aXBzb19idWJibGUpO1xyXG4gICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3MoXCJib3R0b21fcmlnaHRfY29ybmVyXCIpO1xyXG4gICAgICAgICB0aXBzb19idWJibGUuZmluZChcIi50aXBzb190aXRsZVwiKS5hZGRDbGFzcyhcImJvdHRvbV9yaWdodF9jb3JuZXJcIik7XHJcbiAgICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgICdib3JkZXItbGVmdC1jb2xvcic6IGFycm93X2NvbG9yLFxyXG4gICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgIHRpcHNvX2J1YmJsZS5yZW1vdmVDbGFzcygndG9wIGJvdHRvbSBsZWZ0IHJpZ2h0Jyk7XHJcbiAgICAgICAgIHRpcHNvX2J1YmJsZS5hZGRDbGFzcygnYm90dG9tJyk7XHJcbiAgICAgICB9XHJcbiAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAvKlxyXG4gICAgICAgICogQm90dG9tIGxlZnQgcG9zaXRpb25cclxuICAgICAgICAqL1xyXG4gICAgICAgY2FzZSAnYm90dG9tLWxlZnQnOlxyXG4gICAgICAgIHBvc19sZWZ0ID0gJGUub2Zmc2V0KCkubGVmdCAtIChyZWFsSGVpZ2h0KHRpcHNvX2J1YmJsZSkud2lkdGgpO1xyXG4gICAgICAgIHBvc190b3AgPSAkZS5vZmZzZXQoKS50b3AgKyAkZS5vdXRlckhlaWdodCgpICsgYXJyb3c7XHJcbiAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19hcnJvdycpLmNzcyh7XHJcbiAgICAgICAgICBtYXJnaW5MZWZ0OiAtb2JqLnNldHRpbmdzLmFycm93V2lkdGgsXHJcbiAgICAgICAgICBtYXJnaW5Ub3A6ICcnLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChwb3NfdG9wICsgcmVhbEhlaWdodCh0aXBzb19idWJibGUpLmhlaWdodCA+ICR3aW4uc2Nyb2xsVG9wKCkgKyAkd2luLm91dGVySGVpZ2h0KCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcG9zX3RvcCA9ICRlLm9mZnNldCgpLnRvcCAtIHJlYWxIZWlnaHQodGlwc29fYnViYmxlKS5oZWlnaHQgLSBhcnJvdztcclxuXHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgICAgJ2JvcmRlci1ib3R0b20tY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYm9yZGVyLXRvcC1jb2xvcic6IG9iai5zZXR0aW5ncy5iYWNrZ3JvdW5kLFxyXG4gICAgICAgICAgICAnYm9yZGVyLWxlZnQtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogJ3RyYW5zcGFyZW50J1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgLypcclxuICAgICAgICAgICAqIEhpZGUgYW5kIHNob3cgdGhlIGFwcHJvcHJpYXRlIHJvdW5kZWQgY29ybmVyc1xyXG4gICAgICAgICAgICovXHJcbiAgICAgICAgICByZW1vdmVDb3JuZXJDbGFzc2VzKHRpcHNvX2J1YmJsZSk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3MoXCJ0b3BfbGVmdF9jb3JuZXJcIik7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZChcIi50aXBzb190aXRsZVwiKS5hZGRDbGFzcyhcInRvcF9sZWZ0X2Nvcm5lclwiKTtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogb2JqLnNldHRpbmdzLmJhY2tncm91bmQsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICB0aXBzb19idWJibGUucmVtb3ZlQ2xhc3MoJ3RvcC1yaWdodCB0b3AgYm90dG9tIGxlZnQgcmlnaHQnKTtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5hZGRDbGFzcygndG9wJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgICAgJ2JvcmRlci10b3AtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYm9yZGVyLWJvdHRvbS1jb2xvcic6IGFycm93X2NvbG9yLFxyXG4gICAgICAgICAgICAnYm9yZGVyLWxlZnQtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogJ3RyYW5zcGFyZW50J1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgLypcclxuICAgICAgICAgICAqIEhpZGUgYW5kIHNob3cgdGhlIGFwcHJvcHJpYXRlIHJvdW5kZWQgY29ybmVyc1xyXG4gICAgICAgICAgICovXHJcbiAgICAgICAgICByZW1vdmVDb3JuZXJDbGFzc2VzKHRpcHNvX2J1YmJsZSk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3MoXCJib3R0b21fbGVmdF9jb3JuZXJcIik7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZChcIi50aXBzb190aXRsZVwiKS5hZGRDbGFzcyhcImJvdHRvbV9sZWZ0X2Nvcm5lclwiKTtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogYXJyb3dfY29sb3IsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICB0aXBzb19idWJibGUucmVtb3ZlQ2xhc3MoJ3RvcCBib3R0b20gbGVmdCByaWdodCcpO1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmFkZENsYXNzKCdib3R0b20nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIC8qXHJcbiAgICAgICAqIFRvcCBwb3NpdGlvblxyXG4gICAgICAgKi9cclxuICAgICAgY2FzZSAndG9wJzpcclxuICAgICAgICBwb3NfbGVmdCA9ICRlLm9mZnNldCgpLmxlZnQgKyAoJGUub3V0ZXJXaWR0aCgpIC8gMikgLSAocmVhbEhlaWdodCh0aXBzb19idWJibGUpLndpZHRoIC8gMik7XHJcbiAgICAgICAgcG9zX3RvcCA9ICRlLm9mZnNldCgpLnRvcCAtIHJlYWxIZWlnaHQodGlwc29fYnViYmxlKS5oZWlnaHQgLSBhcnJvdztcclxuICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgIG1hcmdpbkxlZnQ6IC1vYmouc2V0dGluZ3MuYXJyb3dXaWR0aCxcclxuICAgICAgICAgIG1hcmdpblRvcDogJycsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKHBvc190b3AgPCAkd2luLnNjcm9sbFRvcCgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHBvc190b3AgPSAkZS5vZmZzZXQoKS50b3AgKyAkZS5vdXRlckhlaWdodCgpICsgYXJyb3c7XHJcblxyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19hcnJvdycpLmNzcyh7XHJcbiAgICAgICAgICAgICdib3JkZXItYm90dG9tLWNvbG9yJzogYXJyb3dfY29sb3IsXHJcbiAgICAgICAgICAgICdib3JkZXItdG9wLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JvcmRlci1sZWZ0LWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JvcmRlci1yaWdodC1jb2xvcic6ICd0cmFuc3BhcmVudCdcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5yZW1vdmVDbGFzcygndG9wIGJvdHRvbSBsZWZ0IHJpZ2h0Jyk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3MoJ2JvdHRvbScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19hcnJvdycpLmNzcyh7XHJcbiAgICAgICAgICAgICdib3JkZXItdG9wLWNvbG9yJzogb2JqLnNldHRpbmdzLmJhY2tncm91bmQsXHJcbiAgICAgICAgICAgICdib3JkZXItYm90dG9tLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JvcmRlci1sZWZ0LWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JvcmRlci1yaWdodC1jb2xvcic6ICd0cmFuc3BhcmVudCdcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLnJlbW92ZUNsYXNzKCd0b3AgYm90dG9tIGxlZnQgcmlnaHQnKTtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5hZGRDbGFzcygndG9wJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdib3R0b20nOlxyXG4gICAgICAgIHBvc19sZWZ0ID0gJGUub2Zmc2V0KCkubGVmdCArICgkZS5vdXRlcldpZHRoKCkgLyAyKSAtIChyZWFsSGVpZ2h0KHRpcHNvX2J1YmJsZSkud2lkdGggLyAyKTtcclxuICAgICAgICBwb3NfdG9wID0gJGUub2Zmc2V0KCkudG9wICsgJGUub3V0ZXJIZWlnaHQoKSArIGFycm93O1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgbWFyZ2luTGVmdDogLW9iai5zZXR0aW5ncy5hcnJvd1dpZHRoLFxyXG4gICAgICAgICAgbWFyZ2luVG9wOiAnJyxcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAocG9zX3RvcCArIHJlYWxIZWlnaHQodGlwc29fYnViYmxlKS5oZWlnaHQgPiAkd2luLnNjcm9sbFRvcCgpICsgJHdpbi5vdXRlckhlaWdodCgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHBvc190b3AgPSAkZS5vZmZzZXQoKS50b3AgLSByZWFsSGVpZ2h0KHRpcHNvX2J1YmJsZSkuaGVpZ2h0IC0gYXJyb3c7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgICAgJ2JvcmRlci10b3AtY29sb3InOiBvYmouc2V0dGluZ3MuYmFja2dyb3VuZCxcclxuICAgICAgICAgICAgJ2JvcmRlci1ib3R0b20tY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYm9yZGVyLWxlZnQtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogJ3RyYW5zcGFyZW50J1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUucmVtb3ZlQ2xhc3MoJ3RvcCBib3R0b20gbGVmdCByaWdodCcpO1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmFkZENsYXNzKCd0b3AnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgICAnYm9yZGVyLWJvdHRvbS1jb2xvcic6IGFycm93X2NvbG9yLFxyXG4gICAgICAgICAgICAnYm9yZGVyLXRvcC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdib3JkZXItbGVmdC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdib3JkZXItcmlnaHQtY29sb3InOiAndHJhbnNwYXJlbnQnXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5yZW1vdmVDbGFzcygndG9wIGJvdHRvbSBsZWZ0IHJpZ2h0Jyk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3Mob2JqLnNldHRpbmdzLnBvc2l0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ2xlZnQnOlxyXG4gICAgICAgIHBvc19sZWZ0ID0gJGUub2Zmc2V0KCkubGVmdCAtIHJlYWxIZWlnaHQodGlwc29fYnViYmxlKS53aWR0aCAtIGFycm93O1xyXG4gICAgICAgIHBvc190b3AgPSAkZS5vZmZzZXQoKS50b3AgKyAoJGUub3V0ZXJIZWlnaHQoKSAvIDIpIC0gKHJlYWxIZWlnaHQodGlwc29fYnViYmxlKS5oZWlnaHQgLyAyKTtcclxuICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgIG1hcmdpblRvcDogLW9iai5zZXR0aW5ncy5hcnJvd1dpZHRoLFxyXG4gICAgICAgICAgbWFyZ2luTGVmdDogJydcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAocG9zX2xlZnQgPCAkd2luLnNjcm9sbExlZnQoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICBwb3NfbGVmdCA9ICRlLm9mZnNldCgpLmxlZnQgKyAkZS5vdXRlcldpZHRoKCkgKyBhcnJvdztcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogb2JqLnNldHRpbmdzLmJhY2tncm91bmQsXHJcbiAgICAgICAgICAgICdib3JkZXItbGVmdC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdib3JkZXItdG9wLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JvcmRlci1ib3R0b20tY29sb3InOiAndHJhbnNwYXJlbnQnXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5yZW1vdmVDbGFzcygndG9wIGJvdHRvbSBsZWZ0IHJpZ2h0Jyk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3MoJ3JpZ2h0Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAgICAgJ2JvcmRlci1sZWZ0LWNvbG9yJzogb2JqLnNldHRpbmdzLmJhY2tncm91bmQsXHJcbiAgICAgICAgICAgICdib3JkZXItcmlnaHQtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYm9yZGVyLXRvcC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdib3JkZXItYm90dG9tLWNvbG9yJzogJ3RyYW5zcGFyZW50J1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUucmVtb3ZlQ2xhc3MoJ3RvcCBib3R0b20gbGVmdCByaWdodCcpO1xyXG4gICAgICAgICAgdGlwc29fYnViYmxlLmFkZENsYXNzKG9iai5zZXR0aW5ncy5wb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdyaWdodCc6XHJcbiAgICAgICAgcG9zX2xlZnQgPSAkZS5vZmZzZXQoKS5sZWZ0ICsgJGUub3V0ZXJXaWR0aCgpICsgYXJyb3c7XHJcbiAgICAgICAgcG9zX3RvcCA9ICRlLm9mZnNldCgpLnRvcCArICgkZS5vdXRlckhlaWdodCgpIC8gMikgLSAocmVhbEhlaWdodCh0aXBzb19idWJibGUpLmhlaWdodCAvIDIpO1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgbWFyZ2luVG9wOiAtb2JqLnNldHRpbmdzLmFycm93V2lkdGgsXHJcbiAgICAgICAgICBtYXJnaW5MZWZ0OiAnJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChwb3NfbGVmdCArIGFycm93ICsgb2JqLnNldHRpbmdzLndpZHRoID4gJHdpbi5zY3JvbGxMZWZ0KCkgKyAkd2luLm91dGVyV2lkdGgoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICBwb3NfbGVmdCA9ICRlLm9mZnNldCgpLmxlZnQgLSByZWFsSGVpZ2h0KHRpcHNvX2J1YmJsZSkud2lkdGggLSBhcnJvdztcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgICAnYm9yZGVyLWxlZnQtY29sb3InOiBvYmouc2V0dGluZ3MuYmFja2dyb3VuZCxcclxuICAgICAgICAgICAgJ2JvcmRlci1yaWdodC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdib3JkZXItdG9wLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JvcmRlci1ib3R0b20tY29sb3InOiAndHJhbnNwYXJlbnQnXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5yZW1vdmVDbGFzcygndG9wIGJvdHRvbSBsZWZ0IHJpZ2h0Jyk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3MoJ2xlZnQnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogb2JqLnNldHRpbmdzLmJhY2tncm91bmQsXHJcbiAgICAgICAgICAgICdib3JkZXItbGVmdC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdib3JkZXItdG9wLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JvcmRlci1ib3R0b20tY29sb3InOiAndHJhbnNwYXJlbnQnXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHRpcHNvX2J1YmJsZS5yZW1vdmVDbGFzcygndG9wIGJvdHRvbSBsZWZ0IHJpZ2h0Jyk7XHJcbiAgICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3Mob2JqLnNldHRpbmdzLnBvc2l0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICAvKlxyXG4gICAgICogU2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgYXJyb3cgZm9yIHRoZSBjb3JuZXIgcG9zaXRpb25zXHJcbiAgICAgKi9cclxuICAgIGlmIChvYmouc2V0dGluZ3MucG9zaXRpb24gPT09ICd0b3AtcmlnaHQnKVxyXG4gICAge1xyXG4gICAgICB0aXBzb19idWJibGUuZmluZCgnLnRpcHNvX2Fycm93JykuY3NzKHtcclxuICAgICAgICAnbWFyZ2luLWxlZnQnOiAtb2JqLnNldHRpbmdzLndpZHRoIC8gMlxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChvYmouc2V0dGluZ3MucG9zaXRpb24gPT09ICd0b3AtbGVmdCcpXHJcbiAgICB7XHJcbiAgICAgIHZhciB0aXBzb19hcnJvdyA9IHRpcHNvX2J1YmJsZS5maW5kKFwiLnRpcHNvX2Fycm93XCIpLmVxKDApO1xyXG4gICAgICB0aXBzb19hcnJvdy5jc3Moe1xyXG4gICAgICAgICdtYXJnaW4tbGVmdCc6IG9iai5zZXR0aW5ncy53aWR0aCAvIDIgLSAyICogb2JqLnNldHRpbmdzLmFycm93V2lkdGhcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAob2JqLnNldHRpbmdzLnBvc2l0aW9uID09PSAnYm90dG9tLXJpZ2h0JylcclxuICAgIHtcclxuICAgICAgdmFyIHRpcHNvX2Fycm93ID0gdGlwc29fYnViYmxlLmZpbmQoXCIudGlwc29fYXJyb3dcIikuZXEoMCk7XHJcbiAgICAgIHRpcHNvX2Fycm93LmNzcyh7XHJcbiAgICAgICAgJ21hcmdpbi1sZWZ0JzogLW9iai5zZXR0aW5ncy53aWR0aCAvIDIsXHJcbiAgICAgICAgJ21hcmdpbi10b3AnOiAnJ1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChvYmouc2V0dGluZ3MucG9zaXRpb24gPT09ICdib3R0b20tbGVmdCcpXHJcbiAgICB7XHJcbiAgICAgIHZhciB0aXBzb19hcnJvdyA9IHRpcHNvX2J1YmJsZS5maW5kKFwiLnRpcHNvX2Fycm93XCIpLmVxKDApO1xyXG4gICAgICB0aXBzb19hcnJvdy5jc3Moe1xyXG4gICAgICAgICdtYXJnaW4tbGVmdCc6IG9iai5zZXR0aW5ncy53aWR0aCAvIDIgLSAyICogb2JqLnNldHRpbmdzLmFycm93V2lkdGgsXHJcbiAgICAgICAgJ21hcmdpbi10b3AnOiAnJ1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogQ2hlY2sgb3V0IG9mIGJvdW5kbmVzc1xyXG4gICAgICovXHJcbiAgICBpZiAocG9zX2xlZnQgPCAkd2luLnNjcm9sbExlZnQoKSAmJiAob2JqLnNldHRpbmdzLnBvc2l0aW9uID09PSAnYm90dG9tJyB8fCBvYmouc2V0dGluZ3MucG9zaXRpb24gPT09ICd0b3AnKSlcclxuICAgIHtcclxuICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19hcnJvdycpLmNzcyh7XHJcbiAgICAgICAgbWFyZ2luTGVmdDogcG9zX2xlZnQgLSBvYmouc2V0dGluZ3MuYXJyb3dXaWR0aFxyXG4gICAgICB9KTtcclxuICAgICAgcG9zX2xlZnQgPSAwO1xyXG4gICAgfVxyXG4gICAgaWYgKHBvc19sZWZ0ICsgb2JqLnNldHRpbmdzLndpZHRoID4gJHdpbi5vdXRlcldpZHRoKCkgJiYgKG9iai5zZXR0aW5ncy5wb3NpdGlvbiA9PT0gJ2JvdHRvbScgfHwgb2JqLnNldHRpbmdzLnBvc2l0aW9uID09PSAndG9wJykpXHJcbiAgICB7XHJcbiAgICAgIGRpZmYgPSAkd2luLm91dGVyV2lkdGgoKSAtIChwb3NfbGVmdCArIG9iai5zZXR0aW5ncy53aWR0aCk7XHJcbiAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgIG1hcmdpbkxlZnQ6IC1kaWZmIC0gb2JqLnNldHRpbmdzLmFycm93V2lkdGgsXHJcbiAgICAgICAgbWFyZ2luVG9wOiAnJ1xyXG4gICAgICB9KTtcclxuICAgICAgcG9zX2xlZnQgPSBwb3NfbGVmdCArIGRpZmY7XHJcbiAgICB9XHJcbiAgICBpZiAocG9zX2xlZnQgPCAkd2luLnNjcm9sbExlZnQoKSAmJlxyXG4gICAgICAgKG9iai5zZXR0aW5ncy5wb3NpdGlvbiA9PT0gJ2xlZnQnIHx8XHJcbiAgICAgICAgb2JqLnNldHRpbmdzLnBvc2l0aW9uID09PSAncmlnaHQnIHx8XHJcbiAgICAgICAgb2JqLnNldHRpbmdzLnBvc2l0aW9uID09PSAndG9wLXJpZ2h0JyB8fFxyXG4gICAgICAgIG9iai5zZXR0aW5ncy5wb3NpdGlvbiA9PT0gJ3RvcC1sZWZ0JyB8fFxyXG4gICAgICAgIG9iai5zZXR0aW5ncy5wb3NpdGlvbiA9PT0gJ2JvdHRvbS1yaWdodCcgfHxcclxuICAgICAgICBvYmouc2V0dGluZ3MucG9zaXRpb24gPT09ICdib3R0b20tbGVmdCcpKVxyXG4gICAge1xyXG4gICAgICBwb3NfbGVmdCA9ICRlLm9mZnNldCgpLmxlZnQgKyAoJGUub3V0ZXJXaWR0aCgpIC8gMikgLSAocmVhbEhlaWdodCh0aXBzb19idWJibGUpLndpZHRoIC8gMik7XHJcbiAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgIG1hcmdpbkxlZnQ6IC1vYmouc2V0dGluZ3MuYXJyb3dXaWR0aCxcclxuICAgICAgICBtYXJnaW5Ub3A6ICcnXHJcbiAgICAgIH0pO1xyXG4gICAgICBwb3NfdG9wID0gJGUub2Zmc2V0KCkudG9wIC0gcmVhbEhlaWdodCh0aXBzb19idWJibGUpLmhlaWdodCAtIGFycm93O1xyXG4gICAgICBpZiAocG9zX3RvcCA8ICR3aW4uc2Nyb2xsVG9wKCkpXHJcbiAgICAgIHtcclxuICAgICAgICBwb3NfdG9wID0gJGUub2Zmc2V0KCkudG9wICsgJGUub3V0ZXJIZWlnaHQoKSArIGFycm93O1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgJ2JvcmRlci1ib3R0b20tY29sb3InOiBhcnJvd19jb2xvcixcclxuICAgICAgICAgICdib3JkZXItdG9wLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICdib3JkZXItbGVmdC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogJ3RyYW5zcGFyZW50J1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5yZW1vdmVDbGFzcygndG9wIGJvdHRvbSBsZWZ0IHJpZ2h0Jyk7XHJcbiAgICAgICAgcmVtb3ZlQ29ybmVyQ2xhc3Nlcyh0aXBzb19idWJibGUpO1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5hZGRDbGFzcygnYm90dG9tJyk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZVxyXG4gICAgICB7XHJcbiAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19hcnJvdycpLmNzcyh7XHJcbiAgICAgICAgICAnYm9yZGVyLXRvcC1jb2xvcic6IG9iai5zZXR0aW5ncy5iYWNrZ3JvdW5kLFxyXG4gICAgICAgICAgJ2JvcmRlci1ib3R0b20tY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgJ2JvcmRlci1sZWZ0LWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICdib3JkZXItcmlnaHQtY29sb3InOiAndHJhbnNwYXJlbnQnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGlwc29fYnViYmxlLnJlbW92ZUNsYXNzKCd0b3AgYm90dG9tIGxlZnQgcmlnaHQnKTtcclxuICAgICAgICByZW1vdmVDb3JuZXJDbGFzc2VzKHRpcHNvX2J1YmJsZSk7XHJcbiAgICAgICAgdGlwc29fYnViYmxlLmFkZENsYXNzKCd0b3AnKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAocG9zX2xlZnQgKyBvYmouc2V0dGluZ3Mud2lkdGggPiAkd2luLm91dGVyV2lkdGgoKSlcclxuICAgICAge1xyXG4gICAgICAgIGRpZmYgPSAkd2luLm91dGVyV2lkdGgoKSAtIChwb3NfbGVmdCArIG9iai5zZXR0aW5ncy53aWR0aCk7XHJcbiAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19hcnJvdycpLmNzcyh7XHJcbiAgICAgICAgICBtYXJnaW5MZWZ0OiAtZGlmZiAtIG9iai5zZXR0aW5ncy5hcnJvd1dpZHRoLFxyXG4gICAgICAgICAgbWFyZ2luVG9wOiAnJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHBvc19sZWZ0ID0gcG9zX2xlZnQgKyBkaWZmO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChwb3NfbGVmdCA8ICR3aW4uc2Nyb2xsTGVmdCgpKVxyXG4gICAgICB7XHJcbiAgICAgICAgdGlwc29fYnViYmxlLmZpbmQoJy50aXBzb19hcnJvdycpLmNzcyh7XHJcbiAgICAgICAgICBtYXJnaW5MZWZ0OiBwb3NfbGVmdCAtIG9iai5zZXR0aW5ncy5hcnJvd1dpZHRoXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcG9zX2xlZnQgPSAwO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIElmIG91dCBvZiBib3VuZHMgZnJvbSB0aGUgcmlnaHQgaGFuZCBzaWRlXHJcbiAgICAgKi9cclxuICAgIGlmIChwb3NfbGVmdCArIG9iai5zZXR0aW5ncy53aWR0aCA+ICR3aW4ub3V0ZXJXaWR0aCgpICYmXHJcbiAgICAgICAob2JqLnNldHRpbmdzLnBvc2l0aW9uID09PSAnbGVmdCcgfHxcclxuICAgICAgICBvYmouc2V0dGluZ3MucG9zaXRpb24gPT09ICdyaWdodCcgfHxcclxuICAgICAgICBvYmouc2V0dGluZ3MucG9zaXRpb24gPT09ICd0b3AtcmlnaHQnIHx8XHJcbiAgICAgICAgb2JqLnNldHRpbmdzLnBvc2l0aW9uID09PSAndG9wLWxlZnQnIHx8XHJcbiAgICAgICAgb2JqLnNldHRpbmdzLnBvc2l0aW9uID09PSAnYm90dG9tLXJpZ2h0JyB8fFxyXG4gICAgICAgIG9iai5zZXR0aW5ncy5wb3NpdGlvbiA9PT0gJ2JvdHRvbS1yaWdodCcpKVxyXG4gICAge1xyXG4gICAgICBwb3NfbGVmdCA9ICRlLm9mZnNldCgpLmxlZnQgKyAoJGUub3V0ZXJXaWR0aCgpIC8gMikgLSAocmVhbEhlaWdodCh0aXBzb19idWJibGUpLndpZHRoIC8gMik7XHJcbiAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgIG1hcmdpbkxlZnQ6IC1vYmouc2V0dGluZ3MuYXJyb3dXaWR0aCxcclxuICAgICAgICBtYXJnaW5Ub3A6ICcnXHJcbiAgICAgIH0pO1xyXG4gICAgICBwb3NfdG9wID0gJGUub2Zmc2V0KCkudG9wIC0gcmVhbEhlaWdodCh0aXBzb19idWJibGUpLmhlaWdodCAtIGFycm93O1xyXG4gICAgICBpZiAocG9zX3RvcCA8ICR3aW4uc2Nyb2xsVG9wKCkpXHJcbiAgICAgIHtcclxuICAgICAgICBwb3NfdG9wID0gJGUub2Zmc2V0KCkudG9wICsgJGUub3V0ZXJIZWlnaHQoKSArIGFycm93O1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgJ2JvcmRlci1ib3R0b20tY29sb3InOiBhcnJvd19jb2xvcixcclxuICAgICAgICAgICdib3JkZXItdG9wLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICdib3JkZXItbGVmdC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogJ3RyYW5zcGFyZW50J1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZW1vdmVDb3JuZXJDbGFzc2VzKHRpcHNvX2J1YmJsZSk7XHJcbiAgICAgICAgdGlwc29fYnViYmxlLnJlbW92ZUNsYXNzKCd0b3AgYm90dG9tIGxlZnQgcmlnaHQnKTtcclxuICAgICAgICB0aXBzb19idWJibGUuYWRkQ2xhc3MoJ2JvdHRvbScpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2VcclxuICAgICAge1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgJ2JvcmRlci10b3AtY29sb3InOiBvYmouc2V0dGluZ3MuYmFja2dyb3VuZCxcclxuICAgICAgICAgICdib3JkZXItYm90dG9tLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICdib3JkZXItbGVmdC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAnYm9yZGVyLXJpZ2h0LWNvbG9yJzogJ3RyYW5zcGFyZW50J1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIEhpZGUgYW5kIHNob3cgdGhlIGFwcHJvcHJpYXRlIHJvdW5kZWQgY29ybmVyc1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHJlbW92ZUNvcm5lckNsYXNzZXModGlwc29fYnViYmxlKTtcclxuICAgICAgICB0aXBzb19idWJibGUucmVtb3ZlQ2xhc3MoJ3RvcCBib3R0b20gbGVmdCByaWdodCcpO1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5hZGRDbGFzcygndG9wJyk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHBvc19sZWZ0ICsgb2JqLnNldHRpbmdzLndpZHRoID4gJHdpbi5vdXRlcldpZHRoKCkpXHJcbiAgICAgIHtcclxuICAgICAgICBkaWZmID0gJHdpbi5vdXRlcldpZHRoKCkgLSAocG9zX2xlZnQgKyBvYmouc2V0dGluZ3Mud2lkdGgpO1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgbWFyZ2luTGVmdDogLWRpZmYgLSBvYmouc2V0dGluZ3MuYXJyb3dXaWR0aCxcclxuICAgICAgICAgIG1hcmdpblRvcDogJydcclxuICAgICAgICB9KTtcclxuICAgICAgICBwb3NfbGVmdCA9IHBvc19sZWZ0ICsgZGlmZjtcclxuICAgICAgfVxyXG4gICAgICBpZiAocG9zX2xlZnQgPCAkd2luLnNjcm9sbExlZnQoKSlcclxuICAgICAge1xyXG4gICAgICAgIHRpcHNvX2J1YmJsZS5maW5kKCcudGlwc29fYXJyb3cnKS5jc3Moe1xyXG4gICAgICAgICAgbWFyZ2luTGVmdDogcG9zX2xlZnQgLSBvYmouc2V0dGluZ3MuYXJyb3dXaWR0aFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHBvc19sZWZ0ID0gMDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGlwc29fYnViYmxlLmNzcyh7XHJcbiAgICAgIGxlZnQ6IHBvc19sZWZ0ICsgb2JqLnNldHRpbmdzLm9mZnNldFgsXHJcbiAgICAgIHRvcDogcG9zX3RvcCArIG9iai5zZXR0aW5ncy5vZmZzZXRZXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJZiBwb3NpdGlvbmVkIHJpZ2h0IG9yIGxlZnQgYW5kIHRvb2x0aXAgaXMgb3V0IG9mIGJvdW5kcyBjaGFuZ2UgcG9zaXRpb25cclxuICAgIC8vIFRoaXMgcG9zaXRpb24gY2hhbmdlIHdpbGwgYmUgdGVtcG9yYXJ5LCBiZWNhdXNlIHByZWZlcmVkUG9zaXRpb24gaXMgdGhlcmVcclxuICAgIC8vIHRvIGhlbHAhIVxyXG4gICAgaWYgKHBvc190b3AgPCAkd2luLnNjcm9sbFRvcCgpICYmIChvYmouc2V0dGluZ3MucG9zaXRpb24gPT09ICdyaWdodCcgfHwgb2JqLnNldHRpbmdzLnBvc2l0aW9uID09PSAnbGVmdCcpKVxyXG4gICAge1xyXG4gICAgICAkZS50aXBzbygndXBkYXRlJywgJ3Bvc2l0aW9uJywgJ2JvdHRvbScpO1xyXG4gICAgICByZXBvc2l0aW9uKG9iaik7XHJcbiAgICB9XHJcbiAgICBpZiAocG9zX3RvcCArIHJlYWxIZWlnaHQodGlwc29fYnViYmxlKS5oZWlnaHQgPiAkd2luLnNjcm9sbFRvcCgpICsgJHdpbi5vdXRlckhlaWdodCgpICYmXHJcbiAgICAgICAgKG9iai5zZXR0aW5ncy5wb3NpdGlvbiA9PT0gJ3JpZ2h0JyB8fCBvYmouc2V0dGluZ3MucG9zaXRpb24gPT09ICdsZWZ0JykpXHJcbiAgICB7XHJcbiAgICAgICRlLnRpcHNvKCd1cGRhdGUnLCAncG9zaXRpb24nLCAndG9wJyk7XHJcbiAgICAgIHJlcG9zaXRpb24ob2JqKTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG4gICRbcGx1Z2luTmFtZV0gPSAkLmZuW3BsdWdpbk5hbWVdID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICBpZiAob3B0aW9ucyA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykge1xyXG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgJCkpIHtcclxuICAgICAgICAkLmV4dGVuZChkZWZhdWx0cywgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoISQuZGF0YSh0aGlzLCAncGx1Z2luXycgKyBwbHVnaW5OYW1lKSkge1xyXG4gICAgICAgICAgJC5kYXRhKHRoaXMsICdwbHVnaW5fJyArIHBsdWdpbk5hbWUsIG5ldyBQbHVnaW4odGhpcywgb3B0aW9ucykpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJyAmJiBvcHRpb25zWzBdICE9PSAnXycgJiYgb3B0aW9ucyAhPT1cclxuICAgICAgJ2luaXQnKSB7XHJcbiAgICAgIHZhciByZXR1cm5zO1xyXG4gICAgICB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGluc3RhbmNlID0gJC5kYXRhKHRoaXMsICdwbHVnaW5fJyArIHBsdWdpbk5hbWUpO1xyXG4gICAgICAgIGlmICghaW5zdGFuY2UpIHtcclxuICAgICAgICAgIGluc3RhbmNlID0gJC5kYXRhKHRoaXMsICdwbHVnaW5fJyArIHBsdWdpbk5hbWUsIG5ldyBQbHVnaW4oXHJcbiAgICAgICAgICAgIHRoaXMsIG9wdGlvbnMpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGluc3RhbmNlIGluc3RhbmNlb2YgUGx1Z2luICYmIHR5cGVvZiBpbnN0YW5jZVtvcHRpb25zXSA9PT1cclxuICAgICAgICAgICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgIHJldHVybnMgPSBpbnN0YW5jZVtvcHRpb25zXS5hcHBseShpbnN0YW5jZSwgQXJyYXkucHJvdG90eXBlLnNsaWNlXHJcbiAgICAgICAgICAgIC5jYWxsKGFyZ3MsIDEpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09ICdkZXN0cm95Jykge1xyXG4gICAgICAgICAgJC5kYXRhKHRoaXMsICdwbHVnaW5fJyArIHBsdWdpbk5hbWUsIG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiByZXR1cm5zICE9PSB1bmRlZmluZWQgPyByZXR1cm5zIDogdGhpcztcclxuICAgIH1cclxuICB9O1xyXG59KSk7XHJcbiJdfQ==
