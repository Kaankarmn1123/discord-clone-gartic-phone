import React from 'react';
import GarticPhoneSocketExample from './components/GarticPhoneSocketExample';

const GarticDev: React.FC = () => {
  const roomId = 'dev-room-001';
  const userId = 'dev-user-001';
  const username = 'DevTester';
  return (
    <div style={{ padding: 16 }}>
      <h2>Gartic Phone Socket Dev Test</h2>
      <p>Bu sayfa, Socket.IO bağlantısını Railway backend'ine test etmek içindir.</p>
      <GarticPhoneSocketExample roomId={roomId} userId={userId} username={username} />
    </div>
  );
};

export default GarticDev;
