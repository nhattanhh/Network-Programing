const fs = require('fs');
const path = require('path');
const readline = require('readline');
const WebSocket = require('ws');
const os = require('os');
const { getChecksum } = require('../common/hashing');
const types = require('../common/messageTypes');

const INDEX_URL = 'ws://localhost:8000';
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ws = new WebSocket(INDEX_URL);

// add size‐format helper
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' kB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

ws.on('open', () => {
  console.log('Connected to index server.');
  prompt();
});

ws.on('message', msg => {
  let m = JSON.parse(msg);
  switch (m.type) {
    case types.UPLOAD_ACK:
      console.log(`Upload complete. File ID: ${m.fileId}`);
      prompt();
      break;
    case types.LIST_RESPONSE:
      console.log('Available files:');
      m.files.forEach(f => {
        console.log(`${f.id} - ${f.name} (${formatSize(f.size)}) - ${f.date}`);
      });
      prompt();
      break;
    case types.RETRIEVE_ACK:
      if (m.error) { console.log('Error:', m.error); prompt(); break; }
      let buf = Buffer.from(m.data, 'base64');
      fs.writeFileSync(path.join(DOWNLOAD_DIR, m.fileId + '_' + m.name), buf);
      console.log(`Download complete: ${m.name}`);
      prompt();
      break;
    case types.DELETE_ACK:
      console.log(`Deleted: ${m.fileId}`); prompt();
      break;
  }
});

function prompt() {
  rl.question('> ', cmd => {
    let [c, arg] = cmd.split(' ');
    switch (c) {
      case 'upload': {
        // expand '~' to home dir and resolve full path
        const filePath = arg.startsWith('~')
          ? path.join(os.homedir(), arg.slice(1))
          : path.resolve(arg);
        let buf = fs.readFileSync(filePath);
        ws.send(JSON.stringify({
          type: types.UPLOAD,
          name: path.basename(filePath),
          size: buf.length,
          date: new Date().toISOString(),
          checksum: getChecksum(buf),
          data: buf.toString('base64')
        }));
        console.log(`Uploading ${filePath}...`);
        break;
      }
      case 'list':
        ws.send(JSON.stringify({ type: types.LIST }));
        break;
      case 'download':
        ws.send(JSON.stringify({ type: types.DOWNLOAD, fileId: arg }));
        break;
      case 'delete':
        ws.send(JSON.stringify({ type: types.DELETE, fileId: arg }));
        break;
      default:
        console.log('Commands: upload <path>, list, download <id>, delete <id>');
        prompt();
    }
  });
}
