import React, { Fragment, Component,Suspense } from "react";
import common from "../../styling/common.module.css";
import axios from "axios";
import $ from "jquery";
import Chart from "chart.js/auto";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import {
   floormap_det, asset_rack_det, occupancy_det,
   rack_asset_det, assets_under_rack,
   rack_sensor, rack_sensor_dailydata
} from '../../urls/apiurls';
axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

class RealtimeTracking extends Component {
   constructor(props) {
      super(props);
      this.state = {
         message: "",
         error: false,
         loading:false,
      };
   }

   componentDidMount = () => {
      // e.preventDefault();
      axios({ method: "GET", url: "/api/uploadmap" })
         .then((response) => {
            console.log("floor===",response);
            $("#realtime_select").empty();
            if (response.status === 200 && response.data.length !== 0) {
              
               // this.px = 60;
               // console.log('-------', response.data[0].image);
               // let img = document.createElement("img");
               // $(img).attr("src", response.data[0].image);
               // $(img).attr("alt", "");
               // $(img).attr("style", "width:100%; height:100%; z-index:-1");
               // $("#trackingMap").css("width", this.px * response.data[0].width);
               // $("#trackingMap").css("height", this.px * response.data[0].height);
               // $("#trackingMap").css("position", "relative");
               // $("#trackingMap").append(img);
               for (let i = 0; i < response.data.length; i++) {
                  $("#realtime_select").append(
                     "<option value=" + i +">" 
                     + response.data[i].name +
                     "</option>"
                  );
               }
               console.log('=======');
               this.floorDetails = response.data;
               console.log('details',this.floorDetails);
               this.changeFloorMap();
               console.log('///////');
               // this.getRackDetails();
               // this.getOccupencyDetails();
               // this.countInterval = setInterval(this.getOccupencyDetails, 1000 * 10);
               // this.getSensors();
            } else {
               this.setState({
                  success: false,
                  error: true,
                  message: "No floor map details is found.",
               });
            }
         })
         .catch((error) => {
            // console.log(error);
            if (error.status === 403) {
               this.setState({
                  success: false,
                  error: true,
                  message: "User session had timed out. Please login again.",
               });
               this.timeout = setTimeout(() => {
                  localStorage.setItem("isLogged", "failed");
                  window.location.pathname = "/"
               }, 1000 * 2)
            } else {
               this.setState({
                  success: false,
                  error: true,
                  message: "Error occurred. Please try again.",
               });
            }
         });

         this.setState({loading:true})
   };

   componentWillUnmount = () => {
      clearTimeout(this.timeout);
      clearInterval(this.countInterval);
   };

   changeFloorMap = () => {
      // e.preventDefault();
      console.log('hiii');
      // $("#assetDetails").css("display", "none");
      // for (let i = 0; i < this.floorDetails.length; i++) {
      //    if (
      //       parseInt($("#realtime_select").val()) ===
      //       parseInt(this.floorDetails[i].id)
      //    ) {
      //       $("#trackingMap img").attr("src", this.floorDetails[i].image);
      //       $("#trackingMap div").remove();
      //       this.getRackDetails();
      //       this.getSensors();
      //       break;
      //    }
      // }
     let ID = $("#realtime_select").val();
    console.log(ID);
    this.fimage = this.floorDetails[ID];
    console.log(this.fimage.image );
    console.log(this.fimage.width );
    console.log(this.fimage.height );
   //  this.fWidth = this.fimage.width;
    // console.log(this.fWidth);
   //  this.fHeight = this.fimage.height;
    // console.log(this.fHeight);
    $("#rackimage").attr(
        "src",
        this.fimage.image
    );
    console.log(this.fimage.image);
    $("#trackingMap").children("div").remove();
    $("#rackimage").attr("style", "width:" + "auto;" + "height:" + "auto;");

    this.getRackDetails();
   };

