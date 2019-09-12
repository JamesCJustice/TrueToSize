var expect  = require('chai').expect;
var request = require('request');

describe('install and uninstall', function() {
  before(function() {
    const {before, after} = require('mocha');
    const {dockerComposeTool} = require('docker-compose-mocha');
    const pathToCompose = './docker-compose.yml';
     
    const envName = dockerComposeTool(before, after, pathToCompose, { containerCleanUp: true });
  });

  it('should not violate laws of equality', function(done) {
    expect('true').to.equal('true');
    done();
  });
});