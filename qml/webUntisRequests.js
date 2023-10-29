const STATES = {
    loggedOut: 0,
    pendingLogin: 1,
    loggedIn: 2,
    pendingLogout: 3
};
var state = STATES.loggedOut
//TODO: Login and logout are also requests and should be added
var activeRequests = 0
var id = 0
function getId() {
    return id++
}

function log(msg) {
    if (showLog) {
        logLabel.text = msg
    }
    console.log(msg)
}

function iterateOver(id, Obj) {
    for (var i in Obj) {
        var it = Obj[i]
        if (it.id === id) {
            return it.longName ? it.name + " (" + it.longName + ")" : it.name
        }
    }
    log("WARN: no match for id " + id)
    return i18n.tr("NO MATCH")
}

function getDataByIds(ids, objectString) {
    var object = {}
    if (objectString !== ""){
        object = JSON.parse(objectString)
    }

    var result = ""
    for (var i in ids) {
        result = result + " " + iterateOver(ids[i].id, object)
    }
    return result
}

function getTime(date, time) {
    date = String(date)
    time = String(time)
    if (time.length === 3) {
        time = "0" + time
    }
    var result = new Date(
        date.substring(0, 4),
        //Month must be corrected to start with 0
        parseInt(date.substring(4, 6)) - 1,
        date.substring(6, 8),
        time.substring(0, 2),
        time.substring(2, 4)
    )
    return result
}

function getColorByCode(code){
    var foreColor = "000000";
    var backColor = "f49f25";
    //TODO: This code is hard-coded, should be changed
    switch (code){
    case ("cancelled"):
        foreColor =  "000000"
        backColor =  "b1b3b4"
        break;
    case("irregular"):
        foreColor =  "000000"
        backColor =  "a781b5"
        break;
    case("message"):
        foreColor =  "000000"
        backColor =  "802020"
        break;
    }


    return [foreColor,backColor]
}

function handleTimetableData(result) {
    for (var i in result) {
        log(`Add entry ${i}: ${JSON.stringify(result[i])}`)
        var entry = result[i]
        var dayEntry = {
            "id": entry.id,
            "foreColor": "#" + getColorByCode(entry.code)[0],
            "backColor": "#" + getColorByCode(entry.code)[1],
            "date": entry.date,
            "startTime": getTime(entry.date, entry.startTime),
            "endTime": getTime(entry.date, entry.endTime),
            "klassen": entry.kl ? getDataByIds(entry.kl, klassen) : "",
            "teacher": entry.te ? getDataByIds(entry.te, teacher) : "",
            "subject": entry.su ? getDataByIds(entry.su, subjects) : "",
            "room": entry.ro ? getDataByIds(entry.ro, rooms) : "",
            "code": entry.code ? entry.code : "",
            "lstext": entry.lstype ? entry.lstype : "",
            "statflags": entry.statflags ? entry.statflags : "",
            "activityType": entry.activityType ? entry.activityType : ""
        }
        appendInOrder(dayEntry)
    }
    if (JSON.stringify(result) === "[]") { //Add fake entry if no lessons found
        addFakeEntry(i18n.tr("There are no lessons today."))
    }
}

function appendInOrder(entry) {
    periodsModel.append(entry)
}

function addFakeEntry(text) {
    var fakeEntry = {
        "id": 0,
        "foreColor": "#" + getColorByCode("message")[0],
        "backColor": "#" + getColorByCode("message")[1],
        "date": 0,
        "startTime": getTime("00000000", "0000"),
        "endTime": getTime("00000000", "0000"),
        "klassen": "",
        "teacher": "",
        "subject": text,
        "room": "",
        "code": "",
        "lstext": "",
        "statflags": "",
        "activityType": ""
    }
    appendInOrder(fakeEntry)
    log("Add fake entry: " + text)
}

function Timer() {
    return Qt.createQmlObject("import QtQuick 2.0; Timer {}", root);
}

function delay(delayTime, _callBack) {
    var timer = new Timer();
    timer.interval = delayTime;
    timer.repeat = false;
    timer.triggered.connect(_callBack);
    timer.start();
}

