// import React from "react";
// import Webcam from "react-webcam";
// import * as tf from '@tensorflow/tfjs';
// const faceLandmarksDetection = require('@tensorflow-models/face-landmarks-detection');
// class Capture1 extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       isOpen: false,
//       text: '',
//       count: 0,
//       model: null,
//       // for face out frame
//       maxLeft: 0,
//       maxRight: 0
//     };
//     this.webcamRef = React.createRef();
//   }

//   componentDidMount() {
//     tf.setBackend('webgl');
//     this.loadModel()
//   }

//   loadModel() {
//     // Load the MediaPipe Facemesh package.
//     // console.log("loading modal...");
//     faceLandmarksDetection.load(
//       faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
//       { maxFaces: 1 }
//     ).then(model => {
//       // console.log(model);
//       this.setState({ model })
//     }).catch(err => {
//       console.log(err);
//     });
//   }

//   handleClick() {
//     console.log('handleClick');
//     const { isOpen, count } = this.state
//     this.setState({
//       isOpen: !isOpen,
//       count: isOpen ? count : 0
//     }, () => {
//       if (!isOpen) {
//         setTimeout(() => {
//           this.setState({ detecting: 'detecting...' })
//           this.detectPoints()
//         }, 2000);
//       }
//     })
//   }

//   async detectPoints() {
//     const { model, isOpen, count } = this.state
//     const video = await this.webcamRef.current.video
//     // console.log(video);

//     const predictions = await model.estimateFaces({
//       input: video,
//       returnTensors: false,
//       flipHorizontal: true,
//       predictIrises: true
//     });

//     if (predictions.length > 0) {
//       // console.log(predictions[0].boundingBox);
//       // Somente 1 face
//       const keypoints = predictions[0].scaledMesh;
//       if (this.detectarBlink(keypoints)) {
//         // TODO :: Found blink, do someting
//         const countN = count + 1
//         this.setState({ count: countN })

//         if (!isOpen) {
//           // stop detection
//           this.setState({ detecting: '' })
//           return null;
//         }
//       }
//     } else {
//       this.setState({
//         maxLeft: 0,
//         maxRight: 0
//       })
//     }

//     setTimeout(async () => {
//       await this.detectPoints();
//     }, 40);
//   }

//   detectarBlink(keypoints) {
//     // point around left eye
//     const leftEye_left = 263;
//     const leftEye_right = 362;
//     const leftEye_top = 386;
//     const leftEye_buttom = 374;
//     // point around right eye
//     const rightEye_left = 133;
//     const rightEye_right = 33;
//     const rightEye_top = 159;
//     const rightEye_buttom = 145;

//     const leftVertical = this.calculateDistance(keypoints[leftEye_top][0], keypoints[leftEye_top][1], keypoints[leftEye_buttom][0], keypoints[leftEye_buttom][1]);
//     const leftHorizontal = this.calculateDistance(keypoints[leftEye_left][0], keypoints[leftEye_left][1], keypoints[leftEye_right][0], keypoints[leftEye_right][1]);
//     const eyeLeft = leftVertical / (2 * leftHorizontal);

//     const rightVertical = this.calculateDistance(keypoints[rightEye_top][0], keypoints[rightEye_top][1], keypoints[rightEye_buttom][0], keypoints[rightEye_buttom][1]);
//     const rightHorizontal = this.calculateDistance(keypoints[rightEye_left][0], keypoints[rightEye_left][1], keypoints[rightEye_right][0], keypoints[rightEye_right][1]);
//     const eyeRight = rightVertical / (2 * rightHorizontal);

//     // TODO :: Need more efficient implmentation
//     const baseCloseEye = 0.1
//     const limitOpenEye = 0.14
//     if (this.state.maxLeft < eyeLeft) {
//       this.setState({ maxLeft: eyeLeft })
//     }
//     if (this.state.maxRight < eyeRight) {
//       this.setState({ maxRight: eyeRight })
//     }

