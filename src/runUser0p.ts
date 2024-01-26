import { ethers } from "hardhat";
import { deploy } from "../deploy/1_deploy_entrypoint_AAF";

export async function run() {
  const { EntryPointAddress, AccountAbstractionFactoryAddress } =
    await deploy();

  const EntryPointContract = await ethers.getContractAt(
    "EntryPoint",
    EntryPointAddress
  );
  const FactoryAccountAbstractionContract = await ethers.getContractAt(
    "SimpleAccountFactory",
    AccountAbstractionFactoryAddress
  );
  const AccountAbstractionFactory = await ethers.getContractFactory(
    "SimpleAccount"
  );

  const [signer0] = await ethers.getSigners();
  const address0 = await signer0.getAddress();

  // first arg correspond to the owner of the AA account. Here is the sender of the userOp tx but
  // in real it should a different address from the bundler address
  const initCode =
    AccountAbstractionFactoryAddress +
    FactoryAccountAbstractionContract.interface
      .encodeFunctionData("createAccount", [address0, ethers.utils.id("salt")])
      .slice(2);
  const nonce = 1;
  //   const callData = AccountAbstractionFactory.interface.encodeFunctionData(
  //     "execute",
  //     ["", "", ""]
  //   );

  try {
    await EntryPointContract.callStatic.getSenderAddress(initCode);
  } catch (error: any) {
    // catch the revert custom error : error SenderAddressResult(address sender);
    const sender = error.errorArgs[0];
  }

  //   const PackedUserOperation = {
  //     sender,
  //     nonce,
  //     initCode,
  //     callData,
  //     accountGasLimits: "0x",
  //     preVerificationGas: 50_000,
  //     maxFeePerGas: ethers.utils.parseUnits("10", "gwei"),
  //     maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
  //     paymasterAndData: "0x",
  //     signature: "0x",
  //   };

  //   EntryPointContract.depositTo(sender, { value: ethers.utils.parseEther("1") });
  //   // second args is the beneficiary address => should be the bundler address
  //   EntryPointContract.handleOps([PackedUserOperation], address0);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
