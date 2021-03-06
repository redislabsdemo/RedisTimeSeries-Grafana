# RedisTimeSeries-Grafana

### Running the App

This Node.js app sits in between RedisTimeSeries and Grafana. To run the app, first download the files and run:
````
npm install package.json
````

To run the app, run the following command. Pass the port number of your Redis server as a command line argument. For example, if your Redis port is 6380, run:
````
node index.js 6380
````

The app assumes 6379 as the default port. If you do not pass the port number, it connects to Redis on the default port.

Verify whether the app is running by opening http://localhost:3333. It is working as long as it doesn't throw a 404 error.

### Connecting Grafana to the App

Use SimpleJson data source to connect to your app. See the picture below that shows the configuration
![Grafana Screenshot](https://raw.githubusercontent.com/redislabsdemo/RedisTimeSeries-Grafana/master/GrafanaScreenshot.png)