//     let result = false
//     if ((this.state.maxLeft > limitOpenEye) && (this.state.maxRight > limitOpenEye)) {
//       if ((eyeLeft < baseCloseEye) && (eyeRight < baseCloseEye)) {
//         result = true
//       }
//     }
//     // console.log(result);

//     return result
//   }

//   calculateDistance(x1, y1, x2, y2) {
//     return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
//   }

//   render() {
//     const videoConstraints = {
//       width: 720,
//       height: 480,
//       facingMode: "user"
//     };

//     return <div style={{ margin: 20 }}>
//       <div>
//         <button type="button" onClick={() => this.handleClick()}>Start/Stop</button>

//         <b> {this.state.detecting} </b>
//         <b> :: Count blink = {this.state.count} </b>
//       </div>

//       {this.state.isOpen ?
//         <Webcam
//           audio={false}
//           height={480}
//           ref={this.webcamRef}
//           screenshotFormat="image/jpeg"
//           width={720}
//           videoConstraints={videoConstraints}
//         />
//         : null
//       }
//     </div>
//   }
// }

// export default Capture1;

// import React, { useRef, useState } from "react";
// import Webcam from "react-webcam";

// const Capture1 = () => {
//   const webcamRef = useRef(null);
//   const [compressedImageSrc, setCompressedImageSrc] = useState(null);

//   const capture = () => {
//     const imageSrc = webcamRef.current.getScreenshot();
//     compressImage(imageSrc);
//   };

//   const compressImage = (base64Str) => {
//     const img = new Image();
//     img.src = base64Str;
//     img.onload = () => {
//       const canvas = document.createElement("canvas");
//       const ctx = canvas.getContext("2d");

//       // Set the canvas width and height
//       const MAX_WIDTH = 320;
//       const MAX_HEIGHT = 240;
//       let width = img.width;
//       let height = img.height;

//       if (width > height) {
//         if (width > MAX_WIDTH) {
//           height *= MAX_WIDTH / width;
//           width = MAX_WIDTH;
//         }
//       } else {
//         if (height > MAX_HEIGHT) {
//           width *= MAX_HEIGHT / height;
//           height = MAX_HEIGHT;
//         }
//       }

//       canvas.width = width;
//       canvas.height = height;

//       // Draw the image on canvas
//       ctx.drawImage(img, 0, 0, width, height);

//       // Get the compressed image data
//       const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7); // Change 0.7 to adjust quality
//       setCompressedImageSrc(compressedBase64);
//     };
//   };

//   return (
//     <div>
//       <Webcam
//         audio={false}
//         ref={webcamRef}
//         screenshotFormat="image/jpeg"
//         width={320}
//         height={240}
//       />
//       <button onClick={capture}>Capture photo</button>
//       {compressedImageSrc && <img src={compressedImageSrc} alt="Compressed" />}
//     </div>
//   );
// };

// export default Capture1;
// import React, { useRef, useState, useEffect } from "react";
// import * as faceapi from "face-api.js";

// const Capture1 = () => {
//   const videoRef = useRef(null);
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [croppedFace, setCroppedFace] = useState(null);

//   useEffect(() => {
//     const loadModels = async () => {
//       await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
//     };
//     loadModels();
//   }, []);

//   const startCapture = () => {
//     navigator.mediaDevices
//       .getUserMedia({ video: true })
//       .then((stream) => {
//         videoRef.current.srcObject = stream;
//       })
//       .catch((err) => console.error("Error accessing webcam:", err));
//   };

//   const takeSnapshot = async () => {
//     debugger;
//     const canvas = document.createElement("canvas");
//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

//     const imageUrl = canvas.toDataURL("image/jpeg");
//     setCapturedImage(imageUrl);

//     const image = await faceapi.fetchImage(imageUrl);
//     const detections = await faceapi.detectAllFaces(
//       image,
//       new faceapi.TinyFaceDetectorOptions()
//     );
//     if (detections.length > 0) {
//       const face = detections[0].detection.box;
//       const faceCanvas = document.createElement("canvas");
//       faceCanvas.width = face.width;
//       faceCanvas.height = face.height;
//       const faceCtx = faceCanvas.getContext("2d");
//       faceCtx.drawImage(
//         image,
//         face.x,
//         face.y,
//         face.width,
//         face.height,
//         0,
//         0,
//         face.width,
//         face.height
//       );

