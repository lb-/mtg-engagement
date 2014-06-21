isTournamentOwner = function( tournamentId, userId ) {
  var tournament = Tournaments.findOne({_id:tournamentId});
  if ( tournament !== undefined ) {
    if ( _.contains( tournament.owners, userId ) ) {
      return true
    }
  }
  return false;
}

getRounds = function( rounds, matches ) {
  _.each( rounds, function( round, index) {
    round.matches = _.where( matches, { round: round._id} );
    _.each( round.matches, function( match, matchIndex, list  ) {
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
  });
  return rounds;
}

getPlayers = function( matches ) {
  var playersByName = {};
  var processMatches = function( matches, players ) {
    var players = players || ['x','y'];
    _.each ( players, function( playerGene, playerIndex ) {
      var playerRef = 'player' + playerGene.toUpperCase();
      var matchesGroupedByPlayers = _.groupBy( matches, function( match ) {
        return match[playerRef].toUpperCase();
      });
      _.each( matchesGroupedByPlayers, function( matches, playerName, list) {
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
