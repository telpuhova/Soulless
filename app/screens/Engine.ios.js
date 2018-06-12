import React, { Component } from "react";
import PropTypes from "prop-types";
import { Dimensions, Image, View, PanResponder, TouchableOpacity, Animated } from "react-native";
import { Loop, Stage, Sprite } from "react-game-kit/native";
import ControlButton from '../components/Button/ControlButton';
// import TileMap from './TileMap';
import { TileMap } from "react-game-kit/native";
const TouchableSprite = Animated.createAnimatedComponent(TouchableOpacity);

import Bar from './Bar';
import Board from "./Board";

export default class Engine extends Component {
  static propTypes = {
    gameBoard: PropTypes.array,
    tilesInRow: PropTypes.number,
    boardFinished: PropTypes.bool,
    playerSpace: PropTypes.object,
    isHuman: PropTypes.bool,
    move: PropTypes.func,
    tileWidth: PropTypes.number,
    incrementTurnCounter: PropTypes.func,
    turnCounter: PropTypes.number,
    animationVisible: PropTypes.bool,
    assignImageFogKeys: PropTypes.func,
    showHumanMoves: PropTypes.func,
    gameActive: PropTypes.bool,
    echolocate: PropTypes.func,
    zoomedInValue: PropTypes.number,
    zoomedOutValue: PropTypes.number,
    alterZoom: PropTypes.func,
    resetHighlighted: PropTypes.func,
    opponentVisible: PropTypes.bool,
    focus: PropTypes.func,
    outOfMoves: PropTypes.bool,
    barActive: PropTypes.bool,
    onItemSelected: PropTypes.func,
    shrineAmount: PropTypes.number,
    shrinesUnclaimed: PropTypes.number,
    heartBeatTimer: PropTypes.number,
    humanShrinesToWin: PropTypes.number,
    monsterShrinesToWin: PropTypes.number,
    monsterSanityLevel: PropTypes.number,
    monsterSpace: PropTypes.object,
    humanSpace: PropTypes.object,
    showMonsterMoves: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.screenDimensions = Dimensions.get("window");
    this.gameBoardWidth = this.props.tileWidth * 40;
    this.wasPouncedTileMap = this.props.gameBoard.map(a => a.wasPounced ? 1 : 0);
    this.wasEchoedTileMap = this.props.gameBoard.map(a => a.wasEchoed ? 1 : 0);
    this.highlightedTileRanges = [];
    this.playerTileRanges = [];
    this.xOffsetMax = this.gameBoardWidth - this.screenDimensions.width;
    this.yOffsetMax = this.gameBoardWidth - this.screenDimensions.height;
    this.playerX = (this.props.playerSpace.name % 40) * this.props.tileWidth;
    this.playerY = Math.floor(this.props.playerSpace.name / 40) * this.props.tileWidth;
    this.cameraX = this.getCameraX();
    this.cameraY = this.getCameraY();
    this.beginningX = this.getBeginningX();
    this.beginningY = this.getBeginningY()
    this.feedbackSquare = null;
    this.previousTouchTimestamp = 0;
    this.tileCashMapArray = this.props.gameBoard.map(x => x.hasCache ? 1 : 0);
    this.tileBlessedCashMapArray = this.props.gameBoard.map(x => x.hasBlessedCache ? 1 : 0);
    this.tileDesecratedCashMapArray = this.props.gameBoard.map(x => x.hasDesecratedCache ? 1 : 0);
    this.tileDecorMapArray = this.props.gameBoard.map(x => (!this.props.isHuman) ? x.imageDecorKey : 0);
    this.tileMapArray = this.props.gameBoard.map(a => this.props.isHuman ? ((a.isRevealed || a.isSemiRevealed) ? a.imageKey : 0) : a.imageKey);
    this.tileFogMapArray = this.props.gameBoard.map(x => (this.props.isHuman) ? x.imageFogKey : 0);
    this.state = {
      playerSpace: this.props.playerSpace,
      playerX: this.playerX,
      spriteX: new Animated.Value(this.getInitialSpriteX()),
      playerY: this.playerY,
      spriteY: new Animated.Value(this.getInitialSpriteY()),
      isZooming: false,
      isMoving: false,
      initialX: null,
      offsetLeft: 0,
      initialTop: 0,
      initialLeft: 0,
      top: new Animated.Value(this.beginningY),
      left: new Animated.Value(this.beginningX),
      highlightedTileMap: this.props.gameBoard.map(x => x.isHighlighted ? 1 : 0),
      showHighlighted: false,
      fogMap: this.props.gameBoard.map(a => a.isRevealed ? 0 : 1),
      tileFogMapArray: this.tileFogMapArray,
      spritePlaying: true,
      spriteScale: this.props.tileWidth / this.props.zoomedInValue,
      wasPouncedTileMap: this.wasPouncedTileMap,
      wasEchoedTileMap: this.wasEchoedTileMap,
      controlsVisible: true,
      echoControlsVisible: false,
      targetPickerVisible: false,
      targetPicker: null,
      srcPriest: require("../data/images/priestIdle.png"),
      srcEvil: require("../data/images/priestIdle-ghost.png"),
      ticksPerFrame: 6,
      srcpounceOut: require("../data/images/pounceIcon.png"),
      srcpounceIn: require("../data/images/pounceIcon.png"),
      srcfocusOut: require("../data/images/focusOut.png"),
      srcfocusIn: require("../data/images/focusIn.png"),
      srcTargetPriestOut: require("../data/images/targetPriestOut.png"),
      srcTargetPriestIn: require("../data/images/targetPriestIn.png"),
      srcTargetShrineOut: require("../data/images/targetShrineOut.png"),
      srcTargetShrineIn: require("../data/images/targetShrineIn.png"),
      tileCashMapArray: this.tileCashMapArray,
      tileBlessedCashMapArray: this.tileBlessedCashMapArray,
      tileDesecratedCashMapArray: this.tileDesecratedCashMapArray,
      tileDecorMapArray: this.tileDecorMapArray,
      tileMapArray: this.tileMapArray,
      tileWidth: this.props.tileWidth,
    };
  }

