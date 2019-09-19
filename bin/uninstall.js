const Client = require('pg').Client;


module.exports.uninstall = async function uninstall () {
  console.log("uninstall started...");
  const client  = new Client();

  const sql = [
    "DROP INDEX IF EXISTS truetosize.submitter_index",
    "DROP INDEX IF EXISTS truetosize.shoe_type_index",
    "DROP TABLE IF EXISTS truetosize.score_submissions;",
    "DROP INDEX IF EXISTS truetosize.aggregate_shoe_type_index",
    "DROP TABLE IF EXISTS truetosize.aggregate_scores;",
    "DROP SCHEMA IF EXISTS truetosize;"
  ];

  try {
    await client.connect();
    for (var i = 0; i < sql.length; i++) {
      await client.query(sql[i]);
    }
    await client.end();
  }
  catch (e) {
    return new Error("Error creating aggregate scores table: " + e);
  }

  console.log("Finished");
};