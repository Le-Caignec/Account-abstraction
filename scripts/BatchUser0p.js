import pkg from "hardhat";
import { deploy } from "../deploy/1_deploy_entrypoint_AAF.js";
import { DefaultsForUserOp, signUserOp } from "./utils/UserOp.js";
const { ethers } = pkg;

export async function runBatchOfTransaction() {
  const {
    EntryPointAddress,
    AccountAbstractionFactoryAddress,
    TestCounterAddress,
  } = await deploy();

  const EntryPointContract = await ethers.getContractAt(
    "EntryPoint",
    EntryPointAddress
  );
  const FactoryAccountAbstractionContract = await ethers.getContractAt(
    "SimpleAccountFactory",
    AccountAbstractionFactoryAddress
  );
  const AccountAbstraction = await ethers.getContractFactory("SimpleAccount");
  const TestCounterFactory = await ethers.getContractFactory("TestCounter");

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const [bundler, AA_Owner] = await ethers.getSigners();

  const initCode = ethers.concat([
    AccountAbstractionFactoryAddress,
    FactoryAccountAbstractionContract.interface.encodeFunctionData(
      "createAccount",
      [AA_Owner.address, ethers.id("salt")]
    ),
  ]);

  const innerCallData_1 =
    TestCounterFactory.interface.encodeFunctionData("count");
  const innerCallData_2 =
    TestCounterFactory.interface.encodeFunctionData("count");

  const callData = AccountAbstraction.interface.encodeFunctionData(
    "executeBatch",
    [
      [TestCounterAddress, TestCounterAddress],
      [0, 0],
      [innerCallData_1, innerCallData_2],
    ]
  );

  // use the create2 to
  let sender;
  try {
    await EntryPointContract.getSenderAddress(initCode);
  } catch (error) {
    // catch the revert custom error : error SenderAddressResult(address sender);
    sender = EntryPointContract.interface.decodeErrorResult(
      "SenderAddressResult",
      error.data.data
    )[0];
    console.log("==AA Address==", sender);
  }

  const nonce = await EntryPointContract.getNonce(sender, 0);

  let userOp = {
    ...DefaultsForUserOp,
    sender,
    nonce,
    initCode,
    callData,
    callGasLimit: 500_00,
    verificationGasLimit: 2_100_00,
  };

  const packedSignedUserOperation = await signUserOp(
    userOp,
    AA_Owner,
    EntryPointAddress,
    Number(chainId)
  );
  console.log("packedSignedUserOperation", packedSignedUserOperation);
  await EntryPointContract.connect(AA_Owner).depositTo(sender, {
    value: ethers.parseEther("0.1"),
  });

  // second args is the beneficiary address => should be the bundler address that will take a cut
  await EntryPointContract.handleOps(
    [packedSignedUserOperation],
    bundler.address
  );

  console.log(
    await TestCounterFactory.attach(TestCounterAddress).counters(sender)
  );
  console.log("Success 🏎️");
}

runBatchOfTransaction().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
