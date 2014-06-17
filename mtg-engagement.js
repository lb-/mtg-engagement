if (Meteor.isClient) {
  Template.rounds.rounds = function() {
    Meteor.subscribe( "matches");

    var getRounds = function( matches ) {
      var groupedMatches = _.groupBy( matches, function( match ) {
        return match.round;
      });

      var rounds = [];
      _.each( groupedMatches, function( matches, round, list ) {
        _.each( matches, function( match, matchIndex, list  ) {
          var gamesWithContext = [];
          _.each( match.games, function( game, index, list ) {
            gameWithContext = {};
            gameWithContext.state = game;//x, y, undefined
            gameWithContext.index = index;
            gameWithContext.matchId = match._id;
            gamesWithContext.push( gameWithContext );
          });
          match.games = gamesWithContext;
        });
        rounds.push({
          round: round,
          matches: matches,
        });
      });

      return rounds;
    }

    return getRounds( Matches.find().fetch() );

  }


Template.players.players = function() {
  Meteor.subscribe( "matches");

  var getPlayers = function( matches ) {
    var playerXGrouped = _.groupBy( matches, function( match ) {
      return match.playerX;
    });
    var playerYGrouped = _.groupBy( matches, function( match ) {
      return match.playerY;
    });
    //console.log(playerXGrouped)

    players = [];
    _.each( playerYGrouped, function( matches, playerName, list) {
      players.push({name:playerName, matches: matches});
    });
    _.each( playerXGrouped, function( matches, playerName, list) {
      players.push({name:playerName, matches: matches});
    });

    return players;
    // to do
  }

  return getPlayers( Matches.find().fetch() );

}

  //Actual Helpers
  UI.registerHelper( 'totalMatches', function() {
    return this.matches.length;
  });
  UI.registerHelper( 'matchCompleted', function() {
    return _.every( this.games, function( game ) {
      return game.state !== null;
    });
  });
  UI.registerHelper( 'matchCompletionPercent', function() {
    var gameTotals = _.countBy( this.games, function(game) {
      if ( game.state === null ) {
        return 'inProgress';
      }
      return 'completed';
    });
    return ( gameTotals.completed / 3 ) * 100;
  });
  UI.registerHelper( 'matchCompletedProgressBarClass', function() {
    if ( _.contains( this.games, null ) ) {
      return "progress-bar-info";
    }
    return "progress-bar-success";
  });
  UI.registerHelper( 'gameIcon', function() {
    // console.log(this)
    if ( this.game.state === null) {
      return "fa-circle-thin";
    } else if ( this.game.state === this.player ) {
      return "fa-check-circle-o text-success";
    }
    return "fa-times-circle-o text-danger";
  });
  UI.registerHelper( 'playerIsWinner', function( player ) {
    if ( _.some( this.games, function( i ) { return i.state === null } ) ) {
      return false;
    }
    var totals = _.countBy( this.games, function( i ) {
      if ( i.state === player ) {
        return 'won';
      }
      return 'lost'
      });

    if ( ( totals.won == 3 ) || ( totals.won > totals.lost ) ) {
      return true;
    }
    return false;
  });
  UI.registerHelper( 'getOrdinalNumber', function( num ) {
   var s = ["th","st","nd","rd"]
   var v = num % 100;
   return num +(s[(v-20)%10]||s[v]||s[0]);
  });
  Template.newMatch.events({
    'click .insert-match' : function( event, template ) {
      var newMatch = {};
      newMatch.round = this.round;
      newMatch.playerX = $(template.firstNode).find("[data-player='x']")[0].value;
      newMatch.playerY = $(template.firstNode).find("[data-player='y']")[0].value;
      if ( ( newMatch.playerX === "" ) || ( newMatch.playerY === "" ) ) {
        $(template.firstNode).find(".player-name-warning").show();
      } else if ( newMatch.playerX.toUpperCase() === newMatch.playerY.toUpperCase() ) {
        $(template.firstNode).find(".player-name-duplicate-warning").show();
      } else {
        $(template.firstNode).find(".player-name-warning").hide();
        $(template.firstNode).find(".player-name-duplicate-warning").hide();
        Meteor.call( 'insertMatch', newMatch, function( error, result ) {
          if ( error !== undefined ) {
            console.log( 'error', error );
          }
        });
      }
    }
  });
  Template.match.events({
    'click .remove-match' : function( event, template ) {
      Meteor.call( 'removeMatch', this._id, function( error, result ) {
        if ( error !== undefined ) {
          console.log( 'error', error );
        }
      });
    },
  });
  Template.game.events({
    'click .alternate-game-status' : function( event, template ) {
      //console.log(this, event, template);

      //get the current player
      //console.log(this, template);
      var currentPlayer = this.player;
      //work out the 'other' player
      var otherPlayer = "x";
      if ( currentPlayer == "x" ) {
        otherPlayer = "y";
      }

      //get the current game state (matches player is 'wining', not matches is 'loosing', undefined is not played)
      var newGameState;
      if ( this.game.state === null ) {
        //game has not been played, set current player to winner.
        newGameState = currentPlayer;
      } else if ( this.game.state == currentPlayer ) {
        //current player won, set current player to looser (by other player as winner).
        newGameState = otherPlayer;
      } else {
        //current player lst, set the game as unplayed.
        newGameState = null;
      }

      //console.log('this',this, 'currentPlayer', currentPlayer, 'otherPlayer', otherPlayer, 'newGameState', newGameState)
      //save the update usinng a method
      Meteor.call( "updateGame", this.game.matchId, this.game.index, newGameState, function( error, result ) {
        if ( error !== undefined ) {
          console.log( 'error', error );
        }
      });
    },
  })
}

if (Meteor.isServer) {
  Meteor.publish( "matches", function() {
    return Matches.find({});
  });
  Meteor.methods({
    insertMatch: function( newMatch ) {
      newMatch.created = new Date();
      newMatch.games = [null, null, null];
      Matches.insert( newMatch );
    },
    removeMatch: function( _id ) {
      Matches.remove({ _id: _id });
    },
    updateGame: function( matchId, gameIndex, gameState ) {
      var update = {};
      update['games.' + gameIndex] = gameState;
      var x = Matches.update({ _id: matchId }, { $set : update });
    },
  })

  Meteor.startup(function () {
    if ( Matches.find({}).count() === 0 ) {
      Matches.insert({
        playerX: 'LB',
        playerY: 'Andrew',
        round: 1,
        games: [ 'x', 'y', null],
      });
      Matches.insert({
        playerX: 'LB',
        playerY: 'Joe',
        round: 1,
        games: ['x','y',null],
      });
      Matches.insert({
        playerX: 'Philip',
        playerY: 'Poo Face',
        round: 2,
        games: ['y','x','x'],
      });
      Matches.insert({
        playerX: 'Samuel',
        playerY: 'Artyman',
        round: 2,
        games: ['x','x','x'],
      });
    }
  });
}
