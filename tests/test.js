const expect  = require('chai').expect;
const request = require('request');
const describe = require('mocha').describe;
const before = require('mocha').before;
const it = require('mocha').it;
const assert = require('assert');
const Client = require('pg').Client;
const install = require('../bin/install');

process.env.PGDATABASE = "TEST_" + process.env.PGDATABASE;

async function table_exists(schema, table) {
  const client = new Client();

  try {
    await client.connect();
  }
  catch (e) {
    assert.fail("Could not connect: " + e);
  }

  const sql = "SELECT EXISTS (" +
            " SELECT 1" +
            " FROM   information_schema.tables " +
            " WHERE  table_schema = $1" +
            " AND    table_name = $2" +
            ");";
  const { rows } = await client.query(sql, [schema, table]);

  return rows[0].exists;
}


describe('install and uninstall', function() {

  before(async function() {
    await install.install();
  });

  it('should start the postgres server', async function() {
    const client = new Client({
      database: 'postgres'
    });

    try {
      await client.connect();
    }
    catch (e) {
      assert.fail("Could not connect: " + e);
    }
    
    const { rows } = await client.query("SELECT 'Hello, world!' as message");
    expect(rows[0].message).to.match(/Hello/);
    await client.end();
  });

  it('should create the database tables', async function() {
    const tables = ['score_submissions', 'aggregate_scores'];

    for (var i = 0; i < tables.length; i++) {
      const exists = await table_exists('truetosize', tables[i]);
      expect(exists, "table '" + tables[i] + "' exists").to.equal(true);  
    }

  });
});