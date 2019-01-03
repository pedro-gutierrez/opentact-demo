
    //
    // This function is private, and will not be used from the outside
    // Performs an authenticated get request on the opentact rest api
    //
    //function get(  path, t, next) {
    //  var self = this;
    //  superagent
    //    .get( 'http://149.56.96.236:8002' + path )
    //    .set( 'Authorization', t )
    //    .set( 'Content-Type', 'application/json')
    //    .end( function(err, resp) {
    //      if( err ) return self.emit('error', err);
    //      next(resp.body.ret);
    //    });
    //}


    //
    // This function is private, and will not be used from the outside.
    // Represents a query for identities
    //
    //function IdentityQuery(i, t){
    //  var self = this;
      
    //  this.search = function( name ) {
    //    var self = this;
    //    setTimeout( function() {
    //      self.emit( "data", [
    //        { }        
    //               
    //      ]);
    //    }, 1000);
    //  }
      
    //  this.get = function(){
    //    get( '/identity/' + i + '/followers', t, function(f1) {
    //      get( '/identity/' + i + '/followed', t, function(f2) {
    //        // consolidate both arrays, by identity uuid
    //        self.emit( 'data', [] );
    //      });
    //    });
    //  }


    //}

    //IdentityQuery.prototype = Object.create(EventEmitter.prototype);

    /**
     * Looks for identities
     *
     * @param {object} opts - an object describing the 
     * query to perform
     *
     */
     //this.identities = function(q) {
     // return new IdentityQuery(
     //   this.config.identity, 
     //   this.config.token 
     // );    
     //}
