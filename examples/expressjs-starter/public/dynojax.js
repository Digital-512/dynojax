"use strict"

var Dynojax = (function () {
    var publicAPI = {}

    publicAPI.load = function (component, page) {
        // Replace current state to make components work with back/forward buttons.
        history.replaceState({
            component,
            scroll: {
                x: window.pageXOffset,
                y: window.pageYOffset
            }
        }, document.title);

        hideComponent(component, 0);

        // Trigger an event `dynojax:start`.
        // Useful for progress bars.
        $(document).trigger('dynojax:start');

        // Send GET request to server.
        // Sends a header `X-DYNOJAX-RENDER` to the server, so
        // the server knows if a component is requested.
        $.ajax({
            method: 'GET',
            headers: { 'X-DYNOJAX-RENDER': true },
            url: page
        }).done(function (data, status, xhr) {
            // Include component's data to its container.
            $('.dynojax-' + component).html(data);

            // Get the title of a component from the server.
            var title = xhr.getResponseHeader('X-DYNOJAX-TITLE');

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
            window.scrollTo(0, 0);

            showComponent(component, 'fast');

            // Trigger an event `dynojax:end`.
            $(document).trigger('dynojax:end');
        });
    }

    publicAPI.loadWidget = function (component, page) {
        hideComponent(component, 0);

        // Trigger an event `dynojax-widget:start`.
        // Useful for progress bars.
        $(document).trigger('dynojax-widget:start');

        // Send GET request to server.
        // Sends a header `X-DYNOJAX-RENDER` to the server, so
        // the server knows if a component is requested.
        $.ajax({
            method: 'GET',
            headers: { 'X-DYNOJAX-RENDER': true },
            url: page
        }).done(function (data) {
            // Include component's data to its container.
            $('.dynojax-' + component).html(data);

            showComponent(component, 'fast');

            // Trigger an event `dynojax-widget:end`.
            $(document).trigger('dynojax-widget:end');
        });
    }

    // Hide current component in ms (default 0) milliseconds.
    var hideComponent = function (component, ms = 0) {
        $('.dynojax-' + component).animate({ opacity: 0 }, ms, function () {
            $(this).css('visibility', 'hidden');
        });
    }

    // Show the new component in ms (default 'fast') milliseconds.
    var showComponent = function (component, ms = 'fast') {
        $('.dynojax-' + component).css('visibility', '').animate({ opacity: 1 }, ms, function () {
            $(this).css('opacity', '');
        });
    }

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

        // Prevent default behaviour and load component.
        evt.preventDefault();
        Dynojax.load($(this).data('dynojax'), $(this).attr('href'));
    });

    // Support for back/forward actions.
    window.onpopstate = function (evt) {
        // Check if a component was loaded.
        if (!evt.state.component)
            return;

        // Send GET request to server.
        $.ajax({
            method: 'GET',
            headers: { 'X-DYNOJAX-RENDER': true },
            url: document.location
        }).done(function (data) {
            // Include component's data to its container.
            $('.dynojax-' + evt.state.component).html(data);

            // Set the last scroll position of the component.
            window.scrollTo(evt.state.scroll.x, evt.state.scroll.y);
        });
    }
});
