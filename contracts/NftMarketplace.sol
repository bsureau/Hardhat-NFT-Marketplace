
// SPDX-License-Identifier: MIT 

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotApprovedForMarketplace();
error NftMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotOwner();

contract NftMarketplace {   

    struct Listing {
        uint256 price;
        address seller;
    }

    event ItemListed(
        address sender, 
        address nftAddress, 
        uint256 tokenId, 
        uint256 price
    );

    // NFT Contract address => NFT tokenId -> Listing
    mapping(address => mapping(uint256 => Listing)) s_listings;

    modifier notListed(
        address nftAddress, 
        uint256 tokenId
    ) {

        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__AlreadyListed(nftAddress, tokenId); 
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (owner != spender) {
            revert NftMarketplace__NotOwner();
        }
        _;
    }

    function listItem(
        address nftAddress, 
        uint256 tokenId,
        uint256 price 
    ) external notListed(nftAddress, tokenId) isOwner(nftAddress, tokenId, msg.sender) {

        if (price < 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }

        IERC721 nft = IERC721(nftAddress); 
        if(nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketplace();
        }
        
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    // TODO:
    //UpdateItem
    //CancelItem
    //BuyItem
    //Withdraw
}
