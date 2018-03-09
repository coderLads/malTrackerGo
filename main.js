// require dependencies
const electron = require('electron')
const fs = require('fs')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

// setup window objects
let mainWindow
let win

// create window handler
function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        frame: false,
        icon: __dirname + '/images/icon.png',
    })

    // Remove menu
    mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`)

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        mainWindow = null
        if (win != null) { // if there is a secondary window, close it
            win = null
        }
    })

    mainWindow.webContents.on('new-window', (event, url) => { // if a new window is made, initialize it with different settings
        event.preventDefault()
        win = new BrowserWindow({
            frame: true,
            width: 1300,
            height: 700
        })
        win.setMenu(null)
        win.once('ready-to-show', () => win.show())
        win.loadURL(url)
        event.newGuest = win
    })
}

app.on('ready', createWindow)


app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    if (mainWindow === null) {
        createWindow()
    }
})

// if a settings file does not exist, create it