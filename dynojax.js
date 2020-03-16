"use strict";

var Dynojax = (function () {
    var publicAPI = {}

    publicAPI.load = function (component, page, options) {
        // Default values for options
        var _options = {
            resetScroll: true,
            reloadOnError: true,
            animations: true,
            fadeIn: 200,
            fadeOut: 200
        }

        // Merge options into default options
        Object.assign(_options, options);

        // Change location if Dynojax is unsupported.
        if (!publicAPI.supportDynojax) {
            window.location.href = page;
            return;
        }

        // Replace current state to make components work with back/forward buttons.
        history.replaceState({
            component: component,
            options: _options,
            scroll: {
                x: window.pageXOffset,
                y: window.pageYOffset
            }
        }, document.title);

        if (_options.animations)
            publicAPI.hideElement(document.getElementById('dynojax-' + component), _options.fadeOut);

        // Trigger an event `dynojax:start`.
        // Useful for progress bars.
        document.dispatchEvent(new CustomEvent('dynojax:start', {
            component: component,
            page: page
        }));

        publicAPI.fetchComponent(component, page, _options).then(function (response) {
            // Check if no errors occurred.
            if (response.ok) {
                // Include component's data to its container.
                document.getElementById('dynojax-' + component).innerHTML = response.data;

                // Create a new history state for opened component.
                history.pushState({
                    component: component,
                    options: _options,
                    scroll: {
                        x: 0,
                        y: 0
                    }
                }, response.title, page);

                // Set title for the document.
                document.title = response.title;

                // Reset scroll position.
                if (_options.resetScroll)
                    window.scrollTo(0, 0);

                if (_options.animations)
                    publicAPI.showElement(document.getElementById('dynojax-' + component), _options.fadeIn);
            }

            // Trigger an event `dynojax:end`.
            document.dispatchEvent(new CustomEvent('dynojax:end', {
                component: component,
                page: page,
                status: response.status
            }));
        });
    }

    publicAPI.loadWidget = function (component, page, options) {
        // Default values for options
        var _options = {
            animations: true,
            fadeIn: 200,
            fadeOut: 200
        }

        // Merge options into default options
        Object.assign(_options, options);

        if (_options.animations)
            publicAPI.hideElement(document.getElementById('dynojax-' + component), _options.fadeOut);

        // Trigger an event `dynojax:widget-start`.
        // Useful for progress bars.
        document.dispatchEvent(new CustomEvent('dynojax:widget-start', {
            component: component,
            page: page
        }));

        publicAPI.fetchComponent(component, page, _options).then(function (response) {
            // Check if no errors occurred.
            if (response.ok) {
                // Include component's data to its container.
                document.getElementById('dynojax-' + component).innerHTML = response.data;

                if (_options.animations)
                    publicAPI.showElement(document.getElementById('dynojax-' + component), _options.fadeIn);
            }

            // Trigger an event `dynojax:widget-end`.
            document.dispatchEvent(new CustomEvent('dynojax:widget-end', {
                component: component,
                page: page,
                status: response.status
            }));
        });
    }

    publicAPI.fetchComponent = async function (component, page, options) {
        var fetchStatus = true;

        try {
            // Send GET request to server.
            // Sends a header `X-DYNOJAX-RENDER` to the server, so
            // the server knows if a component is requested.
            var response = await fetch(page, {
                method: 'GET',
                mode: 'same-origin',
                cache: 'no-store', // temporary solution to prevent bugs
                headers: { 'X-DYNOJAX-RENDER': true }
            });

            // Something went wrong?
            if (!response.ok) {
                // Trigger an event `dynojax:response-fail`.
                document.dispatchEvent(new CustomEvent('dynojax:response-fail', {
                    component: component,
                    page: page,
                    status: response.status,
                    statusText: response.statusText
                }));

                // Reload the page if got error response.
                if (options.reloadOnError) {
                    window.location.href = page;
                    return;
                }
            }

            // Get response HTML.
            var html = await response.text();
        } catch (error) {
            // Failed to get response.
            fetchStatus = false;

            // Trigger an event `dynojax:error`.
            document.dispatchEvent(new CustomEvent('dynojax:error', {
                component: component,
                page: page,
                error: error
            }));
        } finally {
            // ok -> returns `false` if fails to get response.
            // data -> HTML from the server.
            // title -> The title of a component from the server or overriden by client.
            // status -> An integer containing the response status code.
            return {
                ok: fetchStatus,
                data: html,
                title: options.title || response.headers.get('X-DYNOJAX-TITLE'),
                status: response.status
            }
        }
    }

    // Hide current component in ms milliseconds.
    publicAPI.hideElement = function (element, ms) {
        clearTimeout(element.animationTimeout);
        var s = element.style;
        s.opacity = 0;
        s.transition = 'opacity ' + ms / 1000 + 's';
        element.animationTimeout = setTimeout(function () {
            s.removeProperty('transition');
            s.visibility = 'hidden';
        }, ms);
    }

    // Show the new component in ms milliseconds.
    publicAPI.showElement = function (element, ms) {
        clearTimeout(element.animationTimeout);
        var s = element.style;
        s.removeProperty('visibility');
        s.removeProperty('transition');
        element.offsetHeight; // trigger reflow
        s.transition = 'opacity ' + ms / 1000 + 's';
        s.opacity = 1;
        element.animationTimeout = setTimeout(function () {
            s.removeProperty('opacity');
            s.removeProperty('transition');
        }, ms);
    }

    // Is Dynojax supported by this browser?
    publicAPI.supportDynojax = window.history && window.history.pushState &&
        // pushState isn't reliable on iOS until 5.
        !(/((iPod|iPhone|iPad).+\bOS\s+[1-4]\D|WebApps\/.+CFNetwork)/).test(navigator.userAgent);

    return publicAPI;
})();

