/**
 * @module granax
 * @license AGPL-3.0
 * @author Gordon Hall <gordonh@member.fsf.org>
 */

'use strict';

const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { platform } = require('os');
const { Socket } = require('net');
const { readFileSync } = require('fs');

const BIN_PATH = path.join(__dirname, 'bin');
const TOR_DIRECTORY_PATH = path.join(BIN_PATH, 'Tor');
const LD_LIBRARY_PATH = path.join(
  BIN_PATH, 'tor-browser_en-US', 'Browser', 'TorBrowser', 'Tor'
);


/**
 * Returns a {@link TorController} with automatically constructed socket
 * to the local Tor bundle executable
 * @param {object} options
 * @param {object} torrcOptions
 * @returns {TorController}
 */
module.exports = function(options, torrcOptions) {
  let socket = new Socket();
  let controller = new module.exports.TorController(socket, options);
  let [torrc, datadir] = module.exports.torrc(torrcOptions);

  let exe = path.basename(module.exports.tor(platform()));
  let tor = path.join(TOR_DIRECTORY_PATH, exe);
  let env = { LD_LIBRARY_PATH: TOR_DIRECTORY_PATH };

  if (process.env.GRANAX_USE_SYSTEM_TOR && process.platform === 'linux') {
    tor = exe;
    env = {};
  }

  let args = process.env.GRANAX_TOR_ARGS
    ? process.env.GRANAX_TOR_ARGS.split(' ')
    : [];
  let child = spawn(tor, ['-f', torrc].concat(args), {
    cwd: BIN_PATH,
    env
  });
  let portFileReads = 0;

  controller.process = child; // NB: Expose the tor process to userland

  function connect() {
    let port = null;

    try {
      port = parseInt(readFileSync(path.join(
        datadir,
        'control-port'
      )).toString().split(':')[1]);
    } catch (err) {
      /* istanbul ignore next */
      portFileReads++;

      /* istanbul ignore next */
      if (portFileReads <= 20) {
        return setTimeout(() => connect(), 1000);
      } else {
        return controller.emit('error',
          new Error('Failed to read control port'));
      }
    }

    socket.connect(port, '127.0.0.1');
  }

  /* istanbul ignore next */
  process.on('exit', () => child.kill());
  child.stdout.once('data', () => setTimeout(() => connect(), 1000));
  child.on('error', (err) => controller.emit('error', err));
  child.on('exit', (code) => {
    controller.emit('error', new Error('Tor exited with code ' + code));
  });

  return controller;
};

/**
 * @type {string}
 */
module.exports.TOR_DIRECTORY_PATH = TOR_DIRECTORY_PATH;

/**
 * Returns the local path to the tor bundle
 * @returns {string}
 */
module.exports.tor = function(platform) {
  /* eslint complexity: ["error", 8] */
  let torpath = null;

  /* istanbul ignore else */
  if (process.env.GRANAX_USE_SYSTEM_TOR) {
    try {
      torpath = execFileSync(
        platform === 'win32' ? 'where' : 'which',
        ['tor']
      ).toString().trim();
    } catch (err) {
      /* istanbul ignore next */
      throw new Error('Tor is not installed');
    }

    return torpath;
  }

  switch (platform) {
    case 'win32':
      torpath = path.join(BIN_PATH, 'Browser', 'TorBrowser', 'Tor', 'tor.exe');
      break;
    case 'darwin':
      torpath = path.join(BIN_PATH, '.tbb.app', 'Contents', 'MacOS', 'Tor',
        'tor.real');
      break;
    case 'android':
    case 'linux':
      torpath = path.join(LD_LIBRARY_PATH, 'tor');
      break;
    default:
      throw new Error(`Unsupported platform "${platform}"`);
  }

  return torpath;
};

/**
 * Returns the Geo IP filename
 * @param {('IPv4'|'IPv6')} [protocol='IPv4'] - IP protocol version
 * @returns {string}
 */
module.exports.getGeoIpFilename = function(protocol = 'IPv4') {
  return `geoip${protocol === 'IPv6' ? '6' : ''}`;
};

/**
 * Returns the local path to the Geo IP file
 * @param {('IPv4'|'IPv6')} [protocol='IPv4'] - IP protocol version
 * @returns {string}
 */
module.exports.getGeoIpPath = function(platform, protocol = 'IPv4') {
  const filename = module.exports.getGeoIpFilename(protocol);

  switch (platform) {
    case 'win32':
      return path.join(BIN_PATH, 'Browser', 'TorBrowser', 'Data', 'Tor',
        filename);
    case 'darwin':
      return path.join(BIN_PATH, '.tbb.app', 'Contents', 'Resources',
        'TorBrowser', 'Tor', filename);
    case 'android':
    case 'linux':
      return path.join(BIN_PATH, 'tor-browser_en-US', 'Browser', 'TorBrowser',
        'Data', 'Tor', filename);
    default:
      throw new Error(`Unsupported platform "${platform}"`);
  }
};

/**
 * {@link TorController}
 */
module.exports.TorController = require('./lib/controller');

/**
 * {@link module:granax/commands}
 */
module.exports.commands = require('./lib/commands');

/**
 * {@link module:granax/replies}
 */
module.exports.replies = require('./lib/replies');

/**
 * {@link module:granax/torrc}
 */
module.exports.torrc = require('./lib/torrc');
