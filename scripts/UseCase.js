import pkg from "hardhat";
import { deploy } from "../deploy/1_deploy_entrypoint_AAF.js";
import { deployProtectedDataSharing } from "../deploy/2_deploy_protected_data_sharing.js";
import { DefaultsForUserOp, signUserOp } from "./utils/UserOp.js";
import { POCO_PROTECTED_DATA_REGISTRY_ADDRESS } from "../config/config.js";
import { createDatasetFor } from "./singleFunction/dataset.js";
import { createAppFor } from "./singleFunction/app.js";
const { ethers } = pkg;

export async function runBatchOfTransaction() {
  const { EntryPointAddress, AccountAbstractionFactoryAddress } =
    await deploy();
  const { ProtectedDataSharingAddress } = await deployProtectedDataSharing();

  const EntryPointContract = await ethers.getContractAt(
    "EntryPoint",
    EntryPointAddress
  );
  const FactoryAccountAbstractionContract = await ethers.getContractAt(
    "SimpleAccountFactory",
    AccountAbstractionFactoryAddress
  );
  const AccountAbstraction = await ethers.getContractFactory("SimpleAccount");
  const ProtectedDataSharingFactory = await ethers.getContractFactory(
    "ProtectedDataSharing"
  );
  const ProtectedDataRegistry = await ethers.getContractAt(
    "IRegistry",
    POCO_PROTECTED_DATA_REGISTRY_ADDRESS
  );

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const rpcURL = hre.network.config.url;

  const [bundler, AA_Owner] = await ethers.getSigners();
  // 1_create_AA
  const initCode = ethers.concat([
    AccountAbstractionFactoryAddress,
    FactoryAccountAbstractionContract.interface.encodeFunctionData(
      "createAccount",
      [AA_Owner.address, ethers.id("salt")]
    ),
  ]);

  // use the create2 to determine the AA address
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

  // 2_create_a_collection
  const innerCallData_2 =
    ProtectedDataSharingFactory.interface.encodeFunctionData(
      "createCollection"
    );
  // 3_create_a_protectedData
  const protectedDataAddress = await createDatasetFor(sender, rpcURL);
  const protectedDataTokenId = ethers
    .getBigInt(protectedDataAddress.toLowerCase())
    .toString();
  // 4_make_an_approval
  const innerCallData_4 = ProtectedDataRegistry.interface.encodeFunctionData(
    "approve",
    [ProtectedDataSharingAddress, protectedDataTokenId]
  );
  console.log(
    await ProtectedDataRegistry.ownerOf(protectedDataTokenId),
    sender
  );

  // const appAddress = await createAppFor(sender, rpcURL);
  // // 5_create_an_app
  // const innerCallData_5 =
  //   ProtectedDataSharingFactory.interface.encodeFunctionData("count", []);
  // // 6_transfer_App_ownership_to_the_protectedDataSharing_contract
  // const innerCallData_6 =
  //   ProtectedDataSharingFactory.interface.encodeFunctionData("count", []);
  // // 7_add_protectedData_to_collection
  // const innerCallData_7 =
  //   ProtectedDataSharingFactory.interface.encodeFunctionData("count", []);
  // // 8_set_subscription_params
  // const innerCallData_8 =
  //   ProtectedDataSharingFactory.interface.encodeFunctionData("count", []);
  // // 9_set_subscription_params
  // const innerCallData_9 =
  //   ProtectedDataSharingFactory.interface.encodeFunctionData("count", []);

  //batch the inner CallData
  const callData = AccountAbstraction.interface.encodeFunctionData(
    "executeBatch",
    [
      [ProtectedDataSharingAddress, POCO_PROTECTED_DATA_REGISTRY_ADDRESS],
      [0, 0],
      [innerCallData_2, innerCallData_4],
    ]
  );

  const nonce = await EntryPointContract.getNonce(sender, 0);

  let userOp = {
    ...DefaultsForUserOp,
    sender,
    nonce,
    initCode,
    callData,
    callGasLimit: 6_000_00,
    verificationGasLimit: 6_000_00,
    preVerificationGas: 6_000_00,
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

  // console.log(
  //   await ProtectedDataSharingFactory.attach(
  //     ProtectedDataSharingAddress
  //   ).ownerOf(0)
  // );
  console.log("Success 🏎️");
}

runBatchOfTransaction().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
