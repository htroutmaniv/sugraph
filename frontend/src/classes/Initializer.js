import { DataPoint } from './DataPoint';
import DataPointEvaluator from './DataPointEvaluator';

class Initializer {
  constructor({ isfSchedule, crSchedule }) {
    this.isfSchedule = isfSchedule || [{ time: '00:00', isf: 50 }]; // Default ISF schedule
    this.crSchedule = crSchedule || [{ time: '00:00', cr: 10 }]; // Default CR schedule
    this.dataPointEvaluator = new DataPointEvaluator({});
    this.timeline = this.generateTimeline();
    this.applyFactorsToTimeline(this.timeline);
    this.dataPointEvaluator.evaluateTimeline(this.timeline);
  }

  // Generate a timeline of DataPoints for a 24-hour period
  generateTimeline(startTime = new Date(), intervalMinutes = 5) {
    startTime.setHours(0, 0, 0, 0);
    const timeline = [];
    for (let i = 0; i < 24 * 60; i += intervalMinutes) {
      const timestamp = new Date(startTime.getTime() + i * 60 * 1000);
      timeline.push(new DataPoint({ timestamp }));
    }
    return timeline;
  }

  // Get the current factor (ISF or CR) for a specific time from a schedule
  getCurrentFactor(schedule, currentTime) {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(
      currentMinute
    ).padStart(2, '0')}`;

    for (let i = schedule.length - 1; i >= 0; i--) {
      if (currentTimeStr >= schedule[i].time) {
        return schedule[i].isf || schedule[i].cr;
      }
    }
    return schedule[0].isf || schedule[0].cr;
  }

  // Apply ISF and CR changes to the timeline
  applyFactorsToTimeline(timeline) {
    timeline.forEach((dataPoint) => {
      dataPoint.insulinSensitivityFactor = this.getCurrentFactor(
        this.isfSchedule,
        dataPoint.timestamp
      );
      dataPoint.carbohydrateRatio = this.getCurrentFactor(
        this.crSchedule,
        dataPoint.timestamp
      );
    });
  }
}

export default Initializer;
