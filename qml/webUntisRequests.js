let id = 0

let sessionId = ""
let personType = ""
let personId = ""
let klasseId = ""

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
    for (const i in Obj) {
        const it = Obj[i]
        if (it.id === id) {
            return it.longName ? it.name + " (" + it.longName + ")" : it.name
        }
    }
    log("WARN: no match for id " + id)
    return i18n.tr("NO MATCH")
}

function getDataByIds(ids, objectString) {
    let object = {}
    if (objectString !== ""){
        object = JSON.parse(objectString)
    }

    let result = ""
    for (const i in ids) {
        result = result + " " + iterateOver(ids[i].id, object)
    }
    return result
}

function getTime(date, time) {
    const _date = String(date)
    let _time = String(time)
    if (_time.length === 3) {
        _time = "0" + _time
    }
    const result = new Date(
        _date.substring(0, 4),
        //Month must be corrected to start with 0
        parseInt(_date.substring(4, 6)) - 1,
        _date.substring(6, 8),
        _time.substring(0, 2),
        _time.substring(2, 4)
    )
    return result
}

function getColorByCode(code){
    let foreColor = "000000";
    let backColor = "f49f25";
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
    for (const i in result) {
        log(`Add entry ${i}: ${JSON.stringify(result[i])}`)
        const entry = result[i]
        const dayEntry = {
            id: entry.id,
            foreColor: "#" + getColorByCode(entry.code)[0],
            backColor: "#" + getColorByCode(entry.code)[1],
            date: entry.date,
            startTime: getTime(entry.date, entry.startTime),
            endTime: getTime(entry.date, entry.endTime),
            klassen: entry.kl ? getDataByIds(entry.kl, klassen) : "",
            teacher: entry.te ? getDataByIds(entry.te, teacher) : "",
            subject: entry.su ? getDataByIds(entry.su, subjects) : "",
            room: entry.ro ? getDataByIds(entry.ro, rooms) : "",
            code: entry.code ? entry.code : "",
            lstext: entry.lstype ? entry.lstype : "",
            statflags: entry.statflags ? entry.statflags : "",
            activityType: entry.activityType ? entry.activityType : ""
        }
        appendInOrder(dayEntry)
    }
    if (JSON.stringify(result) === "[]") { //Add fake entry if no lessons found
        addFakeEntry(i18n.tr("There are no lessons today."))
    }
}

//TODO: append sorted by time. Maybe in qml?
function appendInOrder(entry) {
    periodsModel.append(entry)
    listView.listModelSort(periodsModel, (a,b) => (a.startTime - b.startTime))
}

function addFakeEntry(text) {
    const fakeEntry = {
        id: 0,
        foreColor: "#" + getColorByCode("message")[0],
        backColor: "#" + getColorByCode("message")[1],
        date: 0,
        startTime: getTime("00000000", "0000"),
        endTime: getTime("00000000", "0000"),
        klassen: "",
        teacher: "",
        subject: text,
        room: "",
        code: "",
        lstext: "",
        statflags: "",
        activityType: ""
    }
    appendInOrder(fakeEntry)
    log("Add fake entry: " + text)
}

function getLoginParams(){
    return {
        user: user,
        password: password,
        client: client
    }
}

function sendRequest(method, params){
    let promise = new Promise(function(resolve, reject){
        //Skip request when already logged in
        //TODO: The sendRequest should not even be called when already logged in
        if (sessionId !== "" && method === "authenticate"){
            resolve({
                sessionId: sessionId,
                personType: personType,
                personId: personId})
            return
        }

        const request = new XMLHttpRequest()
        request.open("POST", serverUrl, true)
        request.setRequestHeader("Content-Type", "application/json");
        if (sessionId !== "") request.setRequestHeader("JSESSIONID", sessionId)
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status && request.status === 200) {
                    const result = JSON.parse(request.responseText)
                    if (result.error) {
                        reject("API Error: " + result.error.message)
                    } else {
                        resolve(result.result)
                    }
                } else {
                    reject("HTTP Error: " + request.status + request.statusText)
                }
            }
        }
        const data = JSON.stringify({id: getId(), method: method, params: params, jsonrpc: "2.0"})
        if (method === "authenticate") log("SEND {authentication data}")
        else log("SEND " + data)
        request.send(data)
    })
    return promise
}

