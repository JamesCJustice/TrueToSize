const Client = require('pg').Client;
const pgtools = require('pgtools');

async function database_exists(database) {
  const client = new Client({
    database: 'postgres'
  });

  try {
    await client.connect();
  }
  catch (e) {
    assert.fail("Could not connect: " + e);
  }
  const sql = "SELECT datname FROM pg_catalog.pg_database WHERE datname = $1;";
  const args = [ database ];
  const { rows } = await client.query(sql, args);
  await client.end();

  return rows.length == 1;
}

async function create_database() {
  if(await database_exists(process.env.PGDATABASE)) { 
    return;
  }

  await pgtools.createdb({
    user: 'postgres',
    port: process.env.PGPORT,
    host: process.env.PGHOST
  }, process.env.PGDATABASE);
}

async function create_schema() {
  const sql = 'CREATE SCHEMA IF NOT EXISTS truetosize';
  const client = new Client();

  try {
    await client.connect();
    await client.query(sql);
    await client.query('COMMIT');
    await client.end();
  }
  catch (e) {
    return new Error("Error creating schema 'truetosize': " + e);
  }
}

async function create_score_submissions_table() {
  const client = new Client();

  const table_ddl = "CREATE TABLE IF NOT EXISTS truetosize.score_submissions (" +
                    " id SERIAL PRIMARY KEY," +
                    " submitter VARCHAR(255) NOT NULL," +
                    " shoe_type VARCHAR(255) NOT NULL," +
                    " score SMALLINT NOT NULL," +
                    " created TIMESTAMP DEFAULT now()" +
                    ");";
  const submitter_index = "CREATE INDEX IF NOT EXISTS submitter_index " +
                        "ON truetosize.score_submissions (submitter);";

  const shoe_index = "CREATE INDEX IF NOT EXISTS shoe_type_index " +
                     "ON truetosize.score_submissions (shoe_type);";

  try {
    await client.connect();
    await client.query(table_ddl);
    await client.query(submitter_index);
    await client.query(shoe_index);
    await client.end();
  }
  catch (e) {
    return new Error("Error creating score_submissions table: " + e);
  }
}

async function create_aggregate_scores_table() {
  const client = new Client();

  const table_ddl = "CREATE TABLE IF NOT EXISTS truetosize.aggregate_scores (" +
                    "  shoe_type VARCHAR(255) PRIMARY KEY," +
                    "  average_score FLOAT(1) NOT NULL" +
                    ");";

  const shoe_index = "CREATE INDEX IF NOT EXISTS aggregate_shoe_type_index " +
                     "ON truetosize.aggregate_scores (shoe_type);";
  try {
    await client.connect();
    await client.query(table_ddl);
    await client.query(shoe_index);
    await client.end();
  }
  catch (e) {
    return new Error("Error creating aggregate scores table: " + e);
  }
}

module.exports.install = async function install () {
  console.log("Installation started...");
  
  console.log("creating database...");
  await create_database();
  
  console.log("creating schema");
  await create_schema();

  console.log("creating submissions");
  await create_score_submissions_table();
  
  console.log("creating aggregates");
  await create_aggregate_scores_table();

  console.log("Installation finished");

};