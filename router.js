Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  waitOn: function () {
    // wait for the subscription to be ready; see below
    return Meteor.subscribe('tournaments');
  },
});

Router.map(function() {
  this.route('home', {
    path: '/',
    data: function() {
      return {
        tournaments: Tournaments.find({}).fetch(),
      }
    },
  });
  this.route('tournament', {
    path: '/tournament/:_id',
    waitOn: function () {
      // wait for the subscription to be ready; see below
      return [
          Meteor.subscribe( 'rounds' ),
          Meteor.subscribe( 'matches' ),
        ];
    },
    data: function() {
      var rounds = Rounds.find( {}, { sort: { key: 1 } } ).fetch();
      var matches = Matches.find( { tournament: this.params._id } ).fetch();
      var tournament = Tournaments.findOne( { _id: this.params._id } );
      return {
        rounds: getRounds( rounds, matches ),
        players: getPlayers( matches ),
        tournament: tournament,
      }
    }
  });
});
