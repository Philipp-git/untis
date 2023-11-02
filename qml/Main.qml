
/*
 * Copyright (C) 2023  Philipp Rochlitz
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; version 3.
 *
 * untis is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import QtQuick 2.12
import Qt.labs.settings 1.1
import Lomiri.Components 1.3
import Lomiri.Components.Popups 1.3

import "webUntisRequests.js" as UntisRequest

//TODO About Dialog
//TODO Reliable and readable untisRequest
MainView {
    id: root
    objectName: 'mainView'
    applicationName: 'untis.philipp'
    automaticOrientation: true
    theme.name: "Lomiri.Components.Themes.SuruDark"
    width: units.gu(45)
    height: units.gu(75)

    property date selectedDate: new Date()

    property string server: ""
    property string school: ""
    property url serverUrl: "https://" + server + "/WebUntis/jsonrpc.do?school=" + school
    property string client: "ubuntu-touch"
    property string user: ""
    property string password: ""

    property bool showLog: true
    property bool showTimestamp: true
    property bool startupRequest: true

    //TODO: put into js
    property string sessionId: ""
    property string personType: ""
    property string personId: ""
    property string klasseId: ""

    property string rooms: ""
    property string subjects: ""
    property string klassen: ""
    property string teacher: ""
    property string statusData: ""

    Settings {
        id: settings
        property alias server: root.server
        property alias scool: root.school

        property alias client: root.client
        property alias user: root.user
        property alias password: root.password

        property alias showLog: root.showLog
        property alias showTimestamp: root.showTimestamp
        property alias startupRequest: root.startupRequest

        property alias rooms: root.rooms
        property alias subjects: root.subjects
        property alias klassen: root.klassen
        property alias teacher: root.teacher
        property alias statusDate: root.statusData
    }

    Component {
        id: dialogComponent
        SettingsDialog {}
    }

    ListModel {
        id: periodsModel
    }

    Action {
        id: previousDayAction
        iconName: "previous"
        text: i18n.tr("Previous day")
        description: i18n.tr("Go to the previous day.")
        onTriggered: {
            var date = selectedDate
            date.setDate(date.getDate() - 1)
            selectedDate = date
            periodsModel.clear()
            UntisRequest.getDay()
        }
    }
    Action {
        id: nextDayAction
        iconName: "next"
        text: i18n.tr("Next day")
        description: i18n.tr("Go to the next day.")
        onTriggered: {
            var date = selectedDate
            date.setDate(date.getDate() + 1)
            selectedDate = date
            periodsModel.clear()
            UntisRequest.getDay()
        }
    }
    Action {
        id: settingsAction
        iconName: "settings"
        text: i18n.tr("Settings")
        description: i18n.tr("Open the settings.")
        onTriggered: PopupUtils.open(dialogComponent)
    }
    Action {
        id: clearCacheAction
        iconName: "edit-clear"
        text: i18n.tr("Clear cache")
        description: i18n.tr("Delete the cached data.")
        onTriggered: UntisRequest.clearOtherData()
    }
    Action {
        id: reloadDayAction
        iconName: "reload"
        text: i18n.tr("Reload day")
        description: i18n.tr("Reload the current day.")
        onTriggered: {
            periodsModel.clear()
            UntisRequest.getDay()
        }
    }
    Action {
        id: fetchCacheAction
        iconName: "save-as"
        text: i18n.tr("Fetch cache")
        description: i18n.tr(
                         "Fetch the cache manually (could help when bugs appear).")
        onTriggered: {
            UntisRequest.loadOtherData()
        }
    }

    Page {
        anchors.fill: parent
        header: PageHeader {
            id: header
            //TRANSLATORS: Format of the day in header.
            subtitle: selectedDate.toLocaleDateString(Qt.locale(),
                                                      i18n.tr("d.M.yy"))
            title: i18n.tr("Untis")
            ActionBar {
                id: controlActionBar
                anchors {
                    verticalCenter: parent.verticalCenter
                    horizontalCenter: parent.horizontalCenter
                }
                numberOfSlots: 2
                actions: [nextDayAction, previousDayAction]
            }
            ActionBar {
                id: actionBar
                anchors {
                    top: parent.top
                    right: parent.right
                    topMargin: units.gu(1)
                    rightMargin: units.gu(1)
                }
                numberOfSlots: 2
                actions: [settingsAction, reloadDayAction, clearCacheAction, fetchCacheAction]
            }
        }
        ListView {
            id: listView
            anchors {
                top: header.bottom
                left: parent.left
                right: parent.right
                bottom: parent.bottom
            }
            model: periodsModel
            delegate: Lesson {}

            function listModelSort(listModel, compareFunction) {
                let indexes = [...Array(listModel.count).keys()]
                indexes.sort((a, b) => compareFunction(listModel.get(a),
                                                       listModel.get(b)))
                let sorted = 0
                while (sorted < indexes.length && sorted === indexes[sorted])
                    sorted++
                if (sorted === indexes.length)
                    return
                for (var i = sorted; i < indexes.length; i++) {
                    listModel.move(indexes[i], listModel.count - 1, 1)
                    listModel.insert(indexes[i], {})
                }
                listModel.remove(sorted, indexes.length - sorted)
            }
        }
        Label {
            id: timestampLabel
            color: theme.palette.normal.baseText
            anchors {
                left: parent.left
                bottom: parent.bottom
            }
            text: ""
        }
        Label {
            id: logLabel
            anchors {
                right: parent.right
                bottom: parent.bottom
            }
            text: ""
            color: theme.palette.normal.negative
            state: "Invisible"
            onTextChanged: {
                state = "Visible"
                state = "Invisible"
            }
            states: [
                State {
                    name: "Visible"
                    PropertyChanges {
                        target: logLabel
                        opacity: 1.0
                    }
                    PropertyChanges {
                        target: logLabel
                        visible: true
                    }
                },
                State {
                    name: "Invisible"
                    PropertyChanges {
                        target: logLabel
                        opacity: 0.0
                    }
                    PropertyChanges {
                        target: logLabel
                        visible: false
                    }
                }
            ]
            transitions: [
                Transition {
                    from: "Visible"
                    to: "Invisible"

                    SequentialAnimation {
                        NumberAnimation {
                            target: logLabel
                            property: "opacity"
                            duration: 5000
                            easing.type: Easing.InCubic
                        }
                        NumberAnimation {
                            target: logLabel
                            property: "visible"
                            duration: 0
                        }
                    }
                }
            ]
        }
    }
    Component.onCompleted: {
        if (startupRequest) {
            UntisRequest.getDay()
        }
    }
}
