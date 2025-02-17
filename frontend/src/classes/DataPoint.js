import ActivityLevels from '../enums/ActivityLevels';

export class DataPoint {
  constructor({
    glucose = 280,
    carbsConsumed = null,
    carbsOnBoard = 0,
    insulinOnBoard = 0,
    insulinActivity = 0,
    basalRate = 0,
    bolusAmount = null,
    timestamp = new Date(),
    activityLevel = ActivityLevels.NONE,
    insulinSensitivityFactor = 50, // ISF: How much 1 unit of insulin lowers glucose (mg/dL)
    carbohydrateRatio = 10, // CR: How many grams of carbs 1 unit of insulin offsets
    simulationDuration = 5,
  }) {
    this.glucose = glucose;
    this.carbsConsumed = carbsConsumed;
    this.carbsOnBoard = carbsOnBoard;
    this.insulinOnBoard = insulinOnBoard;
    this.basalRate = basalRate;
    this.bolusAmount = bolusAmount;
    this.timestamp = timestamp;
    this.activityLevel = activityLevel;
    this.insulinSensitivityFactor = insulinSensitivityFactor;
    this.carbohydrateRatio = carbohydrateRatio;
    this.insulinActivity = insulinActivity;
    this.simulationDuration = simulationDuration;
  }
}
