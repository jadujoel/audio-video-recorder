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
const videoInputSelect = document.getElementById('videoInputSelect') as HTMLSelectElement;
const videoMonitor = document.getElementById('videoMonitor') as HTMLVideoElement;
const videoMonitorButton = document.getElementById('videoMonitorButton') as HTMLButtonElement;
const recordButton = document.getElementById('recordButton') as HTMLButtonElement;
const playbackButton = document.getElementById('playbackButton') as HTMLButtonElement;
const audioMonitorButton = document.getElementById('audioMonitorButton') as HTMLButtonElement;
const recordingsSelect = document.getElementById('recordingsSelect') as HTMLSelectElement;
const audioToggle = document.getElementById('audioToggle') as HTMLButtonElement;
const nameInput = document.getElementById('name') as HTMLInputElement;

let audioContext: AudioContext | null = null;
let audioSource: MediaStreamAudioSourceNode | null = null;
let audioSourceNode: AudioNode | null = null;

let mediaRecorder: MediaRecorder;
let recordedBlobs: BlobPart[];
let currentStream: MediaStream | null = null;

let channelCount = 1; // Default to mono
let isRecording = false;
// Array to store the recordings
let recordings: {readonly name: string, readonly url: string}[] = [];

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
            },
            audio: getAudioConstraints()
        };

        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            currentStream = stream;
            videoMonitor.srcObject = stream;
            videoMonitorButton.textContent = 'Monitor Video Off';
        });
    }
});


// Toggle Mono/Stereo
audioToggle.addEventListener('click', () => {
    channelCount = (channelCount === 1 ? 2 : 1); // Toggle between 1 and 2
    audioToggle.textContent = (channelCount === 1 ? 'Toggle Mono/Stereo (Currently Mono)' : 'Toggle Mono/Stereo (Currently Stereo)');
});

function getAudioConstraints() {
    return {
        deviceId: audioInputSelect.value ? {exact: audioInputSelect.value} : undefined,
        sampleRate: 48000,
        channelCount,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
    } as const;
}

// Monitor audio on/off
audioMonitorButton.addEventListener('click', async () => {
  if (audioContext) {
      // We're currently monitoring audio, so stop
      audioSourceNode?.disconnect();
      audioContext.close();

      audioContext = null;
      audioSourceNode = null;

      audioMonitorButton.textContent = 'Monitor Audio On';
  } else {
      // We're not currently monitoring audio, so start
      const constraints = {
          audio: getAudioConstraints()
      };

      try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);

          audioContext = new AudioContext();

          // If stereo is disabled, we need to create a mono source
          if (channelCount === 2) {
              audioSourceNode = audioContext.createMediaStreamSource(stream);
          } else {
              // Create a mono source by splitting the stereo signal and merging the two channels into one
              const splitter = audioContext.createChannelSplitter(2);
              const merger = audioContext.createChannelMerger(1);
              const source = audioContext.createMediaStreamSource(stream);

              source.connect(splitter);
              splitter.connect(merger, 0, 0);
              splitter.connect(merger, 1, 0);

              audioSourceNode = merger;
          }

          // Create a gain node to control volume and connect it to the source and destination
          const gainNode = audioContext.createGain();
          audioSourceNode.connect(gainNode);
          gainNode.connect(audioContext.destination);

          audioMonitorButton.textContent = 'Monitor Audio Off';
      } catch (error) {
          console.error('Error accessing audio device.', error);
      }
  }
});


recordButton.addEventListener('click', () => {
    if (isRecording) {
        // Stop recording
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
        recordButton.textContent = 'Start Recording';
        isRecording = false;
    } else {
        // Start recording
        const constraints = {
            video: {deviceId: videoInputSelect.value ? {exact: videoInputSelect.value} : undefined},
            audio: {
                deviceId: audioInputSelect.value ? {exact: audioInputSelect.value} : undefined,
                sampleRate: 48000,
                channelCount: channelCount,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        };

        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            recordedBlobs = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedBlobs.push(event.data);
                }
            };
            mediaRecorder.start();
            isRecording = true;
            recordButton.textContent = 'Stop Recording';
            mediaRecorder.onstop = () => {
              const blob = new Blob(recordedBlobs, {type: 'video/webm'});
              const url = URL.createObjectURL(blob);
              const clipName = nameInput.value || `Recording ${recordingsSelect.length + 1}`;

              // Add to the array of recordings
              recordings.push({name: clipName, url: url});

              const option = document.createElement('option');
              option.text = clipName;
              option.value = url;
              recordingsSelect.appendChild(option);
              playbackButton.disabled = false;
              // Clear the name input field for the next recording
              nameInput.value = '';
          };



        });
    }
});


// Playback
playbackButton.addEventListener('click', () => {
  const selectedOption = recordingsSelect.options[recordingsSelect.selectedIndex];
  if (playbackButton.textContent === 'Playback') {
      videoMonitor.src = selectedOption.value;
      videoMonitor.controls = true;
      videoMonitor.play();
      playbackButton.textContent = 'Stop Playback';
  } else {
      videoMonitor.pause();
      videoMonitor.controls = false;
      playbackButton.textContent = 'Playback';
  }
});


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
