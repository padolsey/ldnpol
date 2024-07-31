import React from 'react';
import PolicyInput from './components/PolicyInput';

const Home: React.FC = () => {
  return (
    <div className="container">
      <h1>Greater London Policy Reaction Simulator</h1>
      <PolicyInput />
    </div>
  );
};

export default Home;