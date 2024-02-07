import pkg from "hardhat";
import { DefaultsForUserOp, signUserOp } from "./utils/UserOp.js";
import {
  POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
  POCO_APP_REGISTRY_ADDRESS,
} from "../config/config.js";
import { createDatasetFor } from "./singleFunction/dataset.js";
import { createAppFor } from "./singleFunction/app.js";
const { ethers } = pkg;

const EntryPointAddress = "0x7C035701AB28Df8FfE6c85DbBe024c3b21FC9a08"; //verify
const AccountAbstractionFactoryAddress =
  "0x18b96a76fAf4E3D704A3B6780006A70169df6203"; //verify
const ProtectedDataSharingAddress =
  "0x2918e4f9a88DC48F781b276944c23aDa6d5d8513"; //verify implem 0xc94cb8c99ffc598932ccda92fd2e1e8b54bbc854

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
  const ProtectedDataSharingFactory = await ethers.getContractFactory(
    "ProtectedDataSharingV2"
  );
  const ProtectedDataRegistry = await ethers.getContractAt(
    "IRegistry",
    POCO_PROTECTED_DATA_REGISTRY_ADDRESS
  );
  const AppRegistry = await ethers.getContractAt(
    "IRegistry",
    POCO_APP_REGISTRY_ADDRESS
  );

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const rpcURL = hre.network.config.url;

  const [bundler, AA_Owner] = await ethers.getSigners();
  // 1_create_AA
  const initCode = ethers.concat([
    AccountAbstractionFactoryAddress,
    FactoryAccountAbstractionContract.interface.encodeFunctionData(
      "createAccount",
      [AA_Owner.address, ethers.id(Math.random().toString())]
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
      error.data
    )[0];
    console.log("==AA Address==", sender);
  }
  // create_an_app
  const appAddress = await createAppFor(sender, rpcURL);
  // create_a_protectedData
  const protectedDataAddress = await createDatasetFor(sender, rpcURL);
  const protectedDataTokenId = ethers
    .getBigInt(protectedDataAddress.toLowerCase())
    .toString();

  // 2_create_a_collection
  const innerCallData_2 =
    ProtectedDataSharingFactory.interface.encodeFunctionData(
      "createCollection"
    );
  const collectionTokenId = 1; // check what is the last collectionTokenID

  // 3_make_an_approval
  const innerCallData_3 = ProtectedDataRegistry.interface.encodeFunctionData(
    "approve",
    [ProtectedDataSharingAddress, protectedDataTokenId]
  );

  // 4_add_protectedData_to_collection
  const innerCallData_4 =
    ProtectedDataSharingFactory.interface.encodeFunctionData(
      "addProtectedDataToCollection",
      [collectionTokenId, protectedDataAddress, appAddress]
    );

  // 5_set_subscription_params
  const subscriptionParams = {
    price: ethers.parseEther("0.0003"),
    duration: 1_500,
  };
  const innerCallData_5 =
    ProtectedDataSharingFactory.interface.encodeFunctionData(
      "setSubscriptionParams",
      [collectionTokenId, subscriptionParams]
    );

  // 6_set_protectedData_to_subscription
  const innerCallData_6 =
    ProtectedDataSharingFactory.interface.encodeFunctionData(
      "setProtectedDataToSubscription",
      [collectionTokenId, protectedDataAddress]
    );

  // batch the inner CallData
  const callData = AccountAbstraction.interface.encodeFunctionData(
    "executeBatch",
    [
      [
        ProtectedDataSharingAddress,
        POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
        ProtectedDataSharingAddress,
        ProtectedDataSharingAddress,
        ProtectedDataSharingAddress,
      ],
      [0, 0, 0, 0, 0],
      [
        innerCallData_2,
        innerCallData_3,
        innerCallData_4,
        innerCallData_5,
        innerCallData_6,
      ],
    ]
  );

  const nonce = await EntryPointContract.getNonce(sender, 0);

  let userOp = {
    ...DefaultsForUserOp,
    sender,
    nonce,
    initCode,
    callData,
    callGasLimit: 8_000_00,
    verificationGasLimit: 8_000_00,
    preVerificationGas: 8_000_00,
  };

  const packedSignedUserOperation = await signUserOp(
    userOp,
    AA_Owner,
    EntryPointAddress,
    Number(chainId)
  );
  console.log("packedSignedUserOperation", packedSignedUserOperation);
  const depositTx = await EntryPointContract.connect(AA_Owner).depositTo(
    sender,
    {
      value: ethers.parseEther("0.1"),
    }
  );
  await depositTx.wait();

  // second args is the beneficiary address => should be the bundler address that will take a cut
  const handleOpTx = await EntryPointContract.handleOps(
    [packedSignedUserOperation],
    bundler.address
  );
  await handleOpTx.wait();

  console.log("Success 🏎️");
}

runBatchOfTransaction().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
