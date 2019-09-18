const expect  = require('chai').expect;
const request = require('request');
const describe = require('mocha').describe;
const before = require('mocha').before;
const it = require('mocha').it;
const assert = require('assert');
const Client = require('pg').Client;
const install = require('../bin/install');
console.log(JSON.stringify(install));

describe('install and uninstall', function() {

  before(async function() {
    await install();
  });

  it('should start the postgres server', async function() {
    const client = new Client({ // Exclude database env variable to select default database
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      port: process.env.PGPORT
    });

    try {
        await client.connect();
    } catch (e) {
        assert.fail("Could not connect: ${e}");
    }
    
    const { rows } = await client.query("SELECT 'Hello, world!' as message");
    expect(rows[0].message).to.match(/Hello/);
    await client.end();
  });

  it('should create the database tables', async function() {
    const client = new Client();

    try {
        await client.connect();
    } catch (e) {
        assert.fail("Could not connect: ${e}");
    }

    var sql = "SELECT EXISTS (" +
              " SELECT 1" +
              " FROM   information_schema.tables " +
              " WHERE  table_schema = 'TrueToSize'" +
              " AND    table_name = 'score_submissions'" +
              ");";
    var { rows } = await client.query(sql);

    expect(rows[0].exists).to.equal(true);

    var sql = "SELECT EXISTS (" +
              " SELECT 1" +
              " FROM   information_schema.tables " +
              " WHERE  table_schema = 'TrueToSize'" +
              " AND    table_name = 'aggregate_scores'" +
              ");";
    var { rows } = await client.query(sql);

    expect(rows[0].exists).to.equal(true);

  });
});