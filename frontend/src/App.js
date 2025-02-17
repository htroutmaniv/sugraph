import React, { Component } from 'react';
import Initializer from './classes/Initializer';
import GlucoseGraph from './components/GlucoseGraph';
import EventTracking from './classes/EventTracking';
import { Box, TextField, Button, Typography } from '@mui/material';

class App extends Component {
  constructor(props) {
    super(props);

    // Initialize the system
    this.initializer = new Initializer({
      isfSchedule: [{ time: '00:00', isf: 50 }],
      crSchedule: [{ time: '00:00', cr: 10 }],
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
          ? new Date(datapoint.timestamp).toLocaleTimeString()
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
        // Determine event type
        const eventType =
          eventDetails.carbs > 0 && eventDetails.bolus > 0
            ? 'both'
            : eventDetails.carbs > 0
            ? 'carbs'
            : eventDetails.bolus > 0
            ? 'bolus'
            : null;

        if (eventType) {
          // Add the event to the EventTracking instance (assume this.eventTracker is available)
          this.eventTracker.addEvent(
            eventType,
            selectedTimestamp,
            matchingPoint
          );
        }

        // Add a carb event if carbs were entered
        if (eventDetails.carbs > 0) {
          matchingPoint.carbsConsumed = eventDetails.carbs;
          dataPointEvaluator.cobCalculator.addCarb(
            selectedTimestamp,
            eventDetails.carbs
          );
        }

        // Add a bolus event if insulin was entered
        if (eventDetails.bolus > 0) {
          matchingPoint.bolusAmount = eventDetails.bolus;
          dataPointEvaluator.iobCalculator.addBolus(
            selectedTimestamp,
            eventDetails.bolus
          );
        }

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

  render() {
    // Define a common sx style for the TextFields to use white text and outlines
    const textFieldSx = {
      input: { color: 'white' },
      '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: 'white' },
        '&:hover fieldset': { borderColor: 'white' },
        '&.Mui-focused fieldset': { borderColor: 'white' },
      },
    };

    return (
      <Box sx={{ p: 2 }}>
        <Typography variant='h3' align='center' sx={{ color: '#2adf93' }}>
          Sugraph
        </Typography>
        <GlucoseGraph
          data={this.timeline} // Pass the timeline directly
          dataPointEvaluator={this.initializer.dataPointEvaluator} // Pass evaluator for recalculations
          onChartClick={this.handleChartClick}
        />
        {/* MUI form beneath the graph */}
        <Box
          sx={{
            mt: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            maxWidth: '400px',
            mx: 'auto',
            alignItems: 'flex-start', // Left-justify components
            ml: 2,
          }}
        >
          <TextField
            label='Bolus Amount'
            variant='outlined'
            name='bolus'
            value={this.state.bolus}
            onChange={this.handleInputChange}
            InputLabelProps={{ sx: { color: 'white' } }}
            sx={textFieldSx}
          />
          <TextField
            label='Carbs Consumed'
            variant='outlined'
            name='carbs'
            value={this.state.carbs}
            onChange={this.handleInputChange}
            InputLabelProps={{ sx: { color: 'white' } }}
            sx={textFieldSx}
          />
          <TextField
            label='Glucose'
            variant='outlined'
            name='glucose'
            value={this.state.glucose}
            onChange={this.handleInputChange}
            InputLabelProps={{ sx: { color: 'white' } }}
            sx={textFieldSx}
          />
          <TextField
            label='Time'
            variant='outlined'
            name='time'
            value={this.state.time}
            onChange={this.handleInputChange}
            InputLabelProps={{ sx: { color: 'white' } }}
            sx={textFieldSx}
          />
          <Button variant='contained' onClick={this.handleAddEvent}>
            Add Event
          </Button>
        </Box>
      </Box>
    );
  }
}

export default App;
