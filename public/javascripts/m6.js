window.onload = function (url, ) {//윈도우가 열리면
    document.getElementById("transfer").onclick = function () {
        alert("A함수호출");
    }
}

/**
 * 스크립트 기반 POST 전송
 * @param action - URL
 * @param params - JSON
 * @returns
 */
function sendPost(action, params) {
    var form = document.createElement('form');
    form.setAttribute('method', 'post');
    form.setAttribute('action', action);
    document.charset = "utf-8";

    for ( var key in params) {
        var hiddenField = document.createElement('input');
        hiddenField.setAttribute('type', 'hidden');
        hiddenField.setAttribute('name', key);
        hiddenField.setAttribute('value', params[key]);
        form.appendChild(hiddenField);
    }

    document.body.appendChild(form);
    form.submit();
}