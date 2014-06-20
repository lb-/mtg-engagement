Meteor.startup(function() {
  return AccountsEntry.config({
    //logo: 'logo.png',
    //privacyUrl: '/privacy-policy',
    //termsUrl: '/terms-of-use',
    homeRoute: '/',
    dashboardRoute: '/',
    //profileRoute: 'profile',
    //passwordSignupFields: 'EMAIL_ONLY',
    //showSignupCode: true
  });
});