  getInitialSpriteX = () => {
    if (this.props.tileWidth === this.props.zoomedInValue) {
      return this.playerX;
    } else if (this.props.tileWidth === this.props.zoomedOutValue) {
      return this.playerX - this.props.tileWidth*0.8;
    }
  }

  getNewSpriteX = () => {
    if (this.state.tileWidth === this.props.zoomedInValue) {
      return this.state.playerX;
    } else if (this.state.tileWidth === this.props.zoomedOutValue) {
      return (this.state.playerX - this.state.tileWidth*0.8)
    }
  }

  getInitialSpriteY = () => {
    if (this.props.tileWidth === this.props.zoomedInValue) {
      return this.playerY - this.props.tileWidth;
    } else if (this.props.tileWidth === this.props.zoomedOutValue) {
      return (this.playerY - this.props.tileWidth*2.8)
    }
  }

  getNewSpriteY = () => {
    if (this.state.tileWidth === this.props.zoomedInValue) {
      return this.state.playerY - this.props.tileWidth;
    } else if (this.state.tileWidth === this.props.zoomedOutValue) {
      return (this.state.playerY - this.props.tileWidth*2.8)
    }
  }

  getCameraY = () => {
      if (this.props.turnCounter === 0 && this.wasPouncedTileMap.includes(1)) {
        for (let i = 0; i < this.props.gameBoard.length; i++) {
          if (this.props.gameBoard[i].wasPounced) {
            this.feedbackSquare = this.props.gameBoard[i];
            return ((Math.floor(this.feedbackSquare.name / 40) * this.state.tileWidth) - (this.screenDimensions.height / 2));
          }
        }
      } else if (this.props.turnCounter === 0 && this.wasEchoedTileMap.includes(1)) {
        for (let i = 0; i < this.props.gameBoard.length; i++) {
          if (this.props.gameBoard[i].wasEchoed) {
            this.feedbackSquare = this.props.gameBoard[i];
            return ((Math.floor(this.feedbackSquare.name / 40) * this.props.tileWidth) - (this.screenDimensions.height / 2));          }
        }
      } else {
        return (this.playerY - (this.screenDimensions.height / 2));
      }
  }

  getCameraX = () => {
      if (this.props.turnCounter === 0 && this.wasPouncedTileMap.includes(1)) {
        for (let i = 0; i < this.props.gameBoard.length; i++) {
          if (this.props.gameBoard[i].wasPounced) {
            this.feedbackSquare = this.props.gameBoard[i];
            return (((this.feedbackSquare.name % 40) * this.state.tileWidth) - (this.screenDimensions.width / 2));
          }
        }
      } else if (this.props.turnCounter === 0 && this.wasEchoedTileMap.includes(1)) {
        for (let i = 0; i < this.props.gameBoard.length; i++) {
          if (this.props.gameBoard[i].wasEchoed) {
            this.feedbackSquare = this.props.gameBoard[i];
            return (((this.feedbackSquare.name % 40) * this.props.tileWidth) - (this.screenDimensions.width / 2));
          }
        }
      } else {
        return (this.playerX - (this.screenDimensions.width / 2));
      }
  }

  getBeginningX = () => {
    return -this.cameraX;
    // if (this.cameraX < 0) {
    //   return 0;
    // } else if (this.cameraX > this.xOffsetMax) {
    //   return -this.xOffsetMax;
    // } else {
    //   return -this.cameraX;
    // }
  }

  getBeginningY = () => {
    return -this.cameraY;
    // if (this.cameraY < 0) {
    //   return 0;
    // } else if (this.cameraY > this.yOffsetMax) {
    //   return -this.yOffsetMax;
    // } else {
    //   return -this.cameraY;
    // }
  }

