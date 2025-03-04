class Player {
    constructor(id, role, spawn) {
      this.id = id;            
      this.role = role;               
      this.spawn = spawn;             
      this.tasks = [];                
      this.taskHistory = [];
      this.inventory = {
        branches: 0,
        lianes: 0,
        cailloux: 0,
        baies: 0,
        seau: false,   
        pistolet: false,  
        balles: 0
      };
    }
  }

module.exports = Player;