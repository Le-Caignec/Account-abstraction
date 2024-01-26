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

  const [bundler] = await ethers.getSigners();
  const address0 = bundler.address;

  // first arg correspond to the owner of the AA account. Here is the sender of the userOp tx but
  // in real it should a different address from the bundler address
  const initCode =
    AccountAbstractionFactoryAddress +
    FactoryAccountAbstractionContract.interface
      .encodeFunctionData("createAccount", [address0, ethers.id("salt")])
      .slice(2);
  const nonce = 1;
  const callData = AccountAbstractionFactory.interface.encodeFunctionData(
    "execute",
    []
  );
  let sender;
  try {
    await EntryPointContract.getSenderAddress(initCode);
  } catch (error: any) {
    // catch the revert custom error : error SenderAddressResult(address sender);
    sender = EntryPointContract.interface.decodeErrorResult(
      "SenderAddressResult",
      error.data.data
    )[0];
    console.log("==AA Address==", sender);
  }

  const PackedUserOperation = {
    sender,
    nonce,
    initCode,
    callData,
    accountGasLimits: ethers.encodeBytes32String("9000000"),
    preVerificationGas: 20_000,
    maxFeePerGas: ethers.parseUnits("10", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("5", "gwei"),
    paymasterAndData: "0x",
    signature: "0x",
  };

  await EntryPointContract.depositTo(sender, { value: ethers.parseEther("1") });
  // second args is the beneficiary address => should be the bundler address
  await EntryPointContract.handleOps([PackedUserOperation], address0);

  console.log(await AccountAbstractionFactory.attach(sender).count());
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
