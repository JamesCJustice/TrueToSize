'use strict';

require('dotenv').config({ path: "./env_file"});
const express = require('express');

// App
const app = express();
app.get('/', (req, res) => {
  res.send('Index');
});

require('./routes')(app);

app.listen(process.env.APPHOST, process.env.APPPORT);
console.log(process.env);
console.log(`Running on http://${process.env.APPHOST}:${process.env.APPPORT}`);