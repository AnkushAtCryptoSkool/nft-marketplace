import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import Image from 'next/image'

// making connection with ipfs
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

import {
    nftAddress, nftMarketAddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

export default function CreateItems() {
    const [fileUrl, setfileUrl] = useState(null);
    const [formInput, updateformInput] = useState({ price: '', name: '', description: '' });
    const router = useRouter();

    // using onchange function -> uploading image to ipfs & getting a resulting url
    async function onChange(e) {
        const file = e.target.files[0];
        try {
            // uploading file to ipfs
            const added = await client.add(file, { progress: (prog) => console.log(`received : ${prog}`) });
            const url = `https://ipfs.infura.io:5001/${added.path}`; // url we got is the url provided by infura after uploading to ipfs
            setfileUrl(url);

        } catch (error) {
            console.log('Error in uploading file',error);
        }

    }

    // create and upload nft to ipfs
    async function createItem() {
        const { name, description, price } = formInput; //initiallize  forminput value
        if (!name || !description || !price || !fileUrl || price <= 0) return; // form validiation
        //if everything is fine then stringify the received object 

        const data = JSON.stringify({ name, description, image: fileUrl });
        try {
            // uploading stringified data object 
            const added = await client.add(data);
            const url = `https://ipfs.infura.io:5001/${added.path}`; // url we got is the url provided by infura after uploading to ipfs as whole obj
            createSale(url);

        } catch (error) {
            console.log('Error uploading file: ',error);
        }
    }

    // list ite, for sale to the market
    async function createSale(url) {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        // getting instance of nft contract
        let contract = new ethers.Contract(nftAddress, NFT.abi, signer);
        let transaction = await contract.createToken(url);
        let tx = await transaction.wait();

        // for getting token id it is little bit difficult
        // because after the transaction , it returns many things 
        // one of which is events & inside events array  their is argument array 
        // inside argument array at 3rd place we got the token id (in big int) form
        let event = tx.events[0];
        let value = event.args[2];
        let tokenId = value.toNumber(); // converting big int to number

        const price = ethers.utils.parseUnits(formInput.price.toString(), 'ether');

        // taking nftmarket contract & calling createMakretItem function inside it
        contract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
        let listingPrice = await contract.getListingPrice();
        listingPrice = listingPrice.toString();

        transaction = await contract.createMarketItem(nftAddress, tokenId, price, { value: listingPrice });
        await transaction.wait();
        router.push('/');  // redirecting to home after pushing nft to ipfs


    }

    return (
        <div className="flex justify-center">
            <div className="flex flex-col pb-12 w-1/2">
                <input
                    placeholder='Asset Name'
                    className='p-4 rounded-full border mt-8'
                    // ...formInput means taking complete array of form input as it is
                    // and picking up the name only from it 
                    onChange={(e) => { updateformInput({ ...formInput, name: e.target.value }) }}
                />
                <textarea
                    placeholder='Asset Description'
                    className='p-4 rounded-full border mt-2'
                    onChange={(e) => { updateformInput({ ...formInput, description: e.target.value }) }}
                />
                <input
                    placeholder='Asset Price in Matic'
                    className='p-4 rounded-full border mt-2'
                    type='number'
                    onChange={(e) => { updateformInput({ ...formInput, price: e.target.value }) }}
                />
                {/* creating a choose file option  */}
                <input name='Asset' type="file" className='py-4' onChange={onChange} />
                {
                    fileUrl && (
                        <img className="rounded mt-4" width="350px" height='350px' src={fileUrl} />
                    )
                }
                <button
                    onClick={createItem}
                    className='font-bold bg-pink-500 hover:bg-pink-700 text-white text-center p-4  mt-2 rounded-full shadow-2xl'
                > Create Digital Asset </button>
            </div>
        </div>
    )

}