import userSettings from '../userSettings';

class BolusEvent {
  constructor(timestamp, amount) {
    this.timestamp = timestamp || new Date();
    this.amount = amount;
  }

  isExpired(currentTime, insulinActionDuration) {
    const elapsedTime = (currentTime - this.timestamp) / (1000 * 60);
    return elapsedTime > insulinActionDuration;
  }

  /**
   * Calculates the "instantaneous insulin activity" in units/minute
   * at `currentTime`, using a piecewise "triangle" shape with a defined peak.
   *
   * Integrating this returned value over the entire duration from
   * t=0..insulinActionDuration yields `this.amount` (the full bolus).
   *
   * @param {Date|number} currentTime - The current time as a Date or ms timestamp
   * @param {number} insulinActionDuration - The total DIA in minutes (e.g. 180)
   * @param {number} peak - The time in minutes to peak insulin effect (e.g. 60-90)
   * @returns {number} insulin activity (units/minute) at this instant
   */
  calculateActivity(
    currentTime,
    insulinActionDuration,
    peak = userSettings.peak
  ) {
    const elapsedMinutes = (currentTime - this.timestamp) / (1000 * 60);
    const dia = insulinActionDuration; // total duration (minutes)

    // If time < 0 (before bolus) or time > DIA (after it finishes), activity = 0
    if (elapsedMinutes < 0 || elapsedMinutes > dia) {
      return 0;
    }

    // Normalize time into [0..1]
    const x = elapsedMinutes / dia;
    const peakRatio = peak / dia;

    // Piecewise linear rise/fall from 0 → 1 → 0
    let shape;
    if (x <= peakRatio) {
      // Rising from 0 at x=0 to 1 at x=peakRatio
      shape = x / peakRatio;
    } else {
      // Falling from 1 at x=peakRatio to 0 at x=1
      shape = 1 - (x - peakRatio) / (1 - peakRatio);
    }

    // shape(0..1..0) has area=0.5. Multiply by 2 => area=1.0 (dimensionless).
    const dimensionlessActivity = shape * 2.0;

    // *** CRITICAL STEP: Convert dimensionless shape into actual "units/minute." ***
    // The integral from 0..dia of (dimensionlessActivity * (amount/dia)) dt = amount.
    // => multiply by (amount / dia)
    const unitsPerMinute = dimensionlessActivity * (this.amount / dia);

    return unitsPerMinute;
  }
}

class IOBCalculator {
  constructor(insulinActionDuration = userSettings.insulinActionDuration) {
    this.insulinActionDuration = insulinActionDuration;
    this.bolusMap = new Map();
  }
  getActiveBoluses(currentTimestamp) {
    return Array.from(this.bolusMap.values()).filter(
      (bolus) => !bolus.isExpired(currentTimestamp, this.insulinActionDuration)
    );
  }

  setInsulinActionDuration(durationInMinutes) {
    this.insulinActionDuration = durationInMinutes;
  }

  addBolusEvent(dataPoint) {
    const { timestamp, bolusAmount } = dataPoint;
    const bolusId = timestamp;

    const bolusEvent = new BolusEvent(bolusId, bolusAmount);
    this.bolusMap.set(bolusId, bolusEvent);
  }

  calculateTotalActivity(currentTime) {
    return Array.from(this.bolusMap.values())
      .map((bolus) =>
        bolus.calculateActivity(currentTime, this.insulinActionDuration)
      )
      .reduce((total, contribution) => total + contribution, 0);
  }
}

export default IOBCalculator;
