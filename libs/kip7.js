const axios = require('axios');
const util = require("util");

//아이디가 존재할 경우
//숫자 + 문자 + 특수문자 새로운 비밀번호 생성하고
module.exports.createPW = function createCode(iLength) {
    let arr = "0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,~,!,@,#,%,^,&,*,(,),-,+,|,_,=,[,],{,},<,>,?,/,.".split(",");
    let randomStr = "";
    for (let j=0; j<iLength; j++) {
        randomStr += arr[Math.floor(Math.random()*arr.length)];
    }
    return randomStr
}

module.exports.createID = function createID(iLength) {
    // ID: 16 자리
    // PASSWD: 32 자리
    let arr = "0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z".split(",");
    let randomStr = "MITXIDX";
    let size = iLength - randomStr.length;
    for (let j = 0; j < size; j++) {
        randomStr += arr[Math.floor(Math.random() * arr.length)];
    }
    return randomStr
}

/**
 * FT smart contract 거래 내역을 eoa를 기준으로 확인할 수 있는 함수이다.
 * caver-js에서 아직 kip7을 지원하지 않아 작성된 함수이다.
 * @param chainId baobab testnet과 mainnet을 구분하여 접속하는 값.(cypress: 8217, baobab: 1001)
 * @param accessKeyId API console에서 발급받은 접속용 key id
 * @param secretAccessKey API console에서 발급받은 접속용 secret key
 * @param contract 조회하고자 하는 smart contract 주소
 * @param eoa 조회하고자 하는 토큰 거래용 주소
 * @returns {Promise<AxiosResponse<any>>} 비동기 함수의 리턴값으로 값이 저장되는 것을 기다렸다가 사용해야한다.
 */
module.exports.historyEoa = async function RestHistoryEOAFunction(chainId, accessKeyId, secretAccessKey, contract, eoa) {
    // https://th-api.klaytnapi.com/v2/transfer/account/{address}
    let url = "https://th-api.klaytnapi.com/v2/transfer/account/"
    let request = url.concat(eoa)

    /**
     * header에 설정되어야 하는 값을 입력함.
     * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
     */
    const headers = {
        'Content-Type': 'application/json',
        'x-chain-id': chainId
    }
    /**
     * 인증 내역은 username과 password를 사용하여 API의 인증을 진행한다.
     * username은 accessKeyId를 사용하여 설정하고
     * password는 secretAccessKey를 사용하여 설정한다.
     * 이 값을 POST 혹은 GET 하면서 전송하도록 한다.
     */
    const auth = {
        username: accessKeyId,
        password: secretAccessKey
    }

    const param = {
        'kind': "ft",
        'ca-filter': contract
    }

    /**
     * axios를 사용하여 실제 get으로 명령을 실행하는 부분이다.
     */
    return await axios.get(request, {auth: auth, headers: headers, params: param})
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(error);
        });
}

/**
 * FT smart contract 거래 내역을 eoa를 기준으로 확인할 수 있는 함수이다.
 * caver-js에서 아직 kip7을 지원하지 않아 작성된 함수이다.
 * @param chainId baobab testnet과 mainnet을 구분하여 접속하는 값.(cypress: 8217, baobab: 1001)
 * @param accessKeyId API console에서 발급받은 접속용 key id
 * @param secretAccessKey API console에서 발급받은 접속용 secret key
 * @param preset 조회하고자 하는 지갑 주소와 contract 주소의 preset.
 * @returns {Promise<AxiosResponse<any>>} 비동기 함수의 리턴값으로 값이 저장되는 것을 기다렸다가 사용해야한다.
 */
