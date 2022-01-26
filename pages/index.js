import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { ethers, providers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import { nftAddress, nftMarketAddress } from '../config'
// importing abi code so that we can use it in javascript because js only understand abi
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'


export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    loadNfts();

  }, []); // we pass a empty array so that if we act only first time when page refresh 

  async function loadNfts() {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, provider);
    const data = await marketContract.fetchMarketItems(); // wil return an array of market items
/*
    *  map over items returned from smart contract and format 
    *  them as well as fetch their token metadata
    */
    const items = await Promise.all(data.map(async (i) => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId);
      const meta = await axios.get(tokenUri); // tokeURI will equivalent ot "www.somthing.com/some-img-url"
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      let item = {
        price, // in ecmascript 2016 if price : price then we can only write price
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
        itemId: item.itemId.toNumber()
      }
      return item;
    }));

    setNfts(items);
    setLoadingState('loaded');

  }

  if (loadingState === 'loaded' && !nfts.length) {
    return (
      <h1 className='px-20 py-10 text-3xl text-center'>No Items To Display In Metaverse</h1>
    )
  }

  async function buyNfts(nft) {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = await ethers.providers.Web3Provider(connection);
    // after getting provider , we need somebody to sign the transaction or pay fee
    const signer = provider.getSigner();
    // getting contract 
    const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
    const price = ethers.utils.formatUnits(nft.price.toString(), 'ether');

    // calling createMarketSale function
    const transaction = await marketContract.createMarketSale(nftAddress, nft.tokenId, { value: price });
    await transaction.wait();
    loadNfts();
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">

          {
            nfts.map((nft, i) => {
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} alt="" srcset="" />
                <div className="p-4">
                  <p className="text-2xl font-semibold" style={{ height: '64px' }}>{nft.name}</p>
                  <div className="" style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} MATIC</p>
                  <button className='w-full bg-pink-500 text-white font-bold py-2 px-12 rounded' onClick={() => { buyNfts(nft) }}>Buy</button>
                </div>
              </div>
            })
          }
        </div>
      </div>
    </div>
  )
}