// Add a click event for all links with attribute `data-dynojax`.
document.addEventListener('click', function (evt) {
    if (evt.target.tagName === 'A' && evt.target.dataset.dynojax) {
        // Middle click, cmd click and ctrl click should open
        // in a new tab as normal.
        if (evt.which > 1 || evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey)
            return;

        // Ignore event with default prevented.
        if (evt.defaultPrevented)
            return;

        // Ignore if Dynojax is unsupported.
        if (!Dynojax.supportDynojax)
            return;

        // Prevent default behaviour and load component.
        evt.preventDefault();
        Dynojax.load(evt.target.dataset.dynojax, evt.target.href);
    }
});

// Support for back/forward actions.
window.onpopstate = function (evt) {
    // Check if a component was loaded.
    if (!evt.state.component)
        return;

    if (evt.state.options.animations)
        Dynojax.hideElement(document.getElementById('dynojax-' + evt.state.component), evt.state.options.fadeOut);

    // Trigger an event `dynojax:popstate-start`.
    document.dispatchEvent(new CustomEvent('dynojax:popstate-start', {
        component: evt.state.component,
        page: document.location
    }));

    Dynojax.fetchComponent(evt.state.component, document.location, evt.state.options).then(function (response) {
        // Check if no errors occurred.
        if (response.ok) {
            // Include component's data to its container.
            document.getElementById('dynojax-' + evt.state.component).innerHTML = response.data;

            // Set the last scroll position of the component.
            if (evt.state.options.resetScroll)
                window.scrollTo(evt.state.scroll.x, evt.state.scroll.y);

            if (evt.state.options.animations)
                Dynojax.showElement(document.getElementById('dynojax-' + evt.state.component), evt.state.options.fadeIn);
        }

        // Trigger an event `dynojax:popstate-end`.
        document.dispatchEvent(new CustomEvent('dynojax:popstate-end', {
            component: evt.state.component,
            page: document.location,
            status: response.status
        }));
    });
}
