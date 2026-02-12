const mqtt = require("mqtt");
require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const mqttOptions = {
  host: process.env.MQTT_HOST,
  port: process.env.MQTT_PORT,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

const mqttClient = mqtt.connect(mqttOptions);

mqttClient.on("connect", function () {
  console.log("Mqtt Client: Connected");
});

mqttClient.on("error", function (error) {
  console.log("🚀 -----------------🚀");
  console.log("Mqtt Client: Disconnect (error)");
  console.log(error);
  console.log("🚀 -----------------🚀");
});

mqttClient.on("publish", (r) => {
  console.log(`Mqtt Client: Published ${r}`);
});

mqttClient.on("message", function (topic, message) {
  console.log("Mqtt Client: Received message:", topic, message.toString());
});

module.exports = {
  mqttClient,
};
