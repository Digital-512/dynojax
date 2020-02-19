# dynojax
Dynojax is a jQuery plugin that uses AJAX and pushState to deliver a fast browsing experience with real permalinks, page titles and working back/forward buttons.

Dynojax works by fetching HTML from your server via AJAX and replacing the content of a container element on your page with the loaded HTML. It then updates the current URL in the browser using pushState. This results in faster page navigation for two reasons:

* No page resources (JS, CSS) get re-executed or re-applied;
* If the server is configured for Dynojax, it can render only partial page contents and avoid the potentially costly full layout render.

## Installation

Dynojax depends on jQuery 1.8 or higher.

Add `dynojax.min.js` to your project.
```html
<script src="https://digital-512.github.io/dynojax/dynojax.min.js"></script>
```

## Usage

The simplest and the most common use of Dynojax looks like this:

```html
<a href="/page2" data-dynojax="container">Go to page 2</a>
<div class="dynojax-container"></div>
```

This will load the content of "/page2" into a container `.dynojax-container` on link click.

In this example `container` means the container, into which the page should be loaded. It can be named differently. Having multiple containers is also supported.

> <b>NOTE: </b>It will not load anything to the container on the first page load. This is the server's responsibility to load the initial page. See `examples/expressjs-starter` for an example which shows how to use EJS templating engine to load pages from the server.

### The server should:
* Send a title header `X-DYNOJAX-TITLE` with the title of the page, for example:

```js
res.setHeader('X-DYNOJAX-TITLE', 'Page 2 | Dynojax Example Starter');
```

> <b>NOTE: </b>You can override this behaviour from the client using the option `{ title: "Custom title" }`. Then it does not need the server to send `X-DYNOJAX-TITLE` header.

* Determine if the client sent a header `X-DYNOJAX-RENDER`. If so, then the server should send only the part of the page, if not, then the server should send full index page. For example:

```js
res.render((req.header('X-DYNOJAX-RENDER')) ? 'page2' : 'index', { module: 'page2' });
```

See an example `examples/expressjs-starter` for more information.
