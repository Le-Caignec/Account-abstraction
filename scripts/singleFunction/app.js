import { IExec, utils } from "iexec";
import pkg from "hardhat";
const { ethers } = pkg;

const createAppFor = async (owner, rpc) => {
  const appOwnerWallet = process.env.WALLET_AA;
  const iexecAppOwner = new IExec({
    ethProvider: utils.getSignerFromPrivateKey(rpc, appOwnerWallet),
  });
  const { address: appAddress, txHash } = await iexecAppOwner.app.deployApp({
    owner,
    name: `test app${Date.now()}`,
    type: "DOCKER",
    multiaddr: "registry.hub.docker.com/iexechub/vanityeth:1.1.1",
    checksum:
      "0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14",
  });
  await waitForTransaction(txHash);

  return appAddress;
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

export { createAppFor };
