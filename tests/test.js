const expect  = require('chai').expect;
const request = require('request');
const describe = require('mocha').describe;
const before = require('mocha').before;
const it = require('mocha').it;
const assert = require('assert');
const Client = require('pg').Client;


describe('install and uninstall', function() {

  it('should start the postgres server', async function() {
    //this.timeout(20000); // is this necessary? FIXME
    const client = new Client({ // Exclude database
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      port: process.env.PGPORT
    });
    try {
        await client.connect();
        console.log("Here");
    } catch (e) {
        assert.fail("Could not connect: ${e}");
    }
    const { rows } = await client.query("SELECT 'Hello, world!' as message");
    expect(rows[0].message).to.match(/Hello/);
    await client.end();
  });

  it('should create the database');
});