class EventTracking {
  constructor(dataPointEvaluator) {
    this.events = [];
    this.listeners = []; // Array of listeners
    this.dataPointEvaluator = dataPointEvaluator;
  }

  // Add a listener for event updates
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  // Notify all listeners of event changes
  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.events));
  }

  // Update an event's time
  updateEvent(eventId, newTime) {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      event.time = newTime;
      this.notifyListeners();
    }
  }

  // Add a new event
  addEvent(type, time, dataPoint) {
    const newEvent = {
      id: this.events.length,
      type,
      time,
      dataPoint,
    };

    this.events.push(newEvent);
    this.notifyListeners();
  }

  // Remove an event
  removeEvent(eventId) {
    this.events = this.events.filter((e) => e.id !== eventId);
    this.notifyListeners();
  }

  // Get all events
  getEvents() {
    return this.events;
  }
}

export default EventTracking;
