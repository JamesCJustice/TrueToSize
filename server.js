'use strict';

require('dotenv').config({ path: "./env_file"});
const express = require('express');

const app = express();
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Index');
});

var routes = require('./routes')(app);


app.listen(process.env.APPHOST, process.env.APPPORT);

console.log(`Running on http://${process.env.APPHOST}:${process.env.APPPORT}`);

exports.app = app;