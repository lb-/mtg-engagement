if (Meteor.isClient) {
  //TEMP DATA
  // var matches =  [
  //   {
  //     playerX: 'LB',
  //     playerY: 'Andrew',
  //     round: 1,
  //     games: [ 'x', 'y', null],
  //   },
  //   {
  //     playerX: 'LB',
  //     playerY: 'Joe',
  //     round: 1,
  //     games: ['x','y',null],
  //   },
  //   {
  //     playerX: 'Philip',
  //     playerY: 'Poo Face',
  //     round: 2,
  //     games: ['y','x','x'],
  //   },
  //   {
  //     playerX: 'Samuel',
  //     playerY: 'Artyman',
  //     round: 2,
  //     games: ['x','x','x'],
  //   }
  // ];

  //var matches = Matches.find({}).fetch();


  Template.rounds.rounds = function() {
    Meteor.subscribe( "matches");

    var getRounds = function( matches ) {
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
    }

    return getRounds( Matches.find().fetch() );

  }

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
    //console.log(this, player);
    if ( _.some( this.games, function( i ) { return i === null } ) ) {
      return false;
      //console.log('not completed');
    }
    return _.every( this.games, function( i ) { return i === player } );
  });

  UI.registerHelper( 'getOrdinalNumber', function( num ) {
   var s = ["th","st","nd","rd"]
   var v = num % 100;
   return num +(s[(v-20)%10]||s[v]||s[0]);
  });

  Template.newMatch.events({
    'click .insert-match' : function( event, template ) {
      //console.log(this, event, template);
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
      //console.log(this, event, template);
      Meteor.call( 'removeMatch', this._id, function() {
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
    }
  })

  Meteor.startup(function () {
    if ( Matches.find({}).count() === 0 ) {
      //console.log('no matches found');

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
      //console.log(Matches.find({}).count(), ' matches found');
    }
  });
}
