import { AbiCoder, keccak256 } from "ethers";
import {
  AddressZero,
  packAccountGasLimits,
  packPaymasterData,
} from "./utils.js";
import pkg from "hardhat";
const { ethers } = pkg;

export async function signUserOp(op, signer, entryPoint, chainId) {
  const message = getUserOpHash(op, entryPoint, chainId);
  const signedUserOp = await signer.signMessage(ethers.getBytes(message));
  const packedUserOp = packUserOp(op);
  return {
    ...packedUserOp,
    signature: signedUserOp,
  };
}

export function getUserOpHash(op, entryPoint, chainId) {
  const userOpHash = keccak256(encodeUserOp(op));
  const enc = AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "address", "uint256"],
    [userOpHash, entryPoint, chainId]
  );
  return keccak256(enc);
}

export function packUserOp(userOp) {
  const accountGasLimits = packAccountGasLimits(
    userOp.verificationGasLimit,
    userOp.callGasLimit
  );
  let paymasterAndData = "0x";
  if (userOp.paymaster.length >= 20 && userOp.paymaster !== AddressZero) {
    paymasterAndData = packPaymasterData(
      userOp.paymaster,
      userOp.paymasterVerificationGasLimit,
      userOp.paymasterPostOpGasLimit,
      userOp.paymasterData
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

export function encodeUserOp(userOp, forSignature = true) {
  const packedUserOp = packUserOp(userOp);
  if (forSignature) {
    return AbiCoder.defaultAbiCoder().encode(
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
    return AbiCoder.defaultAbiCoder().encode(
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

export const DefaultsForUserOp = {
  sender: AddressZero,
  nonce: 0,
  initCode: "0x",
  callData: "0x",
  callGasLimit: 0,
  verificationGasLimit: 1_500_00, // default verification gas. will add create2 cost (3200+200*length) if initCode exists
  preVerificationGas: 21_000, // should also cover calldata cost.
  maxFeePerGas: 0,
  maxPriorityFeePerGas: 1e9,
  paymaster: AddressZero,
  paymasterData: "0x",
  paymasterVerificationGasLimit: 3e5,
  paymasterPostOpGasLimit: 0,
  signature: "0x",
};

export function encodeUserOpsPerAggregator(userOp, forSignature = true) {
  const userOpHash = encodeUserOp(userOp[0]);
}
