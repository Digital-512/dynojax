"use strict"

var Dynojax = (function () {
    var publicAPI = {}

    publicAPI.load = function (component, page, options) {
        // Default values for options
        var _options = {
            resetScroll: true,
            reloadOnError: true,
            animations: true,
            fadeIn: 'fast',
            fadeOut: 'fast'
        }

        // Merge options into default options
        $.extend(_options, options);

        // Change location if Dynojax is unsupported.
        if (!publicAPI.supportDynojax) {
            window.location.href = page;
            return;
        }

        // Replace current state to make components work with back/forward buttons.
        history.replaceState({
            component,
            scroll: {
                x: window.pageXOffset,
                y: window.pageYOffset
            }
        }, document.title);

        if (_options.animations)
            hideComponent(component, _options.fadeOut);

        // Trigger an event `dynojax:start`.
        // Useful for progress bars.
        $(document).trigger('dynojax:start', [component, page]);

        // Send GET request to server.
        // Sends a header `X-DYNOJAX-RENDER` to the server, so
        // the server knows if a component is requested.
        $.ajax({
            method: 'GET',
            cache: false,
            headers: { 'X-DYNOJAX-RENDER': true },
            url: page
        }).done(function (data, status, xhr) {
            // Include component's data to its container.
            $('.dynojax-' + component).html(data);

            // Get the title of a component from the server.
            var title = _options.title || xhr.getResponseHeader('X-DYNOJAX-TITLE');

            // Create a new history state for opened component.
            history.pushState({
                component,
                scroll: {
                    x: 0,
                    y: 0
                }
            }, title, page);

            // Set title for the document.
            document.title = title;

            // Reset scroll position.
            if (_options.resetScroll)
                window.scrollTo(0, 0);

            if (_options.animations)
                showComponent(component, _options.fadeIn);

            // Trigger an event `dynojax:end`.
            $(document).trigger('dynojax:end', [component, page, status, xhr]);
        }).fail(function (xhr, status) {
            // Trigger an event `dynojax:error`.
            $(document).trigger('dynojax:error', [component, page, status, xhr]);

            // Reload the page if got error response.
            if (_options.reloadOnError)
                window.location.href = page;
        });
    }

    publicAPI.loadWidget = function (component, page, options) {
        // Default values for options
        var _options = {
            animations: true,
            fadeIn: 'fast',
            fadeOut: 'fast'
        }

        // Merge options into default options
        $.extend(_options, options);

        if (_options.animations)
            hideComponent(component, _options.fadeOut);

        // Trigger an event `dynojax:widget-start`.
        // Useful for progress bars.
        $(document).trigger('dynojax:widget-start', [component, page]);

        // Send GET request to server.
        // Sends a header `X-DYNOJAX-RENDER` to the server, so
        // the server knows if a component is requested.
        $.ajax({
            method: 'GET',
            cache: false,
            headers: { 'X-DYNOJAX-RENDER': true },
            url: page
        }).done(function (data) {
            // Include component's data to its container.
            $('.dynojax-' + component).html(data);

            if (_options.animations)
                showComponent(component, _options.fadeIn);

            // Trigger an event `dynojax:widget-end`.
            $(document).trigger('dynojax:widget-end', [component, page, status, xhr]);
        }).fail(function (xhr, status) {
            // Trigger an event `dynojax:error`.
            $(document).trigger('dynojax:error', [component, page, status, xhr]);
        });
    }

    // Hide current component in ms milliseconds.
    var hideComponent = function (component, ms) {
        $('.dynojax-' + component).animate({ opacity: 0 }, ms, function () {
            $(this).css('visibility', 'hidden');
        });
    }

    // Show the new component in ms milliseconds.
    var showComponent = function (component, ms) {
        $('.dynojax-' + component).finish().css('visibility', '').animate({ opacity: 1 }, ms, function () {
            $(this).css('opacity', '');
        });
    }

    // Is Dynojax supported by this browser?
    publicAPI.supportDynojax = window.history && window.history.pushState &&
        // pushState isn't reliable on iOS until 5.
        !(/((iPod|iPhone|iPad).+\bOS\s+[1-4]\D|WebApps\/.+CFNetwork)/).test(navigator.userAgent);

    return publicAPI;
})();

$(function () {
    // Add a click event for all links with attribute `data-dynojax`.
    $('body').on('click', 'a[data-dynojax]', function (evt) {
        // Middle click, cmd click and ctrl click should open
        // in a new tab as normal.
        if (evt.which > 1 || evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey)
            return;

        // Ignore event with default prevented.
        if (evt.isDefaultPrevented())
            return;

        // Ignore if Dynojax is unsupported.
        if (!Dynojax.supportDynojax)
            return;

        // Prevent default behaviour and load component.
        evt.preventDefault();
        Dynojax.load($(this).data('dynojax'), $(this).attr('href'));
    });

    // Support for back/forward actions.
    window.onpopstate = function (evt) {
        // Check if a component was loaded.
        if (!evt.state.component)
            return;

        // Trigger an event `dynojax:popstate-start`.
        $(document).trigger('dynojax:popstate-start', [evt.state.component, document.location]);

        // Send GET request to server.
        $.ajax({
            method: 'GET',
            cache: false,
            headers: { 'X-DYNOJAX-RENDER': true },
            url: document.location
        }).done(function (data) {
            // Include component's data to its container.
            $('.dynojax-' + evt.state.component).html(data);

            // Set the last scroll position of the component.
            window.scrollTo(evt.state.scroll.x, evt.state.scroll.y);

            // Trigger an event `dynojax:popstate-end`.
            $(document).trigger('dynojax:popstate-end', [evt.state.component, document.location]);
        }).fail(function (xhr, status) {
            // Trigger an event `dynojax:error`.
            $(document).trigger('dynojax:error', [evt.state.component, document.location, status, xhr]);
        });
    }
});
