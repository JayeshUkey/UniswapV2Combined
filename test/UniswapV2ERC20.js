//import chai, { expect } from 'chai';
const { expect } = require('chai');
const { ethers } = require('hardhat', 'bignumber', 'Contract');

const TOTAL_SUPPLY = 10000 ** 18; //expandTo18Decimals(10000)
const TEST_AMOUNT = 10 ** 18; //expandTo18Decimals(10);

describe('UniswapV2ERC20', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'get this goin ',
    gasLimit: 9999999,
  });
  const [wallet, other] = provider.getWallets();

  let token = Contract;
  beforeEach(async () => {
    token = await deployContract(wallet, ERC20, [TOTAL_SUPPLY]);
  });

  it('name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH', async () => {
    const name = await token.name();
    expect(name).to.eq('Uniswap V2');
    expect(await token.symbol()).to.eq('UNI-V2');
    expect(await token.decimals()).to.eq(18);
    expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY);
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY);

    expect(await token.PERMIT_TYPEHASH()).to.eq(
      keccak256(
        toUtf8Bytes(
          'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
        )
      )
    );
  });

  it('approve', async () => {
    await expect(token.approve(other.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      TEST_AMOUNT
    );
  });

  it('transfer', async () => {
    await expect(token.transfer(other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });

  it('transfer = fail', async () => {
    await expect(token.transfer(other.address, TOTAL_SUPPLY.add(1))).to.be
      .reverted; // ds-math-sub-underflow
    await expect(token.connect(other).transfer(wallet.address, 1)).to.be
      .reverted; // ds-math-sub-underflow
  });

  it('transferFrom', async () => {
    await token.approve(other.address, TEST_AMOUNT);
    await expect(
      token
        .connect(other)
        .transferFrom(wallet.address, other.address, TEST_AMOUNT)
    )
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(0);
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });

  it('transferFrom = max', async () => {
    await token.approve(other.address, MaxUint256);
    await expect(
      token
        .connect(other)
        .transferFrom(wallet.address, other.address, TEST_AMOUNT)
    )
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      MaxUint256
    );
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });
});
