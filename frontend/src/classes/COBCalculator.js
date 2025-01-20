import CARBPROFILES from '../enums/CarbProfiles.js';

class CarbEvent {
  constructor(timestamp, amount, carbProfile = CARBPROFILES.medium) {
    this.timestamp = timestamp || new Date();
    this.amount = amount;
    this.carbProfile = carbProfile;
  }

  isExpired(currentTime, absorptionDuration) {
    const elapsedTime = (currentTime - this.timestamp) / (1000 * 60); // Time in minutes
    return elapsedTime > absorptionDuration;
  }

  /**
   * Models the instantaneous carbohydrate absorption rate (grams/minute)
   * as a piecewise "triangle" with a definable time to peak.
   *
   * Integrating this returned rate from t=0..absorptionDuration
   * yields the total carbs (this.amount).
   *
   * @param {Date|number} currentTime - Timestamp (ms) or Date
   * @param {number} absorptionDuration - Total duration (minutes) to absorb all carbs
   * @param {number} peak - Time (minutes) from ingestion to peak absorption rate
   * @returns {number} Carbs absorption rate (grams/minute) at currentTime
   */
  calculateCarbActivity(currentTime) {
    const absorptionDuration = this.carbProfile.absorptionDuration;
    const peak = this.carbProfile.peak;
    const elapsedTime = (currentTime - this.timestamp) / (1000 * 60); // minutes

    // If we're before ingestion or after full absorption, rate=0
    if (elapsedTime < 0 || elapsedTime > absorptionDuration) {
      return 0;
    }

    // Convert to normalized time [0..1]
    const x = elapsedTime / absorptionDuration;
    // Convert peak (minutes) to normalized peak ratio
    const peakRatio = peak / absorptionDuration;

    // Piecewise linear rise (0->1) then fall (1->0)
    let shape;
    if (x <= peakRatio) {
      // Rising side: from 0 at x=0 to 1 at x=peakRatio
      shape = x / peakRatio;
    } else {
      // Falling side: from 1 at x=peakRatio to 0 at x=1
      shape = 1 - (x - peakRatio) / (1 - peakRatio);
    }

    // The basic 0->1->0 "triangle" has an area = 0.5 from x=0..1.
    // Multiply by 2 => integrated area = 1.0 (dimensionless).
    const dimensionlessActivity = shape * 2.0;

    // Convert dimensionless shape into "grams/minute."
    // Multiplying by (this.amount / absorptionDuration) ensures
    // the total integrated carbs over 0..absorptionDuration == this.amount.
    const gramsPerMinute =
      dimensionlessActivity * (this.amount / absorptionDuration);

    return gramsPerMinute;
  }
}

class COBCalculator {
  constructor(absorptionDuration = 90) {
    this.absorptionDuration = absorptionDuration; // Default absorption duration in minutes (e.g., 1.5 hours)
    this.carbMap = new Map();
  }

  setAbsorptionDuration(durationInMinutes) {
    this.absorptionDuration = durationInMinutes;
  }

  //carbId is the timestamp for now
  // TODO: add carbProfile parameter to allow switching between glycemic index impacts
  addCarb(carbId, carbAmount) {
    console.log(`ADDING CARBS: ${carbAmount}`);
    const carbEvent = new CarbEvent(carbId, carbAmount);
    this.carbMap.set(carbId, carbEvent);
    console.log(`carbMap ${this.carbMap}`);
  }

  removeExpiredCarbs(currentTime) {
    for (const [carbId, carbEvent] of this.carbMap.entries()) {
      if (carbEvent.isExpired(currentTime, this.absorptionDuration)) {
        this.carbMap.delete(carbId);
      }
    }
  }

  calculateTotalCarbActivity(currentTime) {
    //this.removeExpiredCarbs(currentTime);

    return Array.from(this.carbMap.values())
      .map((carb) => carb.calculateCarbActivity(currentTime))
      .reduce((total, contribution) => total + contribution, 0);
  }
}

export { CarbEvent, COBCalculator };
