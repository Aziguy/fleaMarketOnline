/*!
 * SlickNav Responsive Mobile Menu v1.0.4
 * (c) 2015 Josh Cope
 * licensed under MIT
 */
;
(function ($, document, window) {
    var
            // default settings object.
            defaults = {
                label: 'MENU',
                duplicate: true,
                duration: 300,
                easingOpen: 'swing',
                easingClose: 'swing',
                closedSymbol: '<i class="icon-keyboard_arrow_right"></i>',
                openedSymbol: '<i class="icon-keyboard_arrow_down"></i>',
                prependTo: '.main-nav',
                appendTo: '',
                parentTag: 'a',
                closeOnClick: false,
                allowParentLinks: true,
                nestedParentLinks: true,
                showChildren: false,
                removeIds: false,
                removeClasses: false,
                removeStyles: false,
                brand: '',
                init: function () {},
                beforeOpen: function () {},
                beforeClose: function () {},
                afterOpen: function () {},
                afterClose: function () {}
            },
    mobileMenu = 'slicknav',
            prefix = 'slicknav';

    function Plugin(element, options) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend({}, defaults, options);

        this._defaults = defaults;
        this._name = mobileMenu;

        this.init();
    }

    Plugin.prototype.init = function () {
        var $this = this,
                menu = $(this.element),
                settings = this.settings,
                iconClass,
                menuBar;

        // clone menu if needed
        if (settings.duplicate) {
            $this.mobileNav = menu.clone();
            //remove ids from clone to prevent css issues
            $this.mobileNav.removeAttr('id');
            $this.mobileNav.find('*').each(function (i, e) {
                $(e).removeAttr('id');
            });
        } else {
            $this.mobileNav = menu;

            // remove ids if set
            $this.mobileNav.removeAttr('id');
            $this.mobileNav.find('*').each(function (i, e) {
                $(e).removeAttr('id');
            });
        }

        // remove classes if set
        if (settings.removeClasses) {
            $this.mobileNav.removeAttr('class');
            $this.mobileNav.find('*').each(function (i, e) {
                $(e).removeAttr('class');
            });
        }

        // remove styles if set
        if (settings.removeStyles) {
            $this.mobileNav.removeAttr('style');
            $this.mobileNav.find('*').each(function (i, e) {
                $(e).removeAttr('style');
            });
        }

        // styling class for the button
        iconClass = prefix + '_icon';

        if (settings.label === '') {
            iconClass += ' ' + prefix + '_no-text';
        }

        if (settings.parentTag == 'a') {
            settings.parentTag = 'a href="#"';
        }

        // create menu bar
        $this.mobileNav.attr('class', prefix + '_nav');
        menuBar = $('<div class="' + prefix + '_menu"></div>');
        if (settings.brand !== '') {
            var brand = $('<div class="' + prefix + '_brand">' + settings.brand + '</div>');
            $(menuBar).append(brand);
        }
        $this.btn = $(
                ['<' + settings.parentTag + ' aria-haspopup="true" tabindex="0" class="' + prefix + '_btn ' + prefix + '_collapsed">',
                    '<span class="' + prefix + '_menutxt">' + settings.label + '</span>',
                    '<span class="' + iconClass + '">',
                    '<span class="' + prefix + '_icon-bar"></span>',
                    '<span class="' + prefix + '_icon-bar"></span>',
                    '<span class="' + prefix + '_icon-bar"></span>',
                    '</span>',
                    '</' + settings.parentTag + '>'
                ].join('')
                );
        $(menuBar).append($this.btn);
        if (settings.appendTo !== '') {
            $(settings.appendTo).append(menuBar);
        } else {
            $(settings.prependTo).prepend(menuBar);
        }
        menuBar.append($this.mobileNav);

        // iterate over structure adding additional structure
        var items = $this.mobileNav.find('li');
        $(items).each(function () {
            var item = $(this),
                    data = {};
            data.children = item.children('ul').attr('role', 'menu');
            item.data('menu', data);

            // if a list item has a nested menu
            if (data.children.length > 0) {

                // select all text before the child menu
                // check for anchors

                var a = item.contents(),
                        containsAnchor = false,
                        nodes = [];

                $(a).each(function () {
                    if (!$(this).is('ul')) {
                        nodes.push(this);
                    } else {
                        return false;
                    }

                    if ($(this).is("a")) {
                        containsAnchor = true;
                    }
                });

                var wrapElement = $(
                        '<' + settings.parentTag + ' role="menuitem" aria-haspopup="true" tabindex="-1" class="' + prefix + '_item"/>'
                        );

                // wrap item text with tag and add classes unless we are separating parent links
                if ((!settings.allowParentLinks || settings.nestedParentLinks) || !containsAnchor) {
                    var $wrap = $(nodes).wrapAll(wrapElement).parent();
                    $wrap.addClass(prefix + '_row');
                } else
                    $(nodes).wrapAll('<span class="' + prefix + '_parent-link ' + prefix + '_row"/>').parent();

                if (!settings.showChildren) {
                    item.addClass(prefix + '_collapsed');
                } else {
                    item.addClass(prefix + '_open');
                }

                item.addClass(prefix + '_parent');

                // create parent arrow. wrap with link if parent links and separating
                var arrowElement = $('<span class="' + prefix + '_arrow">' + (settings.showChildren ? settings.openedSymbol : settings.closedSymbol) + '</span>');

                if (settings.allowParentLinks && !settings.nestedParentLinks && containsAnchor)
                    arrowElement = arrowElement.wrap(wrapElement).parent();

                //append arrow
                $(nodes).last().after(arrowElement);


            } else if (item.children().length === 0) {
                item.addClass(prefix + '_txtnode');
            }

            // accessibility for links
            item.children('a').attr('role', 'menuitem').click(function (event) {
                //Ensure that it's not a parent
                if (settings.closeOnClick && !$(event.target).parent().closest('li').hasClass(prefix + '_parent')) {
                    //Emulate menu close if set
                    $($this.btn).click();
                }
            });

            //also close on click if parent links are set
            if (settings.closeOnClick && settings.allowParentLinks) {
                item.children('a').children('a').click(function (event) {
                    //Emulate menu close
                    $($this.btn).click();
                });

                item.find('.' + prefix + '_parent-link a:not(.' + prefix + '_item)').click(function (event) {
                    //Emulate menu close
                    $($this.btn).click();
                });
            }
        });

        // structure is in place, now hide appropriate items
        $(items).each(function () {
            var data = $(this).data('menu');
            if (!settings.showChildren) {
                $this._visibilityToggle(data.children, null, false, null, true);
            }
        });

        // finally toggle entire menu
        $this._visibilityToggle($this.mobileNav, null, false, 'init', true);

        // accessibility for menu button
        $this.mobileNav.attr('role', 'menu');

        // outline prevention when using mouse
        $(document).mousedown(function () {
            $this._outlines(false);
        });

        $(document).keyup(function () {
            $this._outlines(true);
        });

        // menu button click
        $($this.btn).click(function (e) {
            e.preventDefault();
            $this._menuToggle();
        });

        // click on menu parent
        $this.mobileNav.on('click', '.' + prefix + '_item', function (e) {
            e.preventDefault();
            $this._itemClick($(this));

            if (jQuery(".widget-post-slider").length != '') {
                $('.widget-post-slider').slick('setPosition');
            }
        });

        // check for enter key on menu button and menu parents
        $($this.btn).keydown(function (e) {
            var ev = e || event;
            if (ev.keyCode == 13) {
                e.preventDefault();
                $this._menuToggle();
            }
        });

        $this.mobileNav.on('keydown', '.' + prefix + '_item', function (e) {
            var ev = e || event;
            if (ev.keyCode == 13) {
                e.preventDefault();
                $this._itemClick($(e.target));
            }
        });

        // allow links clickable within parent tags if set
        if (settings.allowParentLinks && settings.nestedParentLinks) {
            $('.' + prefix + '_item a').click(function (e) {
                e.stopImmediatePropagation();
            });
        }
    };

    //toggle menu
    Plugin.prototype._menuToggle = function (el) {
        var $this = this;
        var btn = $this.btn;
        var mobileNav = $this.mobileNav;

        if (btn.hasClass(prefix + '_collapsed')) {
            btn.removeClass(prefix + '_collapsed');
            btn.addClass(prefix + '_open');
        } else {
            btn.removeClass(prefix + '_open');
            btn.addClass(prefix + '_collapsed');
        }
        btn.addClass(prefix + '_animating');
        $this._visibilityToggle(mobileNav, btn.parent(), true, btn);
    };

    // toggle clicked items
    Plugin.prototype._itemClick = function (el) {
        var $this = this;
        var settings = $this.settings;
        var data = el.data('menu');
        if (!data) {
            data = {};
            data.arrow = el.children('.' + prefix + '_arrow');
            data.ul = el.next('ul');
            data.parent = el.parent();
            //Separated parent link structure
            if (data.parent.hasClass(prefix + '_parent-link')) {
                data.parent = el.parent().parent();
                data.ul = el.parent().next('ul');
            }
            el.data('menu', data);
        }
        if (data.parent.hasClass(prefix + '_collapsed')) {
            data.arrow.html(settings.openedSymbol);
            data.parent.removeClass(prefix + '_collapsed');
            data.parent.addClass(prefix + '_open');
            data.parent.addClass(prefix + '_animating');
            $this._visibilityToggle(data.ul, data.parent, true, el);
        } else {
            data.arrow.html(settings.closedSymbol);
            data.parent.addClass(prefix + '_collapsed');
            data.parent.removeClass(prefix + '_open');
            data.parent.addClass(prefix + '_animating');
            $this._visibilityToggle(data.ul, data.parent, true, el);
        }
    };

    // toggle actual visibility and accessibility tags
    Plugin.prototype._visibilityToggle = function (el, parent, animate, trigger, init) {
        var $this = this;
        var settings = $this.settings;
        var items = $this._getActionItems(el);
        var duration = 0;
        if (animate) {
            duration = settings.duration;
        }

        if (el.hasClass(prefix + '_hidden')) {
            el.removeClass(prefix + '_hidden');
            //Fire beforeOpen callback
            if (!init) {
                settings.beforeOpen(trigger);
            }

            el.slideDown(duration, settings.easingOpen, function () {

                $(trigger).removeClass(prefix + '_animating');
                $(parent).removeClass(prefix + '_animating');

                //Fire afterOpen callback
                if (!init) {
                    settings.afterOpen(trigger);
                }
            });
            el.attr('aria-hidden', 'false');
            items.attr('tabindex', '0');
            $this._setVisAttr(el, false);
        } else {
            el.addClass(prefix + '_hidden');

            //Fire init or beforeClose callback
            if (!init) {
                settings.beforeClose(trigger);
            }

            el.slideUp(duration, this.settings.easingClose, function () {
                el.attr('aria-hidden', 'true');
                items.attr('tabindex', '-1');
                $this._setVisAttr(el, true);
                el.hide(); //jQuery 1.7 bug fix

                $(trigger).removeClass(prefix + '_animating');
                $(parent).removeClass(prefix + '_animating');

                //Fire init or afterClose callback
                if (!init) {
                    settings.afterClose(trigger);
                } else if (trigger == 'init') {
                    settings.init();
                }
            });
        }
    };

    // set attributes of element and children based on visibility
    Plugin.prototype._setVisAttr = function (el, hidden) {
        var $this = this;

        // select all parents that aren't hidden
        var nonHidden = el.children('li').children('ul').not('.' + prefix + '_hidden');

        // iterate over all items setting appropriate tags
        if (!hidden) {
            nonHidden.each(function () {
                var ul = $(this);
                ul.attr('aria-hidden', 'false');
                var items = $this._getActionItems(ul);
                items.attr('tabindex', '0');
                $this._setVisAttr(ul, hidden);
            });
        } else {
            nonHidden.each(function () {
                var ul = $(this);
                ul.attr('aria-hidden', 'true');
                var items = $this._getActionItems(ul);
                items.attr('tabindex', '-1');
                $this._setVisAttr(ul, hidden);
            });
        }
    };

    // get all 1st level items that are clickable
    Plugin.prototype._getActionItems = function (el) {
        var data = el.data("menu");
        if (!data) {
            data = {};
            var items = el.children('li');
            var anchors = items.find('a');
            data.links = anchors.add(items.find('.' + prefix + '_item'));
            el.data('menu', data);
        }
        return data.links;
    };

    Plugin.prototype._outlines = function (state) {
        if (!state) {
            $('.' + prefix + '_item, .' + prefix + '_btn').css('outline', 'none');
        } else {
            $('.' + prefix + '_item, .' + prefix + '_btn').css('outline', '');
        }
    };

    Plugin.prototype.toggle = function () {
        var $this = this;
        $this._menuToggle();
    };

    Plugin.prototype.open = function () {
        var $this = this;
        if ($this.btn.hasClass(prefix + '_collapsed')) {
            $this._menuToggle();
        }
    };

    Plugin.prototype.close = function () {
        var $this = this;
        if ($this.btn.hasClass(prefix + '_open')) {
            $this._menuToggle();
        }
    };

    $.fn[mobileMenu] = function (options) {
        var args = arguments;

        // Is the first parameter an object (options), or was omitted, instantiate a new instance
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {

                // Only allow the plugin to be instantiated once due to methods
                if (!$.data(this, 'plugin_' + mobileMenu)) {

                    // if it has no instance, create a new one, pass options to our plugin constructor,
                    // and store the plugin instance in the elements jQuery data object.
                    $.data(this, 'plugin_' + mobileMenu, new Plugin(this, options));
                }
            });

            // If is a string and doesn't start with an underscore or 'init' function, treat this as a call to a public method.
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            // Cache the method call to make it possible to return a value
            var returns;

            this.each(function () {
                var instance = $.data(this, 'plugin_' + mobileMenu);

                // Tests that there's already a plugin-instance and checks that the requested public method exists
                if (instance instanceof Plugin && typeof instance[options] === 'function') {

                    // Call the method of our plugin instance, and pass it the supplied arguments.
                    returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                }
            });

            // If the earlier cached method gives a value back return the value, otherwise return this to preserve chainability.
            return returns !== undefined ? returns : this;
        }
    };
}(jQuery, document, window));


// swiper.min.js
/**
 * Swiper 3.3.1
 * Most modern mobile touch slider and framework with hardware accelerated transitions
 * 
 * http://www.idangero.us/swiper/
 * 
 * Copyright 2016, Vladimir Kharlampidi
 * The iDangero.us
 * http://www.idangero.us/
 * 
 * Licensed under MIT
 * 
 * Released on: February 7, 2016
 */
! function() {
    "use strict";

    function e(e) { e.fn.swiper = function(a) {
            var r;
            return e(this).each(function() {
                var e = new t(this, a);
                r || (r = e) }), r } }
    var a, t = function(e, i) {
        function s(e) {
            return Math.floor(e) }

        function n() { b.autoplayTimeoutId = setTimeout(function() { b.params.loop ? (b.fixLoop(), b._slideNext(), b.emit("onAutoplay", b)) : b.isEnd ? i.autoplayStopOnLast ? b.stopAutoplay() : (b._slideTo(0), b.emit("onAutoplay", b)) : (b._slideNext(), b.emit("onAutoplay", b)) }, b.params.autoplay) }

        function o(e, t) {
            var r = a(e.target);
            if (!r.is(t))
                if ("string" == typeof t) r = r.parents(t);
                else if (t.nodeType) {
                var i;
                return r.parents().each(function(e, a) { a === t && (i = t) }), i ? t : void 0 }
            if (0 !== r.length) return r[0] }

        function l(e, a) { a = a || {};
            var t = window.MutationObserver || window.WebkitMutationObserver,
                r = new t(function(e) { e.forEach(function(e) { b.onResize(!0), b.emit("onObserverUpdate", b, e) }) });
            r.observe(e, { attributes: "undefined" == typeof a.attributes ? !0 : a.attributes, childList: "undefined" == typeof a.childList ? !0 : a.childList, characterData: "undefined" == typeof a.characterData ? !0 : a.characterData }), b.observers.push(r) }

        function p(e) { e.originalEvent && (e = e.originalEvent);
            var a = e.keyCode || e.charCode;
            if (!b.params.allowSwipeToNext && (b.isHorizontal() && 39 === a || !b.isHorizontal() && 40 === a)) return !1;
            if (!b.params.allowSwipeToPrev && (b.isHorizontal() && 37 === a || !b.isHorizontal() && 38 === a)) return !1;
            if (!(e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || document.activeElement && document.activeElement.nodeName && ("input" === document.activeElement.nodeName.toLowerCase() || "textarea" === document.activeElement.nodeName.toLowerCase()))) {
                if (37 === a || 39 === a || 38 === a || 40 === a) {
                    var t = !1;
                    if (b.container.parents(".swiper-slide").length > 0 && 0 === b.container.parents(".swiper-slide-active").length) return;
                    var r = { left: window.pageXOffset, top: window.pageYOffset },
                        i = window.innerWidth,
                        s = window.innerHeight,
                        n = b.container.offset();
                    b.rtl && (n.left = n.left - b.container[0].scrollLeft);
                    for (var o = [
                            [n.left, n.top],
                            [n.left + b.width, n.top],
                            [n.left, n.top + b.height],
                            [n.left + b.width, n.top + b.height]
                        ], l = 0; l < o.length; l++) {
                        var p = o[l];
                        p[0] >= r.left && p[0] <= r.left + i && p[1] >= r.top && p[1] <= r.top + s && (t = !0) }
                    if (!t) return }
                b.isHorizontal() ? ((37 === a || 39 === a) && (e.preventDefault ? e.preventDefault() : e.returnValue = !1), (39 === a && !b.rtl || 37 === a && b.rtl) && b.slideNext(), (37 === a && !b.rtl || 39 === a && b.rtl) && b.slidePrev()) : ((38 === a || 40 === a) && (e.preventDefault ? e.preventDefault() : e.returnValue = !1), 40 === a && b.slideNext(), 38 === a && b.slidePrev()) } }

        function d(e) { e.originalEvent && (e = e.originalEvent);
            var a = b.mousewheel.event,
                t = 0,
                r = b.rtl ? -1 : 1;
            if ("mousewheel" === a)
                if (b.params.mousewheelForceToAxis)
                    if (b.isHorizontal()) {
                        if (!(Math.abs(e.wheelDeltaX) > Math.abs(e.wheelDeltaY))) return;
                        t = e.wheelDeltaX * r } else {
                        if (!(Math.abs(e.wheelDeltaY) > Math.abs(e.wheelDeltaX))) return;
                        t = e.wheelDeltaY }
            else t = Math.abs(e.wheelDeltaX) > Math.abs(e.wheelDeltaY) ? -e.wheelDeltaX * r : -e.wheelDeltaY;
            else if ("DOMMouseScroll" === a) t = -e.detail;
            else if ("wheel" === a)
                if (b.params.mousewheelForceToAxis)
                    if (b.isHorizontal()) {
                        if (!(Math.abs(e.deltaX) > Math.abs(e.deltaY))) return;
                        t = -e.deltaX * r } else {
                        if (!(Math.abs(e.deltaY) > Math.abs(e.deltaX))) return;
                        t = -e.deltaY }
            else t = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX * r : -e.deltaY;
            if (0 !== t) {
                if (b.params.mousewheelInvert && (t = -t), b.params.freeMode) {
                    var i = b.getWrapperTranslate() + t * b.params.mousewheelSensitivity,
                        s = b.isBeginning,
                        n = b.isEnd;
                    if (i >= b.minTranslate() && (i = b.minTranslate()), i <= b.maxTranslate() && (i = b.maxTranslate()), b.setWrapperTransition(0), b.setWrapperTranslate(i), b.updateProgress(), b.updateActiveIndex(), (!s && b.isBeginning || !n && b.isEnd) && b.updateClasses(), b.params.freeModeSticky ? (clearTimeout(b.mousewheel.timeout), b.mousewheel.timeout = setTimeout(function() { b.slideReset() }, 300)) : b.params.lazyLoading && b.lazy && b.lazy.load(), 0 === i || i === b.maxTranslate()) return } else {
                    if ((new window.Date).getTime() - b.mousewheel.lastScrollTime > 60)
                        if (0 > t)
                            if (b.isEnd && !b.params.loop || b.animating) {
                                if (b.params.mousewheelReleaseOnEdges) return !0 } else b.slideNext();
                    else if (b.isBeginning && !b.params.loop || b.animating) {
                        if (b.params.mousewheelReleaseOnEdges) return !0 } else b.slidePrev();
                    b.mousewheel.lastScrollTime = (new window.Date).getTime() }
                return b.params.autoplay && b.stopAutoplay(), e.preventDefault ? e.preventDefault() : e.returnValue = !1, !1 } }

        function u(e, t) { e = a(e);
            var r, i, s, n = b.rtl ? -1 : 1;
            r = e.attr("data-swiper-parallax") || "0", i = e.attr("data-swiper-parallax-x"), s = e.attr("data-swiper-parallax-y"), i || s ? (i = i || "0", s = s || "0") : b.isHorizontal() ? (i = r, s = "0") : (s = r, i = "0"), i = i.indexOf("%") >= 0 ? parseInt(i, 10) * t * n + "%" : i * t * n + "px", s = s.indexOf("%") >= 0 ? parseInt(s, 10) * t + "%" : s * t + "px", e.transform("translate3d(" + i + ", " + s + ",0px)") }

        function c(e) {
            return 0 !== e.indexOf("on") && (e = e[0] !== e[0].toUpperCase() ? "on" + e[0].toUpperCase() + e.substring(1) : "on" + e), e }
        if (!(this instanceof t)) return new t(e, i);
        var m = { direction: "horizontal", touchEventsTarget: "container", initialSlide: 0, speed: 300, autoplay: !1, autoplayDisableOnInteraction: !0, autoplayStopOnLast: !1, iOSEdgeSwipeDetection: !1, iOSEdgeSwipeThreshold: 20, freeMode: !1, freeModeMomentum: !0, freeModeMomentumRatio: 1, freeModeMomentumBounce: !0, freeModeMomentumBounceRatio: 1, freeModeSticky: !1, freeModeMinimumVelocity: .02, autoHeight: !1, setWrapperSize: !1, virtualTranslate: !1, effect: "slide", coverflow: { rotate: 50, stretch: 0, depth: 100, modifier: 1, slideShadows: !0 }, flip: { slideShadows: !0, limitRotation: !0 }, cube: { slideShadows: !0, shadow: !0, shadowOffset: 20, shadowScale: .94 }, fade: { crossFade: !1 }, parallax: !1, scrollbar: null, scrollbarHide: !0, scrollbarDraggable: !1, scrollbarSnapOnRelease: !1, keyboardControl: !1, mousewheelControl: !1, mousewheelReleaseOnEdges: !1, mousewheelInvert: !1, mousewheelForceToAxis: !1, mousewheelSensitivity: 1, hashnav: !1, breakpoints: void 0, spaceBetween: 0, slidesPerView: 1, slidesPerColumn: 1, slidesPerColumnFill: "column", slidesPerGroup: 1, centeredSlides: !1, slidesOffsetBefore: 0, slidesOffsetAfter: 0, roundLengths: !1, touchRatio: 1, touchAngle: 45, simulateTouch: !0, shortSwipes: !0, longSwipes: !0, longSwipesRatio: .5, longSwipesMs: 300, followFinger: !0, onlyExternal: !1, threshold: 0, touchMoveStopPropagation: !0, uniqueNavElements: !0, pagination: null, paginationElement: "span", paginationClickable: !1, paginationHide: !1, paginationBulletRender: null, paginationProgressRender: null, paginationFractionRender: null, paginationCustomRender: null, paginationType: "bullets", resistance: !0, resistanceRatio: .85, nextButton: null, prevButton: null, watchSlidesProgress: !1, watchSlidesVisibility: !1, grabCursor: !1, preventClicks: !0, preventClicksPropagation: !0, slideToClickedSlide: !1, lazyLoading: !1, lazyLoadingInPrevNext: !1, lazyLoadingInPrevNextAmount: 1, lazyLoadingOnTransitionStart: !1, preloadImages: !0, updateOnImagesReady: !0, loop: !1, loopAdditionalSlides: 0, loopedSlides: null, control: void 0, controlInverse: !1, controlBy: "slide", allowSwipeToPrev: !0, allowSwipeToNext: !0, swipeHandler: null, noSwiping: !0, noSwipingClass: "swiper-no-swiping", slideClass: "swiper-slide", slideActiveClass: "swiper-slide-active", slideVisibleClass: "swiper-slide-visible", slideDuplicateClass: "swiper-slide-duplicate", slideNextClass: "swiper-slide-next", slidePrevClass: "swiper-slide-prev", wrapperClass: "swiper-wrapper", bulletClass: "swiper-pagination-bullet", bulletActiveClass: "swiper-pagination-bullet-active", buttonDisabledClass: "swiper-button-disabled", paginationCurrentClass: "swiper-pagination-current", paginationTotalClass: "swiper-pagination-total", paginationHiddenClass: "swiper-pagination-hidden", paginationProgressbarClass: "swiper-pagination-progressbar", observer: !1, observeParents: !1, a11y: !1, prevSlideMessage: "Previous slide", nextSlideMessage: "Next slide", firstSlideMessage: "This is the first slide", lastSlideMessage: "This is the last slide", paginationBulletMessage: "Go to slide {{index}}", runCallbacksOnInit: !0 },
            h = i && i.virtualTranslate;
        i = i || {};
        var f = {};
        for (var g in i)
            if ("object" != typeof i[g] || null === i[g] || (i[g].nodeType || i[g] === window || i[g] === document || "undefined" != typeof r && i[g] instanceof r || "undefined" != typeof jQuery && i[g] instanceof jQuery)) f[g] = i[g];
            else { f[g] = {};
                for (var v in i[g]) f[g][v] = i[g][v] }
        for (var w in m)
            if ("undefined" == typeof i[w]) i[w] = m[w];
            else if ("object" == typeof i[w])
            for (var y in m[w]) "undefined" == typeof i[w][y] && (i[w][y] = m[w][y]);
        var b = this;
        if (b.params = i, b.originalParams = f, b.classNames = [], "undefined" != typeof a && "undefined" != typeof r && (a = r), ("undefined" != typeof a || (a = "undefined" == typeof r ? window.Dom7 || window.Zepto || window.jQuery : r)) && (b.$ = a, b.currentBreakpoint = void 0, b.getActiveBreakpoint = function() {
                if (!b.params.breakpoints) return !1;
                var e, a = !1,
                    t = [];
                for (e in b.params.breakpoints) b.params.breakpoints.hasOwnProperty(e) && t.push(e);
                t.sort(function(e, a) {
                    return parseInt(e, 10) > parseInt(a, 10) });
                for (var r = 0; r < t.length; r++) e = t[r], e >= window.innerWidth && !a && (a = e);
                return a || "max" }, b.setBreakpoint = function() {
                var e = b.getActiveBreakpoint();
                if (e && b.currentBreakpoint !== e) {
                    var a = e in b.params.breakpoints ? b.params.breakpoints[e] : b.originalParams,
                        t = b.params.loop && a.slidesPerView !== b.params.slidesPerView;
                    for (var r in a) b.params[r] = a[r];
                    b.currentBreakpoint = e, t && b.destroyLoop && b.reLoop(!0) } }, b.params.breakpoints && b.setBreakpoint(), b.container = a(e), 0 !== b.container.length)) {
            if (b.container.length > 1) {
                var x = [];
                return b.container.each(function() { x.push(new t(this, i)) }), x }
            b.container[0].swiper = b, b.container.data("swiper", b), b.classNames.push("swiper-container-" + b.params.direction), b.params.freeMode && b.classNames.push("swiper-container-free-mode"), b.support.flexbox || (b.classNames.push("swiper-container-no-flexbox"), b.params.slidesPerColumn = 1), b.params.autoHeight && b.classNames.push("swiper-container-autoheight"), (b.params.parallax || b.params.watchSlidesVisibility) && (b.params.watchSlidesProgress = !0), ["cube", "coverflow", "flip"].indexOf(b.params.effect) >= 0 && (b.support.transforms3d ? (b.params.watchSlidesProgress = !0, b.classNames.push("swiper-container-3d")) : b.params.effect = "slide"), "slide" !== b.params.effect && b.classNames.push("swiper-container-" + b.params.effect), "cube" === b.params.effect && (b.params.resistanceRatio = 0, b.params.slidesPerView = 1, b.params.slidesPerColumn = 1, b.params.slidesPerGroup = 1, b.params.centeredSlides = !1, b.params.spaceBetween = 0, b.params.virtualTranslate = !0, b.params.setWrapperSize = !1), ("fade" === b.params.effect || "flip" === b.params.effect) && (b.params.slidesPerView = 1, b.params.slidesPerColumn = 1, b.params.slidesPerGroup = 1, b.params.watchSlidesProgress = !0, b.params.spaceBetween = 0, b.params.setWrapperSize = !1, "undefined" == typeof h && (b.params.virtualTranslate = !0)), b.params.grabCursor && b.support.touch && (b.params.grabCursor = !1), b.wrapper = b.container.children("." + b.params.wrapperClass), b.params.pagination && (b.paginationContainer = a(b.params.pagination), b.params.uniqueNavElements && "string" == typeof b.params.pagination && b.paginationContainer.length > 1 && 1 === b.container.find(b.params.pagination).length && (b.paginationContainer = b.container.find(b.params.pagination)), "bullets" === b.params.paginationType && b.params.paginationClickable ? b.paginationContainer.addClass("swiper-pagination-clickable") : b.params.paginationClickable = !1, b.paginationContainer.addClass("swiper-pagination-" + b.params.paginationType)), (b.params.nextButton || b.params.prevButton) && (b.params.nextButton && (b.nextButton = a(b.params.nextButton), b.params.uniqueNavElements && "string" == typeof b.params.nextButton && b.nextButton.length > 1 && 1 === b.container.find(b.params.nextButton).length && (b.nextButton = b.container.find(b.params.nextButton))), b.params.prevButton && (b.prevButton = a(b.params.prevButton), b.params.uniqueNavElements && "string" == typeof b.params.prevButton && b.prevButton.length > 1 && 1 === b.container.find(b.params.prevButton).length && (b.prevButton = b.container.find(b.params.prevButton)))), b.isHorizontal = function() {
                return "horizontal" === b.params.direction }, b.rtl = b.isHorizontal() && ("rtl" === b.container[0].dir.toLowerCase() || "rtl" === b.container.css("direction")), b.rtl && b.classNames.push("swiper-container-rtl"), b.rtl && (b.wrongRTL = "-webkit-box" === b.wrapper.css("display")), b.params.slidesPerColumn > 1 && b.classNames.push("swiper-container-multirow"), b.device.android && b.classNames.push("swiper-container-android"), b.container.addClass(b.classNames.join(" ")), b.translate = 0, b.progress = 0, b.velocity = 0, b.lockSwipeToNext = function() { b.params.allowSwipeToNext = !1 }, b.lockSwipeToPrev = function() { b.params.allowSwipeToPrev = !1 }, b.lockSwipes = function() { b.params.allowSwipeToNext = b.params.allowSwipeToPrev = !1 }, b.unlockSwipeToNext = function() { b.params.allowSwipeToNext = !0 }, b.unlockSwipeToPrev = function() { b.params.allowSwipeToPrev = !0 }, b.unlockSwipes = function() { b.params.allowSwipeToNext = b.params.allowSwipeToPrev = !0 }, b.params.grabCursor && (b.container[0].style.cursor = "move", b.container[0].style.cursor = "-webkit-grab", b.container[0].style.cursor = "-moz-grab", b.container[0].style.cursor = "grab"), b.imagesToLoad = [], b.imagesLoaded = 0, b.loadImage = function(e, a, t, r, i) {
                function s() { i && i() }
                var n;
                e.complete && r ? s() : a ? (n = new window.Image, n.onload = s, n.onerror = s, t && (n.srcset = t), a && (n.src = a)) : s() }, b.preloadImages = function() {
                function e() { "undefined" != typeof b && null !== b && (void 0 !== b.imagesLoaded && b.imagesLoaded++, b.imagesLoaded === b.imagesToLoad.length && (b.params.updateOnImagesReady && b.update(), b.emit("onImagesReady", b))) }
                b.imagesToLoad = b.container.find("img");
                for (var a = 0; a < b.imagesToLoad.length; a++) b.loadImage(b.imagesToLoad[a], b.imagesToLoad[a].currentSrc || b.imagesToLoad[a].getAttribute("src"), b.imagesToLoad[a].srcset || b.imagesToLoad[a].getAttribute("srcset"), !0, e) }, b.autoplayTimeoutId = void 0, b.autoplaying = !1, b.autoplayPaused = !1, b.startAutoplay = function() {
                return "undefined" != typeof b.autoplayTimeoutId ? !1 : b.params.autoplay ? b.autoplaying ? !1 : (b.autoplaying = !0, b.emit("onAutoplayStart", b), void n()) : !1 }, b.stopAutoplay = function(e) { b.autoplayTimeoutId && (b.autoplayTimeoutId && clearTimeout(b.autoplayTimeoutId), b.autoplaying = !1, b.autoplayTimeoutId = void 0, b.emit("onAutoplayStop", b)) }, b.pauseAutoplay = function(e) { b.autoplayPaused || (b.autoplayTimeoutId && clearTimeout(b.autoplayTimeoutId), b.autoplayPaused = !0, 0 === e ? (b.autoplayPaused = !1, n()) : b.wrapper.transitionEnd(function() { b && (b.autoplayPaused = !1, b.autoplaying ? n() : b.stopAutoplay()) })) }, b.minTranslate = function() {
                return -b.snapGrid[0] }, b.maxTranslate = function() {
                return -b.snapGrid[b.snapGrid.length - 1] }, b.updateAutoHeight = function() {
                var e = b.slides.eq(b.activeIndex)[0];
                if ("undefined" != typeof e) {
                    var a = e.offsetHeight;
                    a && b.wrapper.css("height", a + "px") } }, b.updateContainerSize = function() {
                var e, a;
                e = "undefined" != typeof b.params.width ? b.params.width : b.container[0].clientWidth, a = "undefined" != typeof b.params.height ? b.params.height : b.container[0].clientHeight, 0 === e && b.isHorizontal() || 0 === a && !b.isHorizontal() || (e = e - parseInt(b.container.css("padding-left"), 10) - parseInt(b.container.css("padding-right"), 10), a = a - parseInt(b.container.css("padding-top"), 10) - parseInt(b.container.css("padding-bottom"), 10), b.width = e, b.height = a, b.size = b.isHorizontal() ? b.width : b.height) }, b.updateSlidesSize = function() { b.slides = b.wrapper.children("." + b.params.slideClass), b.snapGrid = [], b.slidesGrid = [], b.slidesSizesGrid = [];
                var e, a = b.params.spaceBetween,
                    t = -b.params.slidesOffsetBefore,
                    r = 0,
                    i = 0;
                if ("undefined" != typeof b.size) { "string" == typeof a && a.indexOf("%") >= 0 && (a = parseFloat(a.replace("%", "")) / 100 * b.size), b.virtualSize = -a, b.rtl ? b.slides.css({ marginLeft: "", marginTop: "" }) : b.slides.css({ marginRight: "", marginBottom: "" });
                    var n;
                    b.params.slidesPerColumn > 1 && (n = Math.floor(b.slides.length / b.params.slidesPerColumn) === b.slides.length / b.params.slidesPerColumn ? b.slides.length : Math.ceil(b.slides.length / b.params.slidesPerColumn) * b.params.slidesPerColumn, "auto" !== b.params.slidesPerView && "row" === b.params.slidesPerColumnFill && (n = Math.max(n, b.params.slidesPerView * b.params.slidesPerColumn)));
                    var o, l = b.params.slidesPerColumn,
                        p = n / l,
                        d = p - (b.params.slidesPerColumn * p - b.slides.length);
                    for (e = 0; e < b.slides.length; e++) { o = 0;
                        var u = b.slides.eq(e);
                        if (b.params.slidesPerColumn > 1) {
                            var c, m, h; "column" === b.params.slidesPerColumnFill ? (m = Math.floor(e / l), h = e - m * l, (m > d || m === d && h === l - 1) && ++h >= l && (h = 0, m++), c = m + h * n / l, u.css({ "-webkit-box-ordinal-group": c, "-moz-box-ordinal-group": c, "-ms-flex-order": c, "-webkit-order": c, order: c })) : (h = Math.floor(e / p), m = e - h * p), u.css({ "margin-top": 0 !== h && b.params.spaceBetween && b.params.spaceBetween + "px" }).attr("data-swiper-column", m).attr("data-swiper-row", h) } "none" !== u.css("display") && ("auto" === b.params.slidesPerView ? (o = b.isHorizontal() ? u.outerWidth(!0) : u.outerHeight(!0), b.params.roundLengths && (o = s(o))) : (o = (b.size - (b.params.slidesPerView - 1) * a) / b.params.slidesPerView, b.params.roundLengths && (o = s(o)), b.isHorizontal() ? b.slides[e].style.width = o + "px" : b.slides[e].style.height = o + "px"), b.slides[e].swiperSlideSize = o, b.slidesSizesGrid.push(o), b.params.centeredSlides ? (t = t + o / 2 + r / 2 + a, 0 === e && (t = t - b.size / 2 - a), Math.abs(t) < .001 && (t = 0), i % b.params.slidesPerGroup === 0 && b.snapGrid.push(t), b.slidesGrid.push(t)) : (i % b.params.slidesPerGroup === 0 && b.snapGrid.push(t), b.slidesGrid.push(t), t = t + o + a), b.virtualSize += o + a, r = o, i++) }
                    b.virtualSize = Math.max(b.virtualSize, b.size) + b.params.slidesOffsetAfter;
                    var f;
                    if (b.rtl && b.wrongRTL && ("slide" === b.params.effect || "coverflow" === b.params.effect) && b.wrapper.css({ width: b.virtualSize + b.params.spaceBetween + "px" }), (!b.support.flexbox || b.params.setWrapperSize) && (b.isHorizontal() ? b.wrapper.css({ width: b.virtualSize + b.params.spaceBetween + "px" }) : b.wrapper.css({ height: b.virtualSize + b.params.spaceBetween + "px" })), b.params.slidesPerColumn > 1 && (b.virtualSize = (o + b.params.spaceBetween) * n, b.virtualSize = Math.ceil(b.virtualSize / b.params.slidesPerColumn) - b.params.spaceBetween, b.wrapper.css({ width: b.virtualSize + b.params.spaceBetween + "px" }), b.params.centeredSlides)) {
                        for (f = [], e = 0; e < b.snapGrid.length; e++) b.snapGrid[e] < b.virtualSize + b.snapGrid[0] && f.push(b.snapGrid[e]);
                        b.snapGrid = f }
                    if (!b.params.centeredSlides) {
                        for (f = [], e = 0; e < b.snapGrid.length; e++) b.snapGrid[e] <= b.virtualSize - b.size && f.push(b.snapGrid[e]);
                        b.snapGrid = f, Math.floor(b.virtualSize - b.size) - Math.floor(b.snapGrid[b.snapGrid.length - 1]) > 1 && b.snapGrid.push(b.virtualSize - b.size) }
                    0 === b.snapGrid.length && (b.snapGrid = [0]), 0 !== b.params.spaceBetween && (b.isHorizontal() ? b.rtl ? b.slides.css({ marginLeft: a + "px" }) : b.slides.css({ marginRight: a + "px" }) : b.slides.css({ marginBottom: a + "px" })), b.params.watchSlidesProgress && b.updateSlidesOffset() } }, b.updateSlidesOffset = function() {
                for (var e = 0; e < b.slides.length; e++) b.slides[e].swiperSlideOffset = b.isHorizontal() ? b.slides[e].offsetLeft : b.slides[e].offsetTop }, b.updateSlidesProgress = function(e) {
                if ("undefined" == typeof e && (e = b.translate || 0), 0 !== b.slides.length) { "undefined" == typeof b.slides[0].swiperSlideOffset && b.updateSlidesOffset();
                    var a = -e;
                    b.rtl && (a = e), b.slides.removeClass(b.params.slideVisibleClass);
                    for (var t = 0; t < b.slides.length; t++) {
                        var r = b.slides[t],
                            i = (a - r.swiperSlideOffset) / (r.swiperSlideSize + b.params.spaceBetween);
                        if (b.params.watchSlidesVisibility) {
                            var s = -(a - r.swiperSlideOffset),
                                n = s + b.slidesSizesGrid[t],
                                o = s >= 0 && s < b.size || n > 0 && n <= b.size || 0 >= s && n >= b.size;
                            o && b.slides.eq(t).addClass(b.params.slideVisibleClass) }
                        r.progress = b.rtl ? -i : i } } }, b.updateProgress = function(e) { "undefined" == typeof e && (e = b.translate || 0);
                var a = b.maxTranslate() - b.minTranslate(),
                    t = b.isBeginning,
                    r = b.isEnd;
                0 === a ? (b.progress = 0, b.isBeginning = b.isEnd = !0) : (b.progress = (e - b.minTranslate()) / a, b.isBeginning = b.progress <= 0, b.isEnd = b.progress >= 1), b.isBeginning && !t && b.emit("onReachBeginning", b), b.isEnd && !r && b.emit("onReachEnd", b), b.params.watchSlidesProgress && b.updateSlidesProgress(e), b.emit("onProgress", b, b.progress) }, b.updateActiveIndex = function() {
                var e, a, t, r = b.rtl ? b.translate : -b.translate;
                for (a = 0; a < b.slidesGrid.length; a++) "undefined" != typeof b.slidesGrid[a + 1] ? r >= b.slidesGrid[a] && r < b.slidesGrid[a + 1] - (b.slidesGrid[a + 1] - b.slidesGrid[a]) / 2 ? e = a : r >= b.slidesGrid[a] && r < b.slidesGrid[a + 1] && (e = a + 1) : r >= b.slidesGrid[a] && (e = a);
                (0 > e || "undefined" == typeof e) && (e = 0), t = Math.floor(e / b.params.slidesPerGroup), t >= b.snapGrid.length && (t = b.snapGrid.length - 1), e !== b.activeIndex && (b.snapIndex = t, b.previousIndex = b.activeIndex, b.activeIndex = e, b.updateClasses()) }, b.updateClasses = function() { b.slides.removeClass(b.params.slideActiveClass + " " + b.params.slideNextClass + " " + b.params.slidePrevClass);
                var e = b.slides.eq(b.activeIndex);
                e.addClass(b.params.slideActiveClass);
                var t = e.next("." + b.params.slideClass).addClass(b.params.slideNextClass);
                b.params.loop && 0 === t.length && b.slides.eq(0).addClass(b.params.slideNextClass);
                var r = e.prev("." + b.params.slideClass).addClass(b.params.slidePrevClass);
                if (b.params.loop && 0 === r.length && b.slides.eq(-1).addClass(b.params.slidePrevClass), b.paginationContainer && b.paginationContainer.length > 0) {
                    var i, s = b.params.loop ? Math.ceil((b.slides.length - 2 * b.loopedSlides) / b.params.slidesPerGroup) : b.snapGrid.length;
                    if (b.params.loop ? (i = Math.ceil((b.activeIndex - b.loopedSlides) / b.params.slidesPerGroup), i > b.slides.length - 1 - 2 * b.loopedSlides && (i -= b.slides.length - 2 * b.loopedSlides), i > s - 1 && (i -= s), 0 > i && "bullets" !== b.params.paginationType && (i = s + i)) : i = "undefined" != typeof b.snapIndex ? b.snapIndex : b.activeIndex || 0, "bullets" === b.params.paginationType && b.bullets && b.bullets.length > 0 && (b.bullets.removeClass(b.params.bulletActiveClass), b.paginationContainer.length > 1 ? b.bullets.each(function() { a(this).index() === i && a(this).addClass(b.params.bulletActiveClass) }) : b.bullets.eq(i).addClass(b.params.bulletActiveClass)), "fraction" === b.params.paginationType && (b.paginationContainer.find("." + b.params.paginationCurrentClass).text(i + 1), b.paginationContainer.find("." + b.params.paginationTotalClass).text(s)), "progress" === b.params.paginationType) {
                        var n = (i + 1) / s,
                            o = n,
                            l = 1;
                        b.isHorizontal() || (l = n, o = 1), b.paginationContainer.find("." + b.params.paginationProgressbarClass).transform("translate3d(0,0,0) scaleX(" + o + ") scaleY(" + l + ")").transition(b.params.speed) } "custom" === b.params.paginationType && b.params.paginationCustomRender && (b.paginationContainer.html(b.params.paginationCustomRender(b, i + 1, s)), b.emit("onPaginationRendered", b, b.paginationContainer[0])) }
                b.params.loop || (b.params.prevButton && b.prevButton && b.prevButton.length > 0 && (b.isBeginning ? (b.prevButton.addClass(b.params.buttonDisabledClass), b.params.a11y && b.a11y && b.a11y.disable(b.prevButton)) : (b.prevButton.removeClass(b.params.buttonDisabledClass), b.params.a11y && b.a11y && b.a11y.enable(b.prevButton))), b.params.nextButton && b.nextButton && b.nextButton.length > 0 && (b.isEnd ? (b.nextButton.addClass(b.params.buttonDisabledClass), b.params.a11y && b.a11y && b.a11y.disable(b.nextButton)) : (b.nextButton.removeClass(b.params.buttonDisabledClass), b.params.a11y && b.a11y && b.a11y.enable(b.nextButton)))) }, b.updatePagination = function() {
                if (b.params.pagination && b.paginationContainer && b.paginationContainer.length > 0) {
                    var e = "";
                    if ("bullets" === b.params.paginationType) {
                        for (var a = b.params.loop ? Math.ceil((b.slides.length - 2 * b.loopedSlides) / b.params.slidesPerGroup) : b.snapGrid.length, t = 0; a > t; t++) e += b.params.paginationBulletRender ? b.params.paginationBulletRender(t, b.params.bulletClass) : "<" + b.params.paginationElement + ' class="' + b.params.bulletClass + '"></' + b.params.paginationElement + ">";
                        b.paginationContainer.html(e), b.bullets = b.paginationContainer.find("." + b.params.bulletClass), b.params.paginationClickable && b.params.a11y && b.a11y && b.a11y.initPagination() } "fraction" === b.params.paginationType && (e = b.params.paginationFractionRender ? b.params.paginationFractionRender(b, b.params.paginationCurrentClass, b.params.paginationTotalClass) : '<span class="' + b.params.paginationCurrentClass + '"></span> / <span class="' + b.params.paginationTotalClass + '"></span>', b.paginationContainer.html(e)), "progress" === b.params.paginationType && (e = b.params.paginationProgressRender ? b.params.paginationProgressRender(b, b.params.paginationProgressbarClass) : '<span class="' + b.params.paginationProgressbarClass + '"></span>', b.paginationContainer.html(e)), "custom" !== b.params.paginationType && b.emit("onPaginationRendered", b, b.paginationContainer[0]) } }, b.update = function(e) {
                function a() { r = Math.min(Math.max(b.translate, b.maxTranslate()), b.minTranslate()), b.setWrapperTranslate(r), b.updateActiveIndex(), b.updateClasses() }
                if (b.updateContainerSize(), b.updateSlidesSize(), b.updateProgress(), b.updatePagination(), b.updateClasses(), b.params.scrollbar && b.scrollbar && b.scrollbar.set(), e) {
                    var t, r;
                    b.controller && b.controller.spline && (b.controller.spline = void 0), b.params.freeMode ? (a(), b.params.autoHeight && b.updateAutoHeight()) : (t = ("auto" === b.params.slidesPerView || b.params.slidesPerView > 1) && b.isEnd && !b.params.centeredSlides ? b.slideTo(b.slides.length - 1, 0, !1, !0) : b.slideTo(b.activeIndex, 0, !1, !0), t || a()) } else b.params.autoHeight && b.updateAutoHeight() }, b.onResize = function(e) { b.params.breakpoints && b.setBreakpoint();
                var a = b.params.allowSwipeToPrev,
                    t = b.params.allowSwipeToNext;
                b.params.allowSwipeToPrev = b.params.allowSwipeToNext = !0, b.updateContainerSize(), b.updateSlidesSize(), ("auto" === b.params.slidesPerView || b.params.freeMode || e) && b.updatePagination(), b.params.scrollbar && b.scrollbar && b.scrollbar.set(), b.controller && b.controller.spline && (b.controller.spline = void 0);
                var r = !1;
                if (b.params.freeMode) {
                    var i = Math.min(Math.max(b.translate, b.maxTranslate()), b.minTranslate());
                    b.setWrapperTranslate(i), b.updateActiveIndex(), b.updateClasses(), b.params.autoHeight && b.updateAutoHeight() } else b.updateClasses(), r = ("auto" === b.params.slidesPerView || b.params.slidesPerView > 1) && b.isEnd && !b.params.centeredSlides ? b.slideTo(b.slides.length - 1, 0, !1, !0) : b.slideTo(b.activeIndex, 0, !1, !0);
                b.params.lazyLoading && !r && b.lazy && b.lazy.load(), b.params.allowSwipeToPrev = a, b.params.allowSwipeToNext = t };
            var T = ["mousedown", "mousemove", "mouseup"];
            window.navigator.pointerEnabled ? T = ["pointerdown", "pointermove", "pointerup"] : window.navigator.msPointerEnabled && (T = ["MSPointerDown", "MSPointerMove", "MSPointerUp"]), b.touchEvents = { start: b.support.touch || !b.params.simulateTouch ? "touchstart" : T[0], move: b.support.touch || !b.params.simulateTouch ? "touchmove" : T[1], end: b.support.touch || !b.params.simulateTouch ? "touchend" : T[2] }, (window.navigator.pointerEnabled || window.navigator.msPointerEnabled) && ("container" === b.params.touchEventsTarget ? b.container : b.wrapper).addClass("swiper-wp8-" + b.params.direction), b.initEvents = function(e) {
                var a = e ? "off" : "on",
                    t = e ? "removeEventListener" : "addEventListener",
                    r = "container" === b.params.touchEventsTarget ? b.container[0] : b.wrapper[0],
                    s = b.support.touch ? r : document,
                    n = b.params.nested ? !0 : !1;
                b.browser.ie ? (r[t](b.touchEvents.start, b.onTouchStart, !1), s[t](b.touchEvents.move, b.onTouchMove, n), s[t](b.touchEvents.end, b.onTouchEnd, !1)) : (b.support.touch && (r[t](b.touchEvents.start, b.onTouchStart, !1), r[t](b.touchEvents.move, b.onTouchMove, n), r[t](b.touchEvents.end, b.onTouchEnd, !1)), !i.simulateTouch || b.device.ios || b.device.android || (r[t]("mousedown", b.onTouchStart, !1), document[t]("mousemove", b.onTouchMove, n), document[t]("mouseup", b.onTouchEnd, !1))), window[t]("resize", b.onResize), b.params.nextButton && b.nextButton && b.nextButton.length > 0 && (b.nextButton[a]("click", b.onClickNext), b.params.a11y && b.a11y && b.nextButton[a]("keydown", b.a11y.onEnterKey)), b.params.prevButton && b.prevButton && b.prevButton.length > 0 && (b.prevButton[a]("click", b.onClickPrev), b.params.a11y && b.a11y && b.prevButton[a]("keydown", b.a11y.onEnterKey)), b.params.pagination && b.params.paginationClickable && (b.paginationContainer[a]("click", "." + b.params.bulletClass, b.onClickIndex), b.params.a11y && b.a11y && b.paginationContainer[a]("keydown", "." + b.params.bulletClass, b.a11y.onEnterKey)), (b.params.preventClicks || b.params.preventClicksPropagation) && r[t]("click", b.preventClicks, !0) }, b.attachEvents = function() { b.initEvents() }, b.detachEvents = function() { b.initEvents(!0) }, b.allowClick = !0, b.preventClicks = function(e) { b.allowClick || (b.params.preventClicks && e.preventDefault(), b.params.preventClicksPropagation && b.animating && (e.stopPropagation(), e.stopImmediatePropagation())) }, b.onClickNext = function(e) { e.preventDefault(), (!b.isEnd || b.params.loop) && b.slideNext() }, b.onClickPrev = function(e) { e.preventDefault(), (!b.isBeginning || b.params.loop) && b.slidePrev() }, b.onClickIndex = function(e) { e.preventDefault();
                var t = a(this).index() * b.params.slidesPerGroup;
                b.params.loop && (t += b.loopedSlides), b.slideTo(t) }, b.updateClickedSlide = function(e) {
                var t = o(e, "." + b.params.slideClass),
                    r = !1;
                if (t)
                    for (var i = 0; i < b.slides.length; i++) b.slides[i] === t && (r = !0);
                if (!t || !r) return b.clickedSlide = void 0, void(b.clickedIndex = void 0);
                if (b.clickedSlide = t, b.clickedIndex = a(t).index(), b.params.slideToClickedSlide && void 0 !== b.clickedIndex && b.clickedIndex !== b.activeIndex) {
                    var s, n = b.clickedIndex;
                    if (b.params.loop) {
                        if (b.animating) return;
                        s = a(b.clickedSlide).attr("data-swiper-slide-index"), b.params.centeredSlides ? n < b.loopedSlides - b.params.slidesPerView / 2 || n > b.slides.length - b.loopedSlides + b.params.slidesPerView / 2 ? (b.fixLoop(), n = b.wrapper.children("." + b.params.slideClass + '[data-swiper-slide-index="' + s + '"]:not(.swiper-slide-duplicate)').eq(0).index(), setTimeout(function() { b.slideTo(n) }, 0)) : b.slideTo(n) : n > b.slides.length - b.params.slidesPerView ? (b.fixLoop(), n = b.wrapper.children("." + b.params.slideClass + '[data-swiper-slide-index="' + s + '"]:not(.swiper-slide-duplicate)').eq(0).index(), setTimeout(function() { b.slideTo(n) }, 0)) : b.slideTo(n) } else b.slideTo(n) } };
            var S, C, z, M, E, P, k, I, L, B, D = "input, select, textarea, button",
                H = Date.now(),
                A = [];
            b.animating = !1, b.touches = { startX: 0, startY: 0, currentX: 0, currentY: 0, diff: 0 };
            var G, O;
            if (b.onTouchStart = function(e) {
                    if (e.originalEvent && (e = e.originalEvent), G = "touchstart" === e.type, G || !("which" in e) || 3 !== e.which) {
                        if (b.params.noSwiping && o(e, "." + b.params.noSwipingClass)) return void(b.allowClick = !0);
                        if (!b.params.swipeHandler || o(e, b.params.swipeHandler)) {
                            var t = b.touches.currentX = "touchstart" === e.type ? e.targetTouches[0].pageX : e.pageX,
                                r = b.touches.currentY = "touchstart" === e.type ? e.targetTouches[0].pageY : e.pageY;
                            if (!(b.device.ios && b.params.iOSEdgeSwipeDetection && t <= b.params.iOSEdgeSwipeThreshold)) {
                                if (S = !0, C = !1, z = !0, E = void 0, O = void 0, b.touches.startX = t, b.touches.startY = r, M = Date.now(), b.allowClick = !0, b.updateContainerSize(), b.swipeDirection = void 0, b.params.threshold > 0 && (I = !1), "touchstart" !== e.type) {
                                    var i = !0;
                                    a(e.target).is(D) && (i = !1), document.activeElement && a(document.activeElement).is(D) && document.activeElement.blur(), i && e.preventDefault() }
                                b.emit("onTouchStart", b, e) } } } }, b.onTouchMove = function(e) {
                    if (e.originalEvent && (e = e.originalEvent), !G || "mousemove" !== e.type) {
                        if (e.preventedByNestedSwiper) return b.touches.startX = "touchmove" === e.type ? e.targetTouches[0].pageX : e.pageX, void(b.touches.startY = "touchmove" === e.type ? e.targetTouches[0].pageY : e.pageY);
                        if (b.params.onlyExternal) return b.allowClick = !1, void(S && (b.touches.startX = b.touches.currentX = "touchmove" === e.type ? e.targetTouches[0].pageX : e.pageX, b.touches.startY = b.touches.currentY = "touchmove" === e.type ? e.targetTouches[0].pageY : e.pageY, M = Date.now()));
                        if (G && document.activeElement && e.target === document.activeElement && a(e.target).is(D)) return C = !0, void(b.allowClick = !1);
                        if (z && b.emit("onTouchMove", b, e), !(e.targetTouches && e.targetTouches.length > 1)) {
                            if (b.touches.currentX = "touchmove" === e.type ? e.targetTouches[0].pageX : e.pageX, b.touches.currentY = "touchmove" === e.type ? e.targetTouches[0].pageY : e.pageY, "undefined" == typeof E) {
                                var t = 180 * Math.atan2(Math.abs(b.touches.currentY - b.touches.startY), Math.abs(b.touches.currentX - b.touches.startX)) / Math.PI;
                                E = b.isHorizontal() ? t > b.params.touchAngle : 90 - t > b.params.touchAngle }
                            if (E && b.emit("onTouchMoveOpposite", b, e), "undefined" == typeof O && b.browser.ieTouch && (b.touches.currentX !== b.touches.startX || b.touches.currentY !== b.touches.startY) && (O = !0), S) {
                                if (E) return void(S = !1);
                                if (O || !b.browser.ieTouch) {
                                    b.allowClick = !1, b.emit("onSliderMove", b, e), e.preventDefault(), b.params.touchMoveStopPropagation && !b.params.nested && e.stopPropagation(), C || (i.loop && b.fixLoop(), k = b.getWrapperTranslate(), b.setWrapperTransition(0), b.animating && b.wrapper.trigger("webkitTransitionEnd transitionend oTransitionEnd MSTransitionEnd msTransitionEnd"), b.params.autoplay && b.autoplaying && (b.params.autoplayDisableOnInteraction ? b.stopAutoplay() : b.pauseAutoplay()), B = !1, b.params.grabCursor && (b.container[0].style.cursor = "move", b.container[0].style.cursor = "-webkit-grabbing", b.container[0].style.cursor = "-moz-grabbin", b.container[0].style.cursor = "grabbing")), C = !0;
                                    var r = b.touches.diff = b.isHorizontal() ? b.touches.currentX - b.touches.startX : b.touches.currentY - b.touches.startY;
                                    r *= b.params.touchRatio, b.rtl && (r = -r), b.swipeDirection = r > 0 ? "prev" : "next", P = r + k;
                                    var s = !0;
                                    if (r > 0 && P > b.minTranslate() ? (s = !1, b.params.resistance && (P = b.minTranslate() - 1 + Math.pow(-b.minTranslate() + k + r, b.params.resistanceRatio))) : 0 > r && P < b.maxTranslate() && (s = !1, b.params.resistance && (P = b.maxTranslate() + 1 - Math.pow(b.maxTranslate() - k - r, b.params.resistanceRatio))),
                                        s && (e.preventedByNestedSwiper = !0), !b.params.allowSwipeToNext && "next" === b.swipeDirection && k > P && (P = k), !b.params.allowSwipeToPrev && "prev" === b.swipeDirection && P > k && (P = k), b.params.followFinger) {
                                        if (b.params.threshold > 0) {
                                            if (!(Math.abs(r) > b.params.threshold || I)) return void(P = k);
                                            if (!I) return I = !0, b.touches.startX = b.touches.currentX, b.touches.startY = b.touches.currentY, P = k, void(b.touches.diff = b.isHorizontal() ? b.touches.currentX - b.touches.startX : b.touches.currentY - b.touches.startY) }(b.params.freeMode || b.params.watchSlidesProgress) && b.updateActiveIndex(), b.params.freeMode && (0 === A.length && A.push({ position: b.touches[b.isHorizontal() ? "startX" : "startY"], time: M }), A.push({ position: b.touches[b.isHorizontal() ? "currentX" : "currentY"], time: (new window.Date).getTime() })), b.updateProgress(P), b.setWrapperTranslate(P) }
                                }
                            }
                        }
                    }
                }, b.onTouchEnd = function(e) {
                    if (e.originalEvent && (e = e.originalEvent), z && b.emit("onTouchEnd", b, e), z = !1, S) { b.params.grabCursor && C && S && (b.container[0].style.cursor = "move", b.container[0].style.cursor = "-webkit-grab", b.container[0].style.cursor = "-moz-grab", b.container[0].style.cursor = "grab");
                        var t = Date.now(),
                            r = t - M;
                        if (b.allowClick && (b.updateClickedSlide(e), b.emit("onTap", b, e), 300 > r && t - H > 300 && (L && clearTimeout(L), L = setTimeout(function() { b && (b.params.paginationHide && b.paginationContainer.length > 0 && !a(e.target).hasClass(b.params.bulletClass) && b.paginationContainer.toggleClass(b.params.paginationHiddenClass), b.emit("onClick", b, e)) }, 300)), 300 > r && 300 > t - H && (L && clearTimeout(L), b.emit("onDoubleTap", b, e))), H = Date.now(), setTimeout(function() { b && (b.allowClick = !0) }, 0), !S || !C || !b.swipeDirection || 0 === b.touches.diff || P === k) return void(S = C = !1);
                        S = C = !1;
                        var i;
                        if (i = b.params.followFinger ? b.rtl ? b.translate : -b.translate : -P, b.params.freeMode) {
                            if (i < -b.minTranslate()) return void b.slideTo(b.activeIndex);
                            if (i > -b.maxTranslate()) return void(b.slides.length < b.snapGrid.length ? b.slideTo(b.snapGrid.length - 1) : b.slideTo(b.slides.length - 1));
                            if (b.params.freeModeMomentum) {
                                if (A.length > 1) {
                                    var s = A.pop(),
                                        n = A.pop(),
                                        o = s.position - n.position,
                                        l = s.time - n.time;
                                    b.velocity = o / l, b.velocity = b.velocity / 2, Math.abs(b.velocity) < b.params.freeModeMinimumVelocity && (b.velocity = 0), (l > 150 || (new window.Date).getTime() - s.time > 300) && (b.velocity = 0) } else b.velocity = 0;
                                A.length = 0;
                                var p = 1e3 * b.params.freeModeMomentumRatio,
                                    d = b.velocity * p,
                                    u = b.translate + d;
                                b.rtl && (u = -u);
                                var c, m = !1,
                                    h = 20 * Math.abs(b.velocity) * b.params.freeModeMomentumBounceRatio;
                                if (u < b.maxTranslate()) b.params.freeModeMomentumBounce ? (u + b.maxTranslate() < -h && (u = b.maxTranslate() - h), c = b.maxTranslate(), m = !0, B = !0) : u = b.maxTranslate();
                                else if (u > b.minTranslate()) b.params.freeModeMomentumBounce ? (u - b.minTranslate() > h && (u = b.minTranslate() + h), c = b.minTranslate(), m = !0, B = !0) : u = b.minTranslate();
                                else if (b.params.freeModeSticky) {
                                    var f, g = 0;
                                    for (g = 0; g < b.snapGrid.length; g += 1)
                                        if (b.snapGrid[g] > -u) { f = g;
                                            break }
                                    u = Math.abs(b.snapGrid[f] - u) < Math.abs(b.snapGrid[f - 1] - u) || "next" === b.swipeDirection ? b.snapGrid[f] : b.snapGrid[f - 1], b.rtl || (u = -u) }
                                if (0 !== b.velocity) p = b.rtl ? Math.abs((-u - b.translate) / b.velocity) : Math.abs((u - b.translate) / b.velocity);
                                else if (b.params.freeModeSticky) return void b.slideReset();
                                b.params.freeModeMomentumBounce && m ? (b.updateProgress(c), b.setWrapperTransition(p), b.setWrapperTranslate(u), b.onTransitionStart(), b.animating = !0, b.wrapper.transitionEnd(function() { b && B && (b.emit("onMomentumBounce", b), b.setWrapperTransition(b.params.speed), b.setWrapperTranslate(c), b.wrapper.transitionEnd(function() { b && b.onTransitionEnd() })) })) : b.velocity ? (b.updateProgress(u), b.setWrapperTransition(p), b.setWrapperTranslate(u), b.onTransitionStart(), b.animating || (b.animating = !0, b.wrapper.transitionEnd(function() { b && b.onTransitionEnd() }))) : b.updateProgress(u), b.updateActiveIndex() }
                            return void((!b.params.freeModeMomentum || r >= b.params.longSwipesMs) && (b.updateProgress(), b.updateActiveIndex())) }
                        var v, w = 0,
                            y = b.slidesSizesGrid[0];
                        for (v = 0; v < b.slidesGrid.length; v += b.params.slidesPerGroup) "undefined" != typeof b.slidesGrid[v + b.params.slidesPerGroup] ? i >= b.slidesGrid[v] && i < b.slidesGrid[v + b.params.slidesPerGroup] && (w = v, y = b.slidesGrid[v + b.params.slidesPerGroup] - b.slidesGrid[v]) : i >= b.slidesGrid[v] && (w = v, y = b.slidesGrid[b.slidesGrid.length - 1] - b.slidesGrid[b.slidesGrid.length - 2]);
                        var x = (i - b.slidesGrid[w]) / y;
                        if (r > b.params.longSwipesMs) {
                            if (!b.params.longSwipes) return void b.slideTo(b.activeIndex); "next" === b.swipeDirection && (x >= b.params.longSwipesRatio ? b.slideTo(w + b.params.slidesPerGroup) : b.slideTo(w)), "prev" === b.swipeDirection && (x > 1 - b.params.longSwipesRatio ? b.slideTo(w + b.params.slidesPerGroup) : b.slideTo(w)) } else {
                            if (!b.params.shortSwipes) return void b.slideTo(b.activeIndex); "next" === b.swipeDirection && b.slideTo(w + b.params.slidesPerGroup), "prev" === b.swipeDirection && b.slideTo(w) } } }, b._slideTo = function(e, a) {
                    return b.slideTo(e, a, !0, !0) }, b.slideTo = function(e, a, t, r) { "undefined" == typeof t && (t = !0), "undefined" == typeof e && (e = 0), 0 > e && (e = 0), b.snapIndex = Math.floor(e / b.params.slidesPerGroup), b.snapIndex >= b.snapGrid.length && (b.snapIndex = b.snapGrid.length - 1);
                    var i = -b.snapGrid[b.snapIndex];
                    b.params.autoplay && b.autoplaying && (r || !b.params.autoplayDisableOnInteraction ? b.pauseAutoplay(a) : b.stopAutoplay()), b.updateProgress(i);
                    for (var s = 0; s < b.slidesGrid.length; s++) - Math.floor(100 * i) >= Math.floor(100 * b.slidesGrid[s]) && (e = s);
                    return !b.params.allowSwipeToNext && i < b.translate && i < b.minTranslate() ? !1 : !b.params.allowSwipeToPrev && i > b.translate && i > b.maxTranslate() && (b.activeIndex || 0) !== e ? !1 : ("undefined" == typeof a && (a = b.params.speed), b.previousIndex = b.activeIndex || 0, b.activeIndex = e, b.rtl && -i === b.translate || !b.rtl && i === b.translate ? (b.params.autoHeight && b.updateAutoHeight(), b.updateClasses(), "slide" !== b.params.effect && b.setWrapperTranslate(i), !1) : (b.updateClasses(), b.onTransitionStart(t), 0 === a ? (b.setWrapperTranslate(i), b.setWrapperTransition(0), b.onTransitionEnd(t)) : (b.setWrapperTranslate(i), b.setWrapperTransition(a), b.animating || (b.animating = !0, b.wrapper.transitionEnd(function() { b && b.onTransitionEnd(t) }))), !0)) }, b.onTransitionStart = function(e) { "undefined" == typeof e && (e = !0), b.params.autoHeight && b.updateAutoHeight(), b.lazy && b.lazy.onTransitionStart(), e && (b.emit("onTransitionStart", b), b.activeIndex !== b.previousIndex && (b.emit("onSlideChangeStart", b), b.activeIndex > b.previousIndex ? b.emit("onSlideNextStart", b) : b.emit("onSlidePrevStart", b))) }, b.onTransitionEnd = function(e) { b.animating = !1, b.setWrapperTransition(0), "undefined" == typeof e && (e = !0), b.lazy && b.lazy.onTransitionEnd(), e && (b.emit("onTransitionEnd", b), b.activeIndex !== b.previousIndex && (b.emit("onSlideChangeEnd", b), b.activeIndex > b.previousIndex ? b.emit("onSlideNextEnd", b) : b.emit("onSlidePrevEnd", b))), b.params.hashnav && b.hashnav && b.hashnav.setHash() }, b.slideNext = function(e, a, t) {
                    if (b.params.loop) {
                        if (b.animating) return !1;
                        b.fixLoop();
                        b.container[0].clientLeft;
                        return b.slideTo(b.activeIndex + b.params.slidesPerGroup, a, e, t) }
                    return b.slideTo(b.activeIndex + b.params.slidesPerGroup, a, e, t) }, b._slideNext = function(e) {
                    return b.slideNext(!0, e, !0) }, b.slidePrev = function(e, a, t) {
                    if (b.params.loop) {
                        if (b.animating) return !1;
                        b.fixLoop();
                        b.container[0].clientLeft;
                        return b.slideTo(b.activeIndex - 1, a, e, t) }
                    return b.slideTo(b.activeIndex - 1, a, e, t) }, b._slidePrev = function(e) {
                    return b.slidePrev(!0, e, !0) }, b.slideReset = function(e, a, t) {
                    return b.slideTo(b.activeIndex, a, e) }, b.setWrapperTransition = function(e, a) { b.wrapper.transition(e), "slide" !== b.params.effect && b.effects[b.params.effect] && b.effects[b.params.effect].setTransition(e), b.params.parallax && b.parallax && b.parallax.setTransition(e), b.params.scrollbar && b.scrollbar && b.scrollbar.setTransition(e), b.params.control && b.controller && b.controller.setTransition(e, a), b.emit("onSetTransition", b, e) }, b.setWrapperTranslate = function(e, a, t) {
                    var r = 0,
                        i = 0,
                        n = 0;
                    b.isHorizontal() ? r = b.rtl ? -e : e : i = e, b.params.roundLengths && (r = s(r), i = s(i)), b.params.virtualTranslate || (b.support.transforms3d ? b.wrapper.transform("translate3d(" + r + "px, " + i + "px, " + n + "px)") : b.wrapper.transform("translate(" + r + "px, " + i + "px)")), b.translate = b.isHorizontal() ? r : i;
                    var o, l = b.maxTranslate() - b.minTranslate();
                    o = 0 === l ? 0 : (e - b.minTranslate()) / l, o !== b.progress && b.updateProgress(e), a && b.updateActiveIndex(), "slide" !== b.params.effect && b.effects[b.params.effect] && b.effects[b.params.effect].setTranslate(b.translate), b.params.parallax && b.parallax && b.parallax.setTranslate(b.translate), b.params.scrollbar && b.scrollbar && b.scrollbar.setTranslate(b.translate), b.params.control && b.controller && b.controller.setTranslate(b.translate, t), b.emit("onSetTranslate", b, b.translate) }, b.getTranslate = function(e, a) {
                    var t, r, i, s;
                    return "undefined" == typeof a && (a = "x"), b.params.virtualTranslate ? b.rtl ? -b.translate : b.translate : (i = window.getComputedStyle(e, null), window.WebKitCSSMatrix ? (r = i.transform || i.webkitTransform, r.split(",").length > 6 && (r = r.split(", ").map(function(e) {
                        return e.replace(",", ".") }).join(", ")), s = new window.WebKitCSSMatrix("none" === r ? "" : r)) : (s = i.MozTransform || i.OTransform || i.MsTransform || i.msTransform || i.transform || i.getPropertyValue("transform").replace("translate(", "matrix(1, 0, 0, 1,"), t = s.toString().split(",")), "x" === a && (r = window.WebKitCSSMatrix ? s.m41 : 16 === t.length ? parseFloat(t[12]) : parseFloat(t[4])), "y" === a && (r = window.WebKitCSSMatrix ? s.m42 : 16 === t.length ? parseFloat(t[13]) : parseFloat(t[5])), b.rtl && r && (r = -r), r || 0) }, b.getWrapperTranslate = function(e) {
                    return "undefined" == typeof e && (e = b.isHorizontal() ? "x" : "y"), b.getTranslate(b.wrapper[0], e) }, b.observers = [], b.initObservers = function() {
                    if (b.params.observeParents)
                        for (var e = b.container.parents(), a = 0; a < e.length; a++) l(e[a]);
                    l(b.container[0], { childList: !1 }), l(b.wrapper[0], { attributes: !1 }) }, b.disconnectObservers = function() {
                    for (var e = 0; e < b.observers.length; e++) b.observers[e].disconnect();
                    b.observers = [] }, b.createLoop = function() { b.wrapper.children("." + b.params.slideClass + "." + b.params.slideDuplicateClass).remove();
                    var e = b.wrapper.children("." + b.params.slideClass); "auto" !== b.params.slidesPerView || b.params.loopedSlides || (b.params.loopedSlides = e.length), b.loopedSlides = parseInt(b.params.loopedSlides || b.params.slidesPerView, 10), b.loopedSlides = b.loopedSlides + b.params.loopAdditionalSlides, b.loopedSlides > e.length && (b.loopedSlides = e.length);
                    var t, r = [],
                        i = [];
                    for (e.each(function(t, s) {
                            var n = a(this);
                            t < b.loopedSlides && i.push(s), t < e.length && t >= e.length - b.loopedSlides && r.push(s), n.attr("data-swiper-slide-index", t) }), t = 0; t < i.length; t++) b.wrapper.append(a(i[t].cloneNode(!0)).addClass(b.params.slideDuplicateClass));
                    for (t = r.length - 1; t >= 0; t--) b.wrapper.prepend(a(r[t].cloneNode(!0)).addClass(b.params.slideDuplicateClass)) }, b.destroyLoop = function() { b.wrapper.children("." + b.params.slideClass + "." + b.params.slideDuplicateClass).remove(), b.slides.removeAttr("data-swiper-slide-index") }, b.reLoop = function(e) {
                    var a = b.activeIndex - b.loopedSlides;
                    b.destroyLoop(), b.createLoop(), b.updateSlidesSize(), e && b.slideTo(a + b.loopedSlides, 0, !1) }, b.fixLoop = function() {
                    var e;
                    b.activeIndex < b.loopedSlides ? (e = b.slides.length - 3 * b.loopedSlides + b.activeIndex, e += b.loopedSlides, b.slideTo(e, 0, !1, !0)) : ("auto" === b.params.slidesPerView && b.activeIndex >= 2 * b.loopedSlides || b.activeIndex > b.slides.length - 2 * b.params.slidesPerView) && (e = -b.slides.length + b.activeIndex + b.loopedSlides, e += b.loopedSlides, b.slideTo(e, 0, !1, !0)) }, b.appendSlide = function(e) {
                    if (b.params.loop && b.destroyLoop(), "object" == typeof e && e.length)
                        for (var a = 0; a < e.length; a++) e[a] && b.wrapper.append(e[a]);
                    else b.wrapper.append(e);
                    b.params.loop && b.createLoop(), b.params.observer && b.support.observer || b.update(!0) }, b.prependSlide = function(e) { b.params.loop && b.destroyLoop();
                    var a = b.activeIndex + 1;
                    if ("object" == typeof e && e.length) {
                        for (var t = 0; t < e.length; t++) e[t] && b.wrapper.prepend(e[t]);
                        a = b.activeIndex + e.length } else b.wrapper.prepend(e);
                    b.params.loop && b.createLoop(), b.params.observer && b.support.observer || b.update(!0), b.slideTo(a, 0, !1) }, b.removeSlide = function(e) { b.params.loop && (b.destroyLoop(), b.slides = b.wrapper.children("." + b.params.slideClass));
                    var a, t = b.activeIndex;
                    if ("object" == typeof e && e.length) {
                        for (var r = 0; r < e.length; r++) a = e[r], b.slides[a] && b.slides.eq(a).remove(), t > a && t--;
                        t = Math.max(t, 0) } else a = e, b.slides[a] && b.slides.eq(a).remove(), t > a && t--, t = Math.max(t, 0);
                    b.params.loop && b.createLoop(), b.params.observer && b.support.observer || b.update(!0), b.params.loop ? b.slideTo(t + b.loopedSlides, 0, !1) : b.slideTo(t, 0, !1) }, b.removeAllSlides = function() {
                    for (var e = [], a = 0; a < b.slides.length; a++) e.push(a);
                    b.removeSlide(e) }, b.effects = { fade: { setTranslate: function() {
                            for (var e = 0; e < b.slides.length; e++) {
                                var a = b.slides.eq(e),
                                    t = a[0].swiperSlideOffset,
                                    r = -t;
                                b.params.virtualTranslate || (r -= b.translate);
                                var i = 0;
                                b.isHorizontal() || (i = r, r = 0);
                                var s = b.params.fade.crossFade ? Math.max(1 - Math.abs(a[0].progress), 0) : 1 + Math.min(Math.max(a[0].progress, -1), 0);
                                a.css({ opacity: s }).transform("translate3d(" + r + "px, " + i + "px, 0px)") } }, setTransition: function(e) {
                            if (b.slides.transition(e), b.params.virtualTranslate && 0 !== e) {
                                var a = !1;
                                b.slides.transitionEnd(function() {
                                    if (!a && b) { a = !0, b.animating = !1;
                                        for (var e = ["webkitTransitionEnd", "transitionend", "oTransitionEnd", "MSTransitionEnd", "msTransitionEnd"], t = 0; t < e.length; t++) b.wrapper.trigger(e[t]) } }) } } }, flip: { setTranslate: function() {
                            for (var e = 0; e < b.slides.length; e++) {
                                var t = b.slides.eq(e),
                                    r = t[0].progress;
                                b.params.flip.limitRotation && (r = Math.max(Math.min(t[0].progress, 1), -1));
                                var i = t[0].swiperSlideOffset,
                                    s = -180 * r,
                                    n = s,
                                    o = 0,
                                    l = -i,
                                    p = 0;
                                if (b.isHorizontal() ? b.rtl && (n = -n) : (p = l, l = 0, o = -n, n = 0), t[0].style.zIndex = -Math.abs(Math.round(r)) + b.slides.length, b.params.flip.slideShadows) {
                                    var d = b.isHorizontal() ? t.find(".swiper-slide-shadow-left") : t.find(".swiper-slide-shadow-top"),
                                        u = b.isHorizontal() ? t.find(".swiper-slide-shadow-right") : t.find(".swiper-slide-shadow-bottom");
                                    0 === d.length && (d = a('<div class="swiper-slide-shadow-' + (b.isHorizontal() ? "left" : "top") + '"></div>'), t.append(d)), 0 === u.length && (u = a('<div class="swiper-slide-shadow-' + (b.isHorizontal() ? "right" : "bottom") + '"></div>'), t.append(u)), d.length && (d[0].style.opacity = Math.max(-r, 0)), u.length && (u[0].style.opacity = Math.max(r, 0)) }
                                t.transform("translate3d(" + l + "px, " + p + "px, 0px) rotateX(" + o + "deg) rotateY(" + n + "deg)") } }, setTransition: function(e) {
                            if (b.slides.transition(e).find(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").transition(e), b.params.virtualTranslate && 0 !== e) {
                                var t = !1;
                                b.slides.eq(b.activeIndex).transitionEnd(function() {
                                    if (!t && b && a(this).hasClass(b.params.slideActiveClass)) { t = !0, b.animating = !1;
                                        for (var e = ["webkitTransitionEnd", "transitionend", "oTransitionEnd", "MSTransitionEnd", "msTransitionEnd"], r = 0; r < e.length; r++) b.wrapper.trigger(e[r]) } }) } } }, cube: { setTranslate: function() {
                            var e, t = 0;
                            b.params.cube.shadow && (b.isHorizontal() ? (e = b.wrapper.find(".swiper-cube-shadow"), 0 === e.length && (e = a('<div class="swiper-cube-shadow"></div>'), b.wrapper.append(e)), e.css({ height: b.width + "px" })) : (e = b.container.find(".swiper-cube-shadow"), 0 === e.length && (e = a('<div class="swiper-cube-shadow"></div>'), b.container.append(e))));
                            for (var r = 0; r < b.slides.length; r++) {
                                var i = b.slides.eq(r),
                                    s = 90 * r,
                                    n = Math.floor(s / 360);
                                b.rtl && (s = -s, n = Math.floor(-s / 360));
                                var o = Math.max(Math.min(i[0].progress, 1), -1),
                                    l = 0,
                                    p = 0,
                                    d = 0;
                                r % 4 === 0 ? (l = 4 * -n * b.size, d = 0) : (r - 1) % 4 === 0 ? (l = 0, d = 4 * -n * b.size) : (r - 2) % 4 === 0 ? (l = b.size + 4 * n * b.size, d = b.size) : (r - 3) % 4 === 0 && (l = -b.size, d = 3 * b.size + 4 * b.size * n), b.rtl && (l = -l), b.isHorizontal() || (p = l, l = 0);
                                var u = "rotateX(" + (b.isHorizontal() ? 0 : -s) + "deg) rotateY(" + (b.isHorizontal() ? s : 0) + "deg) translate3d(" + l + "px, " + p + "px, " + d + "px)";
                                if (1 >= o && o > -1 && (t = 90 * r + 90 * o, b.rtl && (t = 90 * -r - 90 * o)), i.transform(u), b.params.cube.slideShadows) {
                                    var c = b.isHorizontal() ? i.find(".swiper-slide-shadow-left") : i.find(".swiper-slide-shadow-top"),
                                        m = b.isHorizontal() ? i.find(".swiper-slide-shadow-right") : i.find(".swiper-slide-shadow-bottom");
                                    0 === c.length && (c = a('<div class="swiper-slide-shadow-' + (b.isHorizontal() ? "left" : "top") + '"></div>'), i.append(c)), 0 === m.length && (m = a('<div class="swiper-slide-shadow-' + (b.isHorizontal() ? "right" : "bottom") + '"></div>'), i.append(m)), c.length && (c[0].style.opacity = Math.max(-o, 0)), m.length && (m[0].style.opacity = Math.max(o, 0)) } }
                            if (b.wrapper.css({ "-webkit-transform-origin": "50% 50% -" + b.size / 2 + "px", "-moz-transform-origin": "50% 50% -" + b.size / 2 + "px", "-ms-transform-origin": "50% 50% -" + b.size / 2 + "px", "transform-origin": "50% 50% -" + b.size / 2 + "px" }), b.params.cube.shadow)
                                if (b.isHorizontal()) e.transform("translate3d(0px, " + (b.width / 2 + b.params.cube.shadowOffset) + "px, " + -b.width / 2 + "px) rotateX(90deg) rotateZ(0deg) scale(" + b.params.cube.shadowScale + ")");
                                else {
                                    var h = Math.abs(t) - 90 * Math.floor(Math.abs(t) / 90),
                                        f = 1.5 - (Math.sin(2 * h * Math.PI / 360) / 2 + Math.cos(2 * h * Math.PI / 360) / 2),
                                        g = b.params.cube.shadowScale,
                                        v = b.params.cube.shadowScale / f,
                                        w = b.params.cube.shadowOffset;
                                    e.transform("scale3d(" + g + ", 1, " + v + ") translate3d(0px, " + (b.height / 2 + w) + "px, " + -b.height / 2 / v + "px) rotateX(-90deg)") }
                            var y = b.isSafari || b.isUiWebView ? -b.size / 2 : 0;
                            b.wrapper.transform("translate3d(0px,0," + y + "px) rotateX(" + (b.isHorizontal() ? 0 : t) + "deg) rotateY(" + (b.isHorizontal() ? -t : 0) + "deg)") }, setTransition: function(e) { b.slides.transition(e).find(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").transition(e), b.params.cube.shadow && !b.isHorizontal() && b.container.find(".swiper-cube-shadow").transition(e) } }, coverflow: { setTranslate: function() {
                            for (var e = b.translate, t = b.isHorizontal() ? -e + b.width / 2 : -e + b.height / 2, r = b.isHorizontal() ? b.params.coverflow.rotate : -b.params.coverflow.rotate, i = b.params.coverflow.depth, s = 0, n = b.slides.length; n > s; s++) {
                                var o = b.slides.eq(s),
                                    l = b.slidesSizesGrid[s],
                                    p = o[0].swiperSlideOffset,
                                    d = (t - p - l / 2) / l * b.params.coverflow.modifier,
                                    u = b.isHorizontal() ? r * d : 0,
                                    c = b.isHorizontal() ? 0 : r * d,
                                    m = -i * Math.abs(d),
                                    h = b.isHorizontal() ? 0 : b.params.coverflow.stretch * d,
                                    f = b.isHorizontal() ? b.params.coverflow.stretch * d : 0;
                                Math.abs(f) < .001 && (f = 0), Math.abs(h) < .001 && (h = 0), Math.abs(m) < .001 && (m = 0), Math.abs(u) < .001 && (u = 0), Math.abs(c) < .001 && (c = 0);
                                var g = "translate3d(" + f + "px," + h + "px," + m + "px)  rotateX(" + c + "deg) rotateY(" + u + "deg)";
                                if (o.transform(g), o[0].style.zIndex = -Math.abs(Math.round(d)) + 1, b.params.coverflow.slideShadows) {
                                    var v = b.isHorizontal() ? o.find(".swiper-slide-shadow-left") : o.find(".swiper-slide-shadow-top"),
                                        w = b.isHorizontal() ? o.find(".swiper-slide-shadow-right") : o.find(".swiper-slide-shadow-bottom");
                                    0 === v.length && (v = a('<div class="swiper-slide-shadow-' + (b.isHorizontal() ? "left" : "top") + '"></div>'), o.append(v)), 0 === w.length && (w = a('<div class="swiper-slide-shadow-' + (b.isHorizontal() ? "right" : "bottom") + '"></div>'), o.append(w)), v.length && (v[0].style.opacity = d > 0 ? d : 0), w.length && (w[0].style.opacity = -d > 0 ? -d : 0) } }
                            if (b.browser.ie) {
                                var y = b.wrapper[0].style;
                                y.perspectiveOrigin = t + "px 50%" } }, setTransition: function(e) { b.slides.transition(e).find(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").transition(e) } } }, b.lazy = { initialImageLoaded: !1, loadImageInSlide: function(e, t) {
                        if ("undefined" != typeof e && ("undefined" == typeof t && (t = !0), 0 !== b.slides.length)) {
                            var r = b.slides.eq(e),
                                i = r.find(".swiper-lazy:not(.swiper-lazy-loaded):not(.swiper-lazy-loading)");!r.hasClass("swiper-lazy") || r.hasClass("swiper-lazy-loaded") || r.hasClass("swiper-lazy-loading") || (i = i.add(r[0])), 0 !== i.length && i.each(function() {
                                var e = a(this);
                                e.addClass("swiper-lazy-loading");
                                var i = e.attr("data-background"),
                                    s = e.attr("data-src"),
                                    n = e.attr("data-srcset");
                                b.loadImage(e[0], s || i, n, !1, function() {
                                    if (i ? (e.css("background-image", 'url("' + i + '")'), e.removeAttr("data-background")) : (n && (e.attr("srcset", n), e.removeAttr("data-srcset")), s && (e.attr("src", s), e.removeAttr("data-src"))), e.addClass("swiper-lazy-loaded").removeClass("swiper-lazy-loading"), r.find(".swiper-lazy-preloader, .preloader").remove(), b.params.loop && t) {
                                        var a = r.attr("data-swiper-slide-index");
                                        if (r.hasClass(b.params.slideDuplicateClass)) {
                                            var o = b.wrapper.children('[data-swiper-slide-index="' + a + '"]:not(.' + b.params.slideDuplicateClass + ")");
                                            b.lazy.loadImageInSlide(o.index(), !1) } else {
                                            var l = b.wrapper.children("." + b.params.slideDuplicateClass + '[data-swiper-slide-index="' + a + '"]');
                                            b.lazy.loadImageInSlide(l.index(), !1) } }
                                    b.emit("onLazyImageReady", b, r[0], e[0]) }), b.emit("onLazyImageLoad", b, r[0], e[0]) }) } }, load: function() {
                        var e;
                        if (b.params.watchSlidesVisibility) b.wrapper.children("." + b.params.slideVisibleClass).each(function() { b.lazy.loadImageInSlide(a(this).index()) });
                        else if (b.params.slidesPerView > 1)
                            for (e = b.activeIndex; e < b.activeIndex + b.params.slidesPerView; e++) b.slides[e] && b.lazy.loadImageInSlide(e);
                        else b.lazy.loadImageInSlide(b.activeIndex);
                        if (b.params.lazyLoadingInPrevNext)
                            if (b.params.slidesPerView > 1 || b.params.lazyLoadingInPrevNextAmount && b.params.lazyLoadingInPrevNextAmount > 1) {
                                var t = b.params.lazyLoadingInPrevNextAmount,
                                    r = b.params.slidesPerView,
                                    i = Math.min(b.activeIndex + r + Math.max(t, r), b.slides.length),
                                    s = Math.max(b.activeIndex - Math.max(r, t), 0);
                                for (e = b.activeIndex + b.params.slidesPerView; i > e; e++) b.slides[e] && b.lazy.loadImageInSlide(e);
                                for (e = s; e < b.activeIndex; e++) b.slides[e] && b.lazy.loadImageInSlide(e) } else {
                                var n = b.wrapper.children("." + b.params.slideNextClass);
                                n.length > 0 && b.lazy.loadImageInSlide(n.index());
                                var o = b.wrapper.children("." + b.params.slidePrevClass);
                                o.length > 0 && b.lazy.loadImageInSlide(o.index()) } }, onTransitionStart: function() { b.params.lazyLoading && (b.params.lazyLoadingOnTransitionStart || !b.params.lazyLoadingOnTransitionStart && !b.lazy.initialImageLoaded) && b.lazy.load() }, onTransitionEnd: function() { b.params.lazyLoading && !b.params.lazyLoadingOnTransitionStart && b.lazy.load() } }, b.scrollbar = { isTouched: !1, setDragPosition: function(e) {
                        var a = b.scrollbar,
                            t = b.isHorizontal() ? "touchstart" === e.type || "touchmove" === e.type ? e.targetTouches[0].pageX : e.pageX || e.clientX : "touchstart" === e.type || "touchmove" === e.type ? e.targetTouches[0].pageY : e.pageY || e.clientY,
                            r = t - a.track.offset()[b.isHorizontal() ? "left" : "top"] - a.dragSize / 2,
                            i = -b.minTranslate() * a.moveDivider,
                            s = -b.maxTranslate() * a.moveDivider;
                        i > r ? r = i : r > s && (r = s), r = -r / a.moveDivider, b.updateProgress(r), b.setWrapperTranslate(r, !0) }, dragStart: function(e) {
                        var a = b.scrollbar;
                        a.isTouched = !0, e.preventDefault(), e.stopPropagation(), a.setDragPosition(e), clearTimeout(a.dragTimeout), a.track.transition(0), b.params.scrollbarHide && a.track.css("opacity", 1), b.wrapper.transition(100), a.drag.transition(100), b.emit("onScrollbarDragStart", b) }, dragMove: function(e) {
                        var a = b.scrollbar;
                        a.isTouched && (e.preventDefault ? e.preventDefault() : e.returnValue = !1, a.setDragPosition(e), b.wrapper.transition(0), a.track.transition(0), a.drag.transition(0), b.emit("onScrollbarDragMove", b)) }, dragEnd: function(e) {
                        var a = b.scrollbar;
                        a.isTouched && (a.isTouched = !1, b.params.scrollbarHide && (clearTimeout(a.dragTimeout), a.dragTimeout = setTimeout(function() { a.track.css("opacity", 0), a.track.transition(400) }, 1e3)), b.emit("onScrollbarDragEnd", b), b.params.scrollbarSnapOnRelease && b.slideReset()) }, enableDraggable: function() {
                        var e = b.scrollbar,
                            t = b.support.touch ? e.track : document;
                        a(e.track).on(b.touchEvents.start, e.dragStart), a(t).on(b.touchEvents.move, e.dragMove), a(t).on(b.touchEvents.end, e.dragEnd) }, disableDraggable: function() {
                        var e = b.scrollbar,
                            t = b.support.touch ? e.track : document;
                        a(e.track).off(b.touchEvents.start, e.dragStart), a(t).off(b.touchEvents.move, e.dragMove), a(t).off(b.touchEvents.end, e.dragEnd) }, set: function() {
                        if (b.params.scrollbar) {
                            var e = b.scrollbar;
                            e.track = a(b.params.scrollbar), b.params.uniqueNavElements && "string" == typeof b.params.scrollbar && e.track.length > 1 && 1 === b.container.find(b.params.scrollbar).length && (e.track = b.container.find(b.params.scrollbar)), e.drag = e.track.find(".swiper-scrollbar-drag"), 0 === e.drag.length && (e.drag = a('<div class="swiper-scrollbar-drag"></div>'), e.track.append(e.drag)), e.drag[0].style.width = "", e.drag[0].style.height = "", e.trackSize = b.isHorizontal() ? e.track[0].offsetWidth : e.track[0].offsetHeight, e.divider = b.size / b.virtualSize, e.moveDivider = e.divider * (e.trackSize / b.size), e.dragSize = e.trackSize * e.divider, b.isHorizontal() ? e.drag[0].style.width = e.dragSize + "px" : e.drag[0].style.height = e.dragSize + "px", e.divider >= 1 ? e.track[0].style.display = "none" : e.track[0].style.display = "", b.params.scrollbarHide && (e.track[0].style.opacity = 0) } }, setTranslate: function() {
                        if (b.params.scrollbar) {
                            var e, a = b.scrollbar,
                                t = (b.translate || 0, a.dragSize);
                            e = (a.trackSize - a.dragSize) * b.progress, b.rtl && b.isHorizontal() ? (e = -e, e > 0 ? (t = a.dragSize - e, e = 0) : -e + a.dragSize > a.trackSize && (t = a.trackSize + e)) : 0 > e ? (t = a.dragSize + e, e = 0) : e + a.dragSize > a.trackSize && (t = a.trackSize - e), b.isHorizontal() ? (b.support.transforms3d ? a.drag.transform("translate3d(" + e + "px, 0, 0)") : a.drag.transform("translateX(" + e + "px)"), a.drag[0].style.width = t + "px") : (b.support.transforms3d ? a.drag.transform("translate3d(0px, " + e + "px, 0)") : a.drag.transform("translateY(" + e + "px)"), a.drag[0].style.height = t + "px"), b.params.scrollbarHide && (clearTimeout(a.timeout), a.track[0].style.opacity = 1, a.timeout = setTimeout(function() { a.track[0].style.opacity = 0, a.track.transition(400) }, 1e3)) } }, setTransition: function(e) { b.params.scrollbar && b.scrollbar.drag.transition(e) } }, b.controller = { LinearSpline: function(e, a) { this.x = e, this.y = a, this.lastIndex = e.length - 1;
                        var t, r;
                        this.x.length;
                        this.interpolate = function(e) {
                            return e ? (r = i(this.x, e), t = r - 1, (e - this.x[t]) * (this.y[r] - this.y[t]) / (this.x[r] - this.x[t]) + this.y[t]) : 0 };
                        var i = function() {
                            var e, a, t;
                            return function(r, i) {
                                for (a = -1, e = r.length; e - a > 1;) r[t = e + a >> 1] <= i ? a = t : e = t;
                                return e } }() }, getInterpolateFunction: function(e) { b.controller.spline || (b.controller.spline = b.params.loop ? new b.controller.LinearSpline(b.slidesGrid, e.slidesGrid) : new b.controller.LinearSpline(b.snapGrid, e.snapGrid)) }, setTranslate: function(e, a) {
                        function r(a) { e = a.rtl && "horizontal" === a.params.direction ? -b.translate : b.translate, "slide" === b.params.controlBy && (b.controller.getInterpolateFunction(a), s = -b.controller.spline.interpolate(-e)), s && "container" !== b.params.controlBy || (i = (a.maxTranslate() - a.minTranslate()) / (b.maxTranslate() - b.minTranslate()), s = (e - b.minTranslate()) * i + a.minTranslate()), b.params.controlInverse && (s = a.maxTranslate() - s), a.updateProgress(s), a.setWrapperTranslate(s, !1, b), a.updateActiveIndex() }
                        var i, s, n = b.params.control;
                        if (b.isArray(n))
                            for (var o = 0; o < n.length; o++) n[o] !== a && n[o] instanceof t && r(n[o]);
                        else n instanceof t && a !== n && r(n) }, setTransition: function(e, a) {
                        function r(a) { a.setWrapperTransition(e, b), 0 !== e && (a.onTransitionStart(), a.wrapper.transitionEnd(function() { s && (a.params.loop && "slide" === b.params.controlBy && a.fixLoop(), a.onTransitionEnd()) })) }
                        var i, s = b.params.control;
                        if (b.isArray(s))
                            for (i = 0; i < s.length; i++) s[i] !== a && s[i] instanceof t && r(s[i]);
                        else s instanceof t && a !== s && r(s) } }, b.hashnav = { init: function() {
                        if (b.params.hashnav) { b.hashnav.initialized = !0;
                            var e = document.location.hash.replace("#", "");
                            if (e)
                                for (var a = 0, t = 0, r = b.slides.length; r > t; t++) {
                                    var i = b.slides.eq(t),
                                        s = i.attr("data-hash");
                                    if (s === e && !i.hasClass(b.params.slideDuplicateClass)) {
                                        var n = i.index();
                                        b.slideTo(n, a, b.params.runCallbacksOnInit, !0) } } } }, setHash: function() { b.hashnav.initialized && b.params.hashnav && (document.location.hash = b.slides.eq(b.activeIndex).attr("data-hash") || "") } }, b.disableKeyboardControl = function() { b.params.keyboardControl = !1, a(document).off("keydown", p) }, b.enableKeyboardControl = function() { b.params.keyboardControl = !0, a(document).on("keydown", p) }, b.mousewheel = { event: !1, lastScrollTime: (new window.Date).getTime() }, b.params.mousewheelControl) {
                try { new window.WheelEvent("wheel"), b.mousewheel.event = "wheel" } catch (N) {
                    (window.WheelEvent || b.container[0] && "wheel" in b.container[0]) && (b.mousewheel.event = "wheel") }!b.mousewheel.event && window.WheelEvent, b.mousewheel.event || void 0 === document.onmousewheel || (b.mousewheel.event = "mousewheel"), b.mousewheel.event || (b.mousewheel.event = "DOMMouseScroll") }
            b.disableMousewheelControl = function() {
                return b.mousewheel.event ? (b.container.off(b.mousewheel.event, d), !0) : !1 }, b.enableMousewheelControl = function() {
                return b.mousewheel.event ? (b.container.on(b.mousewheel.event, d), !0) : !1 }, b.parallax = { setTranslate: function() { b.container.children("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]").each(function() { u(this, b.progress) }), b.slides.each(function() {
                        var e = a(this);
                        e.find("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]").each(function() {
                            var a = Math.min(Math.max(e[0].progress, -1), 1);
                            u(this, a) }) }) }, setTransition: function(e) { "undefined" == typeof e && (e = b.params.speed), b.container.find("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]").each(function() {
                        var t = a(this),
                            r = parseInt(t.attr("data-swiper-parallax-duration"), 10) || e;
                        0 === e && (r = 0), t.transition(r) }) } }, b._plugins = [];
            for (var R in b.plugins) {
                var W = b.plugins[R](b, b.params[R]);
                W && b._plugins.push(W) }
            return b.callPlugins = function(e) {
                for (var a = 0; a < b._plugins.length; a++) e in b._plugins[a] && b._plugins[a][e](arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]) }, b.emitterEventListeners = {}, b.emit = function(e) { b.params[e] && b.params[e](arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
                var a;
                if (b.emitterEventListeners[e])
                    for (a = 0; a < b.emitterEventListeners[e].length; a++) b.emitterEventListeners[e][a](arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
                b.callPlugins && b.callPlugins(e, arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]) }, b.on = function(e, a) {
                return e = c(e), b.emitterEventListeners[e] || (b.emitterEventListeners[e] = []), b.emitterEventListeners[e].push(a), b }, b.off = function(e, a) {
                var t;
                if (e = c(e), "undefined" == typeof a) return b.emitterEventListeners[e] = [], b;
                if (b.emitterEventListeners[e] && 0 !== b.emitterEventListeners[e].length) {
                    for (t = 0; t < b.emitterEventListeners[e].length; t++) b.emitterEventListeners[e][t] === a && b.emitterEventListeners[e].splice(t, 1);
                    return b } }, b.once = function(e, a) { e = c(e);
                var t = function() { a(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]), b.off(e, t) };
                return b.on(e, t), b }, b.a11y = { makeFocusable: function(e) {
                    return e.attr("tabIndex", "0"), e }, addRole: function(e, a) {
                    return e.attr("role", a), e }, addLabel: function(e, a) {
                    return e.attr("aria-label", a), e }, disable: function(e) {
                    return e.attr("aria-disabled", !0), e }, enable: function(e) {
                    return e.attr("aria-disabled", !1), e }, onEnterKey: function(e) { 13 === e.keyCode && (a(e.target).is(b.params.nextButton) ? (b.onClickNext(e), b.isEnd ? b.a11y.notify(b.params.lastSlideMessage) : b.a11y.notify(b.params.nextSlideMessage)) : a(e.target).is(b.params.prevButton) && (b.onClickPrev(e), b.isBeginning ? b.a11y.notify(b.params.firstSlideMessage) : b.a11y.notify(b.params.prevSlideMessage)), a(e.target).is("." + b.params.bulletClass) && a(e.target)[0].click()) }, liveRegion: a('<span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span>'), notify: function(e) {
                    var a = b.a11y.liveRegion;
                    0 !== a.length && (a.html(""), a.html(e)) }, init: function() { b.params.nextButton && b.nextButton && b.nextButton.length > 0 && (b.a11y.makeFocusable(b.nextButton), b.a11y.addRole(b.nextButton, "button"), b.a11y.addLabel(b.nextButton, b.params.nextSlideMessage)), b.params.prevButton && b.prevButton && b.prevButton.length > 0 && (b.a11y.makeFocusable(b.prevButton), b.a11y.addRole(b.prevButton, "button"), b.a11y.addLabel(b.prevButton, b.params.prevSlideMessage)), a(b.container).append(b.a11y.liveRegion) }, initPagination: function() { b.params.pagination && b.params.paginationClickable && b.bullets && b.bullets.length && b.bullets.each(function() {
                        var e = a(this);
                        b.a11y.makeFocusable(e), b.a11y.addRole(e, "button"), b.a11y.addLabel(e, b.params.paginationBulletMessage.replace(/{{index}}/, e.index() + 1)) }) }, destroy: function() { b.a11y.liveRegion && b.a11y.liveRegion.length > 0 && b.a11y.liveRegion.remove() } }, b.init = function() {
                b.params.loop && b.createLoop(), b.updateContainerSize(), b.updateSlidesSize(), b.updatePagination(), b.params.scrollbar && b.scrollbar && (b.scrollbar.set(), b.params.scrollbarDraggable && b.scrollbar.enableDraggable()), "slide" !== b.params.effect && b.effects[b.params.effect] && (b.params.loop || b.updateProgress(), b.effects[b.params.effect].setTranslate()), b.params.loop ? b.slideTo(b.params.initialSlide + b.loopedSlides, 0, b.params.runCallbacksOnInit) : (b.slideTo(b.params.initialSlide, 0, b.params.runCallbacksOnInit), 0 === b.params.initialSlide && (b.parallax && b.params.parallax && b.parallax.setTranslate(), b.lazy && b.params.lazyLoading && (b.lazy.load(), b.lazy.initialImageLoaded = !0))), b.attachEvents(), b.params.observer && b.support.observer && b.initObservers(), b.params.preloadImages && !b.params.lazyLoading && b.preloadImages(), b.params.autoplay && b.startAutoplay(), b.params.keyboardControl && b.enableKeyboardControl && b.enableKeyboardControl(), b.params.mousewheelControl && b.enableMousewheelControl && b.enableMousewheelControl(),
                    b.params.hashnav && b.hashnav && b.hashnav.init(), b.params.a11y && b.a11y && b.a11y.init(), b.emit("onInit", b)
            }, b.cleanupStyles = function() { b.container.removeClass(b.classNames.join(" ")).removeAttr("style"), b.wrapper.removeAttr("style"), b.slides && b.slides.length && b.slides.removeClass([b.params.slideVisibleClass, b.params.slideActiveClass, b.params.slideNextClass, b.params.slidePrevClass].join(" ")).removeAttr("style").removeAttr("data-swiper-column").removeAttr("data-swiper-row"), b.paginationContainer && b.paginationContainer.length && b.paginationContainer.removeClass(b.params.paginationHiddenClass), b.bullets && b.bullets.length && b.bullets.removeClass(b.params.bulletActiveClass), b.params.prevButton && a(b.params.prevButton).removeClass(b.params.buttonDisabledClass), b.params.nextButton && a(b.params.nextButton).removeClass(b.params.buttonDisabledClass), b.params.scrollbar && b.scrollbar && (b.scrollbar.track && b.scrollbar.track.length && b.scrollbar.track.removeAttr("style"), b.scrollbar.drag && b.scrollbar.drag.length && b.scrollbar.drag.removeAttr("style")) }, b.destroy = function(e, a) { b.detachEvents(), b.stopAutoplay(), b.params.scrollbar && b.scrollbar && b.params.scrollbarDraggable && b.scrollbar.disableDraggable(), b.params.loop && b.destroyLoop(), a && b.cleanupStyles(), b.disconnectObservers(), b.params.keyboardControl && b.disableKeyboardControl && b.disableKeyboardControl(), b.params.mousewheelControl && b.disableMousewheelControl && b.disableMousewheelControl(), b.params.a11y && b.a11y && b.a11y.destroy(), b.emit("onDestroy"), e !== !1 && (b = null) }, b.init(), b
        }
    };
    t.prototype = { isSafari: function() {
            var e = navigator.userAgent.toLowerCase();
            return e.indexOf("safari") >= 0 && e.indexOf("chrome") < 0 && e.indexOf("android") < 0 }(), isUiWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent), isArray: function(e) {
            return "[object Array]" === Object.prototype.toString.apply(e) }, browser: { ie: window.navigator.pointerEnabled || window.navigator.msPointerEnabled, ieTouch: window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints > 1 || window.navigator.pointerEnabled && window.navigator.maxTouchPoints > 1 }, device: function() {
            var e = navigator.userAgent,
                a = e.match(/(Android);?[\s\/]+([\d.]+)?/),
                t = e.match(/(iPad).*OS\s([\d_]+)/),
                r = e.match(/(iPod)(.*OS\s([\d_]+))?/),
                i = !t && e.match(/(iPhone\sOS)\s([\d_]+)/);
            return { ios: t || i || r, android: a } }(), support: { touch: window.Modernizr && Modernizr.touch === !0 || function() {
                return !!("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch) }(), transforms3d: window.Modernizr && Modernizr.csstransforms3d === !0 || function() {
                var e = document.createElement("div").style;
                return "webkitPerspective" in e || "MozPerspective" in e || "OPerspective" in e || "MsPerspective" in e || "perspective" in e }(), flexbox: function() {
                for (var e = document.createElement("div").style, a = "alignItems webkitAlignItems webkitBoxAlign msFlexAlign mozBoxAlign webkitFlexDirection msFlexDirection mozBoxDirection mozBoxOrient webkitBoxDirection webkitBoxOrient".split(" "), t = 0; t < a.length; t++)
                    if (a[t] in e) return !0 }(), observer: function() {
                return "MutationObserver" in window || "WebkitMutationObserver" in window }() }, plugins: {} };
    for (var r = (function() {
            var e = function(e) {
                    var a = this,
                        t = 0;
                    for (t = 0; t < e.length; t++) a[t] = e[t];
                    return a.length = e.length, this },
                a = function(a, t) {
                    var r = [],
                        i = 0;
                    if (a && !t && a instanceof e) return a;
                    if (a)
                        if ("string" == typeof a) {
                            var s, n, o = a.trim();
                            if (o.indexOf("<") >= 0 && o.indexOf(">") >= 0) {
                                var l = "div";
                                for (0 === o.indexOf("<li") && (l = "ul"), 0 === o.indexOf("<tr") && (l = "tbody"), (0 === o.indexOf("<td") || 0 === o.indexOf("<th")) && (l = "tr"), 0 === o.indexOf("<tbody") && (l = "table"), 0 === o.indexOf("<option") && (l = "select"), n = document.createElement(l), n.innerHTML = a, i = 0; i < n.childNodes.length; i++) r.push(n.childNodes[i]) } else
                                for (s = t || "#" !== a[0] || a.match(/[ .<>:~]/) ? (t || document).querySelectorAll(a) : [document.getElementById(a.split("#")[1])], i = 0; i < s.length; i++) s[i] && r.push(s[i]) } else if (a.nodeType || a === window || a === document) r.push(a);
                    else if (a.length > 0 && a[0].nodeType)
                        for (i = 0; i < a.length; i++) r.push(a[i]);
                    return new e(r) };
            return e.prototype = { addClass: function(e) {
                    if ("undefined" == typeof e) return this;
                    for (var a = e.split(" "), t = 0; t < a.length; t++)
                        for (var r = 0; r < this.length; r++) this[r].classList.add(a[t]);
                    return this }, removeClass: function(e) {
                    for (var a = e.split(" "), t = 0; t < a.length; t++)
                        for (var r = 0; r < this.length; r++) this[r].classList.remove(a[t]);
                    return this }, hasClass: function(e) {
                    return this[0] ? this[0].classList.contains(e) : !1 }, toggleClass: function(e) {
                    for (var a = e.split(" "), t = 0; t < a.length; t++)
                        for (var r = 0; r < this.length; r++) this[r].classList.toggle(a[t]);
                    return this }, attr: function(e, a) {
                    if (1 === arguments.length && "string" == typeof e) return this[0] ? this[0].getAttribute(e) : void 0;
                    for (var t = 0; t < this.length; t++)
                        if (2 === arguments.length) this[t].setAttribute(e, a);
                        else
                            for (var r in e) this[t][r] = e[r], this[t].setAttribute(r, e[r]);
                    return this }, removeAttr: function(e) {
                    for (var a = 0; a < this.length; a++) this[a].removeAttribute(e);
                    return this }, data: function(e, a) {
                    if ("undefined" != typeof a) {
                        for (var t = 0; t < this.length; t++) {
                            var r = this[t];
                            r.dom7ElementDataStorage || (r.dom7ElementDataStorage = {}), r.dom7ElementDataStorage[e] = a }
                        return this }
                    if (this[0]) {
                        var i = this[0].getAttribute("data-" + e);
                        return i ? i : this[0].dom7ElementDataStorage && e in this[0].dom7ElementDataStorage ? this[0].dom7ElementDataStorage[e] : void 0 } }, transform: function(e) {
                    for (var a = 0; a < this.length; a++) {
                        var t = this[a].style;
                        t.webkitTransform = t.MsTransform = t.msTransform = t.MozTransform = t.OTransform = t.transform = e }
                    return this }, transition: function(e) { "string" != typeof e && (e += "ms");
                    for (var a = 0; a < this.length; a++) {
                        var t = this[a].style;
                        t.webkitTransitionDuration = t.MsTransitionDuration = t.msTransitionDuration = t.MozTransitionDuration = t.OTransitionDuration = t.transitionDuration = e }
                    return this }, on: function(e, t, r, i) {
                    function s(e) {
                        var i = e.target;
                        if (a(i).is(t)) r.call(i, e);
                        else
                            for (var s = a(i).parents(), n = 0; n < s.length; n++) a(s[n]).is(t) && r.call(s[n], e) }
                    var n, o, l = e.split(" ");
                    for (n = 0; n < this.length; n++)
                        if ("function" == typeof t || t === !1)
                            for ("function" == typeof t && (r = arguments[1], i = arguments[2] || !1), o = 0; o < l.length; o++) this[n].addEventListener(l[o], r, i);
                        else
                            for (o = 0; o < l.length; o++) this[n].dom7LiveListeners || (this[n].dom7LiveListeners = []), this[n].dom7LiveListeners.push({ listener: r, liveListener: s }), this[n].addEventListener(l[o], s, i);
                    return this }, off: function(e, a, t, r) {
                    for (var i = e.split(" "), s = 0; s < i.length; s++)
                        for (var n = 0; n < this.length; n++)
                            if ("function" == typeof a || a === !1) "function" == typeof a && (t = arguments[1], r = arguments[2] || !1), this[n].removeEventListener(i[s], t, r);
                            else if (this[n].dom7LiveListeners)
                        for (var o = 0; o < this[n].dom7LiveListeners.length; o++) this[n].dom7LiveListeners[o].listener === t && this[n].removeEventListener(i[s], this[n].dom7LiveListeners[o].liveListener, r);
                    return this }, once: function(e, a, t, r) {
                    function i(n) { t(n), s.off(e, a, i, r) }
                    var s = this; "function" == typeof a && (a = !1, t = arguments[1], r = arguments[2]), s.on(e, a, i, r) }, trigger: function(e, a) {
                    for (var t = 0; t < this.length; t++) {
                        var r;
                        try { r = new window.CustomEvent(e, { detail: a, bubbles: !0, cancelable: !0 }) } catch (i) { r = document.createEvent("Event"), r.initEvent(e, !0, !0), r.detail = a }
                        this[t].dispatchEvent(r) }
                    return this }, transitionEnd: function(e) {
                    function a(s) {
                        if (s.target === this)
                            for (e.call(this, s), t = 0; t < r.length; t++) i.off(r[t], a) }
                    var t, r = ["webkitTransitionEnd", "transitionend", "oTransitionEnd", "MSTransitionEnd", "msTransitionEnd"],
                        i = this;
                    if (e)
                        for (t = 0; t < r.length; t++) i.on(r[t], a);
                    return this }, width: function() {
                    return this[0] === window ? window.innerWidth : this.length > 0 ? parseFloat(this.css("width")) : null }, outerWidth: function(e) {
                    return this.length > 0 ? e ? this[0].offsetWidth + parseFloat(this.css("margin-right")) + parseFloat(this.css("margin-left")) : this[0].offsetWidth : null }, height: function() {
                    return this[0] === window ? window.innerHeight : this.length > 0 ? parseFloat(this.css("height")) : null }, outerHeight: function(e) {
                    return this.length > 0 ? e ? this[0].offsetHeight + parseFloat(this.css("margin-top")) + parseFloat(this.css("margin-bottom")) : this[0].offsetHeight : null }, offset: function() {
                    if (this.length > 0) {
                        var e = this[0],
                            a = e.getBoundingClientRect(),
                            t = document.body,
                            r = e.clientTop || t.clientTop || 0,
                            i = e.clientLeft || t.clientLeft || 0,
                            s = window.pageYOffset || e.scrollTop,
                            n = window.pageXOffset || e.scrollLeft;
                        return { top: a.top + s - r, left: a.left + n - i } }
                    return null }, css: function(e, a) {
                    var t;
                    if (1 === arguments.length) {
                        if ("string" != typeof e) {
                            for (t = 0; t < this.length; t++)
                                for (var r in e) this[t].style[r] = e[r];
                            return this }
                        if (this[0]) return window.getComputedStyle(this[0], null).getPropertyValue(e) }
                    if (2 === arguments.length && "string" == typeof e) {
                        for (t = 0; t < this.length; t++) this[t].style[e] = a;
                        return this }
                    return this }, each: function(e) {
                    for (var a = 0; a < this.length; a++) e.call(this[a], a, this[a]);
                    return this }, html: function(e) {
                    if ("undefined" == typeof e) return this[0] ? this[0].innerHTML : void 0;
                    for (var a = 0; a < this.length; a++) this[a].innerHTML = e;
                    return this }, text: function(e) {
                    if ("undefined" == typeof e) return this[0] ? this[0].textContent.trim() : null;
                    for (var a = 0; a < this.length; a++) this[a].textContent = e;
                    return this }, is: function(t) {
                    if (!this[0]) return !1;
                    var r, i;
                    if ("string" == typeof t) {
                        var s = this[0];
                        if (s === document) return t === document;
                        if (s === window) return t === window;
                        if (s.matches) return s.matches(t);
                        if (s.webkitMatchesSelector) return s.webkitMatchesSelector(t);
                        if (s.mozMatchesSelector) return s.mozMatchesSelector(t);
                        if (s.msMatchesSelector) return s.msMatchesSelector(t);
                        for (r = a(t), i = 0; i < r.length; i++)
                            if (r[i] === this[0]) return !0;
                        return !1 }
                    if (t === document) return this[0] === document;
                    if (t === window) return this[0] === window;
                    if (t.nodeType || t instanceof e) {
                        for (r = t.nodeType ? [t] : t, i = 0; i < r.length; i++)
                            if (r[i] === this[0]) return !0;
                        return !1 }
                    return !1 }, index: function() {
                    if (this[0]) {
                        for (var e = this[0], a = 0; null !== (e = e.previousSibling);) 1 === e.nodeType && a++;
                        return a } }, eq: function(a) {
                    if ("undefined" == typeof a) return this;
                    var t, r = this.length;
                    return a > r - 1 ? new e([]) : 0 > a ? (t = r + a, new e(0 > t ? [] : [this[t]])) : new e([this[a]]) }, append: function(a) {
                    var t, r;
                    for (t = 0; t < this.length; t++)
                        if ("string" == typeof a) {
                            var i = document.createElement("div");
                            for (i.innerHTML = a; i.firstChild;) this[t].appendChild(i.firstChild) } else if (a instanceof e)
                        for (r = 0; r < a.length; r++) this[t].appendChild(a[r]);
                    else this[t].appendChild(a);
                    return this }, prepend: function(a) {
                    var t, r;
                    for (t = 0; t < this.length; t++)
                        if ("string" == typeof a) {
                            var i = document.createElement("div");
                            for (i.innerHTML = a, r = i.childNodes.length - 1; r >= 0; r--) this[t].insertBefore(i.childNodes[r], this[t].childNodes[0]) } else if (a instanceof e)
                        for (r = 0; r < a.length; r++) this[t].insertBefore(a[r], this[t].childNodes[0]);
                    else this[t].insertBefore(a, this[t].childNodes[0]);
                    return this }, insertBefore: function(e) {
                    for (var t = a(e), r = 0; r < this.length; r++)
                        if (1 === t.length) t[0].parentNode.insertBefore(this[r], t[0]);
                        else if (t.length > 1)
                        for (var i = 0; i < t.length; i++) t[i].parentNode.insertBefore(this[r].cloneNode(!0), t[i]) }, insertAfter: function(e) {
                    for (var t = a(e), r = 0; r < this.length; r++)
                        if (1 === t.length) t[0].parentNode.insertBefore(this[r], t[0].nextSibling);
                        else if (t.length > 1)
                        for (var i = 0; i < t.length; i++) t[i].parentNode.insertBefore(this[r].cloneNode(!0), t[i].nextSibling) }, next: function(t) {
                    return new e(this.length > 0 ? t ? this[0].nextElementSibling && a(this[0].nextElementSibling).is(t) ? [this[0].nextElementSibling] : [] : this[0].nextElementSibling ? [this[0].nextElementSibling] : [] : []) }, nextAll: function(t) {
                    var r = [],
                        i = this[0];
                    if (!i) return new e([]);
                    for (; i.nextElementSibling;) {
                        var s = i.nextElementSibling;
                        t ? a(s).is(t) && r.push(s) : r.push(s), i = s }
                    return new e(r) }, prev: function(t) {
                    return new e(this.length > 0 ? t ? this[0].previousElementSibling && a(this[0].previousElementSibling).is(t) ? [this[0].previousElementSibling] : [] : this[0].previousElementSibling ? [this[0].previousElementSibling] : [] : []) }, prevAll: function(t) {
                    var r = [],
                        i = this[0];
                    if (!i) return new e([]);
                    for (; i.previousElementSibling;) {
                        var s = i.previousElementSibling;
                        t ? a(s).is(t) && r.push(s) : r.push(s), i = s }
                    return new e(r) }, parent: function(e) {
                    for (var t = [], r = 0; r < this.length; r++) e ? a(this[r].parentNode).is(e) && t.push(this[r].parentNode) : t.push(this[r].parentNode);
                    return a(a.unique(t)) }, parents: function(e) {
                    for (var t = [], r = 0; r < this.length; r++)
                        for (var i = this[r].parentNode; i;) e ? a(i).is(e) && t.push(i) : t.push(i), i = i.parentNode;
                    return a(a.unique(t)) }, find: function(a) {
                    for (var t = [], r = 0; r < this.length; r++)
                        for (var i = this[r].querySelectorAll(a), s = 0; s < i.length; s++) t.push(i[s]);
                    return new e(t) }, children: function(t) {
                    for (var r = [], i = 0; i < this.length; i++)
                        for (var s = this[i].childNodes, n = 0; n < s.length; n++) t ? 1 === s[n].nodeType && a(s[n]).is(t) && r.push(s[n]) : 1 === s[n].nodeType && r.push(s[n]);
                    return new e(a.unique(r)) }, remove: function() {
                    for (var e = 0; e < this.length; e++) this[e].parentNode && this[e].parentNode.removeChild(this[e]);
                    return this }, add: function() {
                    var e, t, r = this;
                    for (e = 0; e < arguments.length; e++) {
                        var i = a(arguments[e]);
                        for (t = 0; t < i.length; t++) r[r.length] = i[t], r.length++ }
                    return r } }, a.fn = e.prototype, a.unique = function(e) {
                for (var a = [], t = 0; t < e.length; t++) - 1 === a.indexOf(e[t]) && a.push(e[t]);
                return a }, a }()), i = ["jQuery", "Zepto", "Dom7"], s = 0; s < i.length; s++) window[i[s]] && e(window[i[s]]);
    var n;
    n = "undefined" == typeof r ? window.Dom7 || window.Zepto || window.jQuery : r, n && ("transitionEnd" in n.fn || (n.fn.transitionEnd = function(e) {
        function a(s) {
            if (s.target === this)
                for (e.call(this, s), t = 0; t < r.length; t++) i.off(r[t], a) }
        var t, r = ["webkitTransitionEnd", "transitionend", "oTransitionEnd", "MSTransitionEnd", "msTransitionEnd"],
            i = this;
        if (e)
            for (t = 0; t < r.length; t++) i.on(r[t], a);
        return this }), "transform" in n.fn || (n.fn.transform = function(e) {
        for (var a = 0; a < this.length; a++) {
            var t = this[a].style;
            t.webkitTransform = t.MsTransform = t.msTransform = t.MozTransform = t.OTransform = t.transform = e }
        return this }), "transition" in n.fn || (n.fn.transition = function(e) { "string" != typeof e && (e += "ms");
        for (var a = 0; a < this.length; a++) {
            var t = this[a].style;
            t.webkitTransitionDuration = t.MsTransitionDuration = t.msTransitionDuration = t.MozTransitionDuration = t.OTransitionDuration = t.transitionDuration = e }
        return this })), window.Swiper = t
}(), "undefined" != typeof module ? module.exports = window.Swiper : "function" == typeof define && define.amd && define([], function() { "use strict";
    return window.Swiper });
//# sourceMappingURL=maps/swiper.min.js.map


// bootstrap-datepicker.js


//! moment.js
//! version : 2.9.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {
    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = '2.9.0',
        // the global-scope this is NOT the global object in Node.js
        globalScope = (typeof global !== 'undefined' && (typeof window === 'undefined' || window === global.window)) ? global : this,
        oldGlobalMoment,
        round = Math.round,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for locale config files
        locales = {},

        // extra moment internal properties (plugins register props here)
        momentProperties = [],

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|x|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenOffsetMs = /[\+\-]?\d+/, // 1234567890123
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker '+10:00' > ['10', '00'] or '-1530' > ['-', '15', '30']
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // default relative time thresholds
        relativeTimeThresholds = {
            s: 45,  // seconds to minute
            m: 45,  // minutes to hour
            h: 22,  // hours to day
            d: 26,  // days to month
            M: 11   // months to year
        },

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.localeData().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.localeData().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.localeData().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.localeData().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.localeData().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {

                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            x    : function () {
                return this.valueOf();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        deprecations = {},

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'],

        updateInProgress = false;

    // Pick the first defined of two or three arguments. dfl comes from
    // default.
    function dfl(a, b, c) {
        switch (arguments.length) {
            case 2: return a != null ? a : b;
            case 3: return a != null ? a : b != null ? b : c;
            default: throw new Error('Implement me');
        }
    }

    function hasOwnProp(a, b) {
        return hasOwnProperty.call(a, b);
    }

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function printMsg(msg) {
        if (moment.suppressDeprecationWarnings === false &&
                typeof console !== 'undefined' && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        return extend(function () {
            if (firstTime) {
                printMsg(msg);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            printMsg(msg);
            deprecations[name] = true;
        }
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.localeData().ordinal(func.call(this, a), period);
        };
    }

    function monthDiff(a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        return -(wholeMonthDiff + adjust);
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    function meridiemFixWrap(locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // thie is not supposed to happen
            return hour;
        }
    }

    /************************************
        Constructors
    ************************************/

    function Locale() {
    }

    // Moment prototype object
    function Moment(config, skipOverflow) {
        if (skipOverflow !== false) {
            checkOverflow(config);
        }
        copyConfig(this, config);
        this._d = new Date(+config._d);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            moment.updateOffset(this);
            updateInProgress = false;
        }
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = moment.localeData();

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function copyConfig(to, from) {
        var i, prop, val;

        if (typeof from._isAMomentObject !== 'undefined') {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (typeof from._i !== 'undefined') {
            to._i = from._i;
        }
        if (typeof from._f !== 'undefined') {
            to._f = from._f;
        }
        if (typeof from._l !== 'undefined') {
            to._l = from._l;
        }
        if (typeof from._strict !== 'undefined') {
            to._strict = from._strict;
        }
        if (typeof from._tzm !== 'undefined') {
            to._tzm = from._tzm;
        }
        if (typeof from._isUTC !== 'undefined') {
            to._isUTC = from._isUTC;
        }
        if (typeof from._offset !== 'undefined') {
            to._offset = from._offset;
        }
        if (typeof from._pf !== 'undefined') {
            to._pf = from._pf;
        }
        if (typeof from._locale !== 'undefined') {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (typeof val !== 'undefined') {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        other = makeAs(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = moment.duration(val, period);
            addOrSubtractDurationFromMoment(this, dur, direction);
            return this;
        };
    }

    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return Object.prototype.toString.call(input) === '[object Date]' ||
            input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment._locale[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment._locale, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 24 ||
                    (m._a[HOUR] === 24 && (m._a[MINUTE] !== 0 ||
                                           m._a[SECOND] !== 0 ||
                                           m._a[MILLISECOND] !== 0)) ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0 &&
                    m._pf.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        if (!locales[name] && hasModule) {
            try {
                oldLocale = moment.locale();
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we want to undo that for lazy loaded locales
                moment.locale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // Return a moment from input, that is local/utc/utcOffset equivalent to
    // model.
    function makeAs(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (moment.isMoment(input) || isDate(input) ?
                    +input : +moment(input)) - (+res);
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(+res._d + diff);
            moment.updateOffset(res, false);
            return res;
        } else {
            return moment(input).local();
        }
    }


    /************************************
        Locale
    ************************************/


    extend(Locale.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
            // Lenient ordinal parsing accepts just a number in addition to
            // number + (possibly) stuff coming from _ordinalParseLenient.
            this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + /\d{1,2}/.source);
        },

        _months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName, format, strict) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
                this._longMonthsParse = [];
                this._shortMonthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                mom = moment.utc([2000, i]);
                if (strict && !this._longMonthsParse[i]) {
                    this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                    this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
                }
                if (!strict && !this._monthsParse[i]) {
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                    return i;
                } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                    return i;
                } else if (!strict && this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LTS : 'h:mm:ss A',
            LT : 'h:mm A',
            L : 'MM/DD/YYYY',
            LL : 'MMMM D, YYYY',
            LLL : 'MMMM D, YYYY LT',
            LLLL : 'dddd, MMMM D, YYYY LT'
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },


        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom, now) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom, [now]) : output;
        },

        _relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },

        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },

        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace('%d', number);
        },
        _ordinal : '%d',
        _ordinalParse : /\d{1,2}/,

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        firstDayOfWeek : function () {
            return this._week.dow;
        },

        firstDayOfYear : function () {
            return this._week.doy;
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'Q':
            return parseTokenOneDigit;
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
            return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) {
                return parseTokenOneDigit;
            }
            /* falls through */
        case 'SS':
            if (strict) {
                return parseTokenTwoDigits;
            }
            /* falls through */
        case 'SSS':
            if (strict) {
                return parseTokenThreeDigits;
            }
            /* falls through */
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return config._locale._meridiemParse;
        case 'x':
            return parseTokenOffsetMs;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        case 'Do':
            return strict ? config._locale._ordinalParse : config._locale._ordinalParseLenient;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
            return a;
        }
    }

    function utcOffsetFromString(string) {
        string = string || '';
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // QUARTER
        case 'Q':
            if (input != null) {
                datePartArray[MONTH] = (toInt(input) - 1) * 3;
            }
            break;
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = config._locale.monthsParse(input, token, config._strict);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        case 'Do' :
            if (input != null) {
                datePartArray[DATE] = toInt(parseInt(
                            input.match(/\d{1,2}/)[0], 10));
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = moment.parseTwoDigitYear(input);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._meridiem = input;
            // config._isPm = config._locale.isPM(input);
            break;
        // HOUR
        case 'h' : // fall through to hh
        case 'hh' :
            config._pf.bigHour = true;
            /* falls through */
        case 'H' : // fall through to HH
        case 'HH' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX OFFSET (MILLISECONDS)
        case 'x':
            config._d = new Date(toInt(input));
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = utcOffsetFromString(input);
            break;
        // WEEKDAY - human
        case 'dd':
        case 'ddd':
        case 'dddd':
            a = config._locale.weekdaysParse(input);
            // if we didn't get a weekday name, mark the date as invalid
            if (a != null) {
                config._w = config._w || {};
                config._w['d'] = a;
            } else {
                config._pf.invalidWeekday = input;
            }
            break;
        // WEEK, WEEK DAY - numeric
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gggg':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = toInt(input);
            }
            break;
        case 'gg':
        case 'GG':
            config._w = config._w || {};
            config._w[token] = moment.parseTwoDigitYear(input);
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
            week = dfl(w.W, 1);
            weekday = dfl(w.E, 1);
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
            week = dfl(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day || normalizedInput.date,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        if (config._f === moment.ISO_8601) {
            parseISO(config);
            return;
        }

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._pf.bigHour === true && config._a[HOUR] <= 12) {
            config._pf.bigHour = undefined;
        }
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR],
                config._meridiem);
        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function parseISO(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be 'T' or undefined
                    config._f = isoDates[i][0] + (match[6] || ' ');
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += 'Z';
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function makeDateFromString(config) {
        parseISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            moment.createFromInputFallback(config);
        }
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function makeDateFromInput(config) {
        var input = config._i, matched;
        if (input === undefined) {
            config._d = new Date();
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            dateFromConfig(config);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, locale) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = locale.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(posNegDuration, withoutSuffix, locale) {
        var duration = moment.duration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            years = round(duration.as('y')),

            args = seconds < relativeTimeThresholds.s && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < relativeTimeThresholds.m && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < relativeTimeThresholds.h && ['hh', hours] ||
                days === 1 && ['d'] ||
                days < relativeTimeThresholds.d && ['dd', days] ||
                months === 1 && ['M'] ||
                months < relativeTimeThresholds.M && ['MM', months] ||
                years === 1 && ['y'] || ['yy', years];

        args[2] = withoutSuffix;
        args[3] = +posNegDuration > 0;
        args[4] = locale;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        d = d === 0 ? 7 : d;
        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f,
            res;

        config._locale = config._locale || moment.localeData(config._l);

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (moment.isMoment(input)) {
            return new Moment(input, true);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        res = new Moment(config);
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    moment = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = locale;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return moment();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    moment.min = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    };

    moment.max = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    };

    // creating with utc
    moment.utc = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso,
            diffRes;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' &&
                ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(moment(duration.from), moment(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // constant that refers to the ISO standard
    moment.ISO_8601 = function () {};

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function allows you to set a threshold for relative time strings
    moment.relativeTimeThreshold = function (threshold, limit) {
        if (relativeTimeThresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return relativeTimeThresholds[threshold];
        }
        relativeTimeThresholds[threshold] = limit;
        return true;
    };

    moment.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        function (key, value) {
            return moment.locale(key, value);
        }
    );

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    moment.locale = function (key, values) {
        var data;
        if (key) {
            if (typeof(values) !== 'undefined') {
                data = moment.defineLocale(key, values);
            }
            else {
                data = moment.localeData(key);
            }

            if (data) {
                moment.duration._locale = moment._locale = data;
            }
        }

        return moment._locale._abbr;
    };

    moment.defineLocale = function (name, values) {
        if (values !== null) {
            values.abbr = name;
            if (!locales[name]) {
                locales[name] = new Locale();
            }
            locales[name].set(values);

            // backwards compat for now: also set the locale
            moment.locale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    };

    moment.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        function (key) {
            return moment.localeData(key);
        }
    );

    // returns locale data
    moment.localeData = function (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return moment._locale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null && hasOwnProp(obj, '_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    moment.isDate = isDate;

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d - ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                if ('function' === typeof Date.prototype.toISOString) {
                    // native implementation is ~50x faster, use it when we can
                    return this.toDate().toISOString();
                } else {
                    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                }
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {
            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function (keepLocalTime) {
            return this.utcOffset(0, keepLocalTime);
        },

        local : function (keepLocalTime) {
            if (this._isUTC) {
                this.utcOffset(0, keepLocalTime);
                this._isUTC = false;

                if (keepLocalTime) {
                    this.subtract(this._dateUtcOffset(), 'm');
                }
            }
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.localeData().postformat(output);
        },

        add : createAdder(1, 'add'),

        subtract : createAdder(-1, 'subtract'),

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (that.utcOffset() - this.utcOffset()) * 6e4,
                anchor, diff, output, daysAdjust;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month' || units === 'quarter') {
                output = monthDiff(this, that);
                if (units === 'quarter') {
                    output = output / 3;
                } else if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = this - that;
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function (time) {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're locat/utc/offset
            // or not.
            var now = time || moment(),
                sod = makeAs(now, this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.localeData().calendar(format, this, moment(now)));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.utcOffset() > this.clone().month(0).utcOffset() ||
                this.utcOffset() > this.clone().month(5).utcOffset());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.localeData());
                return this.add(input - day, 'd');
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf : function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            if (units === undefined || units === 'millisecond') {
                return this;
            }
            return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
        },

        isAfter: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this > +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return inputMs < +this.clone().startOf(units);
            }
        },

        isBefore: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this < +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return +this.clone().endOf(units) < inputMs;
            }
        },

        isBetween: function (from, to, units) {
            return this.isAfter(from, units) && this.isBefore(to, units);
        },

        isSame: function (input, units) {
            var inputMs;
            units = normalizeUnits(units || 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this === +input;
            } else {
                inputMs = +moment(input);
                return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
            }
        },

        min: deprecate(
                 'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
                 function (other) {
                     other = moment.apply(null, arguments);
                     return other < this ? this : other;
                 }
         ),

        max: deprecate(
                'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
                function (other) {
                    other = moment.apply(null, arguments);
                    return other > this ? this : other;
                }
        ),

        zone : deprecate(
                'moment().zone is deprecated, use moment().utcOffset instead. ' +
                'https://github.com/moment/moment/issues/1779',
                function (input, keepLocalTime) {
                    if (input != null) {
                        if (typeof input !== 'string') {
                            input = -input;
                        }

                        this.utcOffset(input, keepLocalTime);

                        return this;
                    } else {
                        return -this.utcOffset();
                    }
                }
        ),

        // keepLocalTime = true means only change the timezone, without
        // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
        // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
        // +0200, so we adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        utcOffset : function (input, keepLocalTime) {
            var offset = this._offset || 0,
                localAdjust;
            if (input != null) {
                if (typeof input === 'string') {
                    input = utcOffsetFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                if (!this._isUTC && keepLocalTime) {
                    localAdjust = this._dateUtcOffset();
                }
                this._offset = input;
                this._isUTC = true;
                if (localAdjust != null) {
                    this.add(localAdjust, 'm');
                }
                if (offset !== input) {
                    if (!keepLocalTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                                moment.duration(input - offset, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }

                return this;
            } else {
                return this._isUTC ? offset : this._dateUtcOffset();
            }
        },

        isLocal : function () {
            return !this._isUTC;
        },

        isUtcOffset : function () {
            return this._isUTC;
        },

        isUtc : function () {
            return this._isUTC && this._offset === 0;
        },

        zoneAbbr : function () {
            return this._isUTC ? 'UTC' : '';
        },

        zoneName : function () {
            return this._isUTC ? 'Coordinated Universal Time' : '';
        },

        parseZone : function () {
            if (this._tzm) {
                this.utcOffset(this._tzm);
            } else if (typeof this._i === 'string') {
                this.utcOffset(utcOffsetFromString(this._i));
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).utcOffset();
            }

            return (this.utcOffset() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        week : function (input) {
            var week = this.localeData().week(this);
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
            return input == null ? weekday : this.add(input - weekday, 'd');
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this.localeData()._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            var unit;
            if (typeof units === 'object') {
                for (unit in units) {
                    this.set(unit, units[unit]);
                }
            }
            else {
                units = normalizeUnits(units);
                if (typeof this[units] === 'function') {
                    this[units](value);
                }
            }
            return this;
        },

        // If passed a locale key, it will set the locale for this
        // instance.  Otherwise, it will return the locale configuration
        // variables for this instance.
        locale : function (key) {
            var newLocaleData;

            if (key === undefined) {
                return this._locale._abbr;
            } else {
                newLocaleData = moment.localeData(key);
                if (newLocaleData != null) {
                    this._locale = newLocaleData;
                }
                return this;
            }
        },

        lang : deprecate(
            'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
            function (key) {
                if (key === undefined) {
                    return this.localeData();
                } else {
                    return this.locale(key);
                }
            }
        ),

        localeData : function () {
            return this._locale;
        },

        _dateUtcOffset : function () {
            // On Firefox.24 Date#getTimezoneOffset returns a floating point.
            // https://github.com/moment/moment/pull/1871
            return -Math.round(this._d.getTimezoneOffset() / 15) * 15;
        }

    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
                daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    // alias isUtc for dev-friendliness
    moment.fn.isUTC = moment.fn.isUtc;

    /************************************
        Duration Prototype
    ************************************/


    function daysToYears (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return days * 400 / 146097;
    }

    function yearsToDays (years) {
        // years * 365 + absRound(years / 4) -
        //     absRound(years / 100) + absRound(years / 400);
        return years * 146097 / 400;
    }

    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years = 0;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);

            // Accurately convert days to years, assume start from year 0.
            years = absRound(daysToYears(days));
            days -= absRound(yearsToDays(years));

            // 30 days to a month
            // TODO (iskren): Use anchor date (like 1st Jan) to compute this.
            months += absRound(days / 30);
            days %= 30;

            // 12 months -> 1 year
            years += absRound(months / 12);
            months %= 12;

            data.days = days;
            data.months = months;
            data.years = years;
        },

        abs : function () {
            this._milliseconds = Math.abs(this._milliseconds);
            this._days = Math.abs(this._days);
            this._months = Math.abs(this._months);

            this._data.milliseconds = Math.abs(this._data.milliseconds);
            this._data.seconds = Math.abs(this._data.seconds);
            this._data.minutes = Math.abs(this._data.minutes);
            this._data.hours = Math.abs(this._data.hours);
            this._data.months = Math.abs(this._data.months);
            this._data.years = Math.abs(this._data.years);

            return this;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var output = relativeTime(this, !withSuffix, this.localeData());

            if (withSuffix) {
                output = this.localeData().pastFuture(+this, output);
            }

            return this.localeData().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            var days, months;
            units = normalizeUnits(units);

            if (units === 'month' || units === 'year') {
                days = this._days + this._milliseconds / 864e5;
                months = this._months + daysToYears(days) * 12;
                return units === 'month' ? months : months / 12;
            } else {
                // handle milliseconds separately because of floating point math errors (issue #1867)
                days = this._days + Math.round(yearsToDays(this._months / 12));
                switch (units) {
                    case 'week': return days / 7 + this._milliseconds / 6048e5;
                    case 'day': return days + this._milliseconds / 864e5;
                    case 'hour': return days * 24 + this._milliseconds / 36e5;
                    case 'minute': return days * 24 * 60 + this._milliseconds / 6e4;
                    case 'second': return days * 24 * 60 * 60 + this._milliseconds / 1000;
                    // Math.floor prevents floating point math errors here
                    case 'millisecond': return Math.floor(days * 24 * 60 * 60 * 1000) + this._milliseconds;
                    default: throw new Error('Unknown unit ' + units);
                }
            }
        },

        lang : moment.fn.lang,
        locale : moment.fn.locale,

        toIsoString : deprecate(
            'toIsoString() is deprecated. Please use toISOString() instead ' +
            '(notice the capitals)',
            function () {
                return this.toISOString();
            }
        ),

        toISOString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        },

        localeData : function () {
            return this._locale;
        },

        toJSON : function () {
            return this.toISOString();
        }
    });

    moment.duration.fn.toString = moment.duration.fn.toISOString;

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    for (i in unitMillisecondFactors) {
        if (hasOwnProp(unitMillisecondFactors, i)) {
            makeDurationGetter(i.toLowerCase());
        }
    }

    moment.duration.fn.asMilliseconds = function () {
        return this.as('ms');
    };
    moment.duration.fn.asSeconds = function () {
        return this.as('s');
    };
    moment.duration.fn.asMinutes = function () {
        return this.as('m');
    };
    moment.duration.fn.asHours = function () {
        return this.as('h');
    };
    moment.duration.fn.asDays = function () {
        return this.as('d');
    };
    moment.duration.fn.asWeeks = function () {
        return this.as('weeks');
    };
    moment.duration.fn.asMonths = function () {
        return this.as('M');
    };
    moment.duration.fn.asYears = function () {
        return this.as('y');
    };

    /************************************
        Default Locale
    ************************************/


    // Set default locale, other locale will inherit from English.
    moment.locale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // moment.js locale configuration
// locale : afrikaans (af)
// author : Werner Mollentze : https://github.com/wernerm

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('af', {
        months : 'Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des'.split('_'),
        weekdays : 'Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag'.split('_'),
        weekdaysShort : 'Son_Maa_Din_Woe_Don_Vry_Sat'.split('_'),
        weekdaysMin : 'So_Ma_Di_Wo_Do_Vr_Sa'.split('_'),
        meridiemParse: /vm|nm/i,
        isPM : function (input) {
            return /^nm$/i.test(input);
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 12) {
                return isLower ? 'vm' : 'VM';
            } else {
                return isLower ? 'nm' : 'NM';
            }
        },
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Vandag om] LT',
            nextDay : '[MÃƒÂ´re om] LT',
            nextWeek : 'dddd [om] LT',
            lastDay : '[Gister om] LT',
            lastWeek : '[Laas] dddd [om] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'oor %s',
            past : '%s gelede',
            s : '\'n paar sekondes',
            m : '\'n minuut',
            mm : '%d minute',
            h : '\'n uur',
            hh : '%d ure',
            d : '\'n dag',
            dd : '%d dae',
            M : '\'n maand',
            MM : '%d maande',
            y : '\'n jaar',
            yy : '%d jaar'
        },
        ordinalParse: /\d{1,2}(ste|de)/,
        ordinal : function (number) {
            return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de'); // Thanks to Joris RÃƒÂ¶ling : https://github.com/jjupiter
        },
        week : {
            dow : 1, // Maandag is die eerste dag van die week.
            doy : 4  // Die week wat die 4de Januarie bevat is die eerste week van die jaar.
        }
    });
}));
// moment.js locale configuration
// locale : Moroccan Arabic (ar-ma)
// author : ElFadili Yassine : https://github.com/ElFadiliY
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ar-ma', {
        months : 'Ã™Å Ã™â€ Ã˜Â§Ã™Å Ã˜Â±_Ã™ÂÃ˜Â¨Ã˜Â±Ã˜Â§Ã™Å Ã˜Â±_Ã™â€¦Ã˜Â§Ã˜Â±Ã˜Â³_Ã˜Â£Ã˜Â¨Ã˜Â±Ã™Å Ã™â€ž_Ã™â€¦Ã˜Â§Ã™Å _Ã™Å Ã™Ë†Ã™â€ Ã™Å Ã™Ë†_Ã™Å Ã™Ë†Ã™â€žÃ™Å Ã™Ë†Ã˜Â²_Ã˜ÂºÃ˜Â´Ã˜Âª_Ã˜Â´Ã˜ÂªÃ™â€ Ã˜Â¨Ã˜Â±_Ã˜Â£Ã™Æ’Ã˜ÂªÃ™Ë†Ã˜Â¨Ã˜Â±_Ã™â€ Ã™Ë†Ã™â€ Ã˜Â¨Ã˜Â±_Ã˜Â¯Ã˜Â¬Ã™â€ Ã˜Â¨Ã˜Â±'.split('_'),
        monthsShort : 'Ã™Å Ã™â€ Ã˜Â§Ã™Å Ã˜Â±_Ã™ÂÃ˜Â¨Ã˜Â±Ã˜Â§Ã™Å Ã˜Â±_Ã™â€¦Ã˜Â§Ã˜Â±Ã˜Â³_Ã˜Â£Ã˜Â¨Ã˜Â±Ã™Å Ã™â€ž_Ã™â€¦Ã˜Â§Ã™Å _Ã™Å Ã™Ë†Ã™â€ Ã™Å Ã™Ë†_Ã™Å Ã™Ë†Ã™â€žÃ™Å Ã™Ë†Ã˜Â²_Ã˜ÂºÃ˜Â´Ã˜Âª_Ã˜Â´Ã˜ÂªÃ™â€ Ã˜Â¨Ã˜Â±_Ã˜Â£Ã™Æ’Ã˜ÂªÃ™Ë†Ã˜Â¨Ã˜Â±_Ã™â€ Ã™Ë†Ã™â€ Ã˜Â¨Ã˜Â±_Ã˜Â¯Ã˜Â¬Ã™â€ Ã˜Â¨Ã˜Â±'.split('_'),
        weekdays : 'Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â­Ã˜Â¯_Ã˜Â§Ã™â€žÃ˜Â¥Ã˜ÂªÃ™â€ Ã™Å Ã™â€ _Ã˜Â§Ã™â€žÃ˜Â«Ã™â€žÃ˜Â§Ã˜Â«Ã˜Â§Ã˜Â¡_Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â±Ã˜Â¨Ã˜Â¹Ã˜Â§Ã˜Â¡_Ã˜Â§Ã™â€žÃ˜Â®Ã™â€¦Ã™Å Ã˜Â³_Ã˜Â§Ã™â€žÃ˜Â¬Ã™â€¦Ã˜Â¹Ã˜Â©_Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â¨Ã˜Âª'.split('_'),
        weekdaysShort : 'Ã˜Â§Ã˜Â­Ã˜Â¯_Ã˜Â§Ã˜ÂªÃ™â€ Ã™Å Ã™â€ _Ã˜Â«Ã™â€žÃ˜Â§Ã˜Â«Ã˜Â§Ã˜Â¡_Ã˜Â§Ã˜Â±Ã˜Â¨Ã˜Â¹Ã˜Â§Ã˜Â¡_Ã˜Â®Ã™â€¦Ã™Å Ã˜Â³_Ã˜Â¬Ã™â€¦Ã˜Â¹Ã˜Â©_Ã˜Â³Ã˜Â¨Ã˜Âª'.split('_'),
        weekdaysMin : 'Ã˜Â­_Ã™â€ _Ã˜Â«_Ã˜Â±_Ã˜Â®_Ã˜Â¬_Ã˜Â³'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Ã˜Â§Ã™â€žÃ™Å Ã™Ë†Ã™â€¦ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            nextDay: '[Ã˜ÂºÃ˜Â¯Ã˜Â§ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            nextWeek: 'dddd [Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            lastDay: '[Ã˜Â£Ã™â€¦Ã˜Â³ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            lastWeek: 'dddd [Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'Ã™ÂÃ™Å  %s',
            past : 'Ã™â€¦Ã™â€ Ã˜Â° %s',
            s : 'Ã˜Â«Ã™Ë†Ã˜Â§Ã™â€ ',
            m : 'Ã˜Â¯Ã™â€šÃ™Å Ã™â€šÃ˜Â©',
            mm : '%d Ã˜Â¯Ã™â€šÃ˜Â§Ã˜Â¦Ã™â€š',
            h : 'Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©',
            hh : '%d Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Â§Ã˜Âª',
            d : 'Ã™Å Ã™Ë†Ã™â€¦',
            dd : '%d Ã˜Â£Ã™Å Ã˜Â§Ã™â€¦',
            M : 'Ã˜Â´Ã™â€¡Ã˜Â±',
            MM : '%d Ã˜Â£Ã˜Â´Ã™â€¡Ã˜Â±',
            y : 'Ã˜Â³Ã™â€ Ã˜Â©',
            yy : '%d Ã˜Â³Ã™â€ Ã™Ë†Ã˜Â§Ã˜Âª'
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Arabic Saudi Arabia (ar-sa)
// author : Suhail Alkowaileet : https://github.com/xsoh

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ã™Â¡',
        '2': 'Ã™Â¢',
        '3': 'Ã™Â£',
        '4': 'Ã™Â¤',
        '5': 'Ã™Â¥',
        '6': 'Ã™Â¦',
        '7': 'Ã™Â§',
        '8': 'Ã™Â¨',
        '9': 'Ã™Â©',
        '0': 'Ã™ '
    }, numberMap = {
        'Ã™Â¡': '1',
        'Ã™Â¢': '2',
        'Ã™Â£': '3',
        'Ã™Â¤': '4',
        'Ã™Â¥': '5',
        'Ã™Â¦': '6',
        'Ã™Â§': '7',
        'Ã™Â¨': '8',
        'Ã™Â©': '9',
        'Ã™ ': '0'
    };

    return moment.defineLocale('ar-sa', {
        months : 'Ã™Å Ã™â€ Ã˜Â§Ã™Å Ã˜Â±_Ã™ÂÃ˜Â¨Ã˜Â±Ã˜Â§Ã™Å Ã˜Â±_Ã™â€¦Ã˜Â§Ã˜Â±Ã˜Â³_Ã˜Â£Ã˜Â¨Ã˜Â±Ã™Å Ã™â€ž_Ã™â€¦Ã˜Â§Ã™Å Ã™Ë†_Ã™Å Ã™Ë†Ã™â€ Ã™Å Ã™Ë†_Ã™Å Ã™Ë†Ã™â€žÃ™Å Ã™Ë†_Ã˜Â£Ã˜ÂºÃ˜Â³Ã˜Â·Ã˜Â³_Ã˜Â³Ã˜Â¨Ã˜ÂªÃ™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â£Ã™Æ’Ã˜ÂªÃ™Ë†Ã˜Â¨Ã˜Â±_Ã™â€ Ã™Ë†Ã™ÂÃ™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â¯Ã™Å Ã˜Â³Ã™â€¦Ã˜Â¨Ã˜Â±'.split('_'),
        monthsShort : 'Ã™Å Ã™â€ Ã˜Â§Ã™Å Ã˜Â±_Ã™ÂÃ˜Â¨Ã˜Â±Ã˜Â§Ã™Å Ã˜Â±_Ã™â€¦Ã˜Â§Ã˜Â±Ã˜Â³_Ã˜Â£Ã˜Â¨Ã˜Â±Ã™Å Ã™â€ž_Ã™â€¦Ã˜Â§Ã™Å Ã™Ë†_Ã™Å Ã™Ë†Ã™â€ Ã™Å Ã™Ë†_Ã™Å Ã™Ë†Ã™â€žÃ™Å Ã™Ë†_Ã˜Â£Ã˜ÂºÃ˜Â³Ã˜Â·Ã˜Â³_Ã˜Â³Ã˜Â¨Ã˜ÂªÃ™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â£Ã™Æ’Ã˜ÂªÃ™Ë†Ã˜Â¨Ã˜Â±_Ã™â€ Ã™Ë†Ã™ÂÃ™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â¯Ã™Å Ã˜Â³Ã™â€¦Ã˜Â¨Ã˜Â±'.split('_'),
        weekdays : 'Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â­Ã˜Â¯_Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â«Ã™â€ Ã™Å Ã™â€ _Ã˜Â§Ã™â€žÃ˜Â«Ã™â€žÃ˜Â§Ã˜Â«Ã˜Â§Ã˜Â¡_Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â±Ã˜Â¨Ã˜Â¹Ã˜Â§Ã˜Â¡_Ã˜Â§Ã™â€žÃ˜Â®Ã™â€¦Ã™Å Ã˜Â³_Ã˜Â§Ã™â€žÃ˜Â¬Ã™â€¦Ã˜Â¹Ã˜Â©_Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â¨Ã˜Âª'.split('_'),
        weekdaysShort : 'Ã˜Â£Ã˜Â­Ã˜Â¯_Ã˜Â¥Ã˜Â«Ã™â€ Ã™Å Ã™â€ _Ã˜Â«Ã™â€žÃ˜Â§Ã˜Â«Ã˜Â§Ã˜Â¡_Ã˜Â£Ã˜Â±Ã˜Â¨Ã˜Â¹Ã˜Â§Ã˜Â¡_Ã˜Â®Ã™â€¦Ã™Å Ã˜Â³_Ã˜Â¬Ã™â€¦Ã˜Â¹Ã˜Â©_Ã˜Â³Ã˜Â¨Ã˜Âª'.split('_'),
        weekdaysMin : 'Ã˜Â­_Ã™â€ _Ã˜Â«_Ã˜Â±_Ã˜Â®_Ã˜Â¬_Ã˜Â³'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'HH:mm:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        meridiemParse: /Ã˜Âµ|Ã™â€¦/,
        isPM : function (input) {
            return 'Ã™â€¦' === input;
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'Ã˜Âµ';
            } else {
                return 'Ã™â€¦';
            }
        },
        calendar : {
            sameDay: '[Ã˜Â§Ã™â€žÃ™Å Ã™Ë†Ã™â€¦ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            nextDay: '[Ã˜ÂºÃ˜Â¯Ã˜Â§ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            nextWeek: 'dddd [Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            lastDay: '[Ã˜Â£Ã™â€¦Ã˜Â³ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            lastWeek: 'dddd [Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'Ã™ÂÃ™Å  %s',
            past : 'Ã™â€¦Ã™â€ Ã˜Â° %s',
            s : 'Ã˜Â«Ã™Ë†Ã˜Â§Ã™â€ ',
            m : 'Ã˜Â¯Ã™â€šÃ™Å Ã™â€šÃ˜Â©',
            mm : '%d Ã˜Â¯Ã™â€šÃ˜Â§Ã˜Â¦Ã™â€š',
            h : 'Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©',
            hh : '%d Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Â§Ã˜Âª',
            d : 'Ã™Å Ã™Ë†Ã™â€¦',
            dd : '%d Ã˜Â£Ã™Å Ã˜Â§Ã™â€¦',
            M : 'Ã˜Â´Ã™â€¡Ã˜Â±',
            MM : '%d Ã˜Â£Ã˜Â´Ã™â€¡Ã˜Â±',
            y : 'Ã˜Â³Ã™â€ Ã˜Â©',
            yy : '%d Ã˜Â³Ã™â€ Ã™Ë†Ã˜Â§Ã˜Âª'
        },
        preparse: function (string) {
            return string.replace(/[Ã™Â¡Ã™Â¢Ã™Â£Ã™Â¤Ã™Â¥Ã™Â¦Ã™Â§Ã™Â¨Ã™Â©Ã™ ]/g, function (match) {
                return numberMap[match];
            }).replace(/Ã˜Å’/g, ',');
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            }).replace(/,/g, 'Ã˜Å’');
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale  : Tunisian Arabic (ar-tn)

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ar-tn', {
        months: 'Ã˜Â¬Ã˜Â§Ã™â€ Ã™ÂÃ™Å _Ã™ÂÃ™Å Ã™ÂÃ˜Â±Ã™Å _Ã™â€¦Ã˜Â§Ã˜Â±Ã˜Â³_Ã˜Â£Ã™ÂÃ˜Â±Ã™Å Ã™â€ž_Ã™â€¦Ã˜Â§Ã™Å _Ã˜Â¬Ã™Ë†Ã˜Â§Ã™â€ _Ã˜Â¬Ã™Ë†Ã™Å Ã™â€žÃ™Å Ã˜Â©_Ã˜Â£Ã™Ë†Ã˜Âª_Ã˜Â³Ã˜Â¨Ã˜ÂªÃ™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â£Ã™Æ’Ã˜ÂªÃ™Ë†Ã˜Â¨Ã˜Â±_Ã™â€ Ã™Ë†Ã™ÂÃ™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â¯Ã™Å Ã˜Â³Ã™â€¦Ã˜Â¨Ã˜Â±'.split('_'),
        monthsShort: 'Ã˜Â¬Ã˜Â§Ã™â€ Ã™ÂÃ™Å _Ã™ÂÃ™Å Ã™ÂÃ˜Â±Ã™Å _Ã™â€¦Ã˜Â§Ã˜Â±Ã˜Â³_Ã˜Â£Ã™ÂÃ˜Â±Ã™Å Ã™â€ž_Ã™â€¦Ã˜Â§Ã™Å _Ã˜Â¬Ã™Ë†Ã˜Â§Ã™â€ _Ã˜Â¬Ã™Ë†Ã™Å Ã™â€žÃ™Å Ã˜Â©_Ã˜Â£Ã™Ë†Ã˜Âª_Ã˜Â³Ã˜Â¨Ã˜ÂªÃ™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â£Ã™Æ’Ã˜ÂªÃ™Ë†Ã˜Â¨Ã˜Â±_Ã™â€ Ã™Ë†Ã™ÂÃ™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â¯Ã™Å Ã˜Â³Ã™â€¦Ã˜Â¨Ã˜Â±'.split('_'),
        weekdays: 'Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â­Ã˜Â¯_Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â«Ã™â€ Ã™Å Ã™â€ _Ã˜Â§Ã™â€žÃ˜Â«Ã™â€žÃ˜Â§Ã˜Â«Ã˜Â§Ã˜Â¡_Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â±Ã˜Â¨Ã˜Â¹Ã˜Â§Ã˜Â¡_Ã˜Â§Ã™â€žÃ˜Â®Ã™â€¦Ã™Å Ã˜Â³_Ã˜Â§Ã™â€žÃ˜Â¬Ã™â€¦Ã˜Â¹Ã˜Â©_Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â¨Ã˜Âª'.split('_'),
        weekdaysShort: 'Ã˜Â£Ã˜Â­Ã˜Â¯_Ã˜Â¥Ã˜Â«Ã™â€ Ã™Å Ã™â€ _Ã˜Â«Ã™â€žÃ˜Â§Ã˜Â«Ã˜Â§Ã˜Â¡_Ã˜Â£Ã˜Â±Ã˜Â¨Ã˜Â¹Ã˜Â§Ã˜Â¡_Ã˜Â®Ã™â€¦Ã™Å Ã˜Â³_Ã˜Â¬Ã™â€¦Ã˜Â¹Ã˜Â©_Ã˜Â³Ã˜Â¨Ã˜Âª'.split('_'),
        weekdaysMin: 'Ã˜Â­_Ã™â€ _Ã˜Â«_Ã˜Â±_Ã˜Â®_Ã˜Â¬_Ã˜Â³'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'LT:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[Ã˜Â§Ã™â€žÃ™Å Ã™Ë†Ã™â€¦ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            nextDay: '[Ã˜ÂºÃ˜Â¯Ã˜Â§ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            nextWeek: 'dddd [Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            lastDay: '[Ã˜Â£Ã™â€¦Ã˜Â³ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            lastWeek: 'dddd [Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            sameElse: 'L'
        },
        relativeTime: {
            future: 'Ã™ÂÃ™Å  %s',
            past: 'Ã™â€¦Ã™â€ Ã˜Â° %s',
            s: 'Ã˜Â«Ã™Ë†Ã˜Â§Ã™â€ ',
            m: 'Ã˜Â¯Ã™â€šÃ™Å Ã™â€šÃ˜Â©',
            mm: '%d Ã˜Â¯Ã™â€šÃ˜Â§Ã˜Â¦Ã™â€š',
            h: 'Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©',
            hh: '%d Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Â§Ã˜Âª',
            d: 'Ã™Å Ã™Ë†Ã™â€¦',
            dd: '%d Ã˜Â£Ã™Å Ã˜Â§Ã™â€¦',
            M: 'Ã˜Â´Ã™â€¡Ã˜Â±',
            MM: '%d Ã˜Â£Ã˜Â´Ã™â€¡Ã˜Â±',
            y: 'Ã˜Â³Ã™â€ Ã˜Â©',
            yy: '%d Ã˜Â³Ã™â€ Ã™Ë†Ã˜Â§Ã˜Âª'
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4 // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// Locale: Arabic (ar)
// Author: Abdel Said: https://github.com/abdelsaid
// Changes in months, weekdays: Ahmed Elkhatib
// Native plural forms: forabi https://github.com/forabi

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ã™Â¡',
        '2': 'Ã™Â¢',
        '3': 'Ã™Â£',
        '4': 'Ã™Â¤',
        '5': 'Ã™Â¥',
        '6': 'Ã™Â¦',
        '7': 'Ã™Â§',
        '8': 'Ã™Â¨',
        '9': 'Ã™Â©',
        '0': 'Ã™ '
    }, numberMap = {
        'Ã™Â¡': '1',
        'Ã™Â¢': '2',
        'Ã™Â£': '3',
        'Ã™Â¤': '4',
        'Ã™Â¥': '5',
        'Ã™Â¦': '6',
        'Ã™Â§': '7',
        'Ã™Â¨': '8',
        'Ã™Â©': '9',
        'Ã™ ': '0'
    }, pluralForm = function (n) {
        return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5;
    }, plurals = {
        s : ['Ã˜Â£Ã™â€šÃ™â€ž Ã™â€¦Ã™â€  Ã˜Â«Ã˜Â§Ã™â€ Ã™Å Ã˜Â©', 'Ã˜Â«Ã˜Â§Ã™â€ Ã™Å Ã˜Â© Ã™Ë†Ã˜Â§Ã˜Â­Ã˜Â¯Ã˜Â©', ['Ã˜Â«Ã˜Â§Ã™â€ Ã™Å Ã˜ÂªÃ˜Â§Ã™â€ ', 'Ã˜Â«Ã˜Â§Ã™â€ Ã™Å Ã˜ÂªÃ™Å Ã™â€ '], '%d Ã˜Â«Ã™Ë†Ã˜Â§Ã™â€ ', '%d Ã˜Â«Ã˜Â§Ã™â€ Ã™Å Ã˜Â©', '%d Ã˜Â«Ã˜Â§Ã™â€ Ã™Å Ã˜Â©'],
        m : ['Ã˜Â£Ã™â€šÃ™â€ž Ã™â€¦Ã™â€  Ã˜Â¯Ã™â€šÃ™Å Ã™â€šÃ˜Â©', 'Ã˜Â¯Ã™â€šÃ™Å Ã™â€šÃ˜Â© Ã™Ë†Ã˜Â§Ã˜Â­Ã˜Â¯Ã˜Â©', ['Ã˜Â¯Ã™â€šÃ™Å Ã™â€šÃ˜ÂªÃ˜Â§Ã™â€ ', 'Ã˜Â¯Ã™â€šÃ™Å Ã™â€šÃ˜ÂªÃ™Å Ã™â€ '], '%d Ã˜Â¯Ã™â€šÃ˜Â§Ã˜Â¦Ã™â€š', '%d Ã˜Â¯Ã™â€šÃ™Å Ã™â€šÃ˜Â©', '%d Ã˜Â¯Ã™â€šÃ™Å Ã™â€šÃ˜Â©'],
        h : ['Ã˜Â£Ã™â€šÃ™â€ž Ã™â€¦Ã™â€  Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©', 'Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Â© Ã™Ë†Ã˜Â§Ã˜Â­Ã˜Â¯Ã˜Â©', ['Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜ÂªÃ˜Â§Ã™â€ ', 'Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜ÂªÃ™Å Ã™â€ '], '%d Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Â§Ã˜Âª', '%d Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©', '%d Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©'],
        d : ['Ã˜Â£Ã™â€šÃ™â€ž Ã™â€¦Ã™â€  Ã™Å Ã™Ë†Ã™â€¦', 'Ã™Å Ã™Ë†Ã™â€¦ Ã™Ë†Ã˜Â§Ã˜Â­Ã˜Â¯', ['Ã™Å Ã™Ë†Ã™â€¦Ã˜Â§Ã™â€ ', 'Ã™Å Ã™Ë†Ã™â€¦Ã™Å Ã™â€ '], '%d Ã˜Â£Ã™Å Ã˜Â§Ã™â€¦', '%d Ã™Å Ã™Ë†Ã™â€¦Ã™â€¹Ã˜Â§', '%d Ã™Å Ã™Ë†Ã™â€¦'],
        M : ['Ã˜Â£Ã™â€šÃ™â€ž Ã™â€¦Ã™â€  Ã˜Â´Ã™â€¡Ã˜Â±', 'Ã˜Â´Ã™â€¡Ã˜Â± Ã™Ë†Ã˜Â§Ã˜Â­Ã˜Â¯', ['Ã˜Â´Ã™â€¡Ã˜Â±Ã˜Â§Ã™â€ ', 'Ã˜Â´Ã™â€¡Ã˜Â±Ã™Å Ã™â€ '], '%d Ã˜Â£Ã˜Â´Ã™â€¡Ã˜Â±', '%d Ã˜Â´Ã™â€¡Ã˜Â±Ã˜Â§', '%d Ã˜Â´Ã™â€¡Ã˜Â±'],
        y : ['Ã˜Â£Ã™â€šÃ™â€ž Ã™â€¦Ã™â€  Ã˜Â¹Ã˜Â§Ã™â€¦', 'Ã˜Â¹Ã˜Â§Ã™â€¦ Ã™Ë†Ã˜Â§Ã˜Â­Ã˜Â¯', ['Ã˜Â¹Ã˜Â§Ã™â€¦Ã˜Â§Ã™â€ ', 'Ã˜Â¹Ã˜Â§Ã™â€¦Ã™Å Ã™â€ '], '%d Ã˜Â£Ã˜Â¹Ã™Ë†Ã˜Â§Ã™â€¦', '%d Ã˜Â¹Ã˜Â§Ã™â€¦Ã™â€¹Ã˜Â§', '%d Ã˜Â¹Ã˜Â§Ã™â€¦']
    }, pluralize = function (u) {
        return function (number, withoutSuffix, string, isFuture) {
            var f = pluralForm(number),
                str = plurals[u][pluralForm(number)];
            if (f === 2) {
                str = str[withoutSuffix ? 0 : 1];
            }
            return str.replace(/%d/i, number);
        };
    }, months = [
        'Ã™Æ’Ã˜Â§Ã™â€ Ã™Ë†Ã™â€  Ã˜Â§Ã™â€žÃ˜Â«Ã˜Â§Ã™â€ Ã™Å  Ã™Å Ã™â€ Ã˜Â§Ã™Å Ã˜Â±',
        'Ã˜Â´Ã˜Â¨Ã˜Â§Ã˜Â· Ã™ÂÃ˜Â¨Ã˜Â±Ã˜Â§Ã™Å Ã˜Â±',
        'Ã˜Â¢Ã˜Â°Ã˜Â§Ã˜Â± Ã™â€¦Ã˜Â§Ã˜Â±Ã˜Â³',
        'Ã™â€ Ã™Å Ã˜Â³Ã˜Â§Ã™â€  Ã˜Â£Ã˜Â¨Ã˜Â±Ã™Å Ã™â€ž',
        'Ã˜Â£Ã™Å Ã˜Â§Ã˜Â± Ã™â€¦Ã˜Â§Ã™Å Ã™Ë†',
        'Ã˜Â­Ã˜Â²Ã™Å Ã˜Â±Ã˜Â§Ã™â€  Ã™Å Ã™Ë†Ã™â€ Ã™Å Ã™Ë†',
        'Ã˜ÂªÃ™â€¦Ã™Ë†Ã˜Â² Ã™Å Ã™Ë†Ã™â€žÃ™Å Ã™Ë†',
        'Ã˜Â¢Ã˜Â¨ Ã˜Â£Ã˜ÂºÃ˜Â³Ã˜Â·Ã˜Â³',
        'Ã˜Â£Ã™Å Ã™â€žÃ™Ë†Ã™â€ž Ã˜Â³Ã˜Â¨Ã˜ÂªÃ™â€¦Ã˜Â¨Ã˜Â±',
        'Ã˜ÂªÃ˜Â´Ã˜Â±Ã™Å Ã™â€  Ã˜Â§Ã™â€žÃ˜Â£Ã™Ë†Ã™â€ž Ã˜Â£Ã™Æ’Ã˜ÂªÃ™Ë†Ã˜Â¨Ã˜Â±',
        'Ã˜ÂªÃ˜Â´Ã˜Â±Ã™Å Ã™â€  Ã˜Â§Ã™â€žÃ˜Â«Ã˜Â§Ã™â€ Ã™Å  Ã™â€ Ã™Ë†Ã™ÂÃ™â€¦Ã˜Â¨Ã˜Â±',
        'Ã™Æ’Ã˜Â§Ã™â€ Ã™Ë†Ã™â€  Ã˜Â§Ã™â€žÃ˜Â£Ã™Ë†Ã™â€ž Ã˜Â¯Ã™Å Ã˜Â³Ã™â€¦Ã˜Â¨Ã˜Â±'
    ];

    return moment.defineLocale('ar', {
        months : months,
        monthsShort : months,
        weekdays : 'Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â­Ã˜Â¯_Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â«Ã™â€ Ã™Å Ã™â€ _Ã˜Â§Ã™â€žÃ˜Â«Ã™â€žÃ˜Â§Ã˜Â«Ã˜Â§Ã˜Â¡_Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â±Ã˜Â¨Ã˜Â¹Ã˜Â§Ã˜Â¡_Ã˜Â§Ã™â€žÃ˜Â®Ã™â€¦Ã™Å Ã˜Â³_Ã˜Â§Ã™â€žÃ˜Â¬Ã™â€¦Ã˜Â¹Ã˜Â©_Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â¨Ã˜Âª'.split('_'),
        weekdaysShort : 'Ã˜Â£Ã˜Â­Ã˜Â¯_Ã˜Â¥Ã˜Â«Ã™â€ Ã™Å Ã™â€ _Ã˜Â«Ã™â€žÃ˜Â§Ã˜Â«Ã˜Â§Ã˜Â¡_Ã˜Â£Ã˜Â±Ã˜Â¨Ã˜Â¹Ã˜Â§Ã˜Â¡_Ã˜Â®Ã™â€¦Ã™Å Ã˜Â³_Ã˜Â¬Ã™â€¦Ã˜Â¹Ã˜Â©_Ã˜Â³Ã˜Â¨Ã˜Âª'.split('_'),
        weekdaysMin : 'Ã˜Â­_Ã™â€ _Ã˜Â«_Ã˜Â±_Ã˜Â®_Ã˜Â¬_Ã˜Â³'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'HH:mm:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        meridiemParse: /Ã˜Âµ|Ã™â€¦/,
        isPM : function (input) {
            return 'Ã™â€¦' === input;
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'Ã˜Âµ';
            } else {
                return 'Ã™â€¦';
            }
        },
        calendar : {
            sameDay: '[Ã˜Â§Ã™â€žÃ™Å Ã™Ë†Ã™â€¦ Ã˜Â¹Ã™â€ Ã˜Â¯ Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            nextDay: '[Ã˜ÂºÃ˜Â¯Ã™â€¹Ã˜Â§ Ã˜Â¹Ã™â€ Ã˜Â¯ Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            nextWeek: 'dddd [Ã˜Â¹Ã™â€ Ã˜Â¯ Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            lastDay: '[Ã˜Â£Ã™â€¦Ã˜Â³ Ã˜Â¹Ã™â€ Ã˜Â¯ Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            lastWeek: 'dddd [Ã˜Â¹Ã™â€ Ã˜Â¯ Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â§Ã˜Â¹Ã˜Â©] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'Ã˜Â¨Ã˜Â¹Ã˜Â¯ %s',
            past : 'Ã™â€¦Ã™â€ Ã˜Â° %s',
            s : pluralize('s'),
            m : pluralize('m'),
            mm : pluralize('m'),
            h : pluralize('h'),
            hh : pluralize('h'),
            d : pluralize('d'),
            dd : pluralize('d'),
            M : pluralize('M'),
            MM : pluralize('M'),
            y : pluralize('y'),
            yy : pluralize('y')
        },
        preparse: function (string) {
            return string.replace(/[Ã™Â¡Ã™Â¢Ã™Â£Ã™Â¤Ã™Â¥Ã™Â¦Ã™Â§Ã™Â¨Ã™Â©Ã™ ]/g, function (match) {
                return numberMap[match];
            }).replace(/Ã˜Å’/g, ',');
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            }).replace(/,/g, 'Ã˜Å’');
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : azerbaijani (az)
// author : topchiyev : https://github.com/topchiyev

(function (factory) {
    factory(moment);
}(function (moment) {
    var suffixes = {
        1: '-inci',
        5: '-inci',
        8: '-inci',
        70: '-inci',
        80: '-inci',

        2: '-nci',
        7: '-nci',
        20: '-nci',
        50: '-nci',

        3: '-ÃƒÂ¼ncÃƒÂ¼',
        4: '-ÃƒÂ¼ncÃƒÂ¼',
        100: '-ÃƒÂ¼ncÃƒÂ¼',

        6: '-ncÃ„Â±',

        9: '-uncu',
        10: '-uncu',
        30: '-uncu',

        60: '-Ã„Â±ncÃ„Â±',
        90: '-Ã„Â±ncÃ„Â±'
    };
    return moment.defineLocale('az', {
        months : 'yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr'.split('_'),
        monthsShort : 'yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek'.split('_'),
        weekdays : 'Bazar_Bazar ertÃ‰â„¢si_Ãƒâ€¡Ã‰â„¢rÃ…Å¸Ã‰â„¢nbÃ‰â„¢ axÃ…Å¸amÃ„Â±_Ãƒâ€¡Ã‰â„¢rÃ…Å¸Ã‰â„¢nbÃ‰â„¢_CÃƒÂ¼mÃ‰â„¢ axÃ…Å¸amÃ„Â±_CÃƒÂ¼mÃ‰â„¢_Ã…Å¾Ã‰â„¢nbÃ‰â„¢'.split('_'),
        weekdaysShort : 'Baz_BzE_Ãƒâ€¡Ax_Ãƒâ€¡Ã‰â„¢r_CAx_CÃƒÂ¼m_Ã…Å¾Ã‰â„¢n'.split('_'),
        weekdaysMin : 'Bz_BE_Ãƒâ€¡A_Ãƒâ€¡Ã‰â„¢_CA_CÃƒÂ¼_Ã…Å¾Ã‰â„¢'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[bugÃƒÂ¼n saat] LT',
            nextDay : '[sabah saat] LT',
            nextWeek : '[gÃ‰â„¢lÃ‰â„¢n hÃ‰â„¢ftÃ‰â„¢] dddd [saat] LT',
            lastDay : '[dÃƒÂ¼nÃ‰â„¢n] LT',
            lastWeek : '[keÃƒÂ§Ã‰â„¢n hÃ‰â„¢ftÃ‰â„¢] dddd [saat] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s sonra',
            past : '%s Ã‰â„¢vvÃ‰â„¢l',
            s : 'birneÃƒÂ§Ã‰â„¢ saniyyÃ‰â„¢',
            m : 'bir dÃ‰â„¢qiqÃ‰â„¢',
            mm : '%d dÃ‰â„¢qiqÃ‰â„¢',
            h : 'bir saat',
            hh : '%d saat',
            d : 'bir gÃƒÂ¼n',
            dd : '%d gÃƒÂ¼n',
            M : 'bir ay',
            MM : '%d ay',
            y : 'bir il',
            yy : '%d il'
        },
        meridiemParse: /gecÃ‰â„¢|sÃ‰â„¢hÃ‰â„¢r|gÃƒÂ¼ndÃƒÂ¼z|axÃ…Å¸am/,
        isPM : function (input) {
            return /^(gÃƒÂ¼ndÃƒÂ¼z|axÃ…Å¸am)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'gecÃ‰â„¢';
            } else if (hour < 12) {
                return 'sÃ‰â„¢hÃ‰â„¢r';
            } else if (hour < 17) {
                return 'gÃƒÂ¼ndÃƒÂ¼z';
            } else {
                return 'axÃ…Å¸am';
            }
        },
        ordinalParse: /\d{1,2}-(Ã„Â±ncÃ„Â±|inci|nci|ÃƒÂ¼ncÃƒÂ¼|ncÃ„Â±|uncu)/,
        ordinal : function (number) {
            if (number === 0) {  // special case for zero
                return number + '-Ã„Â±ncÃ„Â±';
            }
            var a = number % 10,
                b = number % 100 - a,
                c = number >= 100 ? 100 : null;

            return number + (suffixes[a] || suffixes[b] || suffixes[c]);
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : belarusian (be)
// author : Dmitry Demidov : https://github.com/demidov91
// author: Praleska: http://praleska.pro/
// Author : Menelion ElensÃƒÂºle : https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            'mm': withoutSuffix ? 'Ã‘â€¦ÃÂ²Ã‘â€“ÃÂ»Ã‘â€“ÃÂ½ÃÂ°_Ã‘â€¦ÃÂ²Ã‘â€“ÃÂ»Ã‘â€“ÃÂ½Ã‘â€¹_Ã‘â€¦ÃÂ²Ã‘â€“ÃÂ»Ã‘â€“ÃÂ½' : 'Ã‘â€¦ÃÂ²Ã‘â€“ÃÂ»Ã‘â€“ÃÂ½Ã‘Æ’_Ã‘â€¦ÃÂ²Ã‘â€“ÃÂ»Ã‘â€“ÃÂ½Ã‘â€¹_Ã‘â€¦ÃÂ²Ã‘â€“ÃÂ»Ã‘â€“ÃÂ½',
            'hh': withoutSuffix ? 'ÃÂ³ÃÂ°ÃÂ´ÃÂ·Ã‘â€“ÃÂ½ÃÂ°_ÃÂ³ÃÂ°ÃÂ´ÃÂ·Ã‘â€“ÃÂ½Ã‘â€¹_ÃÂ³ÃÂ°ÃÂ´ÃÂ·Ã‘â€“ÃÂ½' : 'ÃÂ³ÃÂ°ÃÂ´ÃÂ·Ã‘â€“ÃÂ½Ã‘Æ’_ÃÂ³ÃÂ°ÃÂ´ÃÂ·Ã‘â€“ÃÂ½Ã‘â€¹_ÃÂ³ÃÂ°ÃÂ´ÃÂ·Ã‘â€“ÃÂ½',
            'dd': 'ÃÂ´ÃÂ·ÃÂµÃÂ½Ã‘Å’_ÃÂ´ÃÂ½Ã‘â€“_ÃÂ´ÃÂ·Ã‘â€˜ÃÂ½',
            'MM': 'ÃÂ¼ÃÂµÃ‘ÂÃ‘ÂÃ‘â€ _ÃÂ¼ÃÂµÃ‘ÂÃ‘ÂÃ‘â€ Ã‘â€¹_ÃÂ¼ÃÂµÃ‘ÂÃ‘ÂÃ‘â€ ÃÂ°Ã‘Å¾',
            'yy': 'ÃÂ³ÃÂ¾ÃÂ´_ÃÂ³ÃÂ°ÃÂ´Ã‘â€¹_ÃÂ³ÃÂ°ÃÂ´ÃÂ¾Ã‘Å¾'
        };
        if (key === 'm') {
            return withoutSuffix ? 'Ã‘â€¦ÃÂ²Ã‘â€“ÃÂ»Ã‘â€“ÃÂ½ÃÂ°' : 'Ã‘â€¦ÃÂ²Ã‘â€“ÃÂ»Ã‘â€“ÃÂ½Ã‘Æ’';
        }
        else if (key === 'h') {
            return withoutSuffix ? 'ÃÂ³ÃÂ°ÃÂ´ÃÂ·Ã‘â€“ÃÂ½ÃÂ°' : 'ÃÂ³ÃÂ°ÃÂ´ÃÂ·Ã‘â€“ÃÂ½Ã‘Æ’';
        }
        else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'Ã‘ÂÃ‘â€šÃ‘Æ’ÃÂ´ÃÂ·ÃÂµÃÂ½Ã‘Å’_ÃÂ»Ã‘Å½Ã‘â€šÃ‘â€¹_Ã‘ÂÃÂ°ÃÂºÃÂ°ÃÂ²Ã‘â€“ÃÂº_ÃÂºÃ‘â‚¬ÃÂ°Ã‘ÂÃÂ°ÃÂ²Ã‘â€“ÃÂº_Ã‘â€šÃ‘â‚¬ÃÂ°ÃÂ²ÃÂµÃÂ½Ã‘Å’_Ã‘â€¡Ã‘ÂÃ‘â‚¬ÃÂ²ÃÂµÃÂ½Ã‘Å’_ÃÂ»Ã‘â€“ÃÂ¿ÃÂµÃÂ½Ã‘Å’_ÃÂ¶ÃÂ½Ã‘â€“ÃÂ²ÃÂµÃÂ½Ã‘Å’_ÃÂ²ÃÂµÃ‘â‚¬ÃÂ°Ã‘ÂÃÂµÃÂ½Ã‘Å’_ÃÂºÃÂ°Ã‘ÂÃ‘â€šÃ‘â‚¬Ã‘â€¹Ã‘â€¡ÃÂ½Ã‘â€“ÃÂº_ÃÂ»Ã‘â€“Ã‘ÂÃ‘â€šÃÂ°ÃÂ¿ÃÂ°ÃÂ´_Ã‘ÂÃÂ½ÃÂµÃÂ¶ÃÂ°ÃÂ½Ã‘Å’'.split('_'),
            'accusative': 'Ã‘ÂÃ‘â€šÃ‘Æ’ÃÂ´ÃÂ·ÃÂµÃÂ½Ã‘Â_ÃÂ»Ã‘Å½Ã‘â€šÃÂ°ÃÂ³ÃÂ°_Ã‘ÂÃÂ°ÃÂºÃÂ°ÃÂ²Ã‘â€“ÃÂºÃÂ°_ÃÂºÃ‘â‚¬ÃÂ°Ã‘ÂÃÂ°ÃÂ²Ã‘â€“ÃÂºÃÂ°_Ã‘â€šÃ‘â‚¬ÃÂ°Ã‘Å¾ÃÂ½Ã‘Â_Ã‘â€¡Ã‘ÂÃ‘â‚¬ÃÂ²ÃÂµÃÂ½Ã‘Â_ÃÂ»Ã‘â€“ÃÂ¿ÃÂµÃÂ½Ã‘Â_ÃÂ¶ÃÂ½Ã‘â€“Ã‘Å¾ÃÂ½Ã‘Â_ÃÂ²ÃÂµÃ‘â‚¬ÃÂ°Ã‘ÂÃÂ½Ã‘Â_ÃÂºÃÂ°Ã‘ÂÃ‘â€šÃ‘â‚¬Ã‘â€¹Ã‘â€¡ÃÂ½Ã‘â€“ÃÂºÃÂ°_ÃÂ»Ã‘â€“Ã‘ÂÃ‘â€šÃÂ°ÃÂ¿ÃÂ°ÃÂ´ÃÂ°_Ã‘ÂÃÂ½ÃÂµÃÂ¶ÃÂ½Ã‘Â'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'ÃÂ½Ã‘ÂÃÂ´ÃÂ·ÃÂµÃÂ»Ã‘Â_ÃÂ¿ÃÂ°ÃÂ½Ã‘ÂÃÂ´ÃÂ·ÃÂµÃÂ»ÃÂ°ÃÂº_ÃÂ°Ã‘Å¾Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ°ÃÂº_Ã‘ÂÃÂµÃ‘â‚¬ÃÂ°ÃÂ´ÃÂ°_Ã‘â€¡ÃÂ°Ã‘â€ ÃÂ²ÃÂµÃ‘â‚¬_ÃÂ¿Ã‘ÂÃ‘â€šÃÂ½Ã‘â€“Ã‘â€ ÃÂ°_Ã‘ÂÃ‘Æ’ÃÂ±ÃÂ¾Ã‘â€šÃÂ°'.split('_'),
            'accusative': 'ÃÂ½Ã‘ÂÃÂ´ÃÂ·ÃÂµÃÂ»Ã‘Å½_ÃÂ¿ÃÂ°ÃÂ½Ã‘ÂÃÂ´ÃÂ·ÃÂµÃÂ»ÃÂ°ÃÂº_ÃÂ°Ã‘Å¾Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ°ÃÂº_Ã‘ÂÃÂµÃ‘â‚¬ÃÂ°ÃÂ´Ã‘Æ’_Ã‘â€¡ÃÂ°Ã‘â€ ÃÂ²ÃÂµÃ‘â‚¬_ÃÂ¿Ã‘ÂÃ‘â€šÃÂ½Ã‘â€“Ã‘â€ Ã‘Æ’_Ã‘ÂÃ‘Æ’ÃÂ±ÃÂ¾Ã‘â€šÃ‘Æ’'.split('_')
        },

        nounCase = (/\[ ?[Ãâ€™ÃÂ²] ?(?:ÃÂ¼Ã‘â€“ÃÂ½Ã‘Æ’ÃÂ»Ã‘Æ’Ã‘Å½|ÃÂ½ÃÂ°Ã‘ÂÃ‘â€šÃ‘Æ’ÃÂ¿ÃÂ½Ã‘Æ’Ã‘Å½)? ?\] ?dddd/).test(format) ?
            'accusative' :
            'nominative';

        return weekdays[nounCase][m.day()];
    }

    return moment.defineLocale('be', {
        months : monthsCaseReplace,
        monthsShort : 'Ã‘ÂÃ‘â€šÃ‘Æ’ÃÂ´_ÃÂ»Ã‘Å½Ã‘â€š_Ã‘ÂÃÂ°ÃÂº_ÃÂºÃ‘â‚¬ÃÂ°Ã‘Â_Ã‘â€šÃ‘â‚¬ÃÂ°ÃÂ²_Ã‘â€¡Ã‘ÂÃ‘â‚¬ÃÂ²_ÃÂ»Ã‘â€“ÃÂ¿_ÃÂ¶ÃÂ½Ã‘â€“ÃÂ²_ÃÂ²ÃÂµÃ‘â‚¬_ÃÂºÃÂ°Ã‘ÂÃ‘â€š_ÃÂ»Ã‘â€“Ã‘ÂÃ‘â€š_Ã‘ÂÃÂ½ÃÂµÃÂ¶'.split('_'),
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'ÃÂ½ÃÂ´_ÃÂ¿ÃÂ½_ÃÂ°Ã‘â€š_Ã‘ÂÃ‘â‚¬_Ã‘â€¡Ã‘â€ _ÃÂ¿Ã‘â€š_Ã‘ÂÃÂ±'.split('_'),
        weekdaysMin : 'ÃÂ½ÃÂ´_ÃÂ¿ÃÂ½_ÃÂ°Ã‘â€š_Ã‘ÂÃ‘â‚¬_Ã‘â€¡Ã‘â€ _ÃÂ¿Ã‘â€š_Ã‘ÂÃÂ±'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY ÃÂ³.',
            LLL : 'D MMMM YYYY ÃÂ³., LT',
            LLLL : 'dddd, D MMMM YYYY ÃÂ³., LT'
        },
        calendar : {
            sameDay: '[ÃÂ¡Ã‘â€˜ÃÂ½ÃÂ½Ã‘Â Ã‘Å¾] LT',
            nextDay: '[Ãâ€”ÃÂ°Ã‘Å¾Ã‘â€šÃ‘â‚¬ÃÂ° Ã‘Å¾] LT',
            lastDay: '[ÃÂ£Ã‘â€¡ÃÂ¾Ã‘â‚¬ÃÂ° Ã‘Å¾] LT',
            nextWeek: function () {
                return '[ÃÂ£] dddd [Ã‘Å¾] LT';
            },
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 5:
                case 6:
                    return '[ÃÂ£ ÃÂ¼Ã‘â€“ÃÂ½Ã‘Æ’ÃÂ»Ã‘Æ’Ã‘Å½] dddd [Ã‘Å¾] LT';
                case 1:
                case 2:
                case 4:
                    return '[ÃÂ£ ÃÂ¼Ã‘â€“ÃÂ½Ã‘Æ’ÃÂ»Ã‘â€¹] dddd [Ã‘Å¾] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'ÃÂ¿Ã‘â‚¬ÃÂ°ÃÂ· %s',
            past : '%s Ã‘â€šÃÂ°ÃÂ¼Ã‘Æ’',
            s : 'ÃÂ½ÃÂµÃÂºÃÂ°ÃÂ»Ã‘Å’ÃÂºÃ‘â€“ Ã‘ÂÃÂµÃÂºÃ‘Æ’ÃÂ½ÃÂ´',
            m : relativeTimeWithPlural,
            mm : relativeTimeWithPlural,
            h : relativeTimeWithPlural,
            hh : relativeTimeWithPlural,
            d : 'ÃÂ´ÃÂ·ÃÂµÃÂ½Ã‘Å’',
            dd : relativeTimeWithPlural,
            M : 'ÃÂ¼ÃÂµÃ‘ÂÃ‘ÂÃ‘â€ ',
            MM : relativeTimeWithPlural,
            y : 'ÃÂ³ÃÂ¾ÃÂ´',
            yy : relativeTimeWithPlural
        },
        meridiemParse: /ÃÂ½ÃÂ¾Ã‘â€¡Ã‘â€¹|Ã‘â‚¬ÃÂ°ÃÂ½Ã‘â€“Ã‘â€ Ã‘â€¹|ÃÂ´ÃÂ½Ã‘Â|ÃÂ²ÃÂµÃ‘â€¡ÃÂ°Ã‘â‚¬ÃÂ°/,
        isPM : function (input) {
            return /^(ÃÂ´ÃÂ½Ã‘Â|ÃÂ²ÃÂµÃ‘â€¡ÃÂ°Ã‘â‚¬ÃÂ°)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'ÃÂ½ÃÂ¾Ã‘â€¡Ã‘â€¹';
            } else if (hour < 12) {
                return 'Ã‘â‚¬ÃÂ°ÃÂ½Ã‘â€“Ã‘â€ Ã‘â€¹';
            } else if (hour < 17) {
                return 'ÃÂ´ÃÂ½Ã‘Â';
            } else {
                return 'ÃÂ²ÃÂµÃ‘â€¡ÃÂ°Ã‘â‚¬ÃÂ°';
            }
        },

        ordinalParse: /\d{1,2}-(Ã‘â€“|Ã‘â€¹|ÃÂ³ÃÂ°)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
            case 'w':
            case 'W':
                return (number % 10 === 2 || number % 10 === 3) && (number % 100 !== 12 && number % 100 !== 13) ? number + '-Ã‘â€“' : number + '-Ã‘â€¹';
            case 'D':
                return number + '-ÃÂ³ÃÂ°';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : bulgarian (bg)
// author : Krasen Borisov : https://github.com/kraz

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('bg', {
        months : 'Ã‘ÂÃÂ½Ã‘Æ’ÃÂ°Ã‘â‚¬ÃÂ¸_Ã‘â€žÃÂµÃÂ²Ã‘â‚¬Ã‘Æ’ÃÂ°Ã‘â‚¬ÃÂ¸_ÃÂ¼ÃÂ°Ã‘â‚¬Ã‘â€š_ÃÂ°ÃÂ¿Ã‘â‚¬ÃÂ¸ÃÂ»_ÃÂ¼ÃÂ°ÃÂ¹_Ã‘Å½ÃÂ½ÃÂ¸_Ã‘Å½ÃÂ»ÃÂ¸_ÃÂ°ÃÂ²ÃÂ³Ã‘Æ’Ã‘ÂÃ‘â€š_Ã‘ÂÃÂµÃÂ¿Ã‘â€šÃÂµÃÂ¼ÃÂ²Ã‘â‚¬ÃÂ¸_ÃÂ¾ÃÂºÃ‘â€šÃÂ¾ÃÂ¼ÃÂ²Ã‘â‚¬ÃÂ¸_ÃÂ½ÃÂ¾ÃÂµÃÂ¼ÃÂ²Ã‘â‚¬ÃÂ¸_ÃÂ´ÃÂµÃÂºÃÂµÃÂ¼ÃÂ²Ã‘â‚¬ÃÂ¸'.split('_'),
        monthsShort : 'Ã‘ÂÃÂ½Ã‘â‚¬_Ã‘â€žÃÂµÃÂ²_ÃÂ¼ÃÂ°Ã‘â‚¬_ÃÂ°ÃÂ¿Ã‘â‚¬_ÃÂ¼ÃÂ°ÃÂ¹_Ã‘Å½ÃÂ½ÃÂ¸_Ã‘Å½ÃÂ»ÃÂ¸_ÃÂ°ÃÂ²ÃÂ³_Ã‘ÂÃÂµÃÂ¿_ÃÂ¾ÃÂºÃ‘â€š_ÃÂ½ÃÂ¾ÃÂµ_ÃÂ´ÃÂµÃÂº'.split('_'),
        weekdays : 'ÃÂ½ÃÂµÃÂ´ÃÂµÃÂ»Ã‘Â_ÃÂ¿ÃÂ¾ÃÂ½ÃÂµÃÂ´ÃÂµÃÂ»ÃÂ½ÃÂ¸ÃÂº_ÃÂ²Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ½ÃÂ¸ÃÂº_Ã‘ÂÃ‘â‚¬Ã‘ÂÃÂ´ÃÂ°_Ã‘â€¡ÃÂµÃ‘â€šÃÂ²Ã‘Å Ã‘â‚¬Ã‘â€šÃ‘Å ÃÂº_ÃÂ¿ÃÂµÃ‘â€šÃ‘Å ÃÂº_Ã‘ÂÃ‘Å ÃÂ±ÃÂ¾Ã‘â€šÃÂ°'.split('_'),
        weekdaysShort : 'ÃÂ½ÃÂµÃÂ´_ÃÂ¿ÃÂ¾ÃÂ½_ÃÂ²Ã‘â€šÃÂ¾_Ã‘ÂÃ‘â‚¬Ã‘Â_Ã‘â€¡ÃÂµÃ‘â€š_ÃÂ¿ÃÂµÃ‘â€š_Ã‘ÂÃ‘Å ÃÂ±'.split('_'),
        weekdaysMin : 'ÃÂ½ÃÂ´_ÃÂ¿ÃÂ½_ÃÂ²Ã‘â€š_Ã‘ÂÃ‘â‚¬_Ã‘â€¡Ã‘â€š_ÃÂ¿Ã‘â€š_Ã‘ÂÃÂ±'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'D.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Ãâ€ÃÂ½ÃÂµÃ‘Â ÃÂ²] LT',
            nextDay : '[ÃÂ£Ã‘â€šÃ‘â‚¬ÃÂµ ÃÂ²] LT',
            nextWeek : 'dddd [ÃÂ²] LT',
            lastDay : '[Ãâ€™Ã‘â€¡ÃÂµÃ‘â‚¬ÃÂ° ÃÂ²] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[Ãâ€™ ÃÂ¸ÃÂ·ÃÂ¼ÃÂ¸ÃÂ½ÃÂ°ÃÂ»ÃÂ°Ã‘â€šÃÂ°] dddd [ÃÂ²] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[Ãâ€™ ÃÂ¸ÃÂ·ÃÂ¼ÃÂ¸ÃÂ½ÃÂ°ÃÂ»ÃÂ¸Ã‘Â] dddd [ÃÂ²] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'Ã‘ÂÃÂ»ÃÂµÃÂ´ %s',
            past : 'ÃÂ¿Ã‘â‚¬ÃÂµÃÂ´ÃÂ¸ %s',
            s : 'ÃÂ½Ã‘ÂÃÂºÃÂ¾ÃÂ»ÃÂºÃÂ¾ Ã‘ÂÃÂµÃÂºÃ‘Æ’ÃÂ½ÃÂ´ÃÂ¸',
            m : 'ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃÂ°',
            mm : '%d ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃÂ¸',
            h : 'Ã‘â€¡ÃÂ°Ã‘Â',
            hh : '%d Ã‘â€¡ÃÂ°Ã‘ÂÃÂ°',
            d : 'ÃÂ´ÃÂµÃÂ½',
            dd : '%d ÃÂ´ÃÂ½ÃÂ¸',
            M : 'ÃÂ¼ÃÂµÃ‘ÂÃÂµÃ‘â€ ',
            MM : '%d ÃÂ¼ÃÂµÃ‘ÂÃÂµÃ‘â€ ÃÂ°',
            y : 'ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½ÃÂ°',
            yy : '%d ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½ÃÂ¸'
        },
        ordinalParse: /\d{1,2}-(ÃÂµÃÂ²|ÃÂµÃÂ½|Ã‘â€šÃÂ¸|ÃÂ²ÃÂ¸|Ã‘â‚¬ÃÂ¸|ÃÂ¼ÃÂ¸)/,
        ordinal : function (number) {
            var lastDigit = number % 10,
                last2Digits = number % 100;
            if (number === 0) {
                return number + '-ÃÂµÃÂ²';
            } else if (last2Digits === 0) {
                return number + '-ÃÂµÃÂ½';
            } else if (last2Digits > 10 && last2Digits < 20) {
                return number + '-Ã‘â€šÃÂ¸';
            } else if (lastDigit === 1) {
                return number + '-ÃÂ²ÃÂ¸';
            } else if (lastDigit === 2) {
                return number + '-Ã‘â‚¬ÃÂ¸';
            } else if (lastDigit === 7 || lastDigit === 8) {
                return number + '-ÃÂ¼ÃÂ¸';
            } else {
                return number + '-Ã‘â€šÃÂ¸';
            }
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Bengali (bn)
// author : Kaushik Gandhi : https://github.com/kaushikgandhi

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ã Â§Â§',
        '2': 'Ã Â§Â¨',
        '3': 'Ã Â§Â©',
        '4': 'Ã Â§Âª',
        '5': 'Ã Â§Â«',
        '6': 'Ã Â§Â¬',
        '7': 'Ã Â§Â­',
        '8': 'Ã Â§Â®',
        '9': 'Ã Â§Â¯',
        '0': 'Ã Â§Â¦'
    },
    numberMap = {
        'Ã Â§Â§': '1',
        'Ã Â§Â¨': '2',
        'Ã Â§Â©': '3',
        'Ã Â§Âª': '4',
        'Ã Â§Â«': '5',
        'Ã Â§Â¬': '6',
        'Ã Â§Â­': '7',
        'Ã Â§Â®': '8',
        'Ã Â§Â¯': '9',
        'Ã Â§Â¦': '0'
    };

    return moment.defineLocale('bn', {
        months : 'Ã Â¦Å“Ã Â¦Â¾Ã Â¦Â¨Ã Â§ÂÃ Â¦Â¯Ã Â¦Â¼Ã Â¦Â¾Ã Â¦Â°Ã Â§â‚¬_Ã Â¦Â«Ã Â§â€¡Ã Â¦Â¬Ã Â§ÂÃ Â¦Â¯Ã Â¦Â¼Ã Â¦Â¾Ã Â¦Â°Ã Â§â‚¬_Ã Â¦Â®Ã Â¦Â¾Ã Â¦Â°Ã Â§ÂÃ Â¦Å¡_Ã Â¦ÂÃ Â¦ÂªÃ Â§ÂÃ Â¦Â°Ã Â¦Â¿Ã Â¦Â²_Ã Â¦Â®Ã Â§â€¡_Ã Â¦Å“Ã Â§ÂÃ Â¦Â¨_Ã Â¦Å“Ã Â§ÂÃ Â¦Â²Ã Â¦Â¾Ã Â¦â€¡_Ã Â¦â€¦Ã Â¦â€”Ã Â¦Â¾Ã Â¦Â¸Ã Â§ÂÃ Â¦Å¸_Ã Â¦Â¸Ã Â§â€¡Ã Â¦ÂªÃ Â§ÂÃ Â¦Å¸Ã Â§â€¡Ã Â¦Â®Ã Â§ÂÃ Â¦Â¬Ã Â¦Â°_Ã Â¦â€¦Ã Â¦â€¢Ã Â§ÂÃ Â¦Å¸Ã Â§â€¹Ã Â¦Â¬Ã Â¦Â°_Ã Â¦Â¨Ã Â¦Â­Ã Â§â€¡Ã Â¦Â®Ã Â§ÂÃ Â¦Â¬Ã Â¦Â°_Ã Â¦Â¡Ã Â¦Â¿Ã Â¦Â¸Ã Â§â€¡Ã Â¦Â®Ã Â§ÂÃ Â¦Â¬Ã Â¦Â°'.split('_'),
        monthsShort : 'Ã Â¦Å“Ã Â¦Â¾Ã Â¦Â¨Ã Â§Â_Ã Â¦Â«Ã Â§â€¡Ã Â¦Â¬_Ã Â¦Â®Ã Â¦Â¾Ã Â¦Â°Ã Â§ÂÃ Â¦Å¡_Ã Â¦ÂÃ Â¦ÂªÃ Â¦Â°_Ã Â¦Â®Ã Â§â€¡_Ã Â¦Å“Ã Â§ÂÃ Â¦Â¨_Ã Â¦Å“Ã Â§ÂÃ Â¦Â²_Ã Â¦â€¦Ã Â¦â€”_Ã Â¦Â¸Ã Â§â€¡Ã Â¦ÂªÃ Â§ÂÃ Â¦Å¸_Ã Â¦â€¦Ã Â¦â€¢Ã Â§ÂÃ Â¦Å¸Ã Â§â€¹_Ã Â¦Â¨Ã Â¦Â­_Ã Â¦Â¡Ã Â¦Â¿Ã Â¦Â¸Ã Â§â€¡Ã Â¦Â®Ã Â§Â'.split('_'),
        weekdays : 'Ã Â¦Â°Ã Â¦Â¬Ã Â¦Â¿Ã Â¦Â¬Ã Â¦Â¾Ã Â¦Â°_Ã Â¦Â¸Ã Â§â€¹Ã Â¦Â®Ã Â¦Â¬Ã Â¦Â¾Ã Â¦Â°_Ã Â¦Â®Ã Â¦â„¢Ã Â§ÂÃ Â¦â€”Ã Â¦Â²Ã Â¦Â¬Ã Â¦Â¾Ã Â¦Â°_Ã Â¦Â¬Ã Â§ÂÃ Â¦Â§Ã Â¦Â¬Ã Â¦Â¾Ã Â¦Â°_Ã Â¦Â¬Ã Â§Æ’Ã Â¦Â¹Ã Â¦Â¸Ã Â§ÂÃ Â¦ÂªÃ Â¦Â¤Ã Â§ÂÃ Â¦Â¤Ã Â¦Â¿Ã Â¦Â¬Ã Â¦Â¾Ã Â¦Â°_Ã Â¦Â¶Ã Â§ÂÃ Â¦â€¢Ã Â§ÂÃ Â¦Â°Ã Â§ÂÃ Â¦Â¬Ã Â¦Â¾Ã Â¦Â°_Ã Â¦Â¶Ã Â¦Â¨Ã Â¦Â¿Ã Â¦Â¬Ã Â¦Â¾Ã Â¦Â°'.split('_'),
        weekdaysShort : 'Ã Â¦Â°Ã Â¦Â¬Ã Â¦Â¿_Ã Â¦Â¸Ã Â§â€¹Ã Â¦Â®_Ã Â¦Â®Ã Â¦â„¢Ã Â§ÂÃ Â¦â€”Ã Â¦Â²_Ã Â¦Â¬Ã Â§ÂÃ Â¦Â§_Ã Â¦Â¬Ã Â§Æ’Ã Â¦Â¹Ã Â¦Â¸Ã Â§ÂÃ Â¦ÂªÃ Â¦Â¤Ã Â§ÂÃ Â¦Â¤Ã Â¦Â¿_Ã Â¦Â¶Ã Â§ÂÃ Â¦â€¢Ã Â§ÂÃ Â¦Â°Ã Â§Â_Ã Â¦Â¶Ã Â¦Â¨Ã Â¦Â¿'.split('_'),
        weekdaysMin : 'Ã Â¦Â°Ã Â¦Â¬_Ã Â¦Â¸Ã Â¦Â®_Ã Â¦Â®Ã Â¦â„¢Ã Â§ÂÃ Â¦â€”_Ã Â¦Â¬Ã Â§Â_Ã Â¦Â¬Ã Â§ÂÃ Â¦Â°Ã Â¦Â¿Ã Â¦Â¹_Ã Â¦Â¶Ã Â§Â_Ã Â¦Â¶Ã Â¦Â¨Ã Â¦Â¿'.split('_'),
        longDateFormat : {
            LT : 'A h:mm Ã Â¦Â¸Ã Â¦Â®Ã Â¦Â¯Ã Â¦Â¼',
            LTS : 'A h:mm:ss Ã Â¦Â¸Ã Â¦Â®Ã Â¦Â¯Ã Â¦Â¼',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[Ã Â¦â€ Ã Â¦Å“] LT',
            nextDay : '[Ã Â¦â€ Ã Â¦â€”Ã Â¦Â¾Ã Â¦Â®Ã Â§â‚¬Ã Â¦â€¢Ã Â¦Â¾Ã Â¦Â²] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[Ã Â¦â€”Ã Â¦Â¤Ã Â¦â€¢Ã Â¦Â¾Ã Â¦Â²] LT',
            lastWeek : '[Ã Â¦â€”Ã Â¦Â¤] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s Ã Â¦ÂªÃ Â¦Â°Ã Â§â€¡',
            past : '%s Ã Â¦â€ Ã Â¦â€”Ã Â§â€¡',
            s : 'Ã Â¦â€¢Ã Â¦ÂÃ Â¦â€¢ Ã Â¦Â¸Ã Â§â€¡Ã Â¦â€¢Ã Â§â€¡Ã Â¦Â¨Ã Â§ÂÃ Â¦Â¡',
            m : 'Ã Â¦ÂÃ Â¦â€¢ Ã Â¦Â®Ã Â¦Â¿Ã Â¦Â¨Ã Â¦Â¿Ã Â¦Å¸',
            mm : '%d Ã Â¦Â®Ã Â¦Â¿Ã Â¦Â¨Ã Â¦Â¿Ã Â¦Å¸',
            h : 'Ã Â¦ÂÃ Â¦â€¢ Ã Â¦ËœÃ Â¦Â¨Ã Â§ÂÃ Â¦Å¸Ã Â¦Â¾',
            hh : '%d Ã Â¦ËœÃ Â¦Â¨Ã Â§ÂÃ Â¦Å¸Ã Â¦Â¾',
            d : 'Ã Â¦ÂÃ Â¦â€¢ Ã Â¦Â¦Ã Â¦Â¿Ã Â¦Â¨',
            dd : '%d Ã Â¦Â¦Ã Â¦Â¿Ã Â¦Â¨',
            M : 'Ã Â¦ÂÃ Â¦â€¢ Ã Â¦Â®Ã Â¦Â¾Ã Â¦Â¸',
            MM : '%d Ã Â¦Â®Ã Â¦Â¾Ã Â¦Â¸',
            y : 'Ã Â¦ÂÃ Â¦â€¢ Ã Â¦Â¬Ã Â¦â€ºÃ Â¦Â°',
            yy : '%d Ã Â¦Â¬Ã Â¦â€ºÃ Â¦Â°'
        },
        preparse: function (string) {
            return string.replace(/[Ã Â§Â§Ã Â§Â¨Ã Â§Â©Ã Â§ÂªÃ Â§Â«Ã Â§Â¬Ã Â§Â­Ã Â§Â®Ã Â§Â¯Ã Â§Â¦]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /Ã Â¦Â°Ã Â¦Â¾Ã Â¦Â¤|Ã Â¦Â¶Ã Â¦â€¢Ã Â¦Â¾Ã Â¦Â²|Ã Â¦Â¦Ã Â§ÂÃ Â¦ÂªÃ Â§ÂÃ Â¦Â°|Ã Â¦Â¬Ã Â¦Â¿Ã Â¦â€¢Ã Â§â€¡Ã Â¦Â²|Ã Â¦Â°Ã Â¦Â¾Ã Â¦Â¤/,
        isPM: function (input) {
            return /^(Ã Â¦Â¦Ã Â§ÂÃ Â¦ÂªÃ Â§ÂÃ Â¦Â°|Ã Â¦Â¬Ã Â¦Â¿Ã Â¦â€¢Ã Â§â€¡Ã Â¦Â²|Ã Â¦Â°Ã Â¦Â¾Ã Â¦Â¤)$/.test(input);
        },
        //Bengali is a vast language its spoken
        //in different forms in various parts of the world.
        //I have just generalized with most common one used
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'Ã Â¦Â°Ã Â¦Â¾Ã Â¦Â¤';
            } else if (hour < 10) {
                return 'Ã Â¦Â¶Ã Â¦â€¢Ã Â¦Â¾Ã Â¦Â²';
            } else if (hour < 17) {
                return 'Ã Â¦Â¦Ã Â§ÂÃ Â¦ÂªÃ Â§ÂÃ Â¦Â°';
            } else if (hour < 20) {
                return 'Ã Â¦Â¬Ã Â¦Â¿Ã Â¦â€¢Ã Â§â€¡Ã Â¦Â²';
            } else {
                return 'Ã Â¦Â°Ã Â¦Â¾Ã Â¦Â¤';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : tibetan (bo)
// author : Thupten N. Chakrishar : https://github.com/vajradog

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ã Â¼Â¡',
        '2': 'Ã Â¼Â¢',
        '3': 'Ã Â¼Â£',
        '4': 'Ã Â¼Â¤',
        '5': 'Ã Â¼Â¥',
        '6': 'Ã Â¼Â¦',
        '7': 'Ã Â¼Â§',
        '8': 'Ã Â¼Â¨',
        '9': 'Ã Â¼Â©',
        '0': 'Ã Â¼ '
    },
    numberMap = {
        'Ã Â¼Â¡': '1',
        'Ã Â¼Â¢': '2',
        'Ã Â¼Â£': '3',
        'Ã Â¼Â¤': '4',
        'Ã Â¼Â¥': '5',
        'Ã Â¼Â¦': '6',
        'Ã Â¼Â§': '7',
        'Ã Â¼Â¨': '8',
        'Ã Â¼Â©': '9',
        'Ã Â¼ ': '0'
    };

    return moment.defineLocale('bo', {
        months : 'Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€˜Ã Â½â€žÃ Â¼â€¹Ã Â½â€Ã Â½Â¼_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€šÃ Â½â€°Ã Â½Â²Ã Â½Â¦Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€šÃ Â½Â¦Ã Â½Â´Ã Â½ËœÃ Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½Å¾Ã Â½Â²Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½Â£Ã Â¾â€Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€˜Ã Â¾Â²Ã Â½Â´Ã Â½â€šÃ Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½â€˜Ã Â½Â´Ã Â½â€œÃ Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½Â¢Ã Â¾â€™Ã Â¾Â±Ã Â½â€˜Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€˜Ã Â½â€šÃ Â½Â´Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½â€¦Ã Â½Â´Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½â€¦Ã Â½Â´Ã Â¼â€¹Ã Â½â€šÃ Â½â€¦Ã Â½Â²Ã Â½â€šÃ Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½â€¦Ã Â½Â´Ã Â¼â€¹Ã Â½â€šÃ Â½â€°Ã Â½Â²Ã Â½Â¦Ã Â¼â€¹Ã Â½â€'.split('_'),
        monthsShort : 'Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€˜Ã Â½â€žÃ Â¼â€¹Ã Â½â€Ã Â½Â¼_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€šÃ Â½â€°Ã Â½Â²Ã Â½Â¦Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€šÃ Â½Â¦Ã Â½Â´Ã Â½ËœÃ Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½Å¾Ã Â½Â²Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½Â£Ã Â¾â€Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€˜Ã Â¾Â²Ã Â½Â´Ã Â½â€šÃ Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½â€˜Ã Â½Â´Ã Â½â€œÃ Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½Â¢Ã Â¾â€™Ã Â¾Â±Ã Â½â€˜Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€˜Ã Â½â€šÃ Â½Â´Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½â€¦Ã Â½Â´Ã Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½â€¦Ã Â½Â´Ã Â¼â€¹Ã Â½â€šÃ Â½â€¦Ã Â½Â²Ã Â½â€šÃ Â¼â€¹Ã Â½â€_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€“Ã Â½â€¦Ã Â½Â´Ã Â¼â€¹Ã Â½â€šÃ Â½â€°Ã Â½Â²Ã Â½Â¦Ã Â¼â€¹Ã Â½â€'.split('_'),
        weekdays : 'Ã Â½â€šÃ Â½Å¸Ã Â½ Ã Â¼â€¹Ã Â½â€°Ã Â½Â²Ã Â¼â€¹Ã Â½ËœÃ Â¼â€¹_Ã Â½â€šÃ Â½Å¸Ã Â½ Ã Â¼â€¹Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹_Ã Â½â€šÃ Â½Å¸Ã Â½ Ã Â¼â€¹Ã Â½ËœÃ Â½Â²Ã Â½â€šÃ Â¼â€¹Ã Â½â€˜Ã Â½ËœÃ Â½Â¢Ã Â¼â€¹_Ã Â½â€šÃ Â½Å¸Ã Â½ Ã Â¼â€¹Ã Â½Â£Ã Â¾Â·Ã Â½â€šÃ Â¼â€¹Ã Â½â€Ã Â¼â€¹_Ã Â½â€šÃ Â½Å¸Ã Â½ Ã Â¼â€¹Ã Â½â€¢Ã Â½Â´Ã Â½Â¢Ã Â¼â€¹Ã Â½â€“Ã Â½Â´_Ã Â½â€šÃ Â½Å¸Ã Â½ Ã Â¼â€¹Ã Â½â€Ã Â¼â€¹Ã Â½Â¦Ã Â½â€žÃ Â½Â¦Ã Â¼â€¹_Ã Â½â€šÃ Â½Å¸Ã Â½ Ã Â¼â€¹Ã Â½Â¦Ã Â¾Â¤Ã Â½ÂºÃ Â½â€œÃ Â¼â€¹Ã Â½â€Ã Â¼â€¹'.split('_'),
        weekdaysShort : 'Ã Â½â€°Ã Â½Â²Ã Â¼â€¹Ã Â½ËœÃ Â¼â€¹_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹_Ã Â½ËœÃ Â½Â²Ã Â½â€šÃ Â¼â€¹Ã Â½â€˜Ã Â½ËœÃ Â½Â¢Ã Â¼â€¹_Ã Â½Â£Ã Â¾Â·Ã Â½â€šÃ Â¼â€¹Ã Â½â€Ã Â¼â€¹_Ã Â½â€¢Ã Â½Â´Ã Â½Â¢Ã Â¼â€¹Ã Â½â€“Ã Â½Â´_Ã Â½â€Ã Â¼â€¹Ã Â½Â¦Ã Â½â€žÃ Â½Â¦Ã Â¼â€¹_Ã Â½Â¦Ã Â¾Â¤Ã Â½ÂºÃ Â½â€œÃ Â¼â€¹Ã Â½â€Ã Â¼â€¹'.split('_'),
        weekdaysMin : 'Ã Â½â€°Ã Â½Â²Ã Â¼â€¹Ã Â½ËœÃ Â¼â€¹_Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹_Ã Â½ËœÃ Â½Â²Ã Â½â€šÃ Â¼â€¹Ã Â½â€˜Ã Â½ËœÃ Â½Â¢Ã Â¼â€¹_Ã Â½Â£Ã Â¾Â·Ã Â½â€šÃ Â¼â€¹Ã Â½â€Ã Â¼â€¹_Ã Â½â€¢Ã Â½Â´Ã Â½Â¢Ã Â¼â€¹Ã Â½â€“Ã Â½Â´_Ã Â½â€Ã Â¼â€¹Ã Â½Â¦Ã Â½â€žÃ Â½Â¦Ã Â¼â€¹_Ã Â½Â¦Ã Â¾Â¤Ã Â½ÂºÃ Â½â€œÃ Â¼â€¹Ã Â½â€Ã Â¼â€¹'.split('_'),
        longDateFormat : {
            LT : 'A h:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[Ã Â½â€˜Ã Â½Â²Ã Â¼â€¹Ã Â½Â¢Ã Â½Â²Ã Â½â€ž] LT',
            nextDay : '[Ã Â½Â¦Ã Â½â€žÃ Â¼â€¹Ã Â½â€°Ã Â½Â²Ã Â½â€œ] LT',
            nextWeek : '[Ã Â½â€“Ã Â½â€˜Ã Â½Â´Ã Â½â€œÃ Â¼â€¹Ã Â½â€¢Ã Â¾Â²Ã Â½â€šÃ Â¼â€¹Ã Â½Â¢Ã Â¾â€”Ã Â½ÂºÃ Â½Â¦Ã Â¼â€¹Ã Â½Ëœ], LT',
            lastDay : '[Ã Â½ÂÃ Â¼â€¹Ã Â½Â¦Ã Â½â€ž] LT',
            lastWeek : '[Ã Â½â€“Ã Â½â€˜Ã Â½Â´Ã Â½â€œÃ Â¼â€¹Ã Â½â€¢Ã Â¾Â²Ã Â½â€šÃ Â¼â€¹Ã Â½ËœÃ Â½ÂÃ Â½ Ã Â¼â€¹Ã Â½Ëœ] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s Ã Â½Â£Ã Â¼â€¹',
            past : '%s Ã Â½Â¦Ã Â¾â€Ã Â½â€œÃ Â¼â€¹Ã Â½Â£',
            s : 'Ã Â½Â£Ã Â½ËœÃ Â¼â€¹Ã Â½Â¦Ã Â½â€ž',
            m : 'Ã Â½Â¦Ã Â¾ÂÃ Â½Â¢Ã Â¼â€¹Ã Â½ËœÃ Â¼â€¹Ã Â½â€šÃ Â½â€¦Ã Â½Â²Ã Â½â€š',
            mm : '%d Ã Â½Â¦Ã Â¾ÂÃ Â½Â¢Ã Â¼â€¹Ã Â½Ëœ',
            h : 'Ã Â½â€ Ã Â½Â´Ã Â¼â€¹Ã Â½Å¡Ã Â½Â¼Ã Â½â€˜Ã Â¼â€¹Ã Â½â€šÃ Â½â€¦Ã Â½Â²Ã Â½â€š',
            hh : '%d Ã Â½â€ Ã Â½Â´Ã Â¼â€¹Ã Â½Å¡Ã Â½Â¼Ã Â½â€˜',
            d : 'Ã Â½â€°Ã Â½Â²Ã Â½â€œÃ Â¼â€¹Ã Â½â€šÃ Â½â€¦Ã Â½Â²Ã Â½â€š',
            dd : '%d Ã Â½â€°Ã Â½Â²Ã Â½â€œÃ Â¼â€¹',
            M : 'Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“Ã Â¼â€¹Ã Â½â€šÃ Â½â€¦Ã Â½Â²Ã Â½â€š',
            MM : '%d Ã Â½Å¸Ã Â¾Â³Ã Â¼â€¹Ã Â½â€“',
            y : 'Ã Â½Â£Ã Â½Â¼Ã Â¼â€¹Ã Â½â€šÃ Â½â€¦Ã Â½Â²Ã Â½â€š',
            yy : '%d Ã Â½Â£Ã Â½Â¼'
        },
        preparse: function (string) {
            return string.replace(/[Ã Â¼Â¡Ã Â¼Â¢Ã Â¼Â£Ã Â¼Â¤Ã Â¼Â¥Ã Â¼Â¦Ã Â¼Â§Ã Â¼Â¨Ã Â¼Â©Ã Â¼ ]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /Ã Â½ËœÃ Â½Å¡Ã Â½â€œÃ Â¼â€¹Ã Â½ËœÃ Â½Â¼|Ã Â½Å¾Ã Â½Â¼Ã Â½â€šÃ Â½Â¦Ã Â¼â€¹Ã Â½â‚¬Ã Â½Â¦|Ã Â½â€°Ã Â½Â²Ã Â½â€œÃ Â¼â€¹Ã Â½â€šÃ Â½Â´Ã Â½â€ž|Ã Â½â€˜Ã Â½â€šÃ Â½Â¼Ã Â½â€žÃ Â¼â€¹Ã Â½â€˜Ã Â½â€š|Ã Â½ËœÃ Â½Å¡Ã Â½â€œÃ Â¼â€¹Ã Â½ËœÃ Â½Â¼/,
        isPM: function (input) {
            return /^(Ã Â½â€°Ã Â½Â²Ã Â½â€œÃ Â¼â€¹Ã Â½â€šÃ Â½Â´Ã Â½â€ž|Ã Â½â€˜Ã Â½â€šÃ Â½Â¼Ã Â½â€žÃ Â¼â€¹Ã Â½â€˜Ã Â½â€š|Ã Â½ËœÃ Â½Å¡Ã Â½â€œÃ Â¼â€¹Ã Â½ËœÃ Â½Â¼)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'Ã Â½ËœÃ Â½Å¡Ã Â½â€œÃ Â¼â€¹Ã Â½ËœÃ Â½Â¼';
            } else if (hour < 10) {
                return 'Ã Â½Å¾Ã Â½Â¼Ã Â½â€šÃ Â½Â¦Ã Â¼â€¹Ã Â½â‚¬Ã Â½Â¦';
            } else if (hour < 17) {
                return 'Ã Â½â€°Ã Â½Â²Ã Â½â€œÃ Â¼â€¹Ã Â½â€šÃ Â½Â´Ã Â½â€ž';
            } else if (hour < 20) {
                return 'Ã Â½â€˜Ã Â½â€šÃ Â½Â¼Ã Â½â€žÃ Â¼â€¹Ã Â½â€˜Ã Â½â€š';
            } else {
                return 'Ã Â½ËœÃ Â½Å¡Ã Â½â€œÃ Â¼â€¹Ã Â½ËœÃ Â½Â¼';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : breton (br)
// author : Jean-Baptiste Le Duigou : https://github.com/jbleduigou

(function (factory) {
    factory(moment);
}(function (moment) {
    function relativeTimeWithMutation(number, withoutSuffix, key) {
        var format = {
            'mm': 'munutenn',
            'MM': 'miz',
            'dd': 'devezh'
        };
        return number + ' ' + mutation(format[key], number);
    }

    function specialMutationForYears(number) {
        switch (lastNumber(number)) {
        case 1:
        case 3:
        case 4:
        case 5:
        case 9:
            return number + ' bloaz';
        default:
            return number + ' vloaz';
        }
    }

    function lastNumber(number) {
        if (number > 9) {
            return lastNumber(number % 10);
        }
        return number;
    }

    function mutation(text, number) {
        if (number === 2) {
            return softMutation(text);
        }
        return text;
    }

    function softMutation(text) {
        var mutationTable = {
            'm': 'v',
            'b': 'v',
            'd': 'z'
        };
        if (mutationTable[text.charAt(0)] === undefined) {
            return text;
        }
        return mutationTable[text.charAt(0)] + text.substring(1);
    }

    return moment.defineLocale('br', {
        months : 'Genver_C\'hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu'.split('_'),
        monthsShort : 'Gen_C\'hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker'.split('_'),
        weekdays : 'Sul_Lun_Meurzh_Merc\'her_Yaou_Gwener_Sadorn'.split('_'),
        weekdaysShort : 'Sul_Lun_Meu_Mer_Yao_Gwe_Sad'.split('_'),
        weekdaysMin : 'Su_Lu_Me_Mer_Ya_Gw_Sa'.split('_'),
        longDateFormat : {
            LT : 'h[e]mm A',
            LTS : 'h[e]mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D [a viz] MMMM YYYY',
            LLL : 'D [a viz] MMMM YYYY LT',
            LLLL : 'dddd, D [a viz] MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Hiziv da] LT',
            nextDay : '[Warc\'hoazh da] LT',
            nextWeek : 'dddd [da] LT',
            lastDay : '[Dec\'h da] LT',
            lastWeek : 'dddd [paset da] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'a-benn %s',
            past : '%s \'zo',
            s : 'un nebeud segondennoÃƒÂ¹',
            m : 'ur vunutenn',
            mm : relativeTimeWithMutation,
            h : 'un eur',
            hh : '%d eur',
            d : 'un devezh',
            dd : relativeTimeWithMutation,
            M : 'ur miz',
            MM : relativeTimeWithMutation,
            y : 'ur bloaz',
            yy : specialMutationForYears
        },
        ordinalParse: /\d{1,2}(aÃƒÂ±|vet)/,
        ordinal : function (number) {
            var output = (number === 1) ? 'aÃƒÂ±' : 'vet';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : bosnian (bs)
// author : Nedim Cholich : https://github.com/frontyard
// based on (hr) translation by Bojan MarkoviÃ„â€¡

(function (factory) {
    factory(moment);
}(function (moment) {
    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'jedna minuta' : 'jedne minute';
        case 'mm':
            if (number === 1) {
                result += 'minuta';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'minute';
            } else {
                result += 'minuta';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'jedan sat' : 'jednog sata';
        case 'hh':
            if (number === 1) {
                result += 'sat';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'sata';
            } else {
                result += 'sati';
            }
            return result;
        case 'dd':
            if (number === 1) {
                result += 'dan';
            } else {
                result += 'dana';
            }
            return result;
        case 'MM':
            if (number === 1) {
                result += 'mjesec';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'mjeseca';
            } else {
                result += 'mjeseci';
            }
            return result;
        case 'yy':
            if (number === 1) {
                result += 'godina';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'godine';
            } else {
                result += 'godina';
            }
            return result;
        }
    }

    return moment.defineLocale('bs', {
        months : 'januar_februar_mart_april_maj_juni_juli_august_septembar_oktobar_novembar_decembar'.split('_'),
        monthsShort : 'jan._feb._mar._apr._maj._jun._jul._aug._sep._okt._nov._dec.'.split('_'),
        weekdays : 'nedjelja_ponedjeljak_utorak_srijeda_Ã„Âetvrtak_petak_subota'.split('_'),
        weekdaysShort : 'ned._pon._uto._sri._Ã„Âet._pet._sub.'.split('_'),
        weekdaysMin : 'ne_po_ut_sr_Ã„Âe_pe_su'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD. MM. YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[danas u] LT',
            nextDay  : '[sutra u] LT',

            nextWeek : function () {
                switch (this.day()) {
                case 0:
                    return '[u] [nedjelju] [u] LT';
                case 3:
                    return '[u] [srijedu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juÃ„Âer u] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                    return '[proÃ…Â¡lu] dddd [u] LT';
                case 6:
                    return '[proÃ…Â¡le] [subote] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[proÃ…Â¡li] dddd [u] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'za %s',
            past   : 'prije %s',
            s      : 'par sekundi',
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : 'dan',
            dd     : translate,
            M      : 'mjesec',
            MM     : translate,
            y      : 'godinu',
            yy     : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : catalan (ca)
// author : Juan G. Hurtado : https://github.com/juanghurtado

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ca', {
        months : 'gener_febrer_marÃƒÂ§_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre'.split('_'),
        monthsShort : 'gen._febr._mar._abr._mai._jun._jul._ag._set._oct._nov._des.'.split('_'),
        weekdays : 'diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte'.split('_'),
        weekdaysShort : 'dg._dl._dt._dc._dj._dv._ds.'.split('_'),
        weekdaysMin : 'Dg_Dl_Dt_Dc_Dj_Dv_Ds'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay : function () {
                return '[avui a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            nextDay : function () {
                return '[demÃƒ  a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            lastDay : function () {
                return '[ahir a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            lastWeek : function () {
                return '[el] dddd [passat a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'en %s',
            past : 'fa %s',
            s : 'uns segons',
            m : 'un minut',
            mm : '%d minuts',
            h : 'una hora',
            hh : '%d hores',
            d : 'un dia',
            dd : '%d dies',
            M : 'un mes',
            MM : '%d mesos',
            y : 'un any',
            yy : '%d anys'
        },
        ordinalParse: /\d{1,2}(r|n|t|ÃƒÂ¨|a)/,
        ordinal : function (number, period) {
            var output = (number === 1) ? 'r' :
                (number === 2) ? 'n' :
                (number === 3) ? 'r' :
                (number === 4) ? 't' : 'ÃƒÂ¨';
            if (period === 'w' || period === 'W') {
                output = 'a';
            }
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : czech (cs)
// author : petrbela : https://github.com/petrbela

(function (factory) {
    factory(moment);
}(function (moment) {
    var months = 'leden_ÃƒÂºnor_bÃ…â„¢ezen_duben_kvÃ„â€ºten_Ã„Âerven_Ã„Âervenec_srpen_zÃƒÂ¡Ã…â„¢ÃƒÂ­_Ã…â„¢ÃƒÂ­jen_listopad_prosinec'.split('_'),
        monthsShort = 'led_ÃƒÂºno_bÃ…â„¢e_dub_kvÃ„â€º_Ã„Âvn_Ã„Âvc_srp_zÃƒÂ¡Ã…â„¢_Ã…â„¢ÃƒÂ­j_lis_pro'.split('_');

    function plural(n) {
        return (n > 1) && (n < 5) && (~~(n / 10) !== 1);
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
        case 's':  // a few seconds / in a few seconds / a few seconds ago
            return (withoutSuffix || isFuture) ? 'pÃƒÂ¡r sekund' : 'pÃƒÂ¡r sekundami';
        case 'm':  // a minute / in a minute / a minute ago
            return withoutSuffix ? 'minuta' : (isFuture ? 'minutu' : 'minutou');
        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'minuty' : 'minut');
            } else {
                return result + 'minutami';
            }
            break;
        case 'h':  // an hour / in an hour / an hour ago
            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
        case 'hh': // 9 hours / in 9 hours / 9 hours ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'hodiny' : 'hodin');
            } else {
                return result + 'hodinami';
            }
            break;
        case 'd':  // a day / in a day / a day ago
            return (withoutSuffix || isFuture) ? 'den' : 'dnem';
        case 'dd': // 9 days / in 9 days / 9 days ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'dny' : 'dnÃƒÂ­');
            } else {
                return result + 'dny';
            }
            break;
        case 'M':  // a month / in a month / a month ago
            return (withoutSuffix || isFuture) ? 'mÃ„â€ºsÃƒÂ­c' : 'mÃ„â€ºsÃƒÂ­cem';
        case 'MM': // 9 months / in 9 months / 9 months ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'mÃ„â€ºsÃƒÂ­ce' : 'mÃ„â€ºsÃƒÂ­cÃ…Â¯');
            } else {
                return result + 'mÃ„â€ºsÃƒÂ­ci';
            }
            break;
        case 'y':  // a year / in a year / a year ago
            return (withoutSuffix || isFuture) ? 'rok' : 'rokem';
        case 'yy': // 9 years / in 9 years / 9 years ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'roky' : 'let');
            } else {
                return result + 'lety';
            }
            break;
        }
    }

    return moment.defineLocale('cs', {
        months : months,
        monthsShort : monthsShort,
        monthsParse : (function (months, monthsShort) {
            var i, _monthsParse = [];
            for (i = 0; i < 12; i++) {
                // use custom parser to solve problem with July (Ã„Âervenec)
                _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
            }
            return _monthsParse;
        }(months, monthsShort)),
        weekdays : 'nedÃ„â€ºle_pondÃ„â€ºlÃƒÂ­_ÃƒÂºterÃƒÂ½_stÃ…â„¢eda_Ã„Âtvrtek_pÃƒÂ¡tek_sobota'.split('_'),
        weekdaysShort : 'ne_po_ÃƒÂºt_st_Ã„Ât_pÃƒÂ¡_so'.split('_'),
        weekdaysMin : 'ne_po_ÃƒÂºt_st_Ã„Ât_pÃƒÂ¡_so'.split('_'),
        longDateFormat : {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[dnes v] LT',
            nextDay: '[zÃƒÂ­tra v] LT',
            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[v nedÃ„â€ºli v] LT';
                case 1:
                case 2:
                    return '[v] dddd [v] LT';
                case 3:
                    return '[ve stÃ…â„¢edu v] LT';
                case 4:
                    return '[ve Ã„Âtvrtek v] LT';
                case 5:
                    return '[v pÃƒÂ¡tek v] LT';
                case 6:
                    return '[v sobotu v] LT';
                }
            },
            lastDay: '[vÃ„Âera v] LT',
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[minulou nedÃ„â€ºli v] LT';
                case 1:
                case 2:
                    return '[minulÃƒÂ©] dddd [v] LT';
                case 3:
                    return '[minulou stÃ…â„¢edu v] LT';
                case 4:
                case 5:
                    return '[minulÃƒÂ½] dddd [v] LT';
                case 6:
                    return '[minulou sobotu v] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'za %s',
            past : 'pÃ…â„¢ed %s',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse : /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : chuvash (cv)
// author : Anatoly Mironov : https://github.com/mirontoli

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('cv', {
        months : 'ÃÂºÃ„Æ’Ã‘â‚¬ÃÂ»ÃÂ°Ã‘â€¡_ÃÂ½ÃÂ°Ã‘â‚¬Ã„Æ’Ã‘Â_ÃÂ¿Ã‘Æ’Ã‘Ë†_ÃÂ°ÃÂºÃÂ°_ÃÂ¼ÃÂ°ÃÂ¹_ÃƒÂ§Ã„â€¢Ã‘â‚¬Ã‘â€šÃÂ¼ÃÂµ_Ã‘Æ’Ã‘â€šÃ„Æ’_ÃƒÂ§Ã‘Æ’Ã‘â‚¬ÃÂ»ÃÂ°_ÃÂ°ÃÂ²Ã„Æ’ÃÂ½_Ã‘Å½ÃÂ¿ÃÂ°_Ã‘â€¡Ã“Â³ÃÂº_Ã‘â‚¬ÃÂ°Ã‘Ë†Ã‘â€šÃÂ°ÃÂ²'.split('_'),
        monthsShort : 'ÃÂºÃ„Æ’Ã‘â‚¬_ÃÂ½ÃÂ°Ã‘â‚¬_ÃÂ¿Ã‘Æ’Ã‘Ë†_ÃÂ°ÃÂºÃÂ°_ÃÂ¼ÃÂ°ÃÂ¹_ÃƒÂ§Ã„â€¢Ã‘â‚¬_Ã‘Æ’Ã‘â€šÃ„Æ’_ÃƒÂ§Ã‘Æ’Ã‘â‚¬_ÃÂ°ÃÂ²_Ã‘Å½ÃÂ¿ÃÂ°_Ã‘â€¡Ã“Â³ÃÂº_Ã‘â‚¬ÃÂ°Ã‘Ë†'.split('_'),
        weekdays : 'ÃÂ²Ã‘â€¹Ã‘â‚¬Ã‘ÂÃÂ°Ã‘â‚¬ÃÂ½ÃÂ¸ÃÂºÃ‘Æ’ÃÂ½_Ã‘â€šÃ‘Æ’ÃÂ½Ã‘â€šÃÂ¸ÃÂºÃ‘Æ’ÃÂ½_Ã‘â€¹Ã‘â€šÃÂ»ÃÂ°Ã‘â‚¬ÃÂ¸ÃÂºÃ‘Æ’ÃÂ½_Ã‘Å½ÃÂ½ÃÂºÃ‘Æ’ÃÂ½_ÃÂºÃ„â€¢ÃƒÂ§ÃÂ½ÃÂµÃ‘â‚¬ÃÂ½ÃÂ¸ÃÂºÃ‘Æ’ÃÂ½_Ã‘ÂÃ‘â‚¬ÃÂ½ÃÂµÃÂºÃ‘Æ’ÃÂ½_Ã‘Ë†Ã„Æ’ÃÂ¼ÃÂ°Ã‘â€šÃÂºÃ‘Æ’ÃÂ½'.split('_'),
        weekdaysShort : 'ÃÂ²Ã‘â€¹Ã‘â‚¬_Ã‘â€šÃ‘Æ’ÃÂ½_Ã‘â€¹Ã‘â€šÃÂ»_Ã‘Å½ÃÂ½_ÃÂºÃ„â€¢ÃƒÂ§_Ã‘ÂÃ‘â‚¬ÃÂ½_Ã‘Ë†Ã„Æ’ÃÂ¼'.split('_'),
        weekdaysMin : 'ÃÂ²Ã‘â‚¬_Ã‘â€šÃÂ½_Ã‘â€¹Ã‘â€š_Ã‘Å½ÃÂ½_ÃÂºÃƒÂ§_Ã‘ÂÃ‘â‚¬_Ã‘Ë†ÃÂ¼'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD-MM-YYYY',
            LL : 'YYYY [ÃƒÂ§Ã‘Æ’ÃÂ»Ã‘â€¦ÃÂ¸] MMMM [Ã‘Æ’ÃÂ¹Ã„Æ’Ã‘â€¦Ã„â€¢ÃÂ½] D[-ÃÂ¼Ã„â€¢Ã‘Ë†Ã„â€¢]',
            LLL : 'YYYY [ÃƒÂ§Ã‘Æ’ÃÂ»Ã‘â€¦ÃÂ¸] MMMM [Ã‘Æ’ÃÂ¹Ã„Æ’Ã‘â€¦Ã„â€¢ÃÂ½] D[-ÃÂ¼Ã„â€¢Ã‘Ë†Ã„â€¢], LT',
            LLLL : 'dddd, YYYY [ÃƒÂ§Ã‘Æ’ÃÂ»Ã‘â€¦ÃÂ¸] MMMM [Ã‘Æ’ÃÂ¹Ã„Æ’Ã‘â€¦Ã„â€¢ÃÂ½] D[-ÃÂ¼Ã„â€¢Ã‘Ë†Ã„â€¢], LT'
        },
        calendar : {
            sameDay: '[ÃÅ¸ÃÂ°Ã‘ÂÃÂ½] LT [Ã‘ÂÃÂµÃ‘â€¦ÃÂµÃ‘â€šÃ‘â‚¬ÃÂµ]',
            nextDay: '[ÃÂ«Ã‘â‚¬ÃÂ°ÃÂ½] LT [Ã‘ÂÃÂµÃ‘â€¦ÃÂµÃ‘â€šÃ‘â‚¬ÃÂµ]',
            lastDay: '[Ã„â€ÃÂ½ÃÂµÃ‘â‚¬] LT [Ã‘ÂÃÂµÃ‘â€¦ÃÂµÃ‘â€šÃ‘â‚¬ÃÂµ]',
            nextWeek: '[Ãƒâ€¡ÃÂ¸Ã‘â€šÃÂµÃ‘Â] dddd LT [Ã‘ÂÃÂµÃ‘â€¦ÃÂµÃ‘â€šÃ‘â‚¬ÃÂµ]',
            lastWeek: '[ÃËœÃ‘â‚¬Ã‘â€šÃÂ½Ã„â€¢] dddd LT [Ã‘ÂÃÂµÃ‘â€¦ÃÂµÃ‘â€šÃ‘â‚¬ÃÂµ]',
            sameElse: 'L'
        },
        relativeTime : {
            future : function (output) {
                var affix = /Ã‘ÂÃÂµÃ‘â€¦ÃÂµÃ‘â€š$/i.exec(output) ? 'Ã‘â‚¬ÃÂµÃÂ½' : /ÃƒÂ§Ã‘Æ’ÃÂ»$/i.exec(output) ? 'Ã‘â€šÃÂ°ÃÂ½' : 'Ã‘â‚¬ÃÂ°ÃÂ½';
                return output + affix;
            },
            past : '%s ÃÂºÃÂ°Ã‘ÂÃÂ»ÃÂ»ÃÂ°',
            s : 'ÃÂ¿Ã„â€¢Ã‘â‚¬-ÃÂ¸ÃÂº ÃƒÂ§ÃÂµÃÂºÃÂºÃ‘Æ’ÃÂ½Ã‘â€š',
            m : 'ÃÂ¿Ã„â€¢Ã‘â‚¬ ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€š',
            mm : '%d ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€š',
            h : 'ÃÂ¿Ã„â€¢Ã‘â‚¬ Ã‘ÂÃÂµÃ‘â€¦ÃÂµÃ‘â€š',
            hh : '%d Ã‘ÂÃÂµÃ‘â€¦ÃÂµÃ‘â€š',
            d : 'ÃÂ¿Ã„â€¢Ã‘â‚¬ ÃÂºÃ‘Æ’ÃÂ½',
            dd : '%d ÃÂºÃ‘Æ’ÃÂ½',
            M : 'ÃÂ¿Ã„â€¢Ã‘â‚¬ Ã‘Æ’ÃÂ¹Ã„Æ’Ã‘â€¦',
            MM : '%d Ã‘Æ’ÃÂ¹Ã„Æ’Ã‘â€¦',
            y : 'ÃÂ¿Ã„â€¢Ã‘â‚¬ ÃƒÂ§Ã‘Æ’ÃÂ»',
            yy : '%d ÃƒÂ§Ã‘Æ’ÃÂ»'
        },
        ordinalParse: /\d{1,2}-ÃÂ¼Ã„â€¢Ã‘Ë†/,
        ordinal : '%d-ÃÂ¼Ã„â€¢Ã‘Ë†',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Welsh (cy)
// author : Robert Allen

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('cy', {
        months: 'Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr'.split('_'),
        monthsShort: 'Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag'.split('_'),
        weekdays: 'Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn'.split('_'),
        weekdaysShort: 'Sul_Llun_Maw_Mer_Iau_Gwe_Sad'.split('_'),
        weekdaysMin: 'Su_Ll_Ma_Me_Ia_Gw_Sa'.split('_'),
        // time formats are the same as en-gb
        longDateFormat: {
            LT: 'HH:mm',
            LTS : 'LT:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd, D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[Heddiw am] LT',
            nextDay: '[Yfory am] LT',
            nextWeek: 'dddd [am] LT',
            lastDay: '[Ddoe am] LT',
            lastWeek: 'dddd [diwethaf am] LT',
            sameElse: 'L'
        },
        relativeTime: {
            future: 'mewn %s',
            past: '%s yn ÃƒÂ´l',
            s: 'ychydig eiliadau',
            m: 'munud',
            mm: '%d munud',
            h: 'awr',
            hh: '%d awr',
            d: 'diwrnod',
            dd: '%d diwrnod',
            M: 'mis',
            MM: '%d mis',
            y: 'blwyddyn',
            yy: '%d flynedd'
        },
        ordinalParse: /\d{1,2}(fed|ain|af|il|ydd|ed|eg)/,
        // traditional ordinal numbers above 31 are not commonly used in colloquial Welsh
        ordinal: function (number) {
            var b = number,
                output = '',
                lookup = [
                    '', 'af', 'il', 'ydd', 'ydd', 'ed', 'ed', 'ed', 'fed', 'fed', 'fed', // 1af to 10fed
                    'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'fed' // 11eg to 20fed
                ];

            if (b > 20) {
                if (b === 40 || b === 50 || b === 60 || b === 80 || b === 100) {
                    output = 'fed'; // not 30ain, 70ain or 90ain
                } else {
                    output = 'ain';
                }
            } else if (b > 0) {
                output = lookup[b];
            }

            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : danish (da)
// author : Ulrik Nielsen : https://github.com/mrbase

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('da', {
        months : 'januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
        weekdays : 'sÃƒÂ¸ndag_mandag_tirsdag_onsdag_torsdag_fredag_lÃƒÂ¸rdag'.split('_'),
        weekdaysShort : 'sÃƒÂ¸n_man_tir_ons_tor_fre_lÃƒÂ¸r'.split('_'),
        weekdaysMin : 'sÃƒÂ¸_ma_ti_on_to_fr_lÃƒÂ¸'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd [d.] D. MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[I dag kl.] LT',
            nextDay : '[I morgen kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[I gÃƒÂ¥r kl.] LT',
            lastWeek : '[sidste] dddd [kl] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : '%s siden',
            s : 'fÃƒÂ¥ sekunder',
            m : 'et minut',
            mm : '%d minutter',
            h : 'en time',
            hh : '%d timer',
            d : 'en dag',
            dd : '%d dage',
            M : 'en mÃƒÂ¥ned',
            MM : '%d mÃƒÂ¥neder',
            y : 'et ÃƒÂ¥r',
            yy : '%d ÃƒÂ¥r'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : austrian german (de-at)
// author : lluchs : https://github.com/lluchs
// author: Menelion ElensÃƒÂºle: https://github.com/Oire
// author : Martin Groller : https://github.com/MadMG

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            'm': ['eine Minute', 'einer Minute'],
            'h': ['eine Stunde', 'einer Stunde'],
            'd': ['ein Tag', 'einem Tag'],
            'dd': [number + ' Tage', number + ' Tagen'],
            'M': ['ein Monat', 'einem Monat'],
            'MM': [number + ' Monate', number + ' Monaten'],
            'y': ['ein Jahr', 'einem Jahr'],
            'yy': [number + ' Jahre', number + ' Jahren']
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    return moment.defineLocale('de-at', {
        months : 'JÃƒÂ¤nner_Februar_MÃƒÂ¤rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
        monthsShort : 'JÃƒÂ¤n._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
        weekdays : 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
        weekdaysShort : 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
        weekdaysMin : 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
        longDateFormat : {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Heute um] LT [Uhr]',
            sameElse: 'L',
            nextDay: '[Morgen um] LT [Uhr]',
            nextWeek: 'dddd [um] LT [Uhr]',
            lastDay: '[Gestern um] LT [Uhr]',
            lastWeek: '[letzten] dddd [um] LT [Uhr]'
        },
        relativeTime : {
            future : 'in %s',
            past : 'vor %s',
            s : 'ein paar Sekunden',
            m : processRelativeTime,
            mm : '%d Minuten',
            h : processRelativeTime,
            hh : '%d Stunden',
            d : processRelativeTime,
            dd : processRelativeTime,
            M : processRelativeTime,
            MM : processRelativeTime,
            y : processRelativeTime,
            yy : processRelativeTime
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : german (de)
// author : lluchs : https://github.com/lluchs
// author: Menelion ElensÃƒÂºle: https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            'm': ['eine Minute', 'einer Minute'],
            'h': ['eine Stunde', 'einer Stunde'],
            'd': ['ein Tag', 'einem Tag'],
            'dd': [number + ' Tage', number + ' Tagen'],
            'M': ['ein Monat', 'einem Monat'],
            'MM': [number + ' Monate', number + ' Monaten'],
            'y': ['ein Jahr', 'einem Jahr'],
            'yy': [number + ' Jahre', number + ' Jahren']
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    return moment.defineLocale('de', {
        months : 'Januar_Februar_MÃƒÂ¤rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
        monthsShort : 'Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
        weekdays : 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
        weekdaysShort : 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
        weekdaysMin : 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
        longDateFormat : {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Heute um] LT [Uhr]',
            sameElse: 'L',
            nextDay: '[Morgen um] LT [Uhr]',
            nextWeek: 'dddd [um] LT [Uhr]',
            lastDay: '[Gestern um] LT [Uhr]',
            lastWeek: '[letzten] dddd [um] LT [Uhr]'
        },
        relativeTime : {
            future : 'in %s',
            past : 'vor %s',
            s : 'ein paar Sekunden',
            m : processRelativeTime,
            mm : '%d Minuten',
            h : processRelativeTime,
            hh : '%d Stunden',
            d : processRelativeTime,
            dd : processRelativeTime,
            M : processRelativeTime,
            MM : processRelativeTime,
            y : processRelativeTime,
            yy : processRelativeTime
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : modern greek (el)
// author : Aggelos Karalias : https://github.com/mehiel

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('el', {
        monthsNominativeEl : 'ÃŽâ„¢ÃŽÂ±ÃŽÂ½ÃŽÂ¿Ãâ€¦ÃŽÂ¬ÃÂÃŽÂ¹ÃŽÂ¿Ãâ€š_ÃŽÂ¦ÃŽÂµÃŽÂ²ÃÂÃŽÂ¿Ãâ€¦ÃŽÂ¬ÃÂÃŽÂ¹ÃŽÂ¿Ãâ€š_ÃŽÅ“ÃŽÂ¬ÃÂÃâ€žÃŽÂ¹ÃŽÂ¿Ãâ€š_ÃŽâ€˜Ãâ‚¬ÃÂÃŽÂ¯ÃŽÂ»ÃŽÂ¹ÃŽÂ¿Ãâ€š_ÃŽÅ“ÃŽÂ¬ÃŽÂ¹ÃŽÂ¿Ãâ€š_ÃŽâ„¢ÃŽÂ¿ÃÂÃŽÂ½ÃŽÂ¹ÃŽÂ¿Ãâ€š_ÃŽâ„¢ÃŽÂ¿ÃÂÃŽÂ»ÃŽÂ¹ÃŽÂ¿Ãâ€š_ÃŽâ€˜ÃÂÃŽÂ³ÃŽÂ¿Ãâ€¦ÃÆ’Ãâ€žÃŽÂ¿Ãâ€š_ÃŽÂ£ÃŽÂµÃâ‚¬Ãâ€žÃŽÂ­ÃŽÂ¼ÃŽÂ²ÃÂÃŽÂ¹ÃŽÂ¿Ãâ€š_ÃŽÅ¸ÃŽÂºÃâ€žÃÅ½ÃŽÂ²ÃÂÃŽÂ¹ÃŽÂ¿Ãâ€š_ÃŽÂÃŽÂ¿ÃŽÂ­ÃŽÂ¼ÃŽÂ²ÃÂÃŽÂ¹ÃŽÂ¿Ãâ€š_ÃŽâ€ÃŽÂµÃŽÂºÃŽÂ­ÃŽÂ¼ÃŽÂ²ÃÂÃŽÂ¹ÃŽÂ¿Ãâ€š'.split('_'),
        monthsGenitiveEl : 'ÃŽâ„¢ÃŽÂ±ÃŽÂ½ÃŽÂ¿Ãâ€¦ÃŽÂ±ÃÂÃŽÂ¯ÃŽÂ¿Ãâ€¦_ÃŽÂ¦ÃŽÂµÃŽÂ²ÃÂÃŽÂ¿Ãâ€¦ÃŽÂ±ÃÂÃŽÂ¯ÃŽÂ¿Ãâ€¦_ÃŽÅ“ÃŽÂ±ÃÂÃâ€žÃŽÂ¯ÃŽÂ¿Ãâ€¦_ÃŽâ€˜Ãâ‚¬ÃÂÃŽÂ¹ÃŽÂ»ÃŽÂ¯ÃŽÂ¿Ãâ€¦_ÃŽÅ“ÃŽÂ±ÃŽÂÃŽÂ¿Ãâ€¦_ÃŽâ„¢ÃŽÂ¿Ãâ€¦ÃŽÂ½ÃŽÂ¯ÃŽÂ¿Ãâ€¦_ÃŽâ„¢ÃŽÂ¿Ãâ€¦ÃŽÂ»ÃŽÂ¯ÃŽÂ¿Ãâ€¦_ÃŽâ€˜Ãâ€¦ÃŽÂ³ÃŽÂ¿ÃÂÃÆ’Ãâ€žÃŽÂ¿Ãâ€¦_ÃŽÂ£ÃŽÂµÃâ‚¬Ãâ€žÃŽÂµÃŽÂ¼ÃŽÂ²ÃÂÃŽÂ¯ÃŽÂ¿Ãâ€¦_ÃŽÅ¸ÃŽÂºÃâ€žÃâ€°ÃŽÂ²ÃÂÃŽÂ¯ÃŽÂ¿Ãâ€¦_ÃŽÂÃŽÂ¿ÃŽÂµÃŽÂ¼ÃŽÂ²ÃÂÃŽÂ¯ÃŽÂ¿Ãâ€¦_ÃŽâ€ÃŽÂµÃŽÂºÃŽÂµÃŽÂ¼ÃŽÂ²ÃÂÃŽÂ¯ÃŽÂ¿Ãâ€¦'.split('_'),
        months : function (momentToFormat, format) {
            if (/D/.test(format.substring(0, format.indexOf('MMMM')))) { // if there is a day number before 'MMMM'
                return this._monthsGenitiveEl[momentToFormat.month()];
            } else {
                return this._monthsNominativeEl[momentToFormat.month()];
            }
        },
        monthsShort : 'ÃŽâ„¢ÃŽÂ±ÃŽÂ½_ÃŽÂ¦ÃŽÂµÃŽÂ²_ÃŽÅ“ÃŽÂ±ÃÂ_ÃŽâ€˜Ãâ‚¬ÃÂ_ÃŽÅ“ÃŽÂ±ÃÅ _ÃŽâ„¢ÃŽÂ¿Ãâ€¦ÃŽÂ½_ÃŽâ„¢ÃŽÂ¿Ãâ€¦ÃŽÂ»_ÃŽâ€˜Ãâ€¦ÃŽÂ³_ÃŽÂ£ÃŽÂµÃâ‚¬_ÃŽÅ¸ÃŽÂºÃâ€ž_ÃŽÂÃŽÂ¿ÃŽÂµ_ÃŽâ€ÃŽÂµÃŽÂº'.split('_'),
        weekdays : 'ÃŽÅ¡Ãâ€¦ÃÂÃŽÂ¹ÃŽÂ±ÃŽÂºÃŽÂ®_ÃŽâ€ÃŽÂµÃâ€¦Ãâ€žÃŽÂ­ÃÂÃŽÂ±_ÃŽÂ¤ÃÂÃŽÂ¯Ãâ€žÃŽÂ·_ÃŽÂ¤ÃŽÂµÃâ€žÃŽÂ¬ÃÂÃâ€žÃŽÂ·_ÃŽ ÃŽÂ­ÃŽÂ¼Ãâ‚¬Ãâ€žÃŽÂ·_ÃŽ ÃŽÂ±ÃÂÃŽÂ±ÃÆ’ÃŽÂºÃŽÂµÃâ€¦ÃŽÂ®_ÃŽÂ£ÃŽÂ¬ÃŽÂ²ÃŽÂ²ÃŽÂ±Ãâ€žÃŽÂ¿'.split('_'),
        weekdaysShort : 'ÃŽÅ¡Ãâ€¦ÃÂ_ÃŽâ€ÃŽÂµÃâ€¦_ÃŽÂ¤ÃÂÃŽÂ¹_ÃŽÂ¤ÃŽÂµÃâ€ž_ÃŽ ÃŽÂµÃŽÂ¼_ÃŽ ÃŽÂ±ÃÂ_ÃŽÂ£ÃŽÂ±ÃŽÂ²'.split('_'),
        weekdaysMin : 'ÃŽÅ¡Ãâ€¦_ÃŽâ€ÃŽÂµ_ÃŽÂ¤ÃÂ_ÃŽÂ¤ÃŽÂµ_ÃŽ ÃŽÂµ_ÃŽ ÃŽÂ±_ÃŽÂ£ÃŽÂ±'.split('_'),
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'ÃŽÂ¼ÃŽÂ¼' : 'ÃŽÅ“ÃŽÅ“';
            } else {
                return isLower ? 'Ãâ‚¬ÃŽÂ¼' : 'ÃŽ ÃŽÅ“';
            }
        },
        isPM : function (input) {
            return ((input + '').toLowerCase()[0] === 'ÃŽÂ¼');
        },
        meridiemParse : /[ÃŽ ÃŽÅ“]\.?ÃŽÅ“?\.?/i,
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendarEl : {
            sameDay : '[ÃŽÂ£ÃŽÂ®ÃŽÂ¼ÃŽÂµÃÂÃŽÂ± {}] LT',
            nextDay : '[ÃŽâ€˜ÃÂÃÂÃŽÂ¹ÃŽÂ¿ {}] LT',
            nextWeek : 'dddd [{}] LT',
            lastDay : '[ÃŽÂ§ÃŽÂ¸ÃŽÂµÃâ€š {}] LT',
            lastWeek : function () {
                switch (this.day()) {
                    case 6:
                        return '[Ãâ€žÃŽÂ¿ Ãâ‚¬ÃÂÃŽÂ¿ÃŽÂ·ÃŽÂ³ÃŽÂ¿ÃÂÃŽÂ¼ÃŽÂµÃŽÂ½ÃŽÂ¿] dddd [{}] LT';
                    default:
                        return '[Ãâ€žÃŽÂ·ÃŽÂ½ Ãâ‚¬ÃÂÃŽÂ¿ÃŽÂ·ÃŽÂ³ÃŽÂ¿ÃÂÃŽÂ¼ÃŽÂµÃŽÂ½ÃŽÂ·] dddd [{}] LT';
                }
            },
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendarEl[key],
                hours = mom && mom.hours();

            if (typeof output === 'function') {
                output = output.apply(mom);
            }

            return output.replace('{}', (hours % 12 === 1 ? 'ÃÆ’Ãâ€žÃŽÂ·' : 'ÃÆ’Ãâ€žÃŽÂ¹Ãâ€š'));
        },
        relativeTime : {
            future : 'ÃÆ’ÃŽÂµ %s',
            past : '%s Ãâ‚¬ÃÂÃŽÂ¹ÃŽÂ½',
            s : 'ÃŽÂ»ÃŽÂ¯ÃŽÂ³ÃŽÂ± ÃŽÂ´ÃŽÂµÃâ€¦Ãâ€žÃŽÂµÃÂÃÅ’ÃŽÂ»ÃŽÂµÃâ‚¬Ãâ€žÃŽÂ±',
            m : 'ÃŽÂ­ÃŽÂ½ÃŽÂ± ÃŽÂ»ÃŽÂµÃâ‚¬Ãâ€žÃÅ’',
            mm : '%d ÃŽÂ»ÃŽÂµÃâ‚¬Ãâ€žÃŽÂ¬',
            h : 'ÃŽÂ¼ÃŽÂ¯ÃŽÂ± ÃÅ½ÃÂÃŽÂ±',
            hh : '%d ÃÅ½ÃÂÃŽÂµÃâ€š',
            d : 'ÃŽÂ¼ÃŽÂ¯ÃŽÂ± ÃŽÂ¼ÃŽÂ­ÃÂÃŽÂ±',
            dd : '%d ÃŽÂ¼ÃŽÂ­ÃÂÃŽÂµÃâ€š',
            M : 'ÃŽÂ­ÃŽÂ½ÃŽÂ±Ãâ€š ÃŽÂ¼ÃŽÂ®ÃŽÂ½ÃŽÂ±Ãâ€š',
            MM : '%d ÃŽÂ¼ÃŽÂ®ÃŽÂ½ÃŽÂµÃâ€š',
            y : 'ÃŽÂ­ÃŽÂ½ÃŽÂ±Ãâ€š Ãâ€¡ÃÂÃÅ’ÃŽÂ½ÃŽÂ¿Ãâ€š',
            yy : '%d Ãâ€¡ÃÂÃÅ’ÃŽÂ½ÃŽÂ¹ÃŽÂ±'
        },
        ordinalParse: /\d{1,2}ÃŽÂ·/,
        ordinal: '%dÃŽÂ·',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : australian english (en-au)

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('en-au', {
        months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },
        ordinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : canadian english (en-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('en-ca', {
        months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'YYYY-MM-DD',
            LL : 'D MMMM, YYYY',
            LLL : 'D MMMM, YYYY LT',
            LLLL : 'dddd, D MMMM, YYYY LT'
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },
        ordinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });
}));
// moment.js locale configuration
// locale : great britain english (en-gb)
// author : Chris Gedrim : https://github.com/chrisgedrim

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('en-gb', {
        months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'HH:mm:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },
        ordinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : esperanto (eo)
// author : Colin Dean : https://github.com/colindean
// komento: Mi estas malcerta se mi korekte traktis akuzativojn en tiu traduko.
//          Se ne, bonvolu korekti kaj avizi min por ke mi povas lerni!

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('eo', {
        months : 'januaro_februaro_marto_aprilo_majo_junio_julio_aÃ…Â­gusto_septembro_oktobro_novembro_decembro'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aÃ…Â­g_sep_okt_nov_dec'.split('_'),
        weekdays : 'DimanÃ„â€°o_Lundo_Mardo_Merkredo_Ã„Â´aÃ…Â­do_Vendredo_Sabato'.split('_'),
        weekdaysShort : 'Dim_Lun_Mard_Merk_Ã„Â´aÃ…Â­_Ven_Sab'.split('_'),
        weekdaysMin : 'Di_Lu_Ma_Me_Ã„Â´a_Ve_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'D[-an de] MMMM, YYYY',
            LLL : 'D[-an de] MMMM, YYYY LT',
            LLLL : 'dddd, [la] D[-an de] MMMM, YYYY LT'
        },
        meridiemParse: /[ap]\.t\.m/i,
        isPM: function (input) {
            return input.charAt(0).toLowerCase() === 'p';
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'p.t.m.' : 'P.T.M.';
            } else {
                return isLower ? 'a.t.m.' : 'A.T.M.';
            }
        },
        calendar : {
            sameDay : '[HodiaÃ…Â­ je] LT',
            nextDay : '[MorgaÃ…Â­ je] LT',
            nextWeek : 'dddd [je] LT',
            lastDay : '[HieraÃ…Â­ je] LT',
            lastWeek : '[pasinta] dddd [je] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'je %s',
            past : 'antaÃ…Â­ %s',
            s : 'sekundoj',
            m : 'minuto',
            mm : '%d minutoj',
            h : 'horo',
            hh : '%d horoj',
            d : 'tago',//ne 'diurno', Ã„â€°ar estas uzita por proksimumo
            dd : '%d tagoj',
            M : 'monato',
            MM : '%d monatoj',
            y : 'jaro',
            yy : '%d jaroj'
        },
        ordinalParse: /\d{1,2}a/,
        ordinal : '%da',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : spanish (es)
// author : Julio NapurÃƒÂ­ : https://github.com/julionc

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsShortDot = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_'),
        monthsShort = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_');

    return moment.defineLocale('es', {
        months : 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
        monthsShort : function (m, format) {
            if (/-MMM-/.test(format)) {
                return monthsShort[m.month()];
            } else {
                return monthsShortDot[m.month()];
            }
        },
        weekdays : 'domingo_lunes_martes_miÃƒÂ©rcoles_jueves_viernes_sÃƒÂ¡bado'.split('_'),
        weekdaysShort : 'dom._lun._mar._miÃƒÂ©._jue._vie._sÃƒÂ¡b.'.split('_'),
        weekdaysMin : 'Do_Lu_Ma_Mi_Ju_Vi_SÃƒÂ¡'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [de] MMMM [de] YYYY',
            LLL : 'D [de] MMMM [de] YYYY LT',
            LLLL : 'dddd, D [de] MMMM [de] YYYY LT'
        },
        calendar : {
            sameDay : function () {
                return '[hoy a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            nextDay : function () {
                return '[maÃƒÂ±ana a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            lastDay : function () {
                return '[ayer a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            lastWeek : function () {
                return '[el] dddd [pasado a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'en %s',
            past : 'hace %s',
            s : 'unos segundos',
            m : 'un minuto',
            mm : '%d minutos',
            h : 'una hora',
            hh : '%d horas',
            d : 'un dÃƒÂ­a',
            dd : '%d dÃƒÂ­as',
            M : 'un mes',
            MM : '%d meses',
            y : 'un aÃƒÂ±o',
            yy : '%d aÃƒÂ±os'
        },
        ordinalParse : /\d{1,2}Ã‚Âº/,
        ordinal : '%dÃ‚Âº',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : estonian (et)
// author : Henry Kehlmann : https://github.com/madhenry
// improvements : Illimar Tambek : https://github.com/ragulka

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            's' : ['mÃƒÂµne sekundi', 'mÃƒÂµni sekund', 'paar sekundit'],
            'm' : ['ÃƒÂ¼he minuti', 'ÃƒÂ¼ks minut'],
            'mm': [number + ' minuti', number + ' minutit'],
            'h' : ['ÃƒÂ¼he tunni', 'tund aega', 'ÃƒÂ¼ks tund'],
            'hh': [number + ' tunni', number + ' tundi'],
            'd' : ['ÃƒÂ¼he pÃƒÂ¤eva', 'ÃƒÂ¼ks pÃƒÂ¤ev'],
            'M' : ['kuu aja', 'kuu aega', 'ÃƒÂ¼ks kuu'],
            'MM': [number + ' kuu', number + ' kuud'],
            'y' : ['ÃƒÂ¼he aasta', 'aasta', 'ÃƒÂ¼ks aasta'],
            'yy': [number + ' aasta', number + ' aastat']
        };
        if (withoutSuffix) {
            return format[key][2] ? format[key][2] : format[key][1];
        }
        return isFuture ? format[key][0] : format[key][1];
    }

    return moment.defineLocale('et', {
        months        : 'jaanuar_veebruar_mÃƒÂ¤rts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember'.split('_'),
        monthsShort   : 'jaan_veebr_mÃƒÂ¤rts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets'.split('_'),
        weekdays      : 'pÃƒÂ¼hapÃƒÂ¤ev_esmaspÃƒÂ¤ev_teisipÃƒÂ¤ev_kolmapÃƒÂ¤ev_neljapÃƒÂ¤ev_reede_laupÃƒÂ¤ev'.split('_'),
        weekdaysShort : 'P_E_T_K_N_R_L'.split('_'),
        weekdaysMin   : 'P_E_T_K_N_R_L'.split('_'),
        longDateFormat : {
            LT   : 'H:mm',
            LTS : 'LT:ss',
            L    : 'DD.MM.YYYY',
            LL   : 'D. MMMM YYYY',
            LLL  : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[TÃƒÂ¤na,] LT',
            nextDay  : '[Homme,] LT',
            nextWeek : '[JÃƒÂ¤rgmine] dddd LT',
            lastDay  : '[Eile,] LT',
            lastWeek : '[Eelmine] dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s pÃƒÂ¤rast',
            past   : '%s tagasi',
            s      : processRelativeTime,
            m      : processRelativeTime,
            mm     : processRelativeTime,
            h      : processRelativeTime,
            hh     : processRelativeTime,
            d      : processRelativeTime,
            dd     : '%d pÃƒÂ¤eva',
            M      : processRelativeTime,
            MM     : processRelativeTime,
            y      : processRelativeTime,
            yy     : processRelativeTime
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : euskara (eu)
// author : Eneko Illarramendi : https://github.com/eillarra

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('eu', {
        months : 'urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua'.split('_'),
        monthsShort : 'urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.'.split('_'),
        weekdays : 'igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata'.split('_'),
        weekdaysShort : 'ig._al._ar._az._og._ol._lr.'.split('_'),
        weekdaysMin : 'ig_al_ar_az_og_ol_lr'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'YYYY[ko] MMMM[ren] D[a]',
            LLL : 'YYYY[ko] MMMM[ren] D[a] LT',
            LLLL : 'dddd, YYYY[ko] MMMM[ren] D[a] LT',
            l : 'YYYY-M-D',
            ll : 'YYYY[ko] MMM D[a]',
            lll : 'YYYY[ko] MMM D[a] LT',
            llll : 'ddd, YYYY[ko] MMM D[a] LT'
        },
        calendar : {
            sameDay : '[gaur] LT[etan]',
            nextDay : '[bihar] LT[etan]',
            nextWeek : 'dddd LT[etan]',
            lastDay : '[atzo] LT[etan]',
            lastWeek : '[aurreko] dddd LT[etan]',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s barru',
            past : 'duela %s',
            s : 'segundo batzuk',
            m : 'minutu bat',
            mm : '%d minutu',
            h : 'ordu bat',
            hh : '%d ordu',
            d : 'egun bat',
            dd : '%d egun',
            M : 'hilabete bat',
            MM : '%d hilabete',
            y : 'urte bat',
            yy : '%d urte'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Persian (fa)
// author : Ebrahim Byagowi : https://github.com/ebraminio

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ã›Â±',
        '2': 'Ã›Â²',
        '3': 'Ã›Â³',
        '4': 'Ã›Â´',
        '5': 'Ã›Âµ',
        '6': 'Ã›Â¶',
        '7': 'Ã›Â·',
        '8': 'Ã›Â¸',
        '9': 'Ã›Â¹',
        '0': 'Ã›Â°'
    }, numberMap = {
        'Ã›Â±': '1',
        'Ã›Â²': '2',
        'Ã›Â³': '3',
        'Ã›Â´': '4',
        'Ã›Âµ': '5',
        'Ã›Â¶': '6',
        'Ã›Â·': '7',
        'Ã›Â¸': '8',
        'Ã›Â¹': '9',
        'Ã›Â°': '0'
    };

    return moment.defineLocale('fa', {
        months : 'ÃšËœÃ˜Â§Ã™â€ Ã™Ë†Ã›Å’Ã™â€¡_Ã™ÂÃ™Ë†Ã˜Â±Ã›Å’Ã™â€¡_Ã™â€¦Ã˜Â§Ã˜Â±Ã˜Â³_Ã˜Â¢Ã™Ë†Ã˜Â±Ã›Å’Ã™â€ž_Ã™â€¦Ã™â€¡_ÃšËœÃ™Ë†Ã˜Â¦Ã™â€ _ÃšËœÃ™Ë†Ã˜Â¦Ã›Å’Ã™â€¡_Ã˜Â§Ã™Ë†Ã˜Âª_Ã˜Â³Ã™Â¾Ã˜ÂªÃ˜Â§Ã™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â§ÃšÂ©Ã˜ÂªÃ˜Â¨Ã˜Â±_Ã™â€ Ã™Ë†Ã˜Â§Ã™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â¯Ã˜Â³Ã˜Â§Ã™â€¦Ã˜Â¨Ã˜Â±'.split('_'),
        monthsShort : 'ÃšËœÃ˜Â§Ã™â€ Ã™Ë†Ã›Å’Ã™â€¡_Ã™ÂÃ™Ë†Ã˜Â±Ã›Å’Ã™â€¡_Ã™â€¦Ã˜Â§Ã˜Â±Ã˜Â³_Ã˜Â¢Ã™Ë†Ã˜Â±Ã›Å’Ã™â€ž_Ã™â€¦Ã™â€¡_ÃšËœÃ™Ë†Ã˜Â¦Ã™â€ _ÃšËœÃ™Ë†Ã˜Â¦Ã›Å’Ã™â€¡_Ã˜Â§Ã™Ë†Ã˜Âª_Ã˜Â³Ã™Â¾Ã˜ÂªÃ˜Â§Ã™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â§ÃšÂ©Ã˜ÂªÃ˜Â¨Ã˜Â±_Ã™â€ Ã™Ë†Ã˜Â§Ã™â€¦Ã˜Â¨Ã˜Â±_Ã˜Â¯Ã˜Â³Ã˜Â§Ã™â€¦Ã˜Â¨Ã˜Â±'.split('_'),
        weekdays : 'Ã›Å’ÃšÂ©\u200cÃ˜Â´Ã™â€ Ã˜Â¨Ã™â€¡_Ã˜Â¯Ã™Ë†Ã˜Â´Ã™â€ Ã˜Â¨Ã™â€¡_Ã˜Â³Ã™â€¡\u200cÃ˜Â´Ã™â€ Ã˜Â¨Ã™â€¡_Ãšâ€ Ã™â€¡Ã˜Â§Ã˜Â±Ã˜Â´Ã™â€ Ã˜Â¨Ã™â€¡_Ã™Â¾Ã™â€ Ã˜Â¬\u200cÃ˜Â´Ã™â€ Ã˜Â¨Ã™â€¡_Ã˜Â¬Ã™â€¦Ã˜Â¹Ã™â€¡_Ã˜Â´Ã™â€ Ã˜Â¨Ã™â€¡'.split('_'),
        weekdaysShort : 'Ã›Å’ÃšÂ©\u200cÃ˜Â´Ã™â€ Ã˜Â¨Ã™â€¡_Ã˜Â¯Ã™Ë†Ã˜Â´Ã™â€ Ã˜Â¨Ã™â€¡_Ã˜Â³Ã™â€¡\u200cÃ˜Â´Ã™â€ Ã˜Â¨Ã™â€¡_Ãšâ€ Ã™â€¡Ã˜Â§Ã˜Â±Ã˜Â´Ã™â€ Ã˜Â¨Ã™â€¡_Ã™Â¾Ã™â€ Ã˜Â¬\u200cÃ˜Â´Ã™â€ Ã˜Â¨Ã™â€¡_Ã˜Â¬Ã™â€¦Ã˜Â¹Ã™â€¡_Ã˜Â´Ã™â€ Ã˜Â¨Ã™â€¡'.split('_'),
        weekdaysMin : 'Ã›Å’_Ã˜Â¯_Ã˜Â³_Ãšâ€ _Ã™Â¾_Ã˜Â¬_Ã˜Â´'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        meridiemParse: /Ã™â€šÃ˜Â¨Ã™â€ž Ã˜Â§Ã˜Â² Ã˜Â¸Ã™â€¡Ã˜Â±|Ã˜Â¨Ã˜Â¹Ã˜Â¯ Ã˜Â§Ã˜Â² Ã˜Â¸Ã™â€¡Ã˜Â±/,
        isPM: function (input) {
            return /Ã˜Â¨Ã˜Â¹Ã˜Â¯ Ã˜Â§Ã˜Â² Ã˜Â¸Ã™â€¡Ã˜Â±/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'Ã™â€šÃ˜Â¨Ã™â€ž Ã˜Â§Ã˜Â² Ã˜Â¸Ã™â€¡Ã˜Â±';
            } else {
                return 'Ã˜Â¨Ã˜Â¹Ã˜Â¯ Ã˜Â§Ã˜Â² Ã˜Â¸Ã™â€¡Ã˜Â±';
            }
        },
        calendar : {
            sameDay : '[Ã˜Â§Ã™â€¦Ã˜Â±Ã™Ë†Ã˜Â² Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Âª] LT',
            nextDay : '[Ã™ÂÃ˜Â±Ã˜Â¯Ã˜Â§ Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Âª] LT',
            nextWeek : 'dddd [Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Âª] LT',
            lastDay : '[Ã˜Â¯Ã›Å’Ã˜Â±Ã™Ë†Ã˜Â² Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Âª] LT',
            lastWeek : 'dddd [Ã™Â¾Ã›Å’Ã˜Â´] [Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Âª] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'Ã˜Â¯Ã˜Â± %s',
            past : '%s Ã™Â¾Ã›Å’Ã˜Â´',
            s : 'Ãšâ€ Ã™â€ Ã˜Â¯Ã›Å’Ã™â€  Ã˜Â«Ã˜Â§Ã™â€ Ã›Å’Ã™â€¡',
            m : 'Ã›Å’ÃšÂ© Ã˜Â¯Ã™â€šÃ›Å’Ã™â€šÃ™â€¡',
            mm : '%d Ã˜Â¯Ã™â€šÃ›Å’Ã™â€šÃ™â€¡',
            h : 'Ã›Å’ÃšÂ© Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Âª',
            hh : '%d Ã˜Â³Ã˜Â§Ã˜Â¹Ã˜Âª',
            d : 'Ã›Å’ÃšÂ© Ã˜Â±Ã™Ë†Ã˜Â²',
            dd : '%d Ã˜Â±Ã™Ë†Ã˜Â²',
            M : 'Ã›Å’ÃšÂ© Ã™â€¦Ã˜Â§Ã™â€¡',
            MM : '%d Ã™â€¦Ã˜Â§Ã™â€¡',
            y : 'Ã›Å’ÃšÂ© Ã˜Â³Ã˜Â§Ã™â€ž',
            yy : '%d Ã˜Â³Ã˜Â§Ã™â€ž'
        },
        preparse: function (string) {
            return string.replace(/[Ã›Â°-Ã›Â¹]/g, function (match) {
                return numberMap[match];
            }).replace(/Ã˜Å’/g, ',');
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            }).replace(/,/g, 'Ã˜Å’');
        },
        ordinalParse: /\d{1,2}Ã™â€¦/,
        ordinal : '%dÃ™â€¦',
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12 // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : finnish (fi)
// author : Tarmo Aidantausta : https://github.com/bleadof

(function (factory) {
    factory(moment);
}(function (moment) {
    var numbersPast = 'nolla yksi kaksi kolme neljÃƒÂ¤ viisi kuusi seitsemÃƒÂ¤n kahdeksan yhdeksÃƒÂ¤n'.split(' '),
        numbersFuture = [
            'nolla', 'yhden', 'kahden', 'kolmen', 'neljÃƒÂ¤n', 'viiden', 'kuuden',
            numbersPast[7], numbersPast[8], numbersPast[9]
        ];

    function translate(number, withoutSuffix, key, isFuture) {
        var result = '';
        switch (key) {
        case 's':
            return isFuture ? 'muutaman sekunnin' : 'muutama sekunti';
        case 'm':
            return isFuture ? 'minuutin' : 'minuutti';
        case 'mm':
            result = isFuture ? 'minuutin' : 'minuuttia';
            break;
        case 'h':
            return isFuture ? 'tunnin' : 'tunti';
        case 'hh':
            result = isFuture ? 'tunnin' : 'tuntia';
            break;
        case 'd':
            return isFuture ? 'pÃƒÂ¤ivÃƒÂ¤n' : 'pÃƒÂ¤ivÃƒÂ¤';
        case 'dd':
            result = isFuture ? 'pÃƒÂ¤ivÃƒÂ¤n' : 'pÃƒÂ¤ivÃƒÂ¤ÃƒÂ¤';
            break;
        case 'M':
            return isFuture ? 'kuukauden' : 'kuukausi';
        case 'MM':
            result = isFuture ? 'kuukauden' : 'kuukautta';
            break;
        case 'y':
            return isFuture ? 'vuoden' : 'vuosi';
        case 'yy':
            result = isFuture ? 'vuoden' : 'vuotta';
            break;
        }
        result = verbalNumber(number, isFuture) + ' ' + result;
        return result;
    }

    function verbalNumber(number, isFuture) {
        return number < 10 ? (isFuture ? numbersFuture[number] : numbersPast[number]) : number;
    }

    return moment.defineLocale('fi', {
        months : 'tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesÃƒÂ¤kuu_heinÃƒÂ¤kuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu'.split('_'),
        monthsShort : 'tammi_helmi_maalis_huhti_touko_kesÃƒÂ¤_heinÃƒÂ¤_elo_syys_loka_marras_joulu'.split('_'),
        weekdays : 'sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai'.split('_'),
        weekdaysShort : 'su_ma_ti_ke_to_pe_la'.split('_'),
        weekdaysMin : 'su_ma_ti_ke_to_pe_la'.split('_'),
        longDateFormat : {
            LT : 'HH.mm',
            LTS : 'HH.mm.ss',
            L : 'DD.MM.YYYY',
            LL : 'Do MMMM[ta] YYYY',
            LLL : 'Do MMMM[ta] YYYY, [klo] LT',
            LLLL : 'dddd, Do MMMM[ta] YYYY, [klo] LT',
            l : 'D.M.YYYY',
            ll : 'Do MMM YYYY',
            lll : 'Do MMM YYYY, [klo] LT',
            llll : 'ddd, Do MMM YYYY, [klo] LT'
        },
        calendar : {
            sameDay : '[tÃƒÂ¤nÃƒÂ¤ÃƒÂ¤n] [klo] LT',
            nextDay : '[huomenna] [klo] LT',
            nextWeek : 'dddd [klo] LT',
            lastDay : '[eilen] [klo] LT',
            lastWeek : '[viime] dddd[na] [klo] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s pÃƒÂ¤ÃƒÂ¤stÃƒÂ¤',
            past : '%s sitten',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : faroese (fo)
// author : Ragnar Johannesen : https://github.com/ragnar123

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('fo', {
        months : 'januar_februar_mars_aprÃƒÂ­l_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
        weekdays : 'sunnudagur_mÃƒÂ¡nadagur_tÃƒÂ½sdagur_mikudagur_hÃƒÂ³sdagur_frÃƒÂ­ggjadagur_leygardagur'.split('_'),
        weekdaysShort : 'sun_mÃƒÂ¡n_tÃƒÂ½s_mik_hÃƒÂ³s_frÃƒÂ­_ley'.split('_'),
        weekdaysMin : 'su_mÃƒÂ¡_tÃƒÂ½_mi_hÃƒÂ³_fr_le'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D. MMMM, YYYY LT'
        },
        calendar : {
            sameDay : '[ÃƒÂ dag kl.] LT',
            nextDay : '[ÃƒÂ morgin kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[ÃƒÂ gjÃƒÂ¡r kl.] LT',
            lastWeek : '[sÃƒÂ­ÃƒÂ°stu] dddd [kl] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'um %s',
            past : '%s sÃƒÂ­ÃƒÂ°ani',
            s : 'fÃƒÂ¡ sekund',
            m : 'ein minutt',
            mm : '%d minuttir',
            h : 'ein tÃƒÂ­mi',
            hh : '%d tÃƒÂ­mar',
            d : 'ein dagur',
            dd : '%d dagar',
            M : 'ein mÃƒÂ¡naÃƒÂ°i',
            MM : '%d mÃƒÂ¡naÃƒÂ°ir',
            y : 'eitt ÃƒÂ¡r',
            yy : '%d ÃƒÂ¡r'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : canadian french (fr-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('fr-ca', {
        months : 'janvier_fÃƒÂ©vrier_mars_avril_mai_juin_juillet_aoÃƒÂ»t_septembre_octobre_novembre_dÃƒÂ©cembre'.split('_'),
        monthsShort : 'janv._fÃƒÂ©vr._mars_avr._mai_juin_juil._aoÃƒÂ»t_sept._oct._nov._dÃƒÂ©c.'.split('_'),
        weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
        weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
        weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Aujourd\'hui Ãƒ ] LT',
            nextDay: '[Demain Ãƒ ] LT',
            nextWeek: 'dddd [Ãƒ ] LT',
            lastDay: '[Hier Ãƒ ] LT',
            lastWeek: 'dddd [dernier Ãƒ ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'dans %s',
            past : 'il y a %s',
            s : 'quelques secondes',
            m : 'une minute',
            mm : '%d minutes',
            h : 'une heure',
            hh : '%d heures',
            d : 'un jour',
            dd : '%d jours',
            M : 'un mois',
            MM : '%d mois',
            y : 'un an',
            yy : '%d ans'
        },
        ordinalParse: /\d{1,2}(er|)/,
        ordinal : function (number) {
            return number + (number === 1 ? 'er' : '');
        }
    });
}));
// moment.js locale configuration
// locale : french (fr)
// author : John Fischer : https://github.com/jfroffice

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('fr', {
        months : 'janvier_fÃƒÂ©vrier_mars_avril_mai_juin_juillet_aoÃƒÂ»t_septembre_octobre_novembre_dÃƒÂ©cembre'.split('_'),
        monthsShort : 'janv._fÃƒÂ©vr._mars_avr._mai_juin_juil._aoÃƒÂ»t_sept._oct._nov._dÃƒÂ©c.'.split('_'),
        weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
        weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
        weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Aujourd\'hui Ãƒ ] LT',
            nextDay: '[Demain Ãƒ ] LT',
            nextWeek: 'dddd [Ãƒ ] LT',
            lastDay: '[Hier Ãƒ ] LT',
            lastWeek: 'dddd [dernier Ãƒ ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'dans %s',
            past : 'il y a %s',
            s : 'quelques secondes',
            m : 'une minute',
            mm : '%d minutes',
            h : 'une heure',
            hh : '%d heures',
            d : 'un jour',
            dd : '%d jours',
            M : 'un mois',
            MM : '%d mois',
            y : 'un an',
            yy : '%d ans'
        },
        ordinalParse: /\d{1,2}(er|)/,
        ordinal : function (number) {
            return number + (number === 1 ? 'er' : '');
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : frisian (fy)
// author : Robin van der Vliet : https://github.com/robin0van0der0v

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsShortWithDots = 'jan._feb._mrt._apr._mai_jun._jul._aug._sep._okt._nov._des.'.split('_'),
        monthsShortWithoutDots = 'jan_feb_mrt_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_');

    return moment.defineLocale('fy', {
        months : 'jannewaris_febrewaris_maart_april_maaie_juny_july_augustus_septimber_oktober_novimber_desimber'.split('_'),
        monthsShort : function (m, format) {
            if (/-MMM-/.test(format)) {
                return monthsShortWithoutDots[m.month()];
            } else {
                return monthsShortWithDots[m.month()];
            }
        },
        weekdays : 'snein_moandei_tiisdei_woansdei_tongersdei_freed_sneon'.split('_'),
        weekdaysShort : 'si._mo._ti._wo._to._fr._so.'.split('_'),
        weekdaysMin : 'Si_Mo_Ti_Wo_To_Fr_So'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD-MM-YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[hjoed om] LT',
            nextDay: '[moarn om] LT',
            nextWeek: 'dddd [om] LT',
            lastDay: '[juster om] LT',
            lastWeek: '[ÃƒÂ´frÃƒÂ»ne] dddd [om] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'oer %s',
            past : '%s lyn',
            s : 'in pear sekonden',
            m : 'ien minÃƒÂºt',
            mm : '%d minuten',
            h : 'ien oere',
            hh : '%d oeren',
            d : 'ien dei',
            dd : '%d dagen',
            M : 'ien moanne',
            MM : '%d moannen',
            y : 'ien jier',
            yy : '%d jierren'
        },
        ordinalParse: /\d{1,2}(ste|de)/,
        ordinal : function (number) {
            return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : galician (gl)
// author : Juan G. Hurtado : https://github.com/juanghurtado

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('gl', {
        months : 'Xaneiro_Febreiro_Marzo_Abril_Maio_XuÃƒÂ±o_Xullo_Agosto_Setembro_Outubro_Novembro_Decembro'.split('_'),
        monthsShort : 'Xan._Feb._Mar._Abr._Mai._XuÃƒÂ±._Xul._Ago._Set._Out._Nov._Dec.'.split('_'),
        weekdays : 'Domingo_Luns_Martes_MÃƒÂ©rcores_Xoves_Venres_SÃƒÂ¡bado'.split('_'),
        weekdaysShort : 'Dom._Lun._Mar._MÃƒÂ©r._Xov._Ven._SÃƒÂ¡b.'.split('_'),
        weekdaysMin : 'Do_Lu_Ma_MÃƒÂ©_Xo_Ve_SÃƒÂ¡'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay : function () {
                return '[hoxe ' + ((this.hours() !== 1) ? 'ÃƒÂ¡s' : 'ÃƒÂ¡') + '] LT';
            },
            nextDay : function () {
                return '[maÃƒÂ±ÃƒÂ¡ ' + ((this.hours() !== 1) ? 'ÃƒÂ¡s' : 'ÃƒÂ¡') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [' + ((this.hours() !== 1) ? 'ÃƒÂ¡s' : 'a') + '] LT';
            },
            lastDay : function () {
                return '[onte ' + ((this.hours() !== 1) ? 'ÃƒÂ¡' : 'a') + '] LT';
            },
            lastWeek : function () {
                return '[o] dddd [pasado ' + ((this.hours() !== 1) ? 'ÃƒÂ¡s' : 'a') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : function (str) {
                if (str === 'uns segundos') {
                    return 'nuns segundos';
                }
                return 'en ' + str;
            },
            past : 'hai %s',
            s : 'uns segundos',
            m : 'un minuto',
            mm : '%d minutos',
            h : 'unha hora',
            hh : '%d horas',
            d : 'un dÃƒÂ­a',
            dd : '%d dÃƒÂ­as',
            M : 'un mes',
            MM : '%d meses',
            y : 'un ano',
            yy : '%d anos'
        },
        ordinalParse : /\d{1,2}Ã‚Âº/,
        ordinal : '%dÃ‚Âº',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Hebrew (he)
// author : Tomer Cohen : https://github.com/tomer
// author : Moshe Simantov : https://github.com/DevelopmentIL
// author : Tal Ater : https://github.com/TalAter

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('he', {
        months : 'Ã—â„¢Ã— Ã—â€¢Ã—ÂÃ—Â¨_Ã—Â¤Ã—â€˜Ã—Â¨Ã—â€¢Ã—ÂÃ—Â¨_Ã—Å¾Ã—Â¨Ã—Â¥_Ã—ÂÃ—Â¤Ã—Â¨Ã—â„¢Ã—Å“_Ã—Å¾Ã—ÂÃ—â„¢_Ã—â„¢Ã—â€¢Ã— Ã—â„¢_Ã—â„¢Ã—â€¢Ã—Å“Ã—â„¢_Ã—ÂÃ—â€¢Ã—â€™Ã—â€¢Ã—Â¡Ã—Ëœ_Ã—Â¡Ã—Â¤Ã—ËœÃ—Å¾Ã—â€˜Ã—Â¨_Ã—ÂÃ—â€¢Ã—Â§Ã—ËœÃ—â€¢Ã—â€˜Ã—Â¨_Ã— Ã—â€¢Ã—â€˜Ã—Å¾Ã—â€˜Ã—Â¨_Ã—â€œÃ—Â¦Ã—Å¾Ã—â€˜Ã—Â¨'.split('_'),
        monthsShort : 'Ã—â„¢Ã— Ã—â€¢Ã—Â³_Ã—Â¤Ã—â€˜Ã—Â¨Ã—Â³_Ã—Å¾Ã—Â¨Ã—Â¥_Ã—ÂÃ—Â¤Ã—Â¨Ã—Â³_Ã—Å¾Ã—ÂÃ—â„¢_Ã—â„¢Ã—â€¢Ã— Ã—â„¢_Ã—â„¢Ã—â€¢Ã—Å“Ã—â„¢_Ã—ÂÃ—â€¢Ã—â€™Ã—Â³_Ã—Â¡Ã—Â¤Ã—ËœÃ—Â³_Ã—ÂÃ—â€¢Ã—Â§Ã—Â³_Ã— Ã—â€¢Ã—â€˜Ã—Â³_Ã—â€œÃ—Â¦Ã—Å¾Ã—Â³'.split('_'),
        weekdays : 'Ã—Â¨Ã—ÂÃ—Â©Ã—â€¢Ã—Å¸_Ã—Â©Ã— Ã—â„¢_Ã—Â©Ã—Å“Ã—â„¢Ã—Â©Ã—â„¢_Ã—Â¨Ã—â€˜Ã—â„¢Ã—Â¢Ã—â„¢_Ã—â€”Ã—Å¾Ã—â„¢Ã—Â©Ã—â„¢_Ã—Â©Ã—â„¢Ã—Â©Ã—â„¢_Ã—Â©Ã—â€˜Ã—Âª'.split('_'),
        weekdaysShort : 'Ã—ÂÃ—Â³_Ã—â€˜Ã—Â³_Ã—â€™Ã—Â³_Ã—â€œÃ—Â³_Ã—â€Ã—Â³_Ã—â€¢Ã—Â³_Ã—Â©Ã—Â³'.split('_'),
        weekdaysMin : 'Ã—Â_Ã—â€˜_Ã—â€™_Ã—â€œ_Ã—â€_Ã—â€¢_Ã—Â©'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [Ã—â€˜]MMMM YYYY',
            LLL : 'D [Ã—â€˜]MMMM YYYY LT',
            LLLL : 'dddd, D [Ã—â€˜]MMMM YYYY LT',
            l : 'D/M/YYYY',
            ll : 'D MMM YYYY',
            lll : 'D MMM YYYY LT',
            llll : 'ddd, D MMM YYYY LT'
        },
        calendar : {
            sameDay : '[Ã—â€Ã—â„¢Ã—â€¢Ã—Â Ã—â€˜Ã–Â¾]LT',
            nextDay : '[Ã—Å¾Ã—â€”Ã—Â¨ Ã—â€˜Ã–Â¾]LT',
            nextWeek : 'dddd [Ã—â€˜Ã—Â©Ã—Â¢Ã—â€] LT',
            lastDay : '[Ã—ÂÃ—ÂªÃ—Å¾Ã—â€¢Ã—Å“ Ã—â€˜Ã–Â¾]LT',
            lastWeek : '[Ã—â€˜Ã—â„¢Ã—â€¢Ã—Â] dddd [Ã—â€Ã—ÂÃ—â€”Ã—Â¨Ã—â€¢Ã—Å¸ Ã—â€˜Ã—Â©Ã—Â¢Ã—â€] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'Ã—â€˜Ã—Â¢Ã—â€¢Ã—â€œ %s',
            past : 'Ã—Å“Ã—Â¤Ã— Ã—â„¢ %s',
            s : 'Ã—Å¾Ã—Â¡Ã—Â¤Ã—Â¨ Ã—Â©Ã— Ã—â„¢Ã—â€¢Ã—Âª',
            m : 'Ã—â€œÃ—Â§Ã—â€',
            mm : '%d Ã—â€œÃ—Â§Ã—â€¢Ã—Âª',
            h : 'Ã—Â©Ã—Â¢Ã—â€',
            hh : function (number) {
                if (number === 2) {
                    return 'Ã—Â©Ã—Â¢Ã—ÂªÃ—â„¢Ã—â„¢Ã—Â';
                }
                return number + ' Ã—Â©Ã—Â¢Ã—â€¢Ã—Âª';
            },
            d : 'Ã—â„¢Ã—â€¢Ã—Â',
            dd : function (number) {
                if (number === 2) {
                    return 'Ã—â„¢Ã—â€¢Ã—Å¾Ã—â„¢Ã—â„¢Ã—Â';
                }
                return number + ' Ã—â„¢Ã—Å¾Ã—â„¢Ã—Â';
            },
            M : 'Ã—â€”Ã—â€¢Ã—â€œÃ—Â©',
            MM : function (number) {
                if (number === 2) {
                    return 'Ã—â€”Ã—â€¢Ã—â€œÃ—Â©Ã—â„¢Ã—â„¢Ã—Â';
                }
                return number + ' Ã—â€”Ã—â€¢Ã—â€œÃ—Â©Ã—â„¢Ã—Â';
            },
            y : 'Ã—Â©Ã— Ã—â€',
            yy : function (number) {
                if (number === 2) {
                    return 'Ã—Â©Ã— Ã—ÂªÃ—â„¢Ã—â„¢Ã—Â';
                } else if (number % 10 === 0 && number !== 10) {
                    return number + ' Ã—Â©Ã— Ã—â€';
                }
                return number + ' Ã—Â©Ã— Ã—â„¢Ã—Â';
            }
        }
    });
}));
// moment.js locale configuration
// locale : hindi (hi)
// author : Mayank Singhal : https://github.com/mayanksinghal

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ã Â¥Â§',
        '2': 'Ã Â¥Â¨',
        '3': 'Ã Â¥Â©',
        '4': 'Ã Â¥Âª',
        '5': 'Ã Â¥Â«',
        '6': 'Ã Â¥Â¬',
        '7': 'Ã Â¥Â­',
        '8': 'Ã Â¥Â®',
        '9': 'Ã Â¥Â¯',
        '0': 'Ã Â¥Â¦'
    },
    numberMap = {
        'Ã Â¥Â§': '1',
        'Ã Â¥Â¨': '2',
        'Ã Â¥Â©': '3',
        'Ã Â¥Âª': '4',
        'Ã Â¥Â«': '5',
        'Ã Â¥Â¬': '6',
        'Ã Â¥Â­': '7',
        'Ã Â¥Â®': '8',
        'Ã Â¥Â¯': '9',
        'Ã Â¥Â¦': '0'
    };

    return moment.defineLocale('hi', {
        months : 'Ã Â¤Å“Ã Â¤Â¨Ã Â¤ÂµÃ Â¤Â°Ã Â¥â‚¬_Ã Â¤Â«Ã Â¤Â¼Ã Â¤Â°Ã Â¤ÂµÃ Â¤Â°Ã Â¥â‚¬_Ã Â¤Â®Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤Å¡_Ã Â¤â€¦Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¥Ë†Ã Â¤Â²_Ã Â¤Â®Ã Â¤Ë†_Ã Â¤Å“Ã Â¥â€šÃ Â¤Â¨_Ã Â¤Å“Ã Â¥ÂÃ Â¤Â²Ã Â¤Â¾Ã Â¤Ë†_Ã Â¤â€¦Ã Â¤â€”Ã Â¤Â¸Ã Â¥ÂÃ Â¤Â¤_Ã Â¤Â¸Ã Â¤Â¿Ã Â¤Â¤Ã Â¤Â®Ã Â¥ÂÃ Â¤Â¬Ã Â¤Â°_Ã Â¤â€¦Ã Â¤â€¢Ã Â¥ÂÃ Â¤Å¸Ã Â¥â€šÃ Â¤Â¬Ã Â¤Â°_Ã Â¤Â¨Ã Â¤ÂµÃ Â¤Â®Ã Â¥ÂÃ Â¤Â¬Ã Â¤Â°_Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â¸Ã Â¤Â®Ã Â¥ÂÃ Â¤Â¬Ã Â¤Â°'.split('_'),
        monthsShort : 'Ã Â¤Å“Ã Â¤Â¨._Ã Â¤Â«Ã Â¤Â¼Ã Â¤Â°._Ã Â¤Â®Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤Å¡_Ã Â¤â€¦Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¥Ë†._Ã Â¤Â®Ã Â¤Ë†_Ã Â¤Å“Ã Â¥â€šÃ Â¤Â¨_Ã Â¤Å“Ã Â¥ÂÃ Â¤Â²._Ã Â¤â€¦Ã Â¤â€”._Ã Â¤Â¸Ã Â¤Â¿Ã Â¤Â¤._Ã Â¤â€¦Ã Â¤â€¢Ã Â¥ÂÃ Â¤Å¸Ã Â¥â€š._Ã Â¤Â¨Ã Â¤Âµ._Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â¸.'.split('_'),
        weekdays : 'Ã Â¤Â°Ã Â¤ÂµÃ Â¤Â¿Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤Â¸Ã Â¥â€¹Ã Â¤Â®Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤Â®Ã Â¤â€šÃ Â¤â€”Ã Â¤Â²Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤Â¬Ã Â¥ÂÃ Â¤Â§Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤â€”Ã Â¥ÂÃ Â¤Â°Ã Â¥â€šÃ Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤Â¶Ã Â¥ÂÃ Â¤â€¢Ã Â¥ÂÃ Â¤Â°Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤Â¶Ã Â¤Â¨Ã Â¤Â¿Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°'.split('_'),
        weekdaysShort : 'Ã Â¤Â°Ã Â¤ÂµÃ Â¤Â¿_Ã Â¤Â¸Ã Â¥â€¹Ã Â¤Â®_Ã Â¤Â®Ã Â¤â€šÃ Â¤â€”Ã Â¤Â²_Ã Â¤Â¬Ã Â¥ÂÃ Â¤Â§_Ã Â¤â€”Ã Â¥ÂÃ Â¤Â°Ã Â¥â€š_Ã Â¤Â¶Ã Â¥ÂÃ Â¤â€¢Ã Â¥ÂÃ Â¤Â°_Ã Â¤Â¶Ã Â¤Â¨Ã Â¤Â¿'.split('_'),
        weekdaysMin : 'Ã Â¤Â°_Ã Â¤Â¸Ã Â¥â€¹_Ã Â¤Â®Ã Â¤â€š_Ã Â¤Â¬Ã Â¥Â_Ã Â¤â€”Ã Â¥Â_Ã Â¤Â¶Ã Â¥Â_Ã Â¤Â¶'.split('_'),
        longDateFormat : {
            LT : 'A h:mm Ã Â¤Â¬Ã Â¤Å“Ã Â¥â€¡',
            LTS : 'A h:mm:ss Ã Â¤Â¬Ã Â¤Å“Ã Â¥â€¡',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[Ã Â¤â€ Ã Â¤Å“] LT',
            nextDay : '[Ã Â¤â€¢Ã Â¤Â²] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[Ã Â¤â€¢Ã Â¤Â²] LT',
            lastWeek : '[Ã Â¤ÂªÃ Â¤Â¿Ã Â¤â€ºÃ Â¤Â²Ã Â¥â€¡] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š',
            past : '%s Ã Â¤ÂªÃ Â¤Â¹Ã Â¤Â²Ã Â¥â€¡',
            s : 'Ã Â¤â€¢Ã Â¥ÂÃ Â¤â€º Ã Â¤Â¹Ã Â¥â‚¬ Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â·Ã Â¤Â£',
            m : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤Â®Ã Â¤Â¿Ã Â¤Â¨Ã Â¤Å¸',
            mm : '%d Ã Â¤Â®Ã Â¤Â¿Ã Â¤Â¨Ã Â¤Å¸',
            h : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤ËœÃ Â¤â€šÃ Â¤Å¸Ã Â¤Â¾',
            hh : '%d Ã Â¤ËœÃ Â¤â€šÃ Â¤Å¸Ã Â¥â€¡',
            d : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â¨',
            dd : '%d Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â¨',
            M : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤Â®Ã Â¤Â¹Ã Â¥â‚¬Ã Â¤Â¨Ã Â¥â€¡',
            MM : '%d Ã Â¤Â®Ã Â¤Â¹Ã Â¥â‚¬Ã Â¤Â¨Ã Â¥â€¡',
            y : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤ÂµÃ Â¤Â°Ã Â¥ÂÃ Â¤Â·',
            yy : '%d Ã Â¤ÂµÃ Â¤Â°Ã Â¥ÂÃ Â¤Â·'
        },
        preparse: function (string) {
            return string.replace(/[Ã Â¥Â§Ã Â¥Â¨Ã Â¥Â©Ã Â¥ÂªÃ Â¥Â«Ã Â¥Â¬Ã Â¥Â­Ã Â¥Â®Ã Â¥Â¯Ã Â¥Â¦]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        // Hindi notation for meridiems are quite fuzzy in practice. While there exists
        // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
        meridiemParse: /Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤|Ã Â¤Â¸Ã Â¥ÂÃ Â¤Â¬Ã Â¤Â¹|Ã Â¤Â¦Ã Â¥â€¹Ã Â¤ÂªÃ Â¤Â¹Ã Â¤Â°|Ã Â¤Â¶Ã Â¤Â¾Ã Â¤Â®/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === 'Ã Â¤Â¸Ã Â¥ÂÃ Â¤Â¬Ã Â¤Â¹') {
                return hour;
            } else if (meridiem === 'Ã Â¤Â¦Ã Â¥â€¹Ã Â¤ÂªÃ Â¤Â¹Ã Â¤Â°') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === 'Ã Â¤Â¶Ã Â¤Â¾Ã Â¤Â®') {
                return hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤';
            } else if (hour < 10) {
                return 'Ã Â¤Â¸Ã Â¥ÂÃ Â¤Â¬Ã Â¤Â¹';
            } else if (hour < 17) {
                return 'Ã Â¤Â¦Ã Â¥â€¹Ã Â¤ÂªÃ Â¤Â¹Ã Â¤Â°';
            } else if (hour < 20) {
                return 'Ã Â¤Â¶Ã Â¤Â¾Ã Â¤Â®';
            } else {
                return 'Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : hrvatski (hr)
// author : Bojan MarkoviÃ„â€¡ : https://github.com/bmarkovic

// based on (sl) translation by Robert SedovÃ…Â¡ek

(function (factory) {
    factory(moment);
}(function (moment) {
    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'jedna minuta' : 'jedne minute';
        case 'mm':
            if (number === 1) {
                result += 'minuta';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'minute';
            } else {
                result += 'minuta';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'jedan sat' : 'jednog sata';
        case 'hh':
            if (number === 1) {
                result += 'sat';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'sata';
            } else {
                result += 'sati';
            }
            return result;
        case 'dd':
            if (number === 1) {
                result += 'dan';
            } else {
                result += 'dana';
            }
            return result;
        case 'MM':
            if (number === 1) {
                result += 'mjesec';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'mjeseca';
            } else {
                result += 'mjeseci';
            }
            return result;
        case 'yy':
            if (number === 1) {
                result += 'godina';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'godine';
            } else {
                result += 'godina';
            }
            return result;
        }
    }

    return moment.defineLocale('hr', {
        months : 'sjeÃ„Âanj_veljaÃ„Âa_oÃ…Â¾ujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac'.split('_'),
        monthsShort : 'sje._vel._oÃ…Â¾u._tra._svi._lip._srp._kol._ruj._lis._stu._pro.'.split('_'),
        weekdays : 'nedjelja_ponedjeljak_utorak_srijeda_Ã„Âetvrtak_petak_subota'.split('_'),
        weekdaysShort : 'ned._pon._uto._sri._Ã„Âet._pet._sub.'.split('_'),
        weekdaysMin : 'ne_po_ut_sr_Ã„Âe_pe_su'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD. MM. YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[danas u] LT',
            nextDay  : '[sutra u] LT',

            nextWeek : function () {
                switch (this.day()) {
                case 0:
                    return '[u] [nedjelju] [u] LT';
                case 3:
                    return '[u] [srijedu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juÃ„Âer u] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                    return '[proÃ…Â¡lu] dddd [u] LT';
                case 6:
                    return '[proÃ…Â¡le] [subote] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[proÃ…Â¡li] dddd [u] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'za %s',
            past   : 'prije %s',
            s      : 'par sekundi',
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : 'dan',
            dd     : translate,
            M      : 'mjesec',
            MM     : translate,
            y      : 'godinu',
            yy     : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : hungarian (hu)
// author : Adam Brunner : https://github.com/adambrunner

(function (factory) {
    factory(moment);
}(function (moment) {
    var weekEndings = 'vasÃƒÂ¡rnap hÃƒÂ©tfÃ…â€˜n kedden szerdÃƒÂ¡n csÃƒÂ¼tÃƒÂ¶rtÃƒÂ¶kÃƒÂ¶n pÃƒÂ©nteken szombaton'.split(' ');

    function translate(number, withoutSuffix, key, isFuture) {
        var num = number,
            suffix;

        switch (key) {
        case 's':
            return (isFuture || withoutSuffix) ? 'nÃƒÂ©hÃƒÂ¡ny mÃƒÂ¡sodperc' : 'nÃƒÂ©hÃƒÂ¡ny mÃƒÂ¡sodperce';
        case 'm':
            return 'egy' + (isFuture || withoutSuffix ? ' perc' : ' perce');
        case 'mm':
            return num + (isFuture || withoutSuffix ? ' perc' : ' perce');
        case 'h':
            return 'egy' + (isFuture || withoutSuffix ? ' ÃƒÂ³ra' : ' ÃƒÂ³rÃƒÂ¡ja');
        case 'hh':
            return num + (isFuture || withoutSuffix ? ' ÃƒÂ³ra' : ' ÃƒÂ³rÃƒÂ¡ja');
        case 'd':
            return 'egy' + (isFuture || withoutSuffix ? ' nap' : ' napja');
        case 'dd':
            return num + (isFuture || withoutSuffix ? ' nap' : ' napja');
        case 'M':
            return 'egy' + (isFuture || withoutSuffix ? ' hÃƒÂ³nap' : ' hÃƒÂ³napja');
        case 'MM':
            return num + (isFuture || withoutSuffix ? ' hÃƒÂ³nap' : ' hÃƒÂ³napja');
        case 'y':
            return 'egy' + (isFuture || withoutSuffix ? ' ÃƒÂ©v' : ' ÃƒÂ©ve');
        case 'yy':
            return num + (isFuture || withoutSuffix ? ' ÃƒÂ©v' : ' ÃƒÂ©ve');
        }

        return '';
    }

    function week(isFuture) {
        return (isFuture ? '' : '[mÃƒÂºlt] ') + '[' + weekEndings[this.day()] + '] LT[-kor]';
    }

    return moment.defineLocale('hu', {
        months : 'januÃƒÂ¡r_februÃƒÂ¡r_mÃƒÂ¡rcius_ÃƒÂ¡prilis_mÃƒÂ¡jus_jÃƒÂºnius_jÃƒÂºlius_augusztus_szeptember_oktÃƒÂ³ber_november_december'.split('_'),
        monthsShort : 'jan_feb_mÃƒÂ¡rc_ÃƒÂ¡pr_mÃƒÂ¡j_jÃƒÂºn_jÃƒÂºl_aug_szept_okt_nov_dec'.split('_'),
        weekdays : 'vasÃƒÂ¡rnap_hÃƒÂ©tfÃ…â€˜_kedd_szerda_csÃƒÂ¼tÃƒÂ¶rtÃƒÂ¶k_pÃƒÂ©ntek_szombat'.split('_'),
        weekdaysShort : 'vas_hÃƒÂ©t_kedd_sze_csÃƒÂ¼t_pÃƒÂ©n_szo'.split('_'),
        weekdaysMin : 'v_h_k_sze_cs_p_szo'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'YYYY.MM.DD.',
            LL : 'YYYY. MMMM D.',
            LLL : 'YYYY. MMMM D., LT',
            LLLL : 'YYYY. MMMM D., dddd LT'
        },
        meridiemParse: /de|du/i,
        isPM: function (input) {
            return input.charAt(1).toLowerCase() === 'u';
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 12) {
                return isLower === true ? 'de' : 'DE';
            } else {
                return isLower === true ? 'du' : 'DU';
            }
        },
        calendar : {
            sameDay : '[ma] LT[-kor]',
            nextDay : '[holnap] LT[-kor]',
            nextWeek : function () {
                return week.call(this, true);
            },
            lastDay : '[tegnap] LT[-kor]',
            lastWeek : function () {
                return week.call(this, false);
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s mÃƒÂºlva',
            past : '%s',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Armenian (hy-am)
// author : Armendarabyan : https://github.com/armendarabyan

(function (factory) {
    factory(moment);
}(function (moment) {
    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'Ã•Â°Ã•Â¸Ã–â€šÃ•Â¶Ã•Â¾Ã•Â¡Ã–â‚¬_Ã–Æ’Ã•Â¥Ã•Â¿Ã–â‚¬Ã•Â¾Ã•Â¡Ã–â‚¬_Ã•Â´Ã•Â¡Ã–â‚¬Ã•Â¿_Ã•Â¡Ã•ÂºÃ–â‚¬Ã•Â«Ã•Â¬_Ã•Â´Ã•Â¡Ã•ÂµÃ•Â«Ã•Â½_Ã•Â°Ã•Â¸Ã–â€šÃ•Â¶Ã•Â«Ã•Â½_Ã•Â°Ã•Â¸Ã–â€šÃ•Â¬Ã•Â«Ã•Â½_Ã–â€¦Ã•Â£Ã•Â¸Ã•Â½Ã•Â¿Ã•Â¸Ã•Â½_Ã•Â½Ã•Â¥Ã•ÂºÃ•Â¿Ã•Â¥Ã•Â´Ã•Â¢Ã•Â¥Ã–â‚¬_Ã•Â°Ã•Â¸Ã•Â¯Ã•Â¿Ã•Â¥Ã•Â´Ã•Â¢Ã•Â¥Ã–â‚¬_Ã•Â¶Ã•Â¸Ã•ÂµÃ•Â¥Ã•Â´Ã•Â¢Ã•Â¥Ã–â‚¬_Ã•Â¤Ã•Â¥Ã•Â¯Ã•Â¿Ã•Â¥Ã•Â´Ã•Â¢Ã•Â¥Ã–â‚¬'.split('_'),
            'accusative': 'Ã•Â°Ã•Â¸Ã–â€šÃ•Â¶Ã•Â¾Ã•Â¡Ã–â‚¬Ã•Â«_Ã–Æ’Ã•Â¥Ã•Â¿Ã–â‚¬Ã•Â¾Ã•Â¡Ã–â‚¬Ã•Â«_Ã•Â´Ã•Â¡Ã–â‚¬Ã•Â¿Ã•Â«_Ã•Â¡Ã•ÂºÃ–â‚¬Ã•Â«Ã•Â¬Ã•Â«_Ã•Â´Ã•Â¡Ã•ÂµÃ•Â«Ã•Â½Ã•Â«_Ã•Â°Ã•Â¸Ã–â€šÃ•Â¶Ã•Â«Ã•Â½Ã•Â«_Ã•Â°Ã•Â¸Ã–â€šÃ•Â¬Ã•Â«Ã•Â½Ã•Â«_Ã–â€¦Ã•Â£Ã•Â¸Ã•Â½Ã•Â¿Ã•Â¸Ã•Â½Ã•Â«_Ã•Â½Ã•Â¥Ã•ÂºÃ•Â¿Ã•Â¥Ã•Â´Ã•Â¢Ã•Â¥Ã–â‚¬Ã•Â«_Ã•Â°Ã•Â¸Ã•Â¯Ã•Â¿Ã•Â¥Ã•Â´Ã•Â¢Ã•Â¥Ã–â‚¬Ã•Â«_Ã•Â¶Ã•Â¸Ã•ÂµÃ•Â¥Ã•Â´Ã•Â¢Ã•Â¥Ã–â‚¬Ã•Â«_Ã•Â¤Ã•Â¥Ã•Â¯Ã•Â¿Ã•Â¥Ã•Â´Ã•Â¢Ã•Â¥Ã–â‚¬Ã•Â«'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function monthsShortCaseReplace(m, format) {
        var monthsShort = 'Ã•Â°Ã•Â¶Ã•Â¾_Ã–Æ’Ã•Â¿Ã–â‚¬_Ã•Â´Ã–â‚¬Ã•Â¿_Ã•Â¡Ã•ÂºÃ–â‚¬_Ã•Â´Ã•ÂµÃ•Â½_Ã•Â°Ã•Â¶Ã•Â½_Ã•Â°Ã•Â¬Ã•Â½_Ã–â€¦Ã•Â£Ã•Â½_Ã•Â½Ã•ÂºÃ•Â¿_Ã•Â°Ã•Â¯Ã•Â¿_Ã•Â¶Ã•Â´Ã•Â¢_Ã•Â¤Ã•Â¯Ã•Â¿'.split('_');

        return monthsShort[m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = 'Ã•Â¯Ã•Â«Ã–â‚¬Ã•Â¡Ã•Â¯Ã•Â«_Ã•Â¥Ã–â‚¬Ã•Â¯Ã•Â¸Ã–â€šÃ•Â·Ã•Â¡Ã•Â¢Ã•Â©Ã•Â«_Ã•Â¥Ã–â‚¬Ã•Â¥Ã–â€žÃ•Â·Ã•Â¡Ã•Â¢Ã•Â©Ã•Â«_Ã•Â¹Ã•Â¸Ã–â‚¬Ã•Â¥Ã–â€žÃ•Â·Ã•Â¡Ã•Â¢Ã•Â©Ã•Â«_Ã•Â°Ã•Â«Ã•Â¶Ã•Â£Ã•Â·Ã•Â¡Ã•Â¢Ã•Â©Ã•Â«_Ã•Â¸Ã–â€šÃ–â‚¬Ã•Â¢Ã•Â¡Ã•Â©_Ã•Â·Ã•Â¡Ã•Â¢Ã•Â¡Ã•Â©'.split('_');

        return weekdays[m.day()];
    }

    return moment.defineLocale('hy-am', {
        months : monthsCaseReplace,
        monthsShort : monthsShortCaseReplace,
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'Ã•Â¯Ã–â‚¬Ã•Â¯_Ã•Â¥Ã–â‚¬Ã•Â¯_Ã•Â¥Ã–â‚¬Ã–â€ž_Ã•Â¹Ã–â‚¬Ã–â€ž_Ã•Â°Ã•Â¶Ã•Â£_Ã•Â¸Ã–â€šÃ–â‚¬Ã•Â¢_Ã•Â·Ã•Â¢Ã•Â©'.split('_'),
        weekdaysMin : 'Ã•Â¯Ã–â‚¬Ã•Â¯_Ã•Â¥Ã–â‚¬Ã•Â¯_Ã•Â¥Ã–â‚¬Ã–â€ž_Ã•Â¹Ã–â‚¬Ã–â€ž_Ã•Â°Ã•Â¶Ã•Â£_Ã•Â¸Ã–â€šÃ–â‚¬Ã•Â¢_Ã•Â·Ã•Â¢Ã•Â©'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY Ã•Â©.',
            LLL : 'D MMMM YYYY Ã•Â©., LT',
            LLLL : 'dddd, D MMMM YYYY Ã•Â©., LT'
        },
        calendar : {
            sameDay: '[Ã•Â¡Ã•ÂµÃ•Â½Ã–â€¦Ã–â‚¬] LT',
            nextDay: '[Ã•Â¾Ã•Â¡Ã•Â²Ã•Â¨] LT',
            lastDay: '[Ã•Â¥Ã–â‚¬Ã•Â¥Ã•Â¯] LT',
            nextWeek: function () {
                return 'dddd [Ã–â€¦Ã–â‚¬Ã•Â¨ Ã•ÂªÃ•Â¡Ã•Â´Ã•Â¨] LT';
            },
            lastWeek: function () {
                return '[Ã•Â¡Ã•Â¶Ã–ÂÃ•Â¡Ã•Â®] dddd [Ã–â€¦Ã–â‚¬Ã•Â¨ Ã•ÂªÃ•Â¡Ã•Â´Ã•Â¨] LT';
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : '%s Ã•Â°Ã•Â¥Ã•Â¿Ã•Â¸',
            past : '%s Ã•Â¡Ã•Â¼Ã•Â¡Ã•Â»',
            s : 'Ã•Â´Ã•Â« Ã–â€žÃ•Â¡Ã•Â¶Ã•Â« Ã•Â¾Ã•Â¡Ã•ÂµÃ–â‚¬Ã•Â¯Ã•ÂµÃ•Â¡Ã•Â¶',
            m : 'Ã–â‚¬Ã•Â¸Ã•ÂºÃ•Â¥',
            mm : '%d Ã–â‚¬Ã•Â¸Ã•ÂºÃ•Â¥',
            h : 'Ã•ÂªÃ•Â¡Ã•Â´',
            hh : '%d Ã•ÂªÃ•Â¡Ã•Â´',
            d : 'Ã–â€¦Ã–â‚¬',
            dd : '%d Ã–â€¦Ã–â‚¬',
            M : 'Ã•Â¡Ã•Â´Ã•Â«Ã•Â½',
            MM : '%d Ã•Â¡Ã•Â´Ã•Â«Ã•Â½',
            y : 'Ã•Â¿Ã•Â¡Ã–â‚¬Ã•Â«',
            yy : '%d Ã•Â¿Ã•Â¡Ã–â‚¬Ã•Â«'
        },

        meridiemParse: /Ã•Â£Ã•Â«Ã•Â·Ã•Â¥Ã–â‚¬Ã•Â¾Ã•Â¡|Ã•Â¡Ã•Â¼Ã•Â¡Ã•Â¾Ã•Â¸Ã•Â¿Ã•Â¾Ã•Â¡|Ã–ÂÃ•Â¥Ã–â‚¬Ã•Â¥Ã•Â¯Ã•Â¾Ã•Â¡|Ã•Â¥Ã–â‚¬Ã•Â¥Ã•Â¯Ã•Â¸Ã•ÂµÃ•Â¡Ã•Â¶/,
        isPM: function (input) {
            return /^(Ã–ÂÃ•Â¥Ã–â‚¬Ã•Â¥Ã•Â¯Ã•Â¾Ã•Â¡|Ã•Â¥Ã–â‚¬Ã•Â¥Ã•Â¯Ã•Â¸Ã•ÂµÃ•Â¡Ã•Â¶)$/.test(input);
        },
        meridiem : function (hour) {
            if (hour < 4) {
                return 'Ã•Â£Ã•Â«Ã•Â·Ã•Â¥Ã–â‚¬Ã•Â¾Ã•Â¡';
            } else if (hour < 12) {
                return 'Ã•Â¡Ã•Â¼Ã•Â¡Ã•Â¾Ã•Â¸Ã•Â¿Ã•Â¾Ã•Â¡';
            } else if (hour < 17) {
                return 'Ã–ÂÃ•Â¥Ã–â‚¬Ã•Â¥Ã•Â¯Ã•Â¾Ã•Â¡';
            } else {
                return 'Ã•Â¥Ã–â‚¬Ã•Â¥Ã•Â¯Ã•Â¸Ã•ÂµÃ•Â¡Ã•Â¶';
            }
        },

        ordinalParse: /\d{1,2}|\d{1,2}-(Ã•Â«Ã•Â¶|Ã–â‚¬Ã•Â¤)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'DDD':
            case 'w':
            case 'W':
            case 'DDDo':
                if (number === 1) {
                    return number + '-Ã•Â«Ã•Â¶';
                }
                return number + '-Ã–â‚¬Ã•Â¤';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Bahasa Indonesia (id)
// author : Mohammad Satrio Utomo : https://github.com/tyok
// reference: http://id.wikisource.org/wiki/Pedoman_Umum_Ejaan_Bahasa_Indonesia_yang_Disempurnakan

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('id', {
        months : 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des'.split('_'),
        weekdays : 'Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu'.split('_'),
        weekdaysShort : 'Min_Sen_Sel_Rab_Kam_Jum_Sab'.split('_'),
        weekdaysMin : 'Mg_Sn_Sl_Rb_Km_Jm_Sb'.split('_'),
        longDateFormat : {
            LT : 'HH.mm',
            LTS : 'LT.ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY [pukul] LT',
            LLLL : 'dddd, D MMMM YYYY [pukul] LT'
        },
        meridiemParse: /pagi|siang|sore|malam/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'pagi') {
                return hour;
            } else if (meridiem === 'siang') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'sore' || meridiem === 'malam') {
                return hour + 12;
            }
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'pagi';
            } else if (hours < 15) {
                return 'siang';
            } else if (hours < 19) {
                return 'sore';
            } else {

                return 'malam';
            }
        },
        calendar : {
            sameDay : '[Hari ini pukul] LT',
            nextDay : '[Besok pukul] LT',
            nextWeek : 'dddd [pukul] LT',
            lastDay : '[Kemarin pukul] LT',
            lastWeek : 'dddd [lalu pukul] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'dalam %s',
            past : '%s yang lalu',
            s : 'beberapa detik',
            m : 'semenit',
            mm : '%d menit',
            h : 'sejam',
            hh : '%d jam',
            d : 'sehari',
            dd : '%d hari',
            M : 'sebulan',
            MM : '%d bulan',
            y : 'setahun',
            yy : '%d tahun'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : icelandic (is)
// author : Hinrik Ãƒâ€“rn SigurÃƒÂ°sson : https://github.com/hinrik

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(n) {
        if (n % 100 === 11) {
            return true;
        } else if (n % 10 === 1) {
            return false;
        }
        return true;
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
        case 's':
            return withoutSuffix || isFuture ? 'nokkrar sekÃƒÂºndur' : 'nokkrum sekÃƒÂºndum';
        case 'm':
            return withoutSuffix ? 'mÃƒÂ­nÃƒÂºta' : 'mÃƒÂ­nÃƒÂºtu';
        case 'mm':
            if (plural(number)) {
                return result + (withoutSuffix || isFuture ? 'mÃƒÂ­nÃƒÂºtur' : 'mÃƒÂ­nÃƒÂºtum');
            } else if (withoutSuffix) {
                return result + 'mÃƒÂ­nÃƒÂºta';
            }
            return result + 'mÃƒÂ­nÃƒÂºtu';
        case 'hh':
            if (plural(number)) {
                return result + (withoutSuffix || isFuture ? 'klukkustundir' : 'klukkustundum');
            }
            return result + 'klukkustund';
        case 'd':
            if (withoutSuffix) {
                return 'dagur';
            }
            return isFuture ? 'dag' : 'degi';
        case 'dd':
            if (plural(number)) {
                if (withoutSuffix) {
                    return result + 'dagar';
                }
                return result + (isFuture ? 'daga' : 'dÃƒÂ¶gum');
            } else if (withoutSuffix) {
                return result + 'dagur';
            }
            return result + (isFuture ? 'dag' : 'degi');
        case 'M':
            if (withoutSuffix) {
                return 'mÃƒÂ¡nuÃƒÂ°ur';
            }
            return isFuture ? 'mÃƒÂ¡nuÃƒÂ°' : 'mÃƒÂ¡nuÃƒÂ°i';
        case 'MM':
            if (plural(number)) {
                if (withoutSuffix) {
                    return result + 'mÃƒÂ¡nuÃƒÂ°ir';
                }
                return result + (isFuture ? 'mÃƒÂ¡nuÃƒÂ°i' : 'mÃƒÂ¡nuÃƒÂ°um');
            } else if (withoutSuffix) {
                return result + 'mÃƒÂ¡nuÃƒÂ°ur';
            }
            return result + (isFuture ? 'mÃƒÂ¡nuÃƒÂ°' : 'mÃƒÂ¡nuÃƒÂ°i');
        case 'y':
            return withoutSuffix || isFuture ? 'ÃƒÂ¡r' : 'ÃƒÂ¡ri';
        case 'yy':
            if (plural(number)) {
                return result + (withoutSuffix || isFuture ? 'ÃƒÂ¡r' : 'ÃƒÂ¡rum');
            }
            return result + (withoutSuffix || isFuture ? 'ÃƒÂ¡r' : 'ÃƒÂ¡ri');
        }
    }

    return moment.defineLocale('is', {
        months : 'janÃƒÂºar_febrÃƒÂºar_mars_aprÃƒÂ­l_maÃƒÂ­_jÃƒÂºnÃƒÂ­_jÃƒÂºlÃƒÂ­_ÃƒÂ¡gÃƒÂºst_september_oktÃƒÂ³ber_nÃƒÂ³vember_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maÃƒÂ­_jÃƒÂºn_jÃƒÂºl_ÃƒÂ¡gÃƒÂº_sep_okt_nÃƒÂ³v_des'.split('_'),
        weekdays : 'sunnudagur_mÃƒÂ¡nudagur_ÃƒÂ¾riÃƒÂ°judagur_miÃƒÂ°vikudagur_fimmtudagur_fÃƒÂ¶studagur_laugardagur'.split('_'),
        weekdaysShort : 'sun_mÃƒÂ¡n_ÃƒÂ¾ri_miÃƒÂ°_fim_fÃƒÂ¶s_lau'.split('_'),
        weekdaysMin : 'Su_MÃƒÂ¡_ÃƒÅ¾r_Mi_Fi_FÃƒÂ¶_La'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY [kl.] LT',
            LLLL : 'dddd, D. MMMM YYYY [kl.] LT'
        },
        calendar : {
            sameDay : '[ÃƒÂ­ dag kl.] LT',
            nextDay : '[ÃƒÂ¡ morgun kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[ÃƒÂ­ gÃƒÂ¦r kl.] LT',
            lastWeek : '[sÃƒÂ­ÃƒÂ°asta] dddd [kl.] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'eftir %s',
            past : 'fyrir %s sÃƒÂ­ÃƒÂ°an',
            s : translate,
            m : translate,
            mm : translate,
            h : 'klukkustund',
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : italian (it)
// author : Lorenzo : https://github.com/aliem
// author: Mattia Larentis: https://github.com/nostalgiaz

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('it', {
        months : 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split('_'),
        monthsShort : 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split('_'),
        weekdays : 'Domenica_LunedÃƒÂ¬_MartedÃƒÂ¬_MercoledÃƒÂ¬_GiovedÃƒÂ¬_VenerdÃƒÂ¬_Sabato'.split('_'),
        weekdaysShort : 'Dom_Lun_Mar_Mer_Gio_Ven_Sab'.split('_'),
        weekdaysMin : 'D_L_Ma_Me_G_V_S'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Oggi alle] LT',
            nextDay: '[Domani alle] LT',
            nextWeek: 'dddd [alle] LT',
            lastDay: '[Ieri alle] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[la scorsa] dddd [alle] LT';
                    default:
                        return '[lo scorso] dddd [alle] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : function (s) {
                return ((/^[0-9].+$/).test(s) ? 'tra' : 'in') + ' ' + s;
            },
            past : '%s fa',
            s : 'alcuni secondi',
            m : 'un minuto',
            mm : '%d minuti',
            h : 'un\'ora',
            hh : '%d ore',
            d : 'un giorno',
            dd : '%d giorni',
            M : 'un mese',
            MM : '%d mesi',
            y : 'un anno',
            yy : '%d anni'
        },
        ordinalParse : /\d{1,2}Ã‚Âº/,
        ordinal: '%dÃ‚Âº',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : japanese (ja)
// author : LI Long : https://github.com/baryon

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ja', {
        months : '1Ã¦Å“Ë†_2Ã¦Å“Ë†_3Ã¦Å“Ë†_4Ã¦Å“Ë†_5Ã¦Å“Ë†_6Ã¦Å“Ë†_7Ã¦Å“Ë†_8Ã¦Å“Ë†_9Ã¦Å“Ë†_10Ã¦Å“Ë†_11Ã¦Å“Ë†_12Ã¦Å“Ë†'.split('_'),
        monthsShort : '1Ã¦Å“Ë†_2Ã¦Å“Ë†_3Ã¦Å“Ë†_4Ã¦Å“Ë†_5Ã¦Å“Ë†_6Ã¦Å“Ë†_7Ã¦Å“Ë†_8Ã¦Å“Ë†_9Ã¦Å“Ë†_10Ã¦Å“Ë†_11Ã¦Å“Ë†_12Ã¦Å“Ë†'.split('_'),
        weekdays : 'Ã¦â€”Â¥Ã¦â€ºÅ“Ã¦â€”Â¥_Ã¦Å“Ë†Ã¦â€ºÅ“Ã¦â€”Â¥_Ã§ÂÂ«Ã¦â€ºÅ“Ã¦â€”Â¥_Ã¦Â°Â´Ã¦â€ºÅ“Ã¦â€”Â¥_Ã¦Å“Â¨Ã¦â€ºÅ“Ã¦â€”Â¥_Ã©â€¡â€˜Ã¦â€ºÅ“Ã¦â€”Â¥_Ã¥Å“Å¸Ã¦â€ºÅ“Ã¦â€”Â¥'.split('_'),
        weekdaysShort : 'Ã¦â€”Â¥_Ã¦Å“Ë†_Ã§ÂÂ«_Ã¦Â°Â´_Ã¦Å“Â¨_Ã©â€¡â€˜_Ã¥Å“Å¸'.split('_'),
        weekdaysMin : 'Ã¦â€”Â¥_Ã¦Å“Ë†_Ã§ÂÂ«_Ã¦Â°Â´_Ã¦Å“Â¨_Ã©â€¡â€˜_Ã¥Å“Å¸'.split('_'),
        longDateFormat : {
            LT : 'AhÃ¦â„¢â€šmÃ¥Ë†â€ ',
            LTS : 'LTsÃ§Â§â€™',
            L : 'YYYY/MM/DD',
            LL : 'YYYYÃ¥Â¹Â´MÃ¦Å“Ë†DÃ¦â€”Â¥',
            LLL : 'YYYYÃ¥Â¹Â´MÃ¦Å“Ë†DÃ¦â€”Â¥LT',
            LLLL : 'YYYYÃ¥Â¹Â´MÃ¦Å“Ë†DÃ¦â€”Â¥LT dddd'
        },
        meridiemParse: /Ã¥ÂË†Ã¥â€°Â|Ã¥ÂË†Ã¥Â¾Å’/i,
        isPM : function (input) {
            return input === 'Ã¥ÂË†Ã¥Â¾Å’';
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'Ã¥ÂË†Ã¥â€°Â';
            } else {
                return 'Ã¥ÂË†Ã¥Â¾Å’';
            }
        },
        calendar : {
            sameDay : '[Ã¤Â»Å Ã¦â€”Â¥] LT',
            nextDay : '[Ã¦ËœÅ½Ã¦â€”Â¥] LT',
            nextWeek : '[Ã¦ÂÂ¥Ã©â‚¬Â±]dddd LT',
            lastDay : '[Ã¦ËœÂ¨Ã¦â€”Â¥] LT',
            lastWeek : '[Ã¥â€°ÂÃ©â‚¬Â±]dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%sÃ¥Â¾Å’',
            past : '%sÃ¥â€°Â',
            s : 'Ã¦â€¢Â°Ã§Â§â€™',
            m : '1Ã¥Ë†â€ ',
            mm : '%dÃ¥Ë†â€ ',
            h : '1Ã¦â„¢â€šÃ©â€“â€œ',
            hh : '%dÃ¦â„¢â€šÃ©â€“â€œ',
            d : '1Ã¦â€”Â¥',
            dd : '%dÃ¦â€”Â¥',
            M : '1Ã£Æ’Â¶Ã¦Å“Ë†',
            MM : '%dÃ£Æ’Â¶Ã¦Å“Ë†',
            y : '1Ã¥Â¹Â´',
            yy : '%dÃ¥Â¹Â´'
        }
    });
}));
// moment.js locale configuration
// locale : Georgian (ka)
// author : Irakli Janiashvili : https://github.com/irakli-janiashvili

(function (factory) {
    factory(moment);
}(function (moment) {
    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'Ã¡Æ’ËœÃ¡Æ’ÂÃ¡Æ’Å“Ã¡Æ’â€¢Ã¡Æ’ÂÃ¡Æ’ Ã¡Æ’Ëœ_Ã¡Æ’â€”Ã¡Æ’â€Ã¡Æ’â€˜Ã¡Æ’â€Ã¡Æ’ Ã¡Æ’â€¢Ã¡Æ’ÂÃ¡Æ’Å¡Ã¡Æ’Ëœ_Ã¡Æ’â€ºÃ¡Æ’ÂÃ¡Æ’ Ã¡Æ’Â¢Ã¡Æ’Ëœ_Ã¡Æ’ÂÃ¡Æ’Å¾Ã¡Æ’ Ã¡Æ’ËœÃ¡Æ’Å¡Ã¡Æ’Ëœ_Ã¡Æ’â€ºÃ¡Æ’ÂÃ¡Æ’ËœÃ¡Æ’Â¡Ã¡Æ’Ëœ_Ã¡Æ’ËœÃ¡Æ’â€¢Ã¡Æ’Å“Ã¡Æ’ËœÃ¡Æ’Â¡Ã¡Æ’Ëœ_Ã¡Æ’ËœÃ¡Æ’â€¢Ã¡Æ’Å¡Ã¡Æ’ËœÃ¡Æ’Â¡Ã¡Æ’Ëœ_Ã¡Æ’ÂÃ¡Æ’â€™Ã¡Æ’â€¢Ã¡Æ’ËœÃ¡Æ’Â¡Ã¡Æ’Â¢Ã¡Æ’Â_Ã¡Æ’Â¡Ã¡Æ’â€Ã¡Æ’Â¥Ã¡Æ’Â¢Ã¡Æ’â€Ã¡Æ’â€ºÃ¡Æ’â€˜Ã¡Æ’â€Ã¡Æ’ Ã¡Æ’Ëœ_Ã¡Æ’ÂÃ¡Æ’Â¥Ã¡Æ’Â¢Ã¡Æ’ÂÃ¡Æ’â€ºÃ¡Æ’â€˜Ã¡Æ’â€Ã¡Æ’ Ã¡Æ’Ëœ_Ã¡Æ’Å“Ã¡Æ’ÂÃ¡Æ’â€Ã¡Æ’â€ºÃ¡Æ’â€˜Ã¡Æ’â€Ã¡Æ’ Ã¡Æ’Ëœ_Ã¡Æ’â€œÃ¡Æ’â€Ã¡Æ’â„¢Ã¡Æ’â€Ã¡Æ’â€ºÃ¡Æ’â€˜Ã¡Æ’â€Ã¡Æ’ Ã¡Æ’Ëœ'.split('_'),
            'accusative': 'Ã¡Æ’ËœÃ¡Æ’ÂÃ¡Æ’Å“Ã¡Æ’â€¢Ã¡Æ’ÂÃ¡Æ’ Ã¡Æ’Â¡_Ã¡Æ’â€”Ã¡Æ’â€Ã¡Æ’â€˜Ã¡Æ’â€Ã¡Æ’ Ã¡Æ’â€¢Ã¡Æ’ÂÃ¡Æ’Å¡Ã¡Æ’Â¡_Ã¡Æ’â€ºÃ¡Æ’ÂÃ¡Æ’ Ã¡Æ’Â¢Ã¡Æ’Â¡_Ã¡Æ’ÂÃ¡Æ’Å¾Ã¡Æ’ Ã¡Æ’ËœÃ¡Æ’Å¡Ã¡Æ’ËœÃ¡Æ’Â¡_Ã¡Æ’â€ºÃ¡Æ’ÂÃ¡Æ’ËœÃ¡Æ’Â¡Ã¡Æ’Â¡_Ã¡Æ’ËœÃ¡Æ’â€¢Ã¡Æ’Å“Ã¡Æ’ËœÃ¡Æ’Â¡Ã¡Æ’Â¡_Ã¡Æ’ËœÃ¡Æ’â€¢Ã¡Æ’Å¡Ã¡Æ’ËœÃ¡Æ’Â¡Ã¡Æ’Â¡_Ã¡Æ’ÂÃ¡Æ’â€™Ã¡Æ’â€¢Ã¡Æ’ËœÃ¡Æ’Â¡Ã¡Æ’Â¢Ã¡Æ’Â¡_Ã¡Æ’Â¡Ã¡Æ’â€Ã¡Æ’Â¥Ã¡Æ’Â¢Ã¡Æ’â€Ã¡Æ’â€ºÃ¡Æ’â€˜Ã¡Æ’â€Ã¡Æ’ Ã¡Æ’Â¡_Ã¡Æ’ÂÃ¡Æ’Â¥Ã¡Æ’Â¢Ã¡Æ’ÂÃ¡Æ’â€ºÃ¡Æ’â€˜Ã¡Æ’â€Ã¡Æ’ Ã¡Æ’Â¡_Ã¡Æ’Å“Ã¡Æ’ÂÃ¡Æ’â€Ã¡Æ’â€ºÃ¡Æ’â€˜Ã¡Æ’â€Ã¡Æ’ Ã¡Æ’Â¡_Ã¡Æ’â€œÃ¡Æ’â€Ã¡Æ’â„¢Ã¡Æ’â€Ã¡Æ’â€ºÃ¡Æ’â€˜Ã¡Æ’â€Ã¡Æ’ Ã¡Æ’Â¡'.split('_')
        },

        nounCase = (/D[oD] *MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'Ã¡Æ’â„¢Ã¡Æ’â€¢Ã¡Æ’ËœÃ¡Æ’ Ã¡Æ’Â_Ã¡Æ’ÂÃ¡Æ’ Ã¡Æ’Â¨Ã¡Æ’ÂÃ¡Æ’â€˜Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Ëœ_Ã¡Æ’Â¡Ã¡Æ’ÂÃ¡Æ’â€ºÃ¡Æ’Â¨Ã¡Æ’ÂÃ¡Æ’â€˜Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Ëœ_Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Â®Ã¡Æ’Â¨Ã¡Æ’ÂÃ¡Æ’â€˜Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Ëœ_Ã¡Æ’Â®Ã¡Æ’Â£Ã¡Æ’â€”Ã¡Æ’Â¨Ã¡Æ’ÂÃ¡Æ’â€˜Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Ëœ_Ã¡Æ’Å¾Ã¡Æ’ÂÃ¡Æ’ Ã¡Æ’ÂÃ¡Æ’Â¡Ã¡Æ’â„¢Ã¡Æ’â€Ã¡Æ’â€¢Ã¡Æ’Ëœ_Ã¡Æ’Â¨Ã¡Æ’ÂÃ¡Æ’â€˜Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Ëœ'.split('_'),
            'accusative': 'Ã¡Æ’â„¢Ã¡Æ’â€¢Ã¡Æ’ËœÃ¡Æ’ Ã¡Æ’ÂÃ¡Æ’Â¡_Ã¡Æ’ÂÃ¡Æ’ Ã¡Æ’Â¨Ã¡Æ’ÂÃ¡Æ’â€˜Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Â¡_Ã¡Æ’Â¡Ã¡Æ’ÂÃ¡Æ’â€ºÃ¡Æ’Â¨Ã¡Æ’ÂÃ¡Æ’â€˜Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Â¡_Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Â®Ã¡Æ’Â¨Ã¡Æ’ÂÃ¡Æ’â€˜Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Â¡_Ã¡Æ’Â®Ã¡Æ’Â£Ã¡Æ’â€”Ã¡Æ’Â¨Ã¡Æ’ÂÃ¡Æ’â€˜Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Â¡_Ã¡Æ’Å¾Ã¡Æ’ÂÃ¡Æ’ Ã¡Æ’ÂÃ¡Æ’Â¡Ã¡Æ’â„¢Ã¡Æ’â€Ã¡Æ’â€¢Ã¡Æ’Â¡_Ã¡Æ’Â¨Ã¡Æ’ÂÃ¡Æ’â€˜Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Â¡'.split('_')
        },

        nounCase = (/(Ã¡Æ’Â¬Ã¡Æ’ËœÃ¡Æ’Å“Ã¡Æ’Â|Ã¡Æ’Â¨Ã¡Æ’â€Ã¡Æ’â€ºÃ¡Æ’â€œÃ¡Æ’â€Ã¡Æ’â€™)/).test(format) ?
            'accusative' :
            'nominative';

        return weekdays[nounCase][m.day()];
    }

    return moment.defineLocale('ka', {
        months : monthsCaseReplace,
        monthsShort : 'Ã¡Æ’ËœÃ¡Æ’ÂÃ¡Æ’Å“_Ã¡Æ’â€”Ã¡Æ’â€Ã¡Æ’â€˜_Ã¡Æ’â€ºÃ¡Æ’ÂÃ¡Æ’ _Ã¡Æ’ÂÃ¡Æ’Å¾Ã¡Æ’ _Ã¡Æ’â€ºÃ¡Æ’ÂÃ¡Æ’Ëœ_Ã¡Æ’ËœÃ¡Æ’â€¢Ã¡Æ’Å“_Ã¡Æ’ËœÃ¡Æ’â€¢Ã¡Æ’Å¡_Ã¡Æ’ÂÃ¡Æ’â€™Ã¡Æ’â€¢_Ã¡Æ’Â¡Ã¡Æ’â€Ã¡Æ’Â¥_Ã¡Æ’ÂÃ¡Æ’Â¥Ã¡Æ’Â¢_Ã¡Æ’Å“Ã¡Æ’ÂÃ¡Æ’â€_Ã¡Æ’â€œÃ¡Æ’â€Ã¡Æ’â„¢'.split('_'),
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'Ã¡Æ’â„¢Ã¡Æ’â€¢Ã¡Æ’Ëœ_Ã¡Æ’ÂÃ¡Æ’ Ã¡Æ’Â¨_Ã¡Æ’Â¡Ã¡Æ’ÂÃ¡Æ’â€º_Ã¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Â®_Ã¡Æ’Â®Ã¡Æ’Â£Ã¡Æ’â€”_Ã¡Æ’Å¾Ã¡Æ’ÂÃ¡Æ’ _Ã¡Æ’Â¨Ã¡Æ’ÂÃ¡Æ’â€˜'.split('_'),
        weekdaysMin : 'Ã¡Æ’â„¢Ã¡Æ’â€¢_Ã¡Æ’ÂÃ¡Æ’ _Ã¡Æ’Â¡Ã¡Æ’Â_Ã¡Æ’ÂÃ¡Æ’â€”_Ã¡Æ’Â®Ã¡Æ’Â£_Ã¡Æ’Å¾Ã¡Æ’Â_Ã¡Æ’Â¨Ã¡Æ’Â'.split('_'),
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Ã¡Æ’â€œÃ¡Æ’Â¦Ã¡Æ’â€Ã¡Æ’Â¡] LT[-Ã¡Æ’â€“Ã¡Æ’â€]',
            nextDay : '[Ã¡Æ’Â®Ã¡Æ’â€¢Ã¡Æ’ÂÃ¡Æ’Å¡] LT[-Ã¡Æ’â€“Ã¡Æ’â€]',
            lastDay : '[Ã¡Æ’â€™Ã¡Æ’Â£Ã¡Æ’Â¨Ã¡Æ’ËœÃ¡Æ’Å“] LT[-Ã¡Æ’â€“Ã¡Æ’â€]',
            nextWeek : '[Ã¡Æ’Â¨Ã¡Æ’â€Ã¡Æ’â€ºÃ¡Æ’â€œÃ¡Æ’â€Ã¡Æ’â€™] dddd LT[-Ã¡Æ’â€“Ã¡Æ’â€]',
            lastWeek : '[Ã¡Æ’Â¬Ã¡Æ’ËœÃ¡Æ’Å“Ã¡Æ’Â] dddd LT-Ã¡Æ’â€“Ã¡Æ’â€',
            sameElse : 'L'
        },
        relativeTime : {
            future : function (s) {
                return (/(Ã¡Æ’Â¬Ã¡Æ’ÂÃ¡Æ’â€ºÃ¡Æ’Ëœ|Ã¡Æ’Â¬Ã¡Æ’Â£Ã¡Æ’â€”Ã¡Æ’Ëœ|Ã¡Æ’Â¡Ã¡Æ’ÂÃ¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Ëœ|Ã¡Æ’Â¬Ã¡Æ’â€Ã¡Æ’Å¡Ã¡Æ’Ëœ)/).test(s) ?
                    s.replace(/Ã¡Æ’Ëœ$/, 'Ã¡Æ’Â¨Ã¡Æ’Ëœ') :
                    s + 'Ã¡Æ’Â¨Ã¡Æ’Ëœ';
            },
            past : function (s) {
                if ((/(Ã¡Æ’Â¬Ã¡Æ’ÂÃ¡Æ’â€ºÃ¡Æ’Ëœ|Ã¡Æ’Â¬Ã¡Æ’Â£Ã¡Æ’â€”Ã¡Æ’Ëœ|Ã¡Æ’Â¡Ã¡Æ’ÂÃ¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Ëœ|Ã¡Æ’â€œÃ¡Æ’Â¦Ã¡Æ’â€|Ã¡Æ’â€”Ã¡Æ’â€¢Ã¡Æ’â€)/).test(s)) {
                    return s.replace(/(Ã¡Æ’Ëœ|Ã¡Æ’â€)$/, 'Ã¡Æ’ËœÃ¡Æ’Â¡ Ã¡Æ’Â¬Ã¡Æ’ËœÃ¡Æ’Å“');
                }
                if ((/Ã¡Æ’Â¬Ã¡Æ’â€Ã¡Æ’Å¡Ã¡Æ’Ëœ/).test(s)) {
                    return s.replace(/Ã¡Æ’Â¬Ã¡Æ’â€Ã¡Æ’Å¡Ã¡Æ’Ëœ$/, 'Ã¡Æ’Â¬Ã¡Æ’Å¡Ã¡Æ’ËœÃ¡Æ’Â¡ Ã¡Æ’Â¬Ã¡Æ’ËœÃ¡Æ’Å“');
                }
            },
            s : 'Ã¡Æ’ Ã¡Æ’ÂÃ¡Æ’â€ºÃ¡Æ’â€œÃ¡Æ’â€Ã¡Æ’Å“Ã¡Æ’ËœÃ¡Æ’â€ºÃ¡Æ’â€ Ã¡Æ’Â¬Ã¡Æ’ÂÃ¡Æ’â€ºÃ¡Æ’Ëœ',
            m : 'Ã¡Æ’Â¬Ã¡Æ’Â£Ã¡Æ’â€”Ã¡Æ’Ëœ',
            mm : '%d Ã¡Æ’Â¬Ã¡Æ’Â£Ã¡Æ’â€”Ã¡Æ’Ëœ',
            h : 'Ã¡Æ’Â¡Ã¡Æ’ÂÃ¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Ëœ',
            hh : '%d Ã¡Æ’Â¡Ã¡Æ’ÂÃ¡Æ’ÂÃ¡Æ’â€”Ã¡Æ’Ëœ',
            d : 'Ã¡Æ’â€œÃ¡Æ’Â¦Ã¡Æ’â€',
            dd : '%d Ã¡Æ’â€œÃ¡Æ’Â¦Ã¡Æ’â€',
            M : 'Ã¡Æ’â€”Ã¡Æ’â€¢Ã¡Æ’â€',
            MM : '%d Ã¡Æ’â€”Ã¡Æ’â€¢Ã¡Æ’â€',
            y : 'Ã¡Æ’Â¬Ã¡Æ’â€Ã¡Æ’Å¡Ã¡Æ’Ëœ',
            yy : '%d Ã¡Æ’Â¬Ã¡Æ’â€Ã¡Æ’Å¡Ã¡Æ’Ëœ'
        },
        ordinalParse: /0|1-Ã¡Æ’Å¡Ã¡Æ’Ëœ|Ã¡Æ’â€ºÃ¡Æ’â€-\d{1,2}|\d{1,2}-Ã¡Æ’â€/,
        ordinal : function (number) {
            if (number === 0) {
                return number;
            }

            if (number === 1) {
                return number + '-Ã¡Æ’Å¡Ã¡Æ’Ëœ';
            }

            if ((number < 20) || (number <= 100 && (number % 20 === 0)) || (number % 100 === 0)) {
                return 'Ã¡Æ’â€ºÃ¡Æ’â€-' + number;
            }

            return number + '-Ã¡Æ’â€';
        },
        week : {
            dow : 1,
            doy : 7
        }
    });
}));
// moment.js locale configuration
// locale : khmer (km)
// author : Kruy Vanna : https://github.com/kruyvanna

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('km', {
        months: 'Ã¡Å¾ËœÃ¡Å¾â‚¬Ã¡Å¾Å¡Ã¡Å¾Â¶_Ã¡Å¾â‚¬Ã¡Å¾Â»Ã¡Å¾ËœÃ¡Å¸â€™Ã¡Å¾â€”Ã¡Å¸Ë†_Ã¡Å¾ËœÃ¡Å¾Â·Ã¡Å¾â€œÃ¡Å¾Â¶_Ã¡Å¾ËœÃ¡Å¸ÂÃ¡Å¾Å¸Ã¡Å¾Â¶_Ã¡Å¾Â§Ã¡Å¾Å¸Ã¡Å¾â€”Ã¡Å¾Â¶_Ã¡Å¾ËœÃ¡Å¾Â·Ã¡Å¾ÂÃ¡Å¾Â»Ã¡Å¾â€œÃ¡Å¾Â¶_Ã¡Å¾â‚¬Ã¡Å¾â‚¬Ã¡Å¸â€™Ã¡Å¾â‚¬Ã¡Å¾Å Ã¡Å¾Â¶_Ã¡Å¾Å¸Ã¡Å¾Â¸Ã¡Å¾ Ã¡Å¾Â¶_Ã¡Å¾â‚¬Ã¡Å¾â€°Ã¡Å¸â€™Ã¡Å¾â€°Ã¡Å¾Â¶_Ã¡Å¾ÂÃ¡Å¾Â»Ã¡Å¾â€ºÃ¡Å¾Â¶_Ã¡Å¾Å“Ã¡Å¾Â·Ã¡Å¾â€¦Ã¡Å¸â€™Ã¡Å¾â€ Ã¡Å¾Â·Ã¡Å¾â‚¬Ã¡Å¾Â¶_Ã¡Å¾â€™Ã¡Å¸â€™Ã¡Å¾â€œÃ¡Å¾Â¼'.split('_'),
        monthsShort: 'Ã¡Å¾ËœÃ¡Å¾â‚¬Ã¡Å¾Å¡Ã¡Å¾Â¶_Ã¡Å¾â‚¬Ã¡Å¾Â»Ã¡Å¾ËœÃ¡Å¸â€™Ã¡Å¾â€”Ã¡Å¸Ë†_Ã¡Å¾ËœÃ¡Å¾Â·Ã¡Å¾â€œÃ¡Å¾Â¶_Ã¡Å¾ËœÃ¡Å¸ÂÃ¡Å¾Å¸Ã¡Å¾Â¶_Ã¡Å¾Â§Ã¡Å¾Å¸Ã¡Å¾â€”Ã¡Å¾Â¶_Ã¡Å¾ËœÃ¡Å¾Â·Ã¡Å¾ÂÃ¡Å¾Â»Ã¡Å¾â€œÃ¡Å¾Â¶_Ã¡Å¾â‚¬Ã¡Å¾â‚¬Ã¡Å¸â€™Ã¡Å¾â‚¬Ã¡Å¾Å Ã¡Å¾Â¶_Ã¡Å¾Å¸Ã¡Å¾Â¸Ã¡Å¾ Ã¡Å¾Â¶_Ã¡Å¾â‚¬Ã¡Å¾â€°Ã¡Å¸â€™Ã¡Å¾â€°Ã¡Å¾Â¶_Ã¡Å¾ÂÃ¡Å¾Â»Ã¡Å¾â€ºÃ¡Å¾Â¶_Ã¡Å¾Å“Ã¡Å¾Â·Ã¡Å¾â€¦Ã¡Å¸â€™Ã¡Å¾â€ Ã¡Å¾Â·Ã¡Å¾â‚¬Ã¡Å¾Â¶_Ã¡Å¾â€™Ã¡Å¸â€™Ã¡Å¾â€œÃ¡Å¾Â¼'.split('_'),
        weekdays: 'Ã¡Å¾Â¢Ã¡Å¾Â¶Ã¡Å¾â€˜Ã¡Å¾Â·Ã¡Å¾ÂÃ¡Å¸â€™Ã¡Å¾â„¢_Ã¡Å¾â€¦Ã¡Å¸ÂÃ¡Å¾â€œÃ¡Å¸â€™Ã¡Å¾â€˜_Ã¡Å¾Â¢Ã¡Å¾â€žÃ¡Å¸â€™Ã¡Å¾â€šÃ¡Å¾Â¶Ã¡Å¾Å¡_Ã¡Å¾â€“Ã¡Å¾Â»Ã¡Å¾â€™_Ã¡Å¾â€“Ã¡Å¸â€™Ã¡Å¾Å¡Ã¡Å¾ Ã¡Å¾Å¸Ã¡Å¸â€™Ã¡Å¾â€Ã¡Å¾ÂÃ¡Å¾Â·Ã¡Å¸Â_Ã¡Å¾Å¸Ã¡Å¾Â»Ã¡Å¾â‚¬Ã¡Å¸â€™Ã¡Å¾Å¡_Ã¡Å¾Å¸Ã¡Å¸â€¦Ã¡Å¾Å¡Ã¡Å¸Â'.split('_'),
        weekdaysShort: 'Ã¡Å¾Â¢Ã¡Å¾Â¶Ã¡Å¾â€˜Ã¡Å¾Â·Ã¡Å¾ÂÃ¡Å¸â€™Ã¡Å¾â„¢_Ã¡Å¾â€¦Ã¡Å¸ÂÃ¡Å¾â€œÃ¡Å¸â€™Ã¡Å¾â€˜_Ã¡Å¾Â¢Ã¡Å¾â€žÃ¡Å¸â€™Ã¡Å¾â€šÃ¡Å¾Â¶Ã¡Å¾Å¡_Ã¡Å¾â€“Ã¡Å¾Â»Ã¡Å¾â€™_Ã¡Å¾â€“Ã¡Å¸â€™Ã¡Å¾Å¡Ã¡Å¾ Ã¡Å¾Å¸Ã¡Å¸â€™Ã¡Å¾â€Ã¡Å¾ÂÃ¡Å¾Â·Ã¡Å¸Â_Ã¡Å¾Å¸Ã¡Å¾Â»Ã¡Å¾â‚¬Ã¡Å¸â€™Ã¡Å¾Å¡_Ã¡Å¾Å¸Ã¡Å¸â€¦Ã¡Å¾Å¡Ã¡Å¸Â'.split('_'),
        weekdaysMin: 'Ã¡Å¾Â¢Ã¡Å¾Â¶Ã¡Å¾â€˜Ã¡Å¾Â·Ã¡Å¾ÂÃ¡Å¸â€™Ã¡Å¾â„¢_Ã¡Å¾â€¦Ã¡Å¸ÂÃ¡Å¾â€œÃ¡Å¸â€™Ã¡Å¾â€˜_Ã¡Å¾Â¢Ã¡Å¾â€žÃ¡Å¸â€™Ã¡Å¾â€šÃ¡Å¾Â¶Ã¡Å¾Å¡_Ã¡Å¾â€“Ã¡Å¾Â»Ã¡Å¾â€™_Ã¡Å¾â€“Ã¡Å¸â€™Ã¡Å¾Å¡Ã¡Å¾ Ã¡Å¾Å¸Ã¡Å¸â€™Ã¡Å¾â€Ã¡Å¾ÂÃ¡Å¾Â·Ã¡Å¸Â_Ã¡Å¾Å¸Ã¡Å¾Â»Ã¡Å¾â‚¬Ã¡Å¸â€™Ã¡Å¾Å¡_Ã¡Å¾Å¸Ã¡Å¸â€¦Ã¡Å¾Å¡Ã¡Å¸Â'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS : 'LT:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd, D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[Ã¡Å¾ÂÃ¡Å¸â€™Ã¡Å¾â€žÃ¡Å¸Æ’Ã¡Å¾â€œÃ¡Å¸Ë† Ã¡Å¾ËœÃ¡Å¸â€°Ã¡Å¸â€žÃ¡Å¾â€ž] LT',
            nextDay: '[Ã¡Å¾Å¸Ã¡Å¸â€™Ã¡Å¾Â¢Ã¡Å¸â€šÃ¡Å¾â‚¬ Ã¡Å¾ËœÃ¡Å¸â€°Ã¡Å¸â€žÃ¡Å¾â€ž] LT',
            nextWeek: 'dddd [Ã¡Å¾ËœÃ¡Å¸â€°Ã¡Å¸â€žÃ¡Å¾â€ž] LT',
            lastDay: '[Ã¡Å¾ËœÃ¡Å¸â€™Ã¡Å¾Å¸Ã¡Å¾Â·Ã¡Å¾â€ºÃ¡Å¾ËœÃ¡Å¾Â·Ã¡Å¾â€° Ã¡Å¾ËœÃ¡Å¸â€°Ã¡Å¸â€žÃ¡Å¾â€ž] LT',
            lastWeek: 'dddd [Ã¡Å¾Å¸Ã¡Å¾â€Ã¡Å¸â€™Ã¡Å¾ÂÃ¡Å¾Â¶Ã¡Å¾ Ã¡Å¸ÂÃ¡Å¾ËœÃ¡Å¾Â»Ã¡Å¾â€œ] [Ã¡Å¾ËœÃ¡Å¸â€°Ã¡Å¸â€žÃ¡Å¾â€ž] LT',
            sameElse: 'L'
        },
        relativeTime: {
            future: '%sÃ¡Å¾â€˜Ã¡Å¸â‚¬Ã¡Å¾Â',
            past: '%sÃ¡Å¾ËœÃ¡Å¾Â»Ã¡Å¾â€œ',
            s: 'Ã¡Å¾â€Ã¡Å¸â€°Ã¡Å¾Â»Ã¡Å¾â€œÃ¡Å¸â€™Ã¡Å¾ËœÃ¡Å¾Â¶Ã¡Å¾â€œÃ¡Å¾Å“Ã¡Å¾Â·Ã¡Å¾â€œÃ¡Å¾Â¶Ã¡Å¾â€˜Ã¡Å¾Â¸',
            m: 'Ã¡Å¾ËœÃ¡Å¾Â½Ã¡Å¾â„¢Ã¡Å¾â€œÃ¡Å¾Â¶Ã¡Å¾â€˜Ã¡Å¾Â¸',
            mm: '%d Ã¡Å¾â€œÃ¡Å¾Â¶Ã¡Å¾â€˜Ã¡Å¾Â¸',
            h: 'Ã¡Å¾ËœÃ¡Å¾Â½Ã¡Å¾â„¢Ã¡Å¾ËœÃ¡Å¸â€°Ã¡Å¸â€žÃ¡Å¾â€ž',
            hh: '%d Ã¡Å¾ËœÃ¡Å¸â€°Ã¡Å¸â€žÃ¡Å¾â€ž',
            d: 'Ã¡Å¾ËœÃ¡Å¾Â½Ã¡Å¾â„¢Ã¡Å¾ÂÃ¡Å¸â€™Ã¡Å¾â€žÃ¡Å¸Æ’',
            dd: '%d Ã¡Å¾ÂÃ¡Å¸â€™Ã¡Å¾â€žÃ¡Å¸Æ’',
            M: 'Ã¡Å¾ËœÃ¡Å¾Â½Ã¡Å¾â„¢Ã¡Å¾ÂÃ¡Å¸â€š',
            MM: '%d Ã¡Å¾ÂÃ¡Å¸â€š',
            y: 'Ã¡Å¾ËœÃ¡Å¾Â½Ã¡Å¾â„¢Ã¡Å¾â€ Ã¡Å¸â€™Ã¡Å¾â€œÃ¡Å¾Â¶Ã¡Å¸â€ ',
            yy: '%d Ã¡Å¾â€ Ã¡Å¸â€™Ã¡Å¾â€œÃ¡Å¾Â¶Ã¡Å¸â€ '
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4 // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : korean (ko)
//
// authors
//
// - Kyungwook, Park : https://github.com/kyungw00k
// - Jeeeyul Lee <jeeeyul@gmail.com>
(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ko', {
        months : '1Ã¬â€ºâ€_2Ã¬â€ºâ€_3Ã¬â€ºâ€_4Ã¬â€ºâ€_5Ã¬â€ºâ€_6Ã¬â€ºâ€_7Ã¬â€ºâ€_8Ã¬â€ºâ€_9Ã¬â€ºâ€_10Ã¬â€ºâ€_11Ã¬â€ºâ€_12Ã¬â€ºâ€'.split('_'),
        monthsShort : '1Ã¬â€ºâ€_2Ã¬â€ºâ€_3Ã¬â€ºâ€_4Ã¬â€ºâ€_5Ã¬â€ºâ€_6Ã¬â€ºâ€_7Ã¬â€ºâ€_8Ã¬â€ºâ€_9Ã¬â€ºâ€_10Ã¬â€ºâ€_11Ã¬â€ºâ€_12Ã¬â€ºâ€'.split('_'),
        weekdays : 'Ã¬ÂÂ¼Ã¬Å¡â€Ã¬ÂÂ¼_Ã¬â€ºâ€Ã¬Å¡â€Ã¬ÂÂ¼_Ã­â„¢â€Ã¬Å¡â€Ã¬ÂÂ¼_Ã¬Ë†ËœÃ¬Å¡â€Ã¬ÂÂ¼_Ã«ÂªÂ©Ã¬Å¡â€Ã¬ÂÂ¼_ÃªÂ¸Ë†Ã¬Å¡â€Ã¬ÂÂ¼_Ã­â€  Ã¬Å¡â€Ã¬ÂÂ¼'.split('_'),
        weekdaysShort : 'Ã¬ÂÂ¼_Ã¬â€ºâ€_Ã­â„¢â€_Ã¬Ë†Ëœ_Ã«ÂªÂ©_ÃªÂ¸Ë†_Ã­â€  '.split('_'),
        weekdaysMin : 'Ã¬ÂÂ¼_Ã¬â€ºâ€_Ã­â„¢â€_Ã¬Ë†Ëœ_Ã«ÂªÂ©_ÃªÂ¸Ë†_Ã­â€  '.split('_'),
        longDateFormat : {
            LT : 'A hÃ¬â€¹Å“ mÃ«Â¶â€ž',
            LTS : 'A hÃ¬â€¹Å“ mÃ«Â¶â€ž sÃ¬Â´Ë†',
            L : 'YYYY.MM.DD',
            LL : 'YYYYÃ«â€¦â€ž MMMM DÃ¬ÂÂ¼',
            LLL : 'YYYYÃ«â€¦â€ž MMMM DÃ¬ÂÂ¼ LT',
            LLLL : 'YYYYÃ«â€¦â€ž MMMM DÃ¬ÂÂ¼ dddd LT'
        },
        calendar : {
            sameDay : 'Ã¬ËœÂ¤Ã«Å Ëœ LT',
            nextDay : 'Ã«â€šÂ´Ã¬ÂÂ¼ LT',
            nextWeek : 'dddd LT',
            lastDay : 'Ã¬â€“Â´Ã¬ Å“ LT',
            lastWeek : 'Ã¬Â§â‚¬Ã«â€šÅ“Ã¬Â£Â¼ dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s Ã­â€ºâ€ž',
            past : '%s Ã¬ â€ž',
            s : 'Ã«Âªâ€¡Ã¬Â´Ë†',
            ss : '%dÃ¬Â´Ë†',
            m : 'Ã¬ÂÂ¼Ã«Â¶â€ž',
            mm : '%dÃ«Â¶â€ž',
            h : 'Ã­â€¢Å“Ã¬â€¹Å“ÃªÂ°â€ž',
            hh : '%dÃ¬â€¹Å“ÃªÂ°â€ž',
            d : 'Ã­â€¢ËœÃ«Â£Â¨',
            dd : '%dÃ¬ÂÂ¼',
            M : 'Ã­â€¢Å“Ã«â€¹Â¬',
            MM : '%dÃ«â€¹Â¬',
            y : 'Ã¬ÂÂ¼Ã«â€¦â€ž',
            yy : '%dÃ«â€¦â€ž'
        },
        ordinalParse : /\d{1,2}Ã¬ÂÂ¼/,
        ordinal : '%dÃ¬ÂÂ¼',
        meridiemParse : /Ã¬ËœÂ¤Ã¬ â€ž|Ã¬ËœÂ¤Ã­â€ºâ€ž/,
        isPM : function (token) {
            return token === 'Ã¬ËœÂ¤Ã­â€ºâ€ž';
        },
        meridiem : function (hour, minute, isUpper) {
            return hour < 12 ? 'Ã¬ËœÂ¤Ã¬ â€ž' : 'Ã¬ËœÂ¤Ã­â€ºâ€ž';
        }
    });
}));
// moment.js locale configuration
// locale : Luxembourgish (lb)
// author : mweimerskirch : https://github.com/mweimerskirch, David Raison : https://github.com/kwisatz

// Note: Luxembourgish has a very particular phonological rule ('Eifeler Regel') that causes the
// deletion of the final 'n' in certain contexts. That's what the 'eifelerRegelAppliesToWeekday'
// and 'eifelerRegelAppliesToNumber' methods are meant for

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            'm': ['eng Minutt', 'enger Minutt'],
            'h': ['eng Stonn', 'enger Stonn'],
            'd': ['een Dag', 'engem Dag'],
            'M': ['ee Mount', 'engem Mount'],
            'y': ['ee Joer', 'engem Joer']
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    function processFutureTime(string) {
        var number = string.substr(0, string.indexOf(' '));
        if (eifelerRegelAppliesToNumber(number)) {
            return 'a ' + string;
        }
        return 'an ' + string;
    }

    function processPastTime(string) {
        var number = string.substr(0, string.indexOf(' '));
        if (eifelerRegelAppliesToNumber(number)) {
            return 'viru ' + string;
        }
        return 'virun ' + string;
    }

    /**
     * Returns true if the word before the given number loses the '-n' ending.
     * e.g. 'an 10 Deeg' but 'a 5 Deeg'
     *
     * @param number {integer}
     * @returns {boolean}
     */
    function eifelerRegelAppliesToNumber(number) {
        number = parseInt(number, 10);
        if (isNaN(number)) {
            return false;
        }
        if (number < 0) {
            // Negative Number --> always true
            return true;
        } else if (number < 10) {
            // Only 1 digit
            if (4 <= number && number <= 7) {
                return true;
            }
            return false;
        } else if (number < 100) {
            // 2 digits
            var lastDigit = number % 10, firstDigit = number / 10;
            if (lastDigit === 0) {
                return eifelerRegelAppliesToNumber(firstDigit);
            }
            return eifelerRegelAppliesToNumber(lastDigit);
        } else if (number < 10000) {
            // 3 or 4 digits --> recursively check first digit
            while (number >= 10) {
                number = number / 10;
            }
            return eifelerRegelAppliesToNumber(number);
        } else {
            // Anything larger than 4 digits: recursively check first n-3 digits
            number = number / 1000;
            return eifelerRegelAppliesToNumber(number);
        }
    }

    return moment.defineLocale('lb', {
        months: 'Januar_Februar_MÃƒÂ¤erz_AbrÃƒÂ«ll_Mee_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
        monthsShort: 'Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
        weekdays: 'Sonndeg_MÃƒÂ©indeg_DÃƒÂ«nschdeg_MÃƒÂ«ttwoch_Donneschdeg_Freideg_Samschdeg'.split('_'),
        weekdaysShort: 'So._MÃƒÂ©._DÃƒÂ«._MÃƒÂ«._Do._Fr._Sa.'.split('_'),
        weekdaysMin: 'So_MÃƒÂ©_DÃƒÂ«_MÃƒÂ«_Do_Fr_Sa'.split('_'),
        longDateFormat: {
            LT: 'H:mm [Auer]',
            LTS: 'H:mm:ss [Auer]',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY LT',
            LLLL: 'dddd, D. MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[Haut um] LT',
            sameElse: 'L',
            nextDay: '[Muer um] LT',
            nextWeek: 'dddd [um] LT',
            lastDay: '[GÃƒÂ«schter um] LT',
            lastWeek: function () {
                // Different date string for 'DÃƒÂ«nschdeg' (Tuesday) and 'Donneschdeg' (Thursday) due to phonological rule
                switch (this.day()) {
                    case 2:
                    case 4:
                        return '[Leschten] dddd [um] LT';
                    default:
                        return '[Leschte] dddd [um] LT';
                }
            }
        },
        relativeTime : {
            future : processFutureTime,
            past : processPastTime,
            s : 'e puer Sekonnen',
            m : processRelativeTime,
            mm : '%d Minutten',
            h : processRelativeTime,
            hh : '%d Stonnen',
            d : processRelativeTime,
            dd : '%d Deeg',
            M : processRelativeTime,
            MM : '%d MÃƒÂ©int',
            y : processRelativeTime,
            yy : '%d Joer'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Lithuanian (lt)
// author : Mindaugas MozÃ…Â«ras : https://github.com/mmozuras

(function (factory) {
    factory(moment);
}(function (moment) {
    var units = {
        'm' : 'minutÃ„â€”_minutÃ„â€”s_minutÃ„â„¢',
        'mm': 'minutÃ„â€”s_minuÃ„ÂiÃ…Â³_minutes',
        'h' : 'valanda_valandos_valandÃ„â€¦',
        'hh': 'valandos_valandÃ…Â³_valandas',
        'd' : 'diena_dienos_dienÃ„â€¦',
        'dd': 'dienos_dienÃ…Â³_dienas',
        'M' : 'mÃ„â€”nuo_mÃ„â€”nesio_mÃ„â€”nesÃ„Â¯',
        'MM': 'mÃ„â€”nesiai_mÃ„â€”nesiÃ…Â³_mÃ„â€”nesius',
        'y' : 'metai_metÃ…Â³_metus',
        'yy': 'metai_metÃ…Â³_metus'
    },
    weekDays = 'sekmadienis_pirmadienis_antradienis_treÃ„Âiadienis_ketvirtadienis_penktadienis_Ã…Â¡eÃ…Â¡tadienis'.split('_');

    function translateSeconds(number, withoutSuffix, key, isFuture) {
        if (withoutSuffix) {
            return 'kelios sekundÃ„â€”s';
        } else {
            return isFuture ? 'keliÃ…Â³ sekundÃ…Â¾iÃ…Â³' : 'kelias sekundes';
        }
    }

    function translateSingular(number, withoutSuffix, key, isFuture) {
        return withoutSuffix ? forms(key)[0] : (isFuture ? forms(key)[1] : forms(key)[2]);
    }

    function special(number) {
        return number % 10 === 0 || (number > 10 && number < 20);
    }

    function forms(key) {
        return units[key].split('_');
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        if (number === 1) {
            return result + translateSingular(number, withoutSuffix, key[0], isFuture);
        } else if (withoutSuffix) {
            return result + (special(number) ? forms(key)[1] : forms(key)[0]);
        } else {
            if (isFuture) {
                return result + forms(key)[1];
            } else {
                return result + (special(number) ? forms(key)[1] : forms(key)[2]);
            }
        }
    }

    function relativeWeekDay(moment, format) {
        var nominative = format.indexOf('dddd HH:mm') === -1,
            weekDay = weekDays[moment.day()];

        return nominative ? weekDay : weekDay.substring(0, weekDay.length - 2) + 'Ã„Â¯';
    }

    return moment.defineLocale('lt', {
        months : 'sausio_vasario_kovo_balandÃ…Â¾io_geguÃ…Â¾Ã„â€”s_birÃ…Â¾elio_liepos_rugpjÃ…Â«Ã„Âio_rugsÃ„â€”jo_spalio_lapkriÃ„Âio_gruodÃ…Â¾io'.split('_'),
        monthsShort : 'sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd'.split('_'),
        weekdays : relativeWeekDay,
        weekdaysShort : 'Sek_Pir_Ant_Tre_Ket_Pen_Ã… eÃ…Â¡'.split('_'),
        weekdaysMin : 'S_P_A_T_K_Pn_Ã… '.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'YYYY [m.] MMMM D [d.]',
            LLL : 'YYYY [m.] MMMM D [d.], LT [val.]',
            LLLL : 'YYYY [m.] MMMM D [d.], dddd, LT [val.]',
            l : 'YYYY-MM-DD',
            ll : 'YYYY [m.] MMMM D [d.]',
            lll : 'YYYY [m.] MMMM D [d.], LT [val.]',
            llll : 'YYYY [m.] MMMM D [d.], ddd, LT [val.]'
        },
        calendar : {
            sameDay : '[Ã… iandien] LT',
            nextDay : '[Rytoj] LT',
            nextWeek : 'dddd LT',
            lastDay : '[Vakar] LT',
            lastWeek : '[PraÃ„â€”jusÃ„Â¯] dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'po %s',
            past : 'prieÃ…Â¡ %s',
            s : translateSeconds,
            m : translateSingular,
            mm : translate,
            h : translateSingular,
            hh : translate,
            d : translateSingular,
            dd : translate,
            M : translateSingular,
            MM : translate,
            y : translateSingular,
            yy : translate
        },
        ordinalParse: /\d{1,2}-oji/,
        ordinal : function (number) {
            return number + '-oji';
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : latvian (lv)
// author : Kristaps Karlsons : https://github.com/skakri

(function (factory) {
    factory(moment);
}(function (moment) {
    var units = {
        'mm': 'minÃ…Â«ti_minÃ…Â«tes_minÃ…Â«te_minÃ…Â«tes',
        'hh': 'stundu_stundas_stunda_stundas',
        'dd': 'dienu_dienas_diena_dienas',
        'MM': 'mÃ„â€œnesi_mÃ„â€œneÃ…Â¡us_mÃ„â€œnesis_mÃ„â€œneÃ…Â¡i',
        'yy': 'gadu_gadus_gads_gadi'
    };

    function format(word, number, withoutSuffix) {
        var forms = word.split('_');
        if (withoutSuffix) {
            return number % 10 === 1 && number !== 11 ? forms[2] : forms[3];
        } else {
            return number % 10 === 1 && number !== 11 ? forms[0] : forms[1];
        }
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        return number + ' ' + format(units[key], number, withoutSuffix);
    }

    return moment.defineLocale('lv', {
        months : 'janvÃ„Âris_februÃ„Âris_marts_aprÃ„Â«lis_maijs_jÃ…Â«nijs_jÃ…Â«lijs_augusts_septembris_oktobris_novembris_decembris'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jÃ…Â«n_jÃ…Â«l_aug_sep_okt_nov_dec'.split('_'),
        weekdays : 'svÃ„â€œtdiena_pirmdiena_otrdiena_treÃ…Â¡diena_ceturtdiena_piektdiena_sestdiena'.split('_'),
        weekdaysShort : 'Sv_P_O_T_C_Pk_S'.split('_'),
        weekdaysMin : 'Sv_P_O_T_C_Pk_S'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'YYYY. [gada] D. MMMM',
            LLL : 'YYYY. [gada] D. MMMM, LT',
            LLLL : 'YYYY. [gada] D. MMMM, dddd, LT'
        },
        calendar : {
            sameDay : '[Ã… odien pulksten] LT',
            nextDay : '[RÃ„Â«t pulksten] LT',
            nextWeek : 'dddd [pulksten] LT',
            lastDay : '[Vakar pulksten] LT',
            lastWeek : '[PagÃ„ÂjuÃ…Â¡Ã„Â] dddd [pulksten] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s vÃ„â€œlÃ„Âk',
            past : '%s agrÃ„Âk',
            s : 'daÃ…Â¾as sekundes',
            m : 'minÃ…Â«ti',
            mm : relativeTimeWithPlural,
            h : 'stundu',
            hh : relativeTimeWithPlural,
            d : 'dienu',
            dd : relativeTimeWithPlural,
            M : 'mÃ„â€œnesi',
            MM : relativeTimeWithPlural,
            y : 'gadu',
            yy : relativeTimeWithPlural
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : macedonian (mk)
// author : Borislav Mickov : https://github.com/B0k0

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('mk', {
        months : 'Ã‘ËœÃÂ°ÃÂ½Ã‘Æ’ÃÂ°Ã‘â‚¬ÃÂ¸_Ã‘â€žÃÂµÃÂ²Ã‘â‚¬Ã‘Æ’ÃÂ°Ã‘â‚¬ÃÂ¸_ÃÂ¼ÃÂ°Ã‘â‚¬Ã‘â€š_ÃÂ°ÃÂ¿Ã‘â‚¬ÃÂ¸ÃÂ»_ÃÂ¼ÃÂ°Ã‘Ëœ_Ã‘ËœÃ‘Æ’ÃÂ½ÃÂ¸_Ã‘ËœÃ‘Æ’ÃÂ»ÃÂ¸_ÃÂ°ÃÂ²ÃÂ³Ã‘Æ’Ã‘ÂÃ‘â€š_Ã‘ÂÃÂµÃÂ¿Ã‘â€šÃÂµÃÂ¼ÃÂ²Ã‘â‚¬ÃÂ¸_ÃÂ¾ÃÂºÃ‘â€šÃÂ¾ÃÂ¼ÃÂ²Ã‘â‚¬ÃÂ¸_ÃÂ½ÃÂ¾ÃÂµÃÂ¼ÃÂ²Ã‘â‚¬ÃÂ¸_ÃÂ´ÃÂµÃÂºÃÂµÃÂ¼ÃÂ²Ã‘â‚¬ÃÂ¸'.split('_'),
        monthsShort : 'Ã‘ËœÃÂ°ÃÂ½_Ã‘â€žÃÂµÃÂ²_ÃÂ¼ÃÂ°Ã‘â‚¬_ÃÂ°ÃÂ¿Ã‘â‚¬_ÃÂ¼ÃÂ°Ã‘Ëœ_Ã‘ËœÃ‘Æ’ÃÂ½_Ã‘ËœÃ‘Æ’ÃÂ»_ÃÂ°ÃÂ²ÃÂ³_Ã‘ÂÃÂµÃÂ¿_ÃÂ¾ÃÂºÃ‘â€š_ÃÂ½ÃÂ¾ÃÂµ_ÃÂ´ÃÂµÃÂº'.split('_'),
        weekdays : 'ÃÂ½ÃÂµÃÂ´ÃÂµÃÂ»ÃÂ°_ÃÂ¿ÃÂ¾ÃÂ½ÃÂµÃÂ´ÃÂµÃÂ»ÃÂ½ÃÂ¸ÃÂº_ÃÂ²Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ½ÃÂ¸ÃÂº_Ã‘ÂÃ‘â‚¬ÃÂµÃÂ´ÃÂ°_Ã‘â€¡ÃÂµÃ‘â€šÃÂ²Ã‘â‚¬Ã‘â€šÃÂ¾ÃÂº_ÃÂ¿ÃÂµÃ‘â€šÃÂ¾ÃÂº_Ã‘ÂÃÂ°ÃÂ±ÃÂ¾Ã‘â€šÃÂ°'.split('_'),
        weekdaysShort : 'ÃÂ½ÃÂµÃÂ´_ÃÂ¿ÃÂ¾ÃÂ½_ÃÂ²Ã‘â€šÃÂ¾_Ã‘ÂÃ‘â‚¬ÃÂµ_Ã‘â€¡ÃÂµÃ‘â€š_ÃÂ¿ÃÂµÃ‘â€š_Ã‘ÂÃÂ°ÃÂ±'.split('_'),
        weekdaysMin : 'ÃÂ½e_ÃÂ¿o_ÃÂ²Ã‘â€š_Ã‘ÂÃ‘â‚¬_Ã‘â€¡ÃÂµ_ÃÂ¿ÃÂµ_Ã‘Âa'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'D.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Ãâ€ÃÂµÃÂ½ÃÂµÃ‘Â ÃÂ²ÃÂ¾] LT',
            nextDay : '[ÃÂ£Ã‘â€šÃ‘â‚¬ÃÂµ ÃÂ²ÃÂ¾] LT',
            nextWeek : 'dddd [ÃÂ²ÃÂ¾] LT',
            lastDay : '[Ãâ€™Ã‘â€¡ÃÂµÃ‘â‚¬ÃÂ° ÃÂ²ÃÂ¾] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[Ãâ€™ÃÂ¾ ÃÂ¸ÃÂ·ÃÂ¼ÃÂ¸ÃÂ½ÃÂ°Ã‘â€šÃÂ°Ã‘â€šÃÂ°] dddd [ÃÂ²ÃÂ¾] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[Ãâ€™ÃÂ¾ ÃÂ¸ÃÂ·ÃÂ¼ÃÂ¸ÃÂ½ÃÂ°Ã‘â€šÃÂ¸ÃÂ¾Ã‘â€š] dddd [ÃÂ²ÃÂ¾] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'ÃÂ¿ÃÂ¾Ã‘ÂÃÂ»ÃÂµ %s',
            past : 'ÃÂ¿Ã‘â‚¬ÃÂµÃÂ´ %s',
            s : 'ÃÂ½ÃÂµÃÂºÃÂ¾ÃÂ»ÃÂºÃ‘Æ’ Ã‘ÂÃÂµÃÂºÃ‘Æ’ÃÂ½ÃÂ´ÃÂ¸',
            m : 'ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃÂ°',
            mm : '%d ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃÂ¸',
            h : 'Ã‘â€¡ÃÂ°Ã‘Â',
            hh : '%d Ã‘â€¡ÃÂ°Ã‘ÂÃÂ°',
            d : 'ÃÂ´ÃÂµÃÂ½',
            dd : '%d ÃÂ´ÃÂµÃÂ½ÃÂ°',
            M : 'ÃÂ¼ÃÂµÃ‘ÂÃÂµÃ‘â€ ',
            MM : '%d ÃÂ¼ÃÂµÃ‘ÂÃÂµÃ‘â€ ÃÂ¸',
            y : 'ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½ÃÂ°',
            yy : '%d ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½ÃÂ¸'
        },
        ordinalParse: /\d{1,2}-(ÃÂµÃÂ²|ÃÂµÃÂ½|Ã‘â€šÃÂ¸|ÃÂ²ÃÂ¸|Ã‘â‚¬ÃÂ¸|ÃÂ¼ÃÂ¸)/,
        ordinal : function (number) {
            var lastDigit = number % 10,
                last2Digits = number % 100;
            if (number === 0) {
                return number + '-ÃÂµÃÂ²';
            } else if (last2Digits === 0) {
                return number + '-ÃÂµÃÂ½';
            } else if (last2Digits > 10 && last2Digits < 20) {
                return number + '-Ã‘â€šÃÂ¸';
            } else if (lastDigit === 1) {
                return number + '-ÃÂ²ÃÂ¸';
            } else if (lastDigit === 2) {
                return number + '-Ã‘â‚¬ÃÂ¸';
            } else if (lastDigit === 7 || lastDigit === 8) {
                return number + '-ÃÂ¼ÃÂ¸';
            } else {
                return number + '-Ã‘â€šÃÂ¸';
            }
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : malayalam (ml)
// author : Floyd Pink : https://github.com/floydpink

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ml', {
        months : 'Ã Â´Å“Ã Â´Â¨Ã ÂµÂÃ Â´ÂµÃ Â´Â°Ã Â´Â¿_Ã Â´Â«Ã Âµâ€ Ã Â´Â¬Ã ÂµÂÃ Â´Â°Ã ÂµÂÃ Â´ÂµÃ Â´Â°Ã Â´Â¿_Ã Â´Â®Ã Â´Â¾Ã ÂµÂ¼Ã Â´Å¡Ã ÂµÂÃ Â´Å¡Ã ÂµÂ_Ã Â´ÂÃ Â´ÂªÃ ÂµÂÃ Â´Â°Ã Â´Â¿Ã ÂµÂ½_Ã Â´Â®Ã Âµâ€¡Ã Â´Â¯Ã ÂµÂ_Ã Â´Å“Ã Âµâ€šÃ ÂµÂº_Ã Â´Å“Ã Âµâ€šÃ Â´Â²Ã ÂµË†_Ã Â´â€œÃ Â´â€”Ã Â´Â¸Ã ÂµÂÃ Â´Â±Ã ÂµÂÃ Â´Â±Ã ÂµÂ_Ã Â´Â¸Ã Âµâ€ Ã Â´ÂªÃ ÂµÂÃ Â´Â±Ã ÂµÂÃ Â´Â±Ã Â´â€šÃ Â´Â¬Ã ÂµÂ¼_Ã Â´â€™Ã Â´â€¢Ã ÂµÂÃ Â´Å¸Ã Âµâ€¹Ã Â´Â¬Ã ÂµÂ¼_Ã Â´Â¨Ã Â´ÂµÃ Â´â€šÃ Â´Â¬Ã ÂµÂ¼_Ã Â´Â¡Ã Â´Â¿Ã Â´Â¸Ã Â´â€šÃ Â´Â¬Ã ÂµÂ¼'.split('_'),
        monthsShort : 'Ã Â´Å“Ã Â´Â¨Ã ÂµÂ._Ã Â´Â«Ã Âµâ€ Ã Â´Â¬Ã ÂµÂÃ Â´Â°Ã ÂµÂ._Ã Â´Â®Ã Â´Â¾Ã ÂµÂ¼._Ã Â´ÂÃ Â´ÂªÃ ÂµÂÃ Â´Â°Ã Â´Â¿._Ã Â´Â®Ã Âµâ€¡Ã Â´Â¯Ã ÂµÂ_Ã Â´Å“Ã Âµâ€šÃ ÂµÂº_Ã Â´Å“Ã Âµâ€šÃ Â´Â²Ã ÂµË†._Ã Â´â€œÃ Â´â€”._Ã Â´Â¸Ã Âµâ€ Ã Â´ÂªÃ ÂµÂÃ Â´Â±Ã ÂµÂÃ Â´Â±._Ã Â´â€™Ã Â´â€¢Ã ÂµÂÃ Â´Å¸Ã Âµâ€¹._Ã Â´Â¨Ã Â´ÂµÃ Â´â€š._Ã Â´Â¡Ã Â´Â¿Ã Â´Â¸Ã Â´â€š.'.split('_'),
        weekdays : 'Ã Â´Å¾Ã Â´Â¾Ã Â´Â¯Ã Â´Â±Ã Â´Â¾Ã Â´Â´Ã ÂµÂÃ Â´Å¡_Ã Â´Â¤Ã Â´Â¿Ã Â´â„¢Ã ÂµÂÃ Â´â€¢Ã Â´Â³Ã Â´Â¾Ã Â´Â´Ã ÂµÂÃ Â´Å¡_Ã Â´Å¡Ã ÂµÅ Ã Â´ÂµÃ ÂµÂÃ Â´ÂµÃ Â´Â¾Ã Â´Â´Ã ÂµÂÃ Â´Å¡_Ã Â´Â¬Ã ÂµÂÃ Â´Â§Ã Â´Â¨Ã Â´Â¾Ã Â´Â´Ã ÂµÂÃ Â´Å¡_Ã Â´ÂµÃ ÂµÂÃ Â´Â¯Ã Â´Â¾Ã Â´Â´Ã Â´Â¾Ã Â´Â´Ã ÂµÂÃ Â´Å¡_Ã Â´ÂµÃ Âµâ€ Ã Â´Â³Ã ÂµÂÃ Â´Â³Ã Â´Â¿Ã Â´Â¯Ã Â´Â¾Ã Â´Â´Ã ÂµÂÃ Â´Å¡_Ã Â´Â¶Ã Â´Â¨Ã Â´Â¿Ã Â´Â¯Ã Â´Â¾Ã Â´Â´Ã ÂµÂÃ Â´Å¡'.split('_'),
        weekdaysShort : 'Ã Â´Å¾Ã Â´Â¾Ã Â´Â¯Ã ÂµÂ¼_Ã Â´Â¤Ã Â´Â¿Ã Â´â„¢Ã ÂµÂÃ Â´â€¢Ã ÂµÂ¾_Ã Â´Å¡Ã ÂµÅ Ã Â´ÂµÃ ÂµÂÃ Â´Âµ_Ã Â´Â¬Ã ÂµÂÃ Â´Â§Ã ÂµÂ»_Ã Â´ÂµÃ ÂµÂÃ Â´Â¯Ã Â´Â¾Ã Â´Â´Ã Â´â€š_Ã Â´ÂµÃ Âµâ€ Ã Â´Â³Ã ÂµÂÃ Â´Â³Ã Â´Â¿_Ã Â´Â¶Ã Â´Â¨Ã Â´Â¿'.split('_'),
        weekdaysMin : 'Ã Â´Å¾Ã Â´Â¾_Ã Â´Â¤Ã Â´Â¿_Ã Â´Å¡Ã ÂµÅ _Ã Â´Â¬Ã ÂµÂ_Ã Â´ÂµÃ ÂµÂÃ Â´Â¯Ã Â´Â¾_Ã Â´ÂµÃ Âµâ€ _Ã Â´Â¶'.split('_'),
        longDateFormat : {
            LT : 'A h:mm -Ã Â´Â¨Ã ÂµÂ',
            LTS : 'A h:mm:ss -Ã Â´Â¨Ã ÂµÂ',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[Ã Â´â€¡Ã Â´Â¨Ã ÂµÂÃ Â´Â¨Ã ÂµÂ] LT',
            nextDay : '[Ã Â´Â¨Ã Â´Â¾Ã Â´Â³Ã Âµâ€ ] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[Ã Â´â€¡Ã Â´Â¨Ã ÂµÂÃ Â´Â¨Ã Â´Â²Ã Âµâ€ ] LT',
            lastWeek : '[Ã Â´â€¢Ã Â´Â´Ã Â´Â¿Ã Â´Å¾Ã ÂµÂÃ Â´Å¾] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s Ã Â´â€¢Ã Â´Â´Ã Â´Â¿Ã Â´Å¾Ã ÂµÂÃ Â´Å¾Ã ÂµÂ',
            past : '%s Ã Â´Â®Ã ÂµÂÃ ÂµÂ»Ã Â´ÂªÃ ÂµÂ',
            s : 'Ã Â´â€¦Ã ÂµÂ½Ã Â´Âª Ã Â´Â¨Ã Â´Â¿Ã Â´Â®Ã Â´Â¿Ã Â´Â·Ã Â´â„¢Ã ÂµÂÃ Â´â„¢Ã ÂµÂ¾',
            m : 'Ã Â´â€™Ã Â´Â°Ã ÂµÂ Ã Â´Â®Ã Â´Â¿Ã Â´Â¨Ã Â´Â¿Ã Â´Â±Ã ÂµÂÃ Â´Â±Ã ÂµÂ',
            mm : '%d Ã Â´Â®Ã Â´Â¿Ã Â´Â¨Ã Â´Â¿Ã Â´Â±Ã ÂµÂÃ Â´Â±Ã ÂµÂ',
            h : 'Ã Â´â€™Ã Â´Â°Ã ÂµÂ Ã Â´Â®Ã Â´Â£Ã Â´Â¿Ã Â´â€¢Ã ÂµÂÃ Â´â€¢Ã Âµâ€šÃ ÂµÂ¼',
            hh : '%d Ã Â´Â®Ã Â´Â£Ã Â´Â¿Ã Â´â€¢Ã ÂµÂÃ Â´â€¢Ã Âµâ€šÃ ÂµÂ¼',
            d : 'Ã Â´â€™Ã Â´Â°Ã ÂµÂ Ã Â´Â¦Ã Â´Â¿Ã Â´ÂµÃ Â´Â¸Ã Â´â€š',
            dd : '%d Ã Â´Â¦Ã Â´Â¿Ã Â´ÂµÃ Â´Â¸Ã Â´â€š',
            M : 'Ã Â´â€™Ã Â´Â°Ã ÂµÂ Ã Â´Â®Ã Â´Â¾Ã Â´Â¸Ã Â´â€š',
            MM : '%d Ã Â´Â®Ã Â´Â¾Ã Â´Â¸Ã Â´â€š',
            y : 'Ã Â´â€™Ã Â´Â°Ã ÂµÂ Ã Â´ÂµÃ ÂµÂ¼Ã Â´Â·Ã Â´â€š',
            yy : '%d Ã Â´ÂµÃ ÂµÂ¼Ã Â´Â·Ã Â´â€š'
        },
        meridiemParse: /Ã Â´Â°Ã Â´Â¾Ã Â´Â¤Ã ÂµÂÃ Â´Â°Ã Â´Â¿|Ã Â´Â°Ã Â´Â¾Ã Â´ÂµÃ Â´Â¿Ã Â´Â²Ã Âµâ€ |Ã Â´â€°Ã Â´Å¡Ã ÂµÂÃ Â´Å¡ Ã Â´â€¢Ã Â´Â´Ã Â´Â¿Ã Â´Å¾Ã ÂµÂÃ Â´Å¾Ã ÂµÂ|Ã Â´ÂµÃ ÂµË†Ã Â´â€¢Ã ÂµÂÃ Â´Â¨Ã ÂµÂÃ Â´Â¨Ã Âµâ€¡Ã Â´Â°Ã Â´â€š|Ã Â´Â°Ã Â´Â¾Ã Â´Â¤Ã ÂµÂÃ Â´Â°Ã Â´Â¿/i,
        isPM : function (input) {
            return /^(Ã Â´â€°Ã Â´Å¡Ã ÂµÂÃ Â´Å¡ Ã Â´â€¢Ã Â´Â´Ã Â´Â¿Ã Â´Å¾Ã ÂµÂÃ Â´Å¾Ã ÂµÂ|Ã Â´ÂµÃ ÂµË†Ã Â´â€¢Ã ÂµÂÃ Â´Â¨Ã ÂµÂÃ Â´Â¨Ã Âµâ€¡Ã Â´Â°Ã Â´â€š|Ã Â´Â°Ã Â´Â¾Ã Â´Â¤Ã ÂµÂÃ Â´Â°Ã Â´Â¿)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'Ã Â´Â°Ã Â´Â¾Ã Â´Â¤Ã ÂµÂÃ Â´Â°Ã Â´Â¿';
            } else if (hour < 12) {
                return 'Ã Â´Â°Ã Â´Â¾Ã Â´ÂµÃ Â´Â¿Ã Â´Â²Ã Âµâ€ ';
            } else if (hour < 17) {
                return 'Ã Â´â€°Ã Â´Å¡Ã ÂµÂÃ Â´Å¡ Ã Â´â€¢Ã Â´Â´Ã Â´Â¿Ã Â´Å¾Ã ÂµÂÃ Â´Å¾Ã ÂµÂ';
            } else if (hour < 20) {
                return 'Ã Â´ÂµÃ ÂµË†Ã Â´â€¢Ã ÂµÂÃ Â´Â¨Ã ÂµÂÃ Â´Â¨Ã Âµâ€¡Ã Â´Â°Ã Â´â€š';
            } else {
                return 'Ã Â´Â°Ã Â´Â¾Ã Â´Â¤Ã ÂµÂÃ Â´Â°Ã Â´Â¿';
            }
        }
    });
}));
// moment.js locale configuration
// locale : Marathi (mr)
// author : Harshad Kale : https://github.com/kalehv

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ã Â¥Â§',
        '2': 'Ã Â¥Â¨',
        '3': 'Ã Â¥Â©',
        '4': 'Ã Â¥Âª',
        '5': 'Ã Â¥Â«',
        '6': 'Ã Â¥Â¬',
        '7': 'Ã Â¥Â­',
        '8': 'Ã Â¥Â®',
        '9': 'Ã Â¥Â¯',
        '0': 'Ã Â¥Â¦'
    },
    numberMap = {
        'Ã Â¥Â§': '1',
        'Ã Â¥Â¨': '2',
        'Ã Â¥Â©': '3',
        'Ã Â¥Âª': '4',
        'Ã Â¥Â«': '5',
        'Ã Â¥Â¬': '6',
        'Ã Â¥Â­': '7',
        'Ã Â¥Â®': '8',
        'Ã Â¥Â¯': '9',
        'Ã Â¥Â¦': '0'
    };

    return moment.defineLocale('mr', {
        months : 'Ã Â¤Å“Ã Â¤Â¾Ã Â¤Â¨Ã Â¥â€¡Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°Ã Â¥â‚¬_Ã Â¤Â«Ã Â¥â€¡Ã Â¤Â¬Ã Â¥ÂÃ Â¤Â°Ã Â¥ÂÃ Â¤ÂµÃ Â¤Â¾Ã Â¤Â°Ã Â¥â‚¬_Ã Â¤Â®Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤Å¡_Ã Â¤ÂÃ Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¿Ã Â¤Â²_Ã Â¤Â®Ã Â¥â€¡_Ã Â¤Å“Ã Â¥â€šÃ Â¤Â¨_Ã Â¤Å“Ã Â¥ÂÃ Â¤Â²Ã Â¥Ë†_Ã Â¤â€˜Ã Â¤â€”Ã Â¤Â¸Ã Â¥ÂÃ Â¤Å¸_Ã Â¤Â¸Ã Â¤ÂªÃ Â¥ÂÃ Â¤Å¸Ã Â¥â€¡Ã Â¤â€šÃ Â¤Â¬Ã Â¤Â°_Ã Â¤â€˜Ã Â¤â€¢Ã Â¥ÂÃ Â¤Å¸Ã Â¥â€¹Ã Â¤Â¬Ã Â¤Â°_Ã Â¤Â¨Ã Â¥â€¹Ã Â¤ÂµÃ Â¥ÂÃ Â¤Â¹Ã Â¥â€¡Ã Â¤â€šÃ Â¤Â¬Ã Â¤Â°_Ã Â¤Â¡Ã Â¤Â¿Ã Â¤Â¸Ã Â¥â€¡Ã Â¤â€šÃ Â¤Â¬Ã Â¤Â°'.split('_'),
        monthsShort: 'Ã Â¤Å“Ã Â¤Â¾Ã Â¤Â¨Ã Â¥â€¡._Ã Â¤Â«Ã Â¥â€¡Ã Â¤Â¬Ã Â¥ÂÃ Â¤Â°Ã Â¥Â._Ã Â¤Â®Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤Å¡._Ã Â¤ÂÃ Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¿._Ã Â¤Â®Ã Â¥â€¡._Ã Â¤Å“Ã Â¥â€šÃ Â¤Â¨._Ã Â¤Å“Ã Â¥ÂÃ Â¤Â²Ã Â¥Ë†._Ã Â¤â€˜Ã Â¤â€”._Ã Â¤Â¸Ã Â¤ÂªÃ Â¥ÂÃ Â¤Å¸Ã Â¥â€¡Ã Â¤â€š._Ã Â¤â€˜Ã Â¤â€¢Ã Â¥ÂÃ Â¤Å¸Ã Â¥â€¹._Ã Â¤Â¨Ã Â¥â€¹Ã Â¤ÂµÃ Â¥ÂÃ Â¤Â¹Ã Â¥â€¡Ã Â¤â€š._Ã Â¤Â¡Ã Â¤Â¿Ã Â¤Â¸Ã Â¥â€¡Ã Â¤â€š.'.split('_'),
        weekdays : 'Ã Â¤Â°Ã Â¤ÂµÃ Â¤Â¿Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤Â¸Ã Â¥â€¹Ã Â¤Â®Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤Â®Ã Â¤â€šÃ Â¤â€”Ã Â¤Â³Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤Â¬Ã Â¥ÂÃ Â¤Â§Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤â€”Ã Â¥ÂÃ Â¤Â°Ã Â¥â€šÃ Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤Â¶Ã Â¥ÂÃ Â¤â€¢Ã Â¥ÂÃ Â¤Â°Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°_Ã Â¤Â¶Ã Â¤Â¨Ã Â¤Â¿Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Â°'.split('_'),
        weekdaysShort : 'Ã Â¤Â°Ã Â¤ÂµÃ Â¤Â¿_Ã Â¤Â¸Ã Â¥â€¹Ã Â¤Â®_Ã Â¤Â®Ã Â¤â€šÃ Â¤â€”Ã Â¤Â³_Ã Â¤Â¬Ã Â¥ÂÃ Â¤Â§_Ã Â¤â€”Ã Â¥ÂÃ Â¤Â°Ã Â¥â€š_Ã Â¤Â¶Ã Â¥ÂÃ Â¤â€¢Ã Â¥ÂÃ Â¤Â°_Ã Â¤Â¶Ã Â¤Â¨Ã Â¤Â¿'.split('_'),
        weekdaysMin : 'Ã Â¤Â°_Ã Â¤Â¸Ã Â¥â€¹_Ã Â¤Â®Ã Â¤â€š_Ã Â¤Â¬Ã Â¥Â_Ã Â¤â€”Ã Â¥Â_Ã Â¤Â¶Ã Â¥Â_Ã Â¤Â¶'.split('_'),
        longDateFormat : {
            LT : 'A h:mm Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Å“Ã Â¤Â¤Ã Â¤Â¾',
            LTS : 'A h:mm:ss Ã Â¤ÂµÃ Â¤Â¾Ã Â¤Å“Ã Â¤Â¤Ã Â¤Â¾',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[Ã Â¤â€ Ã Â¤Å“] LT',
            nextDay : '[Ã Â¤â€°Ã Â¤Â¦Ã Â¥ÂÃ Â¤Â¯Ã Â¤Â¾] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[Ã Â¤â€¢Ã Â¤Â¾Ã Â¤Â²] LT',
            lastWeek: '[Ã Â¤Â®Ã Â¤Â¾Ã Â¤â€”Ã Â¥â‚¬Ã Â¤Â²] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s Ã Â¤Â¨Ã Â¤â€šÃ Â¤Â¤Ã Â¤Â°',
            past : '%s Ã Â¤ÂªÃ Â¥â€šÃ Â¤Â°Ã Â¥ÂÃ Â¤ÂµÃ Â¥â‚¬',
            s : 'Ã Â¤Â¸Ã Â¥â€¡Ã Â¤â€¢Ã Â¤â€šÃ Â¤Â¦',
            m: 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤Â®Ã Â¤Â¿Ã Â¤Â¨Ã Â¤Â¿Ã Â¤Å¸',
            mm: '%d Ã Â¤Â®Ã Â¤Â¿Ã Â¤Â¨Ã Â¤Â¿Ã Â¤Å¸Ã Â¥â€¡',
            h : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤Â¤Ã Â¤Â¾Ã Â¤Â¸',
            hh : '%d Ã Â¤Â¤Ã Â¤Â¾Ã Â¤Â¸',
            d : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤Â¦Ã Â¤Â¿Ã Â¤ÂµÃ Â¤Â¸',
            dd : '%d Ã Â¤Â¦Ã Â¤Â¿Ã Â¤ÂµÃ Â¤Â¸',
            M : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤Â®Ã Â¤Â¹Ã Â¤Â¿Ã Â¤Â¨Ã Â¤Â¾',
            MM : '%d Ã Â¤Â®Ã Â¤Â¹Ã Â¤Â¿Ã Â¤Â¨Ã Â¥â€¡',
            y : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤ÂµÃ Â¤Â°Ã Â¥ÂÃ Â¤Â·',
            yy : '%d Ã Â¤ÂµÃ Â¤Â°Ã Â¥ÂÃ Â¤Â·Ã Â¥â€¡'
        },
        preparse: function (string) {
            return string.replace(/[Ã Â¥Â§Ã Â¥Â¨Ã Â¥Â©Ã Â¥ÂªÃ Â¥Â«Ã Â¥Â¬Ã Â¥Â­Ã Â¥Â®Ã Â¥Â¯Ã Â¥Â¦]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â°Ã Â¥â‚¬|Ã Â¤Â¸Ã Â¤â€¢Ã Â¤Â¾Ã Â¤Â³Ã Â¥â‚¬|Ã Â¤Â¦Ã Â¥ÂÃ Â¤ÂªÃ Â¤Â¾Ã Â¤Â°Ã Â¥â‚¬|Ã Â¤Â¸Ã Â¤Â¾Ã Â¤Â¯Ã Â¤â€šÃ Â¤â€¢Ã Â¤Â¾Ã Â¤Â³Ã Â¥â‚¬/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â°Ã Â¥â‚¬') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === 'Ã Â¤Â¸Ã Â¤â€¢Ã Â¤Â¾Ã Â¤Â³Ã Â¥â‚¬') {
                return hour;
            } else if (meridiem === 'Ã Â¤Â¦Ã Â¥ÂÃ Â¤ÂªÃ Â¤Â¾Ã Â¤Â°Ã Â¥â‚¬') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === 'Ã Â¤Â¸Ã Â¤Â¾Ã Â¤Â¯Ã Â¤â€šÃ Â¤â€¢Ã Â¤Â¾Ã Â¤Â³Ã Â¥â‚¬') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower)
        {
            if (hour < 4) {
                return 'Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â°Ã Â¥â‚¬';
            } else if (hour < 10) {
                return 'Ã Â¤Â¸Ã Â¤â€¢Ã Â¤Â¾Ã Â¤Â³Ã Â¥â‚¬';
            } else if (hour < 17) {
                return 'Ã Â¤Â¦Ã Â¥ÂÃ Â¤ÂªÃ Â¤Â¾Ã Â¤Â°Ã Â¥â‚¬';
            } else if (hour < 20) {
                return 'Ã Â¤Â¸Ã Â¤Â¾Ã Â¤Â¯Ã Â¤â€šÃ Â¤â€¢Ã Â¤Â¾Ã Â¤Â³Ã Â¥â‚¬';
            } else {
                return 'Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â°Ã Â¥â‚¬';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Bahasa Malaysia (ms-MY)
// author : Weldan Jamili : https://github.com/weldan

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ms-my', {
        months : 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split('_'),
        monthsShort : 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split('_'),
        weekdays : 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split('_'),
        weekdaysShort : 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
        weekdaysMin : 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
        longDateFormat : {
            LT : 'HH.mm',
            LTS : 'LT.ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY [pukul] LT',
            LLLL : 'dddd, D MMMM YYYY [pukul] LT'
        },
        meridiemParse: /pagi|tengahari|petang|malam/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'pagi') {
                return hour;
            } else if (meridiem === 'tengahari') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'petang' || meridiem === 'malam') {
                return hour + 12;
            }
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'pagi';
            } else if (hours < 15) {
                return 'tengahari';
            } else if (hours < 19) {
                return 'petang';
            } else {
                return 'malam';
            }
        },
        calendar : {
            sameDay : '[Hari ini pukul] LT',
            nextDay : '[Esok pukul] LT',
            nextWeek : 'dddd [pukul] LT',
            lastDay : '[Kelmarin pukul] LT',
            lastWeek : 'dddd [lepas pukul] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'dalam %s',
            past : '%s yang lepas',
            s : 'beberapa saat',
            m : 'seminit',
            mm : '%d minit',
            h : 'sejam',
            hh : '%d jam',
            d : 'sehari',
            dd : '%d hari',
            M : 'sebulan',
            MM : '%d bulan',
            y : 'setahun',
            yy : '%d tahun'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Burmese (my)
// author : Squar team, mysquar.com

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ã¡ÂÂ',
        '2': 'Ã¡Ââ€š',
        '3': 'Ã¡ÂÆ’',
        '4': 'Ã¡Ââ€ž',
        '5': 'Ã¡Ââ€¦',
        '6': 'Ã¡Ââ€ ',
        '7': 'Ã¡Ââ€¡',
        '8': 'Ã¡ÂË†',
        '9': 'Ã¡Ââ€°',
        '0': 'Ã¡Ââ‚¬'
    }, numberMap = {
        'Ã¡ÂÂ': '1',
        'Ã¡Ââ€š': '2',
        'Ã¡ÂÆ’': '3',
        'Ã¡Ââ€ž': '4',
        'Ã¡Ââ€¦': '5',
        'Ã¡Ââ€ ': '6',
        'Ã¡Ââ€¡': '7',
        'Ã¡ÂË†': '8',
        'Ã¡Ââ€°': '9',
        'Ã¡Ââ‚¬': '0'
    };
    return moment.defineLocale('my', {
        months: 'Ã¡â‚¬â€¡Ã¡â‚¬â€Ã¡â‚¬ÂºÃ¡â‚¬â€Ã¡â‚¬ÂÃ¡â‚¬Â«Ã¡â‚¬â€ºÃ¡â‚¬Â®_Ã¡â‚¬â€“Ã¡â‚¬Â±Ã¡â‚¬â€“Ã¡â‚¬Â±Ã¡â‚¬Â¬Ã¡â‚¬ÂºÃ¡â‚¬ÂÃ¡â‚¬Â«Ã¡â‚¬â€ºÃ¡â‚¬Â®_Ã¡â‚¬â„¢Ã¡â‚¬ÂÃ¡â‚¬Âº_Ã¡â‚¬Â§Ã¡â‚¬â€¢Ã¡â‚¬Â¼Ã¡â‚¬Â®_Ã¡â‚¬â„¢Ã¡â‚¬Â±_Ã¡â‚¬â€¡Ã¡â‚¬Â½Ã¡â‚¬â€Ã¡â‚¬Âº_Ã¡â‚¬â€¡Ã¡â‚¬Â°Ã¡â‚¬Å“Ã¡â‚¬Â­Ã¡â‚¬Â¯Ã¡â‚¬â€žÃ¡â‚¬Âº_Ã¡â‚¬Å¾Ã¡â‚¬Â¼Ã¡â‚¬â€šÃ¡â‚¬Â¯Ã¡â‚¬ÂÃ¡â‚¬Âº_Ã¡â‚¬â€¦Ã¡â‚¬â‚¬Ã¡â‚¬ÂºÃ¡â‚¬ÂÃ¡â‚¬â€žÃ¡â‚¬ÂºÃ¡â‚¬ËœÃ¡â‚¬Â¬_Ã¡â‚¬Â¡Ã¡â‚¬Â±Ã¡â‚¬Â¬Ã¡â‚¬â‚¬Ã¡â‚¬ÂºÃ¡â‚¬ÂÃ¡â‚¬Â­Ã¡â‚¬Â¯Ã¡â‚¬ËœÃ¡â‚¬Â¬_Ã¡â‚¬â€Ã¡â‚¬Â­Ã¡â‚¬Â¯Ã¡â‚¬ÂÃ¡â‚¬â€žÃ¡â‚¬ÂºÃ¡â‚¬ËœÃ¡â‚¬Â¬_Ã¡â‚¬â€™Ã¡â‚¬Â®Ã¡â‚¬â€¡Ã¡â‚¬â€žÃ¡â‚¬ÂºÃ¡â‚¬ËœÃ¡â‚¬Â¬'.split('_'),
        monthsShort: 'Ã¡â‚¬â€¡Ã¡â‚¬â€Ã¡â‚¬Âº_Ã¡â‚¬â€“Ã¡â‚¬Â±_Ã¡â‚¬â„¢Ã¡â‚¬ÂÃ¡â‚¬Âº_Ã¡â‚¬â€¢Ã¡â‚¬Â¼Ã¡â‚¬Â®_Ã¡â‚¬â„¢Ã¡â‚¬Â±_Ã¡â‚¬â€¡Ã¡â‚¬Â½Ã¡â‚¬â€Ã¡â‚¬Âº_Ã¡â‚¬Å“Ã¡â‚¬Â­Ã¡â‚¬Â¯Ã¡â‚¬â€žÃ¡â‚¬Âº_Ã¡â‚¬Å¾Ã¡â‚¬Â¼_Ã¡â‚¬â€¦Ã¡â‚¬â‚¬Ã¡â‚¬Âº_Ã¡â‚¬Â¡Ã¡â‚¬Â±Ã¡â‚¬Â¬Ã¡â‚¬â‚¬Ã¡â‚¬Âº_Ã¡â‚¬â€Ã¡â‚¬Â­Ã¡â‚¬Â¯_Ã¡â‚¬â€™Ã¡â‚¬Â®'.split('_'),
        weekdays: 'Ã¡â‚¬ÂÃ¡â‚¬â€Ã¡â‚¬â€žÃ¡â‚¬ÂºÃ¡â‚¬Â¹Ã¡â‚¬â€šÃ¡â‚¬â€Ã¡â‚¬Â½Ã¡â‚¬Â±_Ã¡â‚¬ÂÃ¡â‚¬â€Ã¡â‚¬â€žÃ¡â‚¬ÂºÃ¡â‚¬Â¹Ã¡â‚¬Å“Ã¡â‚¬Â¬_Ã¡â‚¬Â¡Ã¡â‚¬â€žÃ¡â‚¬ÂºÃ¡â‚¬Â¹Ã¡â‚¬â€šÃ¡â‚¬Â«_Ã¡â‚¬â€”Ã¡â‚¬Â¯Ã¡â‚¬â€™Ã¡â‚¬Â¹Ã¡â‚¬â€œÃ¡â‚¬Å¸Ã¡â‚¬Â°Ã¡â‚¬Â¸_Ã¡â‚¬â‚¬Ã¡â‚¬Â¼Ã¡â‚¬Â¬Ã¡â‚¬Å¾Ã¡â‚¬â€¢Ã¡â‚¬ÂÃ¡â‚¬Â±Ã¡â‚¬Â¸_Ã¡â‚¬Å¾Ã¡â‚¬Â±Ã¡â‚¬Â¬Ã¡â‚¬â‚¬Ã¡â‚¬Â¼Ã¡â‚¬Â¬_Ã¡â‚¬â€¦Ã¡â‚¬â€Ã¡â‚¬Â±'.split('_'),
        weekdaysShort: 'Ã¡â‚¬â€Ã¡â‚¬Â½Ã¡â‚¬Â±_Ã¡â‚¬Å“Ã¡â‚¬Â¬_Ã¡â‚¬â€žÃ¡â‚¬ÂºÃ¡â‚¬Â¹Ã¡â‚¬â€šÃ¡â‚¬Â«_Ã¡â‚¬Å¸Ã¡â‚¬Â°Ã¡â‚¬Â¸_Ã¡â‚¬â‚¬Ã¡â‚¬Â¼Ã¡â‚¬Â¬_Ã¡â‚¬Å¾Ã¡â‚¬Â±Ã¡â‚¬Â¬_Ã¡â‚¬â€Ã¡â‚¬Â±'.split('_'),
        weekdaysMin: 'Ã¡â‚¬â€Ã¡â‚¬Â½Ã¡â‚¬Â±_Ã¡â‚¬Å“Ã¡â‚¬Â¬_Ã¡â‚¬â€žÃ¡â‚¬ÂºÃ¡â‚¬Â¹Ã¡â‚¬â€šÃ¡â‚¬Â«_Ã¡â‚¬Å¸Ã¡â‚¬Â°Ã¡â‚¬Â¸_Ã¡â‚¬â‚¬Ã¡â‚¬Â¼Ã¡â‚¬Â¬_Ã¡â‚¬Å¾Ã¡â‚¬Â±Ã¡â‚¬Â¬_Ã¡â‚¬â€Ã¡â‚¬Â±'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[Ã¡â‚¬Å¡Ã¡â‚¬â€Ã¡â‚¬Â±.] LT [Ã¡â‚¬â„¢Ã¡â‚¬Â¾Ã¡â‚¬Â¬]',
            nextDay: '[Ã¡â‚¬â„¢Ã¡â‚¬â€Ã¡â‚¬â‚¬Ã¡â‚¬ÂºÃ¡â‚¬â€“Ã¡â‚¬Â¼Ã¡â‚¬â€Ã¡â‚¬Âº] LT [Ã¡â‚¬â„¢Ã¡â‚¬Â¾Ã¡â‚¬Â¬]',
            nextWeek: 'dddd LT [Ã¡â‚¬â„¢Ã¡â‚¬Â¾Ã¡â‚¬Â¬]',
            lastDay: '[Ã¡â‚¬â„¢Ã¡â‚¬â€Ã¡â‚¬Â±.Ã¡â‚¬â‚¬] LT [Ã¡â‚¬â„¢Ã¡â‚¬Â¾Ã¡â‚¬Â¬]',
            lastWeek: '[Ã¡â‚¬â€¢Ã¡â‚¬Â¼Ã¡â‚¬Â®Ã¡â‚¬Â¸Ã¡â‚¬ÂÃ¡â‚¬Â²Ã¡â‚¬Â·Ã¡â‚¬Å¾Ã¡â‚¬Â±Ã¡â‚¬Â¬] dddd LT [Ã¡â‚¬â„¢Ã¡â‚¬Â¾Ã¡â‚¬Â¬]',
            sameElse: 'L'
        },
        relativeTime: {
            future: 'Ã¡â‚¬Å“Ã¡â‚¬Â¬Ã¡â‚¬â„¢Ã¡â‚¬Å Ã¡â‚¬Â·Ã¡â‚¬Âº %s Ã¡â‚¬â„¢Ã¡â‚¬Â¾Ã¡â‚¬Â¬',
            past: 'Ã¡â‚¬Å“Ã¡â‚¬Â½Ã¡â‚¬â€Ã¡â‚¬ÂºÃ¡â‚¬ÂÃ¡â‚¬Â²Ã¡â‚¬Â·Ã¡â‚¬Å¾Ã¡â‚¬Â±Ã¡â‚¬Â¬ %s Ã¡â‚¬â‚¬',
            s: 'Ã¡â‚¬â€¦Ã¡â‚¬â‚¬Ã¡â‚¬Â¹Ã¡â‚¬â‚¬Ã¡â‚¬â€Ã¡â‚¬Âº.Ã¡â‚¬Â¡Ã¡â‚¬â€Ã¡â‚¬Å Ã¡â‚¬ÂºÃ¡â‚¬Â¸Ã¡â‚¬â€žÃ¡â‚¬Å¡Ã¡â‚¬Âº',
            m: 'Ã¡â‚¬ÂÃ¡â‚¬â€¦Ã¡â‚¬ÂºÃ¡â‚¬â„¢Ã¡â‚¬Â­Ã¡â‚¬â€Ã¡â‚¬â€¦Ã¡â‚¬Âº',
            mm: '%d Ã¡â‚¬â„¢Ã¡â‚¬Â­Ã¡â‚¬â€Ã¡â‚¬â€¦Ã¡â‚¬Âº',
            h: 'Ã¡â‚¬ÂÃ¡â‚¬â€¦Ã¡â‚¬ÂºÃ¡â‚¬â€Ã¡â‚¬Â¬Ã¡â‚¬â€ºÃ¡â‚¬Â®',
            hh: '%d Ã¡â‚¬â€Ã¡â‚¬Â¬Ã¡â‚¬â€ºÃ¡â‚¬Â®',
            d: 'Ã¡â‚¬ÂÃ¡â‚¬â€¦Ã¡â‚¬ÂºÃ¡â‚¬â€ºÃ¡â‚¬â‚¬Ã¡â‚¬Âº',
            dd: '%d Ã¡â‚¬â€ºÃ¡â‚¬â‚¬Ã¡â‚¬Âº',
            M: 'Ã¡â‚¬ÂÃ¡â‚¬â€¦Ã¡â‚¬ÂºÃ¡â‚¬Å“',
            MM: '%d Ã¡â‚¬Å“',
            y: 'Ã¡â‚¬ÂÃ¡â‚¬â€¦Ã¡â‚¬ÂºÃ¡â‚¬â€Ã¡â‚¬Â¾Ã¡â‚¬â€¦Ã¡â‚¬Âº',
            yy: '%d Ã¡â‚¬â€Ã¡â‚¬Â¾Ã¡â‚¬â€¦Ã¡â‚¬Âº'
        },
        preparse: function (string) {
            return string.replace(/[Ã¡ÂÂÃ¡Ââ€šÃ¡ÂÆ’Ã¡Ââ€žÃ¡Ââ€¦Ã¡Ââ€ Ã¡Ââ€¡Ã¡ÂË†Ã¡Ââ€°Ã¡Ââ‚¬]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4 // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : norwegian bokmÃƒÂ¥l (nb)
// authors : Espen Hovlandsdal : https://github.com/rexxars
//           Sigurd Gartmann : https://github.com/sigurdga

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('nb', {
        months : 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
        weekdays : 'sÃƒÂ¸ndag_mandag_tirsdag_onsdag_torsdag_fredag_lÃƒÂ¸rdag'.split('_'),
        weekdaysShort : 'sÃƒÂ¸n_man_tirs_ons_tors_fre_lÃƒÂ¸r'.split('_'),
        weekdaysMin : 'sÃƒÂ¸_ma_ti_on_to_fr_lÃƒÂ¸'.split('_'),
        longDateFormat : {
            LT : 'H.mm',
            LTS : 'LT.ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY [kl.] LT',
            LLLL : 'dddd D. MMMM YYYY [kl.] LT'
        },
        calendar : {
            sameDay: '[i dag kl.] LT',
            nextDay: '[i morgen kl.] LT',
            nextWeek: 'dddd [kl.] LT',
            lastDay: '[i gÃƒÂ¥r kl.] LT',
            lastWeek: '[forrige] dddd [kl.] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : 'for %s siden',
            s : 'noen sekunder',
            m : 'ett minutt',
            mm : '%d minutter',
            h : 'en time',
            hh : '%d timer',
            d : 'en dag',
            dd : '%d dager',
            M : 'en mÃƒÂ¥ned',
            MM : '%d mÃƒÂ¥neder',
            y : 'ett ÃƒÂ¥r',
            yy : '%d ÃƒÂ¥r'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : nepali/nepalese
// author : suvash : https://github.com/suvash

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ã Â¥Â§',
        '2': 'Ã Â¥Â¨',
        '3': 'Ã Â¥Â©',
        '4': 'Ã Â¥Âª',
        '5': 'Ã Â¥Â«',
        '6': 'Ã Â¥Â¬',
        '7': 'Ã Â¥Â­',
        '8': 'Ã Â¥Â®',
        '9': 'Ã Â¥Â¯',
        '0': 'Ã Â¥Â¦'
    },
    numberMap = {
        'Ã Â¥Â§': '1',
        'Ã Â¥Â¨': '2',
        'Ã Â¥Â©': '3',
        'Ã Â¥Âª': '4',
        'Ã Â¥Â«': '5',
        'Ã Â¥Â¬': '6',
        'Ã Â¥Â­': '7',
        'Ã Â¥Â®': '8',
        'Ã Â¥Â¯': '9',
        'Ã Â¥Â¦': '0'
    };

    return moment.defineLocale('ne', {
        months : 'Ã Â¤Å“Ã Â¤Â¨Ã Â¤ÂµÃ Â¤Â°Ã Â¥â‚¬_Ã Â¤Â«Ã Â¥â€¡Ã Â¤Â¬Ã Â¥ÂÃ Â¤Â°Ã Â¥ÂÃ Â¤ÂµÃ Â¤Â°Ã Â¥â‚¬_Ã Â¤Â®Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤Å¡_Ã Â¤â€¦Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¿Ã Â¤Â²_Ã Â¤Â®Ã Â¤Ë†_Ã Â¤Å“Ã Â¥ÂÃ Â¤Â¨_Ã Â¤Å“Ã Â¥ÂÃ Â¤Â²Ã Â¤Â¾Ã Â¤Ë†_Ã Â¤â€¦Ã Â¤â€”Ã Â¤Â·Ã Â¥ÂÃ Â¤Å¸_Ã Â¤Â¸Ã Â¥â€¡Ã Â¤ÂªÃ Â¥ÂÃ Â¤Å¸Ã Â¥â€¡Ã Â¤Â®Ã Â¥ÂÃ Â¤Â¬Ã Â¤Â°_Ã Â¤â€¦Ã Â¤â€¢Ã Â¥ÂÃ Â¤Å¸Ã Â¥â€¹Ã Â¤Â¬Ã Â¤Â°_Ã Â¤Â¨Ã Â¥â€¹Ã Â¤Â­Ã Â¥â€¡Ã Â¤Â®Ã Â¥ÂÃ Â¤Â¬Ã Â¤Â°_Ã Â¤Â¡Ã Â¤Â¿Ã Â¤Â¸Ã Â¥â€¡Ã Â¤Â®Ã Â¥ÂÃ Â¤Â¬Ã Â¤Â°'.split('_'),
        monthsShort : 'Ã Â¤Å“Ã Â¤Â¨._Ã Â¤Â«Ã Â¥â€¡Ã Â¤Â¬Ã Â¥ÂÃ Â¤Â°Ã Â¥Â._Ã Â¤Â®Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤Å¡_Ã Â¤â€¦Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¿._Ã Â¤Â®Ã Â¤Ë†_Ã Â¤Å“Ã Â¥ÂÃ Â¤Â¨_Ã Â¤Å“Ã Â¥ÂÃ Â¤Â²Ã Â¤Â¾Ã Â¤Ë†._Ã Â¤â€¦Ã Â¤â€”._Ã Â¤Â¸Ã Â¥â€¡Ã Â¤ÂªÃ Â¥ÂÃ Â¤Å¸._Ã Â¤â€¦Ã Â¤â€¢Ã Â¥ÂÃ Â¤Å¸Ã Â¥â€¹._Ã Â¤Â¨Ã Â¥â€¹Ã Â¤Â­Ã Â¥â€¡._Ã Â¤Â¡Ã Â¤Â¿Ã Â¤Â¸Ã Â¥â€¡.'.split('_'),
        weekdays : 'Ã Â¤â€ Ã Â¤â€¡Ã Â¤Â¤Ã Â¤Â¬Ã Â¤Â¾Ã Â¤Â°_Ã Â¤Â¸Ã Â¥â€¹Ã Â¤Â®Ã Â¤Â¬Ã Â¤Â¾Ã Â¤Â°_Ã Â¤Â®Ã Â¤â„¢Ã Â¥ÂÃ Â¤â€”Ã Â¤Â²Ã Â¤Â¬Ã Â¤Â¾Ã Â¤Â°_Ã Â¤Â¬Ã Â¥ÂÃ Â¤Â§Ã Â¤Â¬Ã Â¤Â¾Ã Â¤Â°_Ã Â¤Â¬Ã Â¤Â¿Ã Â¤Â¹Ã Â¤Â¿Ã Â¤Â¬Ã Â¤Â¾Ã Â¤Â°_Ã Â¤Â¶Ã Â¥ÂÃ Â¤â€¢Ã Â¥ÂÃ Â¤Â°Ã Â¤Â¬Ã Â¤Â¾Ã Â¤Â°_Ã Â¤Â¶Ã Â¤Â¨Ã Â¤Â¿Ã Â¤Â¬Ã Â¤Â¾Ã Â¤Â°'.split('_'),
        weekdaysShort : 'Ã Â¤â€ Ã Â¤â€¡Ã Â¤Â¤._Ã Â¤Â¸Ã Â¥â€¹Ã Â¤Â®._Ã Â¤Â®Ã Â¤â„¢Ã Â¥ÂÃ Â¤â€”Ã Â¤Â²._Ã Â¤Â¬Ã Â¥ÂÃ Â¤Â§._Ã Â¤Â¬Ã Â¤Â¿Ã Â¤Â¹Ã Â¤Â¿._Ã Â¤Â¶Ã Â¥ÂÃ Â¤â€¢Ã Â¥ÂÃ Â¤Â°._Ã Â¤Â¶Ã Â¤Â¨Ã Â¤Â¿.'.split('_'),
        weekdaysMin : 'Ã Â¤â€ Ã Â¤â€¡._Ã Â¤Â¸Ã Â¥â€¹._Ã Â¤Â®Ã Â¤â„¢Ã Â¥Â_Ã Â¤Â¬Ã Â¥Â._Ã Â¤Â¬Ã Â¤Â¿._Ã Â¤Â¶Ã Â¥Â._Ã Â¤Â¶.'.split('_'),
        longDateFormat : {
            LT : 'AÃ Â¤â€¢Ã Â¥â€¹ h:mm Ã Â¤Â¬Ã Â¤Å“Ã Â¥â€¡',
            LTS : 'AÃ Â¤â€¢Ã Â¥â€¹ h:mm:ss Ã Â¤Â¬Ã Â¤Å“Ã Â¥â€¡',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        preparse: function (string) {
            return string.replace(/[Ã Â¥Â§Ã Â¥Â¨Ã Â¥Â©Ã Â¥ÂªÃ Â¥Â«Ã Â¥Â¬Ã Â¥Â­Ã Â¥Â®Ã Â¥Â¯Ã Â¥Â¦]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤Ã Â¥â‚¬|Ã Â¤Â¬Ã Â¤Â¿Ã Â¤Â¹Ã Â¤Â¾Ã Â¤Â¨|Ã Â¤Â¦Ã Â¤Â¿Ã Â¤â€°Ã Â¤ÂÃ Â¤Â¸Ã Â¥â€¹|Ã Â¤Â¬Ã Â¥â€¡Ã Â¤Â²Ã Â¥ÂÃ Â¤â€¢Ã Â¤Â¾|Ã Â¤Â¸Ã Â¤Â¾Ã Â¤ÂÃ Â¤Â|Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤Ã Â¥â‚¬/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤Ã Â¥â‚¬') {
                return hour < 3 ? hour : hour + 12;
            } else if (meridiem === 'Ã Â¤Â¬Ã Â¤Â¿Ã Â¤Â¹Ã Â¤Â¾Ã Â¤Â¨') {
                return hour;
            } else if (meridiem === 'Ã Â¤Â¦Ã Â¤Â¿Ã Â¤â€°Ã Â¤ÂÃ Â¤Â¸Ã Â¥â€¹') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === 'Ã Â¤Â¬Ã Â¥â€¡Ã Â¤Â²Ã Â¥ÂÃ Â¤â€¢Ã Â¤Â¾' || meridiem === 'Ã Â¤Â¸Ã Â¤Â¾Ã Â¤ÂÃ Â¤Â') {
                return hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 3) {
                return 'Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤Ã Â¥â‚¬';
            } else if (hour < 10) {
                return 'Ã Â¤Â¬Ã Â¤Â¿Ã Â¤Â¹Ã Â¤Â¾Ã Â¤Â¨';
            } else if (hour < 15) {
                return 'Ã Â¤Â¦Ã Â¤Â¿Ã Â¤â€°Ã Â¤ÂÃ Â¤Â¸Ã Â¥â€¹';
            } else if (hour < 18) {
                return 'Ã Â¤Â¬Ã Â¥â€¡Ã Â¤Â²Ã Â¥ÂÃ Â¤â€¢Ã Â¤Â¾';
            } else if (hour < 20) {
                return 'Ã Â¤Â¸Ã Â¤Â¾Ã Â¤ÂÃ Â¤Â';
            } else {
                return 'Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¤Ã Â¥â‚¬';
            }
        },
        calendar : {
            sameDay : '[Ã Â¤â€ Ã Â¤Å“] LT',
            nextDay : '[Ã Â¤Â­Ã Â¥â€¹Ã Â¤Â²Ã Â¥â‚¬] LT',
            nextWeek : '[Ã Â¤â€ Ã Â¤â€°Ã Â¤ÂÃ Â¤Â¦Ã Â¥â€¹] dddd[,] LT',
            lastDay : '[Ã Â¤Â¹Ã Â¤Â¿Ã Â¤Å“Ã Â¥â€¹] LT',
            lastWeek : '[Ã Â¤â€”Ã Â¤ÂÃ Â¤â€¢Ã Â¥â€¹] dddd[,] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%sÃ Â¤Â®Ã Â¤Â¾',
            past : '%s Ã Â¤â€¦Ã Â¤â€”Ã Â¤Â¾Ã Â¤Â¡Ã Â¥â‚¬',
            s : 'Ã Â¤â€¢Ã Â¥â€¡Ã Â¤Â¹Ã Â¥â‚¬ Ã Â¤Â¸Ã Â¤Â®Ã Â¤Â¯',
            m : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤Â®Ã Â¤Â¿Ã Â¤Â¨Ã Â¥â€¡Ã Â¤Å¸',
            mm : '%d Ã Â¤Â®Ã Â¤Â¿Ã Â¤Â¨Ã Â¥â€¡Ã Â¤Å¸',
            h : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤ËœÃ Â¤Â£Ã Â¥ÂÃ Â¤Å¸Ã Â¤Â¾',
            hh : '%d Ã Â¤ËœÃ Â¤Â£Ã Â¥ÂÃ Â¤Å¸Ã Â¤Â¾',
            d : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â¨',
            dd : '%d Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â¨',
            M : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤Â®Ã Â¤Â¹Ã Â¤Â¿Ã Â¤Â¨Ã Â¤Â¾',
            MM : '%d Ã Â¤Â®Ã Â¤Â¹Ã Â¤Â¿Ã Â¤Â¨Ã Â¤Â¾',
            y : 'Ã Â¤ÂÃ Â¤â€¢ Ã Â¤Â¬Ã Â¤Â°Ã Â¥ÂÃ Â¤Â·',
            yy : '%d Ã Â¤Â¬Ã Â¤Â°Ã Â¥ÂÃ Â¤Â·'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : dutch (nl)
// author : Joris RÃƒÂ¶ling : https://github.com/jjupiter

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsShortWithDots = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split('_'),
        monthsShortWithoutDots = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split('_');

    return moment.defineLocale('nl', {
        months : 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split('_'),
        monthsShort : function (m, format) {
            if (/-MMM-/.test(format)) {
                return monthsShortWithoutDots[m.month()];
            } else {
                return monthsShortWithDots[m.month()];
            }
        },
        weekdays : 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split('_'),
        weekdaysShort : 'zo._ma._di._wo._do._vr._za.'.split('_'),
        weekdaysMin : 'Zo_Ma_Di_Wo_Do_Vr_Za'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD-MM-YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[vandaag om] LT',
            nextDay: '[morgen om] LT',
            nextWeek: 'dddd [om] LT',
            lastDay: '[gisteren om] LT',
            lastWeek: '[afgelopen] dddd [om] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'over %s',
            past : '%s geleden',
            s : 'een paar seconden',
            m : 'ÃƒÂ©ÃƒÂ©n minuut',
            mm : '%d minuten',
            h : 'ÃƒÂ©ÃƒÂ©n uur',
            hh : '%d uur',
            d : 'ÃƒÂ©ÃƒÂ©n dag',
            dd : '%d dagen',
            M : 'ÃƒÂ©ÃƒÂ©n maand',
            MM : '%d maanden',
            y : 'ÃƒÂ©ÃƒÂ©n jaar',
            yy : '%d jaar'
        },
        ordinalParse: /\d{1,2}(ste|de)/,
        ordinal : function (number) {
            return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : norwegian nynorsk (nn)
// author : https://github.com/mechuwind

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('nn', {
        months : 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
        weekdays : 'sundag_mÃƒÂ¥ndag_tysdag_onsdag_torsdag_fredag_laurdag'.split('_'),
        weekdaysShort : 'sun_mÃƒÂ¥n_tys_ons_tor_fre_lau'.split('_'),
        weekdaysMin : 'su_mÃƒÂ¥_ty_on_to_fr_lÃƒÂ¸'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[I dag klokka] LT',
            nextDay: '[I morgon klokka] LT',
            nextWeek: 'dddd [klokka] LT',
            lastDay: '[I gÃƒÂ¥r klokka] LT',
            lastWeek: '[FÃƒÂ¸regÃƒÂ¥ande] dddd [klokka] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : 'for %s sidan',
            s : 'nokre sekund',
            m : 'eit minutt',
            mm : '%d minutt',
            h : 'ein time',
            hh : '%d timar',
            d : 'ein dag',
            dd : '%d dagar',
            M : 'ein mÃƒÂ¥nad',
            MM : '%d mÃƒÂ¥nader',
            y : 'eit ÃƒÂ¥r',
            yy : '%d ÃƒÂ¥r'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : polish (pl)
// author : Rafal Hirsz : https://github.com/evoL

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsNominative = 'styczeÃ…â€ž_luty_marzec_kwiecieÃ…â€ž_maj_czerwiec_lipiec_sierpieÃ…â€ž_wrzesieÃ…â€ž_paÃ…Âºdziernik_listopad_grudzieÃ…â€ž'.split('_'),
        monthsSubjective = 'stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_wrzeÃ…â€ºnia_paÃ…Âºdziernika_listopada_grudnia'.split('_');

    function plural(n) {
        return (n % 10 < 5) && (n % 10 > 1) && ((~~(n / 10) % 10) !== 1);
    }

    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'minuta' : 'minutÃ„â„¢';
        case 'mm':
            return result + (plural(number) ? 'minuty' : 'minut');
        case 'h':
            return withoutSuffix  ? 'godzina'  : 'godzinÃ„â„¢';
        case 'hh':
            return result + (plural(number) ? 'godziny' : 'godzin');
        case 'MM':
            return result + (plural(number) ? 'miesiÃ„â€¦ce' : 'miesiÃ„â„¢cy');
        case 'yy':
            return result + (plural(number) ? 'lata' : 'lat');
        }
    }

    return moment.defineLocale('pl', {
        months : function (momentToFormat, format) {
            if (/D MMMM/.test(format)) {
                return monthsSubjective[momentToFormat.month()];
            } else {
                return monthsNominative[momentToFormat.month()];
            }
        },
        monthsShort : 'sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paÃ…Âº_lis_gru'.split('_'),
        weekdays : 'niedziela_poniedziaÃ…â€šek_wtorek_Ã…â€ºroda_czwartek_piÃ„â€¦tek_sobota'.split('_'),
        weekdaysShort : 'nie_pon_wt_Ã…â€ºr_czw_pt_sb'.split('_'),
        weekdaysMin : 'N_Pn_Wt_Ã…Å¡r_Cz_Pt_So'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[DziÃ…â€º o] LT',
            nextDay: '[Jutro o] LT',
            nextWeek: '[W] dddd [o] LT',
            lastDay: '[Wczoraj o] LT',
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[W zeszÃ…â€šÃ„â€¦ niedzielÃ„â„¢ o] LT';
                case 3:
                    return '[W zeszÃ…â€šÃ„â€¦ Ã…â€ºrodÃ„â„¢ o] LT';
                case 6:
                    return '[W zeszÃ…â€šÃ„â€¦ sobotÃ„â„¢ o] LT';
                default:
                    return '[W zeszÃ…â€šy] dddd [o] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'za %s',
            past : '%s temu',
            s : 'kilka sekund',
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : '1 dzieÃ…â€ž',
            dd : '%d dni',
            M : 'miesiÃ„â€¦c',
            MM : translate,
            y : 'rok',
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : brazilian portuguese (pt-br)
// author : Caio Ribeiro Pereira : https://github.com/caio-ribeiro-pereira

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('pt-br', {
        months : 'janeiro_fevereiro_marÃƒÂ§o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split('_'),
        monthsShort : 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
        weekdays : 'domingo_segunda-feira_terÃƒÂ§a-feira_quarta-feira_quinta-feira_sexta-feira_sÃƒÂ¡bado'.split('_'),
        weekdaysShort : 'dom_seg_ter_qua_qui_sex_sÃƒÂ¡b'.split('_'),
        weekdaysMin : 'dom_2Ã‚Âª_3Ã‚Âª_4Ã‚Âª_5Ã‚Âª_6Ã‚Âª_sÃƒÂ¡b'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [de] MMMM [de] YYYY',
            LLL : 'D [de] MMMM [de] YYYY [Ãƒ s] LT',
            LLLL : 'dddd, D [de] MMMM [de] YYYY [Ãƒ s] LT'
        },
        calendar : {
            sameDay: '[Hoje Ãƒ s] LT',
            nextDay: '[AmanhÃƒÂ£ Ãƒ s] LT',
            nextWeek: 'dddd [Ãƒ s] LT',
            lastDay: '[Ontem Ãƒ s] LT',
            lastWeek: function () {
                return (this.day() === 0 || this.day() === 6) ?
                    '[ÃƒÅ¡ltimo] dddd [Ãƒ s] LT' : // Saturday + Sunday
                    '[ÃƒÅ¡ltima] dddd [Ãƒ s] LT'; // Monday - Friday
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'em %s',
            past : '%s atrÃƒÂ¡s',
            s : 'segundos',
            m : 'um minuto',
            mm : '%d minutos',
            h : 'uma hora',
            hh : '%d horas',
            d : 'um dia',
            dd : '%d dias',
            M : 'um mÃƒÂªs',
            MM : '%d meses',
            y : 'um ano',
            yy : '%d anos'
        },
        ordinalParse: /\d{1,2}Ã‚Âº/,
        ordinal : '%dÃ‚Âº'
    });
}));
// moment.js locale configuration
// locale : portuguese (pt)
// author : Jefferson : https://github.com/jalex79

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('pt', {
        months : 'janeiro_fevereiro_marÃƒÂ§o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split('_'),
        monthsShort : 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
        weekdays : 'domingo_segunda-feira_terÃƒÂ§a-feira_quarta-feira_quinta-feira_sexta-feira_sÃƒÂ¡bado'.split('_'),
        weekdaysShort : 'dom_seg_ter_qua_qui_sex_sÃƒÂ¡b'.split('_'),
        weekdaysMin : 'dom_2Ã‚Âª_3Ã‚Âª_4Ã‚Âª_5Ã‚Âª_6Ã‚Âª_sÃƒÂ¡b'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [de] MMMM [de] YYYY',
            LLL : 'D [de] MMMM [de] YYYY LT',
            LLLL : 'dddd, D [de] MMMM [de] YYYY LT'
        },
        calendar : {
            sameDay: '[Hoje Ãƒ s] LT',
            nextDay: '[AmanhÃƒÂ£ Ãƒ s] LT',
            nextWeek: 'dddd [Ãƒ s] LT',
            lastDay: '[Ontem Ãƒ s] LT',
            lastWeek: function () {
                return (this.day() === 0 || this.day() === 6) ?
                    '[ÃƒÅ¡ltimo] dddd [Ãƒ s] LT' : // Saturday + Sunday
                    '[ÃƒÅ¡ltima] dddd [Ãƒ s] LT'; // Monday - Friday
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'em %s',
            past : 'hÃƒÂ¡ %s',
            s : 'segundos',
            m : 'um minuto',
            mm : '%d minutos',
            h : 'uma hora',
            hh : '%d horas',
            d : 'um dia',
            dd : '%d dias',
            M : 'um mÃƒÂªs',
            MM : '%d meses',
            y : 'um ano',
            yy : '%d anos'
        },
        ordinalParse: /\d{1,2}Ã‚Âº/,
        ordinal : '%dÃ‚Âº',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : romanian (ro)
// author : Vlad Gurdiga : https://github.com/gurdiga
// author : Valentin Agachi : https://github.com/avaly

(function (factory) {
    factory(moment);
}(function (moment) {
    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
                'mm': 'minute',
                'hh': 'ore',
                'dd': 'zile',
                'MM': 'luni',
                'yy': 'ani'
            },
            separator = ' ';
        if (number % 100 >= 20 || (number >= 100 && number % 100 === 0)) {
            separator = ' de ';
        }

        return number + separator + format[key];
    }

    return moment.defineLocale('ro', {
        months : 'ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie'.split('_'),
        monthsShort : 'ian._febr._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.'.split('_'),
        weekdays : 'duminicÃ„Æ’_luni_marÃˆâ€ºi_miercuri_joi_vineri_sÃƒÂ¢mbÃ„Æ’tÃ„Æ’'.split('_'),
        weekdaysShort : 'Dum_Lun_Mar_Mie_Joi_Vin_SÃƒÂ¢m'.split('_'),
        weekdaysMin : 'Du_Lu_Ma_Mi_Jo_Vi_SÃƒÂ¢'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY H:mm',
            LLLL : 'dddd, D MMMM YYYY H:mm'
        },
        calendar : {
            sameDay: '[azi la] LT',
            nextDay: '[mÃƒÂ¢ine la] LT',
            nextWeek: 'dddd [la] LT',
            lastDay: '[ieri la] LT',
            lastWeek: '[fosta] dddd [la] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'peste %s',
            past : '%s ÃƒÂ®n urmÃ„Æ’',
            s : 'cÃƒÂ¢teva secunde',
            m : 'un minut',
            mm : relativeTimeWithPlural,
            h : 'o orÃ„Æ’',
            hh : relativeTimeWithPlural,
            d : 'o zi',
            dd : relativeTimeWithPlural,
            M : 'o lunÃ„Æ’',
            MM : relativeTimeWithPlural,
            y : 'un an',
            yy : relativeTimeWithPlural
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : russian (ru)
// author : Viktorminator : https://github.com/Viktorminator
// Author : Menelion ElensÃƒÂºle : https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            'mm': withoutSuffix ? 'ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃÂ°_ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃ‘â€¹_ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€š' : 'ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃ‘Æ’_ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃ‘â€¹_ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€š',
            'hh': 'Ã‘â€¡ÃÂ°Ã‘Â_Ã‘â€¡ÃÂ°Ã‘ÂÃÂ°_Ã‘â€¡ÃÂ°Ã‘ÂÃÂ¾ÃÂ²',
            'dd': 'ÃÂ´ÃÂµÃÂ½Ã‘Å’_ÃÂ´ÃÂ½Ã‘Â_ÃÂ´ÃÂ½ÃÂµÃÂ¹',
            'MM': 'ÃÂ¼ÃÂµÃ‘ÂÃ‘ÂÃ‘â€ _ÃÂ¼ÃÂµÃ‘ÂÃ‘ÂÃ‘â€ ÃÂ°_ÃÂ¼ÃÂµÃ‘ÂÃ‘ÂÃ‘â€ ÃÂµÃÂ²',
            'yy': 'ÃÂ³ÃÂ¾ÃÂ´_ÃÂ³ÃÂ¾ÃÂ´ÃÂ°_ÃÂ»ÃÂµÃ‘â€š'
        };
        if (key === 'm') {
            return withoutSuffix ? 'ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃÂ°' : 'ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃ‘Æ’';
        }
        else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'Ã‘ÂÃÂ½ÃÂ²ÃÂ°Ã‘â‚¬Ã‘Å’_Ã‘â€žÃÂµÃÂ²Ã‘â‚¬ÃÂ°ÃÂ»Ã‘Å’_ÃÂ¼ÃÂ°Ã‘â‚¬Ã‘â€š_ÃÂ°ÃÂ¿Ã‘â‚¬ÃÂµÃÂ»Ã‘Å’_ÃÂ¼ÃÂ°ÃÂ¹_ÃÂ¸Ã‘Å½ÃÂ½Ã‘Å’_ÃÂ¸Ã‘Å½ÃÂ»Ã‘Å’_ÃÂ°ÃÂ²ÃÂ³Ã‘Æ’Ã‘ÂÃ‘â€š_Ã‘ÂÃÂµÃÂ½Ã‘â€šÃ‘ÂÃÂ±Ã‘â‚¬Ã‘Å’_ÃÂ¾ÃÂºÃ‘â€šÃ‘ÂÃÂ±Ã‘â‚¬Ã‘Å’_ÃÂ½ÃÂ¾Ã‘ÂÃÂ±Ã‘â‚¬Ã‘Å’_ÃÂ´ÃÂµÃÂºÃÂ°ÃÂ±Ã‘â‚¬Ã‘Å’'.split('_'),
            'accusative': 'Ã‘ÂÃÂ½ÃÂ²ÃÂ°Ã‘â‚¬Ã‘Â_Ã‘â€žÃÂµÃÂ²Ã‘â‚¬ÃÂ°ÃÂ»Ã‘Â_ÃÂ¼ÃÂ°Ã‘â‚¬Ã‘â€šÃÂ°_ÃÂ°ÃÂ¿Ã‘â‚¬ÃÂµÃÂ»Ã‘Â_ÃÂ¼ÃÂ°Ã‘Â_ÃÂ¸Ã‘Å½ÃÂ½Ã‘Â_ÃÂ¸Ã‘Å½ÃÂ»Ã‘Â_ÃÂ°ÃÂ²ÃÂ³Ã‘Æ’Ã‘ÂÃ‘â€šÃÂ°_Ã‘ÂÃÂµÃÂ½Ã‘â€šÃ‘ÂÃÂ±Ã‘â‚¬Ã‘Â_ÃÂ¾ÃÂºÃ‘â€šÃ‘ÂÃÂ±Ã‘â‚¬Ã‘Â_ÃÂ½ÃÂ¾Ã‘ÂÃÂ±Ã‘â‚¬Ã‘Â_ÃÂ´ÃÂµÃÂºÃÂ°ÃÂ±Ã‘â‚¬Ã‘Â'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function monthsShortCaseReplace(m, format) {
        var monthsShort = {
            'nominative': 'Ã‘ÂÃÂ½ÃÂ²_Ã‘â€žÃÂµÃÂ²_ÃÂ¼ÃÂ°Ã‘â‚¬Ã‘â€š_ÃÂ°ÃÂ¿Ã‘â‚¬_ÃÂ¼ÃÂ°ÃÂ¹_ÃÂ¸Ã‘Å½ÃÂ½Ã‘Å’_ÃÂ¸Ã‘Å½ÃÂ»Ã‘Å’_ÃÂ°ÃÂ²ÃÂ³_Ã‘ÂÃÂµÃÂ½_ÃÂ¾ÃÂºÃ‘â€š_ÃÂ½ÃÂ¾Ã‘Â_ÃÂ´ÃÂµÃÂº'.split('_'),
            'accusative': 'Ã‘ÂÃÂ½ÃÂ²_Ã‘â€žÃÂµÃÂ²_ÃÂ¼ÃÂ°Ã‘â‚¬_ÃÂ°ÃÂ¿Ã‘â‚¬_ÃÂ¼ÃÂ°Ã‘Â_ÃÂ¸Ã‘Å½ÃÂ½Ã‘Â_ÃÂ¸Ã‘Å½ÃÂ»Ã‘Â_ÃÂ°ÃÂ²ÃÂ³_Ã‘ÂÃÂµÃÂ½_ÃÂ¾ÃÂºÃ‘â€š_ÃÂ½ÃÂ¾Ã‘Â_ÃÂ´ÃÂµÃÂº'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return monthsShort[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'ÃÂ²ÃÂ¾Ã‘ÂÃÂºÃ‘â‚¬ÃÂµÃ‘ÂÃÂµÃÂ½Ã‘Å’ÃÂµ_ÃÂ¿ÃÂ¾ÃÂ½ÃÂµÃÂ´ÃÂµÃÂ»Ã‘Å’ÃÂ½ÃÂ¸ÃÂº_ÃÂ²Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ½ÃÂ¸ÃÂº_Ã‘ÂÃ‘â‚¬ÃÂµÃÂ´ÃÂ°_Ã‘â€¡ÃÂµÃ‘â€šÃÂ²ÃÂµÃ‘â‚¬ÃÂ³_ÃÂ¿Ã‘ÂÃ‘â€šÃÂ½ÃÂ¸Ã‘â€ ÃÂ°_Ã‘ÂÃ‘Æ’ÃÂ±ÃÂ±ÃÂ¾Ã‘â€šÃÂ°'.split('_'),
            'accusative': 'ÃÂ²ÃÂ¾Ã‘ÂÃÂºÃ‘â‚¬ÃÂµÃ‘ÂÃÂµÃÂ½Ã‘Å’ÃÂµ_ÃÂ¿ÃÂ¾ÃÂ½ÃÂµÃÂ´ÃÂµÃÂ»Ã‘Å’ÃÂ½ÃÂ¸ÃÂº_ÃÂ²Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ½ÃÂ¸ÃÂº_Ã‘ÂÃ‘â‚¬ÃÂµÃÂ´Ã‘Æ’_Ã‘â€¡ÃÂµÃ‘â€šÃÂ²ÃÂµÃ‘â‚¬ÃÂ³_ÃÂ¿Ã‘ÂÃ‘â€šÃÂ½ÃÂ¸Ã‘â€ Ã‘Æ’_Ã‘ÂÃ‘Æ’ÃÂ±ÃÂ±ÃÂ¾Ã‘â€šÃ‘Æ’'.split('_')
        },

        nounCase = (/\[ ?[Ãâ€™ÃÂ²] ?(?:ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘Ë†ÃÂ»Ã‘Æ’Ã‘Å½|Ã‘ÂÃÂ»ÃÂµÃÂ´Ã‘Æ’Ã‘Å½Ã‘â€°Ã‘Æ’Ã‘Å½|Ã‘ÂÃ‘â€šÃ‘Æ’)? ?\] ?dddd/).test(format) ?
            'accusative' :
            'nominative';

        return weekdays[nounCase][m.day()];
    }

    return moment.defineLocale('ru', {
        months : monthsCaseReplace,
        monthsShort : monthsShortCaseReplace,
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'ÃÂ²Ã‘Â_ÃÂ¿ÃÂ½_ÃÂ²Ã‘â€š_Ã‘ÂÃ‘â‚¬_Ã‘â€¡Ã‘â€š_ÃÂ¿Ã‘â€š_Ã‘ÂÃÂ±'.split('_'),
        weekdaysMin : 'ÃÂ²Ã‘Â_ÃÂ¿ÃÂ½_ÃÂ²Ã‘â€š_Ã‘ÂÃ‘â‚¬_Ã‘â€¡Ã‘â€š_ÃÂ¿Ã‘â€š_Ã‘ÂÃÂ±'.split('_'),
        monthsParse : [/^Ã‘ÂÃÂ½ÃÂ²/i, /^Ã‘â€žÃÂµÃÂ²/i, /^ÃÂ¼ÃÂ°Ã‘â‚¬/i, /^ÃÂ°ÃÂ¿Ã‘â‚¬/i, /^ÃÂ¼ÃÂ°[ÃÂ¹|Ã‘Â]/i, /^ÃÂ¸Ã‘Å½ÃÂ½/i, /^ÃÂ¸Ã‘Å½ÃÂ»/i, /^ÃÂ°ÃÂ²ÃÂ³/i, /^Ã‘ÂÃÂµÃÂ½/i, /^ÃÂ¾ÃÂºÃ‘â€š/i, /^ÃÂ½ÃÂ¾Ã‘Â/i, /^ÃÂ´ÃÂµÃÂº/i],
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY ÃÂ³.',
            LLL : 'D MMMM YYYY ÃÂ³., LT',
            LLLL : 'dddd, D MMMM YYYY ÃÂ³., LT'
        },
        calendar : {
            sameDay: '[ÃÂ¡ÃÂµÃÂ³ÃÂ¾ÃÂ´ÃÂ½Ã‘Â ÃÂ²] LT',
            nextDay: '[Ãâ€”ÃÂ°ÃÂ²Ã‘â€šÃ‘â‚¬ÃÂ° ÃÂ²] LT',
            lastDay: '[Ãâ€™Ã‘â€¡ÃÂµÃ‘â‚¬ÃÂ° ÃÂ²] LT',
            nextWeek: function () {
                return this.day() === 2 ? '[Ãâ€™ÃÂ¾] dddd [ÃÂ²] LT' : '[Ãâ€™] dddd [ÃÂ²] LT';
            },
            lastWeek: function (now) {
                if (now.week() !== this.week()) {
                    switch (this.day()) {
                    case 0:
                        return '[Ãâ€™ ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘Ë†ÃÂ»ÃÂ¾ÃÂµ] dddd [ÃÂ²] LT';
                    case 1:
                    case 2:
                    case 4:
                        return '[Ãâ€™ ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘Ë†ÃÂ»Ã‘â€¹ÃÂ¹] dddd [ÃÂ²] LT';
                    case 3:
                    case 5:
                    case 6:
                        return '[Ãâ€™ ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘Ë†ÃÂ»Ã‘Æ’Ã‘Å½] dddd [ÃÂ²] LT';
                    }
                } else {
                    if (this.day() === 2) {
                        return '[Ãâ€™ÃÂ¾] dddd [ÃÂ²] LT';
                    } else {
                        return '[Ãâ€™] dddd [ÃÂ²] LT';
                    }
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'Ã‘â€¡ÃÂµÃ‘â‚¬ÃÂµÃÂ· %s',
            past : '%s ÃÂ½ÃÂ°ÃÂ·ÃÂ°ÃÂ´',
            s : 'ÃÂ½ÃÂµÃ‘ÂÃÂºÃÂ¾ÃÂ»Ã‘Å’ÃÂºÃÂ¾ Ã‘ÂÃÂµÃÂºÃ‘Æ’ÃÂ½ÃÂ´',
            m : relativeTimeWithPlural,
            mm : relativeTimeWithPlural,
            h : 'Ã‘â€¡ÃÂ°Ã‘Â',
            hh : relativeTimeWithPlural,
            d : 'ÃÂ´ÃÂµÃÂ½Ã‘Å’',
            dd : relativeTimeWithPlural,
            M : 'ÃÂ¼ÃÂµÃ‘ÂÃ‘ÂÃ‘â€ ',
            MM : relativeTimeWithPlural,
            y : 'ÃÂ³ÃÂ¾ÃÂ´',
            yy : relativeTimeWithPlural
        },

        meridiemParse: /ÃÂ½ÃÂ¾Ã‘â€¡ÃÂ¸|Ã‘Æ’Ã‘â€šÃ‘â‚¬ÃÂ°|ÃÂ´ÃÂ½Ã‘Â|ÃÂ²ÃÂµÃ‘â€¡ÃÂµÃ‘â‚¬ÃÂ°/i,
        isPM : function (input) {
            return /^(ÃÂ´ÃÂ½Ã‘Â|ÃÂ²ÃÂµÃ‘â€¡ÃÂµÃ‘â‚¬ÃÂ°)$/.test(input);
        },

        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'ÃÂ½ÃÂ¾Ã‘â€¡ÃÂ¸';
            } else if (hour < 12) {
                return 'Ã‘Æ’Ã‘â€šÃ‘â‚¬ÃÂ°';
            } else if (hour < 17) {
                return 'ÃÂ´ÃÂ½Ã‘Â';
            } else {
                return 'ÃÂ²ÃÂµÃ‘â€¡ÃÂµÃ‘â‚¬ÃÂ°';
            }
        },

        ordinalParse: /\d{1,2}-(ÃÂ¹|ÃÂ³ÃÂ¾|Ã‘Â)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
                return number + '-ÃÂ¹';
            case 'D':
                return number + '-ÃÂ³ÃÂ¾';
            case 'w':
            case 'W':
                return number + '-Ã‘Â';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : slovak (sk)
// author : Martin Minka : https://github.com/k2s
// based on work of petrbela : https://github.com/petrbela

(function (factory) {
    factory(moment);
}(function (moment) {
    var months = 'januÃƒÂ¡r_februÃƒÂ¡r_marec_aprÃƒÂ­l_mÃƒÂ¡j_jÃƒÂºn_jÃƒÂºl_august_september_oktÃƒÂ³ber_november_december'.split('_'),
        monthsShort = 'jan_feb_mar_apr_mÃƒÂ¡j_jÃƒÂºn_jÃƒÂºl_aug_sep_okt_nov_dec'.split('_');

    function plural(n) {
        return (n > 1) && (n < 5);
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
        case 's':  // a few seconds / in a few seconds / a few seconds ago
            return (withoutSuffix || isFuture) ? 'pÃƒÂ¡r sekÃƒÂºnd' : 'pÃƒÂ¡r sekundami';
        case 'm':  // a minute / in a minute / a minute ago
            return withoutSuffix ? 'minÃƒÂºta' : (isFuture ? 'minÃƒÂºtu' : 'minÃƒÂºtou');
        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'minÃƒÂºty' : 'minÃƒÂºt');
            } else {
                return result + 'minÃƒÂºtami';
            }
            break;
        case 'h':  // an hour / in an hour / an hour ago
            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
        case 'hh': // 9 hours / in 9 hours / 9 hours ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'hodiny' : 'hodÃƒÂ­n');
            } else {
                return result + 'hodinami';
            }
            break;
        case 'd':  // a day / in a day / a day ago
            return (withoutSuffix || isFuture) ? 'deÃ…Ë†' : 'dÃ…Ë†om';
        case 'dd': // 9 days / in 9 days / 9 days ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'dni' : 'dnÃƒÂ­');
            } else {
                return result + 'dÃ…Ë†ami';
            }
            break;
        case 'M':  // a month / in a month / a month ago
            return (withoutSuffix || isFuture) ? 'mesiac' : 'mesiacom';
        case 'MM': // 9 months / in 9 months / 9 months ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'mesiace' : 'mesiacov');

            } else {
                return result + 'mesiacmi';
            }
            break;
        case 'y':  // a year / in a year / a year ago
            return (withoutSuffix || isFuture) ? 'rok' : 'rokom';
        case 'yy': // 9 years / in 9 years / 9 years ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'roky' : 'rokov');
            } else {
                return result + 'rokmi';
            }
            break;
        }
    }

    return moment.defineLocale('sk', {
        months : months,
        monthsShort : monthsShort,
        monthsParse : (function (months, monthsShort) {
            var i, _monthsParse = [];
            for (i = 0; i < 12; i++) {
                // use custom parser to solve problem with July (Ã„Âervenec)
                _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
            }
            return _monthsParse;
        }(months, monthsShort)),
        weekdays : 'nedeÃ„Â¾a_pondelok_utorok_streda_Ã…Â¡tvrtok_piatok_sobota'.split('_'),
        weekdaysShort : 'ne_po_ut_st_Ã…Â¡t_pi_so'.split('_'),
        weekdaysMin : 'ne_po_ut_st_Ã…Â¡t_pi_so'.split('_'),
        longDateFormat : {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[dnes o] LT',
            nextDay: '[zajtra o] LT',
            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[v nedeÃ„Â¾u o] LT';
                case 1:
                case 2:
                    return '[v] dddd [o] LT';
                case 3:
                    return '[v stredu o] LT';
                case 4:
                    return '[vo Ã…Â¡tvrtok o] LT';
                case 5:
                    return '[v piatok o] LT';
                case 6:
                    return '[v sobotu o] LT';
                }
            },
            lastDay: '[vÃ„Âera o] LT',
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[minulÃƒÂº nedeÃ„Â¾u o] LT';
                case 1:
                case 2:
                    return '[minulÃƒÂ½] dddd [o] LT';
                case 3:
                    return '[minulÃƒÂº stredu o] LT';
                case 4:
                case 5:
                    return '[minulÃƒÂ½] dddd [o] LT';
                case 6:
                    return '[minulÃƒÂº sobotu o] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'za %s',
            past : 'pred %s',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : slovenian (sl)
// author : Robert SedovÃ…Â¡ek : https://github.com/sedovsek

(function (factory) {
    factory(moment);
}(function (moment) {
    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'ena minuta' : 'eno minuto';
        case 'mm':
            if (number === 1) {
                result += 'minuta';
            } else if (number === 2) {
                result += 'minuti';
            } else if (number === 3 || number === 4) {
                result += 'minute';
            } else {
                result += 'minut';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'ena ura' : 'eno uro';
        case 'hh':
            if (number === 1) {
                result += 'ura';
            } else if (number === 2) {
                result += 'uri';
            } else if (number === 3 || number === 4) {
                result += 'ure';
            } else {
                result += 'ur';
            }
            return result;
        case 'dd':
            if (number === 1) {
                result += 'dan';
            } else {
                result += 'dni';
            }
            return result;
        case 'MM':
            if (number === 1) {
                result += 'mesec';
            } else if (number === 2) {
                result += 'meseca';
            } else if (number === 3 || number === 4) {
                result += 'mesece';
            } else {
                result += 'mesecev';
            }
            return result;
        case 'yy':
            if (number === 1) {
                result += 'leto';
            } else if (number === 2) {
                result += 'leti';
            } else if (number === 3 || number === 4) {
                result += 'leta';
            } else {
                result += 'let';
            }
            return result;
        }
    }

    return moment.defineLocale('sl', {
        months : 'januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december'.split('_'),
        monthsShort : 'jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.'.split('_'),
        weekdays : 'nedelja_ponedeljek_torek_sreda_Ã„Âetrtek_petek_sobota'.split('_'),
        weekdaysShort : 'ned._pon._tor._sre._Ã„Âet._pet._sob.'.split('_'),
        weekdaysMin : 'ne_po_to_sr_Ã„Âe_pe_so'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD. MM. YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[danes ob] LT',
            nextDay  : '[jutri ob] LT',

            nextWeek : function () {
                switch (this.day()) {
                case 0:
                    return '[v] [nedeljo] [ob] LT';
                case 3:
                    return '[v] [sredo] [ob] LT';
                case 6:
                    return '[v] [soboto] [ob] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[v] dddd [ob] LT';
                }
            },
            lastDay  : '[vÃ„Âeraj ob] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[prejÃ…Â¡nja] dddd [ob] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[prejÃ…Â¡nji] dddd [ob] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'Ã„Âez %s',
            past   : '%s nazaj',
            s      : 'nekaj sekund',
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : 'en dan',
            dd     : translate,
            M      : 'en mesec',
            MM     : translate,
            y      : 'eno leto',
            yy     : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Albanian (sq)
// author : FlakÃƒÂ«rim Ismani : https://github.com/flakerimi
// author: Menelion ElensÃƒÂºle: https://github.com/Oire (tests)
// author : Oerd Cukalla : https://github.com/oerd (fixes)

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('sq', {
        months : 'Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_NÃƒÂ«ntor_Dhjetor'.split('_'),
        monthsShort : 'Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_NÃƒÂ«n_Dhj'.split('_'),
        weekdays : 'E Diel_E HÃƒÂ«nÃƒÂ«_E MartÃƒÂ«_E MÃƒÂ«rkurÃƒÂ«_E Enjte_E Premte_E ShtunÃƒÂ«'.split('_'),
        weekdaysShort : 'Die_HÃƒÂ«n_Mar_MÃƒÂ«r_Enj_Pre_Sht'.split('_'),
        weekdaysMin : 'D_H_Ma_MÃƒÂ«_E_P_Sh'.split('_'),
        meridiemParse: /PD|MD/,
        isPM: function (input) {
            return input.charAt(0) === 'M';
        },
        meridiem : function (hours, minutes, isLower) {
            return hours < 12 ? 'PD' : 'MD';
        },
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Sot nÃƒÂ«] LT',
            nextDay : '[NesÃƒÂ«r nÃƒÂ«] LT',
            nextWeek : 'dddd [nÃƒÂ«] LT',
            lastDay : '[Dje nÃƒÂ«] LT',
            lastWeek : 'dddd [e kaluar nÃƒÂ«] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'nÃƒÂ« %s',
            past : '%s mÃƒÂ« parÃƒÂ«',
            s : 'disa sekonda',
            m : 'njÃƒÂ« minutÃƒÂ«',
            mm : '%d minuta',
            h : 'njÃƒÂ« orÃƒÂ«',
            hh : '%d orÃƒÂ«',
            d : 'njÃƒÂ« ditÃƒÂ«',
            dd : '%d ditÃƒÂ«',
            M : 'njÃƒÂ« muaj',
            MM : '%d muaj',
            y : 'njÃƒÂ« vit',
            yy : '%d vite'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Serbian-cyrillic (sr-cyrl)
// author : Milan JanaÃ„ÂkoviÃ„â€¡<milanjanackovic@gmail.com> : https://github.com/milan-j

(function (factory) {
    factory(moment);
}(function (moment) {
    var translator = {
        words: { //Different grammatical cases
            m: ['Ã‘ËœÃÂµÃÂ´ÃÂ°ÃÂ½ ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€š', 'Ã‘ËœÃÂµÃÂ´ÃÂ½ÃÂµ ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃÂµ'],
            mm: ['ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€š', 'ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃÂµ', 'ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’Ã‘â€šÃÂ°'],
            h: ['Ã‘ËœÃÂµÃÂ´ÃÂ°ÃÂ½ Ã‘ÂÃÂ°Ã‘â€š', 'Ã‘ËœÃÂµÃÂ´ÃÂ½ÃÂ¾ÃÂ³ Ã‘ÂÃÂ°Ã‘â€šÃÂ°'],
            hh: ['Ã‘ÂÃÂ°Ã‘â€š', 'Ã‘ÂÃÂ°Ã‘â€šÃÂ°', 'Ã‘ÂÃÂ°Ã‘â€šÃÂ¸'],
            dd: ['ÃÂ´ÃÂ°ÃÂ½', 'ÃÂ´ÃÂ°ÃÂ½ÃÂ°', 'ÃÂ´ÃÂ°ÃÂ½ÃÂ°'],
            MM: ['ÃÂ¼ÃÂµÃ‘ÂÃÂµÃ‘â€ ', 'ÃÂ¼ÃÂµÃ‘ÂÃÂµÃ‘â€ ÃÂ°', 'ÃÂ¼ÃÂµÃ‘ÂÃÂµÃ‘â€ ÃÂ¸'],
            yy: ['ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½ÃÂ°', 'ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½ÃÂµ', 'ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½ÃÂ°']
        },
        correctGrammaticalCase: function (number, wordKey) {
            return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
        },
        translate: function (number, withoutSuffix, key) {
            var wordKey = translator.words[key];
            if (key.length === 1) {
                return withoutSuffix ? wordKey[0] : wordKey[1];
            } else {
                return number + ' ' + translator.correctGrammaticalCase(number, wordKey);
            }
        }
    };

    return moment.defineLocale('sr-cyrl', {
        months: ['Ã‘ËœÃÂ°ÃÂ½Ã‘Æ’ÃÂ°Ã‘â‚¬', 'Ã‘â€žÃÂµÃÂ±Ã‘â‚¬Ã‘Æ’ÃÂ°Ã‘â‚¬', 'ÃÂ¼ÃÂ°Ã‘â‚¬Ã‘â€š', 'ÃÂ°ÃÂ¿Ã‘â‚¬ÃÂ¸ÃÂ»', 'ÃÂ¼ÃÂ°Ã‘Ëœ', 'Ã‘ËœÃ‘Æ’ÃÂ½', 'Ã‘ËœÃ‘Æ’ÃÂ»', 'ÃÂ°ÃÂ²ÃÂ³Ã‘Æ’Ã‘ÂÃ‘â€š', 'Ã‘ÂÃÂµÃÂ¿Ã‘â€šÃÂµÃÂ¼ÃÂ±ÃÂ°Ã‘â‚¬', 'ÃÂ¾ÃÂºÃ‘â€šÃÂ¾ÃÂ±ÃÂ°Ã‘â‚¬', 'ÃÂ½ÃÂ¾ÃÂ²ÃÂµÃÂ¼ÃÂ±ÃÂ°Ã‘â‚¬', 'ÃÂ´ÃÂµÃ‘â€ ÃÂµÃÂ¼ÃÂ±ÃÂ°Ã‘â‚¬'],
        monthsShort: ['Ã‘ËœÃÂ°ÃÂ½.', 'Ã‘â€žÃÂµÃÂ±.', 'ÃÂ¼ÃÂ°Ã‘â‚¬.', 'ÃÂ°ÃÂ¿Ã‘â‚¬.', 'ÃÂ¼ÃÂ°Ã‘Ëœ', 'Ã‘ËœÃ‘Æ’ÃÂ½', 'Ã‘ËœÃ‘Æ’ÃÂ»', 'ÃÂ°ÃÂ²ÃÂ³.', 'Ã‘ÂÃÂµÃÂ¿.', 'ÃÂ¾ÃÂºÃ‘â€š.', 'ÃÂ½ÃÂ¾ÃÂ².', 'ÃÂ´ÃÂµÃ‘â€ .'],
        weekdays: ['ÃÂ½ÃÂµÃÂ´ÃÂµÃ‘â„¢ÃÂ°', 'ÃÂ¿ÃÂ¾ÃÂ½ÃÂµÃÂ´ÃÂµÃ‘â„¢ÃÂ°ÃÂº', 'Ã‘Æ’Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ°ÃÂº', 'Ã‘ÂÃ‘â‚¬ÃÂµÃÂ´ÃÂ°', 'Ã‘â€¡ÃÂµÃ‘â€šÃÂ²Ã‘â‚¬Ã‘â€šÃÂ°ÃÂº', 'ÃÂ¿ÃÂµÃ‘â€šÃÂ°ÃÂº', 'Ã‘ÂÃ‘Æ’ÃÂ±ÃÂ¾Ã‘â€šÃÂ°'],
        weekdaysShort: ['ÃÂ½ÃÂµÃÂ´.', 'ÃÂ¿ÃÂ¾ÃÂ½.', 'Ã‘Æ’Ã‘â€šÃÂ¾.', 'Ã‘ÂÃ‘â‚¬ÃÂµ.', 'Ã‘â€¡ÃÂµÃ‘â€š.', 'ÃÂ¿ÃÂµÃ‘â€š.', 'Ã‘ÂÃ‘Æ’ÃÂ±.'],
        weekdaysMin: ['ÃÂ½ÃÂµ', 'ÃÂ¿ÃÂ¾', 'Ã‘Æ’Ã‘â€š', 'Ã‘ÂÃ‘â‚¬', 'Ã‘â€¡ÃÂµ', 'ÃÂ¿ÃÂµ', 'Ã‘ÂÃ‘Æ’'],
        longDateFormat: {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L: 'DD. MM. YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY LT',
            LLLL: 'dddd, D. MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[ÃÂ´ÃÂ°ÃÂ½ÃÂ°Ã‘Â Ã‘Æ’] LT',
            nextDay: '[Ã‘ÂÃ‘Æ’Ã‘â€šÃ‘â‚¬ÃÂ° Ã‘Æ’] LT',

            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[Ã‘Æ’] [ÃÂ½ÃÂµÃÂ´ÃÂµÃ‘â„¢Ã‘Æ’] [Ã‘Æ’] LT';
                case 3:
                    return '[Ã‘Æ’] [Ã‘ÂÃ‘â‚¬ÃÂµÃÂ´Ã‘Æ’] [Ã‘Æ’] LT';
                case 6:
                    return '[Ã‘Æ’] [Ã‘ÂÃ‘Æ’ÃÂ±ÃÂ¾Ã‘â€šÃ‘Æ’] [Ã‘Æ’] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[Ã‘Æ’] dddd [Ã‘Æ’] LT';
                }
            },
            lastDay  : '[Ã‘ËœÃ‘Æ’Ã‘â€¡ÃÂµ Ã‘Æ’] LT',
            lastWeek : function () {
                var lastWeekDays = [
                    '[ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘Ë†ÃÂ»ÃÂµ] [ÃÂ½ÃÂµÃÂ´ÃÂµÃ‘â„¢ÃÂµ] [Ã‘Æ’] LT',
                    '[ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘Ë†ÃÂ»ÃÂ¾ÃÂ³] [ÃÂ¿ÃÂ¾ÃÂ½ÃÂµÃÂ´ÃÂµÃ‘â„¢ÃÂºÃÂ°] [Ã‘Æ’] LT',
                    '[ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘Ë†ÃÂ»ÃÂ¾ÃÂ³] [Ã‘Æ’Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂºÃÂ°] [Ã‘Æ’] LT',
                    '[ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘Ë†ÃÂ»ÃÂµ] [Ã‘ÂÃ‘â‚¬ÃÂµÃÂ´ÃÂµ] [Ã‘Æ’] LT',
                    '[ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘Ë†ÃÂ»ÃÂ¾ÃÂ³] [Ã‘â€¡ÃÂµÃ‘â€šÃÂ²Ã‘â‚¬Ã‘â€šÃÂºÃÂ°] [Ã‘Æ’] LT',
                    '[ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘Ë†ÃÂ»ÃÂ¾ÃÂ³] [ÃÂ¿ÃÂµÃ‘â€šÃÂºÃÂ°] [Ã‘Æ’] LT',
                    '[ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘Ë†ÃÂ»ÃÂµ] [Ã‘ÂÃ‘Æ’ÃÂ±ÃÂ¾Ã‘â€šÃÂµ] [Ã‘Æ’] LT'
                ];
                return lastWeekDays[this.day()];
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'ÃÂ·ÃÂ° %s',
            past   : 'ÃÂ¿Ã‘â‚¬ÃÂµ %s',
            s      : 'ÃÂ½ÃÂµÃÂºÃÂ¾ÃÂ»ÃÂ¸ÃÂºÃÂ¾ Ã‘ÂÃÂµÃÂºÃ‘Æ’ÃÂ½ÃÂ´ÃÂ¸',
            m      : translator.translate,
            mm     : translator.translate,
            h      : translator.translate,
            hh     : translator.translate,
            d      : 'ÃÂ´ÃÂ°ÃÂ½',
            dd     : translator.translate,
            M      : 'ÃÂ¼ÃÂµÃ‘ÂÃÂµÃ‘â€ ',
            MM     : translator.translate,
            y      : 'ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½Ã‘Æ’',
            yy     : translator.translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Serbian-latin (sr)
// author : Milan JanaÃ„ÂkoviÃ„â€¡<milanjanackovic@gmail.com> : https://github.com/milan-j

(function (factory) {
    factory(moment);
}(function (moment) {
    var translator = {
        words: { //Different grammatical cases
            m: ['jedan minut', 'jedne minute'],
            mm: ['minut', 'minute', 'minuta'],
            h: ['jedan sat', 'jednog sata'],
            hh: ['sat', 'sata', 'sati'],
            dd: ['dan', 'dana', 'dana'],
            MM: ['mesec', 'meseca', 'meseci'],
            yy: ['godina', 'godine', 'godina']
        },
        correctGrammaticalCase: function (number, wordKey) {
            return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
        },
        translate: function (number, withoutSuffix, key) {
            var wordKey = translator.words[key];
            if (key.length === 1) {
                return withoutSuffix ? wordKey[0] : wordKey[1];
            } else {
                return number + ' ' + translator.correctGrammaticalCase(number, wordKey);
            }
        }
    };

    return moment.defineLocale('sr', {
        months: ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'],
        monthsShort: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun', 'jul', 'avg.', 'sep.', 'okt.', 'nov.', 'dec.'],
        weekdays: ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'Ã„Âetvrtak', 'petak', 'subota'],
        weekdaysShort: ['ned.', 'pon.', 'uto.', 'sre.', 'Ã„Âet.', 'pet.', 'sub.'],
        weekdaysMin: ['ne', 'po', 'ut', 'sr', 'Ã„Âe', 'pe', 'su'],
        longDateFormat: {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L: 'DD. MM. YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY LT',
            LLLL: 'dddd, D. MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[danas u] LT',
            nextDay: '[sutra u] LT',

            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[u] [nedelju] [u] LT';
                case 3:
                    return '[u] [sredu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juÃ„Âe u] LT',
            lastWeek : function () {
                var lastWeekDays = [
                    '[proÃ…Â¡le] [nedelje] [u] LT',
                    '[proÃ…Â¡log] [ponedeljka] [u] LT',
                    '[proÃ…Â¡log] [utorka] [u] LT',
                    '[proÃ…Â¡le] [srede] [u] LT',
                    '[proÃ…Â¡log] [Ã„Âetvrtka] [u] LT',
                    '[proÃ…Â¡log] [petka] [u] LT',
                    '[proÃ…Â¡le] [subote] [u] LT'
                ];
                return lastWeekDays[this.day()];
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'za %s',
            past   : 'pre %s',
            s      : 'nekoliko sekundi',
            m      : translator.translate,
            mm     : translator.translate,
            h      : translator.translate,
            hh     : translator.translate,
            d      : 'dan',
            dd     : translator.translate,
            M      : 'mesec',
            MM     : translator.translate,
            y      : 'godinu',
            yy     : translator.translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : swedish (sv)
// author : Jens Alm : https://github.com/ulmus

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('sv', {
        months : 'januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
        weekdays : 'sÃƒÂ¶ndag_mÃƒÂ¥ndag_tisdag_onsdag_torsdag_fredag_lÃƒÂ¶rdag'.split('_'),
        weekdaysShort : 'sÃƒÂ¶n_mÃƒÂ¥n_tis_ons_tor_fre_lÃƒÂ¶r'.split('_'),
        weekdaysMin : 'sÃƒÂ¶_mÃƒÂ¥_ti_on_to_fr_lÃƒÂ¶'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Idag] LT',
            nextDay: '[Imorgon] LT',
            lastDay: '[IgÃƒÂ¥r] LT',
            nextWeek: 'dddd LT',
            lastWeek: '[FÃƒÂ¶rra] dddd[en] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : 'fÃƒÂ¶r %s sedan',
            s : 'nÃƒÂ¥gra sekunder',
            m : 'en minut',
            mm : '%d minuter',
            h : 'en timme',
            hh : '%d timmar',
            d : 'en dag',
            dd : '%d dagar',
            M : 'en mÃƒÂ¥nad',
            MM : '%d mÃƒÂ¥nader',
            y : 'ett ÃƒÂ¥r',
            yy : '%d ÃƒÂ¥r'
        },
        ordinalParse: /\d{1,2}(e|a)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'e' :
                (b === 1) ? 'a' :
                (b === 2) ? 'a' :
                (b === 3) ? 'e' : 'e';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : tamil (ta)
// author : Arjunkumar Krishnamoorthy : https://github.com/tk120404

(function (factory) {
    factory(moment);
}(function (moment) {
    /*var symbolMap = {
            '1': 'Ã Â¯Â§',
            '2': 'Ã Â¯Â¨',
            '3': 'Ã Â¯Â©',
            '4': 'Ã Â¯Âª',
            '5': 'Ã Â¯Â«',
            '6': 'Ã Â¯Â¬',
            '7': 'Ã Â¯Â­',
            '8': 'Ã Â¯Â®',
            '9': 'Ã Â¯Â¯',
            '0': 'Ã Â¯Â¦'
        },
        numberMap = {
            'Ã Â¯Â§': '1',
            'Ã Â¯Â¨': '2',
            'Ã Â¯Â©': '3',
            'Ã Â¯Âª': '4',
            'Ã Â¯Â«': '5',
            'Ã Â¯Â¬': '6',
            'Ã Â¯Â­': '7',
            'Ã Â¯Â®': '8',
            'Ã Â¯Â¯': '9',
            'Ã Â¯Â¦': '0'
        }; */

    return moment.defineLocale('ta', {
        months : 'Ã Â®Å“Ã Â®Â©Ã Â®ÂµÃ Â®Â°Ã Â®Â¿_Ã Â®ÂªÃ Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®Â°Ã Â®ÂµÃ Â®Â°Ã Â®Â¿_Ã Â®Â®Ã Â®Â¾Ã Â®Â°Ã Â¯ÂÃ Â®Å¡Ã Â¯Â_Ã Â®ÂÃ Â®ÂªÃ Â¯ÂÃ Â®Â°Ã Â®Â²Ã Â¯Â_Ã Â®Â®Ã Â¯â€¡_Ã Â®Å“Ã Â¯â€šÃ Â®Â©Ã Â¯Â_Ã Â®Å“Ã Â¯â€šÃ Â®Â²Ã Â¯Ë†_Ã Â®â€ Ã Â®â€¢Ã Â®Â¸Ã Â¯ÂÃ Â®Å¸Ã Â¯Â_Ã Â®Å¡Ã Â¯â€ Ã Â®ÂªÃ Â¯ÂÃ Â®Å¸Ã Â¯â€ Ã Â®Â®Ã Â¯ÂÃ Â®ÂªÃ Â®Â°Ã Â¯Â_Ã Â®â€¦Ã Â®â€¢Ã Â¯ÂÃ Â®Å¸Ã Â¯â€¹Ã Â®ÂªÃ Â®Â°Ã Â¯Â_Ã Â®Â¨Ã Â®ÂµÃ Â®Â®Ã Â¯ÂÃ Â®ÂªÃ Â®Â°Ã Â¯Â_Ã Â®Å¸Ã Â®Â¿Ã Â®Å¡Ã Â®Â®Ã Â¯ÂÃ Â®ÂªÃ Â®Â°Ã Â¯Â'.split('_'),
        monthsShort : 'Ã Â®Å“Ã Â®Â©Ã Â®ÂµÃ Â®Â°Ã Â®Â¿_Ã Â®ÂªÃ Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®Â°Ã Â®ÂµÃ Â®Â°Ã Â®Â¿_Ã Â®Â®Ã Â®Â¾Ã Â®Â°Ã Â¯ÂÃ Â®Å¡Ã Â¯Â_Ã Â®ÂÃ Â®ÂªÃ Â¯ÂÃ Â®Â°Ã Â®Â²Ã Â¯Â_Ã Â®Â®Ã Â¯â€¡_Ã Â®Å“Ã Â¯â€šÃ Â®Â©Ã Â¯Â_Ã Â®Å“Ã Â¯â€šÃ Â®Â²Ã Â¯Ë†_Ã Â®â€ Ã Â®â€¢Ã Â®Â¸Ã Â¯ÂÃ Â®Å¸Ã Â¯Â_Ã Â®Å¡Ã Â¯â€ Ã Â®ÂªÃ Â¯ÂÃ Â®Å¸Ã Â¯â€ Ã Â®Â®Ã Â¯ÂÃ Â®ÂªÃ Â®Â°Ã Â¯Â_Ã Â®â€¦Ã Â®â€¢Ã Â¯ÂÃ Â®Å¸Ã Â¯â€¹Ã Â®ÂªÃ Â®Â°Ã Â¯Â_Ã Â®Â¨Ã Â®ÂµÃ Â®Â®Ã Â¯ÂÃ Â®ÂªÃ Â®Â°Ã Â¯Â_Ã Â®Å¸Ã Â®Â¿Ã Â®Å¡Ã Â®Â®Ã Â¯ÂÃ Â®ÂªÃ Â®Â°Ã Â¯Â'.split('_'),
        weekdays : 'Ã Â®Å¾Ã Â®Â¾Ã Â®Â¯Ã Â®Â¿Ã Â®Â±Ã Â¯ÂÃ Â®Â±Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â¿Ã Â®Â´Ã Â®Â®Ã Â¯Ë†_Ã Â®Â¤Ã Â®Â¿Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Å¸Ã Â¯ÂÃ Â®â€¢Ã Â®Â¿Ã Â®Â´Ã Â®Â®Ã Â¯Ë†_Ã Â®Å¡Ã Â¯â€ Ã Â®ÂµÃ Â¯ÂÃ Â®ÂµÃ Â®Â¾Ã Â®Â¯Ã Â¯ÂÃ Â®â€¢Ã Â®Â¿Ã Â®Â´Ã Â®Â®Ã Â¯Ë†_Ã Â®ÂªÃ Â¯ÂÃ Â®Â¤Ã Â®Â©Ã Â¯ÂÃ Â®â€¢Ã Â®Â¿Ã Â®Â´Ã Â®Â®Ã Â¯Ë†_Ã Â®ÂµÃ Â®Â¿Ã Â®Â¯Ã Â®Â¾Ã Â®Â´Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â¿Ã Â®Â´Ã Â®Â®Ã Â¯Ë†_Ã Â®ÂµÃ Â¯â€ Ã Â®Â³Ã Â¯ÂÃ Â®Â³Ã Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â¿Ã Â®Â´Ã Â®Â®Ã Â¯Ë†_Ã Â®Å¡Ã Â®Â©Ã Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â¿Ã Â®Â´Ã Â®Â®Ã Â¯Ë†'.split('_'),
        weekdaysShort : 'Ã Â®Å¾Ã Â®Â¾Ã Â®Â¯Ã Â®Â¿Ã Â®Â±Ã Â¯Â_Ã Â®Â¤Ã Â®Â¿Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â_Ã Â®Å¡Ã Â¯â€ Ã Â®ÂµÃ Â¯ÂÃ Â®ÂµÃ Â®Â¾Ã Â®Â¯Ã Â¯Â_Ã Â®ÂªÃ Â¯ÂÃ Â®Â¤Ã Â®Â©Ã Â¯Â_Ã Â®ÂµÃ Â®Â¿Ã Â®Â¯Ã Â®Â¾Ã Â®Â´Ã Â®Â©Ã Â¯Â_Ã Â®ÂµÃ Â¯â€ Ã Â®Â³Ã Â¯ÂÃ Â®Â³Ã Â®Â¿_Ã Â®Å¡Ã Â®Â©Ã Â®Â¿'.split('_'),
        weekdaysMin : 'Ã Â®Å¾Ã Â®Â¾_Ã Â®Â¤Ã Â®Â¿_Ã Â®Å¡Ã Â¯â€ _Ã Â®ÂªÃ Â¯Â_Ã Â®ÂµÃ Â®Â¿_Ã Â®ÂµÃ Â¯â€ _Ã Â®Å¡'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[Ã Â®â€¡Ã Â®Â©Ã Â¯ÂÃ Â®Â±Ã Â¯Â] LT',
            nextDay : '[Ã Â®Â¨Ã Â®Â¾Ã Â®Â³Ã Â¯Ë†] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[Ã Â®Â¨Ã Â¯â€¡Ã Â®Â±Ã Â¯ÂÃ Â®Â±Ã Â¯Â] LT',
            lastWeek : '[Ã Â®â€¢Ã Â®Å¸Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤ Ã Â®ÂµÃ Â®Â¾Ã Â®Â°Ã Â®Â®Ã Â¯Â] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s Ã Â®â€¡Ã Â®Â²Ã Â¯Â',
            past : '%s Ã Â®Â®Ã Â¯ÂÃ Â®Â©Ã Â¯Â',
            s : 'Ã Â®â€™Ã Â®Â°Ã Â¯Â Ã Â®Å¡Ã Â®Â¿Ã Â®Â² Ã Â®ÂµÃ Â®Â¿Ã Â®Â¨Ã Â®Â¾Ã Â®Å¸Ã Â®Â¿Ã Â®â€¢Ã Â®Â³Ã Â¯Â',
            m : 'Ã Â®â€™Ã Â®Â°Ã Â¯Â Ã Â®Â¨Ã Â®Â¿Ã Â®Â®Ã Â®Â¿Ã Â®Å¸Ã Â®Â®Ã Â¯Â',
            mm : '%d Ã Â®Â¨Ã Â®Â¿Ã Â®Â®Ã Â®Â¿Ã Â®Å¸Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â',
            h : 'Ã Â®â€™Ã Â®Â°Ã Â¯Â Ã Â®Â®Ã Â®Â£Ã Â®Â¿ Ã Â®Â¨Ã Â¯â€¡Ã Â®Â°Ã Â®Â®Ã Â¯Â',
            hh : '%d Ã Â®Â®Ã Â®Â£Ã Â®Â¿ Ã Â®Â¨Ã Â¯â€¡Ã Â®Â°Ã Â®Â®Ã Â¯Â',
            d : 'Ã Â®â€™Ã Â®Â°Ã Â¯Â Ã Â®Â¨Ã Â®Â¾Ã Â®Â³Ã Â¯Â',
            dd : '%d Ã Â®Â¨Ã Â®Â¾Ã Â®Å¸Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â',
            M : 'Ã Â®â€™Ã Â®Â°Ã Â¯Â Ã Â®Â®Ã Â®Â¾Ã Â®Â¤Ã Â®Â®Ã Â¯Â',
            MM : '%d Ã Â®Â®Ã Â®Â¾Ã Â®Â¤Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â',
            y : 'Ã Â®â€™Ã Â®Â°Ã Â¯Â Ã Â®ÂµÃ Â®Â°Ã Â¯ÂÃ Â®Å¸Ã Â®Â®Ã Â¯Â',
            yy : '%d Ã Â®â€ Ã Â®Â£Ã Â¯ÂÃ Â®Å¸Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â'
        },
/*        preparse: function (string) {
            return string.replace(/[Ã Â¯Â§Ã Â¯Â¨Ã Â¯Â©Ã Â¯ÂªÃ Â¯Â«Ã Â¯Â¬Ã Â¯Â­Ã Â¯Â®Ã Â¯Â¯Ã Â¯Â¦]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },*/
        ordinalParse: /\d{1,2}Ã Â®ÂµÃ Â®Â¤Ã Â¯Â/,
        ordinal : function (number) {
            return number + 'Ã Â®ÂµÃ Â®Â¤Ã Â¯Â';
        },


        // refer http://ta.wikipedia.org/s/1er1
        meridiemParse: /Ã Â®Â¯Ã Â®Â¾Ã Â®Â®Ã Â®Â®Ã Â¯Â|Ã Â®ÂµÃ Â¯Ë†Ã Â®â€¢Ã Â®Â±Ã Â¯Ë†|Ã Â®â€¢Ã Â®Â¾Ã Â®Â²Ã Â¯Ë†|Ã Â®Â¨Ã Â®Â£Ã Â¯ÂÃ Â®ÂªÃ Â®â€¢Ã Â®Â²Ã Â¯Â|Ã Â®Å½Ã Â®Â±Ã Â¯ÂÃ Â®ÂªÃ Â®Â¾Ã Â®Å¸Ã Â¯Â|Ã Â®Â®Ã Â®Â¾Ã Â®Â²Ã Â¯Ë†/,
        meridiem : function (hour, minute, isLower) {
            if (hour < 2) {
                return ' Ã Â®Â¯Ã Â®Â¾Ã Â®Â®Ã Â®Â®Ã Â¯Â';
            } else if (hour < 6) {
                return ' Ã Â®ÂµÃ Â¯Ë†Ã Â®â€¢Ã Â®Â±Ã Â¯Ë†';  // Ã Â®ÂµÃ Â¯Ë†Ã Â®â€¢Ã Â®Â±Ã Â¯Ë†
            } else if (hour < 10) {
                return ' Ã Â®â€¢Ã Â®Â¾Ã Â®Â²Ã Â¯Ë†'; // Ã Â®â€¢Ã Â®Â¾Ã Â®Â²Ã Â¯Ë†
            } else if (hour < 14) {
                return ' Ã Â®Â¨Ã Â®Â£Ã Â¯ÂÃ Â®ÂªÃ Â®â€¢Ã Â®Â²Ã Â¯Â'; // Ã Â®Â¨Ã Â®Â£Ã Â¯ÂÃ Â®ÂªÃ Â®â€¢Ã Â®Â²Ã Â¯Â
            } else if (hour < 18) {
                return ' Ã Â®Å½Ã Â®Â±Ã Â¯ÂÃ Â®ÂªÃ Â®Â¾Ã Â®Å¸Ã Â¯Â'; // Ã Â®Å½Ã Â®Â±Ã Â¯ÂÃ Â®ÂªÃ Â®Â¾Ã Â®Å¸Ã Â¯Â
            } else if (hour < 22) {
                return ' Ã Â®Â®Ã Â®Â¾Ã Â®Â²Ã Â¯Ë†'; // Ã Â®Â®Ã Â®Â¾Ã Â®Â²Ã Â¯Ë†
            } else {
                return ' Ã Â®Â¯Ã Â®Â¾Ã Â®Â®Ã Â®Â®Ã Â¯Â';
            }
        },
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'Ã Â®Â¯Ã Â®Â¾Ã Â®Â®Ã Â®Â®Ã Â¯Â') {
                return hour < 2 ? hour : hour + 12;
            } else if (meridiem === 'Ã Â®ÂµÃ Â¯Ë†Ã Â®â€¢Ã Â®Â±Ã Â¯Ë†' || meridiem === 'Ã Â®â€¢Ã Â®Â¾Ã Â®Â²Ã Â¯Ë†') {
                return hour;
            } else if (meridiem === 'Ã Â®Â¨Ã Â®Â£Ã Â¯ÂÃ Â®ÂªÃ Â®â€¢Ã Â®Â²Ã Â¯Â') {
                return hour >= 10 ? hour : hour + 12;
            } else {
                return hour + 12;
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : thai (th)
// author : Kridsada Thanabulpong : https://github.com/sirn

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('th', {
        months : 'Ã Â¸Â¡Ã Â¸ÂÃ Â¸Â£Ã Â¸Â²Ã Â¸â€žÃ Â¸Â¡_Ã Â¸ÂÃ Â¸Â¸Ã Â¸Â¡Ã Â¸ Ã Â¸Â²Ã Â¸Å¾Ã Â¸Â±Ã Â¸â„¢Ã Â¸ËœÃ Â¹Å’_Ã Â¸Â¡Ã Â¸ÂµÃ Â¸â„¢Ã Â¸Â²Ã Â¸â€žÃ Â¸Â¡_Ã Â¹â‚¬Ã Â¸Â¡Ã Â¸Â©Ã Â¸Â²Ã Â¸Â¢Ã Â¸â„¢_Ã Â¸Å¾Ã Â¸Â¤Ã Â¸Â©Ã Â¸ Ã Â¸Â²Ã Â¸â€žÃ Â¸Â¡_Ã Â¸Â¡Ã Â¸Â´Ã Â¸â€“Ã Â¸Â¸Ã Â¸â„¢Ã Â¸Â²Ã Â¸Â¢Ã Â¸â„¢_Ã Â¸ÂÃ Â¸Â£Ã Â¸ÂÃ Â¸Å½Ã Â¸Â²Ã Â¸â€žÃ Â¸Â¡_Ã Â¸ÂªÃ Â¸Â´Ã Â¸â€¡Ã Â¸Â«Ã Â¸Â²Ã Â¸â€žÃ Â¸Â¡_Ã Â¸ÂÃ Â¸Â±Ã Â¸â„¢Ã Â¸Â¢Ã Â¸Â²Ã Â¸Â¢Ã Â¸â„¢_Ã Â¸â€¢Ã Â¸Â¸Ã Â¸Â¥Ã Â¸Â²Ã Â¸â€žÃ Â¸Â¡_Ã Â¸Å¾Ã Â¸Â¤Ã Â¸Â¨Ã Â¸Ë†Ã Â¸Â´Ã Â¸ÂÃ Â¸Â²Ã Â¸Â¢Ã Â¸â„¢_Ã Â¸ËœÃ Â¸Â±Ã Â¸â„¢Ã Â¸Â§Ã Â¸Â²Ã Â¸â€žÃ Â¸Â¡'.split('_'),
        monthsShort : 'Ã Â¸Â¡Ã Â¸ÂÃ Â¸Â£Ã Â¸Â²_Ã Â¸ÂÃ Â¸Â¸Ã Â¸Â¡Ã Â¸ Ã Â¸Â²_Ã Â¸Â¡Ã Â¸ÂµÃ Â¸â„¢Ã Â¸Â²_Ã Â¹â‚¬Ã Â¸Â¡Ã Â¸Â©Ã Â¸Â²_Ã Â¸Å¾Ã Â¸Â¤Ã Â¸Â©Ã Â¸ Ã Â¸Â²_Ã Â¸Â¡Ã Â¸Â´Ã Â¸â€“Ã Â¸Â¸Ã Â¸â„¢Ã Â¸Â²_Ã Â¸ÂÃ Â¸Â£Ã Â¸ÂÃ Â¸Å½Ã Â¸Â²_Ã Â¸ÂªÃ Â¸Â´Ã Â¸â€¡Ã Â¸Â«Ã Â¸Â²_Ã Â¸ÂÃ Â¸Â±Ã Â¸â„¢Ã Â¸Â¢Ã Â¸Â²_Ã Â¸â€¢Ã Â¸Â¸Ã Â¸Â¥Ã Â¸Â²_Ã Â¸Å¾Ã Â¸Â¤Ã Â¸Â¨Ã Â¸Ë†Ã Â¸Â´Ã Â¸ÂÃ Â¸Â²_Ã Â¸ËœÃ Â¸Â±Ã Â¸â„¢Ã Â¸Â§Ã Â¸Â²'.split('_'),
        weekdays : 'Ã Â¸Â­Ã Â¸Â²Ã Â¸â€”Ã Â¸Â´Ã Â¸â€¢Ã Â¸Â¢Ã Â¹Å’_Ã Â¸Ë†Ã Â¸Â±Ã Â¸â„¢Ã Â¸â€”Ã Â¸Â£Ã Â¹Å’_Ã Â¸Â­Ã Â¸Â±Ã Â¸â€¡Ã Â¸â€žÃ Â¸Â²Ã Â¸Â£_Ã Â¸Å¾Ã Â¸Â¸Ã Â¸Ëœ_Ã Â¸Å¾Ã Â¸Â¤Ã Â¸Â«Ã Â¸Â±Ã Â¸ÂªÃ Â¸Å¡Ã Â¸â€Ã Â¸Âµ_Ã Â¸Â¨Ã Â¸Â¸Ã Â¸ÂÃ Â¸Â£Ã Â¹Å’_Ã Â¹â‚¬Ã Â¸ÂªÃ Â¸Â²Ã Â¸Â£Ã Â¹Å’'.split('_'),
        weekdaysShort : 'Ã Â¸Â­Ã Â¸Â²Ã Â¸â€”Ã Â¸Â´Ã Â¸â€¢Ã Â¸Â¢Ã Â¹Å’_Ã Â¸Ë†Ã Â¸Â±Ã Â¸â„¢Ã Â¸â€”Ã Â¸Â£Ã Â¹Å’_Ã Â¸Â­Ã Â¸Â±Ã Â¸â€¡Ã Â¸â€žÃ Â¸Â²Ã Â¸Â£_Ã Â¸Å¾Ã Â¸Â¸Ã Â¸Ëœ_Ã Â¸Å¾Ã Â¸Â¤Ã Â¸Â«Ã Â¸Â±Ã Â¸Âª_Ã Â¸Â¨Ã Â¸Â¸Ã Â¸ÂÃ Â¸Â£Ã Â¹Å’_Ã Â¹â‚¬Ã Â¸ÂªÃ Â¸Â²Ã Â¸Â£Ã Â¹Å’'.split('_'), // yes, three characters difference
        weekdaysMin : 'Ã Â¸Â­Ã Â¸Â²._Ã Â¸Ë†._Ã Â¸Â­._Ã Â¸Å¾._Ã Â¸Å¾Ã Â¸Â¤._Ã Â¸Â¨._Ã Â¸Âª.'.split('_'),
        longDateFormat : {
            LT : 'H Ã Â¸â„¢Ã Â¸Â²Ã Â¸Â¬Ã Â¸Â´Ã Â¸ÂÃ Â¸Â² m Ã Â¸â„¢Ã Â¸Â²Ã Â¸â€”Ã Â¸Âµ',
            LTS : 'LT s Ã Â¸Â§Ã Â¸Â´Ã Â¸â„¢Ã Â¸Â²Ã Â¸â€”Ã Â¸Âµ',
            L : 'YYYY/MM/DD',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY Ã Â¹â‚¬Ã Â¸Â§Ã Â¸Â¥Ã Â¸Â² LT',
            LLLL : 'Ã Â¸Â§Ã Â¸Â±Ã Â¸â„¢ddddÃ Â¸â€”Ã Â¸ÂµÃ Â¹Ë† D MMMM YYYY Ã Â¹â‚¬Ã Â¸Â§Ã Â¸Â¥Ã Â¸Â² LT'
        },
        meridiemParse: /Ã Â¸ÂÃ Â¹Ë†Ã Â¸Â­Ã Â¸â„¢Ã Â¹â‚¬Ã Â¸â€”Ã Â¸ÂµÃ Â¹Ë†Ã Â¸Â¢Ã Â¸â€¡|Ã Â¸Â«Ã Â¸Â¥Ã Â¸Â±Ã Â¸â€¡Ã Â¹â‚¬Ã Â¸â€”Ã Â¸ÂµÃ Â¹Ë†Ã Â¸Â¢Ã Â¸â€¡/,
        isPM: function (input) {
            return input === 'Ã Â¸Â«Ã Â¸Â¥Ã Â¸Â±Ã Â¸â€¡Ã Â¹â‚¬Ã Â¸â€”Ã Â¸ÂµÃ Â¹Ë†Ã Â¸Â¢Ã Â¸â€¡';
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'Ã Â¸ÂÃ Â¹Ë†Ã Â¸Â­Ã Â¸â„¢Ã Â¹â‚¬Ã Â¸â€”Ã Â¸ÂµÃ Â¹Ë†Ã Â¸Â¢Ã Â¸â€¡';
            } else {
                return 'Ã Â¸Â«Ã Â¸Â¥Ã Â¸Â±Ã Â¸â€¡Ã Â¹â‚¬Ã Â¸â€”Ã Â¸ÂµÃ Â¹Ë†Ã Â¸Â¢Ã Â¸â€¡';
            }
        },
        calendar : {
            sameDay : '[Ã Â¸Â§Ã Â¸Â±Ã Â¸â„¢Ã Â¸â„¢Ã Â¸ÂµÃ Â¹â€° Ã Â¹â‚¬Ã Â¸Â§Ã Â¸Â¥Ã Â¸Â²] LT',
            nextDay : '[Ã Â¸Å¾Ã Â¸Â£Ã Â¸Â¸Ã Â¹Ë†Ã Â¸â€¡Ã Â¸â„¢Ã Â¸ÂµÃ Â¹â€° Ã Â¹â‚¬Ã Â¸Â§Ã Â¸Â¥Ã Â¸Â²] LT',
            nextWeek : 'dddd[Ã Â¸Â«Ã Â¸â„¢Ã Â¹â€°Ã Â¸Â² Ã Â¹â‚¬Ã Â¸Â§Ã Â¸Â¥Ã Â¸Â²] LT',
            lastDay : '[Ã Â¹â‚¬Ã Â¸Â¡Ã Â¸Â·Ã Â¹Ë†Ã Â¸Â­Ã Â¸Â§Ã Â¸Â²Ã Â¸â„¢Ã Â¸â„¢Ã Â¸ÂµÃ Â¹â€° Ã Â¹â‚¬Ã Â¸Â§Ã Â¸Â¥Ã Â¸Â²] LT',
            lastWeek : '[Ã Â¸Â§Ã Â¸Â±Ã Â¸â„¢]dddd[Ã Â¸â€”Ã Â¸ÂµÃ Â¹Ë†Ã Â¹ÂÃ Â¸Â¥Ã Â¹â€°Ã Â¸Â§ Ã Â¹â‚¬Ã Â¸Â§Ã Â¸Â¥Ã Â¸Â²] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'Ã Â¸Â­Ã Â¸ÂµÃ Â¸Â %s',
            past : '%sÃ Â¸â€”Ã Â¸ÂµÃ Â¹Ë†Ã Â¹ÂÃ Â¸Â¥Ã Â¹â€°Ã Â¸Â§',
            s : 'Ã Â¹â€žÃ Â¸Â¡Ã Â¹Ë†Ã Â¸ÂÃ Â¸ÂµÃ Â¹Ë†Ã Â¸Â§Ã Â¸Â´Ã Â¸â„¢Ã Â¸Â²Ã Â¸â€”Ã Â¸Âµ',
            m : '1 Ã Â¸â„¢Ã Â¸Â²Ã Â¸â€”Ã Â¸Âµ',
            mm : '%d Ã Â¸â„¢Ã Â¸Â²Ã Â¸â€”Ã Â¸Âµ',
            h : '1 Ã Â¸Å Ã Â¸Â±Ã Â¹Ë†Ã Â¸Â§Ã Â¹â€šÃ Â¸Â¡Ã Â¸â€¡',
            hh : '%d Ã Â¸Å Ã Â¸Â±Ã Â¹Ë†Ã Â¸Â§Ã Â¹â€šÃ Â¸Â¡Ã Â¸â€¡',
            d : '1 Ã Â¸Â§Ã Â¸Â±Ã Â¸â„¢',
            dd : '%d Ã Â¸Â§Ã Â¸Â±Ã Â¸â„¢',
            M : '1 Ã Â¹â‚¬Ã Â¸â€Ã Â¸Â·Ã Â¸Â­Ã Â¸â„¢',
            MM : '%d Ã Â¹â‚¬Ã Â¸â€Ã Â¸Â·Ã Â¸Â­Ã Â¸â„¢',
            y : '1 Ã Â¸â€ºÃ Â¸Âµ',
            yy : '%d Ã Â¸â€ºÃ Â¸Âµ'
        }
    });
}));
// moment.js locale configuration
// locale : Tagalog/Filipino (tl-ph)
// author : Dan Hagman

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('tl-ph', {
        months : 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split('_'),
        monthsShort : 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split('_'),
        weekdays : 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split('_'),
        weekdaysShort : 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
        weekdaysMin : 'Li_Lu_Ma_Mi_Hu_Bi_Sab'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'MM/D/YYYY',
            LL : 'MMMM D, YYYY',
            LLL : 'MMMM D, YYYY LT',
            LLLL : 'dddd, MMMM DD, YYYY LT'
        },
        calendar : {
            sameDay: '[Ngayon sa] LT',
            nextDay: '[Bukas sa] LT',
            nextWeek: 'dddd [sa] LT',
            lastDay: '[Kahapon sa] LT',
            lastWeek: 'dddd [huling linggo] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'sa loob ng %s',
            past : '%s ang nakalipas',
            s : 'ilang segundo',
            m : 'isang minuto',
            mm : '%d minuto',
            h : 'isang oras',
            hh : '%d oras',
            d : 'isang araw',
            dd : '%d araw',
            M : 'isang buwan',
            MM : '%d buwan',
            y : 'isang taon',
            yy : '%d taon'
        },
        ordinalParse: /\d{1,2}/,
        ordinal : function (number) {
            return number;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : turkish (tr)
// authors : Erhan Gundogan : https://github.com/erhangundogan,
//           Burak YiÃ„Å¸it Kaya: https://github.com/BYK

(function (factory) {
    factory(moment);
}(function (moment) {
    var suffixes = {
        1: '\'inci',
        5: '\'inci',
        8: '\'inci',
        70: '\'inci',
        80: '\'inci',

        2: '\'nci',
        7: '\'nci',
        20: '\'nci',
        50: '\'nci',

        3: '\'ÃƒÂ¼ncÃƒÂ¼',
        4: '\'ÃƒÂ¼ncÃƒÂ¼',
        100: '\'ÃƒÂ¼ncÃƒÂ¼',

        6: '\'ncÃ„Â±',

        9: '\'uncu',
        10: '\'uncu',
        30: '\'uncu',

        60: '\'Ã„Â±ncÃ„Â±',
        90: '\'Ã„Â±ncÃ„Â±'
    };

    return moment.defineLocale('tr', {
        months : 'Ocak_Ã…Å¾ubat_Mart_Nisan_MayÃ„Â±s_Haziran_Temmuz_AÃ„Å¸ustos_EylÃƒÂ¼l_Ekim_KasÃ„Â±m_AralÃ„Â±k'.split('_'),
        monthsShort : 'Oca_Ã…Å¾ub_Mar_Nis_May_Haz_Tem_AÃ„Å¸u_Eyl_Eki_Kas_Ara'.split('_'),
        weekdays : 'Pazar_Pazartesi_SalÃ„Â±_Ãƒâ€¡arÃ…Å¸amba_PerÃ…Å¸embe_Cuma_Cumartesi'.split('_'),
        weekdaysShort : 'Paz_Pts_Sal_Ãƒâ€¡ar_Per_Cum_Cts'.split('_'),
        weekdaysMin : 'Pz_Pt_Sa_Ãƒâ€¡a_Pe_Cu_Ct'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[bugÃƒÂ¼n saat] LT',
            nextDay : '[yarÃ„Â±n saat] LT',
            nextWeek : '[haftaya] dddd [saat] LT',
            lastDay : '[dÃƒÂ¼n] LT',
            lastWeek : '[geÃƒÂ§en hafta] dddd [saat] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s sonra',
            past : '%s ÃƒÂ¶nce',
            s : 'birkaÃƒÂ§ saniye',
            m : 'bir dakika',
            mm : '%d dakika',
            h : 'bir saat',
            hh : '%d saat',
            d : 'bir gÃƒÂ¼n',
            dd : '%d gÃƒÂ¼n',
            M : 'bir ay',
            MM : '%d ay',
            y : 'bir yÃ„Â±l',
            yy : '%d yÃ„Â±l'
        },
        ordinalParse: /\d{1,2}'(inci|nci|ÃƒÂ¼ncÃƒÂ¼|ncÃ„Â±|uncu|Ã„Â±ncÃ„Â±)/,
        ordinal : function (number) {
            if (number === 0) {  // special case for zero
                return number + '\'Ã„Â±ncÃ„Â±';
            }
            var a = number % 10,
                b = number % 100 - a,
                c = number >= 100 ? 100 : null;

            return number + (suffixes[a] || suffixes[b] || suffixes[c]);
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Morocco Central Atlas TamaziÃ‰Â£t in Latin (tzm-latn)
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('tzm-latn', {
        months : 'innayr_brÃ‹Â¤ayrÃ‹Â¤_marÃ‹Â¤sÃ‹Â¤_ibrir_mayyw_ywnyw_ywlywz_Ã‰Â£wÃ…Â¡t_Ã…Â¡wtanbir_ktÃ‹Â¤wbrÃ‹Â¤_nwwanbir_dwjnbir'.split('_'),
        monthsShort : 'innayr_brÃ‹Â¤ayrÃ‹Â¤_marÃ‹Â¤sÃ‹Â¤_ibrir_mayyw_ywnyw_ywlywz_Ã‰Â£wÃ…Â¡t_Ã…Â¡wtanbir_ktÃ‹Â¤wbrÃ‹Â¤_nwwanbir_dwjnbir'.split('_'),
        weekdays : 'asamas_aynas_asinas_akras_akwas_asimwas_asiÃ¡Â¸Âyas'.split('_'),
        weekdaysShort : 'asamas_aynas_asinas_akras_akwas_asimwas_asiÃ¡Â¸Âyas'.split('_'),
        weekdaysMin : 'asamas_aynas_asinas_akras_akwas_asimwas_asiÃ¡Â¸Âyas'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[asdkh g] LT',
            nextDay: '[aska g] LT',
            nextWeek: 'dddd [g] LT',
            lastDay: '[assant g] LT',
            lastWeek: 'dddd [g] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'dadkh s yan %s',
            past : 'yan %s',
            s : 'imik',
            m : 'minuÃ¡Â¸Â',
            mm : '%d minuÃ¡Â¸Â',
            h : 'saÃ‰â€ºa',
            hh : '%d tassaÃ‰â€ºin',
            d : 'ass',
            dd : '%d ossan',
            M : 'ayowr',
            MM : '%d iyyirn',
            y : 'asgas',
            yy : '%d isgasn'
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Morocco Central Atlas TamaziÃ‰Â£t (tzm)
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('tzm', {
        months : 'Ã¢Âµâ€°Ã¢ÂµÂÃ¢ÂµÂÃ¢Â´Â°Ã¢ÂµÂ¢Ã¢Âµâ€_Ã¢Â´Â±Ã¢Âµâ€¢Ã¢Â´Â°Ã¢ÂµÂ¢Ã¢Âµâ€¢_Ã¢ÂµÅ½Ã¢Â´Â°Ã¢Âµâ€¢Ã¢ÂµÅ¡_Ã¢Âµâ€°Ã¢Â´Â±Ã¢Âµâ€Ã¢Âµâ€°Ã¢Âµâ€_Ã¢ÂµÅ½Ã¢Â´Â°Ã¢ÂµÂ¢Ã¢ÂµÂ¢Ã¢Âµâ€œ_Ã¢ÂµÂ¢Ã¢Âµâ€œÃ¢ÂµÂÃ¢ÂµÂ¢Ã¢Âµâ€œ_Ã¢ÂµÂ¢Ã¢Âµâ€œÃ¢ÂµÂÃ¢ÂµÂ¢Ã¢Âµâ€œÃ¢ÂµÂ£_Ã¢Âµâ€“Ã¢Âµâ€œÃ¢Âµâ€ºÃ¢ÂµÅ“_Ã¢Âµâ€ºÃ¢Âµâ€œÃ¢ÂµÅ“Ã¢Â´Â°Ã¢ÂµÂÃ¢Â´Â±Ã¢Âµâ€°Ã¢Âµâ€_Ã¢Â´Â½Ã¢ÂµÅ¸Ã¢Âµâ€œÃ¢Â´Â±Ã¢Âµâ€¢_Ã¢ÂµÂÃ¢Âµâ€œÃ¢ÂµÂ¡Ã¢Â´Â°Ã¢ÂµÂÃ¢Â´Â±Ã¢Âµâ€°Ã¢Âµâ€_Ã¢Â´Â·Ã¢Âµâ€œÃ¢ÂµÅ Ã¢ÂµÂÃ¢Â´Â±Ã¢Âµâ€°Ã¢Âµâ€'.split('_'),
        monthsShort : 'Ã¢Âµâ€°Ã¢ÂµÂÃ¢ÂµÂÃ¢Â´Â°Ã¢ÂµÂ¢Ã¢Âµâ€_Ã¢Â´Â±Ã¢Âµâ€¢Ã¢Â´Â°Ã¢ÂµÂ¢Ã¢Âµâ€¢_Ã¢ÂµÅ½Ã¢Â´Â°Ã¢Âµâ€¢Ã¢ÂµÅ¡_Ã¢Âµâ€°Ã¢Â´Â±Ã¢Âµâ€Ã¢Âµâ€°Ã¢Âµâ€_Ã¢ÂµÅ½Ã¢Â´Â°Ã¢ÂµÂ¢Ã¢ÂµÂ¢Ã¢Âµâ€œ_Ã¢ÂµÂ¢Ã¢Âµâ€œÃ¢ÂµÂÃ¢ÂµÂ¢Ã¢Âµâ€œ_Ã¢ÂµÂ¢Ã¢Âµâ€œÃ¢ÂµÂÃ¢ÂµÂ¢Ã¢Âµâ€œÃ¢ÂµÂ£_Ã¢Âµâ€“Ã¢Âµâ€œÃ¢Âµâ€ºÃ¢ÂµÅ“_Ã¢Âµâ€ºÃ¢Âµâ€œÃ¢ÂµÅ“Ã¢Â´Â°Ã¢ÂµÂÃ¢Â´Â±Ã¢Âµâ€°Ã¢Âµâ€_Ã¢Â´Â½Ã¢ÂµÅ¸Ã¢Âµâ€œÃ¢Â´Â±Ã¢Âµâ€¢_Ã¢ÂµÂÃ¢Âµâ€œÃ¢ÂµÂ¡Ã¢Â´Â°Ã¢ÂµÂÃ¢Â´Â±Ã¢Âµâ€°Ã¢Âµâ€_Ã¢Â´Â·Ã¢Âµâ€œÃ¢ÂµÅ Ã¢ÂµÂÃ¢Â´Â±Ã¢Âµâ€°Ã¢Âµâ€'.split('_'),
        weekdays : 'Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Â´Â°Ã¢ÂµÅ½Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢ÂµÂ¢Ã¢ÂµÂÃ¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Âµâ€°Ã¢ÂµÂÃ¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Â´Â½Ã¢Âµâ€Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Â´Â½Ã¢ÂµÂ¡Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Âµâ€°Ã¢ÂµÅ½Ã¢ÂµÂ¡Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Âµâ€°Ã¢Â´Â¹Ã¢ÂµÂ¢Ã¢Â´Â°Ã¢Âµâ„¢'.split('_'),
        weekdaysShort : 'Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Â´Â°Ã¢ÂµÅ½Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢ÂµÂ¢Ã¢ÂµÂÃ¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Âµâ€°Ã¢ÂµÂÃ¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Â´Â½Ã¢Âµâ€Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Â´Â½Ã¢ÂµÂ¡Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Âµâ€°Ã¢ÂµÅ½Ã¢ÂµÂ¡Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Âµâ€°Ã¢Â´Â¹Ã¢ÂµÂ¢Ã¢Â´Â°Ã¢Âµâ„¢'.split('_'),
        weekdaysMin : 'Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Â´Â°Ã¢ÂµÅ½Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢ÂµÂ¢Ã¢ÂµÂÃ¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Âµâ€°Ã¢ÂµÂÃ¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Â´Â½Ã¢Âµâ€Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Â´Â½Ã¢ÂµÂ¡Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Âµâ€°Ã¢ÂµÅ½Ã¢ÂµÂ¡Ã¢Â´Â°Ã¢Âµâ„¢_Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Âµâ€°Ã¢Â´Â¹Ã¢ÂµÂ¢Ã¢Â´Â°Ã¢Âµâ„¢'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS: 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Â´Â·Ã¢Âµâ€¦ Ã¢Â´Â´] LT',
            nextDay: '[Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Â´Â½Ã¢Â´Â° Ã¢Â´Â´] LT',
            nextWeek: 'dddd [Ã¢Â´Â´] LT',
            lastDay: '[Ã¢Â´Â°Ã¢ÂµÅ¡Ã¢Â´Â°Ã¢ÂµÂÃ¢ÂµÅ“ Ã¢Â´Â´] LT',
            lastWeek: 'dddd [Ã¢Â´Â´] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'Ã¢Â´Â·Ã¢Â´Â°Ã¢Â´Â·Ã¢Âµâ€¦ Ã¢Âµâ„¢ Ã¢ÂµÂ¢Ã¢Â´Â°Ã¢ÂµÂ %s',
            past : 'Ã¢ÂµÂ¢Ã¢Â´Â°Ã¢ÂµÂ %s',
            s : 'Ã¢Âµâ€°Ã¢ÂµÅ½Ã¢Âµâ€°Ã¢Â´Â½',
            m : 'Ã¢ÂµÅ½Ã¢Âµâ€°Ã¢ÂµÂÃ¢Âµâ€œÃ¢Â´Âº',
            mm : '%d Ã¢ÂµÅ½Ã¢Âµâ€°Ã¢ÂµÂÃ¢Âµâ€œÃ¢Â´Âº',
            h : 'Ã¢Âµâ„¢Ã¢Â´Â°Ã¢Âµâ€žÃ¢Â´Â°',
            hh : '%d Ã¢ÂµÅ“Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Âµâ„¢Ã¢Â´Â°Ã¢Âµâ€žÃ¢Âµâ€°Ã¢ÂµÂ',
            d : 'Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Âµâ„¢',
            dd : '%d oÃ¢Âµâ„¢Ã¢Âµâ„¢Ã¢Â´Â°Ã¢ÂµÂ',
            M : 'Ã¢Â´Â°Ã¢ÂµÂ¢oÃ¢Âµâ€œÃ¢Âµâ€',
            MM : '%d Ã¢Âµâ€°Ã¢ÂµÂ¢Ã¢ÂµÂ¢Ã¢Âµâ€°Ã¢Âµâ€Ã¢ÂµÂ',
            y : 'Ã¢Â´Â°Ã¢Âµâ„¢Ã¢Â´Â³Ã¢Â´Â°Ã¢Âµâ„¢',
            yy : '%d Ã¢Âµâ€°Ã¢Âµâ„¢Ã¢Â´Â³Ã¢Â´Â°Ã¢Âµâ„¢Ã¢ÂµÂ'
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : ukrainian (uk)
// author : zemlanin : https://github.com/zemlanin
// Author : Menelion ElensÃƒÂºle : https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            'mm': 'Ã‘â€¦ÃÂ²ÃÂ¸ÃÂ»ÃÂ¸ÃÂ½ÃÂ°_Ã‘â€¦ÃÂ²ÃÂ¸ÃÂ»ÃÂ¸ÃÂ½ÃÂ¸_Ã‘â€¦ÃÂ²ÃÂ¸ÃÂ»ÃÂ¸ÃÂ½',
            'hh': 'ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½ÃÂ°_ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½ÃÂ¸_ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½',
            'dd': 'ÃÂ´ÃÂµÃÂ½Ã‘Å’_ÃÂ´ÃÂ½Ã‘â€“_ÃÂ´ÃÂ½Ã‘â€“ÃÂ²',
            'MM': 'ÃÂ¼Ã‘â€“Ã‘ÂÃ‘ÂÃ‘â€ Ã‘Å’_ÃÂ¼Ã‘â€“Ã‘ÂÃ‘ÂÃ‘â€ Ã‘â€“_ÃÂ¼Ã‘â€“Ã‘ÂÃ‘ÂÃ‘â€ Ã‘â€“ÃÂ²',
            'yy': 'Ã‘â‚¬Ã‘â€“ÃÂº_Ã‘â‚¬ÃÂ¾ÃÂºÃÂ¸_Ã‘â‚¬ÃÂ¾ÃÂºÃ‘â€“ÃÂ²'
        };
        if (key === 'm') {
            return withoutSuffix ? 'Ã‘â€¦ÃÂ²ÃÂ¸ÃÂ»ÃÂ¸ÃÂ½ÃÂ°' : 'Ã‘â€¦ÃÂ²ÃÂ¸ÃÂ»ÃÂ¸ÃÂ½Ã‘Æ’';
        }
        else if (key === 'h') {
            return withoutSuffix ? 'ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½ÃÂ°' : 'ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½Ã‘Æ’';
        }
        else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'Ã‘ÂÃ‘â€“Ã‘â€¡ÃÂµÃÂ½Ã‘Å’_ÃÂ»Ã‘Å½Ã‘â€šÃÂ¸ÃÂ¹_ÃÂ±ÃÂµÃ‘â‚¬ÃÂµÃÂ·ÃÂµÃÂ½Ã‘Å’_ÃÂºÃÂ²Ã‘â€“Ã‘â€šÃÂµÃÂ½Ã‘Å’_Ã‘â€šÃ‘â‚¬ÃÂ°ÃÂ²ÃÂµÃÂ½Ã‘Å’_Ã‘â€¡ÃÂµÃ‘â‚¬ÃÂ²ÃÂµÃÂ½Ã‘Å’_ÃÂ»ÃÂ¸ÃÂ¿ÃÂµÃÂ½Ã‘Å’_Ã‘ÂÃÂµÃ‘â‚¬ÃÂ¿ÃÂµÃÂ½Ã‘Å’_ÃÂ²ÃÂµÃ‘â‚¬ÃÂµÃ‘ÂÃÂµÃÂ½Ã‘Å’_ÃÂ¶ÃÂ¾ÃÂ²Ã‘â€šÃÂµÃÂ½Ã‘Å’_ÃÂ»ÃÂ¸Ã‘ÂÃ‘â€šÃÂ¾ÃÂ¿ÃÂ°ÃÂ´_ÃÂ³Ã‘â‚¬Ã‘Æ’ÃÂ´ÃÂµÃÂ½Ã‘Å’'.split('_'),
            'accusative': 'Ã‘ÂÃ‘â€“Ã‘â€¡ÃÂ½Ã‘Â_ÃÂ»Ã‘Å½Ã‘â€šÃÂ¾ÃÂ³ÃÂ¾_ÃÂ±ÃÂµÃ‘â‚¬ÃÂµÃÂ·ÃÂ½Ã‘Â_ÃÂºÃÂ²Ã‘â€“Ã‘â€šÃÂ½Ã‘Â_Ã‘â€šÃ‘â‚¬ÃÂ°ÃÂ²ÃÂ½Ã‘Â_Ã‘â€¡ÃÂµÃ‘â‚¬ÃÂ²ÃÂ½Ã‘Â_ÃÂ»ÃÂ¸ÃÂ¿ÃÂ½Ã‘Â_Ã‘ÂÃÂµÃ‘â‚¬ÃÂ¿ÃÂ½Ã‘Â_ÃÂ²ÃÂµÃ‘â‚¬ÃÂµÃ‘ÂÃÂ½Ã‘Â_ÃÂ¶ÃÂ¾ÃÂ²Ã‘â€šÃÂ½Ã‘Â_ÃÂ»ÃÂ¸Ã‘ÂÃ‘â€šÃÂ¾ÃÂ¿ÃÂ°ÃÂ´ÃÂ°_ÃÂ³Ã‘â‚¬Ã‘Æ’ÃÂ´ÃÂ½Ã‘Â'.split('_')
        },

        nounCase = (/D[oD]? *MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'ÃÂ½ÃÂµÃÂ´Ã‘â€“ÃÂ»Ã‘Â_ÃÂ¿ÃÂ¾ÃÂ½ÃÂµÃÂ´Ã‘â€“ÃÂ»ÃÂ¾ÃÂº_ÃÂ²Ã‘â€“ÃÂ²Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ¾ÃÂº_Ã‘ÂÃÂµÃ‘â‚¬ÃÂµÃÂ´ÃÂ°_Ã‘â€¡ÃÂµÃ‘â€šÃÂ²ÃÂµÃ‘â‚¬_ÃÂ¿Ã¢â‚¬â„¢Ã‘ÂÃ‘â€šÃÂ½ÃÂ¸Ã‘â€ Ã‘Â_Ã‘ÂÃ‘Æ’ÃÂ±ÃÂ¾Ã‘â€šÃÂ°'.split('_'),
            'accusative': 'ÃÂ½ÃÂµÃÂ´Ã‘â€“ÃÂ»Ã‘Å½_ÃÂ¿ÃÂ¾ÃÂ½ÃÂµÃÂ´Ã‘â€“ÃÂ»ÃÂ¾ÃÂº_ÃÂ²Ã‘â€“ÃÂ²Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ¾ÃÂº_Ã‘ÂÃÂµÃ‘â‚¬ÃÂµÃÂ´Ã‘Æ’_Ã‘â€¡ÃÂµÃ‘â€šÃÂ²ÃÂµÃ‘â‚¬_ÃÂ¿Ã¢â‚¬â„¢Ã‘ÂÃ‘â€šÃÂ½ÃÂ¸Ã‘â€ Ã‘Å½_Ã‘ÂÃ‘Æ’ÃÂ±ÃÂ¾Ã‘â€šÃ‘Æ’'.split('_'),
            'genitive': 'ÃÂ½ÃÂµÃÂ´Ã‘â€“ÃÂ»Ã‘â€“_ÃÂ¿ÃÂ¾ÃÂ½ÃÂµÃÂ´Ã‘â€“ÃÂ»ÃÂºÃÂ°_ÃÂ²Ã‘â€“ÃÂ²Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂºÃÂ°_Ã‘ÂÃÂµÃ‘â‚¬ÃÂµÃÂ´ÃÂ¸_Ã‘â€¡ÃÂµÃ‘â€šÃÂ²ÃÂµÃ‘â‚¬ÃÂ³ÃÂ°_ÃÂ¿Ã¢â‚¬â„¢Ã‘ÂÃ‘â€šÃÂ½ÃÂ¸Ã‘â€ Ã‘â€“_Ã‘ÂÃ‘Æ’ÃÂ±ÃÂ¾Ã‘â€šÃÂ¸'.split('_')
        },

        nounCase = (/(\[[Ãâ€™ÃÂ²ÃÂ£Ã‘Æ’]\]) ?dddd/).test(format) ?
            'accusative' :
            ((/\[?(?:ÃÂ¼ÃÂ¸ÃÂ½Ã‘Æ’ÃÂ»ÃÂ¾Ã‘â€”|ÃÂ½ÃÂ°Ã‘ÂÃ‘â€šÃ‘Æ’ÃÂ¿ÃÂ½ÃÂ¾Ã‘â€”)? ?\] ?dddd/).test(format) ?
                'genitive' :
                'nominative');

        return weekdays[nounCase][m.day()];
    }

    function processHoursFunction(str) {
        return function () {
            return str + 'ÃÂ¾' + (this.hours() === 11 ? 'ÃÂ±' : '') + '] LT';
        };
    }

    return moment.defineLocale('uk', {
        months : monthsCaseReplace,
        monthsShort : 'Ã‘ÂÃ‘â€“Ã‘â€¡_ÃÂ»Ã‘Å½Ã‘â€š_ÃÂ±ÃÂµÃ‘â‚¬_ÃÂºÃÂ²Ã‘â€“Ã‘â€š_Ã‘â€šÃ‘â‚¬ÃÂ°ÃÂ²_Ã‘â€¡ÃÂµÃ‘â‚¬ÃÂ²_ÃÂ»ÃÂ¸ÃÂ¿_Ã‘ÂÃÂµÃ‘â‚¬ÃÂ¿_ÃÂ²ÃÂµÃ‘â‚¬_ÃÂ¶ÃÂ¾ÃÂ²Ã‘â€š_ÃÂ»ÃÂ¸Ã‘ÂÃ‘â€š_ÃÂ³Ã‘â‚¬Ã‘Æ’ÃÂ´'.split('_'),
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'ÃÂ½ÃÂ´_ÃÂ¿ÃÂ½_ÃÂ²Ã‘â€š_Ã‘ÂÃ‘â‚¬_Ã‘â€¡Ã‘â€š_ÃÂ¿Ã‘â€š_Ã‘ÂÃÂ±'.split('_'),
        weekdaysMin : 'ÃÂ½ÃÂ´_ÃÂ¿ÃÂ½_ÃÂ²Ã‘â€š_Ã‘ÂÃ‘â‚¬_Ã‘â€¡Ã‘â€š_ÃÂ¿Ã‘â€š_Ã‘ÂÃÂ±'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY Ã‘â‚¬.',
            LLL : 'D MMMM YYYY Ã‘â‚¬., LT',
            LLLL : 'dddd, D MMMM YYYY Ã‘â‚¬., LT'
        },
        calendar : {
            sameDay: processHoursFunction('[ÃÂ¡Ã‘Å’ÃÂ¾ÃÂ³ÃÂ¾ÃÂ´ÃÂ½Ã‘â€“ '),
            nextDay: processHoursFunction('[Ãâ€”ÃÂ°ÃÂ²Ã‘â€šÃ‘â‚¬ÃÂ° '),
            lastDay: processHoursFunction('[Ãâ€™Ã‘â€¡ÃÂ¾Ã‘â‚¬ÃÂ° '),
            nextWeek: processHoursFunction('[ÃÂ£] dddd ['),
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 5:
                case 6:
                    return processHoursFunction('[ÃÅ“ÃÂ¸ÃÂ½Ã‘Æ’ÃÂ»ÃÂ¾Ã‘â€”] dddd [').call(this);
                case 1:
                case 2:
                case 4:
                    return processHoursFunction('[ÃÅ“ÃÂ¸ÃÂ½Ã‘Æ’ÃÂ»ÃÂ¾ÃÂ³ÃÂ¾] dddd [').call(this);
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'ÃÂ·ÃÂ° %s',
            past : '%s Ã‘â€šÃÂ¾ÃÂ¼Ã‘Æ’',
            s : 'ÃÂ´ÃÂµÃÂºÃ‘â€“ÃÂ»Ã‘Å’ÃÂºÃÂ° Ã‘ÂÃÂµÃÂºÃ‘Æ’ÃÂ½ÃÂ´',
            m : relativeTimeWithPlural,
            mm : relativeTimeWithPlural,
            h : 'ÃÂ³ÃÂ¾ÃÂ´ÃÂ¸ÃÂ½Ã‘Æ’',
            hh : relativeTimeWithPlural,
            d : 'ÃÂ´ÃÂµÃÂ½Ã‘Å’',
            dd : relativeTimeWithPlural,
            M : 'ÃÂ¼Ã‘â€“Ã‘ÂÃ‘ÂÃ‘â€ Ã‘Å’',
            MM : relativeTimeWithPlural,
            y : 'Ã‘â‚¬Ã‘â€“ÃÂº',
            yy : relativeTimeWithPlural
        },

        // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason

        meridiemParse: /ÃÂ½ÃÂ¾Ã‘â€¡Ã‘â€“|Ã‘â‚¬ÃÂ°ÃÂ½ÃÂºÃ‘Æ’|ÃÂ´ÃÂ½Ã‘Â|ÃÂ²ÃÂµÃ‘â€¡ÃÂ¾Ã‘â‚¬ÃÂ°/,
        isPM: function (input) {
            return /^(ÃÂ´ÃÂ½Ã‘Â|ÃÂ²ÃÂµÃ‘â€¡ÃÂ¾Ã‘â‚¬ÃÂ°)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'ÃÂ½ÃÂ¾Ã‘â€¡Ã‘â€“';
            } else if (hour < 12) {
                return 'Ã‘â‚¬ÃÂ°ÃÂ½ÃÂºÃ‘Æ’';
            } else if (hour < 17) {
                return 'ÃÂ´ÃÂ½Ã‘Â';
            } else {
                return 'ÃÂ²ÃÂµÃ‘â€¡ÃÂ¾Ã‘â‚¬ÃÂ°';
            }
        },

        ordinalParse: /\d{1,2}-(ÃÂ¹|ÃÂ³ÃÂ¾)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
            case 'w':
            case 'W':
                return number + '-ÃÂ¹';
            case 'D':
                return number + '-ÃÂ³ÃÂ¾';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : uzbek (uz)
// author : Sardor Muminov : https://github.com/muminoff

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('uz', {
        months : 'Ã‘ÂÃÂ½ÃÂ²ÃÂ°Ã‘â‚¬Ã‘Å’_Ã‘â€žÃÂµÃÂ²Ã‘â‚¬ÃÂ°ÃÂ»Ã‘Å’_ÃÂ¼ÃÂ°Ã‘â‚¬Ã‘â€š_ÃÂ°ÃÂ¿Ã‘â‚¬ÃÂµÃÂ»Ã‘Å’_ÃÂ¼ÃÂ°ÃÂ¹_ÃÂ¸Ã‘Å½ÃÂ½Ã‘Å’_ÃÂ¸Ã‘Å½ÃÂ»Ã‘Å’_ÃÂ°ÃÂ²ÃÂ³Ã‘Æ’Ã‘ÂÃ‘â€š_Ã‘ÂÃÂµÃÂ½Ã‘â€šÃ‘ÂÃÂ±Ã‘â‚¬Ã‘Å’_ÃÂ¾ÃÂºÃ‘â€šÃ‘ÂÃÂ±Ã‘â‚¬Ã‘Å’_ÃÂ½ÃÂ¾Ã‘ÂÃÂ±Ã‘â‚¬Ã‘Å’_ÃÂ´ÃÂµÃÂºÃÂ°ÃÂ±Ã‘â‚¬Ã‘Å’'.split('_'),
        monthsShort : 'Ã‘ÂÃÂ½ÃÂ²_Ã‘â€žÃÂµÃÂ²_ÃÂ¼ÃÂ°Ã‘â‚¬_ÃÂ°ÃÂ¿Ã‘â‚¬_ÃÂ¼ÃÂ°ÃÂ¹_ÃÂ¸Ã‘Å½ÃÂ½_ÃÂ¸Ã‘Å½ÃÂ»_ÃÂ°ÃÂ²ÃÂ³_Ã‘ÂÃÂµÃÂ½_ÃÂ¾ÃÂºÃ‘â€š_ÃÂ½ÃÂ¾Ã‘Â_ÃÂ´ÃÂµÃÂº'.split('_'),
        weekdays : 'ÃÂ¯ÃÂºÃ‘Ë†ÃÂ°ÃÂ½ÃÂ±ÃÂ°_Ãâ€Ã‘Æ’Ã‘Ë†ÃÂ°ÃÂ½ÃÂ±ÃÂ°_ÃÂ¡ÃÂµÃ‘Ë†ÃÂ°ÃÂ½ÃÂ±ÃÂ°_ÃÂ§ÃÂ¾Ã‘â‚¬Ã‘Ë†ÃÂ°ÃÂ½ÃÂ±ÃÂ°_ÃÅ¸ÃÂ°ÃÂ¹Ã‘Ë†ÃÂ°ÃÂ½ÃÂ±ÃÂ°_Ãâ€“Ã‘Æ’ÃÂ¼ÃÂ°_ÃÂ¨ÃÂ°ÃÂ½ÃÂ±ÃÂ°'.split('_'),
        weekdaysShort : 'ÃÂ¯ÃÂºÃ‘Ë†_Ãâ€Ã‘Æ’Ã‘Ë†_ÃÂ¡ÃÂµÃ‘Ë†_ÃÂ§ÃÂ¾Ã‘â‚¬_ÃÅ¸ÃÂ°ÃÂ¹_Ãâ€“Ã‘Æ’ÃÂ¼_ÃÂ¨ÃÂ°ÃÂ½'.split('_'),
        weekdaysMin : 'ÃÂ¯ÃÂº_Ãâ€Ã‘Æ’_ÃÂ¡ÃÂµ_ÃÂ§ÃÂ¾_ÃÅ¸ÃÂ°_Ãâ€“Ã‘Æ’_ÃÂ¨ÃÂ°'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'D MMMM YYYY, dddd LT'
        },
        calendar : {
            sameDay : '[Ãâ€˜Ã‘Æ’ÃÂ³Ã‘Æ’ÃÂ½ Ã‘ÂÃÂ¾ÃÂ°Ã‘â€š] LT [ÃÂ´ÃÂ°]',
            nextDay : '[ÃÂ­Ã‘â‚¬Ã‘â€šÃÂ°ÃÂ³ÃÂ°] LT [ÃÂ´ÃÂ°]',
            nextWeek : 'dddd [ÃÂºÃ‘Æ’ÃÂ½ÃÂ¸ Ã‘ÂÃÂ¾ÃÂ°Ã‘â€š] LT [ÃÂ´ÃÂ°]',
            lastDay : '[ÃÅ¡ÃÂµÃ‘â€¡ÃÂ° Ã‘ÂÃÂ¾ÃÂ°Ã‘â€š] LT [ÃÂ´ÃÂ°]',
            lastWeek : '[ÃÂ£Ã‘â€šÃÂ³ÃÂ°ÃÂ½] dddd [ÃÂºÃ‘Æ’ÃÂ½ÃÂ¸ Ã‘ÂÃÂ¾ÃÂ°Ã‘â€š] LT [ÃÂ´ÃÂ°]',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'ÃÂ¯ÃÂºÃÂ¸ÃÂ½ %s ÃÂ¸Ã‘â€¡ÃÂ¸ÃÂ´ÃÂ°',
            past : 'Ãâ€˜ÃÂ¸Ã‘â‚¬ ÃÂ½ÃÂµÃ‘â€¡ÃÂ° %s ÃÂ¾ÃÂ»ÃÂ´ÃÂ¸ÃÂ½',
            s : 'Ã‘â€žÃ‘Æ’Ã‘â‚¬Ã‘ÂÃÂ°Ã‘â€š',
            m : 'ÃÂ±ÃÂ¸Ã‘â‚¬ ÃÂ´ÃÂ°ÃÂºÃÂ¸ÃÂºÃÂ°',
            mm : '%d ÃÂ´ÃÂ°ÃÂºÃÂ¸ÃÂºÃÂ°',
            h : 'ÃÂ±ÃÂ¸Ã‘â‚¬ Ã‘ÂÃÂ¾ÃÂ°Ã‘â€š',
            hh : '%d Ã‘ÂÃÂ¾ÃÂ°Ã‘â€š',
            d : 'ÃÂ±ÃÂ¸Ã‘â‚¬ ÃÂºÃ‘Æ’ÃÂ½',
            dd : '%d ÃÂºÃ‘Æ’ÃÂ½',
            M : 'ÃÂ±ÃÂ¸Ã‘â‚¬ ÃÂ¾ÃÂ¹',
            MM : '%d ÃÂ¾ÃÂ¹',
            y : 'ÃÂ±ÃÂ¸Ã‘â‚¬ ÃÂ¹ÃÂ¸ÃÂ»',
            yy : '%d ÃÂ¹ÃÂ¸ÃÂ»'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : vietnamese (vi)
// author : Bang Nguyen : https://github.com/bangnk

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('vi', {
        months : 'thÃƒÂ¡ng 1_thÃƒÂ¡ng 2_thÃƒÂ¡ng 3_thÃƒÂ¡ng 4_thÃƒÂ¡ng 5_thÃƒÂ¡ng 6_thÃƒÂ¡ng 7_thÃƒÂ¡ng 8_thÃƒÂ¡ng 9_thÃƒÂ¡ng 10_thÃƒÂ¡ng 11_thÃƒÂ¡ng 12'.split('_'),
        monthsShort : 'Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12'.split('_'),
        weekdays : 'chÃ¡Â»Â§ nhÃ¡ÂºÂ­t_thÃ¡Â»Â© hai_thÃ¡Â»Â© ba_thÃ¡Â»Â© tÃ†Â°_thÃ¡Â»Â© nÃ„Æ’m_thÃ¡Â»Â© sÃƒÂ¡u_thÃ¡Â»Â© bÃ¡ÂºÂ£y'.split('_'),
        weekdaysShort : 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
        weekdaysMin : 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM [nÃ„Æ’m] YYYY',
            LLL : 'D MMMM [nÃ„Æ’m] YYYY LT',
            LLLL : 'dddd, D MMMM [nÃ„Æ’m] YYYY LT',
            l : 'DD/M/YYYY',
            ll : 'D MMM YYYY',
            lll : 'D MMM YYYY LT',
            llll : 'ddd, D MMM YYYY LT'
        },
        calendar : {
            sameDay: '[HÃƒÂ´m nay lÃƒÂºc] LT',
            nextDay: '[NgÃƒ y mai lÃƒÂºc] LT',
            nextWeek: 'dddd [tuÃ¡ÂºÂ§n tÃ¡Â»â€ºi lÃƒÂºc] LT',
            lastDay: '[HÃƒÂ´m qua lÃƒÂºc] LT',
            lastWeek: 'dddd [tuÃ¡ÂºÂ§n rÃ¡Â»â€œi lÃƒÂºc] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : '%s tÃ¡Â»â€ºi',
            past : '%s trÃ†Â°Ã¡Â»â€ºc',
            s : 'vÃƒ i giÃƒÂ¢y',
            m : 'mÃ¡Â»â„¢t phÃƒÂºt',
            mm : '%d phÃƒÂºt',
            h : 'mÃ¡Â»â„¢t giÃ¡Â»Â',
            hh : '%d giÃ¡Â»Â',
            d : 'mÃ¡Â»â„¢t ngÃƒ y',
            dd : '%d ngÃƒ y',
            M : 'mÃ¡Â»â„¢t thÃƒÂ¡ng',
            MM : '%d thÃƒÂ¡ng',
            y : 'mÃ¡Â»â„¢t nÃ„Æ’m',
            yy : '%d nÃ„Æ’m'
        },
        ordinalParse: /\d{1,2}/,
        ordinal : function (number) {
            return number;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : chinese (zh-cn)
// author : suupic : https://github.com/suupic
// author : Zeno Zeng : https://github.com/zenozeng

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('zh-cn', {
        months : 'Ã¤Â¸â‚¬Ã¦Å“Ë†_Ã¤ÂºÅ’Ã¦Å“Ë†_Ã¤Â¸â€°Ã¦Å“Ë†_Ã¥â€ºâ€ºÃ¦Å“Ë†_Ã¤Âºâ€Ã¦Å“Ë†_Ã¥â€¦Â­Ã¦Å“Ë†_Ã¤Â¸Æ’Ã¦Å“Ë†_Ã¥â€¦Â«Ã¦Å“Ë†_Ã¤Â¹ÂÃ¦Å“Ë†_Ã¥ÂÂÃ¦Å“Ë†_Ã¥ÂÂÃ¤Â¸â‚¬Ã¦Å“Ë†_Ã¥ÂÂÃ¤ÂºÅ’Ã¦Å“Ë†'.split('_'),
        monthsShort : '1Ã¦Å“Ë†_2Ã¦Å“Ë†_3Ã¦Å“Ë†_4Ã¦Å“Ë†_5Ã¦Å“Ë†_6Ã¦Å“Ë†_7Ã¦Å“Ë†_8Ã¦Å“Ë†_9Ã¦Å“Ë†_10Ã¦Å“Ë†_11Ã¦Å“Ë†_12Ã¦Å“Ë†'.split('_'),
        weekdays : 'Ã¦ËœÅ¸Ã¦Å“Å¸Ã¦â€”Â¥_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¤Â¸â‚¬_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¤ÂºÅ’_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¤Â¸â€°_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¥â€ºâ€º_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¤Âºâ€_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¥â€¦Â­'.split('_'),
        weekdaysShort : 'Ã¥â€˜Â¨Ã¦â€”Â¥_Ã¥â€˜Â¨Ã¤Â¸â‚¬_Ã¥â€˜Â¨Ã¤ÂºÅ’_Ã¥â€˜Â¨Ã¤Â¸â€°_Ã¥â€˜Â¨Ã¥â€ºâ€º_Ã¥â€˜Â¨Ã¤Âºâ€_Ã¥â€˜Â¨Ã¥â€¦Â­'.split('_'),
        weekdaysMin : 'Ã¦â€”Â¥_Ã¤Â¸â‚¬_Ã¤ÂºÅ’_Ã¤Â¸â€°_Ã¥â€ºâ€º_Ã¤Âºâ€_Ã¥â€¦Â­'.split('_'),
        longDateFormat : {
            LT : 'AhÃ§â€šÂ¹mm',
            LTS : 'AhÃ§â€šÂ¹mÃ¥Ë†â€ sÃ§Â§â€™',
            L : 'YYYY-MM-DD',
            LL : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥',
            LLL : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥LT',
            LLLL : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥ddddLT',
            l : 'YYYY-MM-DD',
            ll : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥',
            lll : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥LT',
            llll : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥ddddLT'
        },
        meridiemParse: /Ã¥â€¡Å’Ã¦â„¢Â¨|Ã¦â€”Â©Ã¤Â¸Å |Ã¤Â¸Å Ã¥ÂË†|Ã¤Â¸Â­Ã¥ÂË†|Ã¤Â¸â€¹Ã¥ÂË†|Ã¦â„¢Å¡Ã¤Â¸Å /,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'Ã¥â€¡Å’Ã¦â„¢Â¨' || meridiem === 'Ã¦â€”Â©Ã¤Â¸Å ' ||
                    meridiem === 'Ã¤Â¸Å Ã¥ÂË†') {
                return hour;
            } else if (meridiem === 'Ã¤Â¸â€¹Ã¥ÂË†' || meridiem === 'Ã¦â„¢Å¡Ã¤Â¸Å ') {
                return hour + 12;
            } else {
                // 'Ã¤Â¸Â­Ã¥ÂË†'
                return hour >= 11 ? hour : hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 600) {
                return 'Ã¥â€¡Å’Ã¦â„¢Â¨';
            } else if (hm < 900) {
                return 'Ã¦â€”Â©Ã¤Â¸Å ';
            } else if (hm < 1130) {
                return 'Ã¤Â¸Å Ã¥ÂË†';
            } else if (hm < 1230) {
                return 'Ã¤Â¸Â­Ã¥ÂË†';
            } else if (hm < 1800) {
                return 'Ã¤Â¸â€¹Ã¥ÂË†';
            } else {
                return 'Ã¦â„¢Å¡Ã¤Â¸Å ';
            }
        },
        calendar : {
            sameDay : function () {
                return this.minutes() === 0 ? '[Ã¤Â»Å Ã¥Â¤Â©]Ah[Ã§â€šÂ¹Ã¦â€¢Â´]' : '[Ã¤Â»Å Ã¥Â¤Â©]LT';
            },
            nextDay : function () {
                return this.minutes() === 0 ? '[Ã¦ËœÅ½Ã¥Â¤Â©]Ah[Ã§â€šÂ¹Ã¦â€¢Â´]' : '[Ã¦ËœÅ½Ã¥Â¤Â©]LT';
            },
            lastDay : function () {
                return this.minutes() === 0 ? '[Ã¦ËœÂ¨Ã¥Â¤Â©]Ah[Ã§â€šÂ¹Ã¦â€¢Â´]' : '[Ã¦ËœÂ¨Ã¥Â¤Â©]LT';
            },
            nextWeek : function () {
                var startOfWeek, prefix;
                startOfWeek = moment().startOf('week');
                prefix = this.unix() - startOfWeek.unix() >= 7 * 24 * 3600 ? '[Ã¤Â¸â€¹]' : '[Ã¦Å“Â¬]';
                return this.minutes() === 0 ? prefix + 'dddAhÃ§â€šÂ¹Ã¦â€¢Â´' : prefix + 'dddAhÃ§â€šÂ¹mm';
            },
            lastWeek : function () {
                var startOfWeek, prefix;
                startOfWeek = moment().startOf('week');
                prefix = this.unix() < startOfWeek.unix()  ? '[Ã¤Â¸Å ]' : '[Ã¦Å“Â¬]';
                return this.minutes() === 0 ? prefix + 'dddAhÃ§â€šÂ¹Ã¦â€¢Â´' : prefix + 'dddAhÃ§â€šÂ¹mm';
            },
            sameElse : 'LL'
        },
        ordinalParse: /\d{1,2}(Ã¦â€”Â¥|Ã¦Å“Ë†|Ã¥â€˜Â¨)/,
        ordinal : function (number, period) {
            switch (period) {
            case 'd':
            case 'D':
            case 'DDD':
                return number + 'Ã¦â€”Â¥';
            case 'M':
                return number + 'Ã¦Å“Ë†';
            case 'w':
            case 'W':
                return number + 'Ã¥â€˜Â¨';
            default:
                return number;
            }
        },
        relativeTime : {
            future : '%sÃ¥â€ â€¦',
            past : '%sÃ¥â€°Â',
            s : 'Ã¥â€¡ Ã§Â§â€™',
            m : '1Ã¥Ë†â€ Ã©â€™Å¸',
            mm : '%dÃ¥Ë†â€ Ã©â€™Å¸',
            h : '1Ã¥Â°ÂÃ¦â€”Â¶',
            hh : '%dÃ¥Â°ÂÃ¦â€”Â¶',
            d : '1Ã¥Â¤Â©',
            dd : '%dÃ¥Â¤Â©',
            M : '1Ã¤Â¸ÂªÃ¦Å“Ë†',
            MM : '%dÃ¤Â¸ÂªÃ¦Å“Ë†',
            y : '1Ã¥Â¹Â´',
            yy : '%dÃ¥Â¹Â´'
        },
        week : {
            // GB/T 7408-1994Ã£â‚¬Å Ã¦â€¢Â°Ã¦ÂÂ®Ã¥â€¦Æ’Ã¥â€™Å’Ã¤ÂºÂ¤Ã¦ÂÂ¢Ã¦ Â¼Ã¥Â¼ÂÃ‚Â·Ã¤Â¿Â¡Ã¦ÂÂ¯Ã¤ÂºÂ¤Ã¦ÂÂ¢Ã‚Â·Ã¦â€”Â¥Ã¦Å“Å¸Ã¥â€™Å’Ã¦â€”Â¶Ã©â€”Â´Ã¨Â¡Â¨Ã§Â¤ÂºÃ¦Â³â€¢Ã£â‚¬â€¹Ã¤Â¸Å½ISO 8601:1988Ã§Â­â€°Ã¦â€¢Ë†
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : traditional chinese (zh-tw)
// author : Ben : https://github.com/ben-lin

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('zh-tw', {
        months : 'Ã¤Â¸â‚¬Ã¦Å“Ë†_Ã¤ÂºÅ’Ã¦Å“Ë†_Ã¤Â¸â€°Ã¦Å“Ë†_Ã¥â€ºâ€ºÃ¦Å“Ë†_Ã¤Âºâ€Ã¦Å“Ë†_Ã¥â€¦Â­Ã¦Å“Ë†_Ã¤Â¸Æ’Ã¦Å“Ë†_Ã¥â€¦Â«Ã¦Å“Ë†_Ã¤Â¹ÂÃ¦Å“Ë†_Ã¥ÂÂÃ¦Å“Ë†_Ã¥ÂÂÃ¤Â¸â‚¬Ã¦Å“Ë†_Ã¥ÂÂÃ¤ÂºÅ’Ã¦Å“Ë†'.split('_'),
        monthsShort : '1Ã¦Å“Ë†_2Ã¦Å“Ë†_3Ã¦Å“Ë†_4Ã¦Å“Ë†_5Ã¦Å“Ë†_6Ã¦Å“Ë†_7Ã¦Å“Ë†_8Ã¦Å“Ë†_9Ã¦Å“Ë†_10Ã¦Å“Ë†_11Ã¦Å“Ë†_12Ã¦Å“Ë†'.split('_'),
        weekdays : 'Ã¦ËœÅ¸Ã¦Å“Å¸Ã¦â€”Â¥_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¤Â¸â‚¬_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¤ÂºÅ’_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¤Â¸â€°_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¥â€ºâ€º_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¤Âºâ€_Ã¦ËœÅ¸Ã¦Å“Å¸Ã¥â€¦Â­'.split('_'),
        weekdaysShort : 'Ã©â‚¬Â±Ã¦â€”Â¥_Ã©â‚¬Â±Ã¤Â¸â‚¬_Ã©â‚¬Â±Ã¤ÂºÅ’_Ã©â‚¬Â±Ã¤Â¸â€°_Ã©â‚¬Â±Ã¥â€ºâ€º_Ã©â‚¬Â±Ã¤Âºâ€_Ã©â‚¬Â±Ã¥â€¦Â­'.split('_'),
        weekdaysMin : 'Ã¦â€”Â¥_Ã¤Â¸â‚¬_Ã¤ÂºÅ’_Ã¤Â¸â€°_Ã¥â€ºâ€º_Ã¤Âºâ€_Ã¥â€¦Â­'.split('_'),
        longDateFormat : {
            LT : 'AhÃ©Â»Å¾mm',
            LTS : 'AhÃ©Â»Å¾mÃ¥Ë†â€ sÃ§Â§â€™',
            L : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥',
            LL : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥',
            LLL : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥LT',
            LLLL : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥ddddLT',
            l : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥',
            ll : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥',
            lll : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥LT',
            llll : 'YYYYÃ¥Â¹Â´MMMDÃ¦â€”Â¥ddddLT'
        },
        meridiemParse: /Ã¦â€”Â©Ã¤Â¸Å |Ã¤Â¸Å Ã¥ÂË†|Ã¤Â¸Â­Ã¥ÂË†|Ã¤Â¸â€¹Ã¥ÂË†|Ã¦â„¢Å¡Ã¤Â¸Å /,

        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'Ã¦â€”Â©Ã¤Â¸Å ' || meridiem === 'Ã¤Â¸Å Ã¥ÂË†') {
                return hour;
            } else if (meridiem === 'Ã¤Â¸Â­Ã¥ÂË†') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'Ã¤Â¸â€¹Ã¥ÂË†' || meridiem === 'Ã¦â„¢Å¡Ã¤Â¸Å ') {
                return hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 900) {
                return 'Ã¦â€”Â©Ã¤Â¸Å ';
            } else if (hm < 1130) {
                return 'Ã¤Â¸Å Ã¥ÂË†';
            } else if (hm < 1230) {
                return 'Ã¤Â¸Â­Ã¥ÂË†';
            } else if (hm < 1800) {
                return 'Ã¤Â¸â€¹Ã¥ÂË†';
            } else {
                return 'Ã¦â„¢Å¡Ã¤Â¸Å ';
            }
        },
        calendar : {
            sameDay : '[Ã¤Â»Å Ã¥Â¤Â©]LT',
            nextDay : '[Ã¦ËœÅ½Ã¥Â¤Â©]LT',
            nextWeek : '[Ã¤Â¸â€¹]ddddLT',
            lastDay : '[Ã¦ËœÂ¨Ã¥Â¤Â©]LT',
            lastWeek : '[Ã¤Â¸Å ]ddddLT',
            sameElse : 'L'
        },
        ordinalParse: /\d{1,2}(Ã¦â€”Â¥|Ã¦Å“Ë†|Ã©â‚¬Â±)/,
        ordinal : function (number, period) {
            switch (period) {
            case 'd' :
            case 'D' :
            case 'DDD' :
                return number + 'Ã¦â€”Â¥';
            case 'M' :
                return number + 'Ã¦Å“Ë†';
            case 'w' :
            case 'W' :
                return number + 'Ã©â‚¬Â±';
            default :
                return number;
            }
        },
        relativeTime : {
            future : '%sÃ¥â€¦Â§',
            past : '%sÃ¥â€°Â',
            s : 'Ã¥Â¹Â¾Ã§Â§â€™',
            m : 'Ã¤Â¸â‚¬Ã¥Ë†â€ Ã©ÂËœ',
            mm : '%dÃ¥Ë†â€ Ã©ÂËœ',
            h : 'Ã¤Â¸â‚¬Ã¥Â°ÂÃ¦â„¢â€š',
            hh : '%dÃ¥Â°ÂÃ¦â„¢â€š',
            d : 'Ã¤Â¸â‚¬Ã¥Â¤Â©',
            dd : '%dÃ¥Â¤Â©',
            M : 'Ã¤Â¸â‚¬Ã¥â‚¬â€¹Ã¦Å“Ë†',
            MM : '%dÃ¥â‚¬â€¹Ã¦Å“Ë†',
            y : 'Ã¤Â¸â‚¬Ã¥Â¹Â´',
            yy : '%dÃ¥Â¹Â´'
        }
    });
}));

    moment.locale('en');


    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                    'Accessing Moment through the global scope is ' +
                    'deprecated, and will be removed in an upcoming ' +
                    'release.',
                    moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === 'function' && define.amd) {
        define(function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);




/*! version : 4.17.37
 =========================================================
 bootstrap-datetimejs
 https://github.com/Eonasdan/bootstrap-datetimepicker
 Copyright (c) 2015 Jonathan Peterson
 =========================================================
 */
!function(a){"use strict";if("function"==typeof define&&define.amd)define(["jquery","moment"],a);else if("object"==typeof exports)a(require("jquery"),require("moment"));else{if("undefined"==typeof jQuery)throw"bootstrap-datetimepicker requires jQuery to be loaded first";if("undefined"==typeof moment)throw"bootstrap-datetimepicker requires Moment.js to be loaded first";a(jQuery,moment)}}(function(a,b){"use strict";if(!b)throw new Error("bootstrap-datetimepicker requires Moment.js to be loaded first");var c=function(c,d){var e,f,g,h,i,j,k,l={},m=!0,n=!1,o=!1,p=0,q=[{clsName:"days",navFnc:"M",navStep:1},{clsName:"months",navFnc:"y",navStep:1},{clsName:"years",navFnc:"y",navStep:10},{clsName:"decades",navFnc:"y",navStep:100}],r=["days","months","years","decades"],s=["top","bottom","auto"],t=["left","right","auto"],u=["default","top","bottom"],v={up:38,38:"up",down:40,40:"down",left:37,37:"left",right:39,39:"right",tab:9,9:"tab",escape:27,27:"escape",enter:13,13:"enter",pageUp:33,33:"pageUp",pageDown:34,34:"pageDown",shift:16,16:"shift",control:17,17:"control",space:32,32:"space",t:84,84:"t","delete":46,46:"delete"},w={},x=function(a){var c,e,f,g,h,i=!1;return void 0!==b.tz&&void 0!==d.timeZone&&null!==d.timeZone&&""!==d.timeZone&&(i=!0),void 0===a||null===a?c=i?b().tz(d.timeZone).startOf("d"):b().startOf("d"):i?(e=b().tz(d.timeZone).utcOffset(),f=b(a,j,d.useStrict).utcOffset(),f!==e?(g=b().tz(d.timeZone).format("Z"),h=b(a,j,d.useStrict).format("YYYY-MM-DD[T]HH:mm:ss")+g,c=b(h,j,d.useStrict).tz(d.timeZone)):c=b(a,j,d.useStrict).tz(d.timeZone)):c=b(a,j,d.useStrict),c},y=function(a){if("string"!=typeof a||a.length>1)throw new TypeError("isEnabled expects a single character string parameter");switch(a){case"y":return-1!==i.indexOf("Y");case"M":return-1!==i.indexOf("M");case"d":return-1!==i.toLowerCase().indexOf("d");case"h":case"H":return-1!==i.toLowerCase().indexOf("h");case"m":return-1!==i.indexOf("m");case"s":return-1!==i.indexOf("s");default:return!1}},z=function(){return y("h")||y("m")||y("s")},A=function(){return y("y")||y("M")||y("d")},B=function(){var b=a("<thead>").append(a("<tr>").append(a("<th>").addClass("prev").attr("data-action","previous").append(a("<span>").addClass(d.icons.previous))).append(a("<th>").addClass("picker-switch").attr("data-action","pickerSwitch").attr("colspan",d.calendarWeeks?"6":"5")).append(a("<th>").addClass("next").attr("data-action","next").append(a("<span>").addClass(d.icons.next)))),c=a("<tbody>").append(a("<tr>").append(a("<td>").attr("colspan",d.calendarWeeks?"8":"7")));return[a("<div>").addClass("datepicker-days").append(a("<table>").addClass("table-condensed").append(b).append(a("<tbody>"))),a("<div>").addClass("datepicker-months").append(a("<table>").addClass("table-condensed").append(b.clone()).append(c.clone())),a("<div>").addClass("datepicker-years").append(a("<table>").addClass("table-condensed").append(b.clone()).append(c.clone())),a("<div>").addClass("datepicker-decades").append(a("<table>").addClass("table-condensed").append(b.clone()).append(c.clone()))]},C=function(){var b=a("<tr>"),c=a("<tr>"),e=a("<tr>");return y("h")&&(b.append(a("<td>").append(a("<a>").attr({href:"#",tabindex:"-1",title:d.tooltips.incrementHour}).addClass("btn").attr("data-action","incrementHours").append(a("<span>").addClass(d.icons.up)))),c.append(a("<td>").append(a("<span>").addClass("timepicker-hour").attr({"data-time-component":"hours",title:d.tooltips.pickHour}).attr("data-action","showHours"))),e.append(a("<td>").append(a("<a>").attr({href:"#",tabindex:"-1",title:d.tooltips.decrementHour}).addClass("btn").attr("data-action","decrementHours").append(a("<span>").addClass(d.icons.down))))),y("m")&&(y("h")&&(b.append(a("<td>").addClass("separator")),c.append(a("<td>").addClass("separator").html(":")),e.append(a("<td>").addClass("separator"))),b.append(a("<td>").append(a("<a>").attr({href:"#",tabindex:"-1",title:d.tooltips.incrementMinute}).addClass("btn").attr("data-action","incrementMinutes").append(a("<span>").addClass(d.icons.up)))),c.append(a("<td>").append(a("<span>").addClass("timepicker-minute").attr({"data-time-component":"minutes",title:d.tooltips.pickMinute}).attr("data-action","showMinutes"))),e.append(a("<td>").append(a("<a>").attr({href:"#",tabindex:"-1",title:d.tooltips.decrementMinute}).addClass("btn").attr("data-action","decrementMinutes").append(a("<span>").addClass(d.icons.down))))),y("s")&&(y("m")&&(b.append(a("<td>").addClass("separator")),c.append(a("<td>").addClass("separator").html(":")),e.append(a("<td>").addClass("separator"))),b.append(a("<td>").append(a("<a>").attr({href:"#",tabindex:"-1",title:d.tooltips.incrementSecond}).addClass("btn").attr("data-action","incrementSeconds").append(a("<span>").addClass(d.icons.up)))),c.append(a("<td>").append(a("<span>").addClass("timepicker-second").attr({"data-time-component":"seconds",title:d.tooltips.pickSecond}).attr("data-action","showSeconds"))),e.append(a("<td>").append(a("<a>").attr({href:"#",tabindex:"-1",title:d.tooltips.decrementSecond}).addClass("btn").attr("data-action","decrementSeconds").append(a("<span>").addClass(d.icons.down))))),h||(b.append(a("<td>").addClass("separator")),c.append(a("<td>").append(a("<button>").addClass("btn btn-primary").attr({"data-action":"togglePeriod",tabindex:"-1",title:d.tooltips.togglePeriod}))),e.append(a("<td>").addClass("separator"))),a("<div>").addClass("timepicker-picker").append(a("<table>").addClass("table-condensed").append([b,c,e]))},D=function(){var b=a("<div>").addClass("timepicker-hours").append(a("<table>").addClass("table-condensed")),c=a("<div>").addClass("timepicker-minutes").append(a("<table>").addClass("table-condensed")),d=a("<div>").addClass("timepicker-seconds").append(a("<table>").addClass("table-condensed")),e=[C()];return y("h")&&e.push(b),y("m")&&e.push(c),y("s")&&e.push(d),e},E=function(){var b=[];return d.showTodayButton&&b.push(a("<td>").append(a("<a>").attr({"data-action":"today",title:d.tooltips.today}).append(a("<span>").addClass(d.icons.today)))),!d.sideBySide&&A()&&z()&&b.push(a("<td>").append(a("<a>").attr({"data-action":"togglePicker",title:d.tooltips.selectTime}).append(a("<span>").addClass(d.icons.time)))),d.showClear&&b.push(a("<td>").append(a("<a>").attr({"data-action":"clear",title:d.tooltips.clear}).append(a("<span>").addClass(d.icons.clear)))),d.showClose&&b.push(a("<td>").append(a("<a>").attr({"data-action":"close",title:d.tooltips.close}).append(a("<span>").addClass(d.icons.close)))),a("<table>").addClass("table-condensed").append(a("<tbody>").append(a("<tr>").append(b)))},F=function(){var b=a("<div>").addClass("bootstrap-datetimepicker-widget dropdown-menu"),c=a("<div>").addClass("datepicker").append(B()),e=a("<div>").addClass("timepicker").append(D()),f=a("<ul>").addClass("list-unstyled"),g=a("<li>").addClass("picker-switch"+(d.collapse?" accordion-toggle":"")).append(E());return d.inline&&b.removeClass("dropdown-menu"),h&&b.addClass("usetwentyfour"),y("s")&&!h&&b.addClass("wider"),d.sideBySide&&A()&&z()?(b.addClass("timepicker-sbs"),"top"===d.toolbarPlacement&&b.append(g),b.append(a("<div>").addClass("row").append(c.addClass("col-md-6")).append(e.addClass("col-md-6"))),"bottom"===d.toolbarPlacement&&b.append(g),b):("top"===d.toolbarPlacement&&f.append(g),A()&&f.append(a("<li>").addClass(d.collapse&&z()?"collapse in":"").append(c)),"default"===d.toolbarPlacement&&f.append(g),z()&&f.append(a("<li>").addClass(d.collapse&&A()?"collapse":"").append(e)),"bottom"===d.toolbarPlacement&&f.append(g),b.append(f))},G=function(){var b,e={};return b=c.is("input")||d.inline?c.data():c.find("input").data(),b.dateOptions&&b.dateOptions instanceof Object&&(e=a.extend(!0,e,b.dateOptions)),a.each(d,function(a){var c="date"+a.charAt(0).toUpperCase()+a.slice(1);void 0!==b[c]&&(e[a]=b[c])}),e},H=function(){var b,e=(n||c).position(),f=(n||c).offset(),g=d.widgetPositioning.vertical,h=d.widgetPositioning.horizontal;if(d.widgetParent)b=d.widgetParent.append(o);else if(c.is("input"))b=c.after(o).parent();else{if(d.inline)return void(b=c.append(o));b=c,c.children().first().after(o)}if("auto"===g&&(g=f.top+1.5*o.height()>=a(window).height()+a(window).scrollTop()&&o.height()+c.outerHeight()<f.top?"top":"bottom"),"auto"===h&&(h=b.width()<f.left+o.outerWidth()/2&&f.left+o.outerWidth()>a(window).width()?"right":"left"),"top"===g?o.addClass("top").removeClass("bottom"):o.addClass("bottom").removeClass("top"),"right"===h?o.addClass("pull-right"):o.removeClass("pull-right"),"relative"!==b.css("position")&&(b=b.parents().filter(function(){return"relative"===a(this).css("position")}).first()),0===b.length)throw new Error("datetimepicker component should be placed within a relative positioned container");o.css({top:"top"===g?"auto":e.top+c.outerHeight(),bottom:"top"===g?e.top+c.outerHeight():"auto",left:"left"===h?b===c?0:e.left:"auto",right:"left"===h?"auto":b.outerWidth()-c.outerWidth()-(b===c?0:e.left)})},I=function(a){"dp.change"===a.type&&(a.date&&a.date.isSame(a.oldDate)||!a.date&&!a.oldDate)||c.trigger(a)},J=function(a){"y"===a&&(a="YYYY"),I({type:"dp.update",change:a,viewDate:f.clone()})},K=function(a){o&&(a&&(k=Math.max(p,Math.min(3,k+a))),o.find(".datepicker > div").hide().filter(".datepicker-"+q[k].clsName).show())},L=function(){var b=a("<tr>"),c=f.clone().startOf("w").startOf("d");for(d.calendarWeeks===!0&&b.append(a("<th>").addClass("cw").text("#"));c.isBefore(f.clone().endOf("w"));)b.append(a("<th>").addClass("dow").text(c.format("dd"))),c.add(1,"d");o.find(".datepicker-days thead").append(b)},M=function(a){return d.disabledDates[a.format("YYYY-MM-DD")]===!0},N=function(a){return d.enabledDates[a.format("YYYY-MM-DD")]===!0},O=function(a){return d.disabledHours[a.format("H")]===!0},P=function(a){return d.enabledHours[a.format("H")]===!0},Q=function(b,c){if(!b.isValid())return!1;if(d.disabledDates&&"d"===c&&M(b))return!1;if(d.enabledDates&&"d"===c&&!N(b))return!1;if(d.minDate&&b.isBefore(d.minDate,c))return!1;if(d.maxDate&&b.isAfter(d.maxDate,c))return!1;if(d.daysOfWeekDisabled&&"d"===c&&-1!==d.daysOfWeekDisabled.indexOf(b.day()))return!1;if(d.disabledHours&&("h"===c||"m"===c||"s"===c)&&O(b))return!1;if(d.enabledHours&&("h"===c||"m"===c||"s"===c)&&!P(b))return!1;if(d.disabledTimeIntervals&&("h"===c||"m"===c||"s"===c)){var e=!1;if(a.each(d.disabledTimeIntervals,function(){return b.isBetween(this[0],this[1])?(e=!0,!1):void 0}),e)return!1}return!0},R=function(){for(var b=[],c=f.clone().startOf("y").startOf("d");c.isSame(f,"y");)b.push(a("<span>").attr("data-action","selectMonth").addClass("month").text(c.format("MMM"))),c.add(1,"M");o.find(".datepicker-months td").empty().append(b)},S=function(){var b=o.find(".datepicker-months"),c=b.find("th"),g=b.find("tbody").find("span");c.eq(0).find("span").attr("title",d.tooltips.prevYear),c.eq(1).attr("title",d.tooltips.selectYear),c.eq(2).find("span").attr("title",d.tooltips.nextYear),b.find(".disabled").removeClass("disabled"),Q(f.clone().subtract(1,"y"),"y")||c.eq(0).addClass("disabled"),c.eq(1).text(f.year()),Q(f.clone().add(1,"y"),"y")||c.eq(2).addClass("disabled"),g.removeClass("active"),e.isSame(f,"y")&&!m&&g.eq(e.month()).addClass("active"),g.each(function(b){Q(f.clone().month(b),"M")||a(this).addClass("disabled")})},T=function(){var a=o.find(".datepicker-years"),b=a.find("th"),c=f.clone().subtract(5,"y"),g=f.clone().add(6,"y"),h="";for(b.eq(0).find("span").attr("title",d.tooltips.prevDecade),b.eq(1).attr("title",d.tooltips.selectDecade),b.eq(2).find("span").attr("title",d.tooltips.nextDecade),a.find(".disabled").removeClass("disabled"),d.minDate&&d.minDate.isAfter(c,"y")&&b.eq(0).addClass("disabled"),b.eq(1).text(c.year()+"-"+g.year()),d.maxDate&&d.maxDate.isBefore(g,"y")&&b.eq(2).addClass("disabled");!c.isAfter(g,"y");)h+='<span data-action="selectYear" class="year'+(c.isSame(e,"y")&&!m?" active":"")+(Q(c,"y")?"":" disabled")+'">'+c.year()+"</span>",c.add(1,"y");a.find("td").html(h)},U=function(){var a=o.find(".datepicker-decades"),c=a.find("th"),g=b({y:f.year()-f.year()%100-1}),h=g.clone().add(100,"y"),i=g.clone(),j="";for(c.eq(0).find("span").attr("title",d.tooltips.prevCentury),c.eq(2).find("span").attr("title",d.tooltips.nextCentury),a.find(".disabled").removeClass("disabled"),(g.isSame(b({y:1900}))||d.minDate&&d.minDate.isAfter(g,"y"))&&c.eq(0).addClass("disabled"),c.eq(1).text(g.year()+"-"+h.year()),(g.isSame(b({y:2e3}))||d.maxDate&&d.maxDate.isBefore(h,"y"))&&c.eq(2).addClass("disabled");!g.isAfter(h,"y");)j+='<span data-action="selectDecade" class="decade'+(g.isSame(e,"y")?" active":"")+(Q(g,"y")?"":" disabled")+'" data-selection="'+(g.year()+6)+'">'+(g.year()+1)+" - "+(g.year()+12)+"</span>",g.add(12,"y");j+="<span></span><span></span><span></span>",a.find("td").html(j),c.eq(1).text(i.year()+1+"-"+g.year())},V=function(){var b,c,g,h,i=o.find(".datepicker-days"),j=i.find("th"),k=[];if(A()){for(j.eq(0).find("span").attr("title",d.tooltips.prevMonth),j.eq(1).attr("title",d.tooltips.selectMonth),j.eq(2).find("span").attr("title",d.tooltips.nextMonth),i.find(".disabled").removeClass("disabled"),j.eq(1).text(f.format(d.dayViewHeaderFormat)),Q(f.clone().subtract(1,"M"),"M")||j.eq(0).addClass("disabled"),Q(f.clone().add(1,"M"),"M")||j.eq(2).addClass("disabled"),b=f.clone().startOf("M").startOf("w").startOf("d"),h=0;42>h;h++)0===b.weekday()&&(c=a("<tr>"),d.calendarWeeks&&c.append('<td class="cw">'+b.week()+"</td>"),k.push(c)),g="",b.isBefore(f,"M")&&(g+=" old"),b.isAfter(f,"M")&&(g+=" new"),b.isSame(e,"d")&&!m&&(g+=" active"),Q(b,"d")||(g+=" disabled"),b.isSame(x(),"d")&&(g+=" today"),(0===b.day()||6===b.day())&&(g+=" weekend"),c.append('<td data-action="selectDay" data-day="'+b.format("L")+'" class="day'+g+'">'+b.date()+"</td>"),b.add(1,"d");i.find("tbody").empty().append(k),S(),T(),U()}},W=function(){var b=o.find(".timepicker-hours table"),c=f.clone().startOf("d"),d=[],e=a("<tr>");for(f.hour()>11&&!h&&c.hour(12);c.isSame(f,"d")&&(h||f.hour()<12&&c.hour()<12||f.hour()>11);)c.hour()%4===0&&(e=a("<tr>"),d.push(e)),e.append('<td data-action="selectHour" class="hour'+(Q(c,"h")?"":" disabled")+'">'+c.format(h?"HH":"hh")+"</td>"),c.add(1,"h");b.empty().append(d)},X=function(){for(var b=o.find(".timepicker-minutes table"),c=f.clone().startOf("h"),e=[],g=a("<tr>"),h=1===d.stepping?5:d.stepping;f.isSame(c,"h");)c.minute()%(4*h)===0&&(g=a("<tr>"),e.push(g)),g.append('<td data-action="selectMinute" class="minute'+(Q(c,"m")?"":" disabled")+'">'+c.format("mm")+"</td>"),c.add(h,"m");b.empty().append(e)},Y=function(){for(var b=o.find(".timepicker-seconds table"),c=f.clone().startOf("m"),d=[],e=a("<tr>");f.isSame(c,"m");)c.second()%20===0&&(e=a("<tr>"),d.push(e)),e.append('<td data-action="selectSecond" class="second'+(Q(c,"s")?"":" disabled")+'">'+c.format("ss")+"</td>"),c.add(5,"s");b.empty().append(d)},Z=function(){var a,b,c=o.find(".timepicker span[data-time-component]");h||(a=o.find(".timepicker [data-action=togglePeriod]"),b=e.clone().add(e.hours()>=12?-12:12,"h"),a.text(e.format("A")),Q(b,"h")?a.removeClass("disabled"):a.addClass("disabled")),c.filter("[data-time-component=hours]").text(e.format(h?"HH":"hh")),c.filter("[data-time-component=minutes]").text(e.format("mm")),c.filter("[data-time-component=seconds]").text(e.format("ss")),W(),X(),Y()},$=function(){o&&(V(),Z())},_=function(a){var b=m?null:e;return a?(a=a.clone().locale(d.locale),1!==d.stepping&&a.minutes(Math.round(a.minutes()/d.stepping)*d.stepping%60).seconds(0),void(Q(a)?(e=a,f=e.clone(),g.val(e.format(i)),c.data("date",e.format(i)),m=!1,$(),I({type:"dp.change",date:e.clone(),oldDate:b})):(d.keepInvalid||g.val(m?"":e.format(i)),I({type:"dp.error",date:a})))):(m=!0,g.val(""),c.data("date",""),I({type:"dp.change",date:!1,oldDate:b}),void $())},aa=function(){var b=!1;return o?(o.find(".collapse").each(function(){var c=a(this).data("collapse");return c&&c.transitioning?(b=!0,!1):!0}),b?l:(n&&n.hasClass("btn")&&n.toggleClass("active"),o.hide(),a(window).off("resize",H),o.off("click","[data-action]"),o.off("mousedown",!1),o.remove(),o=!1,I({type:"dp.hide",date:e.clone()}),g.blur(),l)):l},ba=function(){_(null)},ca={next:function(){var a=q[k].navFnc;f.add(q[k].navStep,a),V(),J(a)},previous:function(){var a=q[k].navFnc;f.subtract(q[k].navStep,a),V(),J(a)},pickerSwitch:function(){K(1)},selectMonth:function(b){var c=a(b.target).closest("tbody").find("span").index(a(b.target));f.month(c),k===p?(_(e.clone().year(f.year()).month(f.month())),d.inline||aa()):(K(-1),V()),J("M")},selectYear:function(b){var c=parseInt(a(b.target).text(),10)||0;f.year(c),k===p?(_(e.clone().year(f.year())),d.inline||aa()):(K(-1),V()),J("YYYY")},selectDecade:function(b){var c=parseInt(a(b.target).data("selection"),10)||0;f.year(c),k===p?(_(e.clone().year(f.year())),d.inline||aa()):(K(-1),V()),J("YYYY")},selectDay:function(b){var c=f.clone();a(b.target).is(".old")&&c.subtract(1,"M"),a(b.target).is(".new")&&c.add(1,"M"),_(c.date(parseInt(a(b.target).text(),10))),z()||d.keepOpen||d.inline||aa()},incrementHours:function(){var a=e.clone().add(1,"h");Q(a,"h")&&_(a)},incrementMinutes:function(){var a=e.clone().add(d.stepping,"m");Q(a,"m")&&_(a)},incrementSeconds:function(){var a=e.clone().add(1,"s");Q(a,"s")&&_(a)},decrementHours:function(){var a=e.clone().subtract(1,"h");Q(a,"h")&&_(a)},decrementMinutes:function(){var a=e.clone().subtract(d.stepping,"m");Q(a,"m")&&_(a)},decrementSeconds:function(){var a=e.clone().subtract(1,"s");Q(a,"s")&&_(a)},togglePeriod:function(){_(e.clone().add(e.hours()>=12?-12:12,"h"))},togglePicker:function(b){var c,e=a(b.target),f=e.closest("ul"),g=f.find(".in"),h=f.find(".collapse:not(.in)");if(g&&g.length){if(c=g.data("collapse"),c&&c.transitioning)return;g.collapse?(g.collapse("hide"),h.collapse("show")):(g.removeClass("in"),h.addClass("in")),e.is("span")?e.toggleClass(d.icons.time+" "+d.icons.date):e.find("span").toggleClass(d.icons.time+" "+d.icons.date)}},showPicker:function(){o.find(".timepicker > div:not(.timepicker-picker)").hide(),o.find(".timepicker .timepicker-picker").show()},showHours:function(){o.find(".timepicker .timepicker-picker").hide(),o.find(".timepicker .timepicker-hours").show()},showMinutes:function(){o.find(".timepicker .timepicker-picker").hide(),o.find(".timepicker .timepicker-minutes").show()},showSeconds:function(){o.find(".timepicker .timepicker-picker").hide(),o.find(".timepicker .timepicker-seconds").show()},selectHour:function(b){var c=parseInt(a(b.target).text(),10);h||(e.hours()>=12?12!==c&&(c+=12):12===c&&(c=0)),_(e.clone().hours(c)),ca.showPicker.call(l)},selectMinute:function(b){_(e.clone().minutes(parseInt(a(b.target).text(),10))),ca.showPicker.call(l)},selectSecond:function(b){_(e.clone().seconds(parseInt(a(b.target).text(),10))),ca.showPicker.call(l)},clear:ba,today:function(){var a=x();Q(a,"d")&&_(a)},close:aa},da=function(b){return a(b.currentTarget).is(".disabled")?!1:(ca[a(b.currentTarget).data("action")].apply(l,arguments),!1)},ea=function(){var b,c={year:function(a){return a.month(0).date(1).hours(0).seconds(0).minutes(0)},month:function(a){return a.date(1).hours(0).seconds(0).minutes(0)},day:function(a){return a.hours(0).seconds(0).minutes(0)},hour:function(a){return a.seconds(0).minutes(0)},minute:function(a){return a.seconds(0)}};return g.prop("disabled")||!d.ignoreReadonly&&g.prop("readonly")||o?l:(void 0!==g.val()&&0!==g.val().trim().length?_(ga(g.val().trim())):d.useCurrent&&m&&(g.is("input")&&0===g.val().trim().length||d.inline)&&(b=x(),"string"==typeof d.useCurrent&&(b=c[d.useCurrent](b)),_(b)),o=F(),L(),R(),o.find(".timepicker-hours").hide(),o.find(".timepicker-minutes").hide(),o.find(".timepicker-seconds").hide(),$(),K(),a(window).on("resize",H),o.on("click","[data-action]",da),o.on("mousedown",!1),n&&n.hasClass("btn")&&n.toggleClass("active"),o.show(),H(),d.focusOnShow&&!g.is(":focus")&&g.focus(),I({type:"dp.show"}),l)},fa=function(){return o?aa():ea()},ga=function(a){return a=void 0===d.parseInputDate?b.isMoment(a)||a instanceof Date?b(a):x(a):d.parseInputDate(a),a.locale(d.locale),a},ha=function(a){var b,c,e,f,g=null,h=[],i={},j=a.which,k="p";w[j]=k;for(b in w)w.hasOwnProperty(b)&&w[b]===k&&(h.push(b),parseInt(b,10)!==j&&(i[b]=!0));for(b in d.keyBinds)if(d.keyBinds.hasOwnProperty(b)&&"function"==typeof d.keyBinds[b]&&(e=b.split(" "),e.length===h.length&&v[j]===e[e.length-1])){for(f=!0,c=e.length-2;c>=0;c--)if(!(v[e[c]]in i)){f=!1;break}if(f){g=d.keyBinds[b];break}}g&&(g.call(l,o),a.stopPropagation(),a.preventDefault())},ia=function(a){w[a.which]="r",a.stopPropagation(),a.preventDefault()},ja=function(b){var c=a(b.target).val().trim(),d=c?ga(c):null;return _(d),b.stopImmediatePropagation(),!1},ka=function(){g.on({change:ja,blur:d.debug?"":aa,keydown:ha,keyup:ia,focus:d.allowInputToggle?ea:""}),c.is("input")?g.on({focus:ea}):n&&(n.on("click",fa),n.on("mousedown",!1))},la=function(){g.off({change:ja,blur:blur,keydown:ha,keyup:ia,focus:d.allowInputToggle?aa:""}),c.is("input")?g.off({focus:ea}):n&&(n.off("click",fa),n.off("mousedown",!1))},ma=function(b){var c={};return a.each(b,function(){var a=ga(this);a.isValid()&&(c[a.format("YYYY-MM-DD")]=!0)}),Object.keys(c).length?c:!1},na=function(b){var c={};return a.each(b,function(){c[this]=!0}),Object.keys(c).length?c:!1},oa=function(){var a=d.format||"L LT";i=a.replace(/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,function(a){var b=e.localeData().longDateFormat(a)||a;return b.replace(/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,function(a){return e.localeData().longDateFormat(a)||a})}),j=d.extraFormats?d.extraFormats.slice():[],j.indexOf(a)<0&&j.indexOf(i)<0&&j.push(i),h=i.toLowerCase().indexOf("a")<1&&i.replace(/\[.*?\]/g,"").indexOf("h")<1,y("y")&&(p=2),y("M")&&(p=1),y("d")&&(p=0),k=Math.max(p,k),m||_(e)};if(l.destroy=function(){aa(),la(),c.removeData("DateTimePicker"),c.removeData("date")},l.toggle=fa,l.show=ea,l.hide=aa,l.disable=function(){return aa(),n&&n.hasClass("btn")&&n.addClass("disabled"),g.prop("disabled",!0),l},l.enable=function(){return n&&n.hasClass("btn")&&n.removeClass("disabled"),g.prop("disabled",!1),l},l.ignoreReadonly=function(a){if(0===arguments.length)return d.ignoreReadonly;if("boolean"!=typeof a)throw new TypeError("ignoreReadonly () expects a boolean parameter");return d.ignoreReadonly=a,l},l.options=function(b){if(0===arguments.length)return a.extend(!0,{},d);if(!(b instanceof Object))throw new TypeError("options() options parameter should be an object");return a.extend(!0,d,b),a.each(d,function(a,b){if(void 0===l[a])throw new TypeError("option "+a+" is not recognized!");l[a](b)}),l},l.date=function(a){if(0===arguments.length)return m?null:e.clone();if(!(null===a||"string"==typeof a||b.isMoment(a)||a instanceof Date))throw new TypeError("date() parameter must be one of [null, string, moment or Date]");return _(null===a?null:ga(a)),l},l.format=function(a){if(0===arguments.length)return d.format;if("string"!=typeof a&&("boolean"!=typeof a||a!==!1))throw new TypeError("format() expects a sting or boolean:false parameter "+a);return d.format=a,i&&oa(),l},l.timeZone=function(a){return 0===arguments.length?d.timeZone:(d.timeZone=a,l)},l.dayViewHeaderFormat=function(a){if(0===arguments.length)return d.dayViewHeaderFormat;if("string"!=typeof a)throw new TypeError("dayViewHeaderFormat() expects a string parameter");return d.dayViewHeaderFormat=a,l},l.extraFormats=function(a){if(0===arguments.length)return d.extraFormats;if(a!==!1&&!(a instanceof Array))throw new TypeError("extraFormats() expects an array or false parameter");return d.extraFormats=a,j&&oa(),l},l.disabledDates=function(b){if(0===arguments.length)return d.disabledDates?a.extend({},d.disabledDates):d.disabledDates;if(!b)return d.disabledDates=!1,$(),l;if(!(b instanceof Array))throw new TypeError("disabledDates() expects an array parameter");return d.disabledDates=ma(b),d.enabledDates=!1,$(),l},l.enabledDates=function(b){if(0===arguments.length)return d.enabledDates?a.extend({},d.enabledDates):d.enabledDates;if(!b)return d.enabledDates=!1,$(),l;if(!(b instanceof Array))throw new TypeError("enabledDates() expects an array parameter");return d.enabledDates=ma(b),d.disabledDates=!1,$(),l},l.daysOfWeekDisabled=function(a){if(0===arguments.length)return d.daysOfWeekDisabled.splice(0);if("boolean"==typeof a&&!a)return d.daysOfWeekDisabled=!1,$(),l;if(!(a instanceof Array))throw new TypeError("daysOfWeekDisabled() expects an array parameter");if(d.daysOfWeekDisabled=a.reduce(function(a,b){return b=parseInt(b,10),b>6||0>b||isNaN(b)?a:(-1===a.indexOf(b)&&a.push(b),a)},[]).sort(),d.useCurrent&&!d.keepInvalid){for(var b=0;!Q(e,"d");){if(e.add(1,"d"),7===b)throw"Tried 7 times to find a valid date";b++}_(e)}return $(),l},l.maxDate=function(a){if(0===arguments.length)return d.maxDate?d.maxDate.clone():d.maxDate;if("boolean"==typeof a&&a===!1)return d.maxDate=!1,$(),l;"string"==typeof a&&("now"===a||"moment"===a)&&(a=x());var b=ga(a);if(!b.isValid())throw new TypeError("maxDate() Could not parse date parameter: "+a);if(d.minDate&&b.isBefore(d.minDate))throw new TypeError("maxDate() date parameter is before options.minDate: "+b.format(i));return d.maxDate=b,d.useCurrent&&!d.keepInvalid&&e.isAfter(a)&&_(d.maxDate),f.isAfter(b)&&(f=b.clone().subtract(d.stepping,"m")),$(),l},l.minDate=function(a){if(0===arguments.length)return d.minDate?d.minDate.clone():d.minDate;if("boolean"==typeof a&&a===!1)return d.minDate=!1,$(),l;"string"==typeof a&&("now"===a||"moment"===a)&&(a=x());var b=ga(a);if(!b.isValid())throw new TypeError("minDate() Could not parse date parameter: "+a);if(d.maxDate&&b.isAfter(d.maxDate))throw new TypeError("minDate() date parameter is after options.maxDate: "+b.format(i));return d.minDate=b,d.useCurrent&&!d.keepInvalid&&e.isBefore(a)&&_(d.minDate),f.isBefore(b)&&(f=b.clone().add(d.stepping,"m")),$(),l},l.defaultDate=function(a){if(0===arguments.length)return d.defaultDate?d.defaultDate.clone():d.defaultDate;if(!a)return d.defaultDate=!1,l;"string"==typeof a&&("now"===a||"moment"===a)&&(a=x());var b=ga(a);if(!b.isValid())throw new TypeError("defaultDate() Could not parse date parameter: "+a);if(!Q(b))throw new TypeError("defaultDate() date passed is invalid according to component setup validations");return d.defaultDate=b,(d.defaultDate&&d.inline||""===g.val().trim())&&_(d.defaultDate),l},l.locale=function(a){if(0===arguments.length)return d.locale;if(!b.localeData(a))throw new TypeError("locale() locale "+a+" is not loaded from moment locales!");return d.locale=a,e.locale(d.locale),f.locale(d.locale),i&&oa(),o&&(aa(),ea()),l},l.stepping=function(a){return 0===arguments.length?d.stepping:(a=parseInt(a,10),(isNaN(a)||1>a)&&(a=1),d.stepping=a,l)},l.useCurrent=function(a){var b=["year","month","day","hour","minute"];if(0===arguments.length)return d.useCurrent;if("boolean"!=typeof a&&"string"!=typeof a)throw new TypeError("useCurrent() expects a boolean or string parameter");if("string"==typeof a&&-1===b.indexOf(a.toLowerCase()))throw new TypeError("useCurrent() expects a string parameter of "+b.join(", "));return d.useCurrent=a,l},l.collapse=function(a){if(0===arguments.length)return d.collapse;if("boolean"!=typeof a)throw new TypeError("collapse() expects a boolean parameter");return d.collapse===a?l:(d.collapse=a,o&&(aa(),ea()),l)},l.icons=function(b){if(0===arguments.length)return a.extend({},d.icons);if(!(b instanceof Object))throw new TypeError("icons() expects parameter to be an Object");return a.extend(d.icons,b),o&&(aa(),ea()),l},l.tooltips=function(b){if(0===arguments.length)return a.extend({},d.tooltips);if(!(b instanceof Object))throw new TypeError("tooltips() expects parameter to be an Object");return a.extend(d.tooltips,b),o&&(aa(),ea()),l},l.useStrict=function(a){if(0===arguments.length)return d.useStrict;if("boolean"!=typeof a)throw new TypeError("useStrict() expects a boolean parameter");return d.useStrict=a,l},l.sideBySide=function(a){if(0===arguments.length)return d.sideBySide;if("boolean"!=typeof a)throw new TypeError("sideBySide() expects a boolean parameter");return d.sideBySide=a,o&&(aa(),ea()),l},l.viewMode=function(a){if(0===arguments.length)return d.viewMode;if("string"!=typeof a)throw new TypeError("viewMode() expects a string parameter");if(-1===r.indexOf(a))throw new TypeError("viewMode() parameter must be one of ("+r.join(", ")+") value");return d.viewMode=a,k=Math.max(r.indexOf(a),p),K(),l},l.toolbarPlacement=function(a){if(0===arguments.length)return d.toolbarPlacement;if("string"!=typeof a)throw new TypeError("toolbarPlacement() expects a string parameter");if(-1===u.indexOf(a))throw new TypeError("toolbarPlacement() parameter must be one of ("+u.join(", ")+") value");return d.toolbarPlacement=a,o&&(aa(),ea()),l},l.widgetPositioning=function(b){if(0===arguments.length)return a.extend({},d.widgetPositioning);if("[object Object]"!=={}.toString.call(b))throw new TypeError("widgetPositioning() expects an object variable");if(b.horizontal){if("string"!=typeof b.horizontal)throw new TypeError("widgetPositioning() horizontal variable must be a string");if(b.horizontal=b.horizontal.toLowerCase(),-1===t.indexOf(b.horizontal))throw new TypeError("widgetPositioning() expects horizontal parameter to be one of ("+t.join(", ")+")");d.widgetPositioning.horizontal=b.horizontal}if(b.vertical){if("string"!=typeof b.vertical)throw new TypeError("widgetPositioning() vertical variable must be a string");if(b.vertical=b.vertical.toLowerCase(),-1===s.indexOf(b.vertical))throw new TypeError("widgetPositioning() expects vertical parameter to be one of ("+s.join(", ")+")");d.widgetPositioning.vertical=b.vertical}return $(),l},l.calendarWeeks=function(a){if(0===arguments.length)return d.calendarWeeks;if("boolean"!=typeof a)throw new TypeError("calendarWeeks() expects parameter to be a boolean value");return d.calendarWeeks=a,$(),l},l.showTodayButton=function(a){if(0===arguments.length)return d.showTodayButton;if("boolean"!=typeof a)throw new TypeError("showTodayButton() expects a boolean parameter");return d.showTodayButton=a,o&&(aa(),ea()),l},l.showClear=function(a){if(0===arguments.length)return d.showClear;if("boolean"!=typeof a)throw new TypeError("showClear() expects a boolean parameter");return d.showClear=a,o&&(aa(),ea()),l},l.widgetParent=function(b){if(0===arguments.length)return d.widgetParent;if("string"==typeof b&&(b=a(b)),null!==b&&"string"!=typeof b&&!(b instanceof a))throw new TypeError("widgetParent() expects a string or a jQuery object parameter");return d.widgetParent=b,o&&(aa(),ea()),l},l.keepOpen=function(a){if(0===arguments.length)return d.keepOpen;if("boolean"!=typeof a)throw new TypeError("keepOpen() expects a boolean parameter");return d.keepOpen=a,l},l.focusOnShow=function(a){if(0===arguments.length)return d.focusOnShow;if("boolean"!=typeof a)throw new TypeError("focusOnShow() expects a boolean parameter");return d.focusOnShow=a,l},l.inline=function(a){if(0===arguments.length)return d.inline;if("boolean"!=typeof a)throw new TypeError("inline() expects a boolean parameter");return d.inline=a,l},l.clear=function(){return ba(),l},l.keyBinds=function(a){return d.keyBinds=a,l},l.getMoment=function(a){return x(a)},l.debug=function(a){if("boolean"!=typeof a)throw new TypeError("debug() expects a boolean parameter");return d.debug=a,l},l.allowInputToggle=function(a){if(0===arguments.length)return d.allowInputToggle;if("boolean"!=typeof a)throw new TypeError("allowInputToggle() expects a boolean parameter");return d.allowInputToggle=a,l},l.showClose=function(a){if(0===arguments.length)return d.showClose;if("boolean"!=typeof a)throw new TypeError("showClose() expects a boolean parameter");return d.showClose=a,l},l.keepInvalid=function(a){if(0===arguments.length)return d.keepInvalid;if("boolean"!=typeof a)throw new TypeError("keepInvalid() expects a boolean parameter");return d.keepInvalid=a,l},l.datepickerInput=function(a){if(0===arguments.length)return d.datepickerInput;if("string"!=typeof a)throw new TypeError("datepickerInput() expects a string parameter");return d.datepickerInput=a,l},l.parseInputDate=function(a){if(0===arguments.length)return d.parseInputDate;
if("function"!=typeof a)throw new TypeError("parseInputDate() sholud be as function");return d.parseInputDate=a,l},l.disabledTimeIntervals=function(b){if(0===arguments.length)return d.disabledTimeIntervals?a.extend({},d.disabledTimeIntervals):d.disabledTimeIntervals;if(!b)return d.disabledTimeIntervals=!1,$(),l;if(!(b instanceof Array))throw new TypeError("disabledTimeIntervals() expects an array parameter");return d.disabledTimeIntervals=b,$(),l},l.disabledHours=function(b){if(0===arguments.length)return d.disabledHours?a.extend({},d.disabledHours):d.disabledHours;if(!b)return d.disabledHours=!1,$(),l;if(!(b instanceof Array))throw new TypeError("disabledHours() expects an array parameter");if(d.disabledHours=na(b),d.enabledHours=!1,d.useCurrent&&!d.keepInvalid){for(var c=0;!Q(e,"h");){if(e.add(1,"h"),24===c)throw"Tried 24 times to find a valid date";c++}_(e)}return $(),l},l.enabledHours=function(b){if(0===arguments.length)return d.enabledHours?a.extend({},d.enabledHours):d.enabledHours;if(!b)return d.enabledHours=!1,$(),l;if(!(b instanceof Array))throw new TypeError("enabledHours() expects an array parameter");if(d.enabledHours=na(b),d.disabledHours=!1,d.useCurrent&&!d.keepInvalid){for(var c=0;!Q(e,"h");){if(e.add(1,"h"),24===c)throw"Tried 24 times to find a valid date";c++}_(e)}return $(),l},l.viewDate=function(a){if(0===arguments.length)return f.clone();if(!a)return f=e.clone(),l;if(!("string"==typeof a||b.isMoment(a)||a instanceof Date))throw new TypeError("viewDate() parameter must be one of [string, moment or Date]");return f=ga(a),J(),l},c.is("input"))g=c;else if(g=c.find(d.datepickerInput),0===g.size())g=c.find("input");else if(!g.is("input"))throw new Error('CSS class "'+d.datepickerInput+'" cannot be applied to non input element');if(c.hasClass("input-group")&&(n=0===c.find(".datepickerbutton").size()?c.find(".input-group-addon"):c.find(".datepickerbutton")),!d.inline&&!g.is("input"))throw new Error("Could not initialize DateTimePicker without an input element");return e=x(),f=e.clone(),a.extend(!0,d,G()),l.options(d),oa(),ka(),g.prop("disabled")&&l.disable(),g.is("input")&&0!==g.val().trim().length?_(ga(g.val().trim())):d.defaultDate&&void 0===g.attr("placeholder")&&_(d.defaultDate),d.inline&&ea(),l};a.fn.datetimepicker=function(b){return this.each(function(){var d=a(this);d.data("DateTimePicker")||(b=a.extend(!0,{},a.fn.datetimepicker.defaults,b),d.data("DateTimePicker",c(d,b)))})},a.fn.datetimepicker.defaults={timeZone:"Etc/UTC",format:!1,dayViewHeaderFormat:"MMMM YYYY",extraFormats:!1,stepping:1,minDate:!1,maxDate:!1,useCurrent:!0,collapse:!0,locale:b.locale(),defaultDate:!1,disabledDates:!1,enabledDates:!1,icons:{time:" icon-access_time",date:"icon-perm_contact_calendar",up:"icon-keyboard_arrow_up",down:"icon-keyboard_arrow_down",previous:" icon-keyboard_arrow_left",next:"icon-keyboard_arrow_right",today:" icon-screen_share",clear:"icon-trash",close:"icon-highlight_remove"},tooltips:{today:"Go to today",clear:"Clear selection",close:"Close the picker",selectMonth:"Select Month",prevMonth:"Previous Month",nextMonth:"Next Month",selectYear:"Select Year",prevYear:"Previous Year",nextYear:"Next Year",selectDecade:"Select Decade",prevDecade:"Previous Decade",nextDecade:"Next Decade",prevCentury:"Previous Century",nextCentury:"Next Century",pickHour:"Pick Hour",incrementHour:"Increment Hour",decrementHour:"Decrement Hour",pickMinute:"Pick Minute",incrementMinute:"Increment Minute",decrementMinute:"Decrement Minute",pickSecond:"Pick Second",incrementSecond:"Increment Second",decrementSecond:"Decrement Second",togglePeriod:"Toggle Period",selectTime:"Select Time"},useStrict:!1,sideBySide:!1,daysOfWeekDisabled:!1,calendarWeeks:!1,viewMode:"days",toolbarPlacement:"default",showTodayButton:!1,showClear:!1,showClose:!1,widgetPositioning:{horizontal:"auto",vertical:"auto"},widgetParent:null,ignoreReadonly:!1,keepOpen:!1,focusOnShow:!0,inline:!1,keepInvalid:!1,datepickerInput:".datepickerinput",keyBinds:{up:function(a){if(a){var b=this.date()||this.getMoment();a.find(".datepicker").is(":visible")?this.date(b.clone().subtract(7,"d")):this.date(b.clone().add(this.stepping(),"m"))}},down:function(a){if(!a)return void this.show();var b=this.date()||this.getMoment();a.find(".datepicker").is(":visible")?this.date(b.clone().add(7,"d")):this.date(b.clone().subtract(this.stepping(),"m"))},"control up":function(a){if(a){var b=this.date()||this.getMoment();a.find(".datepicker").is(":visible")?this.date(b.clone().subtract(1,"y")):this.date(b.clone().add(1,"h"))}},"control down":function(a){if(a){var b=this.date()||this.getMoment();a.find(".datepicker").is(":visible")?this.date(b.clone().add(1,"y")):this.date(b.clone().subtract(1,"h"))}},left:function(a){if(a){var b=this.date()||this.getMoment();a.find(".datepicker").is(":visible")&&this.date(b.clone().subtract(1,"d"))}},right:function(a){if(a){var b=this.date()||this.getMoment();a.find(".datepicker").is(":visible")&&this.date(b.clone().add(1,"d"))}},pageUp:function(a){if(a){var b=this.date()||this.getMoment();a.find(".datepicker").is(":visible")&&this.date(b.clone().subtract(1,"M"))}},pageDown:function(a){if(a){var b=this.date()||this.getMoment();a.find(".datepicker").is(":visible")&&this.date(b.clone().add(1,"M"))}},enter:function(){this.hide()},escape:function(){this.hide()},"control space":function(a){a.find(".timepicker").is(":visible")&&a.find('.btn[data-action="togglePeriod"]').click()},t:function(){this.date(this.getMoment())},"delete":function(){this.clear()}},debug:!1,allowInputToggle:!1,disabledTimeIntervals:!1,disabledHours:!1,enabledHours:!1,viewDate:!1}});


// jquery.growl.js
// Generated by CoffeeScript 1.10.0

/*
jQuery Growl
Copyright 2015 Kevin Sylvestre
1.3.2
 */
(function(){"use strict";var t,s,i,n=function(t,s){return function(){return t.apply(s,arguments)}};t=jQuery,s=function(){function t(){}return t.transitions={webkitTransition:"webkitTransitionEnd",mozTransition:"mozTransitionEnd",oTransition:"oTransitionEnd",transition:"transitionend"},t.transition=function(t){var s,i,n,e;s=t[0],i=this.transitions;for(e in i)if(n=i[e],null!=s.style[e])return n},t}(),i=function(){function i(s){null==s&&(s={}),this.container=n(this.container,this),this.content=n(this.content,this),this.html=n(this.html,this),this.$growl=n(this.$growl,this),this.$growls=n(this.$growls,this),this.animate=n(this.animate,this),this.remove=n(this.remove,this),this.dismiss=n(this.dismiss,this),this.present=n(this.present,this),this.waitAndDismiss=n(this.waitAndDismiss,this),this.cycle=n(this.cycle,this),this.close=n(this.close,this),this.click=n(this.click,this),this.mouseLeave=n(this.mouseLeave,this),this.mouseEnter=n(this.mouseEnter,this),this.unbind=n(this.unbind,this),this.bind=n(this.bind,this),this.render=n(this.render,this),this.settings=t.extend({},i.settings,s),this.$growls().attr("class",this.settings.location),this.render()}return i.settings={namespace:"growl",duration:3200,close:"&#215;",location:"default",style:"default",size:"medium",delayOnHover:!0},i.growl=function(t){return null==t&&(t={}),this.initialize(),new i(t)},i.initialize=function(){return t("body:not(:has(#growls))").append('<div id="growls" />')},i.prototype.render=function(){var t;t=this.$growl(),this.$growls().append(t),this.settings.fixed?this.present():this.cycle()},i.prototype.bind=function(t){return null==t&&(t=this.$growl()),t.on("click",this.click),this.settings.delayOnHover&&(t.on("mouseenter",this.mouseEnter),t.on("mouseleave",this.mouseLeave)),t.on("contextmenu",this.close).find("."+this.settings.namespace+"-close").on("click",this.close)},i.prototype.unbind=function(t){return null==t&&(t=this.$growl()),t.off("click",this.click),this.settings.delayOnHover&&(t.off("mouseenter",this.mouseEnter),t.off("mouseleave",this.mouseLeave)),t.off("contextmenu",this.close).find("."+this.settings.namespace+"-close").off("click",this.close)},i.prototype.mouseEnter=function(t){var s;return s=this.$growl(),s.stop(!0,!0)},i.prototype.mouseLeave=function(t){return this.waitAndDismiss()},i.prototype.click=function(t){return null!=this.settings.url?(t.preventDefault(),t.stopPropagation(),window.open(this.settings.url)):void 0},i.prototype.close=function(t){var s;return t.preventDefault(),t.stopPropagation(),s=this.$growl(),s.stop().queue(this.dismiss).queue(this.remove)},i.prototype.cycle=function(){var t;return t=this.$growl(),t.queue(this.present).queue(this.waitAndDismiss())},i.prototype.waitAndDismiss=function(){var t;return t=this.$growl(),t.delay(this.settings.duration).queue(this.dismiss).queue(this.remove)},i.prototype.present=function(t){var s;return s=this.$growl(),this.bind(s),this.animate(s,this.settings.namespace+"-incoming","out",t)},i.prototype.dismiss=function(t){var s;return s=this.$growl(),this.unbind(s),this.animate(s,this.settings.namespace+"-outgoing","in",t)},i.prototype.remove=function(t){return this.$growl().remove(),"function"==typeof t?t():void 0},i.prototype.animate=function(t,i,n,e){var o;null==n&&(n="in"),o=s.transition(t),t["in"===n?"removeClass":"addClass"](i),t.offset().position,t["in"===n?"addClass":"removeClass"](i),null!=e&&(null!=o?t.one(o,e):e())},i.prototype.$growls=function(){return null!=this.$_growls?this.$_growls:this.$_growls=t("#growls")},i.prototype.$growl=function(){return null!=this.$_growl?this.$_growl:this.$_growl=t(this.html())},i.prototype.html=function(){return this.container(this.content())},i.prototype.content=function(){return"<div class='"+this.settings.namespace+"-close'>"+this.settings.close+"</div>\n<div class='"+this.settings.namespace+"-title'>"+this.settings.title+"</div>\n<div class='"+this.settings.namespace+"-message'>"+this.settings.message+"</div>"},i.prototype.container=function(t){return"<div class='"+this.settings.namespace+" "+this.settings.namespace+"-"+this.settings.style+" "+this.settings.namespace+"-"+this.settings.size+"'>\n  "+t+"\n</div>"},i}(),this.Growl=i,t.growl=function(t){return null==t&&(t={}),i.growl(t)},t.growl.error=function(s){var i;return null==s&&(s={}),i={title:"",style:"error"},t.growl(t.extend(i,s))},t.growl.success=function(s){var i;return null==s&&(s={}),i={title:"",style:"success"},t.growl(t.extend(i,s))},t.growl.notice=function(s){var i;return null==s&&(s={}),i={title:"",style:"notice"},t.growl(t.extend(i,s))},t.growl.warning=function(s){var i;return null==s&&(s={}),i={title:"",style:"warning"},t.growl(t.extend(i,s))}}).call(this);

// bootstrap-slider.js
/*! =========================================================
 * bootstrap-slider.js
 *
 * Maintainers:
 *      Kyle Kemp
 *          - Twitter: @seiyria
 *          - Github:  seiyria
 *      Rohit Kalkur
 *          - Twitter: @Rovolutionary
 *          - Github:  rovolution
 *
 * =========================================================
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


/**
 * Bridget makes jQuery widgets
 * v1.0.1
 * MIT license
 */

!function(t,i){if("function"==typeof define&&define.amd)define(["jquery"],i);else if("object"==typeof module&&module.exports){var e;try{e=require("jquery")}catch(s){e=null}module.exports=i(e)}else t.Slider=i(t.jQuery)}(this,function(t){var i;return function(t){"use strict";function i(){}function e(t){function e(i){i.prototype.option||(i.prototype.option=function(i){t.isPlainObject(i)&&(this.options=t.extend(!0,this.options,i))})}function o(i,e){t.fn[i]=function(o){if("string"==typeof o){for(var a=s.call(arguments,1),h=0,l=this.length;l>h;h++){var r=this[h],p=t.data(r,i);if(p)if(t.isFunction(p[o])&&"_"!==o.charAt(0)){var d=p[o].apply(p,a);if(void 0!==d&&d!==p)return d}else n("no such method '"+o+"' for "+i+" instance");else n("cannot call methods on "+i+" prior to initialization; attempted to call '"+o+"'")}return this}var c=this.map(function(){var s=t.data(this,i);return s?(s.option(o),s._init()):(s=new e(this,o),t.data(this,i,s)),t(this)});return!c||c.length>1?c:c[0]}}if(t){var n="undefined"==typeof console?i:function(t){console.error(t)};return t.bridget=function(t,i){e(i),o(t,i)},t.bridget}}var s=Array.prototype.slice;e(t)}(t),function(t){function e(i,e){function s(t,i){var e="data-slider-"+i.replace(/_/g,"-"),s=t.getAttribute(e);try{return JSON.parse(s)}catch(o){return s}}this._state={value:null,enabled:null,offset:null,size:null,percentage:null,inDrag:!1,over:!1},"string"==typeof i?this.element=document.querySelector(i):i instanceof HTMLElement&&(this.element=i),e=e?e:{};for(var n=Object.keys(this.defaultOptions),a=0;a<n.length;a++){var h=n[a],l=e[h];l="undefined"!=typeof l?l:s(this.element,h),l=null!==l?l:this.defaultOptions[h],this.options||(this.options={}),this.options[h]=l}"vertical"!==this.options.orientation||"top"!==this.options.tooltip_position&&"bottom"!==this.options.tooltip_position?"horizontal"!==this.options.orientation||"left"!==this.options.tooltip_position&&"right"!==this.options.tooltip_position||(this.options.tooltip_position="top"):this.options.tooltip_position="right";var r,p,d,c,u,m=this.element.style.width,_=!1,v=this.element.parentNode;if(this.sliderElem)_=!0;else{this.sliderElem=document.createElement("div"),this.sliderElem.className="slider";var f=document.createElement("div");f.className="slider-track",p=document.createElement("div"),p.className="slider-track-low",r=document.createElement("div"),r.className="slider-selection",d=document.createElement("div"),d.className="slider-track-high",c=document.createElement("div"),c.className="slider-handle min-slider-handle",c.setAttribute("role","slider"),c.setAttribute("aria-valuemin",this.options.min),c.setAttribute("aria-valuemax",this.options.max),u=document.createElement("div"),u.className="slider-handle max-slider-handle",u.setAttribute("role","slider"),u.setAttribute("aria-valuemin",this.options.min),u.setAttribute("aria-valuemax",this.options.max),f.appendChild(p),f.appendChild(r),f.appendChild(d);var g=Array.isArray(this.options.labelledby);if(g&&this.options.labelledby[0]&&c.setAttribute("aria-labelledby",this.options.labelledby[0]),g&&this.options.labelledby[1]&&u.setAttribute("aria-labelledby",this.options.labelledby[1]),!g&&this.options.labelledby&&(c.setAttribute("aria-labelledby",this.options.labelledby),u.setAttribute("aria-labelledby",this.options.labelledby)),this.ticks=[],Array.isArray(this.options.ticks)&&this.options.ticks.length>0){for(a=0;a<this.options.ticks.length;a++){var y=document.createElement("div");y.className="slider-tick",this.ticks.push(y),f.appendChild(y)}r.className+=" tick-slider-selection"}if(f.appendChild(c),f.appendChild(u),this.tickLabels=[],Array.isArray(this.options.ticks_labels)&&this.options.ticks_labels.length>0)for(this.tickLabelContainer=document.createElement("div"),this.tickLabelContainer.className="slider-tick-label-container",a=0;a<this.options.ticks_labels.length;a++){var b=document.createElement("div"),k=0===this.options.ticks_positions.length,E=this.options.reversed&&k?this.options.ticks_labels.length-(a+1):a;b.className="slider-tick-label",b.innerHTML=this.options.ticks_labels[E],this.tickLabels.push(b),this.tickLabelContainer.appendChild(b)}var x=function(t){var i=document.createElement("div");i.className="tooltip-arrow";var e=document.createElement("div");e.className="tooltip-inner",t.appendChild(i),t.appendChild(e)},C=document.createElement("div");C.className="tooltip tooltip-main",C.setAttribute("role","presentation"),x(C);var w=document.createElement("div");w.className="tooltip tooltip-min",w.setAttribute("role","presentation"),x(w);var L=document.createElement("div");L.className="tooltip tooltip-max",L.setAttribute("role","presentation"),x(L),this.sliderElem.appendChild(f),this.sliderElem.appendChild(C),this.sliderElem.appendChild(w),this.sliderElem.appendChild(L),this.tickLabelContainer&&this.sliderElem.appendChild(this.tickLabelContainer),v.insertBefore(this.sliderElem,this.element),this.element.style.display="none"}if(t&&(this.$element=t(this.element),this.$sliderElem=t(this.sliderElem)),this.eventToCallbackMap={},this.sliderElem.id=this.options.id,this.touchCapable="ontouchstart"in window||window.DocumentTouch&&document instanceof window.DocumentTouch,this.tooltip=this.sliderElem.querySelector(".tooltip-main"),this.tooltipInner=this.tooltip.querySelector(".tooltip-inner"),this.tooltip_min=this.sliderElem.querySelector(".tooltip-min"),this.tooltipInner_min=this.tooltip_min.querySelector(".tooltip-inner"),this.tooltip_max=this.sliderElem.querySelector(".tooltip-max"),this.tooltipInner_max=this.tooltip_max.querySelector(".tooltip-inner"),o[this.options.scale]&&(this.options.scale=o[this.options.scale]),_===!0&&(this._removeClass(this.sliderElem,"slider-horizontal"),this._removeClass(this.sliderElem,"slider-vertical"),this._removeClass(this.tooltip,"hide"),this._removeClass(this.tooltip_min,"hide"),this._removeClass(this.tooltip_max,"hide"),["left","top","width","height"].forEach(function(t){this._removeProperty(this.trackLow,t),this._removeProperty(this.trackSelection,t),this._removeProperty(this.trackHigh,t)},this),[this.handle1,this.handle2].forEach(function(t){this._removeProperty(t,"left"),this._removeProperty(t,"top")},this),[this.tooltip,this.tooltip_min,this.tooltip_max].forEach(function(t){this._removeProperty(t,"left"),this._removeProperty(t,"top"),this._removeProperty(t,"margin-left"),this._removeProperty(t,"margin-top"),this._removeClass(t,"right"),this._removeClass(t,"top")},this)),"vertical"===this.options.orientation?(this._addClass(this.sliderElem,"slider-vertical"),this.stylePos="top",this.mousePos="pageY",this.sizePos="offsetHeight"):(this._addClass(this.sliderElem,"slider-horizontal"),this.sliderElem.style.width=m,this.options.orientation="horizontal",this.stylePos="left",this.mousePos="pageX",this.sizePos="offsetWidth"),this._setTooltipPosition(),Array.isArray(this.options.ticks)&&this.options.ticks.length>0&&(this.options.max=Math.max.apply(Math,this.options.ticks),this.options.min=Math.min.apply(Math,this.options.ticks)),Array.isArray(this.options.value)?(this.options.range=!0,this._state.value=this.options.value):this.options.range?this._state.value=[this.options.value,this.options.max]:this._state.value=this.options.value,this.trackLow=p||this.trackLow,this.trackSelection=r||this.trackSelection,this.trackHigh=d||this.trackHigh,"none"===this.options.selection&&(this._addClass(this.trackLow,"hide"),this._addClass(this.trackSelection,"hide"),this._addClass(this.trackHigh,"hide")),this.handle1=c||this.handle1,this.handle2=u||this.handle2,_===!0)for(this._removeClass(this.handle1,"round triangle"),this._removeClass(this.handle2,"round triangle hide"),a=0;a<this.ticks.length;a++)this._removeClass(this.ticks[a],"round triangle hide");var P=["round","triangle","custom"],T=-1!==P.indexOf(this.options.handle);if(T)for(this._addClass(this.handle1,this.options.handle),this._addClass(this.handle2,this.options.handle),a=0;a<this.ticks.length;a++)this._addClass(this.ticks[a],this.options.handle);this._state.offset=this._offset(this.sliderElem),this._state.size=this.sliderElem[this.sizePos],this.setValue(this._state.value),this.handle1Keydown=this._keydown.bind(this,0),this.handle1.addEventListener("keydown",this.handle1Keydown,!1),this.handle2Keydown=this._keydown.bind(this,1),this.handle2.addEventListener("keydown",this.handle2Keydown,!1),this.mousedown=this._mousedown.bind(this),this.touchCapable&&this.sliderElem.addEventListener("touchstart",this.mousedown,!1),this.sliderElem.addEventListener("mousedown",this.mousedown,!1),"hide"===this.options.tooltip?(this._addClass(this.tooltip,"hide"),this._addClass(this.tooltip_min,"hide"),this._addClass(this.tooltip_max,"hide")):"always"===this.options.tooltip?(this._showTooltip(),this._alwaysShowTooltip=!0):(this.showTooltip=this._showTooltip.bind(this),this.hideTooltip=this._hideTooltip.bind(this),this.sliderElem.addEventListener("mouseenter",this.showTooltip,!1),this.sliderElem.addEventListener("mouseleave",this.hideTooltip,!1),this.handle1.addEventListener("focus",this.showTooltip,!1),this.handle1.addEventListener("blur",this.hideTooltip,!1),this.handle2.addEventListener("focus",this.showTooltip,!1),this.handle2.addEventListener("blur",this.hideTooltip,!1)),this.options.enabled?this.enable():this.disable()}var s={formatInvalidInputErrorMsg:function(t){return"Invalid input value '"+t+"' passed in"},callingContextNotSliderInstance:"Calling context element does not have instance of Slider bound to it. Check your code to make sure the JQuery object returned from the call to the slider() initializer is calling the method"},o={linear:{toValue:function(t){var i=t/100*(this.options.max-this.options.min),e=!0;if(this.options.ticks_positions.length>0){for(var s,o,n,a=0,h=1;h<this.options.ticks_positions.length;h++)if(t<=this.options.ticks_positions[h]){s=this.options.ticks[h-1],n=this.options.ticks_positions[h-1],o=this.options.ticks[h],a=this.options.ticks_positions[h];break}var l=(t-n)/(a-n);i=s+l*(o-s),e=!1}var r=e?this.options.min:0,p=r+Math.round(i/this.options.step)*this.options.step;return p<this.options.min?this.options.min:p>this.options.max?this.options.max:p},toPercentage:function(t){if(this.options.max===this.options.min)return 0;if(this.options.ticks_positions.length>0){for(var i,e,s,o=0,n=0;n<this.options.ticks.length;n++)if(t<=this.options.ticks[n]){i=n>0?this.options.ticks[n-1]:0,s=n>0?this.options.ticks_positions[n-1]:0,e=this.options.ticks[n],o=this.options.ticks_positions[n];break}if(n>0){var a=(t-i)/(e-i);return s+a*(o-s)}}return 100*(t-this.options.min)/(this.options.max-this.options.min)}},logarithmic:{toValue:function(t){var i=0===this.options.min?0:Math.log(this.options.min),e=Math.log(this.options.max),s=Math.exp(i+(e-i)*t/100);return s=this.options.min+Math.round((s-this.options.min)/this.options.step)*this.options.step,s<this.options.min?this.options.min:s>this.options.max?this.options.max:s},toPercentage:function(t){if(this.options.max===this.options.min)return 0;var i=Math.log(this.options.max),e=0===this.options.min?0:Math.log(this.options.min),s=0===t?0:Math.log(t);return 100*(s-e)/(i-e)}}};if(i=function(t,i){return e.call(this,t,i),this},i.prototype={_init:function(){},constructor:i,defaultOptions:{id:"",min:0,max:10,step:1,precision:0,orientation:"horizontal",value:5,range:!1,selection:"before",tooltip:"show",tooltip_split:!1,handle:"round",reversed:!1,enabled:!0,formatter:function(t){return Array.isArray(t)?t[0]+" : "+t[1]:t},natural_arrow_keys:!1,ticks:[],ticks_positions:[],ticks_labels:[],ticks_snap_bounds:0,scale:"linear",focus:!1,tooltip_position:null,labelledby:null},getElement:function(){return this.sliderElem},getValue:function(){return this.options.range?this._state.value:this._state.value[0]},setValue:function(t,i,e){t||(t=0);var s=this.getValue();this._state.value=this._validateInputValue(t);var o=this._applyPrecision.bind(this);this.options.range?(this._state.value[0]=o(this._state.value[0]),this._state.value[1]=o(this._state.value[1]),this._state.value[0]=Math.max(this.options.min,Math.min(this.options.max,this._state.value[0])),this._state.value[1]=Math.max(this.options.min,Math.min(this.options.max,this._state.value[1]))):(this._state.value=o(this._state.value),this._state.value=[Math.max(this.options.min,Math.min(this.options.max,this._state.value))],this._addClass(this.handle2,"hide"),"after"===this.options.selection?this._state.value[1]=this.options.max:this._state.value[1]=this.options.min),this.options.max>this.options.min?this._state.percentage=[this._toPercentage(this._state.value[0]),this._toPercentage(this._state.value[1]),100*this.options.step/(this.options.max-this.options.min)]:this._state.percentage=[0,0,100],this._layout();var n=this.options.range?this._state.value:this._state.value[0];return i===!0&&this._trigger("slide",n),s!==n&&e===!0&&this._trigger("change",{oldValue:s,newValue:n}),this._setDataVal(n),this},destroy:function(){this._removeSliderEventHandlers(),this.sliderElem.parentNode.removeChild(this.sliderElem),this.element.style.display="",this._cleanUpEventCallbacksMap(),this.element.removeAttribute("data"),t&&(this._unbindJQueryEventHandlers(),this.$element.removeData("slider"))},disable:function(){return this._state.enabled=!1,this.handle1.removeAttribute("tabindex"),this.handle2.removeAttribute("tabindex"),this._addClass(this.sliderElem,"slider-disabled"),this._trigger("slideDisabled"),this},enable:function(){return this._state.enabled=!0,this.handle1.setAttribute("tabindex",0),this.handle2.setAttribute("tabindex",0),this._removeClass(this.sliderElem,"slider-disabled"),this._trigger("slideEnabled"),this},toggle:function(){return this._state.enabled?this.disable():this.enable(),this},isEnabled:function(){return this._state.enabled},on:function(t,i){return this._bindNonQueryEventHandler(t,i),this},off:function(i,e){t?(this.$element.off(i,e),this.$sliderElem.off(i,e)):this._unbindNonQueryEventHandler(i,e)},getAttribute:function(t){return t?this.options[t]:this.options},setAttribute:function(t,i){return this.options[t]=i,this},refresh:function(){return this._removeSliderEventHandlers(),e.call(this,this.element,this.options),t&&t.data(this.element,"slider",this),this},relayout:function(){return this._layout(),this},_removeSliderEventHandlers:function(){this.handle1.removeEventListener("keydown",this.handle1Keydown,!1),this.handle2.removeEventListener("keydown",this.handle2Keydown,!1),this.showTooltip&&(this.handle1.removeEventListener("focus",this.showTooltip,!1),this.handle2.removeEventListener("focus",this.showTooltip,!1)),this.hideTooltip&&(this.handle1.removeEventListener("blur",this.hideTooltip,!1),this.handle2.removeEventListener("blur",this.hideTooltip,!1)),this.showTooltip&&this.sliderElem.removeEventListener("mouseenter",this.showTooltip,!1),this.hideTooltip&&this.sliderElem.removeEventListener("mouseleave",this.hideTooltip,!1),this.sliderElem.removeEventListener("touchstart",this.mousedown,!1),this.sliderElem.removeEventListener("mousedown",this.mousedown,!1)},_bindNonQueryEventHandler:function(t,i){void 0===this.eventToCallbackMap[t]&&(this.eventToCallbackMap[t]=[]),this.eventToCallbackMap[t].push(i)},_unbindNonQueryEventHandler:function(t,i){var e=this.eventToCallbackMap[t];if(void 0!==e)for(var s=0;s<e.length;s++)if(e[s]===i){e.splice(s,1);break}},_cleanUpEventCallbacksMap:function(){for(var t=Object.keys(this.eventToCallbackMap),i=0;i<t.length;i++){var e=t[i];this.eventToCallbackMap[e]=null}},_showTooltip:function(){this.options.tooltip_split===!1?(this._addClass(this.tooltip,"in"),this.tooltip_min.style.display="none",this.tooltip_max.style.display="none"):(this._addClass(this.tooltip_min,"in"),this._addClass(this.tooltip_max,"in"),this.tooltip.style.display="none"),this._state.over=!0},_hideTooltip:function(){this._state.inDrag===!1&&this.alwaysShowTooltip!==!0&&(this._removeClass(this.tooltip,"in"),this._removeClass(this.tooltip_min,"in"),this._removeClass(this.tooltip_max,"in")),this._state.over=!1},_layout:function(){var t;if(t=this.options.reversed?[100-this._state.percentage[0],this.options.range?100-this._state.percentage[1]:this._state.percentage[1]]:[this._state.percentage[0],this._state.percentage[1]],this.handle1.style[this.stylePos]=t[0]+"%",this.handle1.setAttribute("aria-valuenow",this._state.value[0]),this.handle2.style[this.stylePos]=t[1]+"%",this.handle2.setAttribute("aria-valuenow",this._state.value[1]),Array.isArray(this.options.ticks)&&this.options.ticks.length>0){var i="vertical"===this.options.orientation?"height":"width",e="vertical"===this.options.orientation?"marginTop":"marginLeft",s=this._state.size/(this.options.ticks.length-1);if(this.tickLabelContainer){var o=0;if(0===this.options.ticks_positions.length)"vertical"!==this.options.orientation&&(this.tickLabelContainer.style[e]=-s/2+"px"),o=this.tickLabelContainer.offsetHeight;else for(n=0;n<this.tickLabelContainer.childNodes.length;n++)this.tickLabelContainer.childNodes[n].offsetHeight>o&&(o=this.tickLabelContainer.childNodes[n].offsetHeight);"horizontal"===this.options.orientation&&(this.sliderElem.style.marginBottom=o+"px")}for(var n=0;n<this.options.ticks.length;n++){var a=this.options.ticks_positions[n]||this._toPercentage(this.options.ticks[n]);this.options.reversed&&(a=100-a),this.ticks[n].style[this.stylePos]=a+"%",this._removeClass(this.ticks[n],"in-selection"),this.options.range?a>=t[0]&&a<=t[1]&&this._addClass(this.ticks[n],"in-selection"):"after"===this.options.selection&&a>=t[0]?this._addClass(this.ticks[n],"in-selection"):"before"===this.options.selection&&a<=t[0]&&this._addClass(this.ticks[n],"in-selection"),this.tickLabels[n]&&(this.tickLabels[n].style[i]=s+"px","vertical"!==this.options.orientation&&void 0!==this.options.ticks_positions[n]?(this.tickLabels[n].style.position="absolute",this.tickLabels[n].style[this.stylePos]=a+"%",this.tickLabels[n].style[e]=-s/2+"px"):"vertical"===this.options.orientation&&(this.tickLabels[n].style.marginLeft=this.sliderElem.offsetWidth+"px",this.tickLabelContainer.style.marginTop=this.sliderElem.offsetWidth/2*-1+"px"))}}var h;if(this.options.range){h=this.options.formatter(this._state.value),this._setText(this.tooltipInner,h),this.tooltip.style[this.stylePos]=(t[1]+t[0])/2+"%","vertical"===this.options.orientation?this._css(this.tooltip,"margin-top",-this.tooltip.offsetHeight/2+"px"):this._css(this.tooltip,"margin-left",-this.tooltip.offsetWidth/2+"px"),"vertical"===this.options.orientation?this._css(this.tooltip,"margin-top",-this.tooltip.offsetHeight/2+"px"):this._css(this.tooltip,"margin-left",-this.tooltip.offsetWidth/2+"px");var l=this.options.formatter(this._state.value[0]);this._setText(this.tooltipInner_min,l);var r=this.options.formatter(this._state.value[1]);this._setText(this.tooltipInner_max,r),this.tooltip_min.style[this.stylePos]=t[0]+"%","vertical"===this.options.orientation?this._css(this.tooltip_min,"margin-top",-this.tooltip_min.offsetHeight/2+"px"):this._css(this.tooltip_min,"margin-left",-this.tooltip_min.offsetWidth/2+"px"),this.tooltip_max.style[this.stylePos]=t[1]+"%","vertical"===this.options.orientation?this._css(this.tooltip_max,"margin-top",-this.tooltip_max.offsetHeight/2+"px"):this._css(this.tooltip_max,"margin-left",-this.tooltip_max.offsetWidth/2+"px")}else h=this.options.formatter(this._state.value[0]),this._setText(this.tooltipInner,h),this.tooltip.style[this.stylePos]=t[0]+"%","vertical"===this.options.orientation?this._css(this.tooltip,"margin-top",-this.tooltip.offsetHeight/2+"px"):this._css(this.tooltip,"margin-left",-this.tooltip.offsetWidth/2+"px");if("vertical"===this.options.orientation)this.trackLow.style.top="0",this.trackLow.style.height=Math.min(t[0],t[1])+"%",this.trackSelection.style.top=Math.min(t[0],t[1])+"%",this.trackSelection.style.height=Math.abs(t[0]-t[1])+"%",this.trackHigh.style.bottom="0",this.trackHigh.style.height=100-Math.min(t[0],t[1])-Math.abs(t[0]-t[1])+"%";else{this.trackLow.style.left="0",this.trackLow.style.width=Math.min(t[0],t[1])+"%",this.trackSelection.style.left=Math.min(t[0],t[1])+"%",this.trackSelection.style.width=Math.abs(t[0]-t[1])+"%",this.trackHigh.style.right="0",this.trackHigh.style.width=100-Math.min(t[0],t[1])-Math.abs(t[0]-t[1])+"%";var p=this.tooltip_min.getBoundingClientRect(),d=this.tooltip_max.getBoundingClientRect();p.right>d.left?(this._removeClass(this.tooltip_max,"top"),this._addClass(this.tooltip_max,"bottom"),this.tooltip_max.style.top="18px"):(this._removeClass(this.tooltip_max,"bottom"),this._addClass(this.tooltip_max,"top"),this.tooltip_max.style.top=this.tooltip_min.style.top)}},_removeProperty:function(t,i){t.style.removeProperty?t.style.removeProperty(i):t.style.removeAttribute(i)},_mousedown:function(t){if(!this._state.enabled)return!1;this._state.offset=this._offset(this.sliderElem),this._state.size=this.sliderElem[this.sizePos];var i=this._getPercentage(t);if(this.options.range){var e=Math.abs(this._state.percentage[0]-i),s=Math.abs(this._state.percentage[1]-i);this._state.dragged=s>e?0:1}else this._state.dragged=0;this._state.percentage[this._state.dragged]=i,this._layout(),this.touchCapable&&(document.removeEventListener("touchmove",this.mousemove,!1),document.removeEventListener("touchend",this.mouseup,!1)),this.mousemove&&document.removeEventListener("mousemove",this.mousemove,!1),this.mouseup&&document.removeEventListener("mouseup",this.mouseup,!1),this.mousemove=this._mousemove.bind(this),this.mouseup=this._mouseup.bind(this),this.touchCapable&&(document.addEventListener("touchmove",this.mousemove,!1),document.addEventListener("touchend",this.mouseup,!1)),document.addEventListener("mousemove",this.mousemove,!1),document.addEventListener("mouseup",this.mouseup,!1),this._state.inDrag=!0;var o=this._calculateValue();return this._trigger("slideStart",o),this._setDataVal(o),this.setValue(o,!1,!0),this._pauseEvent(t),this.options.focus&&this._triggerFocusOnHandle(this._state.dragged),!0},_triggerFocusOnHandle:function(t){0===t&&this.handle1.focus(),1===t&&this.handle2.focus()},_keydown:function(t,i){if(!this._state.enabled)return!1;var e;switch(i.keyCode){case 37:case 40:e=-1;break;case 39:case 38:e=1}if(e){if(this.options.natural_arrow_keys){var s="vertical"===this.options.orientation&&!this.options.reversed,o="horizontal"===this.options.orientation&&this.options.reversed;(s||o)&&(e=-e)}var n=this._state.value[t]+e*this.options.step;return this.options.range&&(n=[t?this._state.value[0]:n,t?n:this._state.value[1]]),this._trigger("slideStart",n),this._setDataVal(n),this.setValue(n,!0,!0),this._setDataVal(n),this._trigger("slideStop",n),this._layout(),this._pauseEvent(i),!1}},_pauseEvent:function(t){t.stopPropagation&&t.stopPropagation(),t.preventDefault&&t.preventDefault(),t.cancelBubble=!0,t.returnValue=!1},_mousemove:function(t){if(!this._state.enabled)return!1;var i=this._getPercentage(t);this._adjustPercentageForRangeSliders(i),this._state.percentage[this._state.dragged]=i,this._layout();var e=this._calculateValue(!0);return this.setValue(e,!0,!0),!1},_adjustPercentageForRangeSliders:function(t){if(this.options.range){var i=this._getNumDigitsAfterDecimalPlace(t);i=i?i-1:0;var e=this._applyToFixedAndParseFloat(t,i);0===this._state.dragged&&this._applyToFixedAndParseFloat(this._state.percentage[1],i)<e?(this._state.percentage[0]=this._state.percentage[1],this._state.dragged=1):1===this._state.dragged&&this._applyToFixedAndParseFloat(this._state.percentage[0],i)>e&&(this._state.percentage[1]=this._state.percentage[0],this._state.dragged=0)}},_mouseup:function(){if(!this._state.enabled)return!1;this.touchCapable&&(document.removeEventListener("touchmove",this.mousemove,!1),document.removeEventListener("touchend",this.mouseup,!1)),document.removeEventListener("mousemove",this.mousemove,!1),document.removeEventListener("mouseup",this.mouseup,!1),this._state.inDrag=!1,this._state.over===!1&&this._hideTooltip();var t=this._calculateValue(!0);return this._layout(),this._setDataVal(t),this._trigger("slideStop",t),!1},_calculateValue:function(t){var i;if(this.options.range?(i=[this.options.min,this.options.max],0!==this._state.percentage[0]&&(i[0]=this._toValue(this._state.percentage[0]),i[0]=this._applyPrecision(i[0])),100!==this._state.percentage[1]&&(i[1]=this._toValue(this._state.percentage[1]),i[1]=this._applyPrecision(i[1]))):(i=this._toValue(this._state.percentage[0]),i=parseFloat(i),i=this._applyPrecision(i)),t){for(var e=[i,1/0],s=0;s<this.options.ticks.length;s++){var o=Math.abs(this.options.ticks[s]-i);o<=e[1]&&(e=[this.options.ticks[s],o])}if(e[1]<=this.options.ticks_snap_bounds)return e[0]}return i},_applyPrecision:function(t){var i=this.options.precision||this._getNumDigitsAfterDecimalPlace(this.options.step);return this._applyToFixedAndParseFloat(t,i)},_getNumDigitsAfterDecimalPlace:function(t){var i=(""+t).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);return i?Math.max(0,(i[1]?i[1].length:0)-(i[2]?+i[2]:0)):0},_applyToFixedAndParseFloat:function(t,i){var e=t.toFixed(i);return parseFloat(e)},_getPercentage:function(t){!this.touchCapable||"touchstart"!==t.type&&"touchmove"!==t.type||(t=t.touches[0]);var i=t[this.mousePos],e=this._state.offset[this.stylePos],s=i-e,o=s/this._state.size*100;return o=Math.round(o/this._state.percentage[2])*this._state.percentage[2],this.options.reversed&&(o=100-o),Math.max(0,Math.min(100,o))},_validateInputValue:function(t){if("number"==typeof t)return t;if(Array.isArray(t))return this._validateArray(t),t;throw new Error(s.formatInvalidInputErrorMsg(t))},_validateArray:function(t){for(var i=0;i<t.length;i++){var e=t[i];if("number"!=typeof e)throw new Error(s.formatInvalidInputErrorMsg(e))}},_setDataVal:function(t){this.element.setAttribute("data-value",t),this.element.setAttribute("value",t),this.element.value=t},_trigger:function(i,e){e=e||0===e?e:void 0;var s=this.eventToCallbackMap[i];if(s&&s.length)for(var o=0;o<s.length;o++){var n=s[o];n(e)}t&&this._triggerJQueryEvent(i,e)},_triggerJQueryEvent:function(t,i){var e={type:t,value:i};this.$element.trigger(e),this.$sliderElem.trigger(e)},_unbindJQueryEventHandlers:function(){this.$element.off(),this.$sliderElem.off()},_setText:function(t,i){"undefined"!=typeof t.innerText?t.innerText=i:"undefined"!=typeof t.textContent&&(t.textContent=i)},_removeClass:function(t,i){for(var e=i.split(" "),s=t.className,o=0;o<e.length;o++){var n=e[o],a=new RegExp("(?:\\s|^)"+n+"(?:\\s|$)");s=s.replace(a," ")}t.className=s.trim()},_addClass:function(t,i){for(var e=i.split(" "),s=t.className,o=0;o<e.length;o++){var n=e[o],a=new RegExp("(?:\\s|^)"+n+"(?:\\s|$)"),h=a.test(s);h||(s+=" "+n)}t.className=s.trim()},_offsetLeft:function(t){return t.getBoundingClientRect().left},_offsetTop:function(t){for(var i=t.offsetTop;(t=t.offsetParent)&&!isNaN(t.offsetTop);)i+=t.offsetTop;return i},_offset:function(t){return{left:this._offsetLeft(t),top:this._offsetTop(t)}},_css:function(i,e,s){if(t)t.style(i,e,s);else{var o=e.replace(/^-ms-/,"ms-").replace(/-([\da-z])/gi,function(t,i){return i.toUpperCase()});i.style[o]=s}},_toValue:function(t){return this.options.scale.toValue.apply(this,[t])},_toPercentage:function(t){return this.options.scale.toPercentage.apply(this,[t])},_setTooltipPosition:function(){var t=[this.tooltip,this.tooltip_min,this.tooltip_max];if("vertical"===this.options.orientation){var i=this.options.tooltip_position||"right",e="left"===i?"right":"left";t.forEach(function(t){this._addClass(t,i),t.style[e]="100%"}.bind(this))}else"bottom"===this.options.tooltip_position?t.forEach(function(t){this._addClass(t,"bottom"),t.style.top="22px"}.bind(this)):t.forEach(function(t){this._addClass(t,"top"),t.style.top=-this.tooltip.outerHeight-14+"px"}.bind(this))}},t){var n=t.fn.slider?"bootstrapSlider":"slider";t.bridget(n,i)}}(t),i});


// functions-plugin.js
/*HTML Functions Start*/
var chosenContainerBackdrop = function () {
    return {
        //main function to initiate the module
        init: function () {
            jQuery(document).on("click", ".chosen-container", function () {
                var count = 0;
                var chosen_container = jQuery(".chosen-container");
                var get_chosen_drop_width = jQuery(this).parent().width();
                if (jQuery(".chosen-search").length > 0) {
                    var get_chosen_search_height = jQuery(this).find(".chosen-search").innerHeight();
                }
                jQuery("body").find(".chosen-has-backdrop").removeClass("chosen-has-backdrop").css({
                    "position": "",
                    "z-index": ""
                });
                if (chosen_container.hasClass("chosen-with-drop")) {
                    jQuery(".chosen-backdrop").remove();
                    jQuery(this).parent().append("<div class='chosen-backdrop'></div>");
                    jQuery(this).parent().addClass("chosen-has-backdrop");
                    jQuery(".chosen-has-backdrop").css({
                        "position": "relative",
                        "z-index": "101"
                    });
                    var get_chosen_drop_height = [];
                    jQuery(this).find("li").each(function (index) {
                        get_chosen_drop_height[index] = jQuery(this).innerHeight();
                        count = count + get_chosen_drop_height[index];
                    });
                    jQuery(".chosen-backdrop").css({
                        "height": count,
                        "max-height": 240 + get_chosen_search_height,
                        "position": "absolute",
                        "left": 0,
                        "top": "100%",
                        "width": get_chosen_drop_width,
                        "z-index": "2",
                    });
                } else {
                    jQuery("body").find(".chosen-has-backdrop").removeClass("chosen-has-backdrop").css({
                        "position": "",
                        "z-index": ""
                    });
                    jQuery(".chosen-backdrop").remove();
                }
            });
            jQuery(document).click(function (event) {
                if (!(jQuery(event.target).closest(".chosen-container").length)) {
                    jQuery("body").find(".chosen-has-backdrop").removeClass("chosen-has-backdrop").css({
                        "position": "",
                        "z-index": ""
                    });
                    jQuery(".chosen-backdrop").remove();
                }
            });
        }
    };
}();
jQuery(document).ready(function () {

    jQuery('.menu-itam-holder .menu-itam-list .image-holder a').attr('rel', 'prettyPhoto');

    jQuery(document).on("click", "#update_membership", function (e) {
        e.preventDefault();
        jQuery('#membership_current').css("display", "none");
        jQuery('#membership_buy').css("display", "block");
    });
    jQuery(document).on("click", "#cancel_btn_membership", function (e) {
        e.preventDefault();
        jQuery('#membership_current').css("display", "block");
        jQuery('#membership_buy').css("display", "none");
    });

    jQuery('a.send-invitation').click(function () {
        event.preventDefault();
        $('.invited_team_member').delay(200).queue(function (next) {
            jQuery('.invited_team_member').addClass('active');
            jQuery('body').addClass('invite-member-open');
            next();
        });
        jQuery('body').find('#overlay').remove();
        jQuery(this).append('<div id="overlay" style="display:none"></div>');
        jQuery('#overlay').fadeIn(300);
    });
    jQuery(document).on("click", ".invite-member a.cancel", function (e) {
        e.preventDefault();
        jQuery('body').removeClass('invite-member-open');
        jQuery(this).parents('invited_team_member').removeClass("active");
        jQuery(this).parents('invited_team_member').hide();
        jQuery('#overlay').fadeOut(300);
        setTimeout(function () {
            jQuery('#overlay').remove();
        }, 400);
    });

    jQuery('a.add-more.add_team_member').click(function () {
        event.preventDefault();
        $('.invite-member.add-member').delay(200).queue(function (next) {
            jQuery('.invite-member.add-member').addClass('active');
            jQuery('body').addClass('invite-member-open');
            next();
        });
        jQuery('body').find('#overlay').remove();
        jQuery(this).append('<div id="overlay" style="display:none"></div>');
        jQuery('#overlay').fadeIn(300);
    });
    jQuery(document).on("click", ".invite-member a.cancel", function (e) {
        e.preventDefault();
        jQuery('body').removeClass('invite-member-open');
        jQuery(this).parents('invite-member.add-member').removeClass("active");
        jQuery(this).parents('invite-member.add-member').hide();
        jQuery('#overlay').fadeOut(300);
        setTimeout(function () {
            jQuery('#overlay').remove();
        }, 400);
    });

    jQuery('a.restaurant-team-member-det').click(function () {
        event.preventDefault();
        $('.invite-member.team-member-det-box').delay(200).queue(function (next) {
            jQuery('.invite-member.team-member-det-box').addClass('active');
            jQuery('body').addClass('invite-member-open');
            next();
        });
        jQuery('body').find('#overlay').remove();
        jQuery(this).append('<div id="overlay" style="display:none"></div>');
        jQuery('#overlay').fadeIn(300);
    });
    jQuery(document).on("click", ".invite-member a.cancel", function (e) {
        e.preventDefault();
        jQuery('body').removeClass('invite-member-open');
        jQuery(this).parents('invite-member.team-member-det-box').removeClass("active");
        jQuery(this).parents('invite-member.team-member-det-box').hide();
        jQuery('#overlay').fadeOut(300);
        setTimeout(function () {
            jQuery('#overlay').remove();
        }, 400);
    });


    jQuery('#profile_delete, #id_truebtn, #id_falsebtn').click(function () {
        event.preventDefault();
        jQuery('#id_confrmdiv').toggle('fast');
    });
    jQuery('.dashboard-review-reply-btn').click(function () {
        event.preventDefault();
        jQuery('.dashbard-user-reviews-list').css("display", "none");;
        jQuery('.dashboard-add-new-review-holder.add-new-review-holder').css("display", "block");
    });
    jQuery('.close-post-new-reviews-btn').click(function () {
        event.preventDefault();
        jQuery('.dashbard-user-reviews-list').css("display", "block");
        jQuery('.dashboard-add-new-review-holder.add-new-review-holder').css("display", "none");
    });



    jQuery(document).on("click", ".user-dashboard-menu > ul > li.user-dashboard-menu-children > a", function () {
        jQuery(this).parent().toggleClass('menu-open');
        jQuery(this).parent().siblings().removeClass('menu-open');
        setTimeout(function () {
            jQuery('.user-dashboard-menu > ul > li.user-dashboard-menu-children > a').addClass('open-overlay');
        }, 2);
        jQuery(".user-dashboard-menu > ul > li").append("<div class='location-overlay'></div>");
        jQuery(".user-dashboard-menu > ul > li > ul").append("<i class='icon-cross3 close-menu-location'></i>");
    });
    jQuery(document).on("click", ".user-dashboard-menu > ul > li.user-dashboard-menu-children > a.open-overlay", function () {
        jQuery(".location-overlay").remove();
        jQuery(".close-menu-location").remove();
        setTimeout(function () {
            jQuery('.user-dashboard-menu > ul > li.user-dashboard-menu-children > a').removeClass('open-overlay');
        }, 2);
    });
    jQuery(document).on("click", ".location-overlay", function () {
        jQuery(this).closest(".location-overlay").remove();
        jQuery(".close-menu-location").remove();
        jQuery('.user-dashboard-menu > ul > li.user-dashboard-menu-children').removeClass("menu-open");
        jQuery('.user-dashboard-menu > ul > li.user-dashboard-menu-children > a').removeClass('open-overlay');
    });
    jQuery(document).on("click", ".close-menu-location", function () {
        jQuery(this).closest(".close-menu-location").remove();
        jQuery(".location-overlay").remove();
        jQuery('.user-dashboard-menu > ul > li.user-dashboard-menu-children').removeClass("menu-open");
        jQuery('.user-dashboard-menu > ul > li.user-dashboard-menu-children > a').removeClass('open-overlay');
    });

    /*
     * custom scroll oder detail popup.
     */
    if (jQuery(".menu-order-detail .modal-dialog .modal-content").length != '') {
        $(".menu-order-detail .modal-dialog .modal-content").mCustomScrollbar({
            setHeight: 724,
        });
    }
    /*
     * end custom scroll oder detail popup.
     */

    /*Main Navigation Function Start*/
    if (jQuery(".main-navigation>ul").length != '') {
        if (typeof jQuery(document).slicknav != "undefined") {
            jQuery('.main-navigation>ul').slicknav({
                prependTo: '.main-nav'
            });
        }
    }
    jQuery('.filter-toggle').click(function () {
        jQuery(this).toggleClass("active").next().slideToggle();
    });

    function inherit(proto) {
        function F() {}
        F.prototype = proto
        return new F
    }
    var prevEleHeight;

    function stickyElement(element, width, eleOrder, elePos, stopTarget) {
        // properties
        this.element = element;
        this.width = width;
        this.order = eleOrder;
        // this.offsetTop = element.offset().top;
        this.defualtWidth = element.parent().width();
        this.defualtPos = elePos;
        this.stopper = stopTarget;

        // Methods
        this.defaultValues = function () {
            this.element.css({
                "position": "relative",
                "width": '100%',
                "top": "auto"
            });
            this.element.parent().css("height", 'auto');
        }
        this.setWidth = function () {
            if (this.element.parent().is(".sticky-wrpper") || this.element.parent()) {
                wrapWith = this.element.parent().width();
                this.element.css("width", wrapWith + 'px');
            }
        }
        this.elPosition = function () {
            this.element.css("position", "fixed");
        }
        this.setTop = function () {
            this.element.css("top", "0");
            if (this.order != undefined) {
                if (this.defualtPos == 'initialPos') {
                    this.element.css("top", this.offsetTop);
                } else if (this.defualtPos != undefined) {
                    this.element.css("top", this.defualtPos + 'px');
                }
                prevEleHeight = this.element.outerHeight();
            } else {
                this.element.css("top", prevEleHeight);
                prevEleHeight = prevEleHeight + prevEleHeight;
            }
        }
        this.addWrapper = function () {
            if (!this.element.parent().hasClass("sticky-wrpper")) {
                this.element.wrap("<div class='sticky-wrpper'></div>").height();
                this.element.parent().css("height", this.element.outerHeight(true) + 'px');
            }
        }
        this.addStoper = function () {
            if (this.stopper.find(".sticky-stopper").length == 0) {
                this.stopper.append("<span class='sticky-stopper'></span>");
            }
        }
        this.withResponsive = function () {

        }
    }
    if ($(".stickynav-tabs").length > 0) {
        var stickyHeader, stickySearch;
        var headerHeight = $("#header").outerHeight();
        stickyHeader = new stickyElement($(".stickynav-tabs"), 'initial', 'first', '15');
        stickySearch = new stickyElement($(".sticky-search"), 'initial', '', '58', $(".tab-content"));
        var eleTop, eleTop2

        eleTop = stickyHeader.offsetTop + headerHeight - 13;
        eleTop2 = stickySearch.offsetTop + headerHeight - 13;
        if ($("body").find("#wpadminbar").length) {
            stickyHeader = new stickyElement($(".stickynav-tabs"), '', 'first', '47');
            stickySearch = new stickyElement($(".sticky-search"), '', '', '90', $(".tab-content"));
            eleTop = stickyHeader.offsetTop + 25;
            eleTop2 = stickySearch.offsetTop + 25;
        }
        jQuery(window).scroll(function () {
            if ($(window).width() + 17 > 960) {
                var windowTop = $(window).scrollTop();
                if (windowTop >= eleTop) {
                    stickyHeader.elPosition();
                    stickyHeader.setTop();
                    stickyHeader.setWidth();
                    stickyHeader.addWrapper();

                    stickySearch.elPosition();
                    stickySearch.setTop();
                    stickySearch.setWidth();
                    stickySearch.addWrapper();
                    stickySearch.addStoper();
                    var stoperTop = $(".sticky-stopper").offset().top - 160;
                    if (windowTop >= stoperTop) {
                        stickyHeader.defaultValues();
                        stickySearch.defaultValues();
                    }
                } else {
                    stickyHeader.defaultValues();
                    stickySearch.defaultValues();
                }
            } else {
                stickyHeader.defaultValues();
                stickySearch.defaultValues();
            }
        });
        $(window).resize(function () {
            stickyHeader.setWidth();
            stickySearch.setWidth();
            if ($(window).width() + 17 < 960) {
                stickyHeader.defaultValues();
                stickySearch.defaultValues();
            }
        });
    }
    /*Sticky Search Bar End*/
    // Touch Behaviorr for Mobile devices
    chosenContainerBackdrop.init();
    if ($('.chosen-container').length > 0) {
        $('.chosen-container').on('touchstart', function (e) {
            e.stopPropagation();
            e.preventDefault();
            // Trigger the mousedown event.
            $(this).trigger('mousedown');
        });
    }
    /*Chosen Select Functions Start*/
    if (jQuery(".chosen-select, .chosen-select-deselect, .chosen-select-no-single, .chosen-select-no-results, .chosen-select-width").length != '') {
        var config = {
            '.chosen-select': {},
            '.chosen-select-deselect': {
                allow_single_deselect: true
            },
            '.chosen-select-no-single': {
                disable_search_threshold: 10
            },
            '.chosen-select-no-results': {
                no_results_text: 'Oops, nothing found!'
            },
            '.chosen-select-width': {
                width: "95%"
            }
        }
        // for (var selector in config) {
        //     $(selector).chosen(config[selector]);
        // }
    };
    /*Chosen Select Functions End*/
    /* Date Time picker */
    if (jQuery('#datetimepicker1').length != '') {
        jQuery('#datetimepicker1').datetimepicker({
            icons: {
                time: "icon-clock-o",
                date: "icon-calendar-o",
                up: " icon-chevron-up",
                down: "icon-chevron-down"
            }
        });
    }
    if (jQuery('#datetimepicker4').length != '') {
        jQuery('#datetimepicker4').datetimepicker({
            icons: {
                time: "icon-clock-o",
                date: "icon-calendar-o",
                up: " icon-chevron-up",
                down: "icon-chevron-down"
            }
        });
    }
    /*Reviews Sortby Functions Start*/
    $(document).on("click", ".reviews-sortby li.reviews-sortby-active", function () {
        jQuery('.reviews-sortby > li').siblings().removeClass('reviews-sortby-active');
    });
    jQuery('.input-reviews > .radio-field label').on('click', function () {
        jQuery(this).parent().toggleClass('active');
        jQuery(this).parent().siblings().removeClass('active');
        /*replace inner Html*/
        var radio_field_active = jQuery(this).html();
        jQuery(".active-sort").html(radio_field_active);
        jQuery('.reviews-sortby > li').removeClass('reviews-sortby-active');
    });
    /*Reviews Sortby Functions End*/
    if (jQuery(".company-holder.default .swiper-container").length != '') {
        var swiper = new Swiper('.company-holder.default .swiper-container', {
            pagination: '.swiper-pagination',
            slidesPerView: 6,
            slidesPerColumn: 2,
            autoplay: 3500,
            nextButton: '.swiper-button-next',
            prevButton: '.swiper-button-prev',
            spaceBetween: 30,
            breakpoints: {
                1024: {
                    slidesPerView: 4,
                    spaceBetween: 40
                },
                768: {
                    slidesPerView: 3,
                    spaceBetween: 30
                },
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20
                },
                320: {
                    slidesPerView: 1,
                    spaceBetween: 10
                }
            }
        });
    }

    var swiper = new Swiper('.company-holder.fancy .swiper-container', {
        slidesPerView: 6,
        spaceBetween: 20,
        loop: true,
        nextButton: '.fancy-button-next',
        prevButton: '.fancy-button-prev',
    });

    /* blog Slider Start */
    if (jQuery(".blog .swiper-container").length != '') {
        var swiper = new Swiper('.blog .swiper-container', {
            slidesPerView: 'auto',
            loop: true,
            autoplay: 3500,
            autoplayDisableOnInteraction: false,
            paginationClickable: true,
            nextButton: '.swiper-button-next',
            prevButton: '.swiper-button-prev'

        });
    }
    /*blog Detasil Slider Start*/
    if (jQuery(".blog-detail .swiper-container").length != '') {
        var swiper = new Swiper('.blog-detail .swiper-container', {
            loop: true,
            autoplay: 3500,
            nextButton: '.swiper-button-next',
            prevButton: '.swiper-button-prev',
            pagination: '.swiper-pagination',
            paginationClickable: true,
            slidesPerView: 3,
            breakpoints: {
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 40
                },
                768: {
                    slidesPerView: 3,
                    spaceBetween: 30
                },
                700: {
                    slidesPerView: 2,
                    spaceBetween: 30
                },
                480: {
                    slidesPerView: 1,
                    spaceBetween: 30
                }
            }
        });

    }
    /* blog Slider End */
    /*Delivery Timing Dropdown Functions Start*/
    $(".delivery-timing .reviews-sortby-active").on("click", function () {
        $(this).next("ul").slideToggle();
        $(this).parents("ul").toggleClass("open");
        $('.delivery-dropdown > li > a').on('click', function (e) {
            e.preventDefault();
            var anchorText = $(this).text();
            $(".delivery-timing .reviews-sortby-active small").text(anchorText);
            $(".delivery-timing .reviews-sortby-active").next("ul").slideUp();
            $(this).parents("ul").removeClass("open");
        });
    });
    $(document).mouseup(function (e) {
        var container = $(".delivery-timing > ul");
        if (!container.is(e.target) &&
            container.has(e.target).length === 0) {
            $(".delivery-timing .reviews-sortby-active").next("ul").hide();
            $(".delivery-timing > ul").removeClass("open");
        }
    });
    /*Delivery Timing Dropdown Functions End*/

    // if ($(window).width() > 991) {
    //     if (jQuery(".sticky-sidebar").length != '') {
    //         $('.sticky-sidebar')
    //             .theiaStickySidebar({
    //                 additionalMarginTop: 30
    //             });
    //     }
    // }
    /*Sticky Function End*/

    /*Location Popup Function Start*/
    $(document).on("click", "#pop-close", function () {
        $('#popup').addClass('popup-open');
    });
    $(document).on("click", "#close", function () {
        $('#popup').removeClass('popup-open');
    });
    /*Location Popup Function End*/

});
/*----------Window Load Function Start----------*/

/*HTML Functions End*/
