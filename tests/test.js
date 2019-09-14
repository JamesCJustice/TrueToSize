const expect  = require('chai').expect;
const request = require('request');
var describe = require('mocha').describe;
var before = require('mocha').before;
var it = require('mocha').it;
var assert = require('assert');

describe('install and uninstall', function() {

  it('should not violate laws of equality', function(done) {
    expect('true').to.equal('true');
    done();
  });
});