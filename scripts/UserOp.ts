import { arrayify, defaultAbiCoder, keccak256 } from "ethers/lib/utils";
import { Wallet } from "ethers";
import {
  AddressZero,
  packAccountGasLimits,
  packPaymasterData,
} from "./utils.js";
import {
  ecsign,
  toRpcSig,
  keccak256 as keccak256_buffer,
} from "ethereumjs-util";
import { PackedUserOperation, UserOperation } from "./UserOperation";

export function packUserOp(userOp: UserOperation): PackedUserOperation {
  const accountGasLimits = packAccountGasLimits(
    userOp.verificationGasLimit,
    userOp.callGasLimit
  );
  let paymasterAndData = "0x";
  if (userOp.paymaster.length >= 20 && userOp.paymaster !== AddressZero) {
    paymasterAndData = packPaymasterData(
      userOp.paymaster as string,
      userOp.paymasterVerificationGasLimit,
      userOp.paymasterPostOpGasLimit,
      userOp.paymasterData as string
    );
  }
  return {
    sender: userOp.sender,
    nonce: userOp.nonce,
    callData: userOp.callData,
    accountGasLimits,
    initCode: userOp.initCode,
    preVerificationGas: userOp.preVerificationGas,
    maxFeePerGas: userOp.maxFeePerGas,
    maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
    paymasterAndData,
    signature: userOp.signature,
  };
}
export function encodeUserOp(
  userOp: UserOperation,
  forSignature = true
): string {
  const packedUserOp = packUserOp(userOp);
  if (forSignature) {
    return defaultAbiCoder.encode(
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
        packedUserOp.sender,
        packedUserOp.nonce,
        keccak256(packedUserOp.initCode),
        keccak256(packedUserOp.callData),
        packedUserOp.accountGasLimits,
        packedUserOp.preVerificationGas,
        packedUserOp.maxFeePerGas,
        packedUserOp.maxPriorityFeePerGas,
        keccak256(packedUserOp.paymasterAndData),
      ]
    );
  } else {
    // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
    return defaultAbiCoder.encode(
      [
        "address",
        "uint256",
        "bytes",
        "bytes",
        "bytes32",
        "uint256",
        "uint256",
        "uint256",
        "bytes",
        "bytes",
      ],
      [
        packedUserOp.sender,
        packedUserOp.nonce,
        packedUserOp.initCode,
        packedUserOp.callData,
        packedUserOp.accountGasLimits,
        packedUserOp.preVerificationGas,
        packedUserOp.maxFeePerGas,
        packedUserOp.maxPriorityFeePerGas,
        packedUserOp.paymasterAndData,
        packedUserOp.signature,
      ]
    );
  }
}

export function getUserOpHash(
  op: UserOperation,
  entryPoint: string,
  chainId: number
): string {
  const userOpHash = keccak256(encodeUserOp(op, true));
  const enc = defaultAbiCoder.encode(
    ["bytes32", "address", "uint256"],
    [userOpHash, entryPoint, chainId]
  );
  return keccak256(enc);
}

export const DefaultsForUserOp: UserOperation = {
  sender: AddressZero,
  nonce: 0,
  initCode: "0x",
  callData: "0x",
  callGasLimit: 0,
  verificationGasLimit: 150000, // default verification gas. will add create2 cost (3200+200*length) if initCode exists
  preVerificationGas: 21000, // should also cover calldata cost.
  maxFeePerGas: 0,
  maxPriorityFeePerGas: 1e9,
  paymaster: AddressZero,
  paymasterData: "0x",
  paymasterVerificationGasLimit: 3e5,
  paymasterPostOpGasLimit: 0,
  signature: "0x",
};

export function signUserOp(
  op: UserOperation,
  signer: Wallet,
  entryPoint: string,
  chainId: number
): UserOperation {
  const message = getUserOpHash(op, entryPoint, chainId);
  const msg1 = Buffer.concat([
    Buffer.from("\x19Ethereum Signed Message:\n32", "ascii"),
    Buffer.from(arrayify(message)),
  ]);

  const sig = ecsign(
    keccak256_buffer(msg1),
    Buffer.from(arrayify(signer.privateKey))
  );
  // that's equivalent of:  await signer.signMessage(message);
  // (but without "async"
  const signedMessage1 = toRpcSig(sig.v, sig.r, sig.s);
  return {
    ...op,
    signature: signedMessage1,
  };
}
