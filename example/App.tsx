import React from 'react';
import {SafeAreaView, StyleSheet, StatusBar, View} from 'react-native';
import HeyteaSwiper from './src/swiper';

const App = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <HeyteaSwiper vertical={false}>
          <View style={styles.block1} />
          <View style={styles.block2} />
          <View style={styles.block3} />
          <View style={styles.block4} />
          <View style={styles.block5} />
        </HeyteaSwiper>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  block1: {
    backgroundColor: 'green',
    width: '100%',
    height: 200,
  },
  block2: {
    backgroundColor: 'red',
    width: '100%',
    height: 200,
  },
  block3: {
    backgroundColor: 'yellow',
    width: '100%',
    height: 200,
  },
  block4: {
    backgroundColor: 'blue',
    width: '100%',
    height: 200,
  },
  block5: {
    backgroundColor: 'grey',
    width: '100%',
    height: 200,
  },
});

export default App;
