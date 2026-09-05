// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ThreadLensAnchor {

    struct ChainAnchor {
        uint256 id;
        string chainId;
        uint256 chainHeight;
        bytes32 chainHash;
        uint256 timestamp;
    }

    uint256 private nextId = 1;

    mapping(uint256 => ChainAnchor) private anchors;

    event ChainAnchored(
        uint256 indexed id,
        string chainId,
        uint256 chainHeight,
        bytes32 chainHash,
        uint256 timestamp
    );

    function anchorChain(
        string calldata chainId,
        uint256 chainHeight,
        bytes32 chainHash,
        uint256 timestamp
    ) external returns (uint256) {

        uint256 id = nextId++;

        anchors[id] = ChainAnchor({
            id: id,
            chainId: chainId,
            chainHeight: chainHeight,
            chainHash: chainHash,
            timestamp: timestamp
        });

        emit ChainAnchored(
            id,
            chainId,
            chainHeight,
            chainHash,
            timestamp
        );

        return id;
    }

    function getAnchor(uint256 id)
        external
        view
        returns (ChainAnchor memory)
    {
        return anchors[id];
    }

    function getNextId()
        external
        view
        returns (uint256)
    {
        return nextId;
    }
}