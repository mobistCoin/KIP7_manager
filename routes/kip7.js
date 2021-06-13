const express = require('express');
const router = express.Router();
const util = require("util");
const fs = require('fs');
const mitx = require('../libs/klaytn');

/* JSON data read from JSON File */
const jsonFile = fs.readFileSync('./platform.json', 'utf8');
jsonData = JSON.parse(jsonFile);

/* Data store from JSON data to variables */
const chainId = jsonData.chainid;
const accessKeyId = jsonData.accessKeyId;
const secretAccessKey = jsonData.secretAccessKey;
const contract = jsonData.contract;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
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
  const CTBE = mitx.ContractTransferByEoa(req.params.eoa)
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

router.get('/:eoa/balance', async function (req, res) {
  // EOA check pattern and length
  // start with '0x' and 40 size string.
  let eoaMatch = RegExp("^0x[0-9a-z]{41}")
  if (eoaMatch.test(req.params.eoa)) {
    res.send("Error MATCH")
  }

  const Info = mitx.TokenBalance(req.params.eoa);
  let info_json = await Info;

  res.send(info_json.result[0].amount);
})

module.exports = router;