//       const croppedImageUrl = faceCanvas.toDataURL("image/jpeg");
//       setCroppedFace(croppedImageUrl);
//     } else {
//       console.log("No face detected.");
//     }

//     videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
//   };

//   return (
//     <div>
//       {!capturedImage && (
//         <div>
//           <video ref={videoRef} autoPlay />
//           <br />
//           <button onClick={startCapture}>Start Capture</button>
//           <button onClick={takeSnapshot}>Take Snapshot</button>
//         </div>
//       )}

//       {capturedImage && (
//         <div>
//           <h2>Captured Image:</h2>
//           <img src={capturedImage} alt="Captured" />
//         </div>
//       )}

//       {croppedFace && (
//         <div>
//           <h2>Cropped Face:</h2>
//           <img src={croppedFace} alt="Cropped Face" />
//         </div>
//       )}
//     </div>
//   );
// };

// export default Capture1;
// import React, { useRef, useState, useEffect } from "react";
// import * as faceapi from "face-api.js";

// const Capture1 = () => {
//   const videoRef = useRef(null);
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [croppedFace, setCroppedFace] = useState(null);

//   useEffect(() => {
//     const loadModels = async () => {
//       try {
//         await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
//         await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
//         await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
//         console.log("Models loaded successfully");
//       } catch (err) {
//         console.error("Error loading models", err);
//       }
//     };
//     loadModels();
//   }, []);

//   const startCapture = () => {
//     navigator.mediaDevices
//       .getUserMedia({ video: true })
//       .then((stream) => {
//         videoRef.current.srcObject = stream;
//       })
//       .catch((err) => console.error("Error accessing webcam:", err));
//   };
//   const takeSnapshot = async () => {
//     debugger;
//     const canvas = document.createElement("canvas");
//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

//     const imageUrl = canvas.toDataURL("image/jpeg");
//     setCapturedImage(imageUrl);

//     try {
//       const image = await faceapi.fetchImage(imageUrl);
//       await faceapi.tf.setBackend("webgl"); // Set backend to webgl
//       await faceapi.tf.ready();

//       const detections = await faceapi.detectAllFaces(
//         image,
//         new faceapi.TinyFaceDetectorOptions()
//       );

//       if (detections.length > 0) {
//         // Assuming only one face is detected, use detections[0] for simplicity
//         const face = detections[0].box;
//         const faceCanvas = document.createElement("canvas");
//         faceCanvas.width = face.width;
//         faceCanvas.height = face.height;
//         const faceCtx = faceCanvas.getContext("2d");
//         faceCtx.drawImage(
//           image,
//           face.x,
//           face.y,
//           face.width,
//           face.height,
//           0,
//           0,
//           face.width,
//           face.height
//         );

//         const croppedImageUrl = faceCanvas.toDataURL("image/jpeg");
//         setCroppedFace(croppedImageUrl);
//       } else {
//         console.log("No face detected.");
//       }
//     } catch (error) {
//       console.error("Error processing image:", error);
//     }

//     videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
//   };

// const takeSnapshot = async () => {
//   debugger;
//   const canvas = document.createElement("canvas");
//   canvas.width = videoRef.current.videoWidth;
//   canvas.height = videoRef.current.videoHeight;
//   const ctx = canvas.getContext("2d");
//   ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

//   const imageUrl = canvas.toDataURL("image/jpeg");
//   setCapturedImage(imageUrl);

//   const image = await faceapi.fetchImage(imageUrl);
//   const detections = await faceapi.detectAllFaces(
//     image,
//     new faceapi.TinyFaceDetectorOptions()
//   );

