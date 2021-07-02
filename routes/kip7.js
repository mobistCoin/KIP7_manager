/**
 * @fileoverview 이 파일은 KIP7 Smart Contract 관련 정보를 처리한다.
 */
const express = require('express');
const router = express.Router();

const util = require("util");
const fs = require('fs');
const klaytn = require('libkct');
const mysql = require('mysql');

/* JSON data read from JSON File */
const jsonFile = fs.readFileSync('./platform.json', 'utf8');
jsonData = JSON.parse(jsonFile);

/* Data store from JSON data to variables */
const {chainId, accessKeyId, secretAccessKeyPw, contract} = jsonData.klaytn;

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
  const auth = { login: dbValue[0], password: dbValue[1] };
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = new Buffer(b64auth, 'base64').toString().split(':');

  console.log(util.format("save key: %s, pw: %s", dbValue[0], dbValue[1]))

  if (login && password && login === auth.login && password === auth.password) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="401"');
  res.status(401).send('Authentication required.');
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('kip7 route.');
});

/**
 * API를 이용하여 Preset에 있는 형태로 전송 기록을 가져온다.
 */
router.post('/historyPreset', async function(req, res) {
  console.log(util.format("body value: %s", req.body.preset))
  const response = klaytn.historyPreset(chainId, accessKeyId, secretAccessKey, req.body.preset)
  const r = await response;
  res.send(r)
})

/**
 * API가 동작하기전 조건을 체크하기 위한 middleware
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

  return next()
})

/**
 * KIP7 해당 Smart Contract 정보를 가져옴.
 */
router.get('/:eoa', async function(req, res, next) {
  // 사용자의 현재 정보를 가져온다.
  const Info = klaytn.TokenBalance(req.params.eoa);
  // 사용자의 토큰 거래 기록을 가져온다.
  const CTBE = klaytn.ContractTransfers(req.params.eoa)
  let balance

  // 지갑 정보를 가져와서 await 한다.
  let Info_json = await Info
  // 지갑의 토큰 거래 기록이 await 되는 것을 기다린다.
  let ctbe = await CTBE

  for (let i = 0; i < Info_json.result.length; i++) {
    if(Info_json.result[i].tokenAddress === contract) {
      balance = Info_json.result[i].amount
    }
  }

  // 조회한 결과에서 조회하고자 하는 contact의 거래 기록이 아닌 것은 삭제한다.
  for (let i = 0; i < ctbe.result.length; i++) {
    if(ctbe.result[i].tokenAddress !== contract) {
      delete ctbe.result[i]
    }
  }

  // 결과값에서 삭제된 거래 기록은 필터링하여 없앤다.
  ctbe.result = ctbe.result.filter(function (el) {
    return el != null;
  })

  const response = klaytn.ContractHolders(contract)
  let result = await response
  let lists = result.result

  // 계좌 잔액의 내용을 16진수에서 10진수로 변경한다.
  // let balance = parseInt(balance_json.balance, 16) / 10 ** 18;
  // 사용자 정보를 pug로 렌더링하여 보여준다.
  // account pug 파일을 호출하여 출력한다.
  res.render('kip7', {account: req.params.eoa, balance: balance, history: ctbe.result, holders: lists})
});

router.get('/:eoa/transfers', async function (req, res) {
  // 주어진 주소값이 smart contract 의 값인지 확인.
  if (req.params.eoa !== contract) {
    res.send("{\"status\": \"fail\"}")
  }

  const Info = klaytn.ContractTransfers(req.params.eoa);
  let info_json = await Info;

  console.log(info_json)

  res.send(info_json);
})

/**
 * KIP7 Token의 거래자들 리스트 출력
 */
router.get('/holders', async function(req, res) {
  const response = klaytn.ContractHolders(contract);
  let result = await response;
  let lists = result.result

  res.send(lists)
});

module.exports = router;
