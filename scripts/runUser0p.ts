import { ethers } from "hardhat";
import { keccak256 } from "ethers";
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
  const nonce = await EntryPointContract.getNonce(sender, 0);
  let PackedUserOperation = {
    sender,
    nonce,
    initCode,
    callData,
    accountGasLimits:
      ethers.toBeHex(9000_000, 16) + ethers.toBeHex(900_000, 16).slice(2),
    preVerificationGas: 50_000,
    maxFeePerGas: ethers.parseUnits("1000", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("1000", "gwei"),
    paymasterAndData: "0x",
    signature: "",
  };

  // Serialize the entire PackedUserOperation struct
  const packedData = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "address",
      "uint256",
      "bytes32",
      "bytes32",
      "bytes32",
      "uint256",
      "uint256",
      "uint256",
      "bytes32",
    ],
    [
      PackedUserOperation.sender,
      PackedUserOperation.nonce,
      keccak256(PackedUserOperation.initCode),
      keccak256(PackedUserOperation.callData),
      PackedUserOperation.accountGasLimits,
      PackedUserOperation.preVerificationGas,
      PackedUserOperation.maxFeePerGas,
      PackedUserOperation.maxPriorityFeePerGas,
      keccak256(PackedUserOperation.paymasterAndData),
    ]
  );
  console.log("PACKED_USER_OP_HASH", ethers.keccak256(packedData));
  // The request ID is a hash over the content of the userOp (except the signature), the entrypoint and the chainId.
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const enc = ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "address", "uint256"],
    [ethers.keccak256(packedData), EntryPointAddress, chainId]
  );
  const userOpHash = ethers.keccak256(enc);
  PackedUserOperation.signature = await bundler.signMessage(
    ethers.getBytes(userOpHash)
  );
  console.log(
    await EntryPointContract.verifyUserOpHash(
      PackedUserOperation,
      ethers.keccak256(packedData),
      userOpHash
    )
  );

  await EntryPointContract.depositTo(sender, {
    value: ethers.parseEther("200"),
  });
  // second args is the beneficiary address => should be the bundler address
  await EntryPointContract.handleOps([PackedUserOperation], address0);
  console.log(
    "COUNT 🚀",
    await AccountAbstractionFactory.attach(sender).count()
  );
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
