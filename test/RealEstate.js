const { ethers } = require('hardhat')
const { expect } =  require('chai')


describe('RealEstate contract', () => {
	let realEstate, tx, result 
	let nftURI = 'https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS'
	const tokenID = 1

	beforeEach(async() => {

		[caller] = await ethers.getSigners()

		//Fetch Real Estate contract..
		const RealEstate = await ethers.getContractFactory('RealEstate')
		realEstate = await RealEstate.deploy()

	})

	describe('Deployment', () => {

		it('has a name', async () => {
			expect(await realEstate.name()).to.equal('Real Estate')
		})

		it('has a symbol', async () => {
			expect(await realEstate.symbol()).to.equal('REAL')
		})
	})

	describe('Minting process', () => {

		beforeEach(async() => {

			//Caller mints the NFT..
			tx = await realEstate.connect(caller).mint(nftURI)
			result = await tx.wait()
		})


		it('returns the new NFT id', async () => {
			expect(await realEstate.tokenID()).to.equal(1)
		})
	})
})