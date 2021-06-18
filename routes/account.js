const express = require('express');
const router = express.Router();
const util = require("util");
const fs = require('fs');
const mitx = require('../libs/klaytn');
const urlExistSync = require("url-exist-sync");
const axios = require('axios');
const mysql = require('mysql');

/* JSON data read from JSON File */
const jsonFile = fs.readFileSync('./platform.json', 'utf8');
jsonData = JSON.parse(jsonFile);

/* Data store from JSON data to variables */
const chainId = jsonData.chainid;
const accessKeyId = jsonData.accessKeyId;
const secretAccessKeyId = jsonData.secretAccessKey;
const contract = jsonData.contract;
const svc_id = jsonData.svcID;

/* Database setting values from json file */
const database = jsonData.database;
const dbTable = jsonData.table;
const dbUser = jsonData.dbuser;
const dbPass = jsonData.dbpass;

let accesskey = "";
let secretaccesskey = "";

let connection = mysql.createConnection({
    host: 'localhost',
    user: dbUser,
    password: dbPass,
    database: database
});

connection.connect();

connection.query('SELECT * FROM svc', function (error, results, fields) {
    if (error) {
        console.log(error);
    }
    for (item in results) {
        if (results[item].pid == svc_id) {
            accesskey = results[item].accesskey;
            secretaccesskey = results[item].secretaccesskey;
        }
    }
});
// Database 연결 끊기
connection.close

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.use((req, res, next) => {
    // DataBase에서 로그인을 위한 정보를 획득하여 값을 만들도록 한다.
    // 로그인하는 서비스 플랫폼의 PID를 받아서 로그인용 ID/PASS를 설정하도록 한다.
    const auth = {login: accesskey, password: secretaccesskey};
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = new Buffer(b64auth, 'base64').toString().split(':');

    if (login && password && login === auth.login && password === auth.password) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
});

/**
 * 지갑을 생성하는 API 호출을 사용한다.
 */
router.get('/create', async function (req, res) {
    const response = mitx.AccountCreate(chainId, accessKeyId, secretAccessKeyId);
    let result = await response;
    res.send(result);
});

/**
 * API가 동작하기전 요청에 따라 처리해야할 부분들에 대해서 체크하는 부분.
 */
router.use('/:eoa', (req, res, next) => {
    // 주소 형식 체크
    // '0x'로 시작하는지 확인하고
    // 40자 길이의 숫자와 문자로 이루어진 주소값 확인
    let eoaMatch = RegExp("^0x[0-9a-z]{41}")
    // 계좌 형식이 맞지 않은 경우 json으로 내용을 반환한다.
    if (eoaMatch.test(req.params.eoa)) {
        let result = new Object();
        result.status = "fail"
        result.descryption = "Address format is not valid."
        return res.send(result);
    }

    return next()
})

/**
 * 계좌 정보를 바탕으로 화면에 출력하는 기능이 있다.
 */
router.get('/:eoa', async function (req, res, next) {
    // 사용자의 현재 정보를 가져온다.
    const Info = mitx.TokenBalance(req.params.eoa);
    // 사용자의 토큰 거래 기록을 가져온다.
    const CTBE = mitx.AccountTransfers(req.params.eoa)
    let balance

    // 지갑 정보를 가져와서 await 한다.
    let Info_json = await Info
    // 지갑의 토큰 거래 기록이 await 되는 것을 기다린다.
    let ctbe = await CTBE

    for (let i = 0; i < Info_json.result.length; i++) {
        if (Info_json.result[i].tokenAddress === contract) {
            balance = Info_json.result[i].amount
        }
    }

    // 조회한 결과에서 조회하고자 하는 contact의 거래 기록이 아닌 것은 삭제한다.
    for (let i = 0; i < ctbe.result.length; i++) {
        if (ctbe.result[i].tokenAddress !== contract) {
            delete ctbe.result[i]
        }
    }

    // 결과값에서 삭제된 거래 기록은 필터링하여 없앤다.
    ctbe.result = ctbe.result.filter(function (el) {
        return el != null;
    })

    // 계좌 잔액의 내용을 16진수에서 10진수로 변경한다.
    // let balance = parseInt(balance_json.balance, 16) / 10 ** 18;
    // 사용자 정보를 pug로 렌더링하여 보여준다.
    // account pug 파일을 호출하여 출력한다.
    res.render('kip7', {account: req.params.eoa, balance: balance, history: ctbe.result})
});

/**
 * 계좌의 잔액 확인용
 */
router.get('/:eoa/balance', async function (req, res) {
    let result = new Object();
    let balance = 0;

    const Info = mitx.TokenBalance(req.params.eoa);
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
 */
router.get('/:eoa/transfers', async function (req, res) {
    const Info = mitx.AccountTransfers(req.params.eoa);
    let info_json = await Info;

    res.send(info_json);
})

/**
 * API를 이용하여 지갑의 토큰을 전송한다.
 * 성공 및 실패 여부와 상관없이 txHash값을 전송한다.
 {
    "status": "Submitted",
    "transactionHash": "0x6726aad7f7b3b0c59871d47f676f04608990350fab3acf2840f4dd43983e92b7"
 }
 * 성공 및 실패 여부 확인을 위해서는 txHash 상태 값의 status가 1인지 확인하여야 한다.
 * 실패하면 9가 된다.
 */
router.post('/:eoa/transfer', async function (req, res) {
    // Token을 전송하는 명령을 실행한다.
    // Return 값에서 TxHash의 값을 획득한다.
    const response = mitx.TransferFT(chainId, accessKeyId, secretAccessKeyId, contract, req.params.eoa, req.query.receiver, "0x" + Number(req.query.amount).toString(16))
    const r = await response;
    res.send(r)
});

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
router.post('/:eoa/trans', async function (req, res) {
    let result = new Object()

    // Token을 전송하는 명령을 실행한다.
    // Return 값에서 TxHash의 값을 획득한다.
    const response = mitx.TransferFT(chainId, accessKeyId, secretAccessKeyId, contract, req.params.eoa, req.query.receiver, "0x" + Number(req.query.amount).toString(16))
    let re = await response;

    // 토큰 전송이 완료되어 전송 기록이 있는 txHash 값이 나오면 이를 검증함.
    // 전송 성공 혹은 실패가 기록되는 부분에 대해서 확인하기 위한 부분임.
    let tx_url = "https://api-baobab.scope.klaytn.com/v1/txs/"
    let request = tx_url.concat(re.transactionHash)
    // TxHash URL이 만들어지는데 시간이 걸리므로 txHash 값이 나올때까지 대기함.
    while (!urlExistSync(request)) {
        ;
    }

    // txHash URL이 만들어지면 상태 값을 가져옴.
    let resultStatus = await axios.get(request)
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(error);
        });

    // txHash 상태값이 1이면 성공, 9이면 실패를 설정한다.
    if (resultStatus.result.txStatus === 1) {
        result.status = 'success'
    } else {
        result.status = 'fail'
    }
    // API 사용자에게 전송 내용에 대해서 전달함.
    result.transactionHash = req.params.eoa
    result.to = req.query.receiver
    result.amount = req.query.amount

    // JSON 형태의 데이터를 API의 결과값으로 전달함.
    res.send(result)
});

module.exports = router;
