import React, { Component } from 'react';
import Initializer from './classes/Initializer';
import GlucoseGraph from './components/GlucoseGraph';
import EventTracking from './classes/EventTracking';
import { Box, TextField, Button, Typography } from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs'; // To format dates
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'; // Import Date Picker
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

class App extends Component {
  constructor(props) {
    super(props);

    // Initialize the system
    this.initializer = new Initializer({
      isfSchedule: [
        { time: '00:00', isf: 44 },
        { time: '08:00', isf: 40 },
        { time: '10:00', isf: 31 },
        { time: '12:00', isf: 34 },
        { time: '16:00', isf: 45 },
      ],
      crSchedule: [
        { time: '00:00', cr: 9.2 },
        { time: '08:00', cr: 6 },
        { time: '12:00', cr: 7.1 },
        { time: '15:00', cr: 9.5 },
      ],
    });

    // Generate and prepare the timeline
    this.timeline = this.initializer.timeline;
    this.eventTracker = new EventTracking();

    // Set up state for the form fields
    this.state = {
      bolus: '',
      carbs: '',
      glucose: '',
      time: '',
      eventDetails: {}, // will hold the parsed numbers
      selectedTimestamp: null,
      selectedDate: dayjs(), // Default to today
      timeline: this.timeline, // Store timeline state
    };
  }

  // Callback to handle a click on the chart data point.
  handleChartClick = (clickData) => {
    // Recharts provides an event object. It may contain activePayload with the clicked datapoint.
    if (
      clickData &&
      clickData.activePayload &&
      clickData.activePayload.length > 0
    ) {
      const datapoint = clickData.activePayload[0].payload;
      this.currentDataPoint = datapoint;
      console.log('Clicked datapoint:', datapoint);
      this.setState({
        bolus: datapoint.bolusAmount || 0,
        carbs: datapoint.carbsConsumed || 0,
        glucose: datapoint.glucose.toFixed(1) || '',
        time: datapoint.timestamp
          ? new Date(datapoint.timestamp).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',

        selectedTimestamp: datapoint.timestamp,
      });
    }
  };

  // Generic handler for text field changes
  handleInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  // Handler for the "Add Event" button click
  handleAddEvent = () => {
    // Parse the values from the text fields
    const carbAmount = parseFloat(this.state.carbs) || 0;
    const bolusAmount = parseFloat(this.state.bolus) || 0;
    console.log(`addEvent called. carbs: ${carbAmount}, bolus: ${bolusAmount}`);

    // Update eventDetails in state, then call handleEventSubmit
    this.setState(
      (prevState) => ({
        eventDetails: {
          ...prevState.eventDetails,
          carbs: carbAmount,
          bolus: bolusAmount,
        },
      }),
      () => {
        this.handleEventSubmit();
      }
    );
  };

  handleEventSubmit() {
    const { timeline, initializer } = this; // assuming timeline and initializer are stored in the component
    const dataPointEvaluator = initializer.dataPointEvaluator;
    const { selectedTimestamp, eventDetails } = this.state;

    if (!Array.isArray(timeline)) {
      console.error('Timeline is not an array.');
      return;
    }

    if (selectedTimestamp) {
      // Find and update the matching DataPoint
      const matchingPoint = timeline.find(
        (point) => point.timestamp.getTime() === selectedTimestamp.getTime()
      );

      if (matchingPoint) {
        matchingPoint.carbsConsumed = eventDetails.carbs;

        matchingPoint.bolusAmount = eventDetails.bolus;

        // Re-evaluate the timeline starting from the affected DataPoint
        dataPointEvaluator.evaluateTimeline(timeline);

        // Force the component to re-render to reflect updates
        this.forceUpdate();
      } else {
        console.warn('No matching DataPoint found for the selected timestamp.');
      }
    }

    // Close the dialog (if you're using one)
    this.setState({ dialogOpen: false });
  }

  handleUpload = async () => {
    if (!this.timeline || this.timeline.length === 0) {
      console.error('No timeline data available to upload.');
      return;
    }

    let data = [];
    this.timeline.forEach((dp) => {
      if (dp.bolusAmount > 0 || dp.carbsConsumed > 0) {
        const dpJSON = dp.toJSON();
        data.push(dpJSON);
      }
    });

    if (data.length > 0) {
      try {
        const response = await axios.post(
          'http://localhost:3001/api/add-datapoints',
          data
        );
        console.log('Upload successful:', response.data);
      } catch (error) {
        console.error('Error uploading timeline:', error);
      }
    } else {
      console.log(`no data to upload`);
    }
  };

  // Handle date change from the date picker
  handleDateChange = (newDate) => {
    this.setState({ selectedDate: newDate });
  };

