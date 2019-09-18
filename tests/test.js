const expect  = require('chai').expect;
const request = require('request');
const describe = require('mocha').describe;
const before = require('mocha').before;
const it = require('mocha').it;
const assert = require('assert');
const Client = require('pg').Client;


describe('install and uninstall', function() {

  it('should not violate laws of equality', function(done) {
    expect('true').to.equal('true');
    done();
  });

  it('should start the postgres server', async function() {
    this.timeout(20000); // is this necessary? FIXME
    const client = new Client();
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
});