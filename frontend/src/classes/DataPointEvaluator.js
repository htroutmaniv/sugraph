import IOBCalculator from './InsulinActivityCalculator.js';
import { COBCalculator } from './COBCalculator.js';

class DataPointEvaluator {
  constructor({ iobCalculator, cobCalculator }) {
    this.iobCalculator = iobCalculator || new IOBCalculator();
    this.cobCalculator = cobCalculator || new COBCalculator();
  }

  // This function calculates the new glucose level based on changes in carbs and insulin
  calculateGlucose(previousDataPoint, currentDataPoint) {
    const isf = previousDataPoint.insulinSensitivityFactor; // Sensitivity factor
    const cr = previousDataPoint.carbohydrateRatio; // Carbohydrate ratio
    // Calculate the effect of insulin and carbs on glucose
    const insulinEffect =
      currentDataPoint.insulinActivity *
      currentDataPoint.simulationDuration *
      -isf; // Negative because insulin reduces glucose
    const carbEffect =
      currentDataPoint.carbsOnBoard *
      currentDataPoint.simulationDuration *
      (isf / cr); // Positive because carbs increase glucose

    // Adjust glucose from the previous data point
    const newGlucose = previousDataPoint.glucose + insulinEffect + carbEffect;

    // Ensure glucose value is non-negative
    return Math.max(newGlucose, 0);
  }

  // Evaluate a timeline of DataPoints sequentially
  evaluateTimeline(timeline) {
    for (let i = 1; i < timeline.length; i++) {
      const currentPoint = timeline[i];
      const previousPoint = timeline[i - 1];

      // Calculate IOB and COB
      currentPoint.insulinActivity = this.iobCalculator.calculateTotalActivity(
        currentPoint.timestamp
      );
      currentPoint.carbsOnBoard = this.cobCalculator.calculateTotalCarbActivity(
        currentPoint.timestamp
      );
      // Calculate Glucose
      currentPoint.glucose = this.calculateGlucose(previousPoint, currentPoint);
    }
  }
}

export default DataPointEvaluator;
