/* 
file: Map.tsx 
    file for the map display of the most recent locations of devices
    will need to implement google maps API in this component 
*/

import React, {useEffect} from 'react';
import './App.css';
import {DeviceApi, UserApi} from "./lb-api";
import {Configuration} from "./lb-api/configuration";
import Geocode from "react-geocode";

import Map from './Map';


// interface for device object
export interface Device {
    name: string;
    id: number;
    lat: number;
    lng: number;
    time: Date;
    city: string;
    state: string;
    country: string;
}

export default function ViewAll() {
    // react hooks maintaining center, devices, and selected 
    const [center, setCenter] = React.useState({ // state to re-render
        lat: 0,
        lng: 0,
    });
    
    const [devices, setDevices] = React.useState<Device[]>([]);

    // for hooks 
    useEffect(() => {
        getDevicesAndPoints();
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

    // get the devices and most recent point
    const getDevicesAndPoints = async () => {
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

            let allDevices = await userApi.userPrototypeGetDevices(config.userId,
                JSON.stringify({where: {lastConnection : {gt: +new Date() - 7 * 24 * 3600 * 1000} }})
            );

            const locations: any[] = [];
            for (const device of allDevices) {
                if (!device.id) continue; // prevent error on next line
                let points = await deviceApi.devicePrototypeGetPoints(device.id,
                    JSON.stringify({
                        where: {
                            timestamp: {between: [+new Date() - 7 * 24 * 3600 * 1000, new Date()]},
                            locationType: {neq: 'invalid'}
                        },
                        order: 'timestamp DESC', // order by newest points first
                        limit: 1,
                    }));

                // getting city/state/location
                let where = await getCityState(points[0].location);

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
            setDevices(locations);
            // get center of map based on most recent locations
            let lat_sum = 0;
            let lng_sum = 0;
            for (let item of locations) {
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
        <span className= "responsive-margin">
            <div className="card fluid">
                <div className="section">
                <h1>View All</h1>
                </div>
                <div className="section double-padded">
                    <Map devices={devices} center={center} displayAll={true} />
                </div>
            </div>
        </span>
    );
}