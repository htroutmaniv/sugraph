import ActivityLevels from '../enums/ActivityLevels';

export class DataPoint {
  constructor({
    id = undefined, //this is the database given id for updating existing data
    glucose = 150,
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
    simulationDuration = 1,
  }) {
    this.id = id;
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

  toJSON() {
    return {
      id: this.id,
      glucose: this.glucose,
      carbsConsumed: this.carbsConsumed,
      carbsOnBoard: this.carbsOnBoard,
      insulinOnBoard: this.insulinOnBoard,
      insulinActivity: this.insulinActivity,
      basalRate: this.basalRate,
      bolusAmount: this.bolusAmount,
      timestamp: this.timestamp.toISOString(), // Ensure timestamp is properly formatted
      activityLevel: this.activityLevel,
      insulinSensitivityFactor: this.insulinSensitivityFactor,
      carbohydrateRatio: this.carbohydrateRatio,
      simulationDuration: this.simulationDuration,
    };
  }
}
