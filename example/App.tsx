import React from 'react';
import {SafeAreaView, StyleSheet, StatusBar, View, Text} from 'react-native';
import HeyteaSwiper from './src/swiper';

const App = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <HeyteaSwiper vertical={false} circular={true} autoplay={true} interval={3000}>
          <View id={1} style={[styles.block, styles.yellow]}>
            <Text>1</Text>
          </View>
          <View id={2} style={[styles.block, styles.blue]}>
            <Text>2</Text>
          </View>
          <View id={3} style={[styles.block, styles.green]}>
            <Text>3</Text>
          </View>
          <View id={4} style={[styles.block, styles.red]}>
            <Text>4</Text>
          </View>
          <View id={5} style={[styles.block, styles.grey]}>
            <Text>5</Text>
          </View>
        </HeyteaSwiper>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  block: {
    width: '100%',
    height: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellow: {
    backgroundColor: 'yellow',
  },
  blue: {
    backgroundColor: 'blue',
  },
  green: {
    backgroundColor: 'green',
  },
  red: {
    backgroundColor: 'red',
  },
  grey: {
    backgroundColor: 'grey',
  },
});

export default App;
