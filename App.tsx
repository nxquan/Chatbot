/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {JSX} from 'react';
import {Chat} from './src/Chat';
import {EventProvider} from 'react-native-outside-press';

function App(): JSX.Element {
  return (
    <EventProvider>
      <Chat />
    </EventProvider>
  );
}

export default App;