module.exports.historyPreset = async function RestHistoryEOAFunction(chainId, accessKeyId, secretAccessKey, preset) {
    // https://th-api.klaytnapi.com/v2/transfer
    let request = "https://th-api.klaytnapi.com/v2/transfer"

    /**
     * header에 설정되어야 하는 값을 입력함.
     * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
     */
    const headers = {
        'Content-Type': 'application/json',
        'x-chain-id': chainId
    }
    /**
     * 인증 내역은 username과 password를 사용하여 API의 인증을 진행한다.
     * username은 accessKeyId를 사용하여 설정하고
     * password는 secretAccessKey를 사용하여 설정한다.
     * 이 값을 POST 혹은 GET 하면서 전송하도록 한다.
     */
    const auth = {
        username: accessKeyId,
        password: secretAccessKey
    }

    const param = {
        'presets': preset
    }

    /**
     * axios를 사용하여 실제 get으로 명령을 실행하는 부분이다.
     */
    return await axios.get(request, {auth: auth, headers: headers, params: param})
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(error);
        });
}

/**
 * restful API를 사용하여 API를 사용하는 함수이다.
 * caver-js에서 아직 kip7을 지원하지 않아 작성된 함수이다.
 * @param chainId baobab testnet과 mainnet을 구분하여 접속하는 값.(cypress: 8217, baobab: 1001)
 * @param accessKeyId API console에서 발급받은 접속용 key id
 * @param secretAccessKey API console에서 발급받은 접속용 secret key
 * @param contract 조회하고자 하는 smart contract 주소
 * @param eoa 조회하고자 하는 토큰 거래용 주소
 * @returns {Promise<AxiosResponse<any>>} 비동기 함수의 리턴값으로 값이 저장되는 것을 기다렸다가 사용해야한다.
 */
module.exports.balanceFT = async function RestBalanceFunction(chainId, accessKeyId, secretAccessKey, contract, eoa) {

    // https://kip7-api.klaytnapi.com/v1/contract/{contract-address-or-alias}/account/{owner}/balance
    let url = "https://kip7-api.klaytnapi.com/v1/contract/"
    let contract_url = url.concat(contract, "/account/")
    let request = contract_url.concat(eoa, "/balance")

    /**
     * header에 설정되어야 하는 값을 입력함.
     * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
     */
    const headers = {
        'Content-Type': 'application/json',
        'x-chain-id': chainId
    }
    /**
     * 인증 내역은 username과 password를 사용하여 API의 인증을 진행한다.
     * username은 accessKeyId를 사용하여 설정하고
     * password는 secretAccessKey를 사용하여 설정한다.
     * 이 값을 POST 혹은 GET 하면서 전송하도록 한다.
     */
    const auth = {
        username: accessKeyId,
        password: secretAccessKey
    }

    /**
     * axios를 사용하여 실제 get으로 명령을 실행하는 부분이다.
     */
    return await axios.get(request, {auth: auth, headers: headers})
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error);
        });
}

/**
 * Token 전송용 함수이다. 이 함수는 개선이 필요한다.
 * TODO: 개발 필요.
 * @param chainId
 * @param accessKeyId
 * @param secretAccessKey
 * @param contract
 * @param from
 * @param to
 * @param amount
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.TransferFT = async function RestTransferFunction(chainId, accessKeyId, secretAccessKey, contract, from, to, amount) {
    var url = "https://kip7-api.klaytnapi.com/v1/contract/"
    var request = url.concat(contract, "/transfer")

    /**
     * header에 설정되어야 하는 값을 입력함.
     * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
     */
    const headers = {
        'Content-Type': 'application/json',
        'x-chain-id': chainId
    }
    /**
     * 인증 내역은 username과 password를 사용하여 API의 인증을 진행한다.
     * username은 accessKeyId를 사용하여 설정하고
     * password는 secretAccessKey를 사용하여 설정한다.
     * 이 값을 POST 혹은 GET 하면서 전송하도록 한다.
     */
    const auth = {
        username: accessKeyId,
        password: secretAccessKey
    }
    /**
     * body 내용에는 from과 to, amount 필드를 포함하고 있으며
     * 이 필드의 값으로 전송량과 계좌간 전송이 이루어진다.
     * from 토큰을 전송하려는 계좌
     * to 토큰을 전송받는 계좌
     * amount 전송되는 토큰량
     */
    const body = {
        "from": from,
        "to": to,
        "amount": amount
    }

    /**
     * axios를 사용하여 실제 post로 명령을 실행하는 부분이다.
     */
    return await axios.post(request, body, {auth: auth, headers: headers})
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(error);
        });
}

