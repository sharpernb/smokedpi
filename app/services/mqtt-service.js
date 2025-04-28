import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;
const subscriptions = {};

// Debug logging function
const logMessage = (message) => {
  if (__DEV__) {
    console.log(message);
  }
};

// Initialize WebSocket connection
export const connectToMQTT = (serverUri = 'ws://192.168.86.48:1880/ws') => {
  return new Promise((resolve, reject) => {
    try {
      // Close existing connection if any
      if (socket) {
        socket.close();
      }

      logMessage(`Connecting to WebSocket at ${serverUri}`);
      
      // Create WebSocket connection
      socket = new WebSocket(serverUri);

      socket.onopen = () => {
        logMessage('WebSocket connection established');
        
        // Subscribe to all previously registered topics
        Object.keys(subscriptions).forEach((topic) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              action: 'subscribe',
              topic: topic
            }));
            logMessage(`Resubscribed to topic: ${topic}`);
          }
        });
        
        // Request initial status
        publishToMQTT('grill/command', 'getStatus');
        
        resolve();
      };

      socket.onmessage = (event) => {
        try {
          logMessage(`Raw WebSocket message: ${event.data}`);
          const message = JSON.parse(event.data);
          logMessage(`Parsed message: ${JSON.stringify(message)}`);
          
          // Check if this is a message with topic and payload
          if (message.topic && message.payload !== undefined) {
            // Notify all subscribers for this topic
            if (subscriptions[message.topic]) {
              subscriptions[message.topic].forEach((callback) => {
                callback(message.payload);
              });
            }
          }
        } catch (error) {
          console.log('Error parsing message:', error);
        }
      };

      socket.onerror = (error) => {
        console.log('WebSocket Error:', error);
        reject(error);
      };

      socket.onclose = () => {
        logMessage('WebSocket connection closed');
      };
    } catch (error) {
      console.log('Exception in WebSocket setup:', error);
      reject(error);
    }
  });
};

// Subscribe to a topic
export const subscribeTopic = (topic, callback) => {
  logMessage(`Subscribing to topic: ${topic}`);
  
  if (!subscriptions[topic]) {
    subscriptions[topic] = [];

    // If socket is already connected, send subscription message
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        action: 'subscribe',
        topic: topic
      }));
      logMessage(`Sent subscription request for topic: ${topic}`);
    }
  }

  // Add callback to subscribers list
  subscriptions[topic].push(callback);
};

// Unsubscribe from a topic
export const unsubscribeTopic = (topic, callback) => {
  if (!subscriptions[topic]) return;

  if (callback) {
    // Remove specific callback
    const index = subscriptions[topic].indexOf(callback);
    if (index !== -1) {
      subscriptions[topic].splice(index, 1);
    }

    // If no more callbacks, unsubscribe from topic
    if (subscriptions[topic].length === 0) {
      delete subscriptions[topic];
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          action: 'unsubscribe',
          topic: topic
        }));
        logMessage(`Unsubscribed from topic: ${topic}`);
      }
    }
  } else {
    // Remove all callbacks
    delete subscriptions[topic];
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        action: 'unsubscribe',
        topic: topic
      }));
      logMessage(`Unsubscribed from topic: ${topic}`);
    }
  }
};

// Publish a message to a topic
export const publishToMQTT = (topic, message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const payload = JSON.stringify({
      topic: topic,
      payload: message
    });
    socket.send(payload);
    logMessage(`Published to ${topic}: ${message}`);
  } else {
    logMessage('Cannot publish: WebSocket not connected');
  }
};

// Disconnect from WebSocket
export const disconnectMQTT = () => {
  if (socket) {
    socket.close();
    socket = null;
    logMessage('Disconnected from WebSocket');
  }
};

// Check if connected
export const isConnected = () => {
  return socket && socket.readyState === WebSocket.OPEN;
};

// Create a dummy component for the default export
const MQTTService = () => null;

// Export the service as default
export default MQTTService;
