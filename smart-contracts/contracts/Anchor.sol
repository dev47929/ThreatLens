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

    uint256 private _nextId = 1;

    // Global anchor storage
    mapping(uint256 => ChainAnchor) private _anchors;

    // chain_id => latest anchor ID
    mapping(string => uint256) private _latestAnchorId;

    // chain_id => latest anchored height
    mapping(string => uint256) private _latestChainHeight;

    // chain_id => chain_height => anchor ID
    mapping(string => mapping(uint256 => uint256)) private _anchorByHeight;

    event ChainAnchored(
        uint256 indexed id,
        string indexed chainId,
        uint256 chainHeight,
        bytes32 chainHash,
        uint256 timestamp
    );

    /**
     * @notice Create an on-demand anchor for a ThreadLens chain.
     *
     * The chain height must be greater than the previously
     * anchored height for the same chain.
     */
    function anchorChain(
        string calldata chainId,
        uint256 chainHeight,
        bytes32 chainHash
    ) external returns (uint256 id) {

        require(bytes(chainId).length > 0, "Invalid chain ID");
        require(chainHash != bytes32(0), "Invalid chain hash");

        uint256 latestHeight = _latestChainHeight[chainId];

        require(
            chainHeight > latestHeight,
            "Chain height must increase"
        );

        require(
            _anchorByHeight[chainId][chainHeight] == 0,
            "Height already anchored"
        );

        id = _nextId++;

        uint256 timestamp = block.timestamp;

        _anchors[id] = ChainAnchor({
            id: id,
            chainId: chainId,
            chainHeight: chainHeight,
            chainHash: chainHash,
            timestamp: timestamp
        });

        _latestAnchorId[chainId] = id;
        _latestChainHeight[chainId] = chainHeight;
        _anchorByHeight[chainId][chainHeight] = id;

        emit ChainAnchored(
            id,
            chainId,
            chainHeight,
            chainHash,
            timestamp
        );
    }

    /**
     * @notice Fetch an anchor using its global ID.
     */
    function getAnchorById(
        uint256 id
    ) external view returns (ChainAnchor memory) {

        require(
            id > 0 && id < _nextId,
            "Anchor does not exist"
        );

        return _anchors[id];
    }

    /**
     * @notice Fetch the latest anchor for a chain.
     */
    function getLatestAnchor(
        string calldata chainId
    ) external view returns (ChainAnchor memory) {

        uint256 id = _latestAnchorId[chainId];

        require(
            id != 0,
            "Chain has no anchors"
        );

        return _anchors[id];
    }

    /**
     * @notice Fetch an anchor using chain ID and chain height.
     */
    function getAnchorByHeight(
        string calldata chainId,
        uint256 chainHeight
    ) external view returns (ChainAnchor memory) {

        uint256 id = _anchorByHeight[chainId][chainHeight];

        require(
            id != 0,
            "Anchor does not exist"
        );

        return _anchors[id];
    }

    /**
     * @notice Get the latest anchored height of a chain.
     */
    function getLatestChainHeight(
        string calldata chainId
    ) external view returns (uint256) {

        return _latestChainHeight[chainId];
    }

    /**
     * @notice Get the total number of anchors created.
     */
    function getAnchorCount()
        external
        view
        returns (uint256)
    {
        return _nextId - 1;
    }

    /**
     * @notice Check whether a specific chain height has been anchored.
     */
    function isAnchored(
        string calldata chainId,
        uint256 chainHeight
    ) external view returns (bool) {

        return _anchorByHeight[chainId][chainHeight] != 0;
    }
}