import React from 'react';
import Draggable from 'react-draggable'; // For drag handling
import { shiftLeft } from 'three/tsl';

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
    console.log('deltaX:', data.deltaX); // Check this value
    const { onTimeChange } = this.props;
    const newTime = this.state.currentTime + data.deltaX;
    this.setState({ currentTime: newTime });
    if (onTimeChange) {
      onTimeChange(newTime);
    }
  }

  render() {
    const { eventType, label } = this.props;
    const { currentTime } = this.state;

    return (
      <Draggable
        axis='x'
        position={{ x: currentTime, y: 0 }}
        onDrag={this.handleDrag}
      >
        <div
          style={{
            transform: 'transposeX',
            background:
              eventType === 'carb'
                ? '#FF5733'
                : eventType === 'bolus'
                ? '#33C1FF'
                : '#8D33FF',
            color: '#fff',
            padding: '5px',
            cursor: 'pointer',
            width: '10px', // Set a fixed width
            height: '10px', // Set a fixed height
            display: 'inline-block', // Prevent it from stretching to 100% width
            textAlign: 'center',
            lineHeight: '30px', // Adjust line height for centering the label if needed
          }}
        >
          {label}
        </div>
      </Draggable>
    );
  }
}

export default GraphEvent;
