import React, { Component } from 'react'
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ListView,
  LayoutAnimation,
  Platform,
  UIManager,
  ProgressViewIOS,
  Image
} from 'react-native'
import _ from 'lodash'
import { firebaseApp } from '../../firebase'
import Icon from 'react-native-vector-icons/Ionicons'
import ModalPicker from 'react-native-modal-picker'
import { getColor } from '../config'
import { observer,inject } from 'mobx-react/native'
import { Actions } from 'react-native-mobx'

// all pictures
const pix = require("../../assets/images/plantpicturecollection"); 

@inject("appStore") @observer

@observer class Profile extends Component {
  constructor(props) {
    super(props)
    // if (Platform.OS === 'android') {
    //   UIManager.setLayoutAnimationEnabledExperimental(true)
    // }
    this.state = {
      isLoading: true,
      isEmpty: false,
      dataSource: new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2}),
      weather: {},
      stats: {},
      plantsGrown: new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2}),
      plantsName: new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2}),
      hallOfInfo: true,
    }
    this.userRef = firebaseApp.database().ref('/users/' + this.props.appStore.user.uid)
    this.store = this.props.appStore;
  }

  componentDidMount() {
    this.setState({hallOfInfo: true})
    
    if(this.store.gold === 0){
      this.userRef.on('value', (snapshot) => {
        let userInfo = snapshot.val()
        this.store.user_level = userInfo.user_level
        this.store.gold = userInfo.gold
        this.store.level_points = userInfo.level_points
      })  
    }

    this.getStats();
    
    let fetchingWeather = this.store.fetchWeather(this.userRef);

    Promise.all([fetchingWeather])
      .then(()=>this.setState({ isEmpty: true, isLoading: false }))
      .catch(err=>this.setState({message: newMessage(console.error(err), 'error')}))
  
  }

  componentWillReceiveProps() {
    this.getStats();
  }

  getStats() {
    // getting stats
    this.userRef.child('stats').once('value')
    .then(snapshot => snapshot.val())
    .then(stats => {
      let plantsOfFarm = Object.keys(stats.plants);
      // less than 2, because it's initalized with 1 empty property
      if (plantsOfFarm.length < 2) {
        plantsOfFarm = ['grow some plants!'];
      }
      this.setState({stats: stats, plantsGrown: this.state.plantsGrown.cloneWithRows((plantsOfFarm)), plantsName: this.state.plantsGrown.cloneWithRows((plantsOfFarm))})
    })
    .catch(console.error);
  }

  componentDidUpdate() {
    //LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
  }

  _userEdit = () => {
    Actions.setting();
  }

  _toggleMute = () => {
    this.store.mute = !this.store.mute;
    let level = this.store.mute ? 0 : .5;
    let allSounds = this.store.allSounds;

    for (let sound in allSounds) {
      allSounds[sound].setVolume(level);
    }
  }

  _logOut = () => {
    firebaseApp.auth().signOut()
    .then(() => {

      username = ''
      user = {}
    
      // reset user stats:
      planters = []
      user_level = 0
      gold = 0
      user_inventory = {}
      level_points = 0
      user_long = 0
      user_lat = 0
      weather = [0,'sunny']
      stats = {grown: 0, killed: 0}
      badges = {}

      Actions.login({ type: 'replace' });
    }, (error) => console.log);
  }

  componentWillUnmount() {
    firebaseApp.database().ref('users/' + this.store.user.uid +'/posts').off()
  }

  
  updateHOF = () => {
    this.setState({hallOfInfo: !this.state.hallOfInfo});
    this.forceUpdate();
  }
  
  _renderRowPicture = (plant) => {
    if (plant !== 'name') {
      let plantName = plant.split(' ').join('').toLowerCase();
      return (
        <TouchableOpacity onPress={this.updateHOF}>
          <View style={styles.hallOfFarmItem}>
          <Text style={styles.item}>
          {plant != 'grow some plants!' ? <Image style={styles.fullPlant} source={pix.fullplant[plantName]} /> : 'grow some plants!' } 
            </Text>
            </View>
            </TouchableOpacity>
      )
    } else {
      return null;
    }
  }
  
  _renderRowName = (plant) => {
    if (plant !== 'name') {
      let plantName = plant.split(' ').join('').toLowerCase();
      return (
        <TouchableOpacity onPress={this.updateHOF}>
        <View style={styles.hallOfFarmItem}>
            <View> 
            { plant != 'grow some plants!' ? <View><Text style={styles.levelText}>{plant + ":"} {this.state.stats.plants[plant].amt} grown</Text></View> : <Text></Text>}
            </View>
          </View>
          </TouchableOpacity>
        )
      } else {
        return null;
      }
    }
    
    
    render() {
      return (
        <View style={styles.container}>
          <View style={styles.profileInfoContainer}>
            <View style={styles.profileNameContainer}>
              <Text style={styles.profileName}>
                {this.store.username}'s Sill 
              </Text>
            </View>
            <View style={styles.profileCountsContainer}>
            </View>
          <View style={styles.profileCountsContainer}>
            <TouchableOpacity onPress={this._logOut}>
              <Text style={styles.logout}> Log Out </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.profileCountsContainer}>
            <TouchableOpacity onPress={this._toggleMute}>
              <Text style={styles.logout}>{this.store.mute ? <Image style={styles.mute} source={pix.noSound} /> : <Image style={styles.mute} source={pix.sound} />}</Text>
            </TouchableOpacity>
          </View>
          </View>
          <View style={styles.progressBar}>
          <Text style={styles.levelText}>Level {this.store.user_level}</Text>
            <ProgressViewIOS 
              progress={this.store.levelPercentage}
              trackTintColor={'#fff'}
              progressTintColor={'#8fc9cc'}
              progressViewStyle={'bar'}
              />
          </View>
  
            <View style={styles.statsView}>
              <Image style={styles.statsIcon} source={pix.heart} />  
              <Text style={styles.statsText}> {this.state.stats.grown} PLANTS GROWN </Text>
              <Image style={styles.statsIcon} source={pix.skull} /> 
              <Text style={styles.statsText}> {this.state.stats.killed} PLANTS KILLED </Text>
              </View>
            <View style={styles.hallOfFarmContainer}> 
                  <Text style={styles.hallOfFarmText}>
                    Hall of Farm
                    </Text>
                {this.state.hallOfInfo === true ?
                  <ListView
                    contentContainerStyle={styles.list}
                    automaticallyAdjustContentInsets={true}
                    dataSource={this.state.plantsGrown}
                    renderRow={this._renderRowPicture}
                    horizontal={true}
                  /> : null }
                {this.state.hallOfInfo === false ? 
                  <ListView
                  contentContainerStyle={styles.list}
                  automaticallyAdjustContentInsets={true}
                  dataSource={this.state.plantsName}
                  renderRow={this._renderRowName}
                  horizontal={true}
                /> : null}
          </View>
        </View>
      )
    }
  }
  
  
