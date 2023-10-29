import QtQuick 2.12

Rectangle {
    width: parent.width
    height: units.gu(10)
    border.color: theme.palette.normal.base
    color: backColor ? backColor : "yellow"
    Text {
        id: startTimeId
        anchors.top: parent.top
        anchors.left: parent.left
        //TRANSLATORS: Format of the day in timetable.
        text: startTime ? startTime.toLocaleTimeString(Qt.locale(), i18n.tr("h:mm")) : ""
    }
    Text {
        id: endTimeId
        anchors.top: parent.top
        anchors.right: parent.right
        text: endTime ? endTime.toLocaleTimeString(Qt.locale(), i18n.tr("h:mm")) : ""
    }
    Text {
        id: roomId
        anchors.top: parent.top
        anchors.horizontalCenter: parent.horizontalCenter
        text: room ? room : ""
    }
    Text {
        id: subjectId
        anchors.centerIn: parent
        text: subject ? subject : ""
        color: foreColor ? foreColor : "#000000"
    }
    Text {
        id: klassenId
        anchors.verticalCenter: parent.verticalCenter
        anchors.left: parent.left
        text: klassen ? klassen : ""
    }
    Text {
        id: teacherId
        anchors.verticalCenter: parent.verticalCenter
        anchors.right: parent.right
        text: teacher ? teacher : ""
    }
    Text {
        id: codeId
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        text: code ? code : ""
    }
    Text {
        id: activityId
        anchors.bottom: parent.bottom
        anchors.right: parent.right
        text: activityType ? activityType : ""
    }
}
