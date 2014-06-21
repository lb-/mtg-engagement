isTournamentOwner = function( tournamentId, userId ) {
  //console.log(tournamentId, userId);
  var tournament = Tournaments.findOne({_id:tournamentId});
  //console.log(tournament);
  if ( tournament !== undefined ) {
    if ( _.contains( tournament.owners, userId ) ) {
      return true
    }
  }
  return false;
}

getRounds = function( rounds, matches ) {
  var groupedMatches = _.groupBy( matches, function( match ) {
    return match.round;
  });

  var rounds = [];
  var newRounds = ( rounds );
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

getPlayers = function( matches ) {
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
