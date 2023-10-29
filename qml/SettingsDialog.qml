import QtQuick 2.12
import QtQuick.Controls 2.12
import Lomiri.Components 1.3
import Lomiri.Components.Popups 1.3

Dialog {
    id: dialog
    title: "Settings"
    theme: ThemeSettings { //force dark layout on popup
        name: "Lomiri.Components.Themes.SuruDark"
    }
    Column {
        Text {
            id: serverText
            anchors.horizontalCenter: parent.horizontalCenter
            text: i18n.tr("Server:")
            color: theme.palette.normal.baseText
        }
        TextField {
            id: serverTextField
            anchors.horizontalCenter: parent.horizontalCenter
            placeholderText: i18n.tr("xxxx.webuntis.com")
            text: server
            onTextChanged: serverUrlTextArea.text = "https://" + serverTextField.text
                           + "/WebUntis/jsonrpc.do?school=" + schoolTextField.text
        }

        Text {
            id: schoolText
            anchors.horizontalCenter: parent.horizontalCenter
            text: i18n.tr("School:")
            color: theme.palette.normal.baseText
        }
        TextField {
            id: schoolTextField
            anchors.horizontalCenter: parent.horizontalCenter
            placeholderText: i18n.tr("School")
            text: school
            onTextChanged: serverUrlTextArea.text = "https://" + serverTextField.text
                           + "/WebUntis/jsonrpc.do?school=" + schoolTextField.text
        }

        Text {
            id: serverUrlText
            text: i18n.tr("Request will be send to:")
            anchors.horizontalCenter: parent.horizontalCenter
            color: theme.palette.normal.baseText
        }
        TextArea {
            id: serverUrlTextArea
            anchors.horizontalCenter: parent.horizontalCenter
            readOnly: true
            color: theme.palette.normal.baseText
            text: serverUrl
        }

        Text {
            id: clientText
            anchors.horizontalCenter: parent.horizontalCenter
            text: i18n.tr("Client name:")
            color: theme.palette.normal.baseText
        }
        TextField {
            id: clientTextField
            anchors.horizontalCenter: parent.horizontalCenter
            placeholderText: i18n.tr("Client")
            text: client
        }

        Text {
            id: usernameText
            anchors.horizontalCenter: parent.horizontalCenter
            text: i18n.tr("Username:")
            color: theme.palette.normal.baseText
        }
        TextField {
            id: usernameTextField
            anchors.horizontalCenter: parent.horizontalCenter
            placeholderText: i18n.tr("Username")
            text: user
        }

        Text {
            id: passwordText
            anchors.horizontalCenter: parent.horizontalCenter
            text: i18n.tr("Password:")
            color: theme.palette.normal.baseText
        }
        TextField {
            id: passwordTextField
            anchors.horizontalCenter: parent.horizontalCenter
            placeholderText: i18n.tr("Password")
            echoMode: TextInput.Password
            text: password
        }

        CheckBox {
            id: showLogCheckBox
            text: i18n.tr("Show Log")
            checked: showLog
        }

        CheckBox {
            id: showWatermarkCheckBox
            text: i18n.tr("Show TimeStamp")
            checked: showTimestamp
        }

        CheckBox {
            id: startupRequestCheckBox
            text: i18n.tr("Request at startup")
            checked: startupRequest
        }

        Row {
            spacing: units.gu(5)
            anchors.horizontalCenter: parent.horizontalCenter
            Button {
                text: i18n.tr("Close")
                onClicked: PopupUtils.close(dialog)
            }
            Button {
                text: i18n.tr("Save")
                color: theme.palette.normal.positive
                onClicked: {
                    server = serverTextField.text
                    school = schoolTextField.text
                    serverUrl = "https://" + server + "/WebUntis/jsonrpc.do?school=" + school

                    client = clientTextField.text
                    user = usernameTextField.text
                    password = passwordTextField.text

                    showLog = showLogCheckBox.checked
                    showTimestamp = showWatermarkCheckBox.checked
                    startupRequest = startupRequestCheckBox.checked
                    logLabel.text = showLog ? i18n.tr("Log enabled") : ""
                    timestampLabel.text = ""

                    PopupUtils.close(dialog)
                }
            }
        }
    }
}
