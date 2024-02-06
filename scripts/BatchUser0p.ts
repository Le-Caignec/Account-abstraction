import { ethers } from "hardhat";
import { DefaultsForUserOp, signUserOp } from "./utils/UserOp";
import { UserOperation } from "./utils/types";

const EntryPointAddress = "0x7C035701AB28Df8FfE6c85DbBe024c3b21FC9a08"; //verify
const AccountAbstractionFactoryAddress =
  "0x18b96a76fAf4E3D704A3B6780006A70169df6203"; //verify
const TestCounterAddress = "0xace153c576B7aDf4432E76d5CCe32e9332325626"; //verify

export async function runBatchOfTransaction() {
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

  // use the create2 to determine the AA address
  let sender;
  try {
    await EntryPointContract.getSenderAddress(initCode);
  } catch (error: any) {
    // catch the revert custom error : error SenderAddressResult(address sender);
    sender = EntryPointContract.interface.decodeErrorResult(
      "SenderAddressResult",
      error.data // depend on provider
    )[0];
    console.log("==AA Address==", sender);
  }

  const nonce = await EntryPointContract.getNonce(sender, 0);

  let userOp: UserOperation = {
    ...DefaultsForUserOp,
    sender,
    nonce,
    initCode,
    callData,
    callGasLimit: 1_000_00,
    verificationGasLimit: 2_100_00,
    preVerificationGas: 1_000_000,
  };

  const packedSignedUserOperation = await signUserOp(
    userOp,
    AA_Owner,
    EntryPointAddress,
    Number(chainId)
  );
  console.log("packedSignedUserOperation", packedSignedUserOperation);
  await EntryPointContract.connect(AA_Owner).depositTo(sender, {
    value: ethers.parseEther("0.001"),
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
  console.error(JSON.stringify(error));
  process.exitCode = 1;
});
