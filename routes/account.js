const express = require('express');
const router = express.Router();
const util = require("util");
const fs = require('fs');
const urlExistSync = require("url-exist-sync");
const axios = require('axios');
const mysql = require('mysql');
const klaytn = require('libkct')
const {v4: uuidv4} = require('uuid');

/* JSON data read from JSON File */
const jsonFile = fs.readFileSync('./platform.json', 'utf8');
jsonData = JSON.parse(jsonFile);

/* Data store from JSON data to variables */
const {chainId, accessKeyId, secretAccessKeyPw, contract, feePayer} = jsonData.klaytn;
/* Database connection setting */
const {database, dbTable, dbUser, dbPass, svcID} = jsonData.database;

let connection = mysql.createConnection({
    host: 'localhost',
    user: dbUser,
    password: dbPass,
    database: database
});

dbValue = klaytn.GetSVC(connection, svcID)

router.use((req, res, next) => {
    // DataBase에서 로그인을 위한 정보를 획득하여 값을 만들도록 한다.
    // 로그인하는 서비스 플랫폼의 PID를 받아서 로그인용 ID/PASS를 설정하도록 한다.
    // TODO: 로그인용 Database 구조 개발 PID <key> -> ID, PASSWORD
    const auth = {login: dbValue[0], password: dbValue[1]};
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = new Buffer(b64auth, 'base64').toString().split(':');

    if (login && password && login === auth.login && password === auth.password) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('account route.');
});

/**
 * 지갑을 생성하는 API 호출을 사용한다.
 */
router.get('/create', async function (req, res) {
    const response = klaytn.AccountCreate(chainId, accessKeyId, secretAccessKeyPw);
    let result = await response;
    res.send(result);
});

/**
 * feePayer 생성 함수
 */
router.get('/createfeePayer', async function (req, res) {
    const response = klaytn.feePayerCreate(chainId, accessKeyId, secretAccessKeyPw);
    let result = await response;
    console.log(result)
    res.send(result);
});

/**
 * API가 동작하기전 요청에 따라 처리해야할 부분들에 대해서 체크하는 부분.
 */
router.use('/:eoa', (req, res, next) => {
    /**
     * 주소 형식 체크
     * '0x'로 시작하는지 확인하고 40자 길이의 숫자와 문자로 이루어진 주소값 확인
     * @type {RegExp}
     */
    let eoaMatch = RegExp("^0x[0-9a-z]{41}")
    /**
     * 주소가 매칭되지 않는 경우 에러 반환
     * 반환 값은 JSON 데이터
     * {"status": "fail", "description": "Address format is not valid."}
     */
    if (eoaMatch.test(req.params.eoa)) {
        /**
         * @param {string} status 성공 및 실패에 대한 상태값을 설정
         * @param {string} description 실패한 경우 사유를 설정
         * @type {object}
         */
        let result = {}
        result.status = "fail"
        result.description = "Address format is not valid."
        return res.send(result);
    }

    /**
     * 에러 발생이 없으면 다음 동작으로 넘어간다.
     */
    return next()
})

/**
 * 계좌 정보를 바탕으로 화면에 출력하는 기능이 있다.
 */
router.get('/:eoa', async function (req, res, next) {
    /**
     * 사용자의 현재 정보를 가져온다.
     * @type {Promise<AxiosResponse<*>>}
     */
    const Info = klaytn.TokenBalance(req.params.eoa);
    /**
     * 사용자의 토큰 거래 기록을 가져온다.
     * @type {Promise<AxiosResponse<*>>}
     */
    const CTBE = klaytn.AccountTransfers(req.params.eoa)
    let balance

    /**
     * TokenBalance 함수의 결과 값으로 계정의 token 잔액 정보를 담고 있음.
     * Promise 데이터를 사용할 수 있게 await 함.
     * @type {AxiosResponse<*>}
     */
    let Info_json = await Info
    /**
     * AccountTransfers 함수의 결과 값으로 계정의 token 거래 내역을 담고 있음.
     * Promise 데이터를 사용할 수 있게 await 함.
     * @type {AxiosResponse<*>}
     */
    let ctbe = await CTBE

    /**
     * Account 잔액 정보중 원하는 Token의 잔액정보만 출력
     * Info_json 데이터중 tokenAddress가 현재 처리중인 smart contract의 주소인 경우
     * 잔액 정보를 출력.
     */
    for (let i = 0; i < Info_json.result.length; i++) {
        if (Info_json.result[i].tokenAddress === contract) {
            balance = Info_json.result[i].amount
        }
    }

    /**
     * ctbe 데이터에서 현재 처리중인 smart contract 의 정보가 아니면 삭제
     * 거래 기록을 현재 처리중인 smart contract 의 거래 내역만 남김.
     */
    for (let i = 0; i < ctbe.result.length; i++) {
        if (ctbe.result[i].tokenAddress !== contract) {
            delete ctbe.result[i]
        }
    }

    /**
     * ctbe 데이터의 삭제된 데이터를 정리.
     */
    ctbe.result = ctbe.result.filter(function (el) {
        return el != null;
    })

    /**
     * 계좌 잔액의 내용을 16진수에서 10진수로 변경한다.
     * let balance = parseInt(balance_json.balance, 16) / 10 ** 18;
     * 사용자 정보를 pug로 account.pug 파일을 렌더링하여 출력
     */
    res.render('account', {account: req.params.eoa, balance: balance, history: ctbe.result})
});

