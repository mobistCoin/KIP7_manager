const express = require('express');
const router = express.Router();

const fs = require('fs');
const klaytn = require('libkct');
const mysql = require('mysql');
const util = require("util");

/* JSON data read from JSON File */
const jsonFile = fs.readFileSync('./platform.json', 'utf8');
jsonData = JSON.parse(jsonFile);

/* Data store from JSON data to variables */
const {chainId, accessKeyId, secretAccessKey: secretAccessKeyPw, contract} = jsonData.klaytn;

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

    if (login && password && login === auth.login && password === auth.password) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
});

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('SVC route.');
});

router.get('/create', async function(req, res) {
    let result = new Object()

    result.id = klaytn.createID(24)
    result.password = klaytn.createPW(40)

    res.send(result)
})

module.exports = router;
