'use strict';

const proxyquire = require('proxyquire');
const { expect } = require('chai');
const sinon = require('sinon');


describe('@module granax/torrc', function() {

  const sandbox = sinon.sandbox.create();
  const _mkdirpSync = sandbox.stub();
  const _writeFileSync = sandbox.stub();
  const _existsSync = sandbox.stub();
  const torrc = proxyquire('../lib/torrc', {
    mkdirp: {
      sync: _mkdirpSync
    },
    fs: {
      writeFileSync: _writeFileSync,
      existsSync: _existsSync
    }
  });

  afterEach(() => sandbox.reset());

  describe('@exports', function() {

    it('should write the torrc to tmp', function() {
      const result = torrc();
      expect(_mkdirpSync.called).to.equal(true);
      expect(_writeFileSync.called).to.equal(true);
      expect(typeof result[0]).to.equal('string');
      expect(typeof result[1]).to.equal('string');
      expect(Array.isArray(result)).to.equal(true);
    });

    it('should add Geo IP files path to the torrc', function() {
      _existsSync.returns(true);
      torrc();
      expect(_existsSync.calledTwice).to.equal(true);
      expect(_writeFileSync.calledWith(
        sinon.match.string,
        sinon.match(/GeoIPFile/).and(sinon.match(/GeoIPv6File/))
      )).to.equal(true);
    });

    it('should not add Geo IP files path to the torrc', function() {
      _existsSync.returns(false);
      torrc();
      expect(_existsSync.calledTwice).to.equal(true);
      expect(_writeFileSync.calledWith(
        sinon.match.string,
        sinon.match(/GeoIPFile/).or(sinon.match(/GeoIPv6File/))
      )).to.equal(false);
    });

  });

});
