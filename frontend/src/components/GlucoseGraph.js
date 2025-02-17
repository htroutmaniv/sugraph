import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceArea,
} from 'recharts';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import GraphEvent from './GraphEvent';

class GlucoseGraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tooltipData: null,
      dialogOpen: false,
      selectedTimestamp: null,
      eventDetails: { carbs: 0, bolus: 0 },
      chartWidth: 0,
      zoneDisplay: 'None',
    };

    this.chartContainerRef = React.createRef();
  }
  handleZoneChange = (event) => {
    this.setState({ zoneDisplay: event.target.value });
  };

  updateChartWidth = () => {
    if (this.chartContainerRef.current) {
      const width = this.chartContainerRef.current.offsetWidth;
      this.setState({ chartWidth: width });
    }
  };

  componentDidMount() {
    this.updateChartWidth();
    window.addEventListener('resize', this.updateChartWidth);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateChartWidth);
  }

  // Format the timestamp into a readable string
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Custom Tooltip Component
  CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { timestamp, glucose, carbsConsumed, bolusAmount } =
        payload[0].payload;
      const glucoseColor = '#2adf93';
      const bolusColor = '#33C1FF';
      const carbColor = '#FF5733';

      return (
        <div
          style={{
            backgroundColor: '#555',
            padding: '10px',
            borderRadius: '5px',
            color: '#fff',
          }}
        >
          {bolusAmount > 0 && (
            <p style={{ color: bolusColor }}>{`Bolus: ${bolusAmount}`}</p>
          )}
          {carbsConsumed > 0 && (
            <p style={{ color: carbColor }}>{`Carbs: ${carbsConsumed}`}</p>
          )}
          <p style={{ color: glucoseColor }}>{`Glucose: ${glucose.toFixed(
            1
          )} mg/dL`}</p>
          <p>{`Time: ${this.formatTime(timestamp)}`}</p>
        </div>
      );
    }
    return null;
  };

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Revised getZonesFromData function
  getZonesFromData = (data, key) => {
    const normalizeTime = (timestamp, baseTime) => {
      const t = new Date(timestamp).getTime();
      return (t - baseTime) / (1000 * 60);
    };

    const colorPalette = [
      '#AEDFF7',
      '#FFE4B5',
      '#C1FFC1',
      '#FFD1DC',
      '#E0BBE4',
    ];

    const getColorForZone = (zoneIndex) => {
      return colorPalette[zoneIndex % colorPalette.length];
    };

    if (!data || data.length === 0) return [];
    const zones = [];
    const baseTime = new Date(data[0].timestamp).getTime();
    let currentZone = {
      value: data[0][key],
      start: normalizeTime(data[0].timestamp, baseTime),
      // color will be assigned later based on zone index
      color: null,
    };

    for (let i = 1; i < data.length; i++) {
      const normalized = normalizeTime(data[i].timestamp, baseTime);
      if (data[i][key] !== currentZone.value) {
        currentZone.end = normalizeTime(data[i - 1].timestamp, baseTime);
        zones.push(currentZone);
        currentZone = {
          value: data[i][key],
          start: normalized,
          color: null,
        };
      }
    }
    currentZone.end = normalizeTime(data[data.length - 1].timestamp, baseTime);
    zones.push(currentZone);

    // Assign a consistent color to each zone based on its index.
    zones.forEach((zone, idx) => {
      zone.color = getColorForZone(idx);
    });

    return zones;
  };

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
    const { onChartClick } = this.props;
    if (onChartClick) {
      onChartClick(e);
    }
    if (e && e.activeLabel !== null) {
      const { data } = this.props;
      const clickedTime = e.activeLabel;
      const startTime = new Date(data[0].timestamp);
      const clickedTimestamp = new Date(
        startTime.getTime() + clickedTime * 60 * 1000
      );

      this.setState({
        selectedTimestamp: clickedTimestamp,
        clickPosition: { x: e.chartX, y: e.chartY }, // Track click location
      });
    }
  }

  handleEventDrag(event, newXPosition) {
    const { data } = this.props;

    const startTime = new Date(data[0].timestamp).getTime();
    const xDomain = 1440; // Total minutes in a day (24 * 60)
    const graphWidth = 1000; // Adjust based on your graph's width

    // Calculate new timestamp based on the dragged position
    const elapsedMinutes = (newXPosition / graphWidth) * xDomain;
    const newTimestamp = new Date(startTime + elapsedMinutes * 60 * 1000);

    // Update the event's timestamp
    const updatedEvent = { ...event, timestamp: newTimestamp };
    this.eventTracker.updateEvent(event, updatedEvent);

    // Re-render the graph
    this.forceUpdate();
  }

  renderGraphEvents() {
    if (!this.eventTracker || this.eventTracker.events.length === 0)
      return null;

    return this.eventTracker.events.map((event, index) => {
      //const xPos = this.calculateXPosition(event.time);
      const xPos = this.state.clickPosition.x;

      return (
        <GraphEvent
          key={index}
          eventType={event.type}
          timestamp={event.dataPoint.time}
          initialTime={xPos}
          onDrag={this.handleEventDrag.bind(this)}
          event={event}
        />
      );
    });
  }

  calculateXPosition(datetimeValue) {
    // Ensure there's data to base the calculation on
    if (!this.props.data || this.props.data.length === 0) return 0;

    // Convert the incoming datetime value and the start time to Date objects.
    const eventTime =
      datetimeValue instanceof Date ? datetimeValue : new Date(datetimeValue);
    const startTime = new Date(this.props.data[0].timestamp);

    // Calculate the difference in minutes
    const normalizedTime = Math.round((eventTime - startTime) / (1000 * 60));
    console.log(`Normalized time (minutes from start): ${normalizedTime}`);

    const { chartWidth } = this.state;
    console.log(`chart width: ${chartWidth}`);
    // Map the normalized time to pixels; here 1440 represents the total minutes in 24 hours.
    let xPos = (normalizedTime / 1440) * chartWidth;
    console.log(`Calculated X position (before offset): ${xPos}`);

    // Adjust for any left margin offset (if your XAxis starts, for example, 20px in)
    const leftOffset = 20;
    return xPos + leftOffset;
  }

  render() {
    const { data } = this.props;
    const { zoneDisplay } = this.state;
    // Process data to add normalizedTime
    const processedData = this.processData(data);

    let zones = [];
    if (zoneDisplay === 'ISF') {
      zones = this.getZonesFromData(processedData, 'insulinSensitivityFactor');
    } else if (zoneDisplay === 'CR') {
      zones = this.getZonesFromData(processedData, 'carbohydrateRatio');
    }

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
        <div
          ref={this.chartContainerRef}
          style={{ position: 'relative', width: '100%', height: 300 }}
        >
          <ResponsiveContainer width='100%' height={300}>
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
              <Tooltip content={<this.CustomTooltip />} />
              {/* Render ISF zones – using, say, a light blue color */}
              {zoneDisplay !== 'None' &&
                zones.map((zone, idx) => (
                  <ReferenceArea
                    key={`zone-${idx}`}
                    x1={zone.start}
                    x2={zone.end}
                    fill={zone.color}
                    opacity={0.2}
                    label={{
                      value: `${zoneDisplay}: ${zone.value}`,
                      position: 'top',
                      fill: '#fff',
                      fontSize: 12,
                    }}
                  />
                ))}
              <Line
                type='monotone'
                dataKey='glucose'
                name='Glucose'
                stroke='#2adf93'
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              {/* Render reference dots for events */}
              {processedData.map((point, index) => {
                let fill = null;
                if (point.bolusAmount > 0 && point.carbsConsumed > 0) {
                  fill = '#8D33FF'; // Purple for both events
                } else if (point.bolusAmount > 0) {
                  fill = '#33C1FF'; // Blue for bolus only
                } else if (point.carbsConsumed > 0) {
                  fill = '#FF5733'; // Red for carbs only
                }
                return fill ? (
                  <ReferenceDot
                    key={`ref-${index}`}
                    x={point.normalizedTime}
                    y={point.glucose}
                    r={5}
                    fill={fill}
                    stroke='none'
                  />
                ) : null;
              })}
            </LineChart>

            {this.renderGraphEvents()}
          </ResponsiveContainer>

          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            {/* radio buttons */}
            <Typography variant='body2' sx={{ color: 'white', mr: 1 }}>
              Display Zones:
            </Typography>
            <RadioGroup
              row
              value={zoneDisplay}
              onChange={this.handleZoneChange}
              sx={{
                // Ensure labels are white
                '.MuiFormControlLabel-label': { color: 'white' },
              }}
            >
              <FormControlLabel
                value='ISF'
                control={
                  <Radio
                    sx={{
                      color: '#2adf93',
                      '&.Mui-checked': { color: '#2adf93' },
                    }}
                  />
                }
                label='ISF'
              />
              <FormControlLabel
                value='CR'
                control={
                  <Radio
                    sx={{
                      color: '#2adf93',
                      '&.Mui-checked': { color: '#2adf93' },
                    }}
                  />
                }
                label='CR'
              />
              <FormControlLabel
                value='None'
                control={
                  <Radio
                    sx={{
                      color: '#2adf93',
                      '&.Mui-checked': { color: '#2adf93' },
                    }}
                  />
                }
                label='None'
              />
            </RadioGroup>
          </Box>
        </div>
      </Box>
    );
  }
}

export default GlucoseGraph;
