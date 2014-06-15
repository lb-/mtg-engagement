if (Meteor.isClient) {
  //TEMP DATA
  var matches =  [
    {
      playerX: 'LB',
      playerY: 'Andrew',
      round: 1,
      games: [ 'x', 'y', null],
    },
    {
      playerX: 'LB',
      playerY: 'Joe',
      round: 1,
      games: ['x','y',null],
    },
    {
      playerX: 'Philip',
      playerY: 'Poo Face',
      round: 2,
      games: ['y','x','x'],
    },
    {
      playerX: 'Samuel',
      playerY: 'Artyman',
      round: 2,
      games: ['x','x','x'],
    }
  ];
  UI.registerHelper('rounds', function() {
    var groupedMatches = _.groupBy( matches, function( match ) {
      return match.round;
    });

    var rounds = [];
    _.each( groupedMatches, function( value, key, list ) {
      rounds.push({
        round: key,
        matches: value,
      });
    });
    return rounds;
  });

  //Actual Helpers
  UI.registerHelper( 'totalMatches', function() {
    return this.matches.length;
  });

  UI.registerHelper( 'matchCompleted', function() {
    return _.every( this.games, function( game ) {
      return game !== null;
    });
  });
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
    if ( _.some( this.games, function( i ) { return i === null } ) ) {
      return false;
      console.log('not completed');
    }
    return _.every( this.games, function( i ) { return i === player } );
  });

  UI.registerHelper( 'getOrdinalNumber', function( num ) {
   var s = ["th","st","nd","rd"]
   var v = num % 100;
   return num +(s[(v-20)%10]||s[v]||s[0]);
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
