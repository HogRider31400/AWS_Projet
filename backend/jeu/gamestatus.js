const gamestatus = {
    phase: 'day',
    day: 1,
    votes: {},
    boat: {
      branches: 0,
      lianes: 0,
      cailloux: 0,
      built: false, // Construit ou non
    },
    camp: {
      feu: {
        duration: 100,
        wood: 0,
      },
    }
  };

module.exports = gamestatus;