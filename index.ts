// Function to request access to audio and video
function requestMediaAccess() {
    const constraints = {
      video: true,
      audio: true
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        // Media access granted, do something with the stream if needed
        stream.getTracks().forEach(track => track.stop());  // Stop the stream immediately after getting access
      })
      .catch((error) => {
        console.error('Error accessing media devices.', error);
      });
  }

  // Call the function when the site opens
  requestMediaAccess();



// We're going to work with HTML elements, so let's get references to them
const videoMonitor = document.getElementById('videoMonitor') as HTMLVideoElement;
const videoMonitorButton = document.getElementById('videoMonitorButton') as HTMLButtonElement;
const recordButton = document.getElementById('recordButton') as HTMLButtonElement;
const stopButton = document.getElementById('stopButton') as HTMLButtonElement;
const playbackButton = document.getElementById('playbackButton') as HTMLButtonElement;

let mediaRecorder: MediaRecorder;
let recordedBlobs: BlobPart[];
let currentStream: MediaStream | null = null;

// Monitor video on/off
// Monitor video on/off
videoMonitorButton.addEventListener('click', () => {
    if (videoMonitor.srcObject) {
        stopVideoStream();
        videoMonitor.srcObject = null;
        videoMonitorButton.textContent = 'Monitor Video On';
    } else {
        const constraints = {
            video: {
                deviceId: videoInputSelect.value ? {exact: videoInputSelect.value} : undefined
            }
        };

        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            currentStream = stream;
            videoMonitor.srcObject = stream;
            videoMonitorButton.textContent = 'Monitor Video Off';
        });
    }
});

// Start recording
recordButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({video: true}).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        recordedBlobs = [];
        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedBlobs.push(event.data);
            }
        };
        mediaRecorder.start();
    });
});

// Stop recording
stopButton.addEventListener('click', () => {
    if (mediaRecorder) {
        mediaRecorder.stop();
    }
});

// Playback
playbackButton.addEventListener('click', () => {
    const blob = new Blob(recordedBlobs, {type: 'video/webm'});
    videoMonitor.src = URL.createObjectURL(blob);
    videoMonitor.controls = true;
    videoMonitor.play();
});

// Obtain a reference to the video input select element
const videoInputSelect = document.getElementById('videoInputSelect') as HTMLSelectElement;

// Function to populate video input select
function populateVideoInputs() {
  // Get all video input devices
  navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      devices.forEach(device => {
        if (device.kind === 'videoinput') {
          // Create a new option element for each video input device
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.text = device.label;
          videoInputSelect.appendChild(option);
        }
      });
    })
    .catch(error => console.error('Error accessing media devices.', error));
}

// Call the function to populate the video input select
populateVideoInputs();

// Stop the current video stream
function stopVideoStream() {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
}

// Obtain a reference to the audio input select element
const audioInputSelect = document.getElementById('audioInputSelect') as HTMLSelectElement;

// Function to populate audio input select
function populateAudioInputs() {
  // Get all audio input devices
  navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      console.log({devices})
      devices.forEach(device => {
        if (device.kind === 'audioinput') {
          // Create a new option element for each audio input device
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.text = device.label;
          audioInputSelect.appendChild(option);
        }
      });
    })
    .catch(error => console.error('Error accessing media devices.', error));
}

// Call the function to populate the audio input select
populateAudioInputs();
