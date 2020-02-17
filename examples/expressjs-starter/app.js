const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Initialize public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.setHeader('X-DYNOJAX-TITLE', 'Home | Dynojax Example Starter');
    res.render((req.header('X-DYNOJAX-RENDER')) ? 'page1' : 'index', { module: 'page1', date: new Date() });
});
app.get('/page2', (req, res) => {
    res.setHeader('X-DYNOJAX-TITLE', 'Page 2 | Dynojax Example Starter');
    res.render((req.header('X-DYNOJAX-RENDER')) ? 'page2' : 'index', { module: 'page2' });
});

app.listen(port, () => console.log('Dynojax example app listening on port ' + port));