module.exports.AccountCreate = async function RestAccountCreateFunction(chainId, accessKeyId, secretAccessKey) {
    let url = "http://wallet-api.klaytnapi.com/v2/account";

    /**
     * header에 설정되어야 하는 값을 입력함.
     * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
     */
    const headers = {
        'Content-Type': 'application/json',
        'x-chain-id': chainId
    }
    /**
     * 인증 내역은 username과 password를 사용하여 API의 인증을 진행한다.
     * username은 accessKeyId를 사용하여 설정하고
     * password는 secretAccessKey를 사용하여 설정한다.
     * 이 값을 POST 혹은 GET 하면서 전송하도록 한다.
     */
    const auth = {
        username: accessKeyId,
        password: secretAccessKey
    }
    /**
     * axios를 사용하여 실제 post로 명령을 실행하는 부분이다.
     */
    return await axios.post(url, "",{auth: auth, headers: headers})
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(error);
        });
}

/**
 * Web API를 사용하여 지갑의 정보를 가져오는 함수
 * 여기에서 나오는 잔액은 KLAY이다.
 * @param address
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.AccountInfo = async function WebAccountInfo(address) {
    const url = "https://api-baobab.scope.klaytn.com/v1/accounts/";
    const request = url.concat(address)

    return axios.get(request)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error)
        })
}

/**
 * WebAPI를 사용하여 지갑의 Transaction 기록을 가져올 수 있는 함수
 * @param address
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.AccountTxs = async function WebAccountTxs(address) {
    const url = "https://api-baobab.scope.klaytn.com/v1/accounts/";
    const request = url.concat(address, "/txs");

    return axios.get(request)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error)
        })
}

/**
 * Contract 전송 내역을 확인할 수 있는 함수
 * 모든 contract의 내역을 보내며 전체 100개의 기록을 반환한다.
 * @param eoa
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.ContractTransferByEoa = function WebContractTx(eoa) {
    const url = "https://api-baobab.scope.klaytn.com/v1/accounts/"
    const request = url.concat(eoa, "/transfers?limit=100")

    return axios.get(request)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error)
        })
}

/**
 * Token Holders 자료 수집 함수.
 * 테스트 안되어 있음.
 * @param address
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.ContractHolders = async function WebContractHolders(address) {
    const url = "https://api-baobab.scope.klaytn.com/v1/tokens/";
    const request = url.concat(address, "/holders");

    return axios.get(request)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error)
        })
}

/**
 * Token을 가지고 있는 지갑들의 리스트를 가져오는 함수
 * @param address
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.TokenBalance = async function WebContractBalance(address) {
    const url = "https://api-baobab.scope.klaytn.com/v1/accounts/";
    const request = url.concat(address, "/balances");

    return axios.get(request)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error)
        })
}

/**
 * TxHash 내용을 확인하는 함수.
 * 거래한 이후 발생한 TxHash를 확인하기 위한 함수.
 * @param TxHash
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.TxHashInfo = async function WebTxHash(TxHash) {
    const url = "https://api-baobab.scope.klaytn.com/v1/txs/";
    const request = url.concat(TxHash);
    let result

    // do {
    //     result = await urlExists(request, (_, exists) => {
    //         console.log(exists)
    //         return exists
    //     })
    //     console.log(result)
    // } while (result != true)
    console.log(util.format("return exist: %s", result))

    // return axios.get(request)
    //     .then(response => {
    //         return response;
    //     })
    //     .catch(error => {
    //         console.log(error)
    //     })
}