//TODO: Unreadable should be changed
function sendRequest(method, params, _callBack) {
    if (state === STATES.loggedOut && method !== "authenticate") {
        requireLogin(function () {
            sendRequest(method, params, _callBack)
        })
    }
    else {
        if (method !== "authenticate" || method !== "logout") {
            activeRequests++
            nextDayAction.enabled = false;
            previousDayAction.enabled = false;
        }

        var request = new XMLHttpRequest()
        request.open("POST", serverUrl, true)
        request.setRequestHeader("Content-Type", "application/json");
        if (sessionId !== "") request.setRequestHeader("JSESSIONID", sessionId)

        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (method !== "authenticate" || method !== "logout") {
                    activeRequests--
                    if (activeRequests == 0) {
                        requireLogout()
                        nextDayAction.enabled = true;
                        previousDayAction.enabled = true;
                    }
                }
                if (request.status && request.status == 200) {
                    var result = JSON.parse(request.responseText)
                    if (result.error) {
                        log("API Error: " + result.error.message)
                    } else {
                        _callBack(result.result)
                    }
                } else {
                    log("HTTP Error: " + request.status + request.statusText)
                    if (method === "authenticate") state = STATES.loggedOut
                    else if (method === "logout") state = STATES.loggedIn
                }
            }
        }
        var data = JSON.stringify({
            "id": getId(),
            "method": method,
            "params": params,
            "jsonrpc": "2.0"
        })
        if (method === "authenticate") log("SEND {authentication data}")
        else log("SEND " + data)
        request.send(data)
    }
}

function getLoginParams(){
    return {
        "user": user,
        "password": password,
        "client": client
    }
}

function requireLogin(_callBack) {
    switch (state) {
        case STATES.loggedOut:
            state = STATES.pendingLogin
            sendRequest("authenticate", getLoginParams(), function (result) {
                sessionId = result.sessionId
                personType = result.personType
                personId = result.personId
                state = STATES.loggedIn
                _callBack()
            })
            break;
        case STATES.pendingLogin:
            log("Loggin pending, wait")
            delay(100, function () {
                requireLogin(function () {
                    _callBack();
                })
            })
            break;
        case STATES.loggedIn:
            _callBack()
            break;
        case STATES.pendingLogout:
            log("Loggout pending, wait")
            delay(100, function () {
                requireLogin(function () {
                    _callBack();
                })
            })
            break;
    }
}

function requireLogout() {
    switch (state) {
        case STATES.loggedOut:
            break;
        case STATES.pendingLogin:
            //Logout will be triggered by another function
            break;
        case STATES.loggedIn:
            state = STATES.pendingLogout
            sendRequest("logout", "{}", function (result) {
                if (result === null) {
                    sessionId = ""
                    personType = ""
                    personId = ""
                    state = STATES.loggedOut
                    log(i18n.tr("Logout completed!"))
                } else {
                    log("ERROR: logout failed: " + JSON.stringify(result))
                    state = STATES.loggedIn
                }
            })
            break;
        case STATES.pendingLogout:
            break;
    }
}

function dataProvided(){
    if (user === "") {
        log(i18n.tr("No username set"))
        return 1
    } else if (password === "") {
        log(i18n.tr("No password set"))
        return 1
    } else if (school === "") {
        log(i18n.tr("No school set"))
        return 1
    } else if (server === "") {
        log(i18n.tr("No server set"))
        return 1
    }
    return 0
}

function getDay() {
    if (dataProvided() === 1){
        return
    }
    loadOtherData()
    requireLogin(function () {
        //Must be logged in to get personId etc.
        var param = {
            "id": personId,
            "type": personType,
            "startDate": selectedDate.toLocaleDateString(Qt.locale(), "yyyyMMdd"),// eg. "20231016",
            "endDate": selectedDate.toLocaleDateString(Qt.locale(), "yyyyMMdd")
        }
        sendRequest("getTimetable", param, function (result) {
            handleTimetableData(result)
            if (showTimestamp) {
                timestampLabel.text = new Date().toLocaleString(Locale.ShortFormat)
            }
        })
    })
}

function loadOtherData() {
    requireLogin(function () {
        if (rooms == "") {
            sendRequest("getRooms", "{}", function (result) {
                log("Updateing rooms")
                rooms = JSON.stringify(result)
            })
        }
        if (subjects == "") {
            sendRequest("getSubjects", "{}", function (result) {
                log("Updateing subjects")
                subjects = JSON.stringify(result)
            })
        }
        if (teacher == "") {
            sendRequest("getTeachers", "{}", function (result) {
                log("Updateing teachers")
                teacher = JSON.stringify(result)
            })
        }
        if (klassen == "") {
            sendRequest("getKlassen", "{}", function (result) {
                log("Updateing klassen")
                klassen = JSON.stringify(result)
            })
        }
        if (statusData == ""){
            sendRequest("getStatusData", "{}", function (result) {
                log("Updateing statusData")
                statusData = JSON.stringify(result)
            })
        }
    })
}

function clearOtherData() {
    console.log(statusData)
    rooms = "";
    subjects = "";
    teacher = "";
    klassen = "";
    statusData = "";
    log("Cleared data")
}
