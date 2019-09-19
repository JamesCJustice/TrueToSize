'use strict';

require('dotenv').config({ path: "./env_file"});
const express = require('express');

// App
const app = express();
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Index');
});

var routes = require('./routes')(app);
console.log(JSON.stringify(routes));


app.listen(process.env.APPHOST, process.env.APPPORT);

console.log(`Running on http://${process.env.APPHOST}:${process.env.APPPORT}`);

exports.app = app;