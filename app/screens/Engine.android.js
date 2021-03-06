import React, { Component } from "react";
import PropTypes from "prop-types";
import { Dimensions, Image, View, PanResponder, TouchableOpacity, Animated } from "react-native";
import { Loop, Stage, Sprite } from "react-game-kit/native";
import ControlButton from '../components/Button/ControlButton';
import TileMap from './TileMap';
import Bar from './Bar';
import Board from "./Board";


const TouchableSprite = Animated.createAnimatedComponent(TouchableOpacity);

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
    shrineIndexAdjustment: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.cases = [];
    this.screenDimensions = Dimensions.get("window");
    this.gameBoardWidth = this.props.tileWidth * 40;
    this.wasPouncedTileMap = this.props.gameBoard.map(a => a.wasPounced ? 1 : 0);
    this.wasEchoedTileMap = this.props.gameBoard.map(a => a.wasEchoed ? 1 : 0);
    this.highlightedTileRanges = [];
    this.playerTileRanges = [];
    this.xOffsetLarge = 64*40 - this.screenDimensions.width;
    this.xOffsetSmall = 25*40 - this.screenDimensions.width;
    this.yOffsetLarge = 64*40 - this.screenDimensions.height;
    this.yOffsetSmall = 25*40 - this.screenDimensions.height;
    this.playerX = (this.props.playerSpace.name % 40) * this.props.tileWidth;
    this.playerY = Math.floor(this.props.playerSpace.name / 40) * this.props.tileWidth;
    this.cameraX = this.getInitialCameraX();
    this.cameraY = this.getInitialCameraY();
    this.beginningX = this.getBeginningX();
    this.beginningY = this.getBeginningY();
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
      spriteScale: this.props.tileWidth / this.props.zoomedInValue,
      wasPouncedTileMap: this.wasPouncedTileMap,
      wasEchoedTileMap: this.wasEchoedTileMap,
      controlsVisible: true,
      targetPickerVisible: false,
      srcPriest: require("../data/images/priestIdle.png"),
      srcEvil: require("../data/images/priestIdle-ghost.png"),
      ticksPerFrame: 6,
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
      justZoomed: false,
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
      return (this.state.playerX - this.state.tileWidth*0.8);
    }
  }

  getInitialSpriteY = () => {
    if (this.props.tileWidth === this.props.zoomedInValue) {
      return this.playerY - this.props.tileWidth;
    } else if (this.props.tileWidth === this.props.zoomedOutValue) {
      return (this.playerY - this.props.tileWidth*2.8);
    }
  }

  getNewSpriteY = () => {
    if (this.state.tileWidth === this.props.zoomedInValue) {
      return this.state.playerY - this.props.tileWidth;
    } else if (this.state.tileWidth === this.props.zoomedOutValue) {
      return (this.state.playerY - this.props.tileWidth*2.8);
    }
  }

  getInitialCameraY = () => {
    if ((this.playerY - (this.screenDimensions.height / 2)) < 0) {
      return 0;
    } else if ((this.playerY - (this.screenDimensions.height / 2)) > this.yOffsetLarge) {
      return this.yOffsetLarge;
    } else {
      return (this.playerY - (this.screenDimensions.height / 2));
    }
  }

  getCameraY = () => {
    if (this.state.tileWidth === this.props.zoomedInValue) {
      if ((this.state.playerY - (this.screenDimensions.height / 2)) < 0) {
        return 0;
      } else if ((this.state.playerY - (this.screenDimensions.height / 2)) > this.yOffsetLarge) {
        return this.yOffsetLarge;
      } else {
        return (this.state.playerY - (this.screenDimensions.height / 2));
      }
    } else {
      if ((this.state.playerY - (this.screenDimensions.height / 2)) < 0) {
        return 0;
      } else if ((this.state.playerY - (this.screenDimensions.height / 2)) > this.yOffsetSmall) {
        return this.yOffsetSmall;
      } else {
        return (this.state.playerY - (this.screenDimensions.height / 2));
      }
    }
  }

  getInitialCameraX = () => {
    if ((this.playerX - (this.screenDimensions.width / 2)) < 0) {
      return 0;
    } else if ((this.playerX - (this.screenDimensions.width / 2)) > this.xOffsetLarge) {
      return this.xOffsetLarge;
    } else {
      return (this.playerX - (this.screenDimensions.width / 2));
    }
  }

  getCameraX = () => {
    if (this.state.tileWidth === this.props.zoomedInValue) {
      if ((this.state.playerX - (this.screenDimensions.width / 2)) < 0) {
        return 0;
      } else if ((this.state.playerX - (this.screenDimensions.width / 2)) > this.xOffsetLarge) {
        return this.xOffsetLarge;
      } else {
        return (this.state.playerX - (this.screenDimensions.width / 2));
      }
    } else {
      if ((this.state.playerX - (this.screenDimensions.width / 2)) < 0) {
        return 0;
      } else if ((this.state.playerX - (this.screenDimensions.width / 2)) > this.xOffsetSmall) {
        return this.xOffsetSmall;
      } else {
        return (this.state.playerX - (this.screenDimensions.width / 2));
      }
    }
  }

  getBeginningX = () => {
    // return -this.cameraX;
    if (this.cameraX < 0) {
      return 0;
    } else if (this.cameraX > this.xOffsetLarge) {
      return -this.xOffsetLarge;
    } else {
      return -this.cameraX;
    }
  }

  getBeginningY = () => {
    // return -this.cameraY;
    if (this.cameraY < 0) {
      return 0;
    } else if (this.cameraY > this.yOffsetLarge) {
      return -this.yOffsetLarge;
    } else {
      return -this.cameraY;
    }
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (gestureState) => {
        if ((this.state.showHighlighted ) || gestureState.dx > 10 || gestureState.dx < -10 || gestureState.dy > 10 || gestureState.dy < -10) {
          return true;
        } else {
          return false;
        }
      },

      onPanResponderGrant: (evt) => {
        let { touches } = evt.nativeEvent;
        if (touches[0].timestamp - this.previousTouchTimestamp < 200) {
          this.setState({
            justZoomed: true,
          });
          this.props.alterZoom();
          console.log("just zoomed true", this.state.justZoomed);
        }
        this.previousTouchTimestamp = touches[0].timestamp;
      },

      onPanResponderMove: (evt, gestureState) => {
        let { touches } = evt.nativeEvent;
        if (gestureState.dx > 10 || gestureState.dx < -10 || gestureState.dy > 10 || gestureState.dy < -10) {
          this.processPan(touches[0].pageX, touches[0].pageY);
        } else if ( this.state.showHighlighted && (this.state.tileWidth === this.props.zoomedInValue)) {
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

  animateCamera = (animationDuration) => {
    const { left, top } = this.state;
    let newX = this.getCameraX();
    let newY = this.getCameraY();
    Animated.parallel([
      Animated.timing(left, { toValue: -newX, duration: animationDuration }),
      Animated.timing(top, { toValue: -newY, duration: animationDuration }),
    ]).start();
  }

  transportSprite = () => {
    const { spriteX, spriteY } = this.state;
    Animated.parallel([
      Animated.timing(spriteX, { toValue: this.getNewSpriteX(), duration: 1 }),
      Animated.timing(spriteY, { toValue: this.getNewSpriteY(), duration: 1 }),
    ]).start((finished) => {
      if (finished.finished) {
        this.animateCamera(1);
        this.setState({
          srcPriest: require("../data/images/priestIdle.png"),
          srcEvil: require("../data/images/priestIdle-ghost.png"),
          justZoomed: false,
        });
      }
    });
  }

  animateSpritePosition = () => {
    const { spriteX, spriteY } = this.state;

    if (this.props.isHuman) { // human
      // down
      if (this.getNewSpriteY() - spriteY._value > 0) {
        if (this.state.srcPriest != require("../data/images/priestWalkDown.png")) {
          this.setState({
            srcPriest: require("../data/images/priestWalkDown.png")
          });
        }
      }
      // up
      else if (this.getNewSpriteY() - spriteY._value < 0) {
        if (this.state.srcPriest != require("../data/images/priestWalkUp.png")) {
          this.setState({
            srcPriest: require("../data/images/priestWalkUp.png")
          });
        }
      }
      // left
      else if ((this.getNewSpriteX() - spriteX._value < 0)) {
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
          });
        }
      }
      else if (this.getNewSpriteX() - spriteX._value < 0) {
        if (this.state.srcEvil != require("../data/images/monsterWalkLeft.png")) {
          this.setState({
            srcEvil: require("../data/images/monsterWalkLeft.png"),
          });
        }
      }
      else if (this.getNewSpriteX() - spriteX._value > 0) {
        if (this.state.srcEvil != require("../data/images/monsterWalkRight.png")) {
          this.setState({
            srcEvil: require("../data/images/monsterWalkRight.png"),
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
    this.animateCamera(1000);
  }

  componentDidUpdate() {
    // console.log("update", this.state.wasEchoedTileMap.includes(1), this.props.feedbackSquare, this.props.humanFeedback, this.props.monsterFeedback, this.props.highlightFeedback)
    if (!this.state.justZoomed && (this.getNewSpriteX() !== this.state.spriteX._value || this.getNewSpriteY() !== this.state.spriteY._value)) {
      this.animateSpritePosition();
    } else if (this.state.justZoomed) {
      this.transportSprite();
    }
    if (this.props.highlightFeedback && this.props.humanFeedback && this.props.isHuman && this.props.feedbackSquare !== null) {
      this.showFeedbackWithCamera();
    }
    if (this.props.highlightFeedback && this.props.monsterFeedback && !this.props.isHuman && this.props.feedbackSquare !== null) {
      this.showFeedbackWithCamera();
    }
  }


  UNSAFE_componentWillReceiveProps(nextProps) {
    // console.log('engine received props');
    let newHighlightedTileMap = nextProps.gameBoard.map(x => x.isHighlighted ? 1 : 0);
    let newFogMap = nextProps.gameBoard.map(x => x.isRevealed ? 0 : 1);
    let newWasPouncedMap = nextProps.gameBoard.map(x => x.wasPounced ? 1 : 0);
    let newWasEchoedMap = nextProps.gameBoard.map(x => x.wasEchoed ? 1 : 0);
    let newSpriteScale = nextProps.tileWidth / nextProps.zoomedInValue;
    let newTileFogMapArray = nextProps.gameBoard.map(x => (this.props.isHuman) ? x.imageFogKey : 0);
    if (this.props.isHuman !== nextProps.isHuman) {
      this.setState({
        justZoomed: true,
        playerSpace: nextProps.playerSpace,
        playerX: (nextProps.playerSpace.name % 40) * this.state.tileWidth,
        playerY: Math.floor(nextProps.playerSpace.name / 40) * this.state.tileWidth,
      });
      this.transportSprite();
    }
    if (nextProps.outOfMoves) {
      this.setState({
        showHighlighted: false,
        controlsVisible: false,
      });
    }
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
    if (JSON.stringify(this.state.tileFogMapArray) !== JSON.stringify(newTileFogMapArray)) {
      this.setState({
        tileFogMapArray: newTileFogMapArray,
      });
    }
    if (JSON.stringify(this.state.highlightedTileMap) !== JSON.stringify(newHighlightedTileMap)) {
      this.setState({
        highlightedTileMap: newHighlightedTileMap,
      });
      if (newHighlightedTileMap.includes(1)) {
        if (!this.props.outOfMoves) {
          this.setState({
            showHighlighted: true,
          });
        }
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
      console.log("pounce map set")
      this.setState({
        wasPouncedTileMap: newWasPouncedMap,
      });
    }
    if (JSON.stringify(this.state.wasEchoedTileMap) !== JSON.stringify(newWasEchoedMap)) {
      console.log("echo map set");
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
    if (!this.state.isMoving) {
      let x = touchX - this.state.left._value;
      let y = touchY - this.state.top._value;
      for (let i = 0; i < this.highlightedTileRanges.length; i++) {
        if (
          x > this.highlightedTileRanges[i].xMin &&
          x < this.highlightedTileRanges[i].xMax &&
          y > this.highlightedTileRanges[i].yMin &&
          y < this.highlightedTileRanges[i].yMax
        ) {
          this.setState({
            controlsVisible: false,
            targetPickerVisible: false,
          });
          let newPlayerTile = this.getTileFromXY(x, y);
          this.props.move(newPlayerTile);
          this.props.incrementTurnCounter();
        } else {
          setTimeout(function () {
            if (!this.state.isMoving || !this.state.showHighlighted) {
              this.setState({
                showHighlighted: false,
                controlsVisible: true,
              });
              this.props.resetHighlighted();

            }
          }.bind(this), 200);
        }
      }
    }
  }

  getTileFromXY(x, y) {
    const top = Math.floor(y/this.state.tileWidth);
    const left = Math.floor(x/this.state.tileWidth);
    let index = ((top * 40) + left);
    return (this.props.gameBoard[index]);
  }

  getRangesFromTile = (tile) => {
    let { size, top, left } = tile;
    return ({ xMin: left, xMax: (left + size), yMin: top, yMax: (top + size) });
  }

  renderHighlighted = () => {
    if (!this.props.outOfMoves) {
      if ((!this.props.gameActive) && (this.state.showHighlighted)) {
        this.setState({ showHighlighted: false });
      }
      if (this.state.showHighlighted ) {
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
              <TouchableOpacity style={[styles]}>
              <Image
              resizeMode="stretch"
              style={[styles, { opacity: 0.1 }]}
              source={src}
              />
              </TouchableOpacity>
            );
          }
        }
        />
      );
    } else {
      this.highlightedTileRanges = [];
    }

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

  fixImageStyle = (index) => {
    return ({ left: ((index - 1) * this.state.tileWidth), overflow: 'hidden' });
  }

  renderFogTile = (tile, src, styles) => {
    switch (tile.index) {
      case 1://nw
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-nw.gif")} />;

      case 2://n
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-n.gif")} />;

      case 3://ne
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-ne.gif")} />;

      case 4://e
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-e.gif")} />;

      case 5://se
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-se.gif")} />;

      case 6://s
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-s.gif")} />;

      case 7://sw
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-sw.gif")} />;

      case 8://w
        return <Image resizeMode="stretch" style={[styles, { opacity: 1 }, this.fixImageStyle()]} source={require("../data/images/fog-w.gif")} />;

      case 9://full
        break;
      default:
        console.log('the imageKey for this tile was not assigned correctly', tile);
        break;
    }
  }

  showFeedbackWithCamera = () => {
    const DURATION = 2000;
    const { left, top } = this.state;
    let { feedbackX, feedbackY } = this.getFeedbackCoordinates();
    let playerX = this.getCameraX();
    let playerY = this.getCameraY();
    Animated.sequence([
      Animated.parallel([
        Animated.timing(left, { toValue: -feedbackX, duration: DURATION}),
        Animated.timing(top, { toValue: -feedbackY, duration: DURATION})
      ]),
      Animated.parallel([
        Animated.timing(left, { toValue: -playerX, duration: DURATION}),
        Animated.timing(top, { toValue: -playerY, duration: DURATION})
      ])
    ]).start((finished) => {
      if (finished.finished) {
        this.props.highlightFeedbackCallback();
      }
    });
  }

  getFeedbackCoordinates = () => {
    let x = ((this.props.feedbackSquare.name % 40) * this.state.tileWidth) - this.screenDimensions.width/2;
    let y = (Math.floor(this.props.feedbackSquare.name / 40) * this.state.tileWidth) - this.screenDimensions.height/2;
    return { feedbackX: x, feedbackY: y };
  }

  renderLastTurn = () => {
    if (this.props.isHuman && this.props.humanFeedback) {
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
                  style={[styles, { opacity: 1, backgroundColor: 'red' }]}
                />
              </TouchableOpacity>
            );
            }
          }
        />
      );
    } else if (!this.props.isHuman && this.props.monsterFeedback) {
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
                <View
                  style={[styles, { opacity: 1, backgroundColor: '#ff00ff' }]}
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
    if (!this.props.outOfMoves) {
      if (this.props.gameActive) {
        if (this.state.controlsVisible) {
          if (this.props.isHuman) {
            this.props.showHumanMoves();
            if (!this.props.outOfMoves) {
              this.setState({
                controlsVisible: false,
                showHighlighted: true,
              });
            }
          } else {
            this.props.showMonsterMoves();
            if (!this.props.outOfMoves) {
              this.setState({
                controlsVisible: false,
                targetPickerVisible: false,
                showHighlighted: true,
              });
            }
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
        targetPickerVisible: false,
        controlsVisible: false,
      });
  }

  humanPicked = () => {
    this.props.focus('human');
    this.setState({
      targetPickerVisible: false,
      controlsVisible: false,
    });
}

  movementSwitch = () => {
    if (this.props.isHuman) {
      this.props.showHumanMoves();
    } else {
      this.props.showMonsterMoves();
    }
  }

  handleCenterCamera = () => {
    this.animateCamera(2000);
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
    );
  }

  renderControls = () => {
    if (!this.props.outOfMoves) {
      if ((!this.props.gameActive) && (this.state.controlsVisible)) {
        this.setState({ controlsVisible: false });
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
      if (this.state.playerX < this.state.tileWidth*35) {
        return { height: this.state.tileWidth * 3, width: this.state.tileWidth * 3, flexDirection: 'column', left: this.state.playerX + this.state.tileWidth, top: this.state.playerY - (this.state.tileWidth*5), zIndex: 3 };
      } else {
        return {height: this.state.tileWidth * 3, width: this.state.tileWidth * 3, flexDirection: 'column', left: this.state.playerX - this.state.tileWidth*3, top: this.state.playerY - (this.state.tileWidth*5), zIndex: 3 };
      }
    } else if (this.state.playerX < this.state.tileWidth * 35) {
      return { height: this.state.tileWidth * 3, width: this.state.tileWidth * 3, flexDirection: 'column', left: this.state.playerX + this.state.tileWidth, top: this.state.playerY - (this.state.tileWidth*8), zIndex: 3 };
    } else {
      return { height: this.state.tileWidth * 3, width: this.state.tileWidth * 3, flexDirection: 'column', left: this.state.playerX - this.state.tileWidth*3, top: this.state.playerY - (this.state.tileWidth*8), zIndex: 3 }
    }
  }

  getControlButtonStyles = () => {
    return ({ height: this.state.tileWidth, width: this.state.tileWidth * 3, flexDirection: 'row', justifyContent: 'center', zIndex: 3 });
  }

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
              <Board
                gameBoard={this.props.gameBoard}
                isHuman={this.props.isHuman}
                boardFinished={this.props.boardFinished}
                tileWidth={this.state.tileWidth}
                tileCashMapArray={this.state.tileCashMapArray}
                tileBlessedCashMapArray={this.state.tileBlessedCashMapArray}
                tileDesecratedCashMapArray={this.state.tileDesecratedCashMapArray}
                tileDecorMapArray={this.state.tileDecorMapArray}
                tileMapArray={this.state.tileMapArray}

              />

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
    if (this.props.shrineIndexAdjustment) {
      if (this.state.tileWidth === this.props.zoomedInValue) {
        return ({zIndex: 4, width: this.state.tileWidth, left: this.state.spriteX, top: this.state.spriteY });
      } else if (this.state.tileWidth === this.props.zoomedOutValue) {
        return ([{zIndex: 4, left: this.state.spriteX, top: this.state.spriteY, width: this.state.tileWidth/this.state.spriteScale}]);
      }
    }
    else {
      if (this.state.tileWidth === this.props.zoomedInValue) {
        return ({zIndex: 1, width: this.state.tileWidth, left: this.state.spriteX, top: this.state.spriteY });
      } else if (this.state.tileWidth === this.props.zoomedOutValue) {
        return ([{zIndex: 1, left: this.state.spriteX, top: this.state.spriteY, width: this.state.tileWidth/this.state.spriteScale}]);
      }
    }
  }

  getOpponentStyle = () => {
    if (this.props.isHuman) {
      if (this.state.tileWidth === this.props.zoomedInValue) {
        return ({zIndex: 4, width: this.state.tileWidth, left: ((this.props.monsterSpace.name % 40) * this.state.tileWidth), top: (Math.floor((this.props.monsterSpace.name / 40) * this.state.tileWidth) - this.state.tileWidth*3.75) });
      } else if (this.state.tileWidth === this.props.zoomedOutValue) {
        return ({zIndex: 4, left: ((this.props.monsterSpace.name % 40) * this.state.tileWidth) - this.props.tileWidth*0.5, top: (Math.floor(this.props.monsterSpace.name / 40) * this.state.tileWidth - (this.state.tileWidth*7.75)), width: this.state.tileWidth/this.state.spriteScale, transform: [{ scale: this.state.spriteScale }] });
      }
    } else {
      if (this.state.tileWidth === this.props.zoomedInValue) {
        return ({zIndex: 4, width: this.state.tileWidth, left: ((this.props.humanSpace.name % 40) * this.state.tileWidth), top: (Math.floor((this.props.humanSpace.name / 40) * this.state.tileWidth) - this.state.tileWidth*3.75) });
      } else if (this.state.tileWidth === this.props.zoomedOutValue) {
        return ({zIndex: 4, left: ((this.props.humanSpace.name % 40) * this.state.tileWidth) - this.props.tileWidth*0.8, top: (Math.floor(this.props.humanSpace.name / 40) * this.state.tileWidth - (this.state.tileWidth*7.75)), width: this.state.tileWidth/this.state.spriteScale, transform: [{ scale: this.state.spriteScale }] });
      }
    }
  }

  handlePlayStateChanged = () => {
    //necessary but unused
  }
}