//   if (detections.length > 0) {
//     const face = detections[0].box; // Changed detection.box to detection
//     const faceCanvas = document.createElement("canvas");
//     faceCanvas.width = face.width;
//     faceCanvas.height = face.height;
//     const faceCtx = faceCanvas.getContext("2d");
//     faceCtx.drawImage(
//       image,
//       face.x,
//       face.y,
//       face.width,
//       face.height,
//       0,
//       0,
//       face.width,
//       face.height
//     );

//     const croppedImageUrl = faceCanvas.toDataURL("image/jpeg");
//     setCroppedFace(croppedImageUrl);
//   } else {
//     console.log("No face detected.");
//   }

//   videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
// };

//   return (
//     <div>
//       {!capturedImage && (
//         <div>
//           <video ref={videoRef} autoPlay />
//           <br />
//           <button onClick={startCapture}>Start Capture</button>
//           <button onClick={takeSnapshot}>Take Snapshot</button>
//         </div>
//       )}

//       {capturedImage && (
//         <div>
//           <h2>Captured Image:</h2>
//           <img src={capturedImage} alt="Captured" />
//         </div>
//       )}

//       {croppedFace && (
//         <div>
//           <h2>Cropped Face:</h2>
//           <img src={croppedFace} alt="Cropped Face" />
//         </div>
//       )}
//     </div>
//   );
// };

// export default Capture1;

import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./CSS/WebcamCapture.css";

const FaceCropComponent = () => {
  const webcamRef = useRef(null);
  const [imageUrl, setImageUrl] = useState("");
  const [croppedImageUrl, setCroppedImageUrl] = useState("");
  const cropperRef = useRef(null);

  // Capture image from webcam
  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImageUrl(imageSrc);
    // handleFaceDetect(imageSrc);
  };

  const handleFaceDetect = (faces) => {
    if (faces.length > 0 && cropperRef.current) {
      const face = faces[0]; // Assuming there's only one face detected
      const cropper = cropperRef.current.cropper;
      const faceBounds = {
        x: face.x,
        y: face.y,
        width: face.width,
        height: face.height,
      };
      // Crop the image based on detected face bounds
      const croppedImageBase64 = cropper
        .getCroppedCanvas(faceBounds)
        .toDataURL();
      setCroppedImageUrl(croppedImageBase64);
    }
  };

  return (
    <div>
      {/* Webcam component */}
      {/* <div className="webcam-container">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          // style={{ width: "40%", maxHeight: "40%" }}
          style={{ width: "100%", maxHeight: "100%" }}
        />
      </div> */}
      {/* <div className="webcam-container">
        <div className="blur-layer"></div>
        <div className="clear-box">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            style={{ width: "40%", height: "100%" }}
          />
        </div>
      </div> */}

      <div className="webcam-container">
        <div className="" style={{ border: "1px solid black" }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <div className="capture-area">
          <div className="capture-area1"></div>
        </div>
        {croppedImageUrl && (
          <div className="captured-image">
            <img src={croppedImageUrl} alt="Captured" />
          </div>
        )}
      </div>

      {/* Capture button */}
      <button onClick={capture}>Capture</button>
      {croppedImageUrl && (
        <div>
          <h2>Cropped Image</h2>
          <img
            src={croppedImageUrl}
            alt="Cropped Face"
            style={{ maxWidth: "100%" }}
          />
        </div>
      )}
      {/* Display captured image and cropping functionality */}
      {imageUrl && (
        <div style={{ margin: "20px 0" }}>
          {/* <div style={{ margin: "20px 0", display: "none" }}> */}
          <Cropper
            ref={cropperRef}
            src={imageUrl}
            style={{ height: 400, width: "50%" }}
            aspectRatio={1} // Set aspect ratio as needed
            guides={true}
            cropBoxResizable={true}
            dragMode="move"
            viewMode={1} // Set to 1 to restrict the cropping area to within the image dimensions
            ready={() => {
              // This callback can be used for face detection logic
              // For real face detection, use an appropriate library
              // Example of dummy face detection logic:
              handleFaceDetect([{ x: 100, y: 100, width: 200, height: 200 }]);
            }}
          />
        </div>
      )}

      {/* Display cropped image */}
    </div>
  );
};

export default FaceCropComponent;
