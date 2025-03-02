const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDatabase } = require('../config/db');

// API Test Route
router.get('/test', (req, res) => {
  res.send({ message: 'Backend is working!' });
});

// Get Datapoints Route
router.get('/get-datapoints', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      return res
        .status(400)
        .json({ error: 'Missing startTime or endTime parameter' });
    }

    console.log(`Received startTime: ${startTime}, endTime: ${endTime}`);

    const pool = await connectToDatabase();
    const request = pool.request();

    request.input('StartTime', sql.DateTime, new Date(startTime));
    request.input('EndTime', sql.DateTime, new Date(endTime));

    const result = await request.execute('GetDataPointsByTimeRange');

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error retrieving data points:', error);
    res
      .status(500)
      .json({ error: 'Internal Server Error', details: error.message });
  }
});

// Add Datapoints Route
router.post('/add-datapoints', async (req, res) => {
  try {
    const dataPoints = req.body;
    if (!Array.isArray(dataPoints)) {
      return res
        .status(400)
        .json({ error: 'Invalid data format. Expected an array.' });
    }

    const pool = await connectToDatabase();
    let modifiedCount = 0;

    for (const dp of dataPoints) {
      const simulatedTimestamp = new Date(dp.timestamp);
      const bolusAmount = dp.bolusAmount !== null ? dp.bolusAmount : null;
      const carbsConsumed = dp.carbsConsumed !== null ? dp.carbsConsumed : null;

      const request = pool.request();
      request.input('DataPointID', sql.UniqueIdentifier, dp.id ?? null);
      request.input('Glucose', sql.Int, dp.glucose);
      request.input('CarbsConsumed', sql.Int, carbsConsumed);
      request.input('CarbsOnBoard', sql.Decimal(10, 2), dp.carbsOnBoard);
      request.input('InsulinOnBoard', sql.Decimal(10, 2), dp.insulinOnBoard);
      request.input('InsulinActivity', sql.Decimal(10, 2), dp.insulinActivity);
      request.input('BasalRate', sql.Decimal(10, 2), dp.basalRate);
      request.input('BolusAmount', sql.Decimal(10, 2), bolusAmount);
      request.input('SimulatedTimestamp', sql.DateTime, simulatedTimestamp);
      request.input('ActivityLevel', sql.NVarChar(50), dp.activityLevel);
      request.input(
        'InsulinSensitivityFactor',
        sql.Int,
        dp.insulinSensitivityFactor
      );
      request.input('CarbohydrateRatio', sql.Int, dp.carbohydrateRatio);
      request.input('SimulationDuration', sql.Int, dp.simulationDuration);

      await request.execute('AddOrUpdateDataPoint');
      modifiedCount++;
    }

    res.status(200).json({ message: `Modified ${modifiedCount} data points.` });
  } catch (error) {
    console.error('Error processing data points:', error);
    res
      .status(500)
      .json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;
