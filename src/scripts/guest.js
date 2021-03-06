import { game } from './game.js';
import Bubble from './bubble.js';
import { cashier } from './cashier';

const canvas3 = document.getElementById('canvas3');
const ctx3 = canvas3.getContext('2d');
canvas3.width = 800;
canvas3.height = 500;

export default class Guest {
    constructor(id, speed, x, y, patience, orderType, spriteImage) {
        this.id = id;
        this.width = spriteImage.width / 4;
        this.height = spriteImage.height / 4;
        this.x = x;
        this.y = y;
        this.moving = true;
        this.frameX = 0;
        this.frameY = 0;
        this.speed = speed;
        this.guestSprite = new Image();
        this.guestSprite.src = `./src/images/${spriteImage.name}.png`;
        this.ordered = false;
        this.waiting = false;
        this.frustrated = false;
        this.timeWaited = 0;
        this.patience = patience;
        this.orderType = orderType;
        this.showBubble = false;
        this.bubble = false;
    }

    static clear() {
        ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
    }

    wait() {
        this.waiting = true;
        this.moving = false;
        this.frameY = 0;
        this.timeWaited += 1 * game.speed;
        this.patience -= 1 * game.speed;
    }
    
    order() {        
        this.bubble = this.bubble || 
                    new Bubble(
                        this.x + this.width, 
                        this.y - this.height / 2,
                        ctx3.measureText(this.orderType).width + 40,
                        50,
                        this.orderType
                    );
        cashier.frameY = 3;
        this.wait();
        this.showBubble = true;

        if (this.timeWaited >= 100) {
            this.timeWaited = 0;
            this.waiting = false;
            this.ordered = true;
            game.numOrders += 1;
            this.frameY = 2;
            this.moving = true;
            cashier.frameY = 2;
        }
    }
    
    waitForOrder() {
        this.wait();
        this.patience -= 1 * game.speed;
        
        
        if (this.patience <= 0) {
            game.lives -= 1;
            if (game.lives === 0) {
                game.over = true;
            }
            this.timeWaited = 0;
            this.waiting = false;
            this.frustrated = true;
            game.speed += 0.1;
            this.frameY = 3;
            this.moving = true;
            this.showBubble = false;
            game.numOrders -= 1;
        }
    }
    
    handleGuestFrame() {
        if (this.frameX < 3 && this.moving) this.frameX++;
        else this.frameX = 0;
    }
    
    draw() {
        ctx3.drawImage(
            this.guestSprite,
            this.width * this.frameX, this.height * this.frameY,
            this.width, this.height,
            this.x, this.y,
            this.width, this.height
        );
        
        this.handleGuestFrame();
        
        if (this.showBubble) this.bubble.draw();
    }
        
    update() {
        // handle guest collision
        game.guests.forEach( guest => {
            if (guest.id < this.id) {
                if (game.collision(this, guest) && this.patience > 0) {
                    this.wait();
                } else {
                    this.waiting = false;
                    this.moving = true;
                }
            }
        });
        
        // handle walking down to register
        if (!this.ordered) {
            if (!this.waiting && this.x > 144 && this.y > 0) {
                this.x -= 0.3 * this.speed;
            } else if (!this.waiting && this.x < 142 && this.y > 0) {
                this.x += 0.3 * this.speed;
            }
            // place order at register
            if (this.y >= 185) {
                this.order();
            }
        }
        

        // wait for order at end of bar

        if (this.x >= 600) {
            if (!this.frustrated && !this.fulfilled) {
                this.waitForOrder();
            } else if (this.fulfilled) {
                this.waiting = false;
                this.showBubble = false;
                this.y -= game.speed;
                if (this.y + this.height < 0) {
                    game.guests.splice(game.guests.indexOf(this), 1);
                }
                this.frameY = 3;
                return;
            }
        }
        
        // Move bubble over
        if (this.waiting) {
            let collision = false;
            game.guests.forEach(guest => {
                if (guest.id < this.id && this.showBubble && guest.showBubble && game.collision(this.bubble, guest.bubble)) {
                    collision = true;
                }
            });
        
            if (collision === false &&
                this.bubble.x + this.bubble.width / 2 < this.x + this.width / 2) {
                    this.bubble.x += 1 * game.speed;
            }
            return;
        }
        
        // walk to end of bar after ordering
        if (this.ordered && !this.frustrated) {
            this.x += this.speed;
            
            game.guests.forEach(guest => {
                if (guest.id < this.id) {
                    if (this.showBubble && guest.showBubble && game.collision(this.bubble, guest.bubble)) {
                        this.bubble.y += 1 * game.speed;
                        this.bubble.x -= 1 * game.speed;
                    }
                }
            });
            if (this.bubble.y >= 40) {
                this.bubble.y -= 1 * game.speed;
            }
            if (this.bubble.x + this.bubble.width / 2 > this.x + this.width / 2) {
                this.bubble.x -= 0.3333;
            }
            this.bubble.x += 1 * game.speed;
        } else if (this.frustrated) {
            this.y -= this.speed;
            if (this.y + this.height < 0) {
                game.guests.splice(game.guests.indexOf(this), 1);
            }
        } else {
            this.y += this.speed;
        }

    }
}
