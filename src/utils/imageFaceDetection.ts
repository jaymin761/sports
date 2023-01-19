// const tf = require('@tensorflow/tfjs-node')
// const faceapi = require('@vladmandic/face-api');
// // const canvas = require('canvas');
// import fs from 'fs';
// var jpeg = require('jpeg-js');

// const minConfidence = 0.8;
// //Use the algorithm tiny face detector with a confidence more then 50%
// const faceDetectionNet = faceapi.nets.tinyFaceDetector;
// const faceDetectionOptions = new faceapi.TinyFaceDetectorOptions({ minConfidence });
// // const { Canvas, Image, ImageData } = canvas
// // faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

// async function detectFaces(img:any) {
//   try {
//     await faceDetectionNet.loadFromDisk('src/utils/imageModels/tiny_face_detector_model-weights_manifest.json');    
//     //Decode image buffer to JPEG
//     let imgJpeg = jpeg.decode(img, true)
//     //Create a tensorflow object
//     let tFrame = tf.browser.fromPixels(imgJpeg)    
//     //Detect all faces
//     let faces = await faceapi.detectAllFaces(tFrame, faceDetectionOptions)
//     console.log("face",faces )
//     return [undefined,faces.length]
//   } catch (error:any) {
//     console.log(error);
//     return [error.message,0]
//   }
// }
// export default detectFaces
