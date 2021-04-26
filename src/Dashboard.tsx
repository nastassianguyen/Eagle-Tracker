/* 
file: Dashboard.tsx 
    file for the dashboard display of the devices
*/

import React, {Component} from 'react';
import './App.css';
import {UserApi} from "./lb-api";
import {Configuration} from "./lb-api/configuration";


interface dashboardState {
    devices: any[];
    rows: any[]
}

export class Dashboard extends Component<{}, dashboardState> {
    constructor(props:any) {
        super(props);
        this.state = { 
            devices: [],
            rows: []
         };
    }

    // get list of devices in an array 
    async getDevices() {
        try {
            const config = new Configuration();
            const userApi = new UserApi(config);
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
                JSON.stringify({where: {lastConnection : {gt: +new Date() - 14 * 24 * 3600 * 1000} }})
            );

            const devices: any[] = [];
            for (const device of allDevices) {
                if (!device.id) continue; // prevent error on next line
                devices.push(device);
            }

            const rows: any[] = []
            for (var i = 0; i < allDevices.length; i+=3) {
                if (i + 2 < allDevices.length) {
                    rows.push(
                        <div key={i} className="row">
                            <div key={allDevices[i].id} className="col-sm">
                                <a className="button" href={`/devices/${allDevices[i].id}`}>Device {allDevices[i].name}</a>
                            </div>
                            <div key={allDevices[i+1].id}className="col-sm">
                                <a className="button" href={`/devices/${allDevices[i+1].id}`}>Device {allDevices[i+1].name}</a>
                            </div>
                            <div key={allDevices[i+2].id}className="col-sm">
                                <a className="button" href={`/devices/${allDevices[i+2].id}`}>Device {allDevices[i+2].name}</a>
                            </div>
                        </div>
                    )
                } else if (i+2 <= allDevices.length) {
                    rows.push(
                        <div key={i} className="row">
                            <div key={allDevices[i].id} className="col-sm">
                                <a className="button" href={`/devices/${allDevices[i].id}`}>Device {allDevices[i].name}</a>
                            </div>
                            <div key={allDevices[i+1].id} className="col-sm">
                                <a className="button" href={`/devices/${allDevices[i+1].id}`}>Device {allDevices[i+1].name}</a>
                            </div>
                            <div key={999} className="col-sm"></div>
                        </div>
                    )
                } else if (i+1 <= allDevices.length) {
                    rows.push(
                        <div key={i} className="row">
                            <div key={allDevices[i].id} className="col-sm">
                                <a className="button" href={`/devices/${allDevices[i].id}`}>Device {allDevices[i].name}</a>
                            </div>
                            <div key={999} className="col-sm"></div>
                            <div key={998} className="col-sm"></div>
                        </div>
                    )
                }
            }

            this.setState({devices: devices});
            this.setState({rows: rows});
        } catch (e) {
            console.error("Failed to get data", e);
        }
    }

    // return promist after component mounts to DOM
    componentDidMount() {
        this.getDevices().then();
    }

    // render function - displays listing of devices as links 
    render() {
        return (
            <span className="responsive-padding">
                <div className="card fluid">
                    <div className="section">
                        <h1>Eagle Tracker Database</h1>
                    </div>
                    
                    <div className="section double-padded">
                    <div className="container">
                        {(this.state as any).rows?.length ? (this.state as any).rows : 'Loading...'}
                    </div>
                    </div>
                    
                </div>
            </span>
        );
    }

}

export default Dashboard;
