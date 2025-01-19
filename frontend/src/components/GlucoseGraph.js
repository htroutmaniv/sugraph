import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';

class GlucoseGraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tooltipData: null,
      dialogOpen: false,
      selectedTimestamp: null,
      eventDetails: { carbs: 0, bolus: 0 },
    };
  }

  // Format the timestamp into a readable string
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Process data to include normalizedTime
  processData(data) {
    if (!data || data.length === 0) return [];

    const startTime = new Date(data[0].timestamp); // Assume data is sorted by time
    return data.map((point) => {
      const timeDifference = Math.round(
        (new Date(point.timestamp) - startTime) / (1000 * 60) // Difference in minutes
      );
      return {
        ...point,
        normalizedTime: timeDifference, // Add normalized time for X-axis
      };
    });
  }

  // Handle graph click to select a timestamp for adding an event
  handleGraphClick(e) {
    if (e && e.activeLabel !== null) {
      const { data } = this.props;
      const clickedTime = e.activeLabel;
      const startTime = new Date(data[0].timestamp);
      const clickedTimestamp = new Date(
        startTime.getTime() + clickedTime * 60 * 1000
      );

      this.setState({
        selectedTimestamp: clickedTimestamp,
        dialogOpen: true,
      });
    }
  }

  // Handle the addition of carb/bolus events
  handleEventSubmit() {
    const { data, dataPointEvaluator } = this.props;
    const { selectedTimestamp, eventDetails } = this.state;
    const timeline = data;

    console.log('Event Details on Submit:', eventDetails);
    console.log('Selected Timestamp on Submit:', selectedTimestamp);
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
        // Add a carb event if carbs were entered
        if (eventDetails.carbs > 0) {
          dataPointEvaluator.cobCalculator.addCarb(
            selectedTimestamp,
            eventDetails.carbs
          );
        }

        // Add a bolus event if insulin was entered
        if (eventDetails.bolus > 0) {
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

    // Close the dialog
    this.setState({ dialogOpen: false });
  }

  render() {
    const { data } = this.props;
    const { dialogOpen, eventDetails } = this.state;

    // Process data to add normalizedTime
    const processedData = this.processData(data);

    return (
      <Box
        sx={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: 3,
          boxShadow: 3,
          width: '100%',
        }}
      >
        <Typography
          variant='h6'
          align='center'
          sx={{ color: '#2adf93', marginBottom: 2 }}
        >
          Glucose Levels Over Time
        </Typography>
        <ResponsiveContainer width='100%' height={400}>
          <LineChart
            data={processedData}
            onClick={this.handleGraphClick.bind(this)}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#444' />
            <XAxis
              dataKey='normalizedTime'
              type='number'
              domain={[0, 1440]} // 1440 minutes in 24 hours
              tickCount={25}
              tickFormatter={(tick) => `${Math.floor(tick / 60)}:00`}
              label={{
                value: 'Time (hours)',
                position: 'insideBottom',
                offset: -20,
                fill: '#ffffff',
              }}
              tick={{ fill: '#ffffff' }}
            />
            <YAxis
              domain={[0, 450]}
              label={{
                value: 'Glucose (mg/dL)',
                angle: -90,
                position: 'insideLeft',
                fill: '#ffffff',
              }}
              tick={{ fill: '#ffffff' }}
            />
            <Tooltip />
            <Line
              type='monotone'
              dataKey='glucose'
              name='Glucose'
              stroke='#2adf93'
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Event Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => this.setState({ dialogOpen: false })}
        >
          <DialogTitle>Add Event</DialogTitle>
          <DialogContent>
            <TextField
              label='Carbs Consumed'
              type='number'
              fullWidth
              value={eventDetails.carbs}
              onChange={(e) => {
                console.log('Carbs Input Change:', e.target.value); // Debug log
                this.setState({
                  eventDetails: {
                    ...eventDetails,
                    carbs: Number(e.target.value),
                  },
                });
              }}
            />
            <TextField
              label='Bolus Amount'
              type='number'
              fullWidth
              value={eventDetails.bolus}
              onChange={(e) =>
                this.setState({
                  eventDetails: {
                    ...eventDetails,
                    bolus: Number(e.target.value),
                  },
                })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.setState({ dialogOpen: false })}>
              Cancel
            </Button>
            <Button onClick={this.handleEventSubmit.bind(this)} color='primary'>
              Add Event
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
}

export default GlucoseGraph;
