import 'phaser';
import GameScene from './gameScene';
import {config} from './env'


config.scene = GameScene;

var game = new Phaser.Game(config);