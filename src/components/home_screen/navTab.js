import React, { Component } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image
} from 'react-native'
import { getColor } from '../config'
import { observer, inject } from 'mobx-react/native'
import { createIconSetFromFontello } from 'react-native-vector-icons'
const pix = require('../../assets/images/plantpicturecollection');
const navs = {
  '0': pix.nav0,
  '0-active': pix.nav0active,
  '1': pix.nav1,
  '1-active': pix.nav1active,
  '2': pix.nav2,
  '2-active': pix.nav2active,
}

let fontelloConfig = require('../../assets/fontello/config.json')
let Icon = createIconSetFromFontello(fontelloConfig)

@inject("appStore") @observer
export default class NavigationTab extends Component {
  constructor(props) {
    super(props)
  }

  getTab = (num, activeNum) => {
    if (num === activeNum) {
      return navs[`${num}-active`];
    } else {
      return navs[num.toString()];
    }
  }

  render() {
    return (
      <View style={styles.tabs}>
        {this.props.tabs.map((tab, i) => {
          return (

              <TouchableOpacity key={tab} onPress={() => this.props.goToPage(i)} style={styles.tab}>
                { <Image source={this.getTab(i, this.props.activeTab)} style={styles.navItem}/> }
              </TouchableOpacity>

          )
        })}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  tabs: {
    height: 70,
    paddingTop: 20,
    flexDirection: 'row',
    elevation: 5
  },
  tab: {
    flex: 4,
    //borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    //position: 'absolute',
  },
  navItem: {
    height: 50,
    width: 50
  }
})
