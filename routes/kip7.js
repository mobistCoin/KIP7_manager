/**
 * @fileoverview 이 파일은 KIP7 Smart Contract 관련 정보를 처리한다.
 */
const express = require('express');
const router = express.Router();

const util = require("util");
const fs = require('fs');
const mitx = require('libkct');

/* JSON data read from JSON File */
const jsonFile = fs.readFileSync('./platform.json', 'utf8');
jsonData = JSON.parse(jsonFile);

/* Data store from JSON data to variables */
const {chainId, accessKeyId, secretAccessKey, contract} = jsonData.klaytn;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.use('/:eoa', (req, res, next) => {
  let result = new Object()

  if(req.params.eoa !== contract) {
    result.status = "fail"
    result.description = "contract address is not supported."
    return res.send(result)
  }

  return next()
})

router.use((req, res, next) => {
  // DataBase에서 로그인을 위한 정보를 획득하여 값을 만들도록 한다.
  // 로그인하는 서비스 플랫폼의 PID를 받아서 로그인용 ID/PASS를 설정하도록 한다.
  const auth = {login: accessKeyId, password: secretAccessKey};
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = new Buffer(b64auth, 'base64').toString().split(':');

  console.log(util.format("id: %s, check_id: %s", login, auth.login))
  if (login && password && login === auth.login && password === auth.password) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="401"');
  res.status(401).send('Authentication required.');
});

router.get('/:eoa', async function(req, res, next) {
  // EOA check pattern and length
  // start with '0x' and 40 size string.
  let eoaMatch = RegExp("^0x[0-9a-z]{41}")
  if (eoaMatch.test(req.params.eoa)) {
    res.send("Error MATCH")
  }

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

  // 계좌 잔액의 내용을 16진수에서 10진수로 변경한다.
  // let balance = parseInt(balance_json.balance, 16) / 10 ** 18;
  // 사용자 정보를 pug로 렌더링하여 보여준다.
  // account pug 파일을 호출하여 출력한다.
  res.render('kip7', {account: req.params.eoa, balance: balance, history: ctbe.result})
});

router.get('/:eoa/transfers', async function (req, res) {
  // 주어진 주소값이 smart contract 의 값인지 확인.
  if (req.params.eoa !== contract) {
    res.send("{\"status\": \"fail\"}")
  }

  const Info = mitx.ContractTransfers(req.params.eoa);
  let info_json = await Info;

  console.log(info_json)

  res.send(info_json);
})

/**
 * KIP7 Token의 거래자들 리스트 출력
 */
router.get('/holders', async function(req, res) {
  const response = mitx.ContractHolders(contract);
  let result = await response;
  let lists = result.result

  const pwstr = mitx.createPW(32);

  res.render('holders', {holders: lists, userPW:pwstr})
});

module.exports = router;
