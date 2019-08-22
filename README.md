# RedisTimeSeries-Grafana

### Running the App

This is a Node.js app that sits in between RedisTimeSeries and Grafana. To run the app, first download the files and run:
````
npm install package.json
node index.js <Redis port number>
````

Verify whether the app is running by opening http://localhost:3333. It is working as long as it doesn't throw a 404 error.

### Connecting Grafana to the App

Use SimpleJson data source to connect to your app. See the picture below that shows the configuration
![Grafana Screenshot](https://raw.githubusercontent.com/redislabsdemo/RedisTimeSeries-Grafana/master/GrafanaScreenshot.png)



