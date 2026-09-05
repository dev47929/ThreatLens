// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AuditRegistry {

    struct Record {
        bytes32 dataHash;
        string commitId;
        address sender;
        uint256 timestamp;
    }

    uint256 public recordCount;

    mapping(uint256 => Record) public records;

    event RecordStored(
        uint256 indexed id,
        bytes32 dataHash,
        string commitId,
        address sender,
        uint256 timestamp
    );

    function storeRecord(bytes32 _dataHash, string memory _commitId) public {
        recordCount++;

        records[recordCount] = Record({
            dataHash: _dataHash,
            commitId: _commitId,
            sender: msg.sender,
            timestamp: block.timestamp
        });

        emit RecordStored(
            recordCount,
            _dataHash,
            _commitId,
            msg.sender,
            block.timestamp
        );
    }

    function getRecord(uint256 _id) public view returns (
        bytes32,
        string memory,
        address,
        uint256
    ) {
        Record memory r = records[_id];
        return (r.dataHash, r.commitId, r.sender, r.timestamp);
    }

    // 🔍 Search by commitId (returns first match)
    function findByCommitId(string memory _commitId) public view returns (
        uint256 id,
        bytes32 dataHash,
        address sender,
        uint256 timestamp
    ) {
        bytes32 target = keccak256(bytes(_commitId));

        for (uint256 i = 1; i <= recordCount; i++) {
            if (keccak256(bytes(records[i].commitId)) == target) {
                Record memory r = records[i];
                return (i, r.dataHash, r.sender, r.timestamp);
            }
        }

        revert("Not found");
    }

    // 🔍 Search by exact timestamp (returns first match)
    function findByTimestamp(uint256 _timestamp) public view returns (
        uint256 id,
        bytes32 dataHash,
        string memory commitId,
        address sender
    ) {
        for (uint256 i = 1; i <= recordCount; i++) {
            if (records[i].timestamp == _timestamp) {
                Record memory r = records[i];
                return (i, r.dataHash, r.commitId, r.sender);
            }
        }

        revert("Not found");
    }

    // 🔍 Get records within time range
    function findByTimeRange(uint256 start, uint256 end) public view returns (
        uint256[] memory ids
    ) {
        uint256 count = 0;

        // first pass: count matches
        for (uint256 i = 1; i <= recordCount; i++) {
            if (
                records[i].timestamp >= start &&
                records[i].timestamp <= end
            ) {
                count++;
            }
        }

        ids = new uint256[](count);
        uint256 index = 0;

        // second pass: fill array
        for (uint256 i = 1; i <= recordCount; i++) {
            if (
                records[i].timestamp >= start &&
                records[i].timestamp <= end
            ) {
                ids[index++] = i;
            }
        }
    }
}