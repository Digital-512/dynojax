"use strict"

let Dynojax = {}

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

Dynojax.load = function (component, page) {
    // Replace current state to make components work with back/forward buttons.
    history.replaceState({
        component,
        scroll: {
            x: window.pageXOffset,
            y: window.pageYOffset
        }
    }, document.title);

    // Hide current component in 0 milliseconds.
    $('.dynojax-' + component).animate({ opacity: 0 }, 0, function () {
        $(this).css('visibility', 'hidden');
    });

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
        let title = xhr.getResponseHeader('X-DYNOJAX-TITLE');

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

        // Show the new component in ms milliseconds.
        $('.dynojax-' + component).css('visibility', '').animate({ opacity: 1 }, 'fast', function () {
            $(this).css('opacity', '');
        });

        // Trigger an event `dynojax:end`.
        $(document).trigger('dynojax:end');
    });
}
