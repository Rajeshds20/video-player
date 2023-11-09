import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css'
import VideoPlayer from './components/VideoPlayer'
import { useDropzone } from 'react-dropzone';
import WaveSurfer from 'wavesurfer.js';
import PauseIcon from './assets/pause.png';
import PlayArrowIcon from './assets/play.png';

function App() {

  const [videoSrc, setVideoSrc] = useState('');
  // const [audioPresent, setAudioPresent] = useState(false);
  const [wavesurfer, setWavesurfer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [presentTime, setPresentTime] = useState(0);

  let timer = 0;

  const videoRef = useRef(null);
  const waveformRef = useRef(null);
  const canvasRef = useRef(null);

  const drawFrame = useCallback(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext('2d');

    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    requestAnimationFrame(drawFrame);
  }, []);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];

    // Accept only video files
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file');
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    setVideoSrc(videoUrl);

    try {
      // Load the video file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Decode the audio data from the ArrayBuffer
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Analyze the audio data
      const audioData = audioBuffer.getChannelData(0); // Get the audio data for the first channel (assuming mono audio)

      // Check if the frequency of the audio is non-zero
      const isNonZeroFrequency = audioData.some(sample => sample !== 0);

      if (!isNonZeroFrequency) {
        // Video has zero frequency audio, reject the file
        alert('The video file has no audio');
        setVideoSrc(null);
        return;
      }
    } catch (error) {
      console.error('Error decoding audio data:', error);
      alert('Error decoding audio data. Please try again.');
      setVideoSrc(null);
      return;
    }

    const videoElement = videoRef.current;
    // videoElement.src = videoUrl
    videoElement.load();

    videoElement.addEventListener('loadedmetadata', () => {
      const metadata = document.getElementById('vidmd');
      metadata.innerHTML = 'Video duration: ' + videoElement.duration + ' seconds<br>' +
        'Video type: ' + file.type + '<br>' +
        'Video size: ' + file.size + ' bytes<br>';
    });

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(videoElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(dataArray);
    console.log(JSON.stringify(dataArray));
    // setAudioPresent(dataArray.some(value => value !== 0));

    const wavesurferInstance = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
    });

    wavesurferInstance.load(videoUrl);
    setWavesurfer(wavesurferInstance);

    wavesurferInstance.setVolume(0);

    videoElement.addEventListener('loadeddata', () => {
      const metadata = document.getElementById('vidmd');
      metadata.innerHTML = 'Total Video duration: ' + formatTime(videoElement.duration) + ' seconds<br>' +
        'Video type: ' + file.type + '<br>' +
        'Video Name: ' + file.name + '<br>' +
        'Video size: ' + convertSize(file.size) + '<br>' +
        'Video resolution: ' + videoElement.videoWidth + 'x' + videoElement.videoHeight;
    });

    videoElement.addEventListener('play', () => {
      drawFrame();
      wavesurferInstance.play();
      timer = setInterval(() => {
        setPresentTime(videoElement.currentTime);
      }, 1000);
    });

    videoElement.addEventListener('pause', () => {
      wavesurferInstance.pause();
      cancelAnimationFrame(drawFrame);
      setPresentTime(videoElement.currentTime);
      clearInterval(timer);
    });

    wavesurferInstance.on('seek', (progress) => {
      videoElement.currentTime = progress * videoElement.duration;
    });

    wavesurferInstance.on('audioprocess', () => {
      const progress = videoElement.currentTime / videoElement.duration;
      wavesurferInstance.seekTo(progress);
    });

    videoElement.addEventListener('ended', () => {
      wavesurferInstance.seekTo(0);
      videoElement.currentTime = 0;
      cancelAnimationFrame(drawFrame);
    });

    // If the video is moved to certain time, update the wavesurfer progress
    videoElement.addEventListener('timeupdate', () => {
      const progress = videoElement.currentTime / videoElement.duration;
      wavesurferInstance.seekTo(progress);
    });
  };

  useEffect(() => {
    if (videoSrc && videoRef.current && !isPlaying) {
      videoRef.current.pause();
      cancelAnimationFrame(drawFrame);
    } else if (videoSrc && videoRef.current) {
      videoRef.current.play();
    }
  }, [drawFrame, isPlaying, videoSrc]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'video/*',
    maxFiles: 1,
  });

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec - minutes * 60);
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }

  const convertSize = (size) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (size === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(size) / Math.log(1024)));
    return Math.round(size / Math.pow(1024, i)) + ' ' + sizes[i];
  }

  return (
    <div className='App'>
      <div className='vidInput' {...getRootProps()}>
        <input {...getInputProps()} />
        <p>Drop a video file here, or click to select one</p>
      </div>

      {videoSrc && (
        <div style={{ textAlign: 'center' }}>
          <video ref={videoRef} width="0" height="0" style={{ display: 'none' }} >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className='container'>
            <div className='playerContainer' onClick={() => {
              setIsPlaying(!isPlaying);
            }}>
              <button className='playButton'>
                {/* {isPlaying ? 'Pause' : 'Play'} */}
                {
                  isPlaying ?
                    <img className={`pauseImg ${isPlaying ? '' : 'invisible'}`} src={PauseIcon} alt="Pause" />
                    : <img className={`playImg ${isPlaying ? 'invisible' : ''}`} src={PlayArrowIcon} alt="Play" />
                }
              </button>
              <canvas id='vidcanvas' className={`canvasvid ${isPlaying ? '' : 'paused'}`} ref={canvasRef} width="640" height="360" style={{ border: '1px solid black' }}></canvas>
            </div>
            <div className='metadataCont'>
              <h3>Metadata :</h3>
              <div>
                {videoRef.current && (
                  <p>Time : {formatTime(presentTime)}/{formatTime(videoRef.current.duration)}</p>
                )}
                <p id='vidmd' style={{ color: 'white' }}></p>
              </div>
            </div>
          </div>
          {/* {audioPresent && ( */}
          <div style={{ marginTop: '20px' }}>
            <h2>Audio Waveform</h2>
            <div ref={waveformRef}></div>
          </div>
          {/* )} */}
        </div>
      )}
    </div>
  )
}

export default App
