class BolusEvent {
  constructor({ timestamp, amount }) {
    this.timestamp = timestamp || new Date();
    this.amount = amount;
  }

  isExpired(currentTime, insulinActionDuration) {
    const elapsedTime = (currentTime - this.timestamp) / (1000 * 60);
    return elapsedTime > insulinActionDuration;
  }

  calculateIOB(currentTime, insulinActionDuration, timeToPeak = 60) {
    const elapsedTime = (currentTime - this.timestamp) / (1000 * 60); // Time in minutes

    if (elapsedTime < 0 || elapsedTime > insulinActionDuration) {
      return 0; // Insulin no longer active
    }

    // Exponential decay with peak formula
    const effect =
      (elapsedTime / timeToPeak) * Math.exp(1 - elapsedTime / timeToPeak);

    return this.amount * effect; // Scale by bolus amount
  }
}

class IOBCalculator {
  constructor({ insulinActionDuration = 180 } = {}) {
    this.insulinActionDuration = insulinActionDuration;
    this.bolusMap = new Map();
  }

  setInsulinActionDuration(durationInMinutes) {
    this.insulinActionDuration = durationInMinutes;
  }

  addBolus(bolusId, bolusAmount) {
    const bolusEvent = new BolusEvent(bolusId, bolusAmount);
    this.bolusMap.set(bolusId, bolusEvent);
  }

  removeExpiredBoluses(currentTime) {
    for (const [bolusId, bolusEvent] of this.bolusMap.entries()) {
      if (bolusEvent.isExpired(currentTime, this.insulinActionDuration)) {
        this.bolusMap.delete(bolusId);
      }
    }
  }

  calculateTotalIOB(currentTime) {
    //this.removeExpiredBoluses(currentTime);
    return Array.from(this.bolusMap.values())
      .map((bolus) =>
        bolus.calculateIOB(currentTime, this.insulinActionDuration)
      )
      .reduce((total, contribution) => total + contribution, 0);
  }
}

export default IOBCalculator;
