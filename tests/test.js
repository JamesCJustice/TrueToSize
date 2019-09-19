const expect  = require('chai').expect;
const describe = require('mocha').describe;
const before = require('mocha').before;
const it = require('mocha').it;
const assert = require('assert');
const Client = require('pg').Client;
const install = require('../bin/install');
const uninstall = require('../bin/uninstall');
const request = require('supertest');

const DATABASE_TABLES = ['score_submissions', 'aggregate_scores'];
process.env.PGDATABASE = "TEST_" + process.env.PGDATABASE;
const app = require('../server').app;


async function table_exists(schema, table) {
  const client = new Client();

  try {
    await client.connect();
  }
  catch (e) {
    console.error("Could not connect: " + e);
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
    for (var i = 0; i < DATABASE_TABLES.length; i++) {
      const exists = await table_exists('truetosize', DATABASE_TABLES[i]);
      expect(exists, "table '" + DATABASE_TABLES[i] + "' exists").to.equal(true);  
    }

  });

  it('should uninstall database tables', async function() {
    await uninstall.uninstall();
    for (var i = 0; i < DATABASE_TABLES.length; i++) {
      const exists = await table_exists('truetosize', DATABASE_TABLES[i]);
      expect(exists, "table '" + DATABASE_TABLES[i] + "' has been removed").to.equal(false);  
    }
  });
});


describe('submit_score', function() {
  before(async function() {
    await install.install(); 
  });
  after(async function() {
    await uninstall.uninstall();
  });

  it('gives a 400 when missing a required field', async function() {
    // Blank
    await request(app)
    .post('/submit_score')
    .send({})
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(400);

    // Missing submitter
    await request(app)
    .post('/submit_score')
    .send({ 
      shoe_type: "test_shoe",
      score: 5 
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(400);

    // Missing shoe_type
    await request(app)
    .post('/submit_score')
    .send({ 
      submitter: "test_submitter",
      score: 5
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(400);

    // Missing score
    await request(app)
    .post('/submit_score')
    .send({ 
      submitter: "test_submitter",
      shoe_type: "test_shoe"
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(400);
  });

  it('gives a 400 on invalid scores', async function() {
    // too low
    await request(app)
    .post('/submit_score')
    .send({ 
      submitter: "test_submitter",
      shoe_type: "test_shoe",
      score: 0
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(400);

    // too high
    await request(app)
    .post('/submit_score')
    .send({ 
      submitter: "test_submitter",
      shoe_type: "test_shoe",
      score: 6
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(400);

    // Not an integer
    await request(app)
    .post('/submit_score')
    .send({ 
      submitter: "test_submitter",
      shoe_type: "test_shoe",
      score: "five"
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(400);

    // Also not an integer
    await request(app)
    .post('/submit_score')
    .send({ 
      submitter: "test_submitter",
      shoe_type: "test_shoe",
      score: 1.5
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(400);
  });

  it('gives 201 on valid request and stores submission', async function() {
    await request(app)
    .post('/submit_score')
    .send({ 
      submitter: "test_submitter",
      shoe_type: "test_shoe",
      score: 5
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(201);

    const client = new Client();
    try {
      await client.connect();
    }
    catch (e) {
      assert.fail("Could not connect: " + e);
    }

    var { rows } = await client.query("SELECT * FROM truetosize.score_submissions");
    expect(rows.length).to.equal(1);
    var row = rows[0];
    expect(row.submitter).to.match(/test_submitter/);
    expect(row.shoe_type).to.match(/test_shoe/);
    expect(row.score).to.equal(5);
  });

  it('updates an existing score', async function () {
    await request(app)
    .post('/submit_score')
    .send({ 
      submitter: "test_submitter",
      shoe_type: "test_shoe",
      score: 4
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(201);

    const client = new Client();
    try {
      await client.connect();
    }
    catch (e) {
      assert.fail("Could not connect: " + e);
    }

    var { rows } = await client.query("SELECT * FROM truetosize.score_submissions");
    expect(rows.length).to.equal(1);
    var row = rows[0];
    expect(row.submitter).to.match(/test_submitter/);
    expect(row.shoe_type).to.match(/test_shoe/);
    expect(row.score).to.equal(4);
  });



});