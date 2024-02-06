import { ethers } from "hardhat";
import { deploy } from "../deploy/1_deploy_entrypoint_AAF";
import { DefaultsForUserOp, signUserOp } from "./utils/UserOp";
import { UserOperation } from "./utils/types";

export async function run() {
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
  const [bundler, AA_Owner_1, AA_Owner_2] = await ethers.getSigners();

  /***************************************************************************
   *                        UserOp_1                                         *
   ***************************************************************************/
  const initCode_1 = ethers.concat([
    AccountAbstractionFactoryAddress,
    FactoryAccountAbstractionContract.interface.encodeFunctionData(
      "createAccount",
      [AA_Owner_1.address, ethers.id("salt")]
    ),
  ]);

  const innerCallData_1 = TestCounterFactory.interface.encodeFunctionData(
    "count",
    []
  );

  const callData_1 = AccountAbstraction.interface.encodeFunctionData(
    "execute",
    [TestCounterAddress, 0, innerCallData_1]
  );

  // use the create2 to
  let sender_1;
  try {
    await EntryPointContract.getSenderAddress(initCode_1);
  } catch (error: any) {
    // catch the revert custom error : error SenderAddressResult(address sender);
    sender_1 = EntryPointContract.interface.decodeErrorResult(
      "SenderAddressResult",
      error.data.data
    )[0];
    console.log("==AA Address_1==", sender_1);
  }

  const nonce_1 = await EntryPointContract.getNonce(sender_1, 0);

  let userOp_1: UserOperation = {
    ...DefaultsForUserOp,
    sender: sender_1,
    nonce: nonce_1,
    initCode: initCode_1,
    callData: callData_1,
    callGasLimit: 300_00,
    verificationGasLimit: 2_100_00,
  };

  const packedSignedUserOperation_1 = await signUserOp(
    userOp_1,
    AA_Owner_1,
    EntryPointAddress,
    Number(chainId)
  );
  console.log("packedSignedUserOperation_1", packedSignedUserOperation_1);
  await EntryPointContract.connect(AA_Owner_1).depositTo(sender_1, {
    value: ethers.parseEther("0.1"),
  });

  /***************************************************************************
   *                        UserOp_2                                         *
   ***************************************************************************/
  const initCode_2 = ethers.concat([
    AccountAbstractionFactoryAddress,
    FactoryAccountAbstractionContract.interface.encodeFunctionData(
      "createAccount",
      [AA_Owner_2.address, ethers.id("salt")]
    ),
  ]);

  const innerCallData_2 = TestCounterFactory.interface.encodeFunctionData(
    "count",
    []
  );

  const callData_2 = AccountAbstraction.interface.encodeFunctionData(
    "execute",
    [TestCounterAddress, 0, innerCallData_2]
  );

  // use the create2 to
  let sender_2;
  try {
    await EntryPointContract.getSenderAddress(initCode_2);
  } catch (error: any) {
    // catch the revert custom error : error SenderAddressResult(address sender);
    sender_2 = EntryPointContract.interface.decodeErrorResult(
      "SenderAddressResult",
      error.data.data
    )[0];
    console.log("==AA Address_2==", sender_2);
  }

  const nonce_2 = await EntryPointContract.getNonce(sender_2, 0);

  let userOp_2: UserOperation = {
    ...DefaultsForUserOp,
    sender: sender_2,
    nonce: nonce_2,
    initCode: initCode_2,
    callData: callData_2,
    callGasLimit: 300_00,
    verificationGasLimit: 2_100_00,
  };

  const packedSignedUserOperation_2 = await signUserOp(
    userOp_2,
    AA_Owner_2,
    EntryPointAddress,
    Number(chainId)
  );
  console.log("packedSignedUserOperation_2", packedSignedUserOperation_2);
  await EntryPointContract.connect(AA_Owner_2).depositTo(sender_2, {
    value: ethers.parseEther("0.1"),
  });

  /***************************************************************************
   *                        AggUserOp                                        *
   ***************************************************************************/
  // second args is the beneficiary address => should be the bundler address that will take a cut
  await EntryPointContract.handleAggregatedOps(
    [packedSignedUserOperation],
    bundler.address
  );

  console.log(
    "sender_1",
    await TestCounterFactory.attach(TestCounterAddress).counters(sender_1)
  );
  console.log(
    "sender_2",
    await TestCounterFactory.attach(TestCounterAddress).counters(sender_2)
  );
  console.log("Success 🏎️");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
