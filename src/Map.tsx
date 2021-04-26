/* 
file: Map.tsx 
    file for the map display of the most recent locations of devices
    will need to implement google maps API in this component 
*/

import React from 'react';
import './App.css';
import {
    GoogleMap,
    LoadScript,
    Marker,
    InfoWindow,
} from "@react-google-maps/api";
import {formatRelative} from "date-fns";


const mapContainerStyle = {
    width: "100vw",
    height: "100vh",
    align: "center",
    maxWidth: "100%",
    maxHeight: "100%",
};

const options = {
    disableDefaultUI: true,
    zoomControl: true,
}

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

interface Center {
    lat: number;
    lng: number;
}

interface Props {
    devices: Device[];
    center: Center;
    displayAll: boolean;
}

const Map: React.FC<Props> = ({devices, center, displayAll})  => {

    const [selected, setSelected] = React.useState<Device | null>(null); // for rendering infowindow

    const mapRef = React.useRef(); // ref to retain state without constant re-renders
    const onMapLoad = React.useCallback((map) => {
        mapRef.current = map;
    }, []);

    return (
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY!}>
            <GoogleMap 
                mapContainerStyle={mapContainerStyle} 
                zoom = {8} 
                center = {center}
                options = {options} 
                onLoad={onMapLoad} > 
                {devices.map((device) => (
                    <Marker 
                        key={device.id}
                        title={device.name}
                        visible={true}
                        clickable={true}
                        position={{lat:device.lat, lng: device.lng}}
                        onMouseOver={() => {
                            setSelected(device);
                        }}
                    />
                ))}

                {selected && (<InfoWindow
                
                    onCloseClick={() => {
                        setSelected(null);
                        }}
                    position={{
                        lat: selected.lat,
                        lng: selected.lng
                    }} > 
                    <div className="card fluid">
                        <div className="section">
                            <h4>Tracker {selected.name}</h4>    
                        </div>
                        <div className="section">
                            {
                                displayAll ? 
                                    [<p>Last seen: {formatRelative(new Date(selected.time), new Date())}</p>,
                                    <p>In {selected.city}, {selected.state}, {selected.country}</p>,
                                    <a className="button" href={`/devices/${selected.id}`}>View more</a>] 
                                    : [<p>Spotted {formatRelative(new Date(selected.time), new Date())}</p>,
                                    <p>In {selected.city}, {selected.state}, {selected.country}</p>]
                            }
                            
                        </div>       
                    </div>
                </InfoWindow>)}
            </GoogleMap>
        </LoadScript>
    );
}
export default Map;