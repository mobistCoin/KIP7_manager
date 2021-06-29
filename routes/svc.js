const express = require('express');
const router = express.Router();

const fs = require('fs');
const klaytn = require('libkct');

/* JSON data read from JSON File */
const jsonFile = fs.readFileSync('./platform.json', 'utf8');
jsonData = JSON.parse(jsonFile);

/* Data store from JSON data to variables */
const chainId = jsonData.chainid;
const accessKeyId = jsonData.accessKeyId;
const secretAccessKey = jsonData.secretAccessKey;
const contract = jsonData.contract;

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

router.get('/create', async function(req, res) {
    let result = new Object()

    result.id = klaytn.createID(24)
    result.password = klaytn.createPW(40)

    res.send(result)
})

module.exports = router;