export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#628980'
  },
  hallOfFarmText: {
    fontFamily: 'Press Start 2P',
    fontSize: 20,
    color: '#fff'
  },
  levelText: {
    fontFamily: 'Pxlvetica',
    fontSize: 20,
    color: '#fff'
  },
  statsText: {
    fontFamily: 'Pxlvetica',
    fontSize: 30,
    color: '#fff'
  },
  progressBar: {
    padding: 10,
  },
  statsIcon: {
    height: 80,
    width: 80
  },
  fullPlant: {
    height: 80,
    width: 80
  },
  profileInfoContainer: {
    flexDirection: 'row',
    height: 65,
    margin: 5,
    borderRadius: 2,
    backgroundColor: '#344944'
  },
  profileNameContainer: {
    justifyContent: 'center',
  },
  profileName: {
    marginLeft: 10,
    fontFamily: 'Press Start 2P',
    fontSize: 10,
    color: '#fff',
  },
  profileCountsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 5
  },
  hallOfFarmItem: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    backgroundColor: '#7DAFA3',
    margin: 10,
    padding: 5,
    width: 100,
    height: 100
  },
  mute: {
    width: 15,
    height: 15
  },
  profileCounts: {
    fontFamily: 'Press Start 2P',
    fontSize: 12,
    color: '#fff'
  },
  countsName: {
    fontFamily: 'Press Start 2P',
    fontSize: 12,
    color: '#fff'
  },
  statsView: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#999',
    margin: 2,
  },
  RawContainer: {
    flexDirection: 'row',
    flex: 1,
    //borderWidth: 1,
    marginLeft: 5,
  },
  logout: {
    fontFamily: 'Pxlvetica',
    fontSize: 11,
    color: '#fff'
  },
  hallOfFarmContainer: {
    padding: 30,
    backgroundColor: '#98D6C7',
    borderBottomWidth: 20,
    borderColor: '#628980'
  },
  LeftContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    //borderWidth: 1,
  },
  RightContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginRight: 10,
    padding: 10,
    //borderWidth: 1,
    //backgroundColor:'#000',
  },
  title: {
    fontFamily: 'Press Start 2P',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 5,
    color: '#444',
  },
  info: {
    fontFamily: 'Press Start 2P',
    padding: 3,
    fontSize: 13,
  },
  list: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  bottom: {
    backgroundColor: '#628980'
  },
  item: {
      fontFamily: 'Pxlvetica',
      fontSize: 15,
      color: '#fff'
  }
})
