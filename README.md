# dynojax
Dynojax is a jQuery plugin that uses AJAX and pushState to deliver a fast browsing experience with real permalinks, page titles and working back/forward buttons.

> :warning: <b>DEPRECATED! </b> jQuery version of Dynojax is no longer supported or updated. Please look at [master](https://github.com/Digital-512/dynojax) branch to download the latest, VanillaJS version of this plugin. Why? It's faster and no dependencies are needed to run it!

Dynojax works by fetching HTML from your server via AJAX and replacing the content of a container element on your page with the loaded HTML. It then updates the current URL in the browser using pushState. This results in faster page navigation for two reasons:

* No page resources (JS, CSS) get re-executed or re-applied;
* If the server is configured for Dynojax, it can render only partial page contents and avoid the potentially costly full layout render.

## Installation

Dynojax depends on jQuery 1.8 or higher.

Add `dynojax.min.js` to your project.
```html
<script src="dynojax.min.js"></script>
```

## Usage

### Loading components (for full page loads with pushState)
The simplest and the most common use of Dynojax looks like this:

```html
<a href="/page2" data-dynojax="container">Go to page 2</a>
<div class="dynojax-container"></div>
```

This will load the content of "/page2" into a container `.dynojax-container` on link click.

In this example `container` means the container, into which the page should be loaded. It can be named differently (for example, `class="dynojax-main"`, then the link will use attribute `data-dynojax="main"`). Having multiple containers (components) is also supported.

> <b>NOTE: </b>It will not load anything to the container on the first page load. This is the server's responsibility to load the initial page. See `examples/expressjs-starter` for an example which shows how to use EJS templating engine to load pages from the server.

### Loading widgets (no pushState)
You can also load a component as widget wihout using pushState function. It allows to load or update any part of the page without reloading it. There is an example:

```html
<div class="dynojax-widget"></div>
<button onclick="reload()">Reload online users!</button>
```
```js
function reload() {
  // load online users into `.dynojax-widget`
  Dynojax.loadWidget('widget','/modules/online_users');
}
```

In this example clicking button `Reload online users!` will update the online users container to show the latest information. Having multiple widgets is supported. See an example `examples/dynojax-widgets` to see how it is implemented.

> <b>NOTE: </b>It is not necessary for server to send `X-DYNOJAX-TITLE` header when loading widgets. It should only send the HTML to render content of a container.

### The server should:
* Send a title header `X-DYNOJAX-TITLE` with the title of the page (not required for widgets, as stated above), for example:

```js
res.setHeader('X-DYNOJAX-TITLE', 'Page 2 | Dynojax Example Starter');
```

> <b>NOTE: </b>You can override this behaviour from the client using the option `{ title: "Custom title" }`. Then it does not need the server to send `X-DYNOJAX-TITLE` header.

* Determine if the client sent a header `X-DYNOJAX-RENDER`. If so, then the server should only render the HTML meant to replace the contents of the container element (`.dynojax-container` in our example) without the rest of the page layout. Here is an example of how this might be done in Express.js using template engine:

```js
res.render((req.header('X-DYNOJAX-RENDER')) ? 'page2' : 'index', { module: 'page2' });
```

See an example `examples/expressjs-starter` for better understanding.

## Advanced usage

You can also call Dynojax functions from JavaScript and/or override the default behaviour of links and set options.

```js
Dynojax.load(component, page, [options]);
```
```js
Dynojax.loadWidget(component, page, [options]);
```

You can check if the browser supports Dynojax with supportDynojax (bool).

```js
if(Dynojax.supportDynojax) {
  // do something here...
}
```

It is sometimes useful to disable Dynojax for debugging on a modern browser:

```js
Dynojax.supportDynojax = false;
```

### Reinitializing plugins on new page content
The whole point of Dynojax is that it fetches and inserts new content _without_ refreshing the page. However, other jQuery plugins or libraries that are set to react on page loaded event (such as `DOMContentLoaded`) will not pick up on these changes. Therefore, it's usually a good idea to configure these plugins to reinitialize in the scope of the updated page content. This can be done like so:

```js
$(document).on('ready dynojax:end dynojax:popstate-end', function(event) {
  $(event.target).initializeMyPlugin();
});
```

This will make `$.fn.initializeMyPlugin()` be called at the document level on normal page load, and on the container level after any Dynojax navigation (either after clicking on a link or going Back in the browser).

## Options

Sometimes you might need to change the behaviour of this plugin.

### Default options

For `Dynojax.load()`

```js
var _options = {
  title: undefined, // Overrides a title sent from the server
  resetScroll: true, // Should we reset the scroll to its initial position on switching page?
  reloadOnError: true, // Should we hard reload the page if AJAX request fails?
  animations: true, // Should we see animations while switching pages?
  fadeIn: 'fast', // The time in milliseconds, 'fast' or 'slow'. How long the fadeIn animation should take?
  fadeOut: 'fast' // The time in milliseconds, 'fast' or 'slow'. How long the fadeOut animation should take?
}
```

For `Dynojax.loadWidget()`

```js
var _options = {
  animations: true, // Should we see animations while reloading widgets?
  fadeIn: 'fast', // The time in milliseconds, 'fast' or 'slow'. How long the fadeIn animation should take?
  fadeOut: 'fast' // The time in milliseconds, 'fast' or 'slow'. How long the fadeOut animation should take?
}
```

## Events

Useful if you want to integrate progress bars, for example, [NProgress](https://github.com/rstacruz/nprogress).

<table>
  <tr>
    <th>Event</th>
    <th>Notes</th>
    <th>Type</th>
    <th>Parameters</th>
  </tr>
  <tr>
    <td><code>dynojax:start</code></td>
    <td>Starts to load a component</td>
    <td>With pushState</td>
    <td>[component, page]</td>
  </tr>
  <tr>
    <td><code>dynojax:end</code></td>
    <td>Ends to load a component</td>
    <td>With pushState</td>
    <td>[component, page, status, xhr]</td>
  </tr>
  <tr>
    <td><code>dynojax:widget-start</code></td>
    <td>Starts to load a widget</td>
    <td>Without pushState</td>
    <td>[component, page]</td>
  </tr>
  <tr>
    <td><code>dynojax:widget-end</code></td>
    <td>Ends to load a widget</td>
    <td>Without pushState</td>
    <td>[component, page, status, xhr]</td>
  </tr>
  <tr>
    <td><code>dynojax:popstate-start</code></td>
    <td>Starts to load a component</td>
    <td>Back/Forward</td>
    <td>[component, page]</td>
  </tr>
  <tr>
    <td><code>dynojax:popstate-end</code></td>
    <td>Ends to load a component</td>
    <td>Back/Forward</td>
    <td>[component, page]</td>
  </tr>
  <tr>
    <td><code>dynojax:error</code></td>
    <td>AJAX error occurred or got error response.</td>
    <td>All</td>
    <td>[component, page, status, xhr]</td>
  </tr>
</table>

An example for integrating with NProgress:

```js
$(document).on('dynojax:start', function () {
  NProgress.start();
});
$(document).on('dynojax:end', function () {
  NProgress.done();
});
```
