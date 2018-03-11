import React, { Component } from 'react';
import {
  AppRegistry,
  Image,
} from 'react-native';

const brickSingle = require('../assets/images/brick-single.png');

export default class SingleBackgroundImage extends Component {
  render() {

    return (
      <Image
        style={{
          flex: 1,
          resizeMode: 'repeat',
          position: 'absolute',
          height: 2000,
          width: 2000,
          zIndex: -1
        }}
        source={brickSingle}
      />
    );
  }
}

AppRegistry.registerComponent('SingleBackgroundImage', () => SingleBackgroundImage);