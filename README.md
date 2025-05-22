# [C3] Multi-Node File Storage System

## Team Members
- **Vũ Nhật Anh - 22BA13036** 
- **Bùi Quang Huy - 22BI13188** 
- **Trần Anh Quốc - 22BA13266**
- **Nguyễn Quang Anh - 22BA13023**
- **Lê Việt Trung - 22BA13305**
- **Vũ Quang Thành - 22BA13291**
- **Nguyễn Quốc Khánh - 22BA13173**

## REPORT: [Report-NP-TopicC3.pdf](https://github.com/nhattanhh/Network-Programing/Report-NP-TopicC3.pdf)

## Architecture
- **Index Server** (`index-server/`): manages file metadata, handles node registration, and oversees file replication.
- **Storage Nodes** (`storage-node/`): self-register with the index server, store files in `data/`, and support storing, retrieving, and deleting files.
- **Client** (`client/`): a command-line interface for uploading, listing, downloading, and deleting files.

## Distribution Algorithm
- During file upload, the index server selects the first 3 registered storage nodes.
- The full file is transmitted via WebSocket to each selected node.
- Upload is confirmed to the client only after all nodes respond with STORE_ACK.

## Node Selection
- Uses a simple FIFO approach to pick the first N nodes.
- Future enhancements can include latency-based or geo-aware selection strategies.

## Fault Tolerance
- With a replication factor of 3, the system can handle up to 2 node failures.
- The index server only confirms uploads after all replicas acknowledge receipt.
- Heartbeat monitoring and automatic re-replication are planned features for future development.

## Performance
- Tested with files up to 50MB; file data is chunked internally using WebSocket frames.
- Achieves ~40 MB/s throughput on local testing.

## Usage
Open 3 separate terminal windows:
1. Run the index server:  
   `cd index-server && npm install && node index.js`
2. Start each storage node:  
   `cd storage-node && npm install && node storageNode.js NODE_ID`
3. Run the client interface:  
   `cd client && npm install && node client.js`
4. Use the client commands:
   - `upload <file>`  (file is saved in `/storage-node/data`)
   - `list`  
   - `download <id>`  (file is saved in `/client/downloads`)
   - `delete <id>`
