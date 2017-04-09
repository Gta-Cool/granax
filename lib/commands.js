/**
 * @module granax/commands
 */

'use strict';

const merge = require('merge');
const signals = require('./signals');


/**
 * @param {string} [token=""] - The auth token
 * @returns {string}
 */
exports.AUTHENTICATE = function(token = '') {
  return `AUTHENTICATE ${token}`;
};

/**
 * @param {string} [nonce=""] - Client nonce for challenge
 * @param {string} [type="SAFECOOKIE"] - The type of challenge
 * @returns {string}
 */
exports.AUTHCHALLENGE = function(nonce = '', type = 'SAFECOOKIE') {
  return `AUTHCHALLENGE ${type} ${nonce}`;
};

/**
 * @returns {string}
 */
exports.PROTOCOLINFO = function() {
  return 'PROTOCOLINFO';
};

/**
 * @param {string} target - Address:Port string
 * @param {object} [options]
 * @param {string} [options.clientName] - Client auth identifier
 * @param {string} [options.clientBlob] - Arbitrary auth data
 * @param {number} [options.virtualPort=80] - Virtual port for the service
 * @param {string} [options.keyType="NEW"] - Create a new key or use RSA1024
 * @param {string} [options.keyBlob="BEST"] - Key type to create or serialized
 * @param {boolean} [options.discardPrivateKey=false] - Do not return key
 * @param {boolean} [options.detach=false] - Keep service running after close
 * @param {boolean} [options.basicAuth=false] - Use client name and blob auth
 * @param {boolean} [options.nonAnonymous=false] - Non-anononymous mode
 */
exports.ADD_ONION = function(target, opts = {}) {
  let options = merge({
    clientName: null,
    clientBlob: null,
    virtualPort: 80,
    keyType: 'NEW',
    keyBlob: 'BEST',
    discardPrivateKey: false,
    detach: false,
    basicAuth: false,
    nonAnonymous: false
  }, opts);
  let command = ['ADD_ONION', `${options.keyType}:${options.keyBlob}`];
  let flags = [
    ['discardPrivateKey', 'DiscardPK'],
    ['detach', 'Detach'],
    ['basicAuth', 'BasicAuth'],
    ['nonAnonymous', 'NonAnonymous']
  ];

  for (let flag in flags) {
    if (options[flag[0]]) {
      command.push(flag[1]);
    }
  }

  command.push(`Port=${options.virtualPort},${target}`);

  if (options.clientName && options.clientBlob) {
    command.push(`ClientAuth=${options.clientName}:${options.clientBlob}`);
  }

  return command.join(' ');
};

/**
 * @param {string} serviceId
 * @returns {string}
 */
exports.DEL_ONION = function(serviceId) {
  return `DEL_ONION ${serviceId}`;
};

/**
 * @param {string} keyword
 * @param {string} value
 * @returns {string}
 */
exports.SETCONF = function(keyword, value) {
  return `SETCONF ${keyword}="${value}"`;
};

/**
 * @param {string} keyword
 * @returns {string}
 */
exports.RESETCONF = function(keyword) {
  return `RESETCONF ${keyword}`;
};

/**
 * @param {string} keyword
 * @returns {string}
 */
exports.GETCONF = function(keyword) {
  return `GETCONF ${keyword}`;
};

/**
 * @returns {string}
 */
exports.SAVECONF = function() {
  return 'SAVECONF';
};

/**
 * @returns {string}
 */
exports.SIGNAL = function(signal) {
  return `SIGNAL ${signal}`;
};