  componentWillMount() {
    console.log('engine.ios.js');
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (gestureState) => {
        if (this.state.showHighlighted || gestureState.dx > 10 || gestureState.dx < -10 || gestureState.dy > 10 || gestureState.dy < -10) {
          return true;
        } else {
          return false;
        }
      },

      onPanResponderGrant: (evt, gestureState) => {
        let { touches } = evt.nativeEvent;

        if (touches[0].timestamp - this.previousTouchTimestamp < 200) {
          this.props.alterZoom();
          setTimeout(function() {
            this.animateCamera();
          }.bind(this), 1000);
        }
        else if (gestureState.dx > 10 || gestureState.dx < -10  || gestureState.dy > 10 || gestureState.dy < -10) {
          this.processPan(touches[0].pageX, touches[0].pageY);
        } else if (this.state.showHighlighted && this.state.tileWidth === this.props.zoomedInValue) {
          this.processMove(touches[0].pageX, touches[0].pageY);
        }
        this.previousTouchTimestamp = touches[0].timestamp;
      },

      onPanResponderMove: (evt, gestureState) => {
        let { touches } = evt.nativeEvent;
        if (gestureState.dx > 10 || gestureState.dx < -10  || gestureState.dy > 10 || gestureState.dy < -10) {
          this.processPan(touches[0].pageX, touches[0].pageY);
        } else if (this.state.showHighlighted && this.state.tileWidth === this.props.zoomedInValue) {
          this.processMove(touches[0].pageX, touches[0].pageY);
        }
      },

      onPanResponderRelease: () => {
        this.setState({
          isMoving: false,
        });
      },
    });
  }

  animateCamera = () => {
    const { left, top } = this.state;
    let newX = (this.state.playerX - this.screenDimensions.width/2);
    if (newX < 0) {
      newX = 0;
    } else if (newX > this.xOffsetMax) {
      newX = this.xOffsetMax;
    }
    let newY = (this.state.playerY - this.screenDimensions.height/2);
    if (newY < 0) {
      newY = 0;
    } else if (newY > this.yOffsetMax) {
      newY = this.yOffsetMax;
    }
    Animated.parallel([
      Animated.timing(left, { toValue: -newX, duration: 1000}),
      Animated.timing(top, { toValue: -newY, duration: 1000}),
    ]).start();
  }

  transportSprite = () => {
    const { spriteX, spriteY } = this.state;
    Animated.parallel([
      Animated.timing(spriteX, { toValue: this.getNewSpriteX(), duration: 100 }),
      Animated.timing(spriteY, { toValue: this.getNewSpriteY(), duration: 100 })
    ]).start();
  }

  animateSpritePosition = () => {
    const { spriteX, spriteY } = this.state;

    if (this.props.isHuman) { // human
      // down
      if (this.getNewSpriteY() - spriteY._value > 0) {
        if (this.state.srcPriest != require("../data/images/priestWalkDown.png"))
        this.setState({
          srcPriest: require("../data/images/priestWalkDown.png")
        });
      }
      //up
      else if (this.getNewSpriteY() - spriteY._value < 0) {
        if (this.state.srcPriest != require("../data/images/priestWalkUp.png"))
        this.setState({
          srcPriest: require("../data/images/priestWalkUp.png")
        });
      }
      // left
      else if ((this.getNewSpriteX() - spriteX._value < 0))  {
        if (this.state.srcPriest != require("../data/images/priest-walk-left.png")) {
          this.setState({
            srcPriest: require("../data/images/priest-walk-left.png")
          });
        }
      }
      // right
      else {
        if (this.state.srcPriest != require("../data/images/priest-walk-right2.png")) {
          this.setState({
            srcPriest: require("../data/images/priest-walk-right2.png")
          });
        }
      }
    }

    else { // monster
      // down animation
      // console.log("animate monster", this.getNewSpriteY(), spriteY._value, this.getNewSpriteX(), spriteX._value)
      if (this.getNewSpriteY() - spriteY._value > 0 && this.getNewSpriteX() === spriteX._value) {
        if (this.state.srcEvil != require("../data/images/monsterWalkDown.png")) {
          this.setState({
            srcEvil: require("../data/images/monsterWalkDown.png"),
          });
        }
      }
      else if (this.getNewSpriteY() - spriteY._value < 0 && this.getNewSpriteX() === spriteX._value) {
        if (this.state.srcEvil != require("../data/images/monsterWalkUp.png")) {
          this.setState({
            srcEvil: require("../data/images/monsterWalkUp.png"),
          })
        }
      }
      else if (this.getNewSpriteX() - spriteX._value < 0) {
        if (this.state.srcEvil != require("../data/images/monster-move-left-dropped-down.png")) {
          this.setState({
            srcEvil: require("../data/images/monster-move-left-dropped-down.png"),
          });
        }
      }
      else if (this.getNewSpriteX() - spriteX._value > 0) {
        if (this.state.srcEvil != require("../data/images/monster-move-right-dropped-down.png")) {
          this.setState({
            srcEvil: require("../data/images/monster-move-right-dropped-down.png"),
          });
        }
      }
    }

    let distance = 10;
    if (Math.abs(this.getNewSpriteX() - spriteX._value) != 0) {
      distance = Math.abs(this.getNewSpriteX() - spriteX._value) / 50; //- cells to move
      if (distance > 10) {
        distance = 10;
      }
    }
    else if (Math.abs(this.getNewSpriteY() - spriteY._value) != 0) {
      distance = Math.abs(this.getNewSpriteY() - spriteY._value) / 50; //- cells to move
      if (distance > 10) {
        distance = 10;
      }
    }

    Animated.parallel([
      Animated.timing(spriteX, { toValue: this.getNewSpriteX(), duration: 1300 * distance }),
      Animated.timing(spriteY, { toValue: this.getNewSpriteY(), duration: 1300 * distance })
    ]).start((finished) => {
      if (finished.finished) {
        if (this.props.isHuman) {
          if (this.state.srcPriest != require("../data/images/priestIdle.png")) {
            this.setState({
              srcPriest: require("../data/images/priestIdle.png"),
            });
            this.setState({ controlsVisible: false });
            this.props.showHumanMoves();
          }
        }
        else {
          if (this.state.srcEvil != require("../data/images/priestIdle-ghost.png")) {
            this.setState({
              srcEvil: require("../data/images/priestIdle-ghost.png"),
            });
            this.setState({ controlsVisible: false });
            this.props.showMonsterMoves();
          }
        }
      }
    });
  }

  animateSpriteYPosition = () => {
    const {spriteY } = this.state;
    Animated.timing(spriteY, { toValue: (this.getNewSpriteY()), duration: 1000 }).start();
  }

  componentDidMount() {
    this.animateCamera();
  }

  componentDidUpdate() {
    // console.log('update', this.state.spriteX._value, this.getInitialSpriteX(), this.getNewSpriteX());
    // if (!this.props.animationVisible || (this.beginningX !== (this.playerX - (this.screenDimensions.width / 2))) || this.beginningY !== (this.playerY - (this.screenDimensions.height / 2))) {
    //   this.animateCamera();
    // }
    if (!this.props.justZoomed && (this.getNewSpriteX() !== this.state.spriteX._value || this.getNewSpriteY() !== this.state.spriteY._value)) {
      // console.log('animation should begin', this.state.playerX, this.state.spriteX._value);
      this.animateSpritePosition();
    }
    else if (this.props.justZoomed && (this.getNewSpriteX() !== this.state.spriteX._value || this.getNewSpriteY() !== this.state.spriteY._value)) {
      this.transportSprite();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // console.log('engine received props');
    let newHighlightedTileMap = nextProps.gameBoard.map(x => x.isHighlighted ? 1 : 0);
    let newFogMap = nextProps.gameBoard.map(x => x.isRevealed ? 0 : 1);
    let newWasPouncedMap = nextProps.gameBoard.map(x => x.wasPounced ? 1 : 0);
    let newWasEchoedMap = nextProps.gameBoard.map(x => x.wasPounced ? 1 : 0);
    let newSpriteScale = nextProps.tileWidth / nextProps.zoomedInValue;
    let newTileFogMapArray = nextProps.gameBoard.map(x => (this.props.isHuman) ? x.imageFogKey : 0);
    if (this.state.spriteScale !== newSpriteScale) {
      this.setState({
        spriteScale: newSpriteScale,
      });
    }
    if (this.state.tileWidth !== nextProps.tileWidth) {
      this.setState({
        tileWidth: nextProps.tileWidth,
        left: new Animated.Value((nextProps.playerSpace.name % 40) * nextProps.tileWidth - this.screenDimensions.width/2),
        top: new Animated.Value(Math.floor(nextProps.playerSpace.name / 40) * nextProps.tileWidth - this.screenDimensions.height/2),
        playerSpace: nextProps.playerSpace,
        playerX: (nextProps.playerSpace.name % 40) * nextProps.tileWidth,
        playerY: Math.floor(nextProps.playerSpace.name / 40) * nextProps.tileWidth,
        spriteX: new Animated.Value(this.getNewSpriteX()),
        spriteY: new Animated.Value(this.getNewSpriteY())
      });
    }
    if (this.props.playerSpace !== nextProps.playerSpace) {
      // console.log("player space", this.props.playerSpace, nextProps.playerSpace)
      this.setState({
        playerSpace: nextProps.playerSpace,
        playerX: (nextProps.playerSpace.name % 40) * this.state.tileWidth,
        playerY: Math.floor(nextProps.playerSpace.name / 40) * this.state.tileWidth,
      });
    }
    if (JSON.stringify(this.state.tileFogMapArray !== newTileFogMapArray)) {
      this.setState({
        tileFogMapArray: newTileFogMapArray,
      })
    }
    if (JSON.stringify(this.state.highlightedTileMap !== newHighlightedTileMap)) {
      this.setState({
        highlightedTileMap: newHighlightedTileMap,
      });
      if (newHighlightedTileMap.includes(1)) {
        this.setState({
          showHighlighted: true,
        });
      } else {
        this.setState({
          showHighlighted: false,
        });
      }
    }
    if (JSON.stringify(this.state.fogMap) !== JSON.stringify(newFogMap)) {
      this.setState({
        fogMap: newFogMap,
      });
    }
    if (JSON.stringify(this.state.wasPouncedTileMap) !== JSON.stringify(newWasPouncedMap)) {
      this.setState({
        wasPouncedTileMap: newWasPouncedMap,
      });
    }
    if (JSON.stringify(this.state.wasEchoedTileMap) !== JSON.stringify(newWasEchoedMap)) {
      this.setState({
        wasEchoedTileMap: newWasEchoedMap,
      });
    }
  }

  processPan(x, y) {
    if (!this.state.isMoving) {
      this.setState({
        isMoving: true,
        initialX: x,
        initialY: y,
        initialTop: this.state.top,
        initialLeft: this.state.left,
      });
    } else {
      let left = this.state.initialLeft._value + x - this.state.initialX;
      let top = this.state.initialTop._value + y - this.state.initialY;
      // console.log(left, this.gameBoardWidth);
      this.setState({
          left:
            left._value > 0 ?
            new Animated.Value(0) :
              left._value < (-this.gameBoardWidth + this.screenDimensions.width) ?
                (-this.gameBoardWidth + this.screenDimensions.width) :
                new Animated.Value(left),
          top:
            top._value > 0 ?
            new Animated.Value(0) :
              top._value < (-this.gameBoardWidth + this.screenDimensions.height) ?
                (-this.gameBoardWidth + this.screenDimensions.height) :
                new Animated.Value(top),
        });
    }
  }

  processMove(touchX, touchY) {
    console.log('process move');
    if (!this.state.isMoving) {
      let x = touchX - this.state.left._value;
      let y = touchY - this.state.top._value;
      // console.log("process move", this.highlightedTileRanges, x, y);
      for (let i = 0; i < this.highlightedTileRanges.length; i++) {
        if (
          x > this.highlightedTileRanges[i].xMin &&
          x < this.highlightedTileRanges[i].xMax &&
          y > this.highlightedTileRanges[i].yMin &&
          y < this.highlightedTileRanges[i].yMax
        ) {
          this.setState({
            controlsVisible: false,
            echoControlsVisible: false,
            targetPickerVisible: false,
          });
          let newPlayerTile = this.getTileFromXY(x, y);
          this.props.move(newPlayerTile);
          this.props.incrementTurnCounter();
        } else {
          // console.log('check');
          setTimeout(function() {
            if (!this.state.isMoving || !this.state.showHighlighted) {
              this.setState({
                showHighlighted: false,
                controlsVisible: true,
              });
              this.props.resetHighlighted();
              //--------------------------------------------------------------------------------------------------------------
            }
          }.bind(this), 200);
        }
      }
    }
  }

  getTileFromXY(x, y) {
    y = Math.floor(y/this.state.tileWidth);
    x = Math.floor(x/this.state.tileWidth);
    let index = ((y * 40) + x);
    // console.log(this.state.playerSpace.name, index, this.state.playerX, this.state.playerY);
    return (this.props.gameBoard[index]);
  }

  getRangesFromTile = (tile) => {
    let { size, top, left } = tile;
    return ({ xMin: left, xMax: (left + size), yMin: top, yMax: (top + size) });
  }

  renderHighlighted = () => {
    if ((!this.props.gameActive) && (this.state.showHighlighted)) {
      this.setState({ showHighlighted: false })
    }
    if (this.state.showHighlighted) {
      console.log('***');
      console.log(this.state.highlightedTileMap);
      return (
        <TileMap
          src={require("../data/images/Magenta-square_100px.gif")}
          tileSize={this.state.tileWidth}
          columns={40}
          rows={40}
          sourceWidth={this.state.tileWidth}
          layers={[this.state.highlightedTileMap]}
          renderTile={(tile, src, styles) => {
            this.highlightedTileRanges.push(this.getRangesFromTile(tile));
            return (
              <View style={[styles]}>
                <Image
                  resizeMode="stretch"
                  style={[styles, { opacity: 0.1 }]}
                  source={src}
                />
              </View>
            );
            }
          }
        />
      );
    } else {
      this.highlightedTileRanges = [];
    }
  };

  renderFog = () => {
    if (this.props.isHuman) {
      return (
        <TileMap
          src={require("../data/images/fog-nw.gif")}
          tileSize={this.state.tileWidth}
          columns={40}
          rows={40}
          sourceWidth={this.state.tileWidth}
          layers={[this.state.tileFogMapArray]}
          renderTile={this.renderFogTile}
        />
      );
    }
  }

  fixImageStyle = (index, tile) => {
    return ({ left: ((index - 1) * this.state.tileWidth), overflow: 'hidden' });
  }

  renderFogTile = (tile, src, styles) => {
    switch (tile.index) {
      case 1://nw
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-nw.gif")} />;
        break;
      case 2://n
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-n.gif")} />;
        break;
      case 3://ne
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-ne.gif")} />;
        break;
      case 4://e
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-e.gif")} />;
        break;
      case 5://se
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-se.gif")} />;
        break;
      case 6://s
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-s.gif")} />;
        break;
      case 7://sw
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-sw.gif")} />;
        break;
      case 8://w
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-w.gif")} />;
        break;
      case 9://full
        break;
      default:
        console.log('the imageKey for this tile was not assigned correctly', tile);
        break;
    }
  }

  renderLastTurn = () => {
    if (this.props.isHuman) {
      return (
        <TileMap
          src={require("../data/images/greensquare.jpg")}
          tileSize={this.state.tileWidth}
          columns={40}
          rows={40}
          sourceWidth={this.state.tileWidth}
          layers={[this.state.wasPouncedTileMap]}
          renderTile={(tile, src, styles) => {
            return (
              <TouchableOpacity style={[styles]}>
                <View
                  style={[styles, { opacity: 0.3, backgroundColor: 'red' }]}
                />
              </TouchableOpacity>
            );
            }
          }
        />
      );
    } else if (!this.props.isHuman) {
      return (
        <TileMap
          src={require("../data/images/Magenta-square_100px.gif")}
          tileSize={this.state.tileWidth}
          columns={40}
          rows={40}
          sourceWidth={this.state.tileWidth}
          layers={[this.state.wasEchoedTileMap]}
          renderTile={(tile, src, styles) => {
            return (
              <TouchableOpacity style={[styles]}>
                <Image
                  resizeMode="stretch"
                  style={[styles, { opacity: 0.3 }]}
                  source={src}
                />
              </TouchableOpacity>
            );
            }
          }
        />
      );
    }
  }

  controlSwitch = () => {
    // console.log('switch')
    if (this.props.gameActive) {
      if (this.state.controlsVisible) {
        if (this.props.isHuman) {
          this.props.showHumanMoves();
          this.setState({
            controlsVisible: false,
          });
        } else {
          this.props.showMonsterMoves();
          this.setState({
            controlsVisible: false,
            targetPickerVisible: false,
          });
        }
      } else {
        this.setState({
          controlsVisible: true,
          targetPickerVisible: false,
          showHighlighted: false,
        });
      }
    }
  }


  renderSprite = () => {
    if (this.props.isHuman) {
      return (
        <TouchableSprite activeOpacity={1} onStartShouldSetResponder={true} style={this.getPriestStyle()} onPress={this.controlSwitch}>
          <Sprite
            offset={[0, 0]}
            repeat={true}
            src={this.state.srcPriest}
            steps={[11]}
            scale={this.state.spriteScale}
            state={0}
            onPlayStateChanged={this.handlePlayStateChanged}
            tileHeight={128}
            ticksPerFrame={this.state.ticksPerFrame}
            tileWidth={64}
          />
        </TouchableSprite>
      );
    } else {
      return (
        <TouchableSprite activeOpacity={1} style={this.getPriestStyle()} onPress={this.controlSwitch}>
          <Sprite
            offset={[0, 0]}
            repeat={true}
            src={this.state.srcEvil}
            steps={[11]}
            scale={this.state.spriteScale}
            state={0}
            onPlayStateChanged={this.handlePlayStateChanged}
            tileHeight={128}
            ticksPerFrame={this.state.ticksPerFrame}
            tileWidth={64}
          />
        </TouchableSprite>
      );
    }
  }

  renderOpponent = () => {
    if (this.props.opponentVisible) {
      if (this.props.isHuman) {
        return (
          <TouchableSprite activeOpacity={1} style={this.getOpponentStyle()}>
            <Sprite
              offset={[0, 0]}
              repeat={true}
              src={this.state.srcEvil}
              steps={[11]}
              state={0}
              onPlayStateChanged={this.handlePlayStateChanged}
              tileHeight={128}
              ticksPerFrame={this.state.ticksPerFrame}
              tileWidth={64}
            />
          </TouchableSprite>
        );
      } else {
        return (
          <TouchableSprite activeOpacity={1} onStartShouldSetResponder={true} style={this.getOpponentStyle()}>
          <Sprite
          offset={[0, 0]}
          repeat={true}
          src={this.state.srcPriest}
          steps={[11]}
          state={0}
          onPlayStateChanged={this.handlePlayStateChanged}
          tileHeight={128}
          ticksPerFrame={this.state.ticksPerFrame}
          tileWidth={64}
          />
          </TouchableSprite>
        );
      }
    }
  }

  echoNorth = () => {
    this.props.resetHighlighted();
    this.props.echolocate('north');
  }
  echoEast = () => {
    this.props.resetHighlighted();

    this.props.echolocate('east');
  }
  echoBurst = () => {
    this.props.resetHighlighted();
    this.props.echolocate('radius');
  }

  echoWest = () => {
    this.props.resetHighlighted();
    this.props.echolocate('west');
  }
  echoSouth = () => {
    this.props.resetHighlighted();
    this.props.echolocate('south');
  }

  pickTarget = () => {
    this.setState({
      controlsVisible: false,
      targetPickerVisible: true,
    });
  }

  shrinePicked = () => {
      this.props.focus('shrine');
      this.setState({
        targetPicker: null,
        targetPickerVisible: false,
        controlsVisible: false,
      })
  }

  humanPicked = () => {
    this.props.focus('human');
    this.setState({
      targetPicker: null,
      targetPickerVisible: false,
      controlsVisible: false,
    })
}

  movementSwitch = () => {
    if (this.props.isHuman) {
      this.props.showHumanMoves();
    } else {
      this.props.showMonsterMoves();
    }
  }

  handleCenterCamera = () => {
    this.animateCamera();
  }

  renderCameraButton = () => {
    return (
      <View
        style={{
          width: this.props.zoomedInValue,
          height: this.props.zoomedInValue,
          margin: 5,
          zIndex: 3,
          position: "absolute",
          top: 0,
          end: 0,

        }}
      >
        <TouchableOpacity style={{flex: 1}} onPress={this.handleCenterCamera}>
          <Image source={require("../data/images/finderButton.png")} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    )
  }

  renderControls = () => {
    if ((!this.props.gameActive) && (this.state.controlsVisible)) {
      this.setState({ controlsVisible: false })
    }
    if (this.state.controlsVisible && this.state.tileWidth === this.props.zoomedInValue) {
      if (this.props.isHuman) {
          return (
            <View style={this.getPriestControlStyles()}>
              <View style={this.getControlButtonStyles()}>
                <ControlButton tileWidth={this.state.tileWidth} source1={require("../data/images/echoNorthOut.png")} source2={require("../data/images/echoNorthIn.png")} onPress={this.echoNorth} />
              </View>
              <View style={this.getControlButtonStyles()}>
                <ControlButton tileWidth={this.state.tileWidth} source1={require("../data/images/echoWestOut.png")} source2={require("../data/images/echoWestIn.png")} onPress={this.echoWest} />
                <ControlButton tileWidth={this.state.tileWidth} source1={require("../data/images/echoBurstOut.png")} source2={require("../data/images/echoBurstIn.png")} onPress={this.echoBurst} />
                <ControlButton tileWidth={this.state.tileWidth} source1={require("../data/images/echoEastOut.png")} source2={require("../data/images/echoEastIn.png")} onPress={this.echoEast} />
              </View>
              <View style={this.getControlButtonStyles()}>
                <ControlButton tileWidth={this.state.tileWidth} source1={require("../data/images/echoSouthOut.png")} source2={require("../data/images/echoSouthIn.png")} onPress={this.echoSouth} />
              </View>
            </View>
          );
      } else {
          return (
            <View style={this.getMonsterControlStyles()} >
              <ControlButton tileWidth={this.state.tileWidth} source1={this.state.srcfocusOut} source2={this.state.srcfocusIn} onPress={this.pickTarget} />
            </View>
          );
        }
      }
    }

  renderTargetPicker = () => {
    if (this.state.targetPickerVisible) {
      return (
        <View style={this.getMonsterControlStyles()} >
          <ControlButton tileWidth={this.state.tileWidth} source1={this.state.srcTargetPriestOut} source2={this.state.srcTargetPriestIn} onPress={this.humanPicked} />
          <ControlButton tileWidth={this.state.tileWidth} source1={this.state.srcTargetShrineOut} source2={this.state.srcTargetShrineIn} onPress={this.shrinePicked} />
        </View>
      );
    }
  }

  getMonsterControlStyles = () => {
    if (this.state.tileWidth === this.props.zoomedInValue) {
      return ({ height: this.state.tileWidth, width: this.state.tileWidth*3, left: this.state.playerX - this.state.tileWidth, top: this.state.playerY - this.state.tileWidth*4, flexDirection: "row", justifyContent: 'space-between' });
    } else {
      return ({ height: this.state.tileWidth, width: this.state.tileWidth*3, left: this.state.playerX - this.state.tileWidth, top: this.state.playerY - this.state.tileWidth*6, flexDirection: "row", justifyContent: 'space-between' });
    }
  }

  getPriestControlStyles = () => {
    if (this.state.tileWidth === this.props.zoomedInValue) {
      return { height: this.state.tileWidth * 3, width: this.state.tileWidth * 3, flexDirection: 'column', left: this.state.playerX + this.state.tileWidth, top: this.state.playerY - (this.state.tileWidth*5) };
    } else {
      return { height: this.state.tileWidth * 3, width: this.state.tileWidth * 3, flexDirection: 'column', left: this.state.playerX + this.state.tileWidth, top: this.state.playerY - (this.state.tileWidth*8) };
    }
  }

  getControlButtonStyles = () => {
    return ({ height: this.state.tileWidth, width: this.state.tileWidth * 3, flexDirection: 'row', justifyContent: 'center', zIndex: 3 });
  }


  renderBoard = () => {
    return (
      <View style={{ overflow: 'hidden' }}>
        {this.renderBasement()}
      </View>
    );
  }

  getTestTileArray = () => {
    let testArray = [];
    for (let i = 0; i < 1600; i++) {
      testArray.push(1);
    }
    testArray[this.props.playerSpace.name + 2] = 1;
    return testArray;
  }

  renderBasement = () => {
    // if (this.state.showHighlighted) {
      // let tileArray = this.getTestTileArray();
      let tileArray = this.state.tileMapArray;
      return (
        <TileMap
          src={require("../data/images/Magenta-square_100px.gif")}
          tileSize={this.state.tileWidth}
          columns={40}
          rows={40}
          sourceWidth={this.state.tileWidth}
          layers={[tileArray]}
          renderTile={(tile, src, styles) => {
            // console.log(tile);
            switch (tile.index) {
              // wall top northwest
              case 1:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-nw.gif")} />;
              // wall top north
              case 2:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-n.gif")} />;
                // wall top northeast
              case 3:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-ne.gif")} />;
              // // wall top west
              case 4:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-w.gif")} />;
              // // wall top east
              case 5:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-e.gif")} />;
              // wall top southwest
              case 6:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-sw.gif")} />;
              // wall top south
              case 7:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-s.gif")} />;
              // wall top southeast
              case 8:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-se.gif")} />;
              // wall top center
              case 9:
              // console.log("tile", tile);
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-c.gif")} />;
              // wall front northwest
              case 10:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-f-nw-2.gif")} />;
              // wall front north
              case 11:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-f-n-1.gif")} />;
              // wall front northeast
              case 12:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-f-ne-2.gif")} />;
              // wall front southwest
              case 13:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-f-sw-2.gif")} />;
              // wall front south
              case 14:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-f-s-1.gif")} />;
              // wall front southeast
              case 15:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-f-se-2.gif")} />;
              // wall front last two rows
              case 16:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-f-n-3.gif")} />;
              // floor tile northwest
              case 17:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-nw.gif")} />;
              // floor tile north
              case 18:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-n-1.gif")} />;
              // floor tile northeast
              case 19:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-ne.gif")} />;
              // floor tile west
              case 20:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-w-1.gif")} />;
              // floor tile east
              case 21:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-e-1.gif")} />;
              // floor tile center
              case 22:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-c-1.gif")} />;
              // wall top north/south
              case 23:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-n-s.png")} />;
              // wall top east/west
              case 24:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-e-w.png")} />;
              // wall top cap north/south/west -- typo in image name -- this is correct image!!
              case 25:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-n-s-e.png")} />;
              // wall top cap north/south/east -- typo in image name -- this is correct image!!
              case 26:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-n-s-w.png")} />;
              // wall top cap north/east/west
              case 27:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-n-e-w.png")} />;
              // wall top cap east/south/west
              case 28:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/wall-t-e-s-w.png")} />;
              // floor tile north 2
              case 29:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-n-2.gif")} />;
              // floor tile north 3
              case 30:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-n-3.gif")} />;
              // floor tile west 2
              case 31:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-w-2.gif")} />;
              // floor tile east 2
              case 32:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-e-2.gif")} />;
              // floor tile center 5
              case 33:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-c-5.gif")} />;
              // floor tile center 6
              case 34:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-c-6.gif")} />;
              // floor tile center 7
              case 35:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-c-7.gif")} />;
              // floor tile center 2
              case 36:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-c-2.gif")} />;
              // floor tile center 3
              case 37:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-c-3.gif")} />;
              // floor tile center 4
              case 38:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-c-4.gif")} />;
              // floor tile center 8
              case 39:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-c-8.gif")} />;
              // floor tile center 9
              case 40:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-c-9.gif")} />;
              // floor tile e2n
              case 41:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-e2n.gif")} />;
              // floor tile w2n
              case 42:
                return <Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/floor-w2n.gif")} />;
              default:
                console.log('the imageKey for this tile was not assigned correctly', tile);
                break;
              }

            }
          }
        />
      );

  }

  testFunc = (tile, src, styles) => {
    return (
      <View style={[styles]}>
        <Image
          resizeMode="stretch"
          style={[styles, { opacity: 0.1 }]}
          source={src}
        />
      </View>
    );
  }

  renderTile = (tile, src, styles) => {
    console.log('render tile');
    return (<Image resizeMode="stretch" style={[styles, this.fixImageStyle()]} source={require("../data/images/Magenta-square_100px.gif")} />);
  };


  render() {
    const bar = (
      <Bar
        outOfMoves={this.props.outOfMoves}
        barActive={this.props.barActive}
        isHuman={this.props.isHuman}
        onItemSelected={this.props.onItemSelected}
        shrineAmount={this.props.shrineAmount}
        shrinesUnclaimed={this.props.shrinesUnclaimed}
        heartBeatTimer={this.props.heartBeatTimer}
        humanShrinesToWin={this.props.humanShrinesToWin}
        monsterShrinesToWin={this.props.monsterShrinesToWin}
        monsterSanityLevel={this.props.monsterSanityLevel}
      />);
    return (
      <Loop>
        <Stage
          height={this.screenDimensions.height}
          width={this.screenDimensions.width}
          style={{ backgroundColor: "#212121" }}
        >
          <View style={{width: this.screenDimensions.width, height: this.screenDimensions.height, zIndex: 1 }} {...this._panResponder.panHandlers}>
            {this.renderCameraButton()}
            {bar}
            <Animated.View style={{ position: 'absolute', left: this.state.left, top: this.state.top, width: this.state.tileWidth*40, height: this.state.tileWidth*40, backgroundColor: '#000' }} >

              {this.renderBasement()}
              {this.renderHighlighted()}
              {this.renderFog()}
              {this.renderLastTurn()}
              {this.renderSprite()}
              {this.renderOpponent()}
              {this.renderControls()}
              {this.renderTargetPicker()}


            </Animated.View>

          </View>

        </Stage>
      </Loop>
    );
  }


  getSpriteStyle = () => {
    if (this.state.tileWidth === this.props.zoomedInValue) {
      return ({ zIndex: 1, left: this.state.spriteX, top: this.state.spriteY, width: this.state.tileWidth*3, transform: [{scale: this.state.spriteScale}] });
    } else if (this.state.tileWidth === this.props.zoomedOutValue) {
      return ({ zIndex: 1, left: this.state.spriteX, top: this.state.spriteY, width: this.state.tileWidth*7, transform: [{scale: this.state.spriteScale}] });
    }

  }
  getPriestStyle = () => {
    // console.log("sprite x y", this.state.spriteX, this.state.spriteY);
    if (this.state.tileWidth === this.props.zoomedInValue) {
      return ({zIndex: 1, width: this.state.tileWidth, left: this.state.spriteX, top: this.state.spriteY });
    } else if (this.state.tileWidth === this.props.zoomedOutValue) {
      return ([ {zIndex: 1, left: this.state.spriteX, top: this.state.spriteY, width: this.state.tileWidth/this.state.spriteScale}]);
    }
  }

  // this.playerX = (this.props.playerSpace.name % 40) * this.state.tileWidth;
  // this.playerY = Math.floor(this.props.playerSpace.name / 40) * this.state.tileWidth;

  getOpponentStyle = () => {
    if (this.props.isHuman) {
      if (this.state.tileWidth === this.props.zoomedInValue) {
        return ({zIndex: 1, height: this.state.tileWidth * 3, width: this.state.tileWidth, left: ((this.props.monsterSpace.name % 40) * this.state.tileWidth), top: (Math.floor((this.props.monsterSpace.name / 40) * this.state.tileWidth) - this.state.tileWidth * 5) });
      } else if (this.state.tileWidth === this.props.zoomedOutValue) {
        return ({zIndex: 1, left: ((this.props.monsterSpace.name % 40) * this.state.tileWidth), top: (Math.floor(this.props.monsterSpace.name / 40) * this.state.tileWidth - (this.state.tileWidth*11)), width: this.state.tileWidth/this.state.spriteScale, transform: [{ scale: this.state.spriteScale }] });
      }
    } else {
      if (this.state.tileWidth === this.props.zoomedInValue) {
        return ({zIndex: 1, height: this.state.tileWidth * 3, width: this.state.tileWidth, left: ((this.props.humanSpace.name % 40) * this.state.tileWidth), top: (Math.floor((this.props.humanSpace.name / 40) * this.state.tileWidth) - this.state.tileWidth * 5) });
      } else if (this.state.tileWidth === this.props.zoomedOutValue) {
        return ({zIndex: 1, left: ((this.props.humanSpace.name % 40) * this.state.tileWidth - this.state.tileWidth), top: (Math.floor(this.props.humanSpace.name / 40) * this.state.tileWidth - (this.state.tileWidth*10)), width: this.state.tileWidth/this.state.spriteScale, transform: [{ scale: this.state.spriteScale }] });
      }
    }
  }

  handlePlayStateChanged = (state) => {
    this.setState({
      spritePlaying: state ? true : false,
    });
  }
}