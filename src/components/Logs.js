import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import axiosConfigThirdParty from "./../axiosConfitthirdparty";
import axiosConfig from "../axiosConfig";

import { Col, Input, Row, Spinner, Table, Button } from "reactstrap";
import axios from "axios";
import { SavedData, logsData, logsdeleteData } from "../EndPoint/EndPoint";
import { MdDelete } from "react-icons/md";
import swal from "sweetalert";

function Logs() {
  const [List, setList] = useState([]);
  const [Value, setValue] = useState("");
  const [Loading, setLoading] = useState(false);
  const [AllList, setAllList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    listData();
  }, []);
  const listData = () => {
    setLoading(true);
    let userData = JSON.parse(localStorage.getItem("userData"));
    axiosConfig
      .get(`${logsData}/${userData?.user_id}`)
      .then((res) => {
        setLoading(false);
        if (res?.data?.data?.length > 0) {
          // let value = res?.data?.data?.filter(
          //   (ele) => ele?.adminId == userData?._id
          // );
          if (res?.data?.data?.length > 0) {
            setList(res?.data?.data?.reverse());
            setAllList(res?.data?.data?.reverse());
          }
        } else {
          setList([]);
          setAllList([]);
        }
      })
      .catch((err) => {
        setLoading(false);

        console.log(err);
        setList([]);
      });
  };
  if (Loading) {
    return (
      <>
        <div className="d-flex justify-content-center align-item-center text-align-center mt-5">
          Loading...
        </div>
      </>
    );
  }
  const HandleDelete = async (data) => {
    // let payload = {
    //   id: data?.id,
    // };
    let formdata = new FormData();
    formdata.append("id", data?.id);
    await axiosConfig
      .post(logsdeleteData, formdata)
      .then((res) => {
        listData();
        swal("success", "Deleted Success", "success");
      })
      .catch((err) => {
        swal("error", "Error occured try again Later", "error");
      });
  };
  return (
    <>
      <Header />
      <div className="container">
        <Row>
          <Col>
            <div className="mt-1 mb-1">
              <h2>Attendance Logs</h2>
            </div>
          </Col>
          <Col></Col>
          <Col lg="2" md="2" sm="6" xs="6">
            <div className="mt-1 mb-1 d-flex justify-content-end">
              <Input
                value={Value}
                onChange={(e) => {
                  let value = e.target.value;
                  setValue(value);
                  let filterdata;
                  if (value?.length > 0) {
                    filterdata = AllList?.filter((ele) =>
                      ele?.date?.includes(value)
                    );
                    if (filterdata?.length > 0) {
                      setList(filterdata);
                    } else {
                      setList(AllList);
                    }
                  } else {
                    setList(AllList);
                  }
                }}
                placeholder="Search by Date..."
                type="text"
              />
            </div>
          </Col>
          <Col>
            <div className="mt-1 mb-1 d-flex justify-content-end">
              <Button
                color="primary"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/attenlist");
                }}
              >
                Back
              </Button>
            </div>
          </Col>
        </Row>
        <Table hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Image</th>
              <th>Date</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {List?.length > 0 ? (
              <>
                {List?.map((ele, i) => {
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        {" "}
                        <img
                          style={{ borderRadius: "12px" }}
                          width="120px"
                          height={80}
                          src={ele?.image}
                          alt=""
                        />{" "}
                      </td>
                      <td>{ele?.date}</td>
                      <td>{ele?.time}</td>
                      {/* <td>{shift?.shiftName && shift?.shiftName}</td> */}
                      <td>
                        {" "}
                        <MdDelete
                          onClick={() => HandleDelete(ele)}
                          color="red"
                          size={25}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </>
            ) : (
              <></>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
}

export default Logs;
