class CarbEvent {
  constructor({ timestamp, amount }) {
    this.timestamp = timestamp || new Date();
    this.amount = amount;
  }

  isExpired(currentTime, absorptionDuration) {
    const elapsedTime = (currentTime - this.timestamp) / (1000 * 60); // Time in minutes
    return elapsedTime > absorptionDuration;
  }

  calculateCOB(currentTime, absorptionDuration) {
    const elapsedTime = (currentTime - this.timestamp) / (1000 * 60); // Time in minutes
    if (elapsedTime < 0 || elapsedTime > absorptionDuration) {
      return 0; // Carbs fully absorbed or invalid case
    }
    // Exponential decay model for carb absorption
    return this.amount * Math.exp(-elapsedTime / (absorptionDuration / 3));
  }
}

class COBCalculator {
  constructor({ absorptionDuration = 90 } = {}) {
    this.absorptionDuration = absorptionDuration; // Default absorption duration in minutes (e.g., 1.5 hours)
    this.carbMap = new Map();
  }

  setAbsorptionDuration(durationInMinutes) {
    this.absorptionDuration = durationInMinutes;
  }

  //carbId is the timestamp for now
  addCarb(carbId, carbAmount) {
    console.log(`ADDING CARBS: ${carbAmount}`);
    const carbEvent = new CarbEvent(carbId, carbAmount);
    this.carbMap.set(carbId, carbEvent);
  }

  removeExpiredCarbs(currentTime) {
    for (const [carbId, carbEvent] of this.carbMap.entries()) {
      if (carbEvent.isExpired(currentTime, this.absorptionDuration)) {
        this.carbMap.delete(carbId);
      }
    }
  }

  calculateTotalCOB(currentTime) {
    //this.removeExpiredCarbs(currentTime);

    return Array.from(this.carbMap.values())
      .map((carb) => carb.calculateCOB(currentTime, this.absorptionDuration))
      .reduce((total, contribution) => total + contribution, 0);
  }
}

export { CarbEvent, COBCalculator };
