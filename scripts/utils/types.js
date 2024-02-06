// define the same export types as used by export typechain/ethers
import { BigNumberish, BytesLike } from "ethers";

export type address = string;
export type uint256 = BigNumberish;
export type uint = BigNumberish;
export type uint48 = BigNumberish;
export type uint128 = BigNumberish;
export type bytes = BytesLike;
export type bytes32 = BytesLike;

export type UserOperation = {
  sender: address;
  nonce: uint256;
  initCode: bytes;
  callData: bytes;
  callGasLimit: uint128;
  verificationGasLimit: uint128; // concat in accountGasLimits
  preVerificationGas: uint256; // concat in accountGasLimits
  maxFeePerGas: uint256;
  maxPriorityFeePerGas: uint256;
  paymaster: address; // concat in paymasterAndData
  paymasterVerificationGasLimit: uint128; // concat in paymasterAndData
  paymasterPostOpGasLimit: uint128; // concat in paymasterAndData
  paymasterData: bytes; // concat in paymasterAndData
  signature: bytes;
};

export type PackedUserOperation = {
  sender: address;
  nonce: uint256;
  initCode: bytes;
  callData: bytes;
  accountGasLimits: bytes32;
  preVerificationGas: uint256;
  maxFeePerGas: uint256;
  maxPriorityFeePerGas: uint256;
  paymasterAndData: bytes;
  signature: bytes;
};
