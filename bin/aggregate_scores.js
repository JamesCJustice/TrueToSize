const Client = require('pg').Client;

async function get_distinct_shoe_types(client) {
  var { rows } = await client.query("SELECT DISTINCT shoe_type FROM truetosize.score_submissions");
  var shoe_types = [];

  for (var i = 0; i < rows.length; i++) {
    shoe_types.push(rows[i].shoe_type);
  }
  return shoe_types;
}

async function get_shoe_type_average_score(client, shoe_type) {
  var select = "SELECT " +
               "SUM(score) as scores_sum, " +
               "COUNT(*) as scores_count " +
               "FROM truetosize.score_submissions " +
               "WHERE shoe_type = $1 ";
  var { rows } = await client.query(select, [ shoe_type ]);
  return rows[0].scores_sum / rows[0].scores_count;
}

async function delete_shoe_type_average(client, shoe_type) {
  await client.query("DELETE FROM truetosize.aggregate_scores WHERE shoe_type = $1", [ shoe_type ]);
}

async function insert_aggregate_score(client, shoe_type, score_average) {
  const insert = 'INSERT into truetosize.aggregate_scores(shoe_type, average_score) ' +
                 'VALUES ' +
                 '($1, $2)';
  await client.query(insert, [ shoe_type, score_average ]);
}

module.exports.aggregate = async function aggregate () {
  var client = new Client();
  await client.connect();

  var shoe_types = await get_distinct_shoe_types(client);
  
  for (var i = 0; i < shoe_types.length; i++) {
    const shoe_type = shoe_types[i];
    var average = await get_shoe_type_average_score(client, shoe_type);

    await delete_shoe_type_average(client, shoe_type);
    await insert_aggregate_score(client, shoe_type, average);
  }
  await client.end();
  console.log(`Aggregated ${shoe_types.length} shoe types.`);
};