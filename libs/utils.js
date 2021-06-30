

module.exports.GetSVC = function (connection, svc_id) {
    let accesskey = ""
    let secretaccesskey = ""

    connection.connect();

    sql = 'SELECT * FROM svc where pid=' + svc_id
    console.log(sql)

    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        accesskey = results[0].accesskey;
        secretaccesskey = results[0].secretaccesskey;
        console.log(accesskey)
        dbValue=[accesskey, secretaccesskey]
        connection.close
    });

    return [accesskey, secretaccesskey]
}