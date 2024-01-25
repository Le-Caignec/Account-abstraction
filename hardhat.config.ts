import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const bellecourBase = {
  gasPrice: 0,
  blockGasLimit: 6_700_000,
  hardfork: "berlin",
};

const config: HardhatUserConfig = {
  defaultNetwork: "sepolia",
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: { enabled: true, runs: 1000000 },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      ...bellecourBase,
      chainId: 134,
      forking: {
        enabled: true,
        url: "https://bellecour.iex.ec",
      },
    },
    "local-bellecour-fork": {
      ...bellecourBase,
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_ID}`,
    },
  },
};

export default config;
