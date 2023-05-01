// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import "./ERC4907.sol";
import "./utils/Roles.sol";

contract NFT is ERC4907, Roles {

    string private baseURI =
        "ipfs://QmYog8dP2hJpgQXvfFes6CfhT64fgzoksG4K3CPAt3PMFC/";
        
    string private baseContractURI =
        "ipfs://QmeRMfUzVGjjsPTpBYRdnZfjSQ6u3N6vdDi2LSpVdELJsA";

    uint public totalSupply = 2000;

    address immutable _minter;



    constructor() ERC4907("NFT", "NFT") {
        _minter = msg.sender;
        _balances[_minter] = totalSupply;
    }




    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override onlyAdmin{
        transferFrom(from,to,tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override onlyAdmin{
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual override onlyAdmin{
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
        _safeTransfer(from, to, tokenId, data);
    }



        function ownerOf(uint256 tokenId)
        public
        view
        override
        returns (address)
    {
        address owner = _owners[tokenId];
        require(tokenId <= totalSupply && tokenId > 0, "invalid token ID");
        if (owner == address(0)) {
            return _minter;
        } else {
            return owner;
        }
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    } 
    
    function contractURI() public view returns (string memory) {
        return baseContractURI;
    }

    function changeBaseURI(string calldata newURI) public onlyOwner {
        baseURI = newURI;
    }

    function changeBaseContractURI(string calldata newURI) public onlyOwner {
        baseContractURI = newURI;
    }

    function mint(address to, uint quantity) public onlyOwner{
       uint _totalSupply = totalSupply;
       totalSupply += quantity;

        for(uint i = 1; i <= quantity; i++){
            _mint(to, _totalSupply + i);
        }

    }

}