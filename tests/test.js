const expect  = require('chai').expect;
const describe = require('mocha').describe;
const before = require('mocha').before;
const it = require('mocha').it;
const assert = require('assert');
const Client = require('pg').Client;
const install = require('../bin/install');
const aggregation = require('../bin/aggregate_scores');
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


describe('/submit_score', function() {
  before(async function() {
    await install.install(); 
  });
  after(async function() {
    await uninstall.uninstall();
  });

  it('gives a 400 when missing a required parameter', async function() {
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
    await client.end();
    expect(rows.length).to.equal(1);
    var row = rows[0];
    expect(row.submitter).to.match(/test_submitter/);
    expect(row.shoe_type).to.match(/test_shoe/);
    expect(row.score).to.equal(4);
  });

  describe('/delete_score', function () {
    before(async function() {
      await install.install(); 
    });
    after(async function() {
      await uninstall.uninstall();
    });

    it('gives a 400 for missing parameters', async function() {
      // No submitter
      await request(app)
      .post('/submit_score')
      .send({ 
        shoe_type: "test_shoe"
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);

      // No shoe_type
      await request(app)
      .post('/submit_score')
      .send({
        submitter: "test_submitter",
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
    });

    it('removes an existing score', async function() {

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
      expect(rows.length).to.equal(1); //We need something to remove
      
      await request(app)
      .post('/delete_score')
      .send({ 
        submitter: "test_submitter",
        shoe_type: "test_shoe"
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
      

      var results = await client.query("SELECT * FROM truetosize.score_submissions");
      await client.end();
      rows = results.rows;
      expect(rows.length).to.equal(0);

    });

    it('gives a 404 when score cannot be found', async function() {
      await request(app)
      .post('/delete_score')
      .send({ 
        submitter: "test_submitter",
        shoe_type: "test_shoe"
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
    });
  });

  describe('fetch_submission', function() {
    before(async function() {
      await install.install();
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
    });
    after(async function() {
      await uninstall.uninstall();
    });

    it('gives a 400 when missing required parameters', async function() {
      // missing submitter
      await request(app)
      .get('/fetch_submission')
      .send({
        shoe_type: "test_shoe"
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);

      // missing shoe_type
      await request(app)
      .get('/fetch_submission')
      .send({ 
        submitter: "test_submitter"
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
    });

    it('returns 404 when submission not found',  async function() {
      await request(app)
      .get('/fetch_submission')
      .send({ 
        submitter: "waldo",
        shoe_type: "test_shoe"
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
    });

    it('returns an existing submission',  async function() {
      const results = await request(app)
      .get('/fetch_submission')
      .send({ 
        submitter: "test_submitter",
        shoe_type: "test_shoe"
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

      console.log("Results: " + JSON.stringify(results));
    });
  });

});

describe('aggregate_scores', function() {
  before(async function() {
    await install.install();
    var insert = "INSERT INTO truetosize.score_submissions(submitter, shoe_type, score)" +
                 "VALUES " +
                 "('user1', 'red_shoe', 5), " +
                 "('user2', 'red_shoe', 4), " +
                 "('user3', 'red_shoe', 3), " +
                 "('user4', 'red_shoe', 2), " +
                 "('user5', 'red_shoe', 1), " +
                 "('user6', 'blue_shoe', 1), " +
                 "('user7', 'blue_shoe', 1), " +
                 "('user8', 'blue_shoe', 1), " +
                 "('user9', 'blue_shoe', 1), " +
                 "('user10', 'blue_shoe', 5)";
  const client = new Client();
    try {
      await client.connect();
      await client.query(insert);
      await client.end();
    }
    catch (e) {
      assert.fail("Could not populate table: " + e);
    }

    await aggregation.aggregate();

  });
  after(async function() {
    await uninstall.uninstall();
  });

  it('Creates a score for each unique shoe', async function() {
    const client = new Client();
    try {
      await client.connect();
      var { rows } = await client.query("SELECT * FROM truetosize.aggregate_scores");
      await client.end();
    }
    catch (e) {
      assert.fail("Could not populate table: " + e);
    }

    expect(rows.length).to.equal(2);
  });

  it('Calculates averages accurately', async function() {
    const client = new Client();
    try {
      await client.connect();
      var red_results = await client.query("SELECT * FROM truetosize.aggregate_scores WHERE shoe_type = 'red_shoe'");
      var blue_results = await client.query("SELECT * FROM truetosize.aggregate_scores WHERE shoe_type = 'blue_shoe'");
      await client.end();
    }
    catch (e) {
      assert.fail("Could not fetch rows: " + e);
    }
    expect(red_results.rows.length).to.equal(1);
    expect(blue_results.row.length).to.equal(1);

    expect(red_results.rows[0].average_score).to.equal(3);
    expect(blue_results.rows[0].average_score).to.equal(1.8);
  });

  it('Updates averages correctly', async function() {
    var insert = "INSERT INTO truetosize.score_submissions(submitter, shoe_type, score)" +
                 "VALUES " +
                 "('user10', 'red_shoe', 1)" +
                 "('user1', 'blue_shoe', 1)";
    var select_red = "SELECT * FROM truetosize.aggregate_scores WHERE shoe_type = 'red_shoe'";
    var select_blue = "SELECT * FROM truetosize.aggregate_scores WHERE shoe_type = 'blue_shoe'";

    const client = new Client();
    try {
      await client.connect();
      await client.query(insert);
      await aggregation.aggregate();
      var red_results = await client.query(select_red);
      var blue_results = await client.query(select_blue);
      await client.end();
    }
    catch (e) {
      assert.fail("Could not fetch rows: " + e);
    }

    expect(red_results.rows.length).to.equal(1);
    expect(blue_results.row.length).to.equal(1);

    expect(red_results.rows[0].average_score).to.equal(2.7);
    expect(blue_results.rows[0].average_score).to.equal(1.7);
  });

});