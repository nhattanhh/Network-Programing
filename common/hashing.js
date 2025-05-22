const crypto = require('crypto');

function getChecksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = { getChecksum };