   /** Get rack details for the floor map selected
    * Plot rack on the floor map */
   getRackDetails = async () => {
      this.setState({ error: false });
      axios({
         method: "GET",
         url: asset_rack_det + $("#realtime_select").val(),
      })
         .then((response) => {
            console.log('rackdetails=======',response);
            // console.log('macid*****************',response.data[1].macid);

            this.wpx=document.getElementById('trackingMap').clientWidth;
            this.hpx=document.getElementById('trackingMap').clientHeight;
            console.log(this.wpx);
            console.log(this.hpx);
            $("#rackimage").attr("style", "width:" + this.wpimg + "px;" + "height:" + this.hpimg + "px;");
           
            if (response.status === 200 && response.data.length !== 0) {
               let data = response.data;
               for (let i = 0; i < data.length; i++) {
                  let div = document.createElement("div");
                  $(div).css("position", "absolute");
                  $(div).css("left", data[i].x * this.wpx);
                  $(div).css("top", data[i].y * this.hpx);
                  $(div).css("background", "rgba(98,98,98, 0.5)");
                  $(div).css(
                     "padding",
                     ((data[i].y1 - data[i].y) * this.wpx) / 2 +
                     "px " +
                     ((data[i].x1 - data[i].x) * this.hpx) / 2 +
                     "px"
                  );
                  $(div).attr("id", data[i].macid);
                  $(div).css("cursor", "pointer");
                  $(div).on("click", () => {
                     this.assetsUnderRack(data[i].id,data[i].macid);
                     $("#rackimage").css("display", "block"); 
                  });
                  $("#trackingMap").append(div);
               }
            } else {
               this.setState({
                  error: true,
                  success: false,
                  message: "No rack is registered for the floor.",
               });
            }
         })
         .catch((error) => {
            // console.log(error);
            if (error.status === 403) {
               this.setState({
                  success: false,
                  error: true,
                  message: "User session had timed out. Please login again.",
               });
               this.timeout = setTimeout(() => {
                  localStorage.setItem("isLogged", "failed");
                  window.location.reload = "/"
               }, 1000 * 2)
            } else if (error.status === 400) {
               this.setState({
                  success: false,
                  error: true,
                  message: "Request Failed.",
               });
            } else {
               this.setState({
                  success: false,
                  error: true,
                  message: "Error occurred. Please try again.",
               });
            }
         });
   };

   /** Method to add the title for the rack monotors displayed on the floor map
    *  It get Occupency details for all rack monitors on particular floor
    *  The information for title are:
    *  Rack MAC ID, Rack Capacity, Rack usage by assets and Asset count on the rack
    */
   // getOccupencyDetails = () => {
   //    axios({
   //       method: "GET",
   //       url: occupancy_det + $("#realtime_select").val(),
   //    })
   //       .then((response) => {
   //          // console.log(response);
   //          console.log("mac===",response);
   //          if (response.status === 200) {
   //             if (response.data.asset.length !== 0) {
   //                let data = response.data.asset;
   //                console.log("=======datacolor",data)
   //                for (let i = 0; i < data.length; i++) {
   //                   $("#" + data[i].rack).attr(
   //                      "title",
   //                      "Rack ID: " + data[i].rack +
   //                      "\nCapacity: " + data[i].capacity +
   //                      "\nOccupency: " +data[i].usage +
   //                      "\nAsset Count: " + data[i].count
   //                   );
   //                   if (data[i].usage === 0){
   //                      $("#" + data[i].rack).css("background-color","rgba(0,255,0)")
   //                   }
   //                   else if(data[i].usage==42)
   //                   { 
   //                    $("#" + data[i].rack).css({background :"linear-gradient(rgba(255,0,0))"})
   //                   }
   //                    else {
   //                       let val1=(42-data[i].usage);
   //                       let value1=val1/42;
   //                       let val2=data[i].usage/42;
   //                       let value2=val2+0.4;
   //                       console.log("variabl1",value1);
   //                       console.log("variabl2",val2);
   //                       $("#" + data[i].rack).css({background:'linear-gradient(to right,rgba(255,0,0,'+value2+'),rgba(0,255,0,'+value1+')'});
   //                   } 
   //                }
                 
   //             }
   //          }
   //       })
   //       .catch((error) => {
   //          // console.log(error);
   //          if (error.response.status === 403) {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "User session had timed out. Please login again.",
   //             });
   //             this.timeout = setTimeout(() => {
   //                localStorage.setItem("isLogged", "failed");
   //                window.location.reload = "/"
   //             }, 1000 * 2)
   //          } else if (error.response.status === 400) {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "Request Failed.",
   //             });
   //          } else {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "Error occurred. Please try again.",
   //             });
   //          }
   //       });
   // };

   /** On Changing the floor name from drop down list,
    *  Change the floor map image according to the floor name selected
    *  and call getRackDetails() method to get rack registed for particular map.
    */
  

   /** Get the details of the assets added for the rack monitor based on rack id provided
    *  On clicking rack monitor block the method will be called.
    *  The asset details are displayed in table format.
    */
   // getAssetDetails = (id) => {
   //    console.log(id);
   //    this.setState({ error: false });
   //    $("#assetDetails").css("display", "none");
   //    $("#graphBlock").css("display", "none");
   //    axios({ method: "GET", url: rack_asset_det + id })
   //       .then((response) => {
   //          console.log('det-------------------',response.data);
   //          if (response.data.length !== 0 && response.status === 200) {
   //             $("#assetDetails").css("display", "table");
   //             $("#assetDetails tbody").eq(0).empty();
   //             $("#assetDetails tbody").eq(1).empty();
   //             $("#rackid").text(response.data[0].rackno.macid);
               
