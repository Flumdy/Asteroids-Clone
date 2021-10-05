import 'phaser'
import { config } from './env';

export default class GameScene extends Phaser.Scene {

    //ship
    ship : any;

    cursors : any;

    //scene dimensions
    sceneX : number = parseFloat(config.width.toString());
    sceneY : number = parseFloat(config.height.toString());

    //score
    score : integer = 0;
    scoreBoard : Phaser.GameObjects.Text;

    //gun
    mainGun : Phaser.GameObjects.Rectangle[] = [];
    bulletSpeed : number = 5;
    bulletTime : number = 0;

    //asteroids
    asteroids : any[] = [];
    maxAsteroids : integer = 8;
    asteroidSpeed : number = 0.8;
    asteroidFragments : any[] = [];
    asteroidFragmentSpeed : number = 2;

    //thruster particles
    particles : any[] = [];
    particleSpeed : number = 8;

constructor () {
    super('game');
}
    preload ()
{
    this.load.image('ship', 'assets/spaceship.png');
}

create ()
{
    //create score board
    this.scoreBoard = this.add.text(40, 40, 'Score: ' + this.score);
    this.scoreBoard.depth = 10; //ensure score is in the foreground

    //create spaceship using sprite
    this.ship = this.physics.add.image(this.sceneX / 2, this.sceneY / 2, 'ship');
    this.ship.setDamping(true);
    this.ship.setDrag(0.2);
    this.ship.setMaxVelocity(200);

    //spawn asteroids
    var asteroudCount = 0;
    for (asteroudCount ; asteroudCount  < this.maxAsteroids; asteroudCount ++) {
        this.generateAsteroid();
    }

    //randomly generate some stars for the background
    var starCount = 0;
    for (starCount; starCount < 50; starCount++) {
        var starX = this.getRandomInt(0, this.sceneX);
        var starY = this.getRandomInt(0, this.sceneY);
        var starSize = this.getRandomInt(1, 3);
        var star = this.add.circle(starX, starY, starSize, 0xffffff, 1);
        star.depth = -10; //ensure it is the background
    }

    //set up key press listener
    this.cursors = this.input.keyboard.createCursorKeys();
}

update ()
{
    //update the state of the game. Moving/destroying objects, updating game state

    //ship movement
    if (this.cursors.up.isDown)
    {
        this.physics.velocityFromRotation(this.ship.rotation - (Math.PI / 2), 200, this.ship.body.acceleration);

        //vaper trail
        this.createParticles();
    }
    else
    {
        this.ship.setAcceleration(0);
    }

    if (this.cursors.left.isDown)
    {
        this.ship.setAngularVelocity(-300);
    }
    else if (this.cursors.right.isDown)
    {
        this.ship.setAngularVelocity(300);
    }
    else
    {
        this.ship.setAngularVelocity(0);
    }

    if (this.cursors.down.isDown && this.bulletTime <= 0)
        {
            this.fireMainGun();
            this.bulletTime = 10;
        }
    else
    {
        this.bulletTime -= 1;
    }
    
    //wrap ship and asteroids with the scene
    this.physics.world.wrap(this.ship, 32);

    this.updateBullets();

    this.updateAsteroids();

    this.updateParticles();

    this.updateAsteroidFragments();

    this.checkShipCollision();

    //update score
    this.scoreBoard.setText('Score: ' + this.score);
}

fireMainGun () {
    //creates bullet at ship location with regard to rotation to calculate trajectory
    //and adds them to the mainGun

    var bullet = this.add.rectangle(this.ship.body.x + 16, this.ship.body.y + 16, 5, 15, 0x00ff00, 1);
    bullet.rotation = this.ship.rotation;
    this.mainGun.push(bullet);
}

createParticles() {
    //create particle effect for the thruster
    var particleCount = 0;
    var numRedParticles = 0;
    for (particleCount; particleCount < 30; particleCount++) {
        var particle = this.add.circle(this.ship.x, this.ship.y, 1, 0xff0000, 1);
        numRedParticles += 1;
        if (numRedParticles >= 20){
            particle.fillColor = 0xffa500;
        }
        particle.rotation = this.ship.rotation - Math.PI - Math.random() + Math.random();
        this.particles.push(particle);
    }
}

updateBullets() {
    //update bullets position along their trajectory
    this.mainGun.forEach((bullet) => {
        this.updatePosition(this.bulletSpeed, bullet);

        //check if bullet has left scene and delete if so
        if (bullet.x > config.width || bullet.x < 0
            || bullet.y > config.height || bullet.y < 0) {
                this.mainGun.splice(this.mainGun.indexOf(bullet), 1);
                bullet.destroy();
            }
        else {
            //check if bullet has collided with asteroid
            this.asteroids.forEach((asteroid) => {
                var radius = asteroid.displayWidth;
                var distance = Math.sqrt((asteroid.x - bullet.x)**2 + (asteroid.y - bullet.y)**2);
                if (distance < radius) {
                    this.mainGun.splice(this.mainGun.indexOf(bullet), 1);
                    bullet.destroy();
                    this.destroyAsteroid(this.asteroids.indexOf(asteroid));
                }
            });
        }
    });
}

generateAsteroid() {
    //create new asteroid with random size and trajectory

    var asteroidSize = this.getRandomInt(15, 40);
    var asteroidX = this.getRandomInt(this.sceneX, this.sceneX + 10);
    var asteroidY = this.getRandomInt(0, this.sceneY);
    var asteroid = this.add.circle(asteroidX, asteroidY, asteroidSize, 0x964b00, 1);
    asteroid.rotation = this.getRandomInt(0, 360) * Math.PI / 180;
    this.asteroids.push(asteroid);
}
updateAsteroids() {
    //update asteroids position along their trajectory
    this.asteroids.forEach((asteroid) => {
        this.updatePosition(this.asteroidSpeed, asteroid);
        this.physics.world.wrap(asteroid, 32);
    })
}

destroyAsteroid(indx) {
    //create particle effect for destroyed asteroid, deletes asteroid, and resets score

    //destroy asteroid and bullet
    var asteroid = this.asteroids[indx];
    this.asteroids.splice(indx, 1);
    asteroid.destroy();

    //create asteroid destruction particle event
    var fragmentCount = 0;
    var rotation = 0;
    var maxFragments = asteroid.width; //number of fragments relative to size of asteroid
    var rotationScale = maxFragments / (2 * Math.PI);
    for (fragmentCount; fragmentCount < maxFragments; fragmentCount++) {
        var fragment = this.add.circle(asteroid.x, asteroid.y, 3, 0x964b00, 1);
        fragment.rotation = rotation;
        rotation += rotationScale;
        this.asteroidFragments.push(fragment);
    }

    //generate more asteroids dependent on new value of maxAsteroids
    this.maxAsteroids = this.getRandomInt(8, 12);
    var asteroidCount = this.asteroids.length;
    for (asteroidCount; asteroidCount < this.maxAsteroids; asteroidCount++) {
        this.generateAsteroid();
    }

    this.score += 10;
}

updateAsteroidFragments() {
    //update asteroid fragment position along their trajectory
    this.asteroidFragments.forEach((fragment) => {
        this.updatePosition(this.asteroidFragmentSpeed, fragment);

        //destroy fragment after 4 ticks
        fragment.depth -= 1;
        if (fragment.depth < -10) {
            this.asteroidFragments.splice(this.asteroidFragments.indexOf(fragment), 1);
            fragment.destroy();
        }
    });
}

updateParticles() {
    //update particle position along their trajectory
    this.particles.forEach((particle) => {
        this.updatePosition(this.particleSpeed, particle);

        //destroy particle after 4 ticks
        particle.depth -= 1;
        if (particle.depth < -4) {
            this.particles.splice(this.particles.indexOf(particle), 1);
            particle.destroy();
        }
    });
}

checkShipCollision() {
    //check if ship collides with asteroid

    this.asteroids.forEach((asteroid) => {
        var asteroidRadius = asteroid.width;
        var distance = Math.sqrt((asteroid.x - this.ship.x)**2 + (asteroid.y - this.ship.y)**2);
        if (distance <= asteroidRadius) {
            this.ship.x = this.sceneX / 2; //respawn location
            this.ship.y = this.sceneY / 2;

            //reset asteroids
            this.asteroids.forEach((asteroid) => {
                asteroid.x = this.getRandomInt(this.sceneX, this.sceneX + 10);
                asteroid.y = this.getRandomInt(0, this.sceneY);
            });

            //reset score to 0
            this.score = 0;
        }
    });
}


updatePosition(speed, object) {
    //updates a game objects position along their given trajectory with respect to their speed\
    object.x += speed * Math.sin(object.rotation);
    object.y -= speed * Math.cos(object.rotation);
}

//https://www.codegrepper.com/code-examples/javascript/random+number+generator+in+typescript
getRandomInt(min, max) : number{
    //generates random integer between min and max
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

}