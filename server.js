require('dotenv').config({ path: "./env_file"});
const schedule = require('node-schedule');
const express = require('express');
const aggregation = require('./bin/aggregate_scores');

const app = express();
app.use(express.json());

// Scheduled to run at 11:00 PM
schedule.scheduleJob('0 0 23 ? * * *', function(){
  console.log("Updating averages");
  aggregation.aggregate();
});

app.get('/', (req, res) => {
  res.send('Index');
});

var routes = require('./routes')(app);


app.listen(process.env.APPHOST, process.env.APPPORT);

console.log(`Running on http://${process.env.APPHOST}:${process.env.APPPORT}`);

exports.app = app;