const Client = require('pg').Client;
const install = require('./bin/install');
const uninstall = require('./bin/uninstall');

module.exports = function(app) {
  app.post('/submit_score', async function(req, res) {
    if(!('submitter' in req.body) || !('shoe_type' in req.body) || !('score' in req.body)) {
      return res.status(400).json({
        success: 0,
        error: "Missing required parameter."
      });
    }

    const submitter = req.body.submitter;
    const shoe_type = req.body.shoe_type;
    const score = req.body.score;

    if(!Number.isInteger(score) || score < 1 || score > 5){
      return res.status(400).json({
        success: 0,
        error: "Invalid score."
      });
    }

    const update = "UPDATE truetosize.score_submissions SET score = $1 " +
                   "WHERE submitter = $2 AND shoe_type = $3";
    const insert = "INSERT INTO truetosize.score_submissions(submitter, shoe_type, score) " +
                   "SELECT $1, $2, $3 " +
                   "WHERE NOT EXISTS (SELECT 1 FROM truetosize.score_submissions WHERE submitter = $4 AND shoe_type = $5)";
    const client = new Client();
    try {
      await client.connect();
      await client.query(update, [ score, submitter, shoe_type ]);
      await client.query(insert, [ submitter, shoe_type, score, submitter, shoe_type ]);
      await client.end();
    }
    catch (e) {
      console.error("Error connecting: " + e);
      return res.status(500).json({
        success: 0,
        error: "Internal server error: " + e
      });
    }

    res.status(201).json({  
      success: 1
    });
  });

  app.post('/delete_score', async function(req, res) {
    if(!('submitter' in req.body) || !('shoe_type' in req.body)) {
      return res.status(400).json({
        success: 0,
        error: "Missing required parameter"
      });
    }

    const submitter = req.body.submitter;
    const shoe_type = req.body.shoe_type;

    const select = "SELECT * FROM truetosize.score_submissions WHERE submitter = $1 AND shoe_type = $2";
    const remove = "DELETE FROM truetosize.score_submissions WHERE submitter = $1 AND shoe_type = $2";
    const client = new Client();
    
    try {
      await client.connect();
      var {rows} = await client.query(select, [ submitter, shoe_type ]);
      if (rows.length == 0) {
        await client.end();
        return res.status(404).json({
          success: 0,
          error: "Score not found"
        });
      }
      await client.query(remove, [ submitter, shoe_type ]);
      await client.query('COMMIT');
      await client.end();
    }
    catch (e) {
      console.error("Error connecting: " + e);
      return res.status(500).json({
        success: 0,
        error: "Internal server error: " + e
      });
    }
    return res.status(200).json({
      success: 1
    });
  });

  app.get('/fetch_submission', async function(req, res) {
    if(!('submitter' in req.body) || !('shoe_type' in req.body)) {
      return res.status(400).json({
        success: 0,
        error: "Missing required parameter"
      });
    }

    const submitter = req.body.submitter;
    const shoe_type = req.body.shoe_type;
    const select = "SELECT * FROM truetosize.score_submissions WHERE submitter = $1 AND shoe_type = $2";
    
    var client = new Client();
    try {
      await client.connect();
      var {rows} = await client.query(select, [ submitter, shoe_type ]);
      await client.end();
    }
    catch (e) {
      console.error("Error connecting: " + e);
      return res.status(500).json({
        success: 0,
        error: "Internal server error: " + e
      });
    }
    if(rows.length == 0) {
      return res.status(404).json({
        success: 0,
        error: "Submission not found"
      });
    }

    return res.status(200).json({
      success: 1,
      submission: rows[0]
    });
  });

  app.get('/fetch_average_score', async function(req, res) {
    if(!('shoe_type' in req.body)) {
      return res.status(400).json({
        success: 0,
        error: "Missing required parameter: shoe_type"
      });
    }

    const shoe_type = req.body.shoe_type;
    const select = "SELECT average_score FROM truetosize.aggregate_scores WHERE shoe_type = $1";
    const client = new Client();
    var results;
    try {
      await client.connect();
      results = await client.query(select, [ shoe_type ]);
      await client.end();
    }
    catch (e) {
      console.error("Error fetching average score: " + e);
      return res.status(500).json({
        success: 0,
        error: "Internal server error: " + e
      });
    }

    if (results.rows.length == 0) {
        return res.status(404).json({
          success: 0,
          error: "Score not found"
        });
    }

    return res.status(200).json({
      success: 1,
      average_score: results.rows[0].average_score
    });
  });

  app.post('/admin/install', async function(req, res) {
    try {
      await install.install();
    }
    catch (e) {
      return res.status(500).json({
        success: 0,
        error: "Internal server error: " + e
      });
    }

    return res.status(200).json({
      success: 1
    });
  });

  app.post('/admin/uninstall', async function(req, res) {
    try {
      await uninstall.uninstall();
    }
    catch (e) {
      return res.status(500).json({
        success: 0,
        error: "Internal server error: " + e
      });
    }

    return res.status(200).json({
      success: 1
    });
  });

  app.get('/admin/health', async function(req, res) {
    return res.status(200).json({
      success: 1
    });
  });
}