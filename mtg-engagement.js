if (Meteor.isClient) {
  Template.rounds.rounds = function() {
    Meteor.subscribe( "matches" );
    Meteor.subscribe( "rounds" );

    var getRounds = function( matches ) {
      var groupedMatches = _.groupBy( matches, function( match ) {
        return match.round;
      });

      var rounds = [];
      var newRounds = ( Rounds.find({}, {sort:{key:1}}).fetch() );
      //console.log(newRounds);
      _.each( groupedMatches, function( matches, roundId, list ) {
        _.each( matches, function( match, matchIndex, list  ) {

          //old
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
          round: roundId,
          matches: matches,
        });

        var thisRound = _.findWhere( newRounds, { _id: roundId } );
        //console.log(round, thisRound);
        if ( thisRound !== undefined) {
          thisRound.matches = matches;
        }

      });
      //console.log(newRounds);
      return newRounds;
    }

    return getRounds( Matches.find().fetch() );

  }


Template.players.players = function() {
  Meteor.subscribe( "matches");

  var getPlayers = function( matches ) {
    var playersByName = {};
    //var playersList = [];
    var processMatches = function( matches, players ) {
      var players = players || ['x','y'];
      _.each ( players, function( playerGene, playerIndex ) {
        var playerRef = 'player' + playerGene.toUpperCase();
        var matchesGroupedByPlayers = _.groupBy( matches, function( match ) {
          return match[playerRef].toUpperCase();
        });
        _.each( matchesGroupedByPlayers, function( matches, playerName, list) {
          //console.log(this);
          //playersList.push({name:playerName, matches: matches});
          if ( _.has(playersByName, playerName ) === true ) {
            _.union( playersByName[ playerName ].matches, matches);
          } else {
            playersByName[ playerName ] = {
              matches: matches,
            };
          }
        });
      })
    };
    processMatches(matches);
    playersList = [];
    _.each( playersByName, function( playerDetail, playerName ) {
      playersList.push( _.extend({}, playerDetail,{ name: playerName }) );
    });
    return playersList;
  }

  return getPlayers( Matches.find().fetch() );

}

  //functions used in helpers & other areas
  var isMatchCompleted = function( games ) {
    return _.every( games, function( game ) {
      if ( _.isObject(game) ) {
        return game.state !== null;
      } else {
        return game !== null;
      }
    });
  }
  var isPlayerWinner = function( games, player ) {
    if ( isMatchCompleted( games ) ) {
      var totals = _.countBy( games, function( game ) {
        var state = game;
        if ( _.isObject( game ) ) {
          state = game.state;
        }
        if ( state === player ) {
          return 'won';
        }
        return 'lost'
        });

      if ( ( totals.won == 3 ) || ( totals.won > totals.lost ) ) {
        return true;
      }
    }
    return false;
  }

  //Helpers
  UI.registerHelper( 'totalMatches', function() {
    var currentMatches = this.matches || [];
    return currentMatches.length;
  });
  UI.registerHelper( 'matchCompleted', function() {
    return isMatchCompleted( this.games );
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
    return isPlayerWinner( this.games, player );
  });
  UI.registerHelper( 'getOrdinalNumber', function( num ) {
   var s = ["th","st","nd","rd"]
   var v = num % 100;
   return num +(s[(v-20)%10]||s[v]||s[0]);
  });
  UI.registerHelper( 'playerTotalMatches', function( status ) {
    var playerName = this.name;
    //console.log(this, status);
    if ( status == undefined ) {
      return this.matches.length;
    } else if ( ( status == 'completed' ) || ( status == 'not completed') ) {
      var totals = _.countBy( this.matches, function( match ) {
        return isMatchCompleted( match.games );
      });
      //console.log(totals);
      if ( status == 'completed' ) {
        return totals[true] || 0;
      }
      return totals[false] || 0;
    } else if ( ( status == 'won' ) || ( status == 'lost') ) {
      var totals = _.countBy( this.matches, function( match ) {
        //console.log(match.playerX.toUpperCase(), playerName);
        var matchPlayerRef = null;
        if ( match.playerX.toUpperCase() == playerName ) {
          matchPlayerRef = 'x';
        } else if ( match.playerY.toUpperCase() == playerName ) {
          matchPlayerRef = 'y';
        }
        return isPlayerWinner( match.games, matchPlayerRef );
      });
      if ( status == 'won' ) {
        return totals[true] || 0;
      }
      return totals[false] || 0;
    } else {
      return 'unknown total query';
    }
  });

  Template.newMatch.events({
    'click .insert-match' : function( event, template ) {
      var newMatch = {};
      console.log(this);
      newMatch.round = this._id;
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
  Meteor.publish( "rounds", function() {
    return Rounds.find({});
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
    if ( Rounds.find({}).count() === 0 ) {
      var roundOneId = Rounds.insert({
        name: '1st',//ie. 1st Round
        key: '1',
      });
      var roundTwoId = Rounds.insert({
        name: '2nd',
        key: '2',
      });
      var roundThreeId = Rounds.insert({
        name: '3rd',
        key: '3',
      });
      var roundFourId = Rounds.insert({
        name: 'Semi-final',
        key: '4',
      });
      var roundFiveId = Rounds.insert({
        name: 'Final',
        key: '5',
      });
    }
    if ( Matches.find({}).count() === 0 ) {
      Matches.insert({
        playerX: 'LB',
        playerY: 'Andrew',
        round: roundOneId,
        games: [ 'x', 'y', null],
      });
      Matches.insert({
        playerX: 'LB',
        playerY: 'Joe',
        round: roundOneId,
        games: ['x','y',null],
      });
      Matches.insert({
        playerX: 'Philip',
        playerY: 'Poo Face',
        round: roundTwoId,
        games: ['y','x','x'],
      });
      Matches.insert({
        playerX: 'Samuel',
        playerY: 'Artyman',
        round: roundTwoId,
        games: ['x','x','x'],
      });
    }
  });
}
