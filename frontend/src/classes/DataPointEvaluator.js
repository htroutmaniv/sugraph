import IOBCalculator from './IOBCalculator.js';
import { COBCalculator } from './COBCalculator.js';

class DataPointEvaluator {
  constructor({ iobCalculator, cobCalculator }) {
    this.iobCalculator = iobCalculator || new IOBCalculator();
    this.cobCalculator = cobCalculator || new COBCalculator();
  }

  // This function calculates the new glucose level based on changes in carbs and insulin
  calculateGlucose(previousDataPoint, newCarbsOnBoard, newInsulinOnBoard) {
    const isf = previousDataPoint.insulinSensitivityFactor;
    const cr = previousDataPoint.carbohydrateRatio;

    const glucoseChangeFromCarbs = newCarbsOnBoard * (isf / cr); // Glucose impact per gram of carbs
    const glucoseChangeFromInsulin = newInsulinOnBoard * -isf; // Glucose reduction per unit of insulin

    return Math.max(
      previousDataPoint.glucose +
        glucoseChangeFromCarbs +
        glucoseChangeFromInsulin,
      0
    );
  }

  // Evaluate a timeline of DataPoints sequentially
  evaluateTimeline(timeline) {
    console.log('evaluating timeline!');
    for (let i = 1; i < timeline.length; i++) {
      const previousPoint = timeline[i - 1];
      const currentPoint = timeline[i];

      const newInsulinOnBoard = this.iobCalculator.calculateTotalIOB(
        currentPoint.timestamp
      );
      const newCarbsOnBoard = this.cobCalculator.calculateTotalCOB(
        currentPoint.timestamp
      );

      console.log(`IOB: ${newInsulinOnBoard},  COB: ${newCarbsOnBoard}`);
      const calculatedGlucose = this.calculateGlucose(
        previousPoint,
        newCarbsOnBoard,
        newInsulinOnBoard
      );
      console.log(`calculatedGlucose: ${calculatedGlucose}`);
      currentPoint.glucose = calculatedGlucose;

      currentPoint.carbsOnBoard = newCarbsOnBoard;
      currentPoint.insulinOnBoard = newInsulinOnBoard;
    }
  }
}

export default DataPointEvaluator;
