import React, { Component } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  Dimensions
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

    
    this.styles = styles;
    let d = Dimensions.get('window');
    const { height, width } = d;

    let isX = (height === 812 || width === 812) ? true : false;
    // let isSmall = !isx && (height < 600 || width < 600);
    if (isX) {
      this.styles = bigStyles;
      this.setState({showInventory: true});
    }

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
      <View style={this.styles.tabs}>
        {this.props.tabs.map((tab, i) => {
          return (

              <TouchableOpacity key={tab} onPress={() => this.props.goToPage(i)} style={this.styles.tab}>
                { <Image source={this.getTab(i, this.props.activeTab)} style={this.styles.navItem}/> }
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

const bigStyles = StyleSheet.create({
  tabs: {
    height: 90,
    paddingTop: 40,
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
    paddingTop: 10,
    height: 50,
    width: 50
  }
})