function isDataProvided(){
    if (user === "") {
        log(i18n.tr("No username set. Go to settings to set one."))
        return false
    }if (password === "") {
        log(i18n.tr("No password set. Go to settings to set one."))
        return false
    }if (school === "") {
        log(i18n.tr("No school set. Go to settings to set one."))
        return false
    }if (server === "") {
        log(i18n.tr("No server set. Go to settings to set one."))
        return false
    }
    return true
}

function logout(attempt = 0){
    if (attempt <= 3){
        attempt++
        if (sessionId === ""){
            return
        }
        sendRequest("logout", "{}").then(
            function (result) {
                sessionId = ""
                personType = ""
                personId = ""
                log("Logout done!")
            },
            function (error){
                log("error:" + error + "attempt: " + attempt)
                logout(attempt)
            })
    }
}



function getDay(){
    if (isDataProvided() !== true){
        //TODO: log message
        return
    }
    loading = true;
    loadOtherData().then(
        function(){
            sendRequest("authenticate", getLoginParams()).then(
                function (result) {
                    sessionId = result.sessionId
                    personType = result.personType
                    personId = result.personId
                    const param = {
                        id: personId,
                        type: personType,
                        startDate: selectedDate.toLocaleDateString(Qt.locale(), "yyyyMMdd"),// eg. "20231016",
                        endDate: selectedDate.toLocaleDateString(Qt.locale(), "yyyyMMdd")
                    }
                    sendRequest("getTimetable", param,).then(
                        function (result){
                            handleTimetableData(result)
                            if (showTimestamp) {
                                timestampLabel.text = new Date().toLocaleString(Locale.ShortFormat)
                            }
                            logout()
                            loading = false
                        },
                        function (error){
                            console.log(error)
                            loading = false
                            logout()
                        }
                    )},
                function (error){
                    console.log(error)
                    loading = false
                })
        },
        function (error){
            log("Fetching cache failed")
            loading = false
        })
}

function loadOtherData() {
    let promise = new Promise(function(resolve, reject){
        sendRequest("authenticate", getLoginParams()).then(
            function (result){
                sessionId = result.sessionId
                personType = result.personType
                personId = result.personId
                if (rooms === "") {
                    log("Updateing rooms")
                    sendRequest("getRooms", "{}").then(
                        function (result) {rooms = JSON.stringify(result)},
                        function (error) {log(error)}
                    )
                }
                if (subjects === "") {
                    log("Updateing subjects")
                    sendRequest("getSubjects", "{}").then(
                        function (result) {subjects = JSON.stringify(result)},
                        function (error) {log(error)}
                    )
                }
                if (teacher === "") {
                    log("Updateing teachers")
                    sendRequest("getTeachers", "{}").then(
                        function (result) {teacher = JSON.stringify(result)},
                        function (error) {log(error)}
                    )
                }
                if (klassen === "") {
                    log("Updateing Klassen")
                    sendRequest("getKlassen", "{}").then(
                        function (result) {klassen = JSON.stringify(result)},
                        function (error) {log(error)}
                    )
                }
                if (statusData === ""){
                    log("Updateing statusData")
                    sendRequest("getStatusData", "{}").then(
                        function (result) {statusData = JSON.stringify(result)},
                        function (error) {log(error)}
                    )
                }
                //TODO: resolve when all functions returned true
                resolve()
            },
            function (error){
                console.log(error)
                reject(error)
            })
    })
    return promise
}

function clearOtherData() {
    rooms = "";
    subjects = "";
    teacher = "";
    klassen = "";
    statusData = "";
    log("Cleared data")
}
