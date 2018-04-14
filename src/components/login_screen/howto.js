import React, { Component } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image
} from 'react-native'
const pix = require('../../assets/images/plantpicturecollection');

export default class HowTo extends Component {

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.howto}>How To Play</Text>
        <Image source={pix.fullplant.minisilverballcactus} style={styles.image}/>
          <Text style={styles.instructions}>{`Buy seeds from the seed shop and plant them in the potters in your window sill. Make sure you water them or they'll die!
          `}</Text>
          <Image source={pix.fullplant.rainboworchid} style={styles.image}/>
          <Text style={styles.instructions}>{`Plants are affected by the real life weather outside. Some plants grow faster in certain conditions!
          
          `}</Text>
          <Image source={pix.fullplant.gloxinia} style={styles.image}/>
          <Text style={styles.instructions}>{`If you kill more than 5 succulents, they will band together and seek revenge. Just kidding, but try not to kill them anyway.
          `}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft: 20,
    marginRight: 20,
  },
  instructions: {
    textAlign: 'center',
    fontFamily: 'Press Start 2P',
    fontSize: 12,
    color: '#000'
  },
  image: {
    justifyContent: 'center'
  },
  howto: {
    fontFamily: 'Press Start 2P',
    fontSize: 20,
    fontWeight: '800',
    color: '#4b6f9c'
  },
});