   //             // $("#imgrackid").text(response.data[0].rackno.macid);
   //             $("#rackid1").text(response.data[0].rackno.macid);
   //             for (let i = 0; i < response.data.length; i++) {
   //                $("#assetDetails tbody")
   //                   .eq(0)
   //                   .append(
   //                      "<tr><td>" +
   //                      (i + 1) +
   //                      "</td><td>" +
   //                      response.data[i].tagid +
   //                      "</td><td>" +
   //                      response.data[i].usage +
   //                      "</td><td>" +
   //                      response.data[i].weight +
   //                      "</td><td>" +
   //                      response.data[i].voltage +
   //                      "</td><td>" +
   //                      response.data[i].current +
   //                      "</td><td>" +
   //                      response.data[i].battery +
   //                      "</td><td>" +
   //                      response.data[i].lastseen.substring(0, 19).replace("T", " ") +
   //                      "</td></tr>"
   //                   );
   //             }
   //          } else {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "No data found for rack selected.",
   //             });
   //          }
   //       })
   //       .catch((error) => {
   //          console.log(error,'erroe=========');
   //          if (error.response.status === 403) {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "User session had timed out. Please login again.",
   //             });
   //             this.timeout = setTimeout(() => {
   //                localStorage.setItem("isLogged", "failed");
   //                window.location.pathname = "/"
   //             }, 1000 * 2)
   //          } else if (error.response.status === 400) {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "Request Failed.",
   //             });
   //          } else {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "Error occurred. Please try again.",
   //             });
   //          }
   //       });
   //    // this.assetsUnderRack(id);
   // };

   // assetsUnderRack = (id,macid) => {
   //    $("#imgrackid").text(macid);
   //    $("#assetDetails").css("display", "none");
   //    $("#graphBlock").css("display", "none");
   //    this.setState({ error: false });
   //    axios({ method: "POST", url: assets_under_rack, data: { id: id } })
   //       .then((response) => {
   //          console.log(response.data,'---------------');
   //          if (response.data.health.length !== 0 && response.status === 200) {
   //             $("#assetDetails").css("display", "table"); 
   //             $("#assetDetails tbody").empty();
   //             $("#rackid").text(response.data.health[0].macid);
              
   //             let data = response.data.health;
   //             for (let i = 0; i < data.length; i++) {
   //                $("#assetDetails tbody").append(
   //                   "<tr><td>" +
   //                   (i + 1) +
   //                   "</td><td>" +
   //                   data[i].tagid +
   //                   "</td><td>" +
   //                   data[i].usage +
   //                   "</td><td>" +
   //                   data[i].weight +
   //                   "</td><td>" +
   //                   data[i].voltage +
   //                   "</td><td>" +
   //                   data[i].current +
   //                   "</td><td>" +
   //                   data[i].battery +
   //                   "</td><td>" +
   //                   data[i].lastseen.substring(0, 19).replace("T", " ") +
   //                   "</td></tr>"
   //                );
   //             }
   //          } else {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "No data found for rack selected.",
   //             });
   //          }
   //       })
   //       .catch((error) => {
   //          console.log(error);
   //          if (error.response.status === 403) {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "User session had timed out. Please login again.",
   //             });
   //             this.timeout = setTimeout(() => {
   //                localStorage.setItem("isLogged", "failed");
   //                window.location.pathname = "/"
   //             }, 1000 * 2)
   //          } else if (error.response.status === 400) {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "Request Failed.",
   //             });
   //          } else if (error.response.status === 404) {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "No data found.",
   //             });
   //          } else {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "Error occurred. Please try again.",
   //             });
   //          }
   //       });
   // };

