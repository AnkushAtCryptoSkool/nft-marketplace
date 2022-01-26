// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract NFT is ERC721URIStorage{
     using Counters for Counters.Counter;
     Counters.Counter private _tokenId;
    address contractAddress;

// setting contract address to marketplace so that nft tranfer function will able to interact with nft
    constructor(address marketpalceAddress) ERC721 ('Metaverse Token','MT'){
        contractAddress = marketpalceAddress;
    }

    function createToken(string memory tokenURI) public returns (uint) {
        _tokenId.increment();
        uint256 _newTokenId = _tokenId.current();

        _mint(msg.sender, _newTokenId);
        _setTokenURI(_newTokenId,tokenURI);
          setApprovalForAll(contractAddress,true);

       return _newTokenId;
    }
}