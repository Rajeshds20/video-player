import { useDropzone } from "react-dropzone";

export default function InputFile(onDrop) {

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: 'video/*',
        maxFiles: 1,
    });

    return (
        <div {...getRootProps()} style={{ textAlign: 'center', margin: '20px', cursor: 'grab', height: '400px', backgroundColor: 'gray' }}>
            <input {...getInputProps()} />
            <p>Drop a video file here, or click to select one</p>
        </div>
    )
}