   // getSensors = (e) => {
   //    this.setState({ error: false });
   //    axios({
   //       method: "GET",
   //       url: rack_sensor + $("#realtime_select").val(),
   //    })
   //       .then((response) => {
   //          // console.log(response);
   //          if (response.status === 200 && response.data.length !== 0) {
   //             let data = response.data;
   //             for (let i = 0; i < data.length; i++) {
   //                let div = document.createElement("div");
   //                $(div).attr(
   //                   "style",
   //                   "width:0px; padding:3px; border-radius:5px; background-color:blue; position:absolute; cursor:pointer;"
   //                );
   //                if (data[i].position === "FT") {
   //                   console.log(data[i].position);
   //                   $(div).css("left", data[i].rackid.x * this.px);
   //                   $(div).css("top", data[i].rackid.y * this.px);
   //                } else if (data[i].position === "FM") {
   //                   console.log(data[i].position);
   //                   $(div).css("left", data[i].rackid.x * this.px);
   //                   $(div).css(
   //                      "top",
   //                      ((data[i].rackid.y1 - data[i].rackid.y) / 2 +
   //                         data[i].rackid.y) *
   //                      this.px
   //                   );
   //                } else if (data[i].position === "FB") {
   //                   $(div).css("left", data[i].rackid.x * this.px);
   //                   $(div).css("top", data[i].rackid.y1 * this.px);
   //                } else if (data[i].position === "RT") {
   //                   $(div).css("left", data[i].rackid.x1 * this.px);
   //                   $(div).css("top", data[i].rackid.y1 * this.px);
   //                } else if (data[i].position === "RM") {
   //                   $(div).css("left", data[i].rackid.x1 * this.px);
   //                   $(div).css(
   //                      "top",
   //                      ((data[i].rackid.y1 - data[i].rackid.y) / 2 +
   //                         data[i].rackid.y) *
   //                      this.px
   //                   );
   //                } else if (data[i].position === "RB") {
   //                   $(div).css("left", data[i].rackid.x1 * this.px);
   //                   $(div).css("top", data[i].rackid.y1 * this.px);
   //                }
   //                $(div).attr(
   //                   "title",
   //                   "Sensor ID: " + data[i].macid + "\nPosition: " + data[i].position
   //                );
   //                $(div).on("click", () => {
   //                   this.getDailySensorData(data[i].macid);
                    
   //                });
   //                $("#trackingMap").append(div);
   //             }
   //          }
   //       })
   //       .catch((error) => {
   //          console.log(error);
   //          if (error.response.status === 403) {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "User session had timed out. Please login again.",
   //             });
   //             this.timeout = setTimeout(() => {
   //                localStorage.setItem("isLogged", "failed");
   //                window.location.reload = "/"
   //             }, 1000 * 2)
   //          } else if (error.response.status === 400) {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "Request Failed.",
   //             });
   //          } else {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "Error occurred. Please try again.",
   //             });
   //          }
   //       });
   // };

// To hide the rack iamge
// rackonclick=()=>{
//    $("#rackimage").css("display", 'none'); 
// }
   

   // getDailySensorData = (id) => {
   //    $("#assetDetails").css("display", "none");
   //    $("#graphBlock").css("display", "none");
   //    axios({ method: "POST", url: rack_sensor_dailydata + id })
   //       .then((response) => {
   //          console.log('$$$$$$$$$',response);
   //          if (response.status === 200 || response.data.length !== 0) {
   //             let data = response.data;
   //             var lbl = [],
   //                tempData = [],
   //                humidData = [];
   //             var ct = 1;
   //             if (data.length > 100) {
   //                ct = Math.ceil(data.length / 100);
   //             }
   //             for (let i = 0; i < data.length; i = i + ct) {
   //                lbl.push(data[i].timestamp.substring(11, 19));
   //                tempData.push(data[i].temperature);
   //                humidData.push(data[i].humidity);
   //             }
   //             $("#graphBlock").css("display", "block");
   //             $("#chartID").text(id);
   //             if ($("#chartCanvas").children().length !== 0)
   //                $("#tempChart").remove();
   //             var cnvs = document.createElement("canvas");
   //             $(cnvs).attr("id", "tempChart");
   //             $(cnvs).attr("width", "50px");
   //             $(cnvs).attr("height", "20px");
   //             $("#chartCanvas").append(cnvs);
   //             // chart displaying code
   //             const tempChart = $("#tempChart");
   //             new Chart(tempChart, {
   //                type: "line",
   //                data: {
   //                   //Bring in data
   //                   labels: lbl,
   //                   datasets: [
   //                      {
   //                         label: "Temperature",
   //                         data: tempData,
   //                         backgroundColor: "red",
   //                         borderColor: "red",
   //                         borderWidth: 2,
   //                         pointRadius: 0.5,
   //                         lineTension: 0.4,
   //                      },
   //                      {
   //                         label: "Humidity",
   //                         data: humidData,
   //                         backgroundColor: "green",
   //                         borderColor: "green",
   //                         borderWidth: 2,
   //                         pointRadius: 0.5,
   //                         lineTension: 0.4,
   //                      },
   //                   ],
   //                },
   //                options: {
   //                   responsive: true,
   //                   scales: {
   //                      xAxes: [{ ticks: { display: true } }],
   //                      yAxes: [{ ticks: { beginAtZero: true, min: 0, stepSize: 50 } }],
   //                   },
   //                   plugins: {
   //                      legend: {
   //                         display: true,
   //                         position: "right",
   //                         fontSize: 35,
   //                      },
   //                   },
   //                },
   //             });
   //          }
   //       })
   //       .catch((error) => {
   //          console.log(error);
   //          if (error.response.status === 403) {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "User session had timed out. Please login again.",
   //             });
   //             this.timeout = setTimeout(() => {
   //                localStorage.setItem("isLogged", "failed");
   //                window.location.pathname = "/"
   //             }, 1000 * 2)
   //          } else if (
   //             error.response.status === 400 ||
   //             error.response.status === 404
   //          ) {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "No data found.",
   //             });
   //          } else {
   //             this.setState({
   //                success: false,
   //                error: true,
   //                message: "Error occurred. Please try again.",
   //             });
   //          }
   //       });
   // };


