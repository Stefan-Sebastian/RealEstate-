//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RealEstate is ERC721URIStorage {
	//Atach Counter library functions to manage the id increment or decrement
	using Counters for Counters.Counter;
	Counters.Counter public tokenID;

	constructor() ERC721('Real Estate', 'REAL') {}

	//Mint function which takes as an argument the metadata of the token
	function mint(string memory _tokenURI) public returns(uint256){
		//Increment token ID by 1 everytime someone calls the function
		tokenID.increment();
		
		//Show the current token Id after it has been incremented
		uint256 newTokenId = tokenID.current();

		//Mint new token
		_safeMint(msg.sender, newTokenId);

		//Set the metatdata of the token..
		_setTokenURI(newTokenId, _tokenURI);

		return newTokenId;
	}

}



