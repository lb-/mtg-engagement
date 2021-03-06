version = '0.4';

if (Meteor.isClient) {
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
  var getWinningPlayer = function( match ) {
    if ( isMatchCompleted( match.games ) ) {
      if ( isPlayerWinner( match.games, 'x' ) ) {
        return match.playerX.toUpperCase();
      } else if ( isPlayerWinner( match.games, 'y' ) ) {
        return match.playerY.toUpperCase();
      }
      return 'error';
    }
    return null;
  }
  var getPointsInMatch = function( match ) {
    var points = {};
    points[ match.playerX.toUpperCase() ] = 0;
    points[ match.playerY.toUpperCase() ] = 0;
    // work out winning player, 1 point for the match win
    var winningPlayer = getWinningPlayer( match );
    if ( winningPlayer !== null ) {
      points[ winningPlayer.toUpperCase() ] += 1;
    }
    // add one point for each individual game win
    _.each( match.games, function( game ) {
      if ( game.state === 'x' ) {
        points[ match.playerX.toUpperCase() ] += 1;
      } else if ( game.state === 'y' ) {
        points[ match.playerY.toUpperCase() ] += 1;
      }
    });
    return points;
  }
  var isPlayerWinner = function( games, playerRef ) {
    if ( isMatchCompleted( games ) ) {
      var totals = _.countBy( games, function( game ) {
        var state = game;
        if ( _.isObject( game ) ) {
          state = game.state;
        }
        if ( state === playerRef ) {
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
  var getPointsInRound = function( matches ) {
    var totalPointsByPlayerName = {};
    //go through each match, get the points & add to the main scoring
    _.each( matches, function( match ) {
      var pointsInMatch = getPointsInMatch( match );
      _.each( pointsInMatch, function( points, playerName ) {
        if ( _.has( totalPointsByPlayerName, playerName ) ) {
          totalPointsByPlayerName[playerName] += points;
        } else {
          totalPointsByPlayerName[playerName] = points;
        }
      });
    });
    return totalPointsByPlayerName;
  }

  //Helpers
  UI.registerHelper( 'version', function() {
    return version;
  });
  UI.registerHelper( 'isTournamentOwner', function( tournamentId ) {
    if ( isTournamentOwner( tournamentId, Meteor.userId() ) ) {
      return true;
    }
    return false;
  });
  UI.registerHelper( 'currentRouteNameEquals', function( x ) {
    var current = Router.current();
    if ( _.str.include( current && current.path, x ) ) {
      return true
    }
    return false
  })
  UI.registerHelper( 'roundRankings', function() {
    var totalPointsByPlayerName = getPointsInRound( this.matches );
    var rankings = [];
    var playersByTotals = {};
    var totals = [];
    _.each( totalPointsByPlayerName, function( total, name ) {
      totals.push( parseInt(total) );
      if ( _.has( playersByTotals, total ) ) {
        playersByTotals[total].push( name );
      } else {
        playersByTotals[total] = [ name ];
      }
    });
    var sortedUniqeTotals = _.uniq( _.sortBy( totals, function( num ) {return num} ), true).reverse();
    _.each( sortedUniqeTotals , function( totalNum, index ) {
      _.each( playersByTotals[ totalNum ], function( name ) {
        rankings.push({ total: totalNum, name: name , rank: index + 1 });
      });
    });
    return rankings;
  });
  UI.registerHelper( 'rankingLabelClass', function( rank ) {
    if ( rank === 1 ) {
      return "label-success";
    } else if ( rank === 2 ) {
      return "label-info";
    } else if ( rank === 3 ) {
      return "label-primary";
    }
    return "label-default";
  });
  UI.registerHelper( 'totalMatches', function( query ) {
    var currentMatches = this.matches || [];
    if ( query  == 'completed' ) {
      totalCompleted = 0;
      _.each( currentMatches, function( match ) {
        if ( isMatchCompleted( match.games ) ) {
          totalCompleted += 1;
        }
      });
      return totalCompleted;
    }
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
    if ( status == undefined ) {
      return this.matches.length;
    } else if ( ( status == 'completed' ) || ( status == 'not completed') ) {
      var totals = _.countBy( this.matches, function( match ) {
        return isMatchCompleted( match.games );
      });
      if ( status == 'completed' ) {
        return totals[true] || 0;
      }
      return totals[false] || 0;
    } else if ( ( status == 'won' ) || ( status == 'lost') ) {
      var totals = _.countBy( this.matches, function( match ) {
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

  Template.intro.events({
    'blur .update-tournament' : function( event, template ) {
      var $target = $(event.target);
      var tournamentUpdate = {};
      tournamentUpdate[ $target.data( 'update' ) ] = $target.val();
      //update the current template item
      Meteor.call('updateTournament', this.tournament._id, {$set: tournamentUpdate}, Meteor.userId(), function( error, result ) {
        if ( error !== undefined ) {
          console.log( 'error', error );
        }
      })
    }
  })

  Template.newMatch.events({
    'click .insert-match' : function( event, template ) {
      var newMatch = {};
      newMatch.tournament = this.tournament._id;
      newMatch.round = this.round._id;
      newMatch.playerX = $(template.firstNode).find("[data-player='x']")[0].value;
      newMatch.playerY = $(template.firstNode).find("[data-player='y']")[0].value;
      if ( ( newMatch.playerX === "" ) || ( newMatch.playerY === "" ) ) {
        $(template.firstNode).find(".player-name-warning").show();
      } else if ( newMatch.playerX.toUpperCase() === newMatch.playerY.toUpperCase() ) {
        $(template.firstNode).find(".player-name-duplicate-warning").show();
      } else {
        $(template.firstNode).find(".player-name-warning").hide();
        $(template.firstNode).find(".player-name-duplicate-warning").hide();
        $(template.firstNode).find('input').val('')
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
      Meteor.call( 'removeMatch', this._id, this.tournament, Meteor.userId(), function( error, result ) {
        if ( error !== undefined ) {
          console.log( 'error', error );
        }
      });
    },
  });
  Template.game.events({
    'click .alternate-game-status' : function( event, template ) {
      //get the current player
      var currentPlayer = this.player;
      //work out the 'other' player
      var otherPlayer = "x";
      if ( currentPlayer == "x" ) {
        otherPlayer = "y";
      }

      //get the current game state (matches player is 'wining',
        // not matches is 'loosing', undefined is not played)
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
      var tournamentId = this.tournament;
      Meteor.call( "updateGame", this.game.matchId, this.game.index, newGameState, tournamentId, Meteor.userId(), function( error, result ) {
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
  Meteor.publish( "tournaments", function() {
    return Tournaments.find({});
  });


  Meteor.methods({
    insertMatch: function( newMatch ) {
      newMatch.created = new Date();
      newMatch.games = [null, null, null];
      var newMatchId = Matches.insert( newMatch );
    },
    removeMatch: function( _id, tournamentId, userId ) {
      if ( isTournamentOwner( tournamentId, userId ) ) {
        Matches.remove({ _id: _id });
      } else {
        throw new Meteor.Error(401, 'Only owners can remove matches in a tournament' );
      }
    },
    updateGame: function( matchId, gameIndex, gameState, tournamentId, userId ) {
      if ( isTournamentOwner( tournamentId, userId ) ) {
        var update = {};
        update['games.' + gameIndex] = gameState;
        var x = Matches.update({ _id: matchId }, { $set : update });
      } else {
        throw new Meteor.Error(401, 'Only owners can update games' );
      }
    },
    updateTournament: function( tournamentId, tournamentUpdate, userId ) {
      if ( isTournamentOwner( tournamentId, userId ) ) {
        Tournaments.update({_id: tournamentId}, tournamentUpdate );
      } else {
        throw new Meteor.Error(401, 'Only owners can update tournaments' );
      }
    }
  })

  Meteor.startup(function () {
    //currently all tournaments will use the same rounds
    if ( Rounds.find({}).count() === 0 ) {
      var roundOneId = Rounds.insert({
        name: '1st',
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
  });
}
