require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

const { WALLET_BUNDLER, WALLET_AA, ETHERSCAN_API_KEY, INFURA_ID } = process.env;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "localhost",
  solidity: {
    compilers: [
      {
        version: "0.8.23",
        settings: {
          optimizer: { enabled: true, runs: 1000000 },
        },
      },
    ],
  },
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_ID}`,
      accounts: [WALLET_BUNDLER, WALLET_AA],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
};
