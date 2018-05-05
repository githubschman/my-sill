import React, { Component } from 'react'
import {
  View,
  ScrollView,
  Text,
  TextInput,
  BackAndroid,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
  Modal,
  TouchableHighlight,
} from 'react-native'
import { firebaseApp } from '../../firebase'
import { getColor } from '../config'
import * as Animatable from 'react-native-animatable'
import { Actions } from 'react-native-mobx'
import { observer,inject } from 'mobx-react/native'
import HowTo from './howto'
import { Planter } from '../../planterconfig'

@inject("appStore") @observer
export default class SignUpForm extends Component {
  constructor(props) {
    super(props)
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental(true)
    }
    this.state = {
      init: true,
      errMsg: null,
      signUpSuccess: false,
      name: '',
      email: '',
      password: '',
      modalVisible: false,
      long: 0,
      lat: 0
    }
  }

  componentDidMount() {
    console.log("--------- SIGN UP --------- ")
    // this.props.appStore.tracker.trackScreenView('SIGN UP')
    BackAndroid.addEventListener('backBtnPressed', this._handleBackBtnPress)
    navigator.geolocation.getCurrentPosition((loc)=>{
      this.setState({long: String(loc.coords.longitude), lat: String(loc.coords.latitude)})
    }, null, { enableHighAccuracy: true}); 
  }

  componentDidUpdate() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
  }

  componentWillUnmount() {
    BackAndroid.removeEventListener('backBtnPressed', this._handleBackBtnPress)
  }

  setModalVisible(visible) {
    this.setState({modalVisible: visible});
  }

  render() {
    const animation = this.state.init ? 'bounceInUp' : 'bounceOutDown'

    const errorMessage = this.state.errMsg ?
      <Text style={styles.errMsg}>{this.state.errMsg}</Text>
    : null

    const signUpForm = this.state.signUpSuccess ?
      null
    :
      <View>
        <Modal
          animationType={"slide"}
          transparent={false}
          visible={this.state.modalVisible}
        >
          <View style={{ marginTop:22, marginBottom:22 }}>
            <ScrollView>
              <HowTo />
              <TouchableOpacity style={{ alignItems: 'center', }} onPress={() => {this.setModalVisible(!this.state.modalVisible)}}>
                <View style={styles.submitBtnContainer}>
                  <Text style={styles.submitBtn}>CLOSE</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.dopetunes}> 
              Thanks to Kevin Macleod and Bensounds.com for the dope tunes:
              </Text>
              <Text style={styles.dopetunes}> 
              - Tenderness 
              Bensound.com
              </Text>
              <Text style={styles.dopetunes}> 
              - Dewdrop Fantasy
              - Immersed
              - Fresh Air
              - Dreamer
              - Carpe Diem
              - Angel Share
              - Destiny Day
              - Bittersweet
              - Porch Swing Days
              - Summer Day
              - Pride
              - Cheery Monday
              - Odyssey
              - Inner Light
              </Text>
              <Text style={styles.dopetunes}> 
              Kevin MacLeod (incompetech.com)
              Licensed under Creative Commons: By Attribution 3.0 License 
              </Text>
            </ScrollView>
         </View>
        </Modal>
        <View style={[styles.inputContainer, { marginBottom: 10 }]}>
          <TextInput
          style={styles.inputField}
          value={this.state.name}
          onChangeText={(text) => this.setState({ name: text })}
          autoCapitalize='words'
          autoCorrect={false}
          underlineColorAndroid='transparent'
          placeholder='Username'
          maxLength={18}
          placeholderTextColor='rgba(255,255,255,.6)'
          onSubmitEditing={(event) => {
            this.refs.SecondInput.focus();
          }}
          />
        </View>
        <View style={[styles.inputContainer, { marginBottom: 10 }]}>
          <TextInput
          ref='SecondInput'
          style={styles.inputField}
          value={this.state.email}
          keyboardType='email-address'
          autoCorrect={false}
          autoCapitalize='none'
          onChangeText={(text) => this.setState({ email: text })}
          underlineColorAndroid='transparent'
          placeholder='Your Email'
          placeholderTextColor='rgba(255,255,255,.6)'
          onSubmitEditing={(event) => {
            this.refs.ThirdInput.focus();
          }}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
          ref='ThirdInput'
          style={styles.inputField}
          value={this.state.password}
          onChangeText={(text) => this.setState({ password: text })}
          onSubmitEditing={(event) => {this._handleSignUp()}}
          underlineColorAndroid='transparent'
          placeholder='Choose Password'
          secureTextEntry={true}
          placeholderTextColor='rgba(255,255,255,.6)'
          />
        </View>
        <View style={styles.btnContainers}>
          <TouchableOpacity onPress={this._handleSignUp}>
            <View style={styles.submitBtnContainer}>
              <Text style={styles.submitBtn}>{'Go!'.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View>
          <TouchableHighlight style={styles.showModal} onPress={() => { this.setModalVisible(true) }}>
            <Text style={styles.howToPlay}>How to Play</Text>
          </TouchableHighlight>
        </View>
      </View>

    return (
      <Animatable.View
      animation={animation}
      style={styles.container}
      onAnimationEnd={this._handleAnimEnd}>
        <Text style={styles.title}>Sign Up</Text>
        {errorMessage}
        {signUpForm}
      </Animatable.View>
    )
  }

  _handleSignUp = () => {
    this.setState({errMsg: 'Signing Up...'})
    if (this.state.name.length < 5) {
      this.setState({errMsg: "Your name should be at least 5 characters."})
    }
    else if (this.state.email.length == 0) {
      this.setState({errMsg: "Please enter your email."})
    }
    else if (this.state.password.length == 0) {
      this.setState({errMsg: "Please enter your password."})
    }
    else {
      firebaseApp.database().ref('usernameList').child(this.state.name.toLowerCase()).once('value')
      .then((snapshot) => {
        if (snapshot.val()) {
          this.setState({ errMsg: "Username not available." })
        }
        else {

          firebaseApp.auth().createUserWithEmailAndPassword(this.state.email, this.state.password)
          .then((user) => {
            firebaseApp.database().ref('usernameList').child(this.state.name.toLowerCase()).set(user.uid)
            user.updateProfile({displayName: this.state.name})
            .then(() => {
              const uid = user.uid
              const username = user.displayName
              const planters = [new Planter(0), new Planter(1), new Planter(2), new Planter(3)]
              const email = user.email
              const user_long = this.state.long
              const user_lat = this.state.lat
              const user_level = 1
              const gold = 15
              const weather = {temp:0, sun: 'sunny'}
              const user_inventory =  [{name: 'Hoe', amount: 1, type: 'tool', stage: null}]
              const level_points = 4
              const stats = {grown: 0, killed: 0, plants: {name: { amount: 0, level: 0}}} 
              const weatherCheckTime = {time: 1};         
              firebaseApp.database().ref('users/' + user.uid)
                .set({
                  uid,
                  username,
                  email,
                  planters,
                  user_long,
                  user_lat,
                  weather,
                  user_level,
                  gold,
                  user_inventory,
                  level_points,
                  stats,
                  weatherCheckTime
                });
              this.props.appStore.username = user.displayName;
              this.props.appStore.planters = planters;
              this.props.appStore.user_level = user_level;
              this.props.appStore.gold = gold;
              this.props.appStore.user_inventory = user_inventory;
              this.props.appStore.level_points = level_points;
              this.props.appStore.user = user;
              this.props.weatherCheckTime = weatherCheckTime;
              Actions.home({ type: 'replace' })
            }, function(error) {
              console.log(error);
            });
          })
          .catch((error) => {
            this.setState({ errMsg: error.message });
          })
        }
      })
    }
  }

  _handleGoBack = () => {
    this.setState({ init: false })
  }

  _handleBackBtnPress = () => {
    this._handleGoBack()
    return true
  }

  _handleAnimEnd = () => {
    if (!this.state.init) {
      this.props.onBackFromSignUp()
    }
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 25,
    fontFamily: 'Press Start 2P',
    marginBottom: 10,
    color: '#fff',
    backgroundColor: 'transparent',
  },
  errMsg: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Press Start 2P',
    marginBottom: 10,
    width: 280,
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    backgroundColor: 'rgba(0,0,0,.3)',
    borderRadius: 5
  },
  inputField: {
    width: 280,
    height: 40,
    paddingLeft: 15,
    paddingRight: 15,
    color: '#fff'
  },
  btnContainers: {
    marginTop: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: 280
  },
  submitBtnContainer: {
    width: 120,
    height: 40,
    backgroundColor: '#4b6f9c',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  submitBtn: {
    fontFamily: 'Press Start 2P',
    fontSize: 20,
    fontWeight: '800',
    color: '#fff'
  },
  howToPlay: {
    fontFamily: 'Press Start 2P',
    fontSize: 20,
    fontWeight: '800',
    color: '#fff'
  },
  showModal: {
    marginTop: 40,
    alignItems: 'center'
  },
  dopetunes: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 20,
    marginBottom: 5,
    fontFamily: 'Press Start 2P',
    fontSize: 13,
    fontWeight: '800',
    color: '#4b6f9c'
  },
})
