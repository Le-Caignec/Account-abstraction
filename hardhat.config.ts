import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const { WALLET_PRIVATE_KEY, INFURA_ID } = process.env;

const bellecourBase = {
  gasPrice: 0,
  blockGasLimit: 6_700_000,
  hardfork: "berlin",
};

const config: HardhatUserConfig = {
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
    // hardhat: {
    //   ...bellecourBase,
    //   chainId: 134,
    //   forking: {
    //     enabled: true,
    //     url: "https://bellecour.iex.ec",
    //   },
    // },
    "local-bellecour-fork": {
      ...bellecourBase,
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_ID}`,
      accounts: WALLET_PRIVATE_KEY ? [WALLET_PRIVATE_KEY] : [],
    },
  },
};

export default config;
