import React, { useState } from 'react';
import ToggleButtons from './ToggleButtons';
import AuthForm from './AuthForm';

function App() {
  const [activeForm, setActiveForm] = useState('login');

  return (
    <div className="container">
      <h1>Ristack</h1>
      <ToggleButtons setActiveForm={setActiveForm} />
      <AuthForm type={activeForm} />
    </div>
  );
}

export default App;