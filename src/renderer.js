let isRecording = false;

const startRecording = document.getElementById("startRecord")
const stopRecording = document.getElementById("stopRecord")

startRecording.addEventListener("click", () => {
    window.electronAPI.startRecording("Now recording...")
    isRecording = true;
});

stopRecording.addEventListener("click", () => {
    window.electronAPI.stopRecording("Stopped Recording")
    isRecording = false;
});

document.onkeydown = function (e) {
    if (e.key === "p" && !isRecording) {
        startRecording.click()
    }
}

document.onkeyup = function (e) {
    if (e.key === "p") {
        stopRecording.click()
    }
}