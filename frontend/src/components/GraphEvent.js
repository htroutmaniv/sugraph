import React from 'react';
import { Draggable } from 'react-draggable'; // For drag handling

class GraphEvent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: props.initialTime, // Time in minutes from start of the graph
    };

    this.handleDrag = this.handleDrag.bind(this);
  }

  // Handle drag event
  handleDrag(e, data) {
    const { onTimeChange } = this.props;
    const newTime = this.state.currentTime + data.deltaX; // Adjust time based on drag
    this.setState({ currentTime: newTime });

    if (onTimeChange) {
      onTimeChange(newTime); // Notify parent component of the time change
    }
  }

  render() {
    const { eventType, label } = this.props;
    const { currentTime } = this.state;

    return (
      <Draggable
        axis='x'
        position={{ x: currentTime, y: 0 }} // Position based on time
        onDrag={this.handleDrag}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            background:
              eventType === 'carb'
                ? '#FF5733' // Red-orange for carb events
                : eventType === 'bolus'
                ? '#33C1FF' // Blue for bolus events
                : '#8D33FF', // Purple for combined carb+bolus events

            color: '#fff',
            padding: '5px',
            cursor: 'pointer',
          }}
        >
          {label}
        </div>
      </Draggable>
    );
  }
}

export default GraphEvent;