  // Import Data for the Selected Date
  handleImport = async () => {
    const { selectedDate } = this.state;

    // Ensure the date is correctly formatted in UTC (ISO 8601 format)
    const startTime = selectedDate.startOf('day').toISOString();
    const endTime = selectedDate.endOf('day').toISOString();

    try {
      const response = await axios.get(
        'http://localhost:3001/api/get-datapoints',
        {
          params: { startTime, endTime },
        }
      );

      if (response.data.length > 0) {
        this.updateTimelineData(response.data);
        console.log('Imported data:', response.data);
      } else {
        console.log('No data available for the selected date.');
      }
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  updateTimelineData(data) {
    // Reinitialize the timeline
    this.initializer = new Initializer({
      isfSchedule: [
        { time: '00:00', isf: 44 },
        { time: '08:00', isf: 40 },
        { time: '10:00', isf: 31 },
        { time: '12:00', isf: 34 },
        { time: '16:00', isf: 45 },
      ],
      crSchedule: [
        { time: '00:00', cr: 9.2 },
        { time: '08:00', cr: 6 },
        { time: '12:00', cr: 7.1 },
        { time: '15:00', cr: 9.5 },
      ],
    });

    this.timeline = this.initializer.timeline;

    //set the baseline glucose level for the timeline to the first imported data glucose level
    const baselineGlucose = data[0].Glucose;
    this.timeline.forEach((dataPoint) => {
      dataPoint.glucose = baselineGlucose;
    });

    data.forEach((dp) => {
      // Convert imported timestamp to a Date object
      const dpTime = new Date(dp.SimulatedTimestamp).getTime();

      // Find matching DataPoint in the existing timeline
      const matchingPoint = this.timeline.find(
        (point) => new Date(point.timestamp).getTime() === dpTime
      );

      if (matchingPoint) {
        // Update all relevant properties
        matchingPoint.id = dp.DataPointID;
        matchingPoint.glucose = dp.Glucose;
        matchingPoint.carbsConsumed = dp.CarbsConsumed;
        matchingPoint.carbsOnBoard = dp.CarbsOnBoard;
        matchingPoint.insulinOnBoard = dp.InsulinOnBoard;
        matchingPoint.insulinActivity = dp.InsulinActivity;
        matchingPoint.basalRate = dp.BasalRate;
        matchingPoint.bolusAmount = dp.BolusAmount;
        matchingPoint.activityLevel = dp.ActivityLevel;
        matchingPoint.insulinSensitivityFactor = dp.InsulinSensitivityFactor;
        matchingPoint.carbohydrateRatio = dp.CarbohydrateRatio;
        matchingPoint.simulationDuration = dp.SimulationDuration;
      }
    });
    this.initializer.dataPointEvaluator.evaluateTimeline(this.timeline);
    // Trigger component re-render
    this.setState({ timeline: this.timeline }, () => {
      console.log('Timeline updated with imported data.');
    });
  }

  render() {
    // Define a common sx style for the TextFields to use white text and outlines
    const textFieldSx = {
      input: { color: 'white' },
      '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: 'white' }, // Default border color
        '&:hover fieldset': { borderColor: 'white' }, // Hover effect
        '&.Mui-focused fieldset': { borderColor: 'white' }, // Focus effect
      },
    };

    return (
      <Box sx={{ p: 2 }}>
        <Typography variant='h3' align='center' sx={{ color: '#2adf93' }}>
          Sugraph
        </Typography>

        {/* Glucose Graph */}
        <GlucoseGraph
          data={this.timeline} // Pass the timeline directly
          dataPointEvaluator={this.initializer.dataPointEvaluator} // Pass evaluator for recalculations
          onChartClick={this.handleChartClick}
          selectedTimestamp={this.state.selectedTimestamp}
        />

        {/* Layout Container */}
        <Box
          sx={{
            mt: 4,
            display: 'flex',
            flexDirection: 'row', // Keep sections aligned horizontally
            gap: 4,
            maxWidth: '1000px',
            mx: 4,
            alignItems: 'flex-start', // Align sections to the top
          }}
        >
          {/* Left Section: Text Fields and Add Event Button */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              flex: 1,
              alignItems: 'flex-start',
            }}
          >
            <TextField
              label='Bolus Amount'
              variant='outlined'
              name='bolus'
              value={this.state.bolus}
              onChange={this.handleInputChange}
              slotProps={{
                inputLabel: { sx: { color: '#33C1FF' } },
              }}
              sx={textFieldSx}
            />
            <TextField
              label='Carbs Consumed'
              variant='outlined'
              name='carbs'
              value={this.state.carbs}
              onChange={this.handleInputChange}
              slotProps={{
                inputLabel: { sx: { color: '#FF5733' } },
              }}
              sx={textFieldSx}
            />
            <TextField
              label='Glucose'
              variant='outlined'
              name='glucose'
              value={this.state.glucose}
              onChange={this.handleInputChange}
              slotProps={{
                input: { readOnly: true },
                inputLabel: { sx: { color: '#2adf93' } },
              }}
              sx={textFieldSx}
            />
            <TextField
              label='Time'
              variant='outlined'
              name='time'
              value={this.state.time}
              onChange={this.handleInputChange}
              slotProps={{
                input: { readOnly: true },
                inputLabel: { sx: { color: 'white' } },
              }}
              sx={textFieldSx}
            />

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 2,
                flex: 1,
                alignItems: 'flex-start',
              }}
            >
              <Button
                variant='contained'
                color='primary'
                onClick={this.handleAddEvent}
              >
                ADD EVENT
              </Button>

              <Button
                variant='contained'
                color='primary'
                onClick={this.handleUpload}
              >
                UPLOAD
              </Button>
            </Box>
          </Box>

          {/* Right Section: Select Date, Import, and Upload Buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'flex-end',
              mx: 20,
              mt: 0,
            }}
          >
            {/* Date Picker & Import Button aligned to the top */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileDatePicker
                  label='Select Date'
                  value={this.state.selectedDate}
                  onChange={this.handleDateChange}
                  slotProps={{
                    textField: {
                      variant: 'outlined',
                      sx: {
                        input: { color: 'white' }, // Text color
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'white' }, // Default border color
                          '&:hover fieldset': { borderColor: 'white' }, // Hover effect
                          '&.Mui-focused fieldset': { borderColor: 'white' }, // Focus effect
                        },
                        label: { color: 'white' }, // Label text color
                        '& .MuiInputLabel-root': {
                          color: 'white',
                          '&.Mui-focused': { color: 'white' }, // Label color when focused
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>

              <Button
                variant='contained'
                color='secondary'
                sx={{ bgcolor: '#a100ff' }}
                onClick={this.handleImport}
              >
                IMPORT
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
}

export default App;
