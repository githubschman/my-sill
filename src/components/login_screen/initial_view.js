import React, { Component } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native'
import { getColor } from '../config'
import * as Animatable from 'react-native-animatable'
import { observer, inject } from 'mobx-react/native'


@inject("appStore") @observer
export default class InitialView extends Component {
  constructor(props) {
    super(props)
    this.state = {
      init: true,
      signInPressed: false,
      signUpPressed: false
    }
  }

  componentDidMount() {
    console.log("--------- INITIAL VIEW --------- ")
    // this.props.appStore.tracker.trackScreenView('INITIAL VIEW')
  }

  render() {
    const animation = this.state.init ? 'bounceInUp' : 'bounceOutDown'
    return (
      <Animatable.View
      animation={animation}
      style={styles.container}
      delay={this.props.animDelay}
      onAnimationEnd={this._handleAnimEnd.bind(this)}>
        <Text style={styles.title}>Sill</Text>
        <View style={styles.btnBox}>
          <TouchableOpacity onPress={this._handleSignInPress.bind(this)}>
            <View style={styles.btnContainer}>
              <Text style={styles.btnText}>{ 'Login'.toUpperCase() }</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._handleSignUpPress.bind(this)}>
            <View style={styles.btnContainer}>
              <Text style={styles.btnText}>{ 'Sign Up'.toUpperCase() }</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    )
  }

  _handleSignInPress() {
    this.setState({ init: false, signInPressed: true })
  }

  _handleSignUpPress() {
    this.setState({ init: false, signUpPressed: true })
  }

  _handleAnimEnd() {
    if (!this.state.init) {
      if (this.state.signInPressed) {
        this.props.onSignIn()
      }
      if (this.state.signUpPressed) {
        this.props.onSignUp()
      }
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 20
  },
  title: {
    fontFamily: 'Press Start 2P',
    backgroundColor: 'transparent',
    marginTop: 20,
    fontWeight: '300',
    fontSize: 70,
    color: '#fff',
  },
  version: {
    backgroundColor: 'transparent',
    fontSize: 6,
    marginBottom: 20,
    color: '#fff',
  },
  btnBox: {
    height: 40,
    width: 300,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end'
  },
  btnContainer: {
    width: 130,
    height: 40,
    backgroundColor: '#4b6f9c',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'Press Start 2P',
    fontWeight: '800',
    fontSize: 12,
    color: '#fff'
  }
})
