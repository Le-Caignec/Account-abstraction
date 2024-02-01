import { ethers } from "hardhat";
import { BigNumberish, toBeHex } from "ethers";

export const AddressZero = ethers.ZeroAddress;
export const HashZero = ethers.ZeroHash;

export function packAccountGasLimits(
  validationGasLimit: BigNumberish,
  callGasLimit: BigNumberish
): string {
  return ethers.hexConcat([
    toBeHex(validationGasLimit, 16),
    toBeHex(callGasLimit, 16),
  ]);
}

export function packPaymasterData(
  paymaster: string,
  paymasterVerificationGasLimit: BytesLike | Hexable | number | bigint,
  postOpGasLimit: BytesLike | Hexable | number | bigint,
  paymasterData: string
): string {
  return ethers.hexConcat([
    paymaster,
    toBeHex(paymasterVerificationGasLimit, 16),
    toBeHex(postOpGasLimit, 16),
    paymasterData,
  ]);
}
