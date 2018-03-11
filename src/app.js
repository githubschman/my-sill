import React, { Component } from 'react'
import codePush from 'react-native-code-push'

import { Router, Scene, Actions } from 'react-native-mobx'
import { Provider } from 'mobx-react/native'

import { firebaseApp } from './firebase'

import LoginScreen from './views/login_screen'
import HomeScreen from './views/home_screen'
import SettingScreen from './views/setting_screen'


import appStore from './store/AppStore'

class App extends Component {
  constructor(){
    super();
    this.state = {
      store: {}
    }
  }
  componentWillUnmount() {
    this.unsubscribe && this.unsubscribe()
  }


  render() {
    console.disableYellowBox = true
    const {store} = this.state
    return (
      <Provider appStore={appStore} store={store}>
        <Router>
          <Scene
            key="login"
            component={LoginScreen}
            duration={1}
            hideNavBar
            initial
          />
          <Scene
            key="home"
            component={HomeScreen}
            duration={1}
            hideNavBar
          />
          <Scene
            key="setting"
            component={SettingScreen}
            hideNavBar={false}
            title="Edit your profile"
            panHandlers={null}
            duration={0}
          />
        </Router>
      </Provider>
    )
  }
}

export default App = codePush()(App)
