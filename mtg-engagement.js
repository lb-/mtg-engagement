if (Meteor.isClient) {
  //TEMP DATA
  UI.registerHelper('matches', function() {
    return [
      {
        playerX: 'LB',
        playerY: 'Andrew',
        games: [ 'x', 'y', null],
      },
      {
        playerX: 'LB',
        playerY: 'Joe',
        games: ['x','y',null],
      },
      {
        playerX: 'Philip',
        playerY: 'Poo Face',
        games: ['y','x','x'],
      },
      {
        playerX: 'Samuel',
        playerY: 'Artyman',
        games: ['x','x','x'],
      }
    ];
  });

  //Actual Helpers
  UI.registerHelper( 'matchCompletionPercent', function() {
    var gameTotals = _.countBy( this.games, function(game) {
      if ( game === null ) {
        return 'inProgress';
      }
      return 'completed';
    });
    return ( gameTotals.completed / 3 ) * 100;
  });
  UI.registerHelper( 'matchCompletedProgressBarClass', function() {
    //console.log(this);
    if ( _.contains( this.games, null ) ) {
      return "progress-bar-info";
    }
    return "progress-bar-success";
  });
  UI.registerHelper( 'gameIcon', function( player ) {
    if ( this[0] === undefined) {
      return "fa-circle-thin";
    } else if ( this[0] === player ) {
      return "fa-check-circle-o text-success";
    }
    return "fa-times-circle-o text-danger";
  });
  UI.registerHelper( 'playerIsWinner', function( player ) {
    console.log(this, player);
    if ( _.some( this.games, function( i ) { i === null } ) ) {
      return false;
      console.log('not completed');
    } else {
      return _.every( this.games, function( i ) { i === player } );
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
