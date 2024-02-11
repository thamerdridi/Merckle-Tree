const { MerkleTree } = require('merkletreejs');
const SHA256 = require('crypto-js/sha256');
const redis = require('redis');
const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379
});

client.connect();

async function addToCouncil (member) {
    const isMemberExist = await client.sIsMember("councilMembers", member);
    if(!isMemberExist){
        client.sAdd("councilMembers", member);
        console.log('Council has been added to the council');
    }else {
        console.log('Member is already in the council');
    }
};

async function createMerkleTree(){
    const members= await client.sMembers('councilMembers');
    const leaves= members.map(x => SHA256(x));
    const tree=new MerkleTree(leaves, SHA256);
    return tree
};


function isWhiteListed(target, merkletree){
    const leaf = SHA256(target);
    const proof= merkletree.getProof(leaf);
    const root= merkletree.getRoot().toString('hex');
    return MerkleTree.verify(proof, leaf, root);
};

async function main(){
    await addToCouncil('firas.testnet');
    const merkletree= await createMerkleTree();
    console.log(isWhiteListed("thamer.testnet", merkletree) ? 'Whitelisted' : 'Not Whitelisted' );
    client.quit();
};

main();