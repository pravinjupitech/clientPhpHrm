import React, { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { useNavigate } from "react-router-dom";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import * as tf from "@tensorflow/tfjs";
import { Button, Col, Form, Input, Label, Row } from "reactstrap";
import axiosConfig from "./../axiosConfig";
import axiosConfitthirdparty from "./../axiosConfitthirdparty";
import axiosConfigOne from "./../axiosCofigOne";
import {
  Createcollection,
  Login,
  Pan_Verify,
  Register,
  Registervianode,
  SaveData,
} from "../EndPoint/EndPoint";
import logo from ".././assets/images/logo.png";
import { RiLogoutCircleRLine } from "react-icons/ri";
import swal from "sweetalert";
import { FaCheck } from "react-icons/fa";
import { MdOutlineCancel } from "react-icons/md";
import "./LoginStyle.css";
import Header from "./Header";
const faceLandmarksDetection = require("@tensorflow-models/face-landmarks-detection");

const Loginform = (args) => {
  const webcamRef = useRef(null);
  const cropperRef = useRef(null);
  const navigate = useNavigate();
  const [modal, setModal] = useState(false);

  const [formData, setFormData] = useState({
    mobile: "",
    image: null,
  });

  const [showWebcam, setShowWebcam] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [croppedImageUrl, setCroppedImageUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [PanVerify, setPanVerify] = useState(false);
  const [text, setText] = useState("modal loading...");
  const [count, setCount] = useState(0);
  const [model, setModel] = useState(null);
  const [maxLeft, setMaxLeft] = useState(0);
  const [maxRight, setMaxRight] = useState(0);
  const [backloading, setBackloading] = useState(false);
  const [Registration, setRegistration] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [LoginData, setLogin] = useState({});
  const [LoginScreen, setLoginScreen] = useState(true);
  const [LoginButton, setLoginButton] = useState("Submit");
  const [msgLocation, setMsgLocation] = useState({
    Latitude: " ",
    Longitude: "",
  });

  useEffect(() => {
    tf.setBackend("webgl");
    loadModel();
    let userData = JSON.parse(localStorage.getItem("userData"));
    if (!!userData) {
      setLoginScreen(false);
    }
  }, []);
  const toggle = () => setModal(!modal);
  const toggleModal = () => {
    capture();
    setModal(false);

    // setRegistration(true);
  };
  const loadModel = async () => {
    faceLandmarksDetection
      .load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
        maxFaces: 1,
      })
      .then((model) => {
        setModel(model);
        setText("ready for capture");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleClick = () => {
    const newIsOpen = !isOpen;
    const newCount = isOpen ? count : 0;
    setIsOpen(newIsOpen);
    setCount(newCount);
  };
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setText("detecting...");
        console.log("detecting...");
        detectPoints();
      }, 2000);
    }
  }, [isOpen, modal]);

  const detectPoints = async () => {
    if (isOpen == false) return;
    try {
      const video = await webcamRef?.current?.video;
      const predictions = await model?.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: true,
        predictIrises: true,
      });

      if (predictions.length > 0) {
        // Somente 1 face
        const keypoints = predictions[0].scaledMesh;
        if (detectarBlink(keypoints)) {
          // TODO :: Found blink, do someting
          const countN = count + 1;
          setCount(countN);
          setIsOpen(false);
          //console.log("cant", countN);
          // console.log("isopen", isOpen);
          handleCapture();
          handleClick();
          if (!isOpen) {
            // stop detection
            setText("");
            return null;
          }
        }
      } else {
        setMaxLeft(0);
        setMaxRight(0);
      }
    } catch (error) {
      // console.log(error);
    }
    if (!isOpen) {
      // stop detection
      setText("");
      return null;
    }
    setTimeout(async () => {
      await detectPoints();
    }, 100);
  };

  const detectarBlink = (keypoints) => {
    const leftEye_left = 263;
    const leftEye_right = 362;
    const leftEye_top = 386;
    const leftEye_buttom = 374;
    const rightEye_left = 133;
    const rightEye_right = 33;
    const rightEye_top = 159;
    const rightEye_buttom = 145;

    const leftVertical = calculateDistance(
      keypoints[leftEye_top][0],
      keypoints[leftEye_top][1],
      keypoints[leftEye_buttom][0],
      keypoints[leftEye_buttom][1]
    );
    const leftHorizontal = calculateDistance(
      keypoints[leftEye_left][0],
      keypoints[leftEye_left][1],
      keypoints[leftEye_right][0],
      keypoints[leftEye_right][1]
    );
    const eyeLeft = leftVertical / (2 * leftHorizontal);

    const rightVertical = calculateDistance(
      keypoints[rightEye_top][0],
      keypoints[rightEye_top][1],
      keypoints[rightEye_buttom][0],
      keypoints[rightEye_buttom][1]
    );
    const rightHorizontal = calculateDistance(
      keypoints[rightEye_left][0],
      keypoints[rightEye_left][1],
      keypoints[rightEye_right][0],
      keypoints[rightEye_right][1]
    );
    const eyeRight = rightVertical / (2 * rightHorizontal);

    const baseCloseEye = 0.1;
    const limitOpenEye = 0.14;
    if (maxLeft < eyeLeft) {
      setMaxLeft(eyeLeft);
    }
    if (maxRight < eyeRight) {
      setMaxRight(eyeRight);
    }
    // console.log("isopen:::::", isOpen);
    let result = false;
    //    if ((maxLeft > limitOpenEye) && (maxRight > limitOpenEye)) {
    if (eyeLeft < baseCloseEye && eyeRight < baseCloseEye) {
      result = true;
      setIsOpen(false);
      // console.log("isopen", isOpen);
    }
    // console.log("isopen", isOpen);
    //    }

    // console.log(result);

    return result;
  };

  const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  };

  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: "user",
  };
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleInputChange = (e) => {
    if (e.target.name == "panNo") {
      setLogin({
        ...LoginData,
        [e.target.name]: e.target.value.toUpperCase(),
      });
    } else {
      setLogin({
        ...LoginData,
        [e.target.name]: e.target.value,
      });
    }
  };
  // const capture = () => {
  //   setShowWebcam(true);
  //   handleClick();
  //   setFormData({
  //     mobile: "",
  //     image: null,
  //   });
  // };
  // const capture = () => {
  //   setShowWebcam(true);
  //   handleClick();
  //   setFormData({
  //     mobile: "",
  //     image: null,
  //   });

  //   setTimeout(() => {
  //     const imageSrc = webcamRef.current.getScreenshot();
  //     if (imageSrc) {
  //       console.log("Screenshot captured:", imageSrc);
  //       handleCapture();
  //     } else {
  //       console.error("Error: Screenshot not captured.");
  //     }
  //   }, 2000);
  // };
  const captureone = (imageSrc) => {
    handleFaceDetect(imageSrc);
  };
  const capture = () => {
    setPanVerify(false);
    setLoginButton("Submit");

    setLogin({
      ...LoginData,
      panNo: "",
      name: "",
    });
    setShowWebcam(true);
    handleClick();
  };
  const handleCapture = () => {
    const imageSrc = webcamRef?.current?.getScreenshot();
    debugger;
    setImageUrl(imageSrc);
    // handleFaceDetect(imageSrc);
    setCroppedImageUrl(imageSrc);
    setFormData({
      ...formData,
      image: imageSrc,
    });
    setShowWebcam(false);
    // toggle();
    setModal(true);
  };
  const handleFaceDetect = () => {
    debugger;

    if (cropperRef.current) {
      const face = {
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      }; // Assuming there's only one face detected
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
      setFormData({
        ...formData,
        image: croppedImageBase64,
      });
    }
  };

  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }
  function showPosition(position) {
    setMsgLocation({
      Latitude: position.coords.latitude,
      Longitude: position.coords.longitude,
    });
  }
  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
    } else {
      // setMsgLocation("Geolocation is not supported by this browser.");
      setMsgLocation("");
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    debugger;
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("mobile", formData.mobile);
      formDataToSend.append("image", dataURItoBlob(croppedImageUrl));
      // formDataToSend.append("image", dataURItoBlob(formData.image));
      setBackloading(true);
      const response = await axiosConfigOne
        .post("/login", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((res) => {});
      setRegistered(true);
      navigate("/home");

      // Reset form after successful submission
      setFormData({
        mobile: "",
        image: null,
      });
    } catch (error) {
      console.error("Error registering:", error);
    }
  };
  const HandleSubmitData = async (e) => {
    e.preventDefault();
    debugger;
    let userinfo = JSON.parse(localStorage.getItem("userData"));
    let collectionid = `${userinfo?.user_id}_${userinfo?.branch?.branch_name}`;
    (async () => {
      debugger;
      await axiosConfitthirdparty
        .post(Createcollection, {
          collectionId: collectionid,
        })
        .then((res) => {
          debugger;
          console.log(res?.data?.message);
        })
        .catch((err) => {
          debugger;
          console.log(err);
        });
    })();

    setLoginButton("Submitting...");
    debugger;
    let image = croppedImageUrl.split(",");
    image[0] = "data:image/jpeg;base64";
    let finalImage = `${image[0]},${image[1]}`;
    let payload = {
      collectionId: collectionid,
      image: finalImage,
      // image: formData.image,
      userId: LoginData?.id,
      fullName: LoginData?.fullName,
      latitude: msgLocation?.Latitude,
      longitude: msgLocation?.Longitude,
    };

    if (PanVerify) {
      await axiosConfitthirdparty
        .post(Register, payload)
        .then((res) => {
          debugger;
          let formdata = new FormData();

          formdata.append("employee_id", LoginData?.id);
          formdata.append("image", res?.data?.registerData?.image);
          formdata.append("uuid", LoginData?.id);
          formdata.append("url", res?.data?.registerData?.imageUrl);
          formdata.append("collection_id", collectionid);
          formdata.append(
            "face_id",
            res?.data?.data?.FaceRecords[0]?.Face?.FaceId
          );
          (async () => {
            await axiosConfig
              .post("/faceapp", formdata)
              .then((response) => {
                debugger;
                console.log(response);
                if (response?.data?.status) {
                  swal(
                    "Sucess",
                    `${LoginData?.fullName} is Registered Sucessfully`
                  );
                  setLoginButton("Submit");

                  setPanVerify(false);
                }
                if (!response?.data?.status) {
                  swal(
                    "error",
                    `${response?.data?.message && response?.data?.message}`,
                    "error"
                  );
                  setLoginButton("Submit");
                  // capture();
                  toggle();
                  setPanVerify(false);
                }
              })
              .catch((err) => {
                debugger;
                console.log(err);
              });
          })();
          // if (res?.status == 200) {
          //   swal(
          //     "Sucess",
          //     `${LoginData?.fullName} is Registered Sucessfully`,
          //     "success"
          //   );
          //   setLoginButton("Submit");

          //   setPanVerify(false);
          // }
        })
        .catch((err) => {
          setPanVerify(false);
          if (err?.response?.status == "413") {
            swal("error", "Request Image size is too large", "error");
          } else {
            swal("error", "Error in Registration Try Again", "error");
          }
          setLoginButton("Submit");
          // capture();
          // toggle();
          // }
        });
    } else {
      swal("Error", "Verify Your Identity");
      setLoginButton("Submit");

      setPanVerify(false);
    }
  };

  const handleCheck = () => {
    if (isOpen) {
      setTimeout(() => {
        setText("detecting...");
        // console.log("detecting...");
        detectPoints();
      }, 1500);
    }
  };
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginButton("Loading...");

    let payload = {
      email: LoginData?.email,
      password: LoginData?.password,
    };
    let formdata = new FormData();
    formdata.append("email", LoginData?.email);
    formdata.append("password", LoginData?.password);
    await axiosConfig
      .post(Login, formdata)
      .then((res) => {
        debugger;

        setLoginButton("Submit");
        console.log(res?.data?.data?.is_user == "1");

        if (res?.data?.data?.is_user == "1") {
          if (!!res?.data?.data?.branch?.branch_name) {
          } else {
            swal("error", "Admin Branch Not Found, Add Branch", "error");
          }
          if (res?.data?.success) {
            capture();
            localStorage.setItem("userData", JSON.stringify(res?.data?.data));
            setLoginScreen(false);
          }
        } else {
          swal("error", "User Not Login With Admin", "error");
        }
      })
      .catch((err) => {
        setLoginButton("Submit");
        debugger;
        // console.log(err.response);
        setLoginScreen(true);
        setLoginScreen(true);
        if (!!err?.response?.data?.message) {
          swal("Error", err?.response?.data?.message, "error");
        }
      });
  };

  const handleVerifyPancard = async () => {
    let userinfo = JSON.parse(localStorage.getItem("userData"));
    getLocation();
    if (LoginData?.panNo) {
      let formdata = new FormData();
      formdata.append("pancard_no", LoginData?.panNo);

      await axiosConfig
        .post(Pan_Verify, formdata)
        .then((res) => {
          debugger;
          let RegisteringUserBranch =
            res?.data?.data?.branch?.branch_id &&
            res?.data?.data?.branch?.branch_id == userinfo?.branch?.branch_id;
          if (RegisteringUserBranch) {
            let fullname = `${res?.data?.data?.first_name} ${res?.data?.data?.last_name}`;
            setLogin({
              ...LoginData,
              ["name"]: fullname,
              ["fullName"]: res?.data?.data?.first_name?.includes(" ")
                ? res?.data?.data?.first_name?.split(" ").join("_").toString()
                : res?.data?.data?.first_name?.trim(),
              ["RegistratinInfo"]: res?.data?.data,

              ["id"]: res?.data?.data?.employee_id,
            });
            setPanVerify(true);
          } else {
            swal(
              "Error",
              `Employee is not From ${userinfo?.branch?.branch_name} Branch`,
              "error"
            );
            setPanVerify(false);
          }
        })
        .catch((err) => {
          setPanVerify(false);
          console.log(err.message);
          if (!!err.message) {
            swal("Error", `${err?.message}`, "error");
          }
        });
    }
  };
  return (
    <>
      <div className="container-fluid">
        <>
          {/* {model == null ? (
          <>
            <h5>Wait while model loading...</h5>
          </>
        ) : (
          <>
            <div className="max-w-md mx-auto mt-10 p-4 border rounded-md shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Login</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-1" htmlFor="mobileNumber">
                    Mobile Number:
                  </label>
                  <input
                    type="text"
                    id="mobileNumber"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="border rounded-md px-2 py-1 w-full"
                    required
                  />
                </div>

                <div className="mb-4">
                  <button
                    type="button"
                    onClick={capture}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Capture Image
                  </button>
                  <p>{text}</p>
                </div>
                {showWebcam && (
                  <div className="mb-4">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="mb-2"
                    />
                    <button
                      type="button"
                      onClick={handleCapture}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      Take Picture
                    </button>
                  </div>
                )}
                {formData.image && (
                  <div className="mb-4">
                    <img src={formData.image} alt="Captured" className="mb-2" />
                  </div>
                )}
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  login
                </button>
                {backloading && <p>Wait for a minute.</p>}
                {registered && <p>Registered.</p>}
              </form>
              <div>
                <p>
                  Not a user?{" "}
                  <span onClick={() => navigate("/signup")}>Register</span>
                </p>
              </div>
            </div>
          </>
        )} */}
        </>
        {!LoginScreen && !LoginScreen && <Header />}
        <Row className="mt-20 mainheading">
          <Col></Col>
          <Col lg="4" md="4" sm="12">
            <div className="max-w-lg mx-auto mt-20 p-4 border rounded-md shadow-lg shadow-sm shadow-md">
              {!LoginScreen && !LoginScreen && (
                <div className="d-flex justify-content-end">
                  <span
                    title=" Click to LogOut"
                    onClick={() => {
                      localStorage.removeItem("userData");
                      window.location.reload();
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <RiLogoutCircleRLine color="red" size={25} />
                  </span>
                </div>
              )}
              <div className="d-flex justify-content-center">
                <img
                  className="Compnaylogo"
                  height={250}
                  width={250}
                  // style={{
                  //   borderRadius: "12px",
                  //   height: "250px",
                  //   width: "100%",
                  // }}
                  src={logo}
                  alt="image"
                />
              </div>
              <div className="d-flex justify-content-center mb-2">
                {LoginScreen && LoginScreen && (
                  <h2 className="text-2xl font-bold mb-4">Login</h2>
                )}
              </div>
              {model == null ? (
                <>
                  <div className="d-flex justify-content-center">
                    <span style={{ color: "red" }}>Wait while Loading...</span>
                  </div>
                </>
              ) : null}
              {LoginScreen && LoginScreen ? (
                <>
                  <Form onSubmit={handleLoginSubmit}>
                    <Row>
                      <Col lg="12" sm="12" md="12">
                        <Label>Email id : -</Label>
                        <Input
                          required
                          name="email"
                          onChange={handleInputChange}
                          value={LoginData?.email}
                          type="email"
                          placeholder="Enter Email to Login"
                        />
                      </Col>
                      <Col lg="12" sm="12" md="12">
                        <Label className="mt-1">Password : -</Label>
                        <Input
                          required
                          name="password"
                          onChange={handleInputChange}
                          value={LoginData?.password}
                          type="password"
                          placeholder="Enter Password to Login"
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col lg="12" sm="12" md="12">
                        <div className="d-flex justify-content-center pt-2 mt-2">
                          <Button type="submit" color="primary">
                            {LoginButton && LoginButton}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </>
              ) : (
                <>
                  <Row>
                    <Col lg="12" sm="12" md="12">
                      {model == null ? null : (
                        <>
                          {/* <div className="max-w-md mx-auto  p-4 border rounded-md shadow-lg"> */}
                          <form onSubmit={handleSubmit}>
                            {showWebcam && (
                              <div className="mb-4">
                                <Webcam
                                  audio={false}
                                  style={{ width: "100%" }}
                                  ref={webcamRef}
                                  screenshotFormat="image/jpeg"
                                  className="mb-2 webcamheading"
                                />
                                <div className="d-flex justify-content-center">
                                  <Button
                                    color="primary"
                                    type="button"
                                    onClick={handleCapture}
                                    className=""
                                  >
                                    Capture
                                  </Button>
                                </div>
                              </div>
                            )}
                            {formData?.image && (
                              <div className="mb-2">
                                <span
                                  // type="button"
                                  title="Remove This Image"
                                  style={{
                                    top: 230,
                                    position: "absolute",
                                    right: 400,
                                    color: "red",
                                    cursor: "pointer",
                                  }}
                                  onClick={capture}
                                >
                                  X
                                </span>
                                <img
                                  // height={250}
                                  // width={250}
                                  style={{
                                    borderRadius: "12px",
                                    height: "250px",
                                    width: "100%",
                                  }}
                                  src={formData.image}
                                  alt="Captured"
                                  className="mb-1"
                                />
                              </div>
                            )}

                            {registered && <p>Registered.</p>}
                          </form>
                          <Row>
                            <Col
                              lg="12"
                              md="12"
                              sm="12"
                              xs="12"
                              className="textLeft"
                            >
                              {Registration && Registration ? null : (
                                <>
                                  <p className="flexView">
                                    <span> Not a User ? : </span>
                                    <span
                                      onClick={() => {
                                        capture();
                                        setRegistration(true);
                                      }}
                                      style={{
                                        cursor: "pointer",
                                        color: "blue",
                                      }}
                                    >
                                      Register
                                    </span>
                                  </p>
                                </>
                              )}
                            </Col>
                            <Col
                              lg="12"
                              md="12"
                              sm="12"
                              xs="12"
                              className="textRight"
                            >
                              <div>
                                <p
                                  //  style={{ fontSize: "18px" }}
                                  className="flexView"
                                >
                                  <span
                                    className="font"
                                    // style={{ fontSize: "18px" }}
                                  >
                                    User? :-
                                  </span>
                                  <span
                                    className="font"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                      navigate("/Home");
                                    }}
                                  >
                                    <span style={{ color: "green" }}>
                                      &nbsp; Mark Attendance
                                    </span>
                                  </span>
                                </p>
                              </div>
                            </Col>
                          </Row>
                          {/* </div> */}
                        </>
                      )}
                    </Col>
                  </Row>
                  {/* <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1" htmlFor="mobileNumber">
                  Mobile Number:
                </label>
                <input
                  type="text"
                  id="mobileNumber"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="border rounded-md px-2 py-1 w-full"
                  required
                />
              </div>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={capture}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Capture Image
                </button>
                <p>{text}</p>
              </div>
              {showWebcam && (
                <div className="mb-4">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="mb-2"
                  />
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Take Picture
                  </button>
                </div>
              )}
              {formData.image && (
                <div className="mb-4">
                  <img src={formData.image} alt="Captured" className="mb-2" />
                </div>
              )}
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                login
              </button>
              {backloading && <p>Wait for a minute.</p>}
              {registered && <p>Registered.</p>}
            </form>
            <div>
              <p>
                Not a user?{" "}
                <span onClick={() => navigate("/signup")}>Register</span>
              </p>
            </div> */}
                </>
              )}
            </div>
          </Col>
          <Col></Col>
        </Row>
        {/* {model == null ? (
        <>
          <h4>Wait while model loading...</h4>
        </>
      ) : (
        <>
          <div className="max-w-md mx-auto mt-10 p-4 border rounded-md shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            {LoginScreen && LoginScreen ? (
              <>
                <Form onSubmit={handleLoginSubmit}>
                  <Row>
                    <Col lg="12" sm="12" md="12">
                      <Label>Email id</Label>
                      <Input
                        required
                        name="email"
                        onChange={handleInputChange}
                        value={LoginData?.email}
                        type="email"
                        placeholder="Enter Email to Login"
                      />
                    </Col>
                    <Col lg="12" sm="12" md="12">
                      <Label className="mt-1">Password</Label>
                      <Input
                        required
                        name="password"
                        onChange={handleInputChange}
                        value={LoginData?.password}
                        type="password"
                        placeholder="Enter Password to Login"
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col lg="12" sm="12" md="12">
                      <div className="d-flex justify-content-center pt-2 mt-2">
                        <Button type="submit" color="primary">
                          Submit
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </>
            ) : (
              <>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block mb-1" htmlFor="mobileNumber">
                      Mobile Number:
                    </label>
                    <input
                      type="text"
                      id="mobileNumber"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="border rounded-md px-2 py-1 w-full"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={capture}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      Capture Image
                    </button>
                    <p>{text}</p>
                  </div>
                  {showWebcam && (
                    <div className="mb-4">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="mb-2"
                      />
                      <button
                        type="button"
                        onClick={handleCapture}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                      >
                        Take Picture
                      </button>
                    </div>
                  )}
                  {formData.image && (
                    <div className="mb-4">
                      <img
                        src={formData.image}
                        alt="Captured"
                        className="mb-2"
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    login
                  </button>
                  {backloading && <p>Wait for a minute.</p>}
                  {registered && <p>Registered.</p>}
                </form>
                <div>
                  <p>
                    Not a user?{" "}
                    <span onClick={() => navigate("/signup")}>Register</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )} */}
        <Modal
          fullscreen="true"
          backdrop="false"
          isOpen={modal}
          toggle={toggle}
          {...args}
        >
          <ModalHeader
            toggle={toggle}
            // toggle={toggleModal}
          >
            Add Details -
          </ModalHeader>
          <div className="p-1 mx-3">
            <Form onSubmit={HandleSubmitData}>
              <Row>
                <Col lg="7" sm="7" md="7">
                  <Row>
                    <Col className="p-1" lg="12" sm="12" md="12">
                      <label>Aadhar Number/PAN No. *</label>
                      <Input
                        required
                        name="panNo"
                        onChange={handleInputChange}
                        value={LoginData?.panNo}
                        type="text"
                        placeholder="Enter Pan /Aadhar Number..."
                      />
                      {/* {LoginData?.panNo?.length == 10 && !PanVerify && (
                )} */}
                      <div className="d-flex justify-content-center">
                        <span
                          onClick={handleVerifyPancard}
                          className="mr-1"
                          style={{
                            color: `${PanVerify ? "blue" : "green"}`,
                            cursor: "pointer",
                            fontSize: "10px",
                          }}
                        >
                          Click to Verify
                        </span>
                        {PanVerify && PanVerify ? (
                          <>
                            <span
                              style={{
                                color: "green",
                                cursor: "pointer",
                                fontSize: "10px",
                              }}
                            >
                              (Verified)
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              style={{
                                color: "red",
                                cursor: "pointer",
                                fontSize: "10px",
                              }}
                            >
                              {/* UnVerified */}
                            </span>
                          </>
                        )}
                      </div>
                    </Col>
                    <Col className="p-1" lg="12" sm="12" md="12">
                      <label className="">Name *</label>
                      <Input
                        required
                        disabled
                        name="name"
                        onChange={handleInputChange}
                        value={LoginData?.name}
                        type="text"
                        placeholder="Name"
                      />
                    </Col>
                    <Col className="p-1" lg="12" sm="12" md="12">
                      <label className="">Upload file *</label>
                      <Input
                        name="name"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setImageUrl(reader.result); // Base64 string
                            };
                            reader.readAsDataURL(file); // Convert file to Base64
                          }
                        }}
                        type="file"
                        placeholder="Name"
                      />
                    </Col>
                  </Row>
                </Col>
                <Col>
                  <label> Cropped Image</label>
                  {croppedImageUrl && (
                    <div className="mt-1 mb-1">
                      <img
                        height={190}
                        src={croppedImageUrl}
                        alt="Cropped Face"
                        style={{ maxWidth: "100%", borderRadius: "20px" }}
                      />
                    </div>
                  )}
                </Col>
              </Row>
              <Row>
                <Col lg="12" sm="12" md="12">
                  {model == null ? (
                    <>
                      <h1>Wait while model loading...</h1>
                    </>
                  ) : (
                    <>
                      <div className="max-w-md mx-auto  p-4 border rounded-md shadow-lg">
                        <form onSubmit={handleSubmit}>
                          <div className="mb-4"></div>
                          {showWebcam && (
                            <div className="mb-4">
                              <Webcam
                                audio={false}
                                style={{ width: "100%" }}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="mb-2"
                              />
                              <Button
                                type="button"
                                onClick={handleCapture}
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                              >
                                Take Picture
                              </Button>
                            </div>
                          )}
                          {imageUrl && (
                            <>
                              <div>
                                {/* <div style={{ margin: "20px 0", display: "none" }}> */}
                                <Cropper
                                  ref={cropperRef}
                                  // src={UploadedImage}
                                  src={imageUrl}
                                  style={{ height: "100%", width: "100%" }}
                                  // aspectRatio={1} // Set aspect ratio as needed
                                  initialAspectRatio={6 / 14}
                                  guides={true}
                                  cropBoxResizable={true}
                                  dragMode="move"
                                  viewMode={1} // Set to 1 to restrict the cropping area to within the image dimensions
                                  // ready={() => {
                                  //   // This callback can be used for face detection logic
                                  //   // For real face detection, use an appropriate library
                                  //   // Example of dummy face detection logic:
                                  //   handleFaceDetect([
                                  //     {
                                  //       x: 100,
                                  //       y: 100,
                                  //       width: 200,
                                  //       height: 200,
                                  //     },
                                  //   ]);
                                  // }}
                                />
                              </div>
                              <div className="d-flex justify-content-center mt-2 mb-2">
                                <Button
                                  color="primary"
                                  className="primary"
                                  onClick={() => captureone(formData?.image)}
                                >
                                  Crop
                                </Button>
                              </div>
                            </>
                          )}

                          {formData?.image && (
                            <div className="mb-2 d-flex justify-content-center">
                              <span
                                title="Remove This Image"
                                style={{
                                  top: 305,
                                  position: "absolute",
                                  right: 50,
                                  color: "red",
                                  cursor: "pointer",
                                }}
                                onClick={capture}
                              >
                                X
                              </span>
                              {/* <img
                                style={{
                                  borderRadius: "12px",
                                  height: "250px",
                                  width: "100%",
                                }}
                                src={formData?.image}
                                alt="Captured"
                                className="mb-1"
                              /> */}
                            </div>
                          )}
                          {/* <button
                            type="submit"
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                          >
                            login
                          </button>
                          {backloading && <p>Wait for a minute.</p>}
                          {registered && <p>Registered.</p>} */}
                        </form>
                        {/* <div>
                          <p>
                            Not a user?{" "}
                            <span onClick={() => navigate("/signup")}>
                              Register
                            </span>
                          </p>
                        </div> */}
                      </div>
                    </>
                  )}
                </Col>
              </Row>
              <Row>
                <Col lg="12" sm="12" md="12">
                  <div className="d-flex justify-content-center pt-2 mt-2">
                    <Button type="submit" color="primary">
                      {LoginButton && LoginButton}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Loginform;
