import 'phaser'

//contains config object for security and global updates

export const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    backgroundColor: '#125555',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            fps: 60,
            gravity: { y: 0 }
        }
    },
};
