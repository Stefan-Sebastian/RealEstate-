const { ethers } =  require('hardhat')
const { expect } = require('chai')

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow contract', () => {
	let realEstate, escrow
	let tx, result
	const nftURI = 'https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS'
	let nftID = 1


	beforeEach(async () => {

		[seller, buyer, inspector, lender, unauthorizedAddr] = await ethers.getSigners()

		//Fetch RealEstate contract..
		const RealEstate = await ethers.getContractFactory('RealEstate')
		//Deploy Real Estate contract..
		realEstate = await RealEstate.deploy()

		//Fetch Escrow contract..
		const Escrow = await ethers.getContractFactory('Escrow')
		//deploy Escrow contract..
		escrow = await Escrow.deploy(realEstate.address, seller.address, inspector.address, lender.address)
	})

	//Test if RealEstate Contract works..
	describe('Minting Process', () => {

		it('mints the property', async () => {
			tx = await realEstate.connect(seller).mint(nftURI)
			result = await tx.wait()

			expect(await realEstate.tokenID()).to.equal(1)
		})
	})

	describe('Deployment', () => {

		it('tracks the nftAddress', async () => {
			expect(await escrow.nftAddr()).to.equal(realEstate.address)
		})

		it('tracks the seller', async () => {
			expect(await escrow.seller()).to.equal(seller.address)
		})

		it('tracks the inspector', async () => {
			expect(await escrow.inspector()).to.equal(inspector.address)
		})

		it('tracks the lender', async () => {
			expect(await escrow.lender()).to.equal(lender.address)
		})
	})

	describe('Listing', () => {
		
		beforeEach(async () => {

			//Mint the property first..
			tx = await realEstate.connect(seller).mint(nftURI)
			result = await tx.wait()

			//Approve escrow to move NFT..
			tx = await realEstate.connect(seller).approve(escrow.address, 1)
			result = await tx.wait()

		})

		describe('Success', () => {
			beforeEach(async () => {
			//List property..
			tx = await escrow.connect(seller).list(nftID, tokens(5), tokens(10), buyer.address)
			result = await tx.wait()
		})

			it('updates listing',async () => {
				expect(await escrow.isListed(nftID)).to.equal(true)
			})

			it('updates the escrow amount', async () => {
				expect(await escrow.escrowPrice(nftID)).to.equal(tokens(5))
			}) 

			it('updates the purchase price', async () => {
				expect(await escrow.purchasePrice(nftID)).to.equal(tokens(10))
			})

			it('updates the buyer', async () => {
				expect(await escrow.buyers(nftID)).to.equal(buyer.address)
			})
	})

		describe('Failure', () => {

			//Unauthorized account tries to list the property..
			it('should fail if seller does not list the property', async () => {
				await expect(escrow.connect(unauthorizedAddr).list(nftID, tokens(5), tokens(10), buyer.address)).to.be.rejected
			})

		})

	})

	describe('Deposit', () => {

		beforeEach(async () => {
			//Mint the property first..
			tx = await realEstate.connect(seller).mint(nftURI)
			result = await tx.wait()

			//Approve escrow to move NFT..
			tx = await realEstate.connect(seller).approve(escrow.address, nftID)
			result = await tx.wait()

			//List property..
			tx = await escrow.connect(seller).list(nftID, tokens(5), tokens(10), buyer.address)
			result = await tx.wait()

		})

		describe('Success', () => {

			beforeEach(async () => {
				//Buyer deposits down payment..
				tx = await escrow.connect(buyer).depositEarnest(nftID, { value: tokens(5) })
				result = await tx.wait()
			})

			it('updates contract balance', async () => {
				const balance = await escrow.getBalance()
				expect(balance).to.equal(tokens(5))
			})

		})

		describe('Failure', () => {

			//Fail if insufficient funds were deposited..
			it('should fail if not enough funds were deposited', async () => {
				const invalidAmount = tokens(0)
				await expect(escrow.connect(buyer).depositEarnest(nftID, { value: invalidAmount })).to.be.reverted
			})
			
			//Unauthorized account tries to deposit down payment..
			it('should fail if unauthorized account calls the function', async () => {
				await expect(escrow.connect(unauthorizedAddr).depositEarnest(nftID, { value: tokens(5)} )).to.be.reverted
			})
		})

	})

	describe('Inspection', () => {

		beforeEach(async () => {
			//Mint the property first..
			tx = await realEstate.connect(seller).mint(nftURI)
			result = await tx.wait()

			//Approve escrow to move NFT..
			tx = await realEstate.connect(seller).approve(escrow.address, nftID)
			result = await tx.wait()

			//List property..
			tx = await escrow.connect(seller).list(nftID, tokens(5), tokens(10), buyer.address)
			result = await tx.wait()

			//Buyer deposits down payment..
			tx = await escrow.connect(buyer).depositEarnest(nftID, { value: tokens(5) })
			result = await tx.wait()

		})

		describe('Success', () => {
			beforeEach(async () => {
				//Inspector makes the inspection..
				tx = await escrow.connect(inspector).inspection(nftID, true)
				result = await tx.wait()
			})

			it('updates the inspection status', async () => {
				expect(await escrow.inspectionPassed(nftID)).to.equal(true)
			})

		})

		describe('Failure', () => {
			
			//Fail if unauthorized account calls the function..
			it('should fail if unauthorized address calls the function', async () => {
				await expect(escrow.connect(unauthorizedAddr).inspection(nftID, true)).to.be.reverted
			})

		})
	})

	describe('Sale approvals', () => {

		beforeEach(async () => {
			//Mint the property first..
			tx = await realEstate.connect(seller).mint(nftURI)
			result = await tx.wait()

			//Approve escrow to move NFT..
			tx = await realEstate.connect(seller).approve(escrow.address, nftID)
			result = await tx.wait()

			//List property..
			tx = await escrow.connect(seller).list(nftID, tokens(5), tokens(10), buyer.address)
			result = await tx.wait()

			//Buyer deposits down payment..
			tx = await escrow.connect(buyer).depositEarnest(nftID, { value: tokens(5) })
			result = await tx.wait()

			//Inspector makes the inspection..
			tx = await escrow.connect(inspector).inspection(nftID, true)
			result = await tx.wait()

		})

		describe('Success', () => {
			beforeEach(async () => {
				//Buyer, Seller, Lender approve the sale..
				tx = await escrow.connect(buyer).approve(nftID, true)
				result = await tx.wait()

				tx = await escrow.connect(seller).approve(nftID, true)
				result = await tx.wait()

				tx = await escrow.connect(lender).approve(nftID, true)
				result = await tx.wait()
			})

			it('updates buyer approval', async () => {
				expect(await escrow.approvals(nftID, buyer.address)).to.equal(true);
			})

			it('updates seller approval', async () => {
				expect(await escrow.approvals(nftID, seller.address)).to.equal(true);
			})

			it('updates lender approval', async () => {
				expect(await escrow.approvals(nftID, lender.address)).to.equal(true);
			})
		})

		describe('Failure', () => {

			//Fail if inspection did not pass..
			it('should fail if inspection did not pass', async () => {
				tx = await escrow.connect(inspector).inspection(nftID, false)
				result = await tx.wait()

				await expect(escrow.connect(buyer).approve(nftID, true)).to.be.reverted
				await expect(escrow.connect(seller).approve(nftID, true)).to.be.reverted
				await expect(escrow.connect(lender).approve(nftID, true)).to.be.reverted
			})
			
		})
	})

	describe('Sale actions', () => {


			beforeEach(async () => {
			//Mint the property first..
			tx = await realEstate.connect(seller).mint(nftURI)
			result = await tx.wait()

			//Approve escrow to move NFT..
			tx = await realEstate.connect(seller).approve(escrow.address, nftID)
			result = await tx.wait()

			//List property..
			tx = await escrow.connect(seller).list(nftID, tokens(5), tokens(10), buyer.address)
			result = await tx.wait()

			//Buyer deposits down payment..
			tx = await escrow.connect(buyer).depositEarnest(nftID, { value: tokens(5) })
			result = await tx.wait()

			//Inspector makes the inspection..
			tx = await escrow.connect(inspector).inspection(nftID, true)
			result = await tx.wait()

		})

		describe('Sale', () => {


		describe('Success', () => {

			beforeEach(async() => {

			//Buyers approves the sale..
			tx = await escrow.connect(buyer).approve(nftID, true)
			result = await tx.wait()

			//Seller approves the sale..
			tx = await escrow.connect(seller).approve(nftID, true)
			result = await tx.wait()

			//Lender approves the sale..
			tx = await escrow.connect(lender).approve(nftID, true)
			result = await tx.wait()

			//Lender sends ETH to escrow contract and lock there untill certain conditions are met..
			await lender.sendTransaction({ to: escrow.address, value: tokens(5) })


			//Seller finalize sale..
			tx = await escrow.connect(seller).finalizeSale(nftID)
			result = await tx.wait()
			})

			it('updates the property ownership', async () => {
				expect(await realEstate.ownerOf(nftID)).to.equal(buyer.address)
			})

			it('updates the contract balance', async () => {
				expect(await escrow.getBalance()).to.equal(0)
			})

		})

		describe('Failure', () => {
			
			it('should fail if inspection did not pass', async () => {
				tx = await escrow.connect(inspector).inspection(nftID, false)
				result = await tx.wait()

				await expect(escrow.connect(seller).finalizeSale(nftID)).to.be.reverted
			})

			it('should fail if buyer did not approve the sale', async () => {
				tx = await escrow.connect(buyer).approve(nftID, false)
				result = await tx.wait()

				await expect(escrow.connect(seller).finalizeSale(nftID)).to.be.reverted
			})

			it('should fail if seller did not approve the sale', async () => {
				tx = await escrow.connect(seller).approve(nftID, false)
				result = await tx.wait()

				await expect(escrow.connect(seller).finalizeSale(nftID)).to.be.reverted

		})

			it('should fail if lender did not approve the sale', async () => {
				tx = await escrow.connect(lender).approve(nftID, false)
				result = await tx.wait()

				await expect(escrow.connect(seller).finalizeSale(nftID)).to.be.reverted
			})
		
		})

		describe('Canceling sale', () => {

			beforeEach(async () => {
				//Cancel sale..
				tx = await escrow.connect(seller).cancelSale(nftID)
				result = await tx.wait()
			})

			it('updates canceled sales list', async () => {
				expect(await escrow.isCanceled(nftID)).to.equal(true)
			})
		})
 
	})


})

	describe('Contract balance', () => {

		it('shows the contract balance', async () => {
			expect(await escrow.getBalance()).to.equal(0)
		})
	})

	

})









