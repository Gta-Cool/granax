/**
 * @module granax/torrc
 */

'use strict';

const path = require('path');
const mkdirp = require('mkdirp');
const { randomBytes } = require('crypto');
const { tmpdir } = require('os');
const { writeFileSync, existsSync } = require('fs');
const { TOR_DIRECTORY_PATH, getGeoIpFilename } = require('..');


/**
 * Generates a usable torrc file, writes it to temp storage and then returns
 * the path to the file
 * @param {object} options
 * @returns {string}
 */
module.exports = function(options = {}) {
  /* eslint max-statements: [2, 26] */
  let id = randomBytes(8).toString('hex');
  let dataDirectory = path.join(tmpdir(), `granax-${id}.d`);
  let torrcFile = path.join(tmpdir(), `granax-${id}`);
  let controlFilePath = path.join(dataDirectory, 'control-port');
  let socksPort = 'auto IPv6Traffic PreferIPv6 KeepAliveIsolateSOCKSAuth';
  let torrcContent = [
    'AvoidDiskWrites 1',
    'ControlPort auto',
    'CookieAuthentication 1'
  ];

  ['IPv4', 'IPv6'].forEach((protocol) => {
    const geoIpPath = path.join(TOR_DIRECTORY_PATH, getGeoIpFilename(protocol));
    if (existsSync(geoIpPath)) {
      torrcContent.push(
        `${protocol === 'IPv4' ? 'GeoIPFile' : 'GeoIPv6File'} ${geoIpPath}`
      );
    }
  });

  if (!Array.isArray(options)) {
    options = [options];
  }

  for (let block of options) {
    for (let property in block) {
      // NB: Don't push the DataDirectory SocksPort until later so we can
      // ND: default it
      if (property === 'DataDirectory') {
        dataDirectory = block[property];
        torrcFile = path.join(dataDirectory, 'torrc');
        controlFilePath = path.join(dataDirectory, 'control-port')
        continue;
      }
      if (property === 'SocksPort') {
        socksPort = block[property];
        continue;
      }
      torrcContent.push(`${property} ${block[property]}`);
    }
  }

  torrcContent.push(`DataDirectory ${dataDirectory}`);
  torrcContent.push(`SocksPort ${socksPort}`);
  torrcContent.push(`ControlPortWriteToFile ${controlFilePath}`);
  mkdirp.sync(dataDirectory);
  writeFileSync(torrcFile, torrcContent.join('\n'));

  return [torrcFile, dataDirectory];
};
