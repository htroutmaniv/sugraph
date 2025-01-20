import React, { Component } from 'react';
import Initializer from './classes/Initializer';
import GlucoseGraph from './components/GlucoseGraph';

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
  }

  render() {
    return (
      <div>
        <h1 style={{ textAlign: 'center', color: '#2adf93' }}>Sugraph</h1>
        <GlucoseGraph
          data={this.timeline} // Pass the timeline directly
          dataPointEvaluator={this.initializer.dataPointEvaluator} // Pass evaluator for recalculations
        />
      </div>
    );
  }
}

export default App;
