/* 
file: cards.tsx 
    file for the individual tracker pages
    will need to implement csv or excel export here
    will need to change the datatable component into an actual table 
        - currently is a listing of data
*/

import React, {useEffect} from 'react'
import {DeviceApi, UserApi} from "./lb-api";
import {Configuration} from "./lb-api/configuration";
import Map from './Map';

// Table Creation
import { DataGrid, GridRowsProp } from '@material-ui/data-grid';
import { format } from 'date-fns'
import Geocode from "react-geocode";


// Excel 
import ReactExport from "react-export-excel";
const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;
var deviceIDEX; //to have device name in excel sheet

//variables for determining data points
var numberPulls = 50;

interface Props {
    tableItems: any[];
}

interface Device {
    name: string;
    id: number;
    lat: number;
    lng: number;
    time: Date;
    city: string;
    state: string;
    country: string;
}

// card function to display device name and datatable
function Card(device) {

    const [tableItems, setTableItems] = React.useState<any[]>([]);

    const [center, setCenter] = React.useState({ // state to re-render
        lat: 0,
        lng: 0,
    });
    
    const [points, setPoints] = React.useState<Device[]>([]);

    useEffect(() => {
        getPoints();
    }, []);

    // for reverse geocoding to get city/state/country
    Geocode.setApiKey(process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

    // function for getting the city/state/country 
    const getCityState = async (point) => {
        let city = "", state = "", country = "";
        const response = await Geocode.fromLatLng(String(point.lat), String(point.lng));
        let parts = response.results[0].address_components;
        parts.forEach(part => {
            if (part.types.includes("locality")) {
                city = part.long_name;
            } else if (part.types.includes("administrative_area_level_1")) {
                state = part.long_name;
            } else if (part.types.includes("country")) {
                country = part.long_name;
            } else {
                // do nothing
            }
        })
        return [city, state, country];
    }

    // get the devices and points
    const getPoints = async () => {
        try {
            const config = new Configuration();
            const userApi = new UserApi(config);
            const deviceApi = new DeviceApi(config);
            try {
                let token = await userApi.userLogin({username: process.env.REACT_APP_LIGHTBUG_API_USERNAME, password: process.env.REACT_APP_LIGHTBUG_API_PASSWORD});
                config.accessToken = token.id;
                config.userId = `${token.userId}`;

            } catch {
                console.error('Login Failed')
                alert('Login Fail');
                return;
            }

            let items: any[] = [];
            const locations: any[] = [];
            let points = await deviceApi.devicePrototypeGetPoints(device.id,
                JSON.stringify({
                    where: {
                        timestamp: {between: [+new Date() - 7 * 24 * 3600 * 1000, new Date()]},
                        locationType: {neq: 'invalid'}
                    },
                    order: 'timestamp DESC', // order by newest points first
                    limit: numberPulls,
                }));
            
            // Where data gets individually sorted
            deviceIDEX = device.name;

            for (const point of points) {
                // ---Bruteforce way, push all data points into a single 1-d array---
                items.push(format(new Date(point.timestamp), 'Pp'));
                items.push(point.location?.lat);
                items.push(point.location?.lng);
                items.push(point.altitude);
                items.push(point.batteryVoltage);

                // getting city/state/location
                let where = await getCityState(point.location);

                // push to array
                locations.push(
                    {
                        name: device.name,
                        id: device.id,
                        lat: points[0].location?.lat,
                        lng: points[0].location?.lng,
                        time: points[0].timestamp,
                        city: where[0],
                        state: where[1],
                        country: where[2],
                    }
                )
            }
            setTableItems(items);
            setPoints(locations);

            let lat_sum = 0;
            let lng_sum = 0;
            for (const item of locations) {
                lat_sum += item.lat; 
                lng_sum += item.lng;
            }
            const new_center = {
                lat: lat_sum / locations.length,
                lng: lng_sum / locations.length
            };
            setCenter(new_center);

        } catch (e) {
            console.error("Failed to get data", e);
        }
    }

    return (
        <div className="card fluid">
            <div className="section"> 
                <h1>{device.name}</h1> 
            </div>
                <div className="section double-padded">
                    <div className="container">
                        <div className="row"> 
                        <div className="col-sm-5">
                                <div className="card fluid"> 
                                    <div className="section"> 
                                        <h4>Device Information</h4>
                                    </div>
                                    <div className="section"> 
                                        <p>Battery Life:</p>
                                    </div>
                                </div>
                                <div className="card fluid"> 
                                    <Map devices={points} center={center} displayAll={false} />
                                </div>
                            </div>
                            <div className="col-sm-7">
                                <DataTable tableItems={tableItems}/>
                            </div>
                        </div>
                    </div>
            </div>
        </div> 
    )
}

// DataTable Component 
const DataTable: React.FC<Props> = ({tableItems})  => {   
    //uniqueData needs to be equal to number of unique data points wanted
    //e.g. if getting date,latitude and longatude then uniqueData = 3;
    var uniqueData = 5;

    let rows: GridRowsProp = [];
    let idCount = 0;
    for (var i = 0; i < (numberPulls * uniqueData); i += uniqueData) { //sets rows for table
        rows.push(
            {   id: idCount,
                col1: tableItems[i],
                col2: tableItems[i+1], 
                col3: tableItems[i+2],
                col4: tableItems[i+3],
                col5: tableItems[i+4]
            }
        )
        idCount++;
    }
    let columns = [ //sets columns for table
        {field: 'col1', headerName: 'Date', width: 300 }, 
        {field: 'col2', headerName: 'Latitude', width: 150},
        {field: 'col3', headerName: 'Longitude', width: 150,},
        {field: 'col4', headerName: 'Altitude (Meters)', width: 150, hide: true},
        {field: 'col5', headerName: 'Voltage (Volts)', width: 150, hide: true}
        ];

    return (
        //Putting Data into Table
        <div style={{ height: 900, width: '100%' }}>
        <ExcelFile element={<button>Download Data</button>}filename={"Eagle Data"}>
            <ExcelSheet data={rows} name={deviceIDEX}>
                <ExcelColumn label="Date" value={"col1"}/>
                <ExcelColumn label="Latitude" value={"col2"}/>
                <ExcelColumn label="Longitude" value={"col3"}/>
                <ExcelColumn label="Altitude(Meters)" value={"col4"}/>
                <ExcelColumn label="Voltage(Volts" value={"col5"}/>
            </ExcelSheet>
        </ExcelFile>
        <DataGrid rows={rows} columns={columns}/>
        </div>
    );
}

export default Card