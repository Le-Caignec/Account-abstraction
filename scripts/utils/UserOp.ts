import { AbiCoder, keccak256 } from "ethers";
import { AddressZero, packAccountGasLimits, packPaymasterData } from "./utils";
import { PackedUserOperation, UserOperation, address } from "./types";
import { ethers } from "hardhat";

export async function signUserOp(
  op: UserOperation,
  signer: any,
  entryPoint: address,
  chainId: number
): Promise<PackedUserOperation> {
  const message = getUserOpHash(op, entryPoint, chainId);
  const signedUserOp = await signer.signMessage(ethers.getBytes(message));
  const packedUserOp = packUserOp(op);
  return {
    ...packedUserOp,
    signature: signedUserOp,
  };
}

export function getUserOpHash(
  op: UserOperation,
  entryPoint: string,
  chainId: number
): string {
  const userOpHash = keccak256(encodeUserOp(op));
  const enc = AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "address", "uint256"],
    [userOpHash, entryPoint, chainId]
  );
  return keccak256(enc);
}

export function packUserOp(userOp: UserOperation): PackedUserOperation {
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

export const DefaultsForUserOp: UserOperation = {
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
