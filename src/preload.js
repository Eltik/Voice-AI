const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld("electronAPI", {
    startRecording: (title) => ipcRenderer.send("start-record", title),
    stopRecording: (title) => ipcRenderer.send("stop-record", title)
})