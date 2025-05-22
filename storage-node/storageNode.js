const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { getChecksum } = require('../common/hashing');
const types = require('../common/messageTypes');

const INDEX_URL = 'ws://localhost:8000';
const NODE_ID = process.argv[2] || `node-${Date.now()}`;
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const ws = new WebSocket(INDEX_URL);
ws.on('open', () => {
  ws.send(JSON.stringify({ type: types.REGISTER_NODE, nodeId: NODE_ID }));
});

ws.on('message', msg => {
  let m = JSON.parse(msg);
  switch (m.type) {
    case types.STORE: {
      let buf = Buffer.from(m.data, 'base64');
      let filePath = path.join(DATA_DIR, m.fileId);
      fs.writeFileSync(filePath, buf);
      ws.send(JSON.stringify({ type: types.STORE_ACK, fileId: m.fileId }));
      break;
    }
    case types.RETRIEVE: {
      let filePath = path.join(DATA_DIR, m.fileId);
      let buf = fs.readFileSync(filePath);
      ws.send(JSON.stringify({
        type: types.RETRIEVE_ACK,
        fileId: m.fileId,
        name: m.name,
        data: buf.toString('base64'),
        checksum: getChecksum(buf)
      }));
      break;
    }
    case types.DELETE: {
      let filePath = path.join(DATA_DIR, m.fileId);
      fs.unlinkSync(filePath);
      ws.send(JSON.stringify({ type: types.DELETE_ACK, fileId: m.fileId }));
      break;
    }
  }
});
