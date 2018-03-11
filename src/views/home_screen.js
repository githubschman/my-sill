import React, { Component } from 'react'
import {
  View,
  StatusBar,
  StyleSheet
} from 'react-native'
import ScrollableTabView from 'react-native-scrollable-tab-view';
import { getColor } from '../components/config';
import NavigationTab from '../components/home_screen/navTab';
import WindowSill from '../components/home_screen/windowsill';
import Profile from '../components/home_screen/profile';
import SeedShop from '../components/home_screen/seedShop';
import { Actions } from 'react-native-mobx';
import { observer, inject } from 'mobx-react/native';

@inject("appStore") @observer
export default class HomeScreen extends Component {
  constructor(props) {
    super(props)
  }

  componentWillMount() {
  }

  render() {
    return (
      <View style={styles.container}>

        <ScrollableTabView
        initialPage={0}
        style={{borderTopWidth:0}}
        renderTabBar={() => <NavigationTab />}>

          <WindowSill tabLabel="globe"/>
          <SeedShop tabLabel="shopping-basket"/>
          <Profile tabLabel="user"/>

        </ScrollableTabView>
      </View>
    )
  }

  componentWillUnmount() {
    this.props.appStore.current_page = ''
    this.props.appStore.current_puid = ''
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#8fc9bb'
  }
})
