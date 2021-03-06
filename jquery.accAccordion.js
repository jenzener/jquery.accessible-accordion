/*!
 * jQuery Accessible Accordion
 *
 * @description: Creates an accessible accordion - collapsible content panels
 * @source: https://github.com/jenzener/jquery.accessible-accordion.git
 * @originalsource: https://github.com/nomensa/jquery.accessible-accordion.git
 * @version: '1.0.3'
 *
 * @author: Volodymyr Kmet | Mischa Sameli
 * @originalauthor: Nomensa
 * @license: licenced under MIT - http://opensource.org/licenses/mit-license.php
 */

(function ($, window, document, undefined) {
    'use strict';

    var pluginName,
        defaults,
        counter = 0;

    pluginName = 'accAccordion';
    defaults = {
        // Should the active tab be hidden off-screen
        activeControlHidden: false,
        // Specify which panel to open by default using 0-based position
        defaultPanel: false,
        // Callback when the plugin is created
        callbackCreate: function() {},
        // Callback when the plugin is destroyed
        callbackDestroy: function() {},
        // A class for the accordion
        containerClass: 'js-accordion',
        // A class for when the accordion is horizontal
        containerClassHorizontal: 'js-accordion--horizontal',
        // Should the accordion be horizontal
        horizontal: false,
        // Class to be applied to the panel
        panelClass: 'js-accordion_panel',
        // Ids for panels should start with the following string
        panelId: 'js-accordion_panel--',
        // Class to apply to each panel control
        panelControlClass: 'js-accordion_control',
        // A class applied to the active panel control
        panelControlActiveClass: 'js-accordion_control--active',
        // A class applied if the panel control is hidden. Only used when the activeControlHidden & horizontal options are true
        panelControlHiddenClass: 'js-accordion_control--hidden',
        // Ids for panel controls should start with the following string
        panelControlId: 'js-accordion_control--',
        // Class applied to panel titles. Only used when the activeControlHidden & horizontal options are true
        panelTitleClass: 'js-accordion_panel-title',
        // The width of the panel in % for horizontal accordion
        panelWidth: 33,
        // To scroll the viewport onto the active panel
        scrollToPanel: false,
        // To scroll the viewport to the body of active panel
        scrollToAnchor: false,
        // Relies on 'scrollToPanel' to be true
        // The animation speed for the 'scrollToPanel' option
        scrollToPanelSpeed: 200,
        // fadeIn option activated
        slideDown : false,
        // fadeIn options
        slideDownOptions : {},
        // toggle option activated
        slideUp : false,
        // fadeToggle options
        slideUpOptions : {},
        // state indicators elements
        stateIndicators: {
            elements: {
                className: 'js-accordion-state-indicator',
                open: '',
                close: '',
                position: 'after'
            }
        }
    };

    function addStateIndicator(options, element, state) {
        var conf = options.stateIndicators,
            stateElement;

        if (conf.enabled) {
            stateElement = $(conf.elements[state]).clone();

            element.find('.'+conf.elements.className).remove();

            switch(conf.elements.position) {
                case 'after': {
                    element.append(stateElement);
                    break;
                }
                case 'before': {
                    element.prepend(stateElement);
                    break;
                }
            }
        }
    }

    function AccAccordion(element, options) {
        /*
         Constructor function for the nav pattern plugin
         */
        var self = this,
            stateElements = {};

        self.element = $(element);
        // Combine user options with default options
        options.stateIndicators = options.stateIndicators || {};
        options.stateIndicators.elements  = $.extend(defaults.stateIndicators.elements, options.stateIndicators.elements || {});
        self.options = $.extend({}, defaults, options);
        stateElements = self.options.stateIndicators.elements;

        self.options.stateIndicators.enabled = !!(stateElements.open && stateElements.close);
        if (self.options.stateIndicators.enabled) {
            stateElements.open = $(stateElements.open).addClass(stateElements.className + ' ' + stateElements.className+'--open');
            stateElements.close = $(stateElements.close).addClass(stateElements.className + ' ' + stateElements.className+'--close');
        }

        function init() {
            /*
             Our init function to create an instance of the plugin
             */
            // Add classes and attributes to panel and controls
            $('> div.'+options.accordeon_container_class, self.element).each(function(index, value) {
                // Panel
                $(value)
                    .addClass(self.options.panelClass)
                    .attr({
                        'aria-hidden': 'true',
                        'aria-labelledby': self.options.panelControlId + counter + index,
                        'id': self.options.panelId + counter + index
                    })
                    .hide();

                // Control
                $(value).prev()
                    .addClass(self.options.panelControlClass)
                    .attr({
                        'aria-controls': self.options.panelId + counter + index,
                        'aria-expanded': 'false',
                        'aria-pressed': 'false',
                        'id': self.options.panelControlId + counter + index,
                        'role': 'button',
                        'tabindex': 0
                    })
                    .click(createHandleClick(self))
                    .keydown(createHandleKeyDown(self))
                    .wrapInner('<span />');

                //add state indicators
                addStateIndicator(self.options, $(value).prev(), 'open');
            });

            // Activate the default panel
            if (self.options.defaultPanel !== false) {
                var applyEffect = false;
                self.open($('.' + self.options.panelControlClass, self.element).eq(self.options.defaultPanel), applyEffect);
            }

            // Add the active class
            self.element.addClass(self.options.containerClass);

            // Additional initialization for horizontal accordion
            if (self.options.horizontal === true) {
                // Add horizontal class
                self.element.addClass(self.options.containerClassHorizontal);

                if (self.options.activeControlHidden === true) {
                    addHeadingsToPanels();
                }

                self.calculateWidths();
                self.calculateHeights();
            }

            // Increment counter for unique ID's
            counter++;

            self.options.callbackCreate();
        }

        function createHandleClick() {
            /*
             Create the click event handle
             */
            self.handleClick = function(event) {
                event.preventDefault();

                self.toggle($(this));
            };
            return self.handleClick;
        }

        function createHandleKeyDown() {
            /*
             Create the keydown event handle
             */
            self.handleKeyDown = function(event) {
                switch (event.which) {
                    // arrow left or up
                    case 37:
                    case 38:
                        event.preventDefault();

                        // Allow us to loop through the controls
                        if ($(this).prevAll('.' + self.options.panelControlClass).eq(0).length !== 0) {
                            $(this).prevAll('.' + self.options.panelControlClass).eq(0).focus();
                        } else {
                            $(self.element).find('.' + self.options.panelControlClass).last().focus();
                        }
                        break;
                    // arrow right or down
                    case 39:
                    case 40:
                        event.preventDefault();

                        // Allow us to loop through the controls
                        if ($(this).nextAll('.' + self.options.panelControlClass).eq(0).length !== 0) {
                            $(this).nextAll('.' + self.options.panelControlClass).eq(0).focus();
                        } else {
                            $(self.element).find('.' + self.options.panelControlClass).first().focus();
                        }
                        break;
                    // spacebar or enter
                    case 32:
                    case 13:
                        event.preventDefault();

                        self.toggle($(this));
                        break;
                }
            };
            return self.handleKeyDown;
        }

        function addHeadingsToPanels() {
            /*
             Add headings to all panels (the headings will be the same as the relevant tab text )
             */
            var headingText;

            self.element.find('.' + self.options.panelClass).each(function() {
                headingText = $(this).prev('.' + self.options.panelControlClass).text();

                $(this).prepend('<p aria-hidden="true" class="' + self.options.panelTitleClass + '">' + headingText + '</p>');
            });
        }

        if (self.options.horizontal === true) {
            $(window).on('debouncedresize', function() {
                /*
                 Recalculate the horizontal accordion width and heights when window is resized
                 @req: https://github.com/louisremi/jquery-smartresize
                 */
                self.calculateWidths();
                self.calculateHeights();
            });
        }

        init();
    }

    AccAccordion.prototype.calculateWidths = function() {
        /*
         Public method for calculating widths for panels and controls
         */
        var controls = this.element.find('.' + this.options.panelControlClass),
            countControls,
            controlsWidths,
            panels = this.element.find('.' + this.options.panelClass),
            panelWidths = this.options.panelWidth;

        if (this.options.activeControlHidden === true) {
            // One tab is always hidden off-screen
            countControls = controls.length - 1;
        } else {
            countControls = controls.length;
        }

        // Recalculate widths of the trigger element to account for the section width
        // First take away the panelWidth from 100% to achieve a new width
        // Then use that new width to find the trigger widths by division
        controlsWidths = ((100 - panelWidths) / countControls);

        panels.css('width', panelWidths + '%');
        controls.css('width', controlsWidths + '%');
    };

    AccAccordion.prototype.calculateHeights = function() {
        /*
         Public method for calculating equal heights for panels and controls
         */
        var controls = this.element.find('.' + this.options.panelControlClass),
            minHeight,
            openPanel;

        // Remove heights incase they already exist so we can recalculate
        controls.css('min-height', 0);

        openPanel = this.element.find('[aria-hidden="false"]');
        minHeight = openPanel.outerHeight();

        controls.css('min-height', minHeight);
    };

    AccAccordion.prototype.setLocationHash = function(hash) {
        if (location.hash != hash) {
            // Clean url
            var url = window.location.href;
            url = url.substr(0, url.lastIndexOf('#'));
            // Add panel ID to url
            window.location.href = url + hash;
        }
    };

    AccAccordion.prototype.scrollTo = function(element, speed) {

        $('html, body').animate({
            scrollTop: element.offset().top
        }, speed || this.options.scrollToPanelSpeed);
    };

    AccAccordion.prototype.toggle = function(control) {
        /*
         Public method for toggling the panel
         */
        var applyEffect = true;
        if (control.attr('aria-pressed') === 'false') {
            this.open(control, applyEffect);
        } else {
            this.close(control);
        }
    };

    AccAccordion.prototype.open = function(control, applyEffect) {
        /*
         Public method for opening the panel
         */
        var self = this,
            activePanelClass = this.options.panelControlActiveClass,
            panelId = '#' + $(control).attr('aria-controls'),
            promises = [];

        // Reset state if another panel is open
        if ($('> [aria-pressed="true"]', this.element).length !== 0) {
            // revert state indicator
            $('> [aria-pressed="true"]', this.element).each(function() {
                addStateIndicator(self.options, $(this), 'open');
            });

            $('> [aria-pressed="true"]', this.element)
                .attr({
                    'aria-expanded': 'false',
                    'aria-pressed': 'false'
                })
                .removeClass(activePanelClass);
            if ( !applyEffect || !this.options.slideUp ){
                $('> [aria-hidden="false"]', this.element)
                    .attr('aria-hidden', 'true')
                    .hide();
            } else {
                promises.push($('> [aria-hidden="false"]', this.element)
                    .attr('aria-hidden', 'true')
                    .slideUp(this.options.slideUpOptions).promise());
            }
        }

        // Update state of newly selected panel
        if ( !applyEffect || !this.options.slideDown ){
            $(panelId, this.element)
                .attr('aria-hidden', 'false')
                .show();
        } else {
            promises.push($(panelId, this.element)
                .attr('aria-hidden', 'false')
                .slideDown(this.options.slideDownOptions).promise());
        }

        // Update state of newly selected panel control
        $(control, this.element)
            .addClass(activePanelClass)
            .attr({
                'aria-expanded': 'true',
                'aria-pressed': 'true'
            });

        // Horizontal accordion specific updates
        if (this.options.horizontal === true) {

            if (this.options.activeControlHidden === true) {
                $('.' + this.options.panelControlHiddenClass, this.element)
                    .removeClass(this.options.panelControlHiddenClass)
                    .attr('tabindex', 0);

                $(control, this.element)
                    .addClass(this.options.panelControlHiddenClass)
                    .attr('tabindex', -1);
            }

            this.calculateWidths();
            this.calculateHeights();
        }

        // adds state indicator
        addStateIndicator(this.options, $(control), 'close');

        // Trigger opened event
        if (promises.length) {
            $.when.apply($, promises).then(function() {
                $(control, self.element).trigger('opened', [self, panelId]);
            });
        } else {
            $(control, self.element).trigger('opened', [self, panelId]);
        }
    };

    AccAccordion.prototype.close = function(control) {
        /*
         Public method for closing the panel
         */

        // Do not close when using activeControlHidden
        if (this.options.activeControlHidden) {
            return false;
        }

        var activePanelClass = this.options.panelControlActiveClass,
            panelId = '#' + $(control).attr('aria-controls');

        // Update state of newly selected panel
        if ( !this.options.slideUp ){
            $(panelId, this.element)
                .attr('aria-hidden', 'true')
                .hide();
        } else {
            $(panelId, this.element)
                .attr('aria-hidden', 'true')
                .slideUp(this.options.slideUpOptions);
        }

        // Update state of newly selected panel control
        $(control, this.element)
            .attr({
                'aria-expanded': 'false',
                'aria-pressed': 'false'
            })
            .removeClass(activePanelClass);

        // adds state indicator
        addStateIndicator(this.options, $(control), 'open');

        //trigger event
        $(control, this.element).trigger('closed', [this]);
    };

    AccAccordion.prototype.destroy = function () {
        /*
         Public method for return the DOM back to its initial state
         */
        var self = this;

        this.element
            .removeAttr('style')
            .removeClass(this.options.containerClass)
            .removeClass(this.options.containerClassHorizontal);

        $('> div', this.element).prev().each(function(index, value) {
            var controlText = $(value).text();

            $(value)
                .removeAttr('aria-controls aria-expanded aria-pressed id role style tabindex')
                .removeClass(self.options.panelControlClass)
                .removeClass(self.options.panelControlActiveClass)
                .removeClass(self.options.panelControlHiddenClass)
                .off()
                .empty()
                .text(controlText);
        });

        $('> div', this.element).each(function(index, value) {
            $(value)
                .removeAttr('aria-hidden aria-labelledby id style')
                .removeClass(self.options.panelClass);
        });

        // Remove any panel titles
        $(this.element).find('.' + this.options.panelTitleClass).remove();

        this.options.callbackDestroy();

        // Scroll to panel
        if (this.options.scrollToPanel) {
            this.setLocationHash('#');
        }

    };


    $.fn[pluginName] = function (options) {
        /*
         Initialise an instance of the plugin on each selected element. Guard against duplicate instantiations.
         */
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new AccAccordion(this, options));
            }
        });
    };
})(jQuery, window, document);