   render() {
      const {error, message,loading } = this.state;
      return (
         <Fragment>
             <div  style={{ overflow: 'hidden',float: "right", width: "78%", marginRight:'5px'}}>
           
            <p className={common.header}>Real-Time Tracking</p>
            {error && (<p className={common.errorMsg}>{message}</p>)}
            <div className="mt-2">
               <select
                  id="realtime_select"
                  style={{ width: "30%" }}
                  onChange={this.changeFloorMap}
                  className="form-select bg-light text-dark border border-secondary mt-2"
               ></select>
            </div>
            <div>
                  <div id="trackingMap"  style={{position:"relative"}}>
                     <img id="rackimage"  
                           // style={{position:"absolute",
                           // top:"40px",height:'88%',
                           // left:"137px",border:'1px solid #00000061',
                           // borderRadius:"3px",boxShadow:'rgb(0 0 0 / 18%) 0px 0px 6px 6px',
                           // display:"none",width:"65%",background:'#fffffff5' 
                        
                        // }}
                           >
                              {/* <div style={{display:'flex'}} id='emptyrack'>
                               <p 
                                  style={{paddingLeft:'143px',paddingTop:'5px',marginBottom:'0px'}}>
                                  <b>Rack :<span id="imgrackid" ></span> </b>
                                  </p>  
                           <i 
                              style={{fontSize:'30px',paddingLeft:'160px',paddingTop:'5px',cursor:'pointer'}}  
                              className="far fa-times-circle" 
                              // onClick={this.rackonclick}
                              >   
                            </i>
                          </div> */}
                        {/* <Canvas 
                              borderColor={true}
                              borderWidth={true}
                              style={{marginTop:'0px',height:'162%'}}
                              pixelRatio={[1, 2]} camera={{ position: [20,5,-10], fov: 50 }}>
                              <ambientLight intensity={1} />
                              <Suspense fallback={null}>
                              <Model />
                              
                              </Suspense>
                              <OrbitControls autoRotate={true} autoRotateSpeed={4} enableZoom={false} />
                        </Canvas> */}
                     </img>
                  </div>
            </div>

            <div
               className="container-fluid mt-2"
               id="assetDetails"
               style={{ display: "none",marginTop:"30px"}}
            >
               <span
                  style={{
                     fontSize: "1.5vw",
                     fontFamily: "Roboto-Medium",
                     color: "#504f4f",
                     fontWeight: "bold",
                  }}
               >
                  Asset Details for Rack : <span id="rackid"></span>
               </span>
               <table className="table table-dark">
                  <thead>
                     <tr>
                        <th>Sl. NO.</th>
                        <th>TAG ID</th>
                        <th>USAGE</th>
                        <th>WEIGHT</th>
                        <th>VOLTAGE</th>
                        <th>CURRENT</th>
                        <th>BATTERY</th>
                        <th>LASTSEEN</th>
                     </tr>
                  </thead>
                  <tbody></tbody>
               </table>
            </div>
            <div
               className="row"
               id="graphBlock"
               style={{ display: "none", color: "black", fontWeight: "bold" }}>
               <hr></hr>
               Thermal Map for Sensor : <span id="chartID"></span>
               <br></br>
               <div id="chartCanvas"></div>
            </div>
            </div>
         </Fragment>
      );
   }
}

export default RealtimeTracking;

// function Model(props) {
//    const { scene } = useGLTF("server.glb");
//    return <primitive scale={4.5} object={scene} style={{borderColor:"black",backgroundColor:"green"}} />;
//  }
 