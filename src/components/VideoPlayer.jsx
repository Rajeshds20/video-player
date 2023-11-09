import React, { useRef, useEffect, useState } from 'react';

const VideoPlayer = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const playPauseVideo = () => {
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    // const handleFileChange = (event) => {
    //     const file = event.target.files[0];
    //     const videoUrl = URL.createObjectURL(file);
    //     videoRef.current.src = videoUrl;
    // };

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        // Check if the selected file is a video
        if (file.type.startsWith('video/')) {
            // Create a video element to check for audio support
            const videoElement = document.createElement('video');
            videoElement.src = URL.createObjectURL(file);

            // Check if the video can play with audio
            const canPlayWithAudio = videoElement.canPlayType('audio/mp4');
            if (canPlayWithAudio === 'probably' || canPlayWithAudio === 'maybe') {
                videoRef.current.src = videoElement.src;
                setIsPlaying(false); // Reset play/pause state
            } else {
                // Video does not have audio support, show an error message or handle accordingly
                alert('Selected video does not have audio.');
                event.target.value = ''; // Clear the file input
            }
        } else {
            // Selected file is not a video, show an error message or handle accordingly
            alert('Please select a valid video file.');
            event.target.value = ''; // Clear the file input
        }
    };


    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const drawFrame = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);
        };

        video.addEventListener('play', () => {
            drawFrame();
        });

        return () => {
            video.removeEventListener('play', drawFrame);
        };
    }, []);

    return (
        <div style={{ textAlign: 'center' }}>
            <input type="file" accept="video/*" onChange={handleFileChange} />
            <br />
            <video
                ref={videoRef}
                width="640"
                height="360"
                controls
                style={{ display: 'none' }}
            >
                Your browser does not support the video tag.
            </video>
            <canvas
                ref={canvasRef}
                width="640"
                height="360"
                style={{ border: '1px solid black' }}
            ></canvas>
            <br />
            <button onClick={playPauseVideo}>
                {isPlaying ? 'Pause' : 'Play'}
            </button>
        </div>
    );
};

export default VideoPlayer;
