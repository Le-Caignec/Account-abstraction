import { ethers } from "hardhat";
import { deploy } from "../deploy/1_deploy_entrypoint_AAF";
import { deployProtectedDataSharing } from "../deploy/2_deploy_protected_data_sharing";
import { DefaultsForUserOp, signUserOp } from "./utils/UserOp";
import { UserOperation } from "./utils/types";

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
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const [bundler, AA_Owner] = await ethers.getSigners();

  // 1_create_AA
  const initCode = ethers.concat([
    AccountAbstractionFactoryAddress,
    FactoryAccountAbstractionContract.interface.encodeFunctionData(
      "createAccount",
      [AA_Owner.address, ethers.id("salt")]
    ),
  ]);

  // 2_create_a_collection
  const innerCallData_2 =
    ProtectedDataSharingFactory.interface.encodeFunctionData(
      "createCollection"
    );
  // // 3_create_a_protectedData
  // const innerCallData_3 =
  //   ProtectedDataSharingFactory.interface.encodeFunctionData("count", []);
  // // 4_make_an_approval
  // const innerCallData_4 =
  //   ProtectedDataSharingFactory.interface.encodeFunctionData("count", []);
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
    [[ProtectedDataSharingAddress], [0], [innerCallData_2]]
  );

  // use the create2 to
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

  const nonce = await EntryPointContract.getNonce(sender, 0);

  let userOp: UserOperation = {
    ...DefaultsForUserOp,
    sender,
    nonce,
    initCode,
    callData,
    callGasLimit: 3_000_00,
    verificationGasLimit: 3_100_00,
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
    await ProtectedDataSharingFactory.attach(
      ProtectedDataSharingAddress
    )._balances(sender)
  );
  console.log("Success 🏎️");
}

runBatchOfTransaction().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
