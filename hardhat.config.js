require("@nomiclabs/hardhat-waffle");
const fs = require('fs');
const privateKey = fs.readFileSync('.secret').toString().trim();
const projectId = 'ac2f0def5fa56736c2e9d22a';

module.exports = {
  networks:{
      hardhat:{
        chainId:1337
      },
      mumbai:{
       url:`https://speedy-nodes-nyc.moralis.io/${projectId}/polygon/mumbai`
      },
      mainnet:{
       url:`https://speedy-nodes-nyc.moralis.io/${projectId}/polygon/mainnet`
      },
  },
  solidity: "0.8.4",

};