/**
 * 계좌의 잔액 확인용
 */
router.get('/:eoa/balance', async function (req, res) {
    let result = new Object();
    let balance = 0;

    const Info = klaytn.TokenBalance(req.params.eoa);
    let info_json = await Info;

    // get all token balance in account.
    const tokens = info_json.result

    // compare smart contract address for balance
    for (item in tokens) {
        if (tokens[item].tokenAddress === contract) {
            balance = tokens[item].amount
            break
        }
    }

    result.account = req.params.eoa
    result.balance = balance

    res.send(result);
})

/**
 * 계좌의 전송 기록을 가져온다.
 * TODO: 해당 smart contract의 기록을 전체 가져오도록 해야 한다.
 */
router.get('/:eoa/transfers', async function (req, res) {
    const Info = klaytn.AccountTransfers(req.params.eoa);
    let info_json = await Info;

    res.send(info_json);
})

/**
 * fee delegation API
 * feePayer 정보는 json 에서 읽어온다.
 * 성공할 경우 상태와 내용에 대해서 출력한다.
 * API 호출 시간이 약 4초정도 걸림.
 * 결과값
 {
    "status": "fail", // 성공할 경우: success
    "transactionHash": "0xba31b9a5e0944c27631413ea709d7f2f4414cf30",
    "to": "0xa9fbebab827dce9f5db281007e59528d327675a1",
    "amount": "100000000000000000000000000000000"
 }
 */
router.post('/:eoa/transferFee', async function ({body, params}, res) {
    /**
     * API 사용 결과 값을 전달하기 위한 변수 선언
     * @param {string} status 전송 성공여부
     * @param {string} transactionHash 전송 결과가 있는 transaction hash 주소
     * @param {string} to MITX 수령 대상 지갑 주소
     * @param {string} amount 전송하려는 MITX 수량 (peb 단위)
     */
    let result = {}

    /**
     * Fee delegation 전송을 진행하고 이에 대한 결과를 받아온다.
     * @type {Promise<AxiosResponse<*>>}
     */
    const response = klaytn.TransferFTfee(chainId, accessKeyId, secretAccessKeyPw, contract, params.eoa,
        body.receiver, "0x" + Number(body.amount).toString(16), feePayer)
    /**
     * Promise 형태의 값에서 정적 값을 획득한다.
     * @type {AxiosResponse<*>}
     */
    let re = await response;

    /**
     * klaytn의 TxHash 상태 값을 가져온다.
     * @type {AxiosResponse<*>}
     */
    const resultStatus = await klaytn.GetTxStatus(re.transactionHash)

    /**
     * txHash 상태값이 1이면 성공, 9이면 실패를 설정한다.
     */
    if (resultStatus.result.txStatus === 1) {
        // 성공 값을 입력
        result.status = 'success'
    } else {
        // 실패 값을 입력
        result.status = 'fail'
    }

    /**
     * API 사용 결과 값을 전달하기 위한 부분
     */
    result.transactionHash = re.transactionHash
    result.to = body.receiver
    result.amount = body.amount

    /**
     * JSON 형태의 데이터를 API의 결과값으로 전달함.
     */
    res.send(result)
})

/**
 * 토큰 전송용 API
 * 성공할 경우 상태와 내용에 대해서 출력한다.
 * API 호출 시간이 약 4초정도 걸림.
 * 결과값:
 {
    "status": "fail", // 성공할 경우: success
    "transactionHash": "0xba31b9a5e0944c27631413ea709d7f2f4414cf30",
    "to": "0xa9fbebab827dce9f5db281007e59528d327675a1",
    "amount": "100000000000000000000000000000000"
 }
 */
router.post('/:eoa/transfer', async function (req, res) {
    /**
     * API 사용 결과 값을 전달하기 위한 변수 선언
     * @param {string} status 전송 성공여부
     * @param {string} transactionHash 전송 결과가 있는 transaction hash 주소
     * @param {string} to MITX 수령 대상 지갑 주소
     * @param {string} amount 전송하려는 MITX 수량 (peb 단위)
     */
    let result = {}

    /**
     * Token 전송을 진행하고 이에 대한 결과를 받아온다.
     * @type {Promise<AxiosResponse<*>>}
     */
    const response = klaytn.TransferFT(chainId, accessKeyId, secretAccessKeyPw, contract, req.params.eoa,
        req.body.receiver, "0x" + Number(req.body.amount).toString(16))
    /**
     * Promise 형태의 값에서 정적 값을 획득한다.
     * @type {AxiosResponse<*>}
     */
    let re = await response;

    /**
     * klaytn의 TxHash 상태 값을 가져온다.
     * @type {AxiosResponse<*>}
     */
    const resultStatus = await klaytn.GetTxStatus(re.transactionHash)

    /**
     * txHash 상태값이 1이면 성공, 9이면 실패를 설정한다.
     */
    if (resultStatus.result.txStatus === 1) {
        result.status = 'success'
    } else {
        result.status = 'fail'
    }

    /**
     * API 사용 결과 값을 전달하기 위한 부분
     */
    result.transactionHash = re.transactionHash
    result.to = req.body.receiver
    result.amount = req.body.amount

    /**
     * JSON 형태의 데이터를 API의 결과값으로 전달함.
     */
    res.send(result)
});

module.exports = router;
