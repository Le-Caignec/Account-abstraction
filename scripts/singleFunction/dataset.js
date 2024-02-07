import { IExec, utils } from "iexec";
import pkg from "hardhat";
const { ethers } = pkg;

const createDatasetFor = async (owner, rpc) => {
  const datasetOwnerWallet = process.env.WALLET_AA;
  const iexecDatasetOwner = new IExec({
    ethProvider: utils.getSignerFromPrivateKey(rpc, datasetOwnerWallet),
  });

  const { address: datasetAddress, txHash } =
    await iexecDatasetOwner.dataset.deployDataset({
      owner,
      name: `test content${Date.now()}`,
      multiaddr: "/ipfs/Qmd286K6pohQcTKYqnS1YhWrCiS4gz7Xi34sdwMe9USZ7u",
      checksum:
        "0x84a3f860d54f3f5f65e91df081c8d776e8bcfb5fbc234afce2f0d7e9d26e160d",
    });
  await waitForTransaction(txHash);

  return datasetAddress;
};

const waitForTransaction = async (txHash) => {
  const provider = ethers.provider;
  while (true) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt && receipt.blockNumber) {
      console.log("Transaction mined:", receipt);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds
  }
};

export { createDatasetFor };
