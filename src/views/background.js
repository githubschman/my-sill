import React, { Component } from 'react';
import {
  AppRegistry,
  Image,
  View,
} from 'react-native';

const brick = require('../assets/images/brick.png');


export default class BackgroundImage extends Component {
  render() {

    return (
      <Image
        style={{
          flex: 1,
          resizeMode: 'repeat',
          position: 'absolute',
          height: 2000,
          width: 2000,
          zIndex: -2
        }}
        source={brick}
      />
    );
  }
}

AppRegistry.registerComponent('BackgroundImage', () => BackgroundImage);