import React, { useState, useEffect } from "react";
import { _GetList, _Get, _Put } from "../components/ApiCalling";
import {
  HRM_ATTENDANCE_LIST,
  All_Users_HRM,
  AttendanceList,
  RegisteredUser,
  RegisteredAttendanceUser,
  ViewOneById,
} from "../EndPoint/EndPoint";
import axiosConfig from "../axiosConfig";
import axiosConfigThirdParty from "../axiosConfitthirdparty";

import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
} from "reactstrap";
import axios from "axios";
import Header from "../components/Header";
import { Col, Input, Row, Spinner, Table } from "reactstrap";
import swal from "sweetalert";
import { useNavigate } from "react-router-dom";
import { Edit } from "react-feather";

function InnerTable({ insideData }, args) {
  const [InTime, setInTime] = useState("");
  const [OutTime, setOutTime] = useState("");
  const [EditData, setEditData] = useState(null);
  const [modal, setModal] = useState(false);

  const toggle = () => setModal(!modal);

  const handleViewOne = (data, intimeIndex, OutTimeIndex) => {
    let value = {
      ...data,
      intimeIndex: intimeIndex,
      OutTimeIndex: OutTimeIndex,
    };

    setEditData(value);
    setInTime(value?.details?.inTimes[intimeIndex]);
    setOutTime(value?.details?.outTimes[OutTimeIndex]);
    toggle();
  };
  const handleEditAttendanceSubmit = async (e) => {
    e.preventDefault();

    let Payload = {
      inTimeIndex: EditData?.intimeIndex,
      inTime: InTime,
      outTimeIndex: EditData?.OutTimeIndex,
      outTime: OutTime,
    };
    await axios
      .put(
        `https://node-second.rupioo.com/editTimes/${EditData?.details?._id}`,
        Payload
      )
      .then((res) => {
        if (res?.data?.status) {
          toggle();
          window.location.reload();
        }
      })
      .catch((err) => {
        if (!!err?.response?.data?.message) {
          swal("error", `${err?.response?.data?.message}`, "error");
        }
      });
  };

  return (
    <>
      <div className="" style={{ backgroundColor: "#80808069" }}>
        <Row>
          <Col>
            <div className="d-flex justify-content-center p-2">
              {" "}
              <h2>
                {insideData[0]?.first_name &&
                  `${insideData[0]?.first_name?.toUpperCase()}`}{" "}
                Attendance
              </h2>
            </div>
          </Col>
        </Row>
        <Table hover responsive className="innerTable">
          <thead>
            <tr style={{ height: "47px" }}>
              <th>Date</th>
              <th>InTime</th>
              <th>OutTime</th>
              <th>Duration</th>
              <th>lateBy</th>
              <th>ShortBy</th>
              {/* <th>Working</th> */}
              <th>Amount(Rs/-)</th>
              {/* <th>Action</th> */}
            </tr>
          </thead>
          <tbody>
            {insideData?.length > 0 ? (
              insideData
                ?.map((custom, index) => (
                  <>
                    <tr style={{ height: "47px" }} key={index}>
                      <td>{custom?.date}</td>
                      <td>{custom?.in_time_new}</td>
                      <td>{custom?.out_time_new}</td>
                      <td>{custom?.attendance_duration}</td>
                      <td>{custom?.late_by}</td>
                      <td>{custom?.short_by}</td>
                      {/* <td>{custom?.working_hour}</td> */}
                      <td>{custom?.total_amount}</td>
                    </tr>
                  </>
                ))
                .reverse()
            ) : (
              <>
                <div className="d-flex justify-content-center">
                  No Data Found
                </div>
              </>
            )}
          </tbody>
        </Table>
      </div>
      <Modal isOpen={modal} toggle={toggle} {...args}>
        <ModalHeader toggle={toggle}>Update Attendance</ModalHeader>
        <ModalBody>
          <div className="d-flex justify-content-center">
            <h4>
              Edit Attendance for{" "}
              {EditData?.firstName && (
                <>
                  {EditData?.firstName} {EditData?.lastName}
                </>
              )}{" "}
            </h4>
          </div>
          <div className="d-flex justify-content-center">
            <h4>
              {EditData?.attendence?.attendance?.date ? (
                <> Date : {EditData?.attendence?.attendance?.date}</>
              ) : null}
            </h4>
          </div>
          <div className="p-1 pt-1 pb-1">
            <Row>
              <Col>
                <Label>In Time</Label>
                <Input
                  value={InTime}
                  onChange={(e) => setInTime(e.target.value)}
                  placeholder="In time.."
                />
              </Col>
              <Col>
                <Label>Out Time</Label>
                <Input
                  value={OutTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  placeholder="Out time.."
                />
              </Col>
            </Row>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleEditAttendanceSubmit}>
            Submit
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function OuterTable({ Search, setSearch, DateSearch, setDateSearch }, args) {
  const [DataSource, setDataSource] = useState([]);
  const [AllAttendance, setAllAttendance] = useState([]);
  const [AllDataSource, setAllDataSource] = useState([]);
  const [insideData, setInsideData] = useState([]);
  const [TotalAttendance, setTotalAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [EditData, setEditData] = useState(null);
  const [isTrue, setIstrue] = useState(false);
  const [currentIndex, setCurrentIndex] = useState("");
  const [InTime, setInTime] = useState("");
  const [OutTime, setOutTime] = useState("");
  const [modal, setModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedEmployees = DataSource?.map((employee) => {
        let timeInOffice = null;
        if (employee.in_time_new) {
          timeInOffice = calculateTimeInOffice(
            employee.in_time_new,
            employee.out_time_new
          );
        }
        return { ...employee, timeInOffice };
      });
      setDataSource(updatedEmployees);
    }, 1000); // Update every minute

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [DataSource]);
  const calculateTimeInOffice = (intime, outtime) => {
    let todayDate = new Date()?.toISOString()?.split("T")[0];
    const intDate = new Date(`${todayDate} ${intime}`);
    const endTime = outtime ? new Date(`${todayDate} ${outtime}`) : new Date();
    // const currentTime = new Date();
    // const intDate = new Date(`${todayDate} ${intime}`);

    const diff = endTime - intDate;
    const diffInHours = Math.floor(diff / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const diffInSeconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${diffInHours} hr : ${diffInMinutes} min ${diffInSeconds} sec`;
  };

  const toggle = () => setModal(!modal);
  useEffect(() => {
    debugger;
    let searchingItem = AllDataSource?.filter(
      (element, index) =>
        element?.first_name?.toLowerCase()?.includes(Search) ||
        element?.first_name?.toLowerCase()?.includes(Search)
    );
    if (Search?.length) {
      setDataSource(searchingItem);
    } else {
      setDataSource(AllDataSource);
    }
  }, [Search]);

  useEffect(() => {
    let userId = JSON.parse(localStorage.getItem("userData"));
    listData(userId?.user_id, userId?.branch?.branch_id);
  }, []);
  const listData = (id, db) => {
    (async () => {
      setLoading(true);
      let RegisterUser = [];
      let todayDate = new Date()?.toISOString()?.split("T")[0];
      let user = JSON.parse(localStorage.getItem("userData"));
      let URl = `${RegisteredUser}/${id}/${db}`;

      await axiosConfig
        .get(URl)
        .then((res) => {
          debugger;
          let value = res?.data?.data;

          if (value?.length > 0) {
            value.forEach((ele) => {
              ele["CurrentDate"] = todayDate;
            });
            // show tableData
            // RegisterUser = BranchUser;
            // setAllAttendance(value);
            setDataSource(value);
            setAllDataSource(value);
          }
          setLoading(false);
        })
        .catch((err) => {
          setLoading(false);

          console.log(err);
        });
      // let URL = `${RegisteredAttendanceUser}/${db}`;
      // await axiosConfig
      //   .get(URL)
      //   .then((res) => {
      //     setLoading(false);
      //     // console.log(todayDate);
      //     let latest = res?.data?.Attendance?.filter(
      //       (atten) => atten?.createdAt?.split("T")[0] == todayDate
      //     );

      //     setTotalAttendance(res?.data?.Attendance);
      //     let todayData = res?.data?.Attendance?.filter(
      //       (ele) => ele?.createdAt?.split("T")[0] == todayDate
      //     );
      //     RegisterUser.forEach((ele) => {
      //       latest.forEach((data) => {
      //         if (ele._id === data?.userId) {
      //           ele.attendence = data;
      //         }
      //       });
      //       return ele;
      //     });

      //     setLoading(false);
      //     // setAllAttendance(res?.data?.Attendance);
      //     // setDataSource(RegisterUser);
      //     // setAllDataSource(RegisterUser);
      //   })
      //   .catch((err) => {
      //     setLoading(false);
      //     setDataSource([]);
      //   });
    })();
  };

  const handleName = async (ind, value) => {
    let userOne = null;
    setCurrentIndex(ind);
    debugger;

    // let filter = AllAttendance?.filter((ele) => ele?.userId == value?._id);
    // let CurrentMonthData;
    // if (filter?.length > 0) {
    //   CurrentMonthData = filter?.filter(
    //     (ele) =>
    //       ele?.createdAt?.split("T")[0]?.split("-")[1] ==
    //       value?.CurrentDate?.split("-")[1]
    //   );
    //   setInsideData(CurrentMonthData);
    // }
    // let user = JSON.parse(localStorage.getItem("userData"));
    // // setInsideData(CurrentMonthData ? CurrentMonthData : filter);
    // setInsideData(filter);
    // setIstrue(!isTrue);
    // if (data?.panNo || data?.Pan_No || data?.Aadhar_No) {
    (async () => {
      await axiosConfig
        .get(`${ViewOneById}/${value?.employee_id} }`)
        .then((res) => {
          debugger;
          console.log(res?.data?.data);
          setInsideData(res?.data?.data);
          setIstrue(!isTrue);
        })
        .catch((err) => {
          debugger;
          console.log(err);
          setInsideData([]);
          setIstrue(!isTrue);
        });
    })();
  };
  const handleViewOne = (data, intimeIndex, OutTimeIndex) => {
    let value = {
      ...data,
      intimeIndex: intimeIndex,
      OutTimeIndex: OutTimeIndex,
    };

    setEditData(value);
    setInTime(data?.attendence?.details?.inTimes[intimeIndex]);
    setOutTime(data?.attendence?.details?.outTimes[OutTimeIndex]);
    toggle();
  };
  const handleEditAttendanceSubmit = async (e) => {
    e.preventDefault();

    let Payload = {
      inTimeIndex: EditData?.intimeIndex,
      inTime: InTime,
      outTimeIndex: EditData?.OutTimeIndex,
      outTime: OutTime,
    };
    await axios
      .put(
        `https://node-second.rupioo.com/editTimes/${EditData?.attendence?.details._id}`,
        Payload
      )
      .then((res) => {
        if (res?.data?.status) {
          listData();
          toggle();
        }
      })
      .catch((err) => {
        if (!!err?.response?.data?.message) {
          swal("error", `${err?.response?.data?.message}`, "error");
        }
      });
  };
  return (
    <>
      {loading ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spinner
              style={{
                height: "4rem",
                width: "4rem",
              }}
              color="primary"
            >
              Loading...
            </Spinner>
          </div>
        </>
      ) : (
        <>
          <Table hover responsive className="outerTable">
            <thead>
              <tr style={{ height: "47px" }}>
                <th>#</th>
                <th>Name</th>
                <th>Date</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Duration</th>
                <th>Salary</th>
                {/* <th>Action</th> */}
              </tr>
            </thead>
            <tbody>
              {DataSource &&
                DataSource?.map((ele, ind) => (
                  <>
                    <tr style={{ height: "40px" }} key={ind}>
                      <td>{ind + 1}</td>
                      <td
                        onClick={() => handleName(ind, ele ? ele : ele)}
                        style={{ cursor: "pointer" }}
                      >
                        <span>
                          {!!ele?.first_name && <>{`${ele?.first_name}`}</>}
                        </span>
                      </td>
                      <td>{ele?.CurrentDate}</td>
                      <td>{!!ele?.in_time && ele?.in_time_new}</td>
                      <td>{!!ele?.out_time && ele?.out_time_new}</td>
                      <td>{ele?.timeInOffice && ele?.timeInOffice}</td>
                      {/* <td>{workingHours}</td> */}
                      {/* <td>{ele?.duration && ele?.duration}</td> */}
                      <td>{ele?.salary}</td>
                      {/* <td>
                        {" "}
                        <span
                          onClick={() =>
                            handleViewOne(
                              ele,
                              0,
                              ele?.attendence?.details?.outTimes?.length > 0
                                ? ele?.attendence?.details?.outTimes?.length - 1
                                : 0
                            )
                          }
                          style={{ cursor: "pointer" }}
                          className="mr-1"
                        >
                          <Edit color="green" />
                        </span>
                      </td> */}
                    </tr>

                    {currentIndex == ind && isTrue && (
                      <tr>
                        <td colSpan="4" className="innerTable">
                          <div className="d-flex justify-content-end">
                            {/* <Col lg="2" md="2" sm="12">
                              <Input
                                width={30}
                                className="mt-1 mb-1"
                                type="text"
                                placeholder="Search Date here ..."
                                onChange={(e) =>
                                  setSearch(e.target.value?.toLowerCase())
                                }
                              />
                            </Col> */}
                          </div>
                          <InnerTable insideData={insideData} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
            </tbody>
          </Table>
          <>
            <Row>
              {/* {TodayImages?.length > 0 &&
                TodayImages?.map((ele, index) => (
                  <>
                    <Col key={index} lg="2" md="2">
                      <img src={ele?.image} height={150} width={100} />
                    </Col>
                  </>
                ))} */}
            </Row>
          </>
        </>
      )}
      <Modal isOpen={modal} toggle={toggle} {...args}>
        <ModalHeader toggle={toggle}>Update Attendance</ModalHeader>
        <ModalBody>
          <div className="d-flex justify-content-center">
            <h4>
              Edit Attendance for{" "}
              {EditData?.firstName && (
                <>
                  {EditData?.firstName} {EditData?.lastName}
                </>
              )}{" "}
            </h4>
          </div>
          <div className="d-flex justify-content-center">
            <h4>
              {EditData?.attendence?.attendance?.date ? (
                <> Date : {EditData?.attendence?.attendance?.date}</>
              ) : null}
            </h4>
          </div>
          <div className="p-1 pt-1 pb-1">
            <Row>
              <Col>
                <Label>In Time</Label>
                <Input
                  value={InTime}
                  onChange={(e) => setInTime(e.target.value)}
                  placeholder="In time.."
                />
              </Col>
              <Col>
                <Label>Out Time</Label>
                <Input
                  value={OutTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  placeholder="Out time.."
                />
              </Col>
            </Row>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            // onClick={toggle}
            onClick={handleEditAttendanceSubmit}
          >
            Submit
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function List() {
  const [Search, setSearch] = useState("");
  const [DateSearch, setDateSearch] = useState("");
  const history = useNavigate();
  const handleLogs = () => {
    history("/Logs");
  };

  return (
    <div>
      <Header />
      <div className="container">
        <Row>
          <Col lg="4" md="4" sm="12" xs="12">
            <h1 className="mb-3">Attendance List</h1>
          </Col>
          <Col>
            <div className="d-flex justify-content-end">
              <Button color="primary" onClick={handleLogs}>
                Logs
              </Button>
            </div>
          </Col>
          <Col className="mt-1 mb-1" lg="2" md="2" sm="12">
            <Input
              width={30}
              type="text"
              placeholder="Search Name here ..."
              onChange={(e) => setSearch(e.target.value?.toLowerCase())}
            />
          </Col>
          {/* <Col lg="2" md="2" sm="12">
            <Input
              width={30}
              type="date"
              placeholder="Search Name here ..."
              onChange={(e) => setDateSearch(e.target.value?.toLowerCase())}
            />
          </Col> */}
        </Row>
        <div className="d-flex justify-content-space-between"></div>

        <OuterTable
          Search={Search}
          setSearch={setSearch}
          DateSearch={DateSearch}
          setDateSearch={setDateSearch}
        />
      </div>
    </div>
  );
}

export default List;
