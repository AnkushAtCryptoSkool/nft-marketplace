const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", function () {
  it("Should Create & Execute Market Sales", async function () {
     const Market = await ethers.getContractFactory("NFTMarket");
     const market = await Market.deploy();
      await market.deployed();
      const marketAddress = market.address;

      const NFT = await ethers.getContractFactory("NFT");
      const nft = await NFT.deploy(marketAddress);
       nft.deployed();
       const nftContractAddress = nft.address;

       let listingPrice = await  market.getListingPrice();
          listingPrice = listingPrice.toString();

          const auctionPrice = ethers.utils.parseUnits('100','ether');
          await nft.createToken('https://devexample1.com');
          await nft.createToken('https://devexample2.com');

     
          await market.createMarketItem(nftContractAddress,1,auctionPrice,{value : listingPrice});
          await market.createMarketItem(nftContractAddress,2,auctionPrice,{value : listingPrice});

          const [_,buyerAddress] = await ethers.getSigners();
          await market.connect(buyerAddress).createMarketSale(nftContractAddress,2,{value : auctionPrice});
         
         // fetch market items
            let items =  await market.fetchMarketItems();
             items = await Promise.all(items.map(async (i)=>{
                let tokenURI = await nft.tokenURI(i.tokenId);
                let item = {
                  itemId : i.itemId.toString(),
                  nftContract: i.nftContract.toString(),
                  tokenId: i.tokenId.toString(),
                  seller : i.seller,
                  owner : i.owner,
                  price : i.price.toString(),
                  tokenURI
                }
                return item;
             }))
            console.log("items :" ,items);
  });
});
