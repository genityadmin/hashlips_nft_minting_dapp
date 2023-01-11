// constants
import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";
// log
import { fetchData } from "../data/dataActions";
//merkleTree
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

const connectRequest = () => {
  return {
    type: "CONNECTION_REQUEST",
  };
};

const connectSuccess = (payload) => {
  return {
    type: "CONNECTION_SUCCESS",
    payload: payload,
  };
};

const connectFailed = (payload) => {
  return {
    type: "CONNECTION_FAILED",
    payload: payload,
  };
};

const updateAccountRequest = (payload) => {
  return {
    type: "UPDATE_ACCOUNT",
    payload: payload,
  };
};

export const connect = () => {
  return async (dispatch) => {
    dispatch(connectRequest());
    const abiResponse = await fetch("/config/abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const abi = await abiResponse.json();
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const CONFIG = await configResponse.json();
    const { ethereum } = window;
    const metamaskIsInstalled = ethereum && ethereum.isMetaMask;

    if (metamaskIsInstalled) {
      Web3EthContract.setProvider(ethereum);
      let web3 = new Web3(ethereum);
      try {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        const networkId = await ethereum.request({
          method: "net_version",
        });
        if (networkId == CONFIG.NETWORK.ID) {
          const SmartContractObj = new Web3EthContract(
            abi,
            CONFIG.CONTRACT_ADDRESS
          );
          let whitelistAddresses = [
            "0xB9acB63FD20a57946a158eE73A33a66aE3633260", "0x7F7b4b1399398781F20042645E429CEB224A3399", "0x0d127407049297CD917cc966e0692b71DaEb7dd3", "0x3e5584cD01908145D6b1e99c763607Be609066e6"
          ]

          const WLAddr = whitelistAddresses.map(whitelistAddresses => whitelistAddresses.toLowerCase());

          // const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
          // const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

          // const rootHash = merkleTree.getRoot();

          // console.log(leafNodes[0]);

          // const claimingAddress = leafNodes[0];

          // const hexProof = merkleTree.getHexProof(claimingAddress);

          // console.log(hexProof)
          // if (merkleTree.verify(hexProof, accounts[0], rootHash)) {

          let claimingAddress = accounts[0];

          if (WLAddr.includes(claimingAddress.toLowerCase())) {
            console.log("success");

            dispatch(
              connectSuccess({
                account: accounts[0],
                smartContract: SmartContractObj,
                web3: web3,
              })
            );
            // Add listeners start
            ethereum.on("accountsChanged", (accounts) => {
              dispatch(updateAccount(accounts[0]));
            });
            ethereum.on("chainChanged", () => {
              window.location.reload();
            });
            // Add listeners end
          } else {
            dispatch(connectFailed("You are not in the whitelist"));
          }
        } else {
          dispatch(connectFailed(`Change network to ${CONFIG.NETWORK.NAME}.`));
        }
      } catch (err) {
        dispatch(connectFailed("Something went wrong."));
      }
    } else {
      dispatch(connectFailed("Install Metamask."));
    }
  };
};

export const updateAccount = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }));
    dispatch(fetchData(account));
  };
};
