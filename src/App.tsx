/* 
file: App.tsx 
    main file for the navigation between home page and view all
    displays the 'home' and 'view all' buttons
    contains router implementation
*/

import React, {Component} from 'react';
import './App.css';
import {UserApi} from "./lb-api";
import {Configuration} from "./lb-api/configuration";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Dashboard from "./Dashboard";
import ViewAll from "./ViewAll";
import Loading from './components/loading';
import Card from './cards';

export class App extends Component<{}, { items : any }> {
    constructor(props:any) {
        super(props);
        this.state = { items: [] };
    }

    // get list of devices
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
                JSON.stringify({where: {lastConnection : {gt: +new Date() - 7 * 24 * 3600 * 1000} }})
            );

            const items: any[] = [];
            for (const device of allDevices) {
                if (!device.id) continue; // prevent error on next line
                items.push(device)
            }

            this.setState({items});
        } catch (e) {
            console.error("Failed to get data", e);
        }
    }

    // returns promise after component mounts to DOM
    componentDidMount() {
        this.getDevices().then();
    }

    // renderDevices function to display the card component 
    renderDevices = (routerProps) => {
        let deviceID = parseInt(routerProps.match.params.id);
        let foundDevice = (this.state as any).items.find(device => device.id === deviceID);
        return (
            foundDevice ? <Card {...foundDevice}/> : <Loading/>
            );
      }

    // render function -- renders out what to display on screen
    render() {
        return (
            <Router> 
                <header>
                    <a className="button" href="/">Home</a>
                    <a className="button" href="/view-all">View All</a>
                </header>
                <Switch>
                        <Route path="/" exact component={Dashboard} />
                        <Route path = '/devices/:id' render = {routerProps => this.renderDevices(routerProps)} />
                        <Route path="/view-all"  component={ViewAll} />
                    </Switch>
            </Router>
           );
    }
}

  export default App;