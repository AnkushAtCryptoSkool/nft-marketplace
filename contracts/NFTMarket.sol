// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds; // total items created ever
    Counters.Counter private _itemsSold; // total items sold ever

    address payable owner;
    uint256 listingPrice = 0.0256 ether;

    constructor() {
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }
   //     itemId -> marketItem
    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function setListingPrice(uint newListingPrice) public returns (uint256){
          if(msg.sender == address(this)){
              listingPrice = newListingPrice;
          }
          return listingPrice;
    }

// creating item
    function createMarketItem(address nftContract,uint256 tokenId,uint256 price) public payable nonReentrant {
        require(price > 0 , "Price must be at least 1 wei");
        require(msg.value == listingPrice,"Price must be equal to listing price");
        _itemIds.increment(); // increasing count of no of items created ever
        uint256 itemId = _itemIds.current();
        idToMarketItem[itemId] = MarketItem({
            itemId: itemId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: payable(msg.sender),
            owner: payable(address(0)),
            price: price,
            sold: false
        });
        // sending owenship of nft to the contract from owner (ms.sender)
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );

    }

// item sale function
    function createMarketSale(address nftContract, uint itemId) public payable nonReentrant{
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;

        require(msg.value == price , "Please submit the asked price");
        idToMarketItem[itemId].seller.transfer(msg.value);
     // transfering ownership to the seller
        IERC721(nftContract).transferFrom( address(this),msg.sender, tokenId);
        // updating ownership in our mapping
        idToMarketItem[itemId].owner = payable (msg.sender);
        // updating status sold  in our mapping 
         idToMarketItem[itemId].sold = true;
     // increase overall count of itemsSold
          _itemsSold.increment();
          // paying amount to owner of contract his commission
          payable (owner).transfer(listingPrice);

    } 
     // total no of unsold nft on the platform
    function fetchMarketItems() public view returns (MarketItem[] memory ){
         // getting total no of items created
         uint totalItemCount = _itemIds.current();
         // getting total no of unsold items
         uint unsoldTotalItemCount = _itemIds.current() - _itemsSold.current();
        
         // for iteration in Market Item  array we need index
         uint currentIndex = 0;
         // creating market item Array
         MarketItem[] memory items = new MarketItem[](unsoldTotalItemCount);
          
         // iterating through the MarketItem Array
         for(uint i=0;i < totalItemCount;i++){
                // now checking owner is renowed 
                // to get all unsold items
                if(idToMarketItem[i+1].owner == address(0)){
                    // it means item is unsold
                     uint currentId = idToMarketItem[i+1].itemId;
                     MarketItem storage currentItem = idToMarketItem[currentId];
                     items[currentIndex] = currentItem;
                     currentIndex += 1;
                }     
         
         }
         return items;
    }

    // Total items owned by the current User
       function fetcMyNFTs() public view returns(MarketItem[] memory){
           uint totalItemCount = _itemIds.current();
           uint itemCount = 0;
           uint currentItemIndex = 0;
           // finding the length of marketItem Array
            for(uint i=0;i <totalItemCount ; i++){
                if(idToMarketItem[i+1].owner == (msg.sender)){
                    itemCount++;
                }
            }

            // creating Array
            MarketItem[] memory items = new MarketItem[](itemCount);
            for(uint i=0;i < totalItemCount; i++){
                //looping through the array
                  if(idToMarketItem[i+1].owner == (msg.sender)){
                      
                      uint currentId = idToMarketItem[i+1].itemId;
                      MarketItem storage currentItem = idToMarketItem[currentId];
                      items[currentItemIndex] = currentItem;
                      currentItemIndex++;

                  }
            }

            return items;

       }

     // total no fo items created by an current user
     function fetchItemsCreated() public view returns(MarketItem[] memory){
         uint totalItemCount = _itemIds.current();
           uint itemCount = 0;
           uint currentItemIndex = 0;
           // finding the length of marketItem Array
            for(uint i=0;i <totalItemCount ; i++){
                if(idToMarketItem[i+1].seller == (msg.sender)){
                    itemCount++;
                }
            }

            // creating Array
            MarketItem[] memory items = new MarketItem[](itemCount);
            for(uint i=0;i < totalItemCount; i++){
                //looping through the array
                // checking if nft below to the current user 
                  if(idToMarketItem[i+1].seller == (msg.sender)){
                      
                      uint currentId = idToMarketItem[i+1].itemId;
                      MarketItem storage currentItem = idToMarketItem[currentId];
                      items[currentItemIndex] = currentItem;
                      currentItemIndex++;

                  }
            }

            return items;
     }

}
