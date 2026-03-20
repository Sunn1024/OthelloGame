import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Othello Game</Text>
      <Text style={styles.sub}>Build test successful!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#00d4ff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  sub: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
});
