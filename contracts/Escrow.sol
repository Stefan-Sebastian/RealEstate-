//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IERC721{
	function transferFrom
	(
		address from,
		address to,
		uint256 nftId
	)
	external;
}

contract Escrow{

	//Keep track of the followning addresses..
	address public nftAddr;
	address payable public seller;
	address public inspector;
	address public lender;

	mapping(uint256 => bool) public isListed;
	mapping(uint256 => uint256) public escrowPrice;
	mapping(uint256 => uint256) public purchasePrice;
	mapping(uint256 => address) public buyers;
	mapping(uint256 => bool) public inspectionPassed;
	mapping(uint256 => mapping(address => bool)) public approvals;
	mapping(uint256 => bool) public isCanceled;


	constructor
	(
		address _nftAddr, 
		address payable _seller, 
		address _inspector, 
		address _lender
	) 
	{
		//Code goes here..
		nftAddr = _nftAddr;
		seller = _seller;
		inspector = _inspector;
		lender = _lender;

	}

	modifier onlySeller{
		require(msg.sender == seller, 'Only seller can call this method');
		_;
	}

	modifier onlyBuyer(uint256 _nftID){
		require(msg.sender == buyers[_nftID], 'Only buyer can call this method');
		_;
	}

	modifier onlyInspector{
		require(msg.sender == inspector, 'Only inspector can call this method');
		_;
	}

	//Seller mints the property and list it inside escrow contract..
	function list(uint256 _nftID, uint256 escrowAmount, uint256 purchaseAmount, address _buyer) public onlySeller{
		//Transfer nft from RealEstate to Escrow..
		IERC721(nftAddr).transferFrom(msg.sender, address(this), _nftID);

		//Update wheter nft is listed or not..
		isListed[_nftID] = true;
		
		//The price of the down payment..
		escrowPrice[_nftID] = escrowAmount;

		//The whole price of property..
		purchasePrice[_nftID] = purchaseAmount;

		//Updates the buyers list..
		buyers[_nftID] = _buyer;
	}

	//Buyer makes the down payment for the property
	function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID){
		require(msg.value >= escrowPrice[_nftID], 'Not enough ether provided');
	}

	//Inspection of the property is needed..
	function inspection(uint256 _nftID, bool _passed) public onlyInspector{
		inspectionPassed[_nftID] = _passed;
	}

	//Approve the property..
	function approve(uint256 _nftID, bool _approved) public {
		require(inspectionPassed[_nftID], 'No Inspection has been made');
		approvals[_nftID][msg.sender] = _approved;
	}

	//Facilitate the sale..
	function finalizeSale(uint256 _nftID) public {
		require(inspectionPassed[_nftID], "No Inspection has been made");

		//Buyer has to approve the sale..
		require(approvals[_nftID][buyers[_nftID]], 'Buyer did not approved the sale');

		//Seller has to approve the sale..
		require(approvals[_nftID][seller], 'Seller did not approved the sale');

		//Lender has to approve the sale..
		require(approvals[_nftID][lender], 'Lender did not approved the sale');

		//Balance of the contract must be greater or equal to purchasPrice
		require(address(this).balance >= purchasePrice[_nftID]);

		//The property is no more listed..
		isListed[_nftID] = false;

		//If al requirements are respected..
		//Send funds to seller..
		(bool success, ) = payable(seller).call{value: address(this).balance}("");
		require(success);

		//Transfer property to buyer..
		IERC721(nftAddr).transferFrom(address(this), buyers[_nftID], _nftID);

	}

	//Cancel the sale if something goes wrong..
	function cancelSale(uint256 _nftID) public {
		if(inspectionPassed[_nftID] == false){
			payable(buyers[_nftID]).transfer(address(this).balance);
		}else{
			payable(seller).transfer(address(this).balance);
		}

		//Update cancelled sales..
		isCanceled[_nftID] = true;
	}

	receive() payable external {}


	//Chech the balance of the contract..
	function getBalance() public view returns(uint256){
		return address(this).balance;
	}




}







