(function(){
  'use strict';

  Vue.$configure({
    verbose: true
  });
  
  var client = new Opentact({
    sipProxy: '158.69.112.28',
    sipWsUrl: 'wss://158.69.112.28:8443',
    sipDebug: true
  });

  Vue.$comp( "message", {
    many: true,
    data: { message: null },
    ui: {
      style: { $DEFAULT: "", WARN: "warning", INFO: "info"  },
      show: { $DEFAULT: "invisible", WARN: "visible", INFO: "visible" }
    },
    states: {
      HIDDEN: {
        warn: { then: "WARN", and: [ { set: "message" }, { timeout: 5}  ]},
        info: { then: "INFO", and: [ { set: "message" }, { timeout: 5}  ]}
      },

      WARN: {
        timeout: { then: "HIDDEN", and: { unset: "message" }},
        warn: { then: "WARN", and: [ { set: "message" }, { timeout: 5}  ]},
        info: { then: "INFO", and: [ { set: "message" }, { timeout: 5}  ]}
      },

      INFO: {
        timeout: { then: "HIDDEN", and: { unset: "message" }},
        warn: { then: "WARN", and: [ { set: "message" }, { timeout: 5}  ]},
        info: { then: "INFO", and: [ { set: "message" }, { timeout: 5}  ]}
      }
    },

    listen: {
      events: {
        $parent: { warn: "warn", info: "info" }
      }
    }
  });

  Vue.$comp( "login", {
    data: { username: "", password: "", token: "", identity: "", identity_l: "" },
    ui: {
      label: { $DEFAULT: "Login", BUSY: "Sending..." }
    },
    states: {
      READY: {
        submit: [
          { then: "BUSY",
            if: { has: "identity_l" },
            and: [
              {
                post: "/api/login/identity",
                body: { identity: "identity_l" }
              },
            ] 
          },

          { then: "BUSY",
            and: {
              post: "/api/login",
              body: { username: "username", password: "password" }
            }
          }
        ],
        error: { then: "READY", and: { send: "error", to: "$parent" } },
        register: { then: "READY", and:  { send: "register", to: "$parent"  } },
        info: { then: "READY", and: { pub: "info" }}
      },

      BUSY: {
        data: { then: "READY", and: [
          { set: { token: "token", identity: "identity" } },
          { store: "token", data: "token" },
          { send: "signed_in", to: "$parent" },
          { unset: "username" },
          { unset: "password" },
          { unset: "identity_l" },
          { unset: "id" },
          { unset: "token" }
        ]},
        invalid: { then: "READY", and: [
          { pub: "warn", msg: "Please check your data" },
          { unset: "password" }
        ]},
        not_found: { then: "READY", and: { pub: "warn", msg: "Invalid Login" } },
        error: { then: "READY", and: { pub: "warn" } }
      }
    },

    listen: {
      events: {
        $parent: { info: "info" }
      }
    },

    methods: {

    }

  });

  Vue.$comp( "register", {
    data: { firstName: "", lastName: "", email: "", password: "" },
    ui: {
      label: { $DEFAULT: "Register", BUSY: "Sending..." }
    },
    states: {
      READY: { 
        submit: { 
          then: "BUSY", 
          and: { 
            post: "/api/register",
            body: { 
              first: "firstName", 
              last: "lastName", 
              email: "email", 
              password: "password" 
            }
          } 
        },
        login: {
          then: "READY",
          and: {
            send: "login",
            to: "$parent"
          }
        }
      },
      BUSY: { 
        invalid: { 
          then: "READY",
          and: [
            { pub: "warn", msg: "Please check your data" },
            { unset: "password" }
          ]
        },
        conflict: {
          then: "READY",
          and: [
            { pub: "warn", msg: "This account already exists" },
            { unset: "password" }
          ]
        },

        data: { 
          then: "READY", 
          and: [
            { send: "registered", to: "$parent" },
            { unset: "firstName" },
            { unset: "lastName" },
            { unset: "email" },
            { unset: "password" }
          ]
        }, 
        error: { 
          then: "READY", 
          and: [ { pub: "warn" }, { unset: "password" } ] 
        }
      }
    }

  });

  Vue.$comp( "imstart", {
    ui: {
      status: { DISABLED: "disabled", ENABLED: "" }
    },

    states: {
      DISABLED: {
        enable: { then: "ENABLED" }
      },

      ENABLED: {
        disable: { then: "DISABLED" },
        chat: { then: "ENABLED", and: { send: "im", to: "$parent" }}
      }
    },

    listen: {
      states: {
        imstatus: { DISCONNECTED: "disable", CONNECTED: "enable" }
      }
    }
  });


  Vue.$comp( "callstart", {
    ui: {
      status: { DISABLED: "disabled", ENABLED: "" }
    },

    states: {
      DISABLED: {
        enable: { then: "ENABLED" }
      },

      ENABLED: {
        disable: { then: "DISABLED" },
        audio: { then: "ENABLED", and: { send: "audio", to: "$parent" }},
        video: { then: "ENABLED", and: { send: "video", to: "$parent" }}
      }
    },

    listen: {
      states: {
        sipstatus: { DISCONNECTED: "disable", CONNECTED: "enable" }
      }
    }
  });

  Vue.$comp( "toggle-token-auth", {
    ui: {
      status: { OFF: "off", ON: "on" }
    },
    states: {
      ON: {
        toggle: { then: "OFF" }
      },

      OFF: {
        toggle: { then: "ON" }
      }
    }
  });


  Vue.$comp( "imstatus", {
    ui: {
      status: { DISCONNECTED: "default", CONNECTED: "primary" }
    },
    states: {
      DISCONNECTED: {
        connection: { if: { eq: "xmpp", value: "true", using: "msg" }, then: "CONNECTED" },
        toggle: { then: "DISCONNECTED", and: "connect" }
      },

      CONNECTED: {
        connection: { if: { eq: "xmpp", value: "false", using: "msg" }, then: "DISCONNECTED" },
        toggle: { then: "CONNECTED", and: "disconnect" }
      }
    },

    listen: {
      events: {
        user: { connection: "connection" }
      }
    },

    methods: {

      connect: function(){
        client.connect({ xmpp: true});
      },

      disconnect: function(){
        client.disconnect({ xmpp: true});
      }

    }
  });

  Vue.$comp( "sipstatus", {
    ui: {
      status: { DISCONNECTED: "default", CONNECTED: "primary" }
    },
    states: {
      DISCONNECTED: {
        connection: { if: { eq: "sip", value: "true", using: "msg" }, then: "CONNECTED" },
        toggle: { then: "DISCONNECTED", and: "connect" }
      },

      CONNECTED: {
        connection: { if: { eq: "sip", value: "false", using: "msg" }, then: "DISCONNECTED" },
        toggle: { then: "CONNECTED", and: "disconnect" }
      }
    },

    listen: {
      events: {
        user: { connection: "connection" }
      }
    },

    methods: {

      connect: function(){
        client.connect({ sip: true});
      },

      disconnect: function(){
        client.disconnect({ sip: true});
      }

    }
  });

  Vue.$comp( "control", {
    data: { to: "" },
    states: {
      HIDDEN: {
        show: { then: "VISIBLE" }
      },

      VISIBLE: {
        hide: { then: "HIDDEN" },
        audio: { then: "DEFAULT", and: { pub: "audio", data: { to: "to" }}},
        video: { then: "DEFAULT", and: { pub: "video", data: { to: "to" }}},
        im: { then: "DEFAULT", and: { pub: "im", data: { to: "to" }}}
      }
    },
    
    listen: {
      states: { 
        user: { CALL: "show", $OTHERWISE: "hide" }
      }
    },
  });

  Vue.$comp( "contacts", {
    data: { contacts: [] },
    ui: {
      search: { $DEFAULT: "Search", SEARCHING: "Searching..." }
    },
    states: {
      HIDDEN: {
        show: { 
          then: "FETCHING", 
          and: { get: "/api/contacts" }
        },
        terminated: { 
          then: "READY" 
        }
      },
      READY: {
        hide: { then: "HIDDEN"  },
        started: { then: "HIDDEN" },
        search: {
          then: "SEARCHING",
          and: {
            post: "/api/search",
            using: "msg",
            body: { 
              keywords: "keywords"
            }
          }
        },

        data: {
          then: "READY",
          and: [
            { set: "contacts" },
            { pub: "contacts" }
          ]
        } 
      },

      FETCHING: {
        data: { 
          then: "READY",
          and: [
            { set: "contacts" },
            { pub: "contacts" }
          ]
        },
        invalid: {
          then: "READY"
        }
      },

      SEARCHING: {
        data: { 
          then: "READY",
          and: [
            { set: "contacts" },
            { pub: "contacts" }
          ]
        },
        invalid: {
          then: "READY"
        }
      }
    },

    methods: {
      doSearch: function() {
        this.$http({
          path: "/api/contacts",
        });
      },

      reset: function() {
        this.$data.contacts = [];
      }
    },

    hooks: {
      $init: "show"
    },

    listen: {
      states: {
        app: { LOGIN: "hide", HOME: "show" },
      }
    }

  });

  Vue.$comp( "contact", {
    many: true,
    props: [ "contact" ],
    states: {
      INIT: {
        route: { then: "INIT", and: "doRoute" },
        not_followed: { then: "NOT_FOLLOWED" },
        follow_sent: { then: "FOLLOW_SENT" },
        follow_received: { then: "FOLLOW_RECEIVED" },
        following: { then: "FOLLOWING" }
      },

      CONTACT: {
      },

      NOT_FOLLOWED: {
        follow: { 
          then: "NOT_FOLLOWED", 
          and: "follow" 
        },
        data: {
          then: "INIT", and: {
            send: "data",
            to: "$parent"
          }
        }
      },

      FOLLOW_SENT: {

      },

      FOLLOW_RECEIVED: {
        accept: {
          then: "FOLLOW_RECEIVED",
          and: "accept"
        },

        refuse: {
          then: "FOLLOW_RECEIVED",
          and: "decline"
        },

        data: {
          then: "INIT", and: {
            send: "data",
            to: "$parent"
          }
        }
      },

      FOLLOWING: {
        audio: { then: "FOLLOWING", and: "startAudioCall" }, 
        video: { then: "FOLLOWING", and: "startVideoCall" }, 
        chat: { then: "FOLLOWING", and: "startChat" }, 
      }


    },
    
    methods: {
      
      doRoute: function() {
        this.$receive( this.contact.rel );
      },

      follow: function() {
        this.$http({
          path: "/api/follow",
          method: 'POST',
          data: {
            email: this.contact.email
          }
        });
      },
      
      accept: function() {
        this.$http({
          path: "/api/accept",
          method: 'POST',
          data: {
            email: this.contact.email
          }
        });
      },
      
      decline: function() {
        this.$http({
          path: "/api/decline",
          method: 'POST',
          data: {
            email: this.contact.email
          }
        });
      },

      refresh: function(msg) {
        this.contact = msg;
      },

      startAudioCall: function(){
        Vue.$send( "call", "audio", this.contact );
      },


      startVideoCall: function(){
        Vue.$send( "call", "video", this.contact );
      },

      startChat: function() {
        Vue.$send( "im", "start", this.contact );
      }




    },

    hooks: {
      $init: "route"
    }

  });

  Vue.$comp( "ext-number", {
    data: { number: "" },
    states: {
      READY: {
        call: { 
          then: "READY",
          and: "startAudioCall"
        },

        search: {
          then: "READY",
          and: {
            send: "search",
            to: "$parent",
            data: {
              keywords: "number"
            }
          }
        }
      },
    },
    methods: {
      startAudioCall: function() {
        Vue.$send( "call", "audio", {
          identity: this.number,
          pstn: true
        });
      }
    }
  });

  Vue.$comp( "user", {
    data: { user: {} },
    states: {
      DEFAULT: {
        user: { 
          then: "DEFAULT", 
          and: [
            { set: "user" },
            "connect" 
          ]
        },
        logout: { 
          then: "DEFAULT", 
          and: [ 
            "logout",  
            { unset: "user" },
            { store: "token", remove: true },
            { send: "signout", to: "app" } 
          ]
        }
      },
    },

    methods: {
      
      logout: function() {
        client.logout();
      },


      connect: function() {
        var self = this;
        client.on( "connection", function(c) {
          self.$pub( "connection", c );
        });

        var self = this;
        [ "starting", 
          "received", 
          "sending",
          "message",
          "state",
          "receipt", 
          "rejected", 
          "started", 
          "ringing", 
          "terminated",
          "error"
        ].map( function(e) {
          
          client.on( 'call:' + e , function(session) {
            Vue.$send( "call", e, session);
            Vue.$send( "contacts", e, session);
          });

          client.on( 'im:' + e , function(session) {
            Vue.$send( "im", e, session);
          });
        
        });

        client.login({
          identity: this.$data.user.identity,
          token: this.$data.user.token,
        });
      }


    },

    listen: {
      events: {
        app: { user: "user" }
      }
    }
  });

  Vue.$comp( "remotevideo", {
    many: true,
    states: {
      PAUSED: {
        play: { then: "PLAYING", and: "play" }
      },

      PLAYING: {
        pause: { then: "PAUSED", and: "pause" }
      }
    },

    listen: {
      states: {
        call: {
          STARTED: "play",
          ENDED: "pause"
        }
      }
    },

    methods: {
      play: function(){
        $( "#remoteVideo" )[0].play();
      },

      pause: function(){
        $( "#remoteVideo" )[0].pause();
      }
    }

  });

  
  function getDisplayName( contacts, identity ) {
    if( contacts ) {
      var c= contacts.filter( function(c){
        return c.identity === identity;
      });

      if( c.length ) {
        return c[0].first;
      }
    };

    return "Unknown";
  }


  Vue.$comp( "call", {
    data: {
      error: "",
      session: {},
      contacts: [],
      terminations: {
        403: "Forbidden (403)",
        404: "Not found (404)",
        408: "No response (408)",
        488: "Not acceptable (488)",
        "Canceled" : "Canceled",
        "Hangup": "Call Ended"
      },
      displayName: "",
      videos: []
    },
    ui: {
      status: {
        TERMINATED: "",
        STARTING: "Starting",
        RECEIVING: "Starting",
        RINGING: "Ringing",
        STARTED: "In progress"
      }
    },

    computed: {
      is_audio_only: function() {
        return !this.session.video;
      }
    },

    states: {
      IDLE: {
        audio: { then: "STARTING", and: [ "setupVideo", "audio" ]},
        video: { then: "STARTING", and: [ "setupVideo", "video" ]},
        received: { then: "RECEIVING", and: [{ unset: "error"}, { set: "session" }, "setDisplayName" ]},
        contacts: { then: "IDLE", and: { set: "contacts" } }
      },

      STARTING: {
        starting: { then: "STARTING", and: [{ unset: "error"}, { set: "session" }, "setDisplayName" ]},
        started: { then: "STARTED" },
        ringing: { then: "RINGING" },
        hangup: { then: "ENDING", and: [ { timeout: 1 }, "hangup" ]},
        terminated: { then: "ENDING", and: "terminated" }
      },

      RECEIVING: {
        reject: { then: "ENDING", and: [ { timeout: 1 }, "reject" ] },
        accept: { then: "RECEIVING", and: [ "setupVideo", "accept" ]},
        terminated: { then: "ENDING", and: "terminated" },
        started: { then: "STARTED" },
      },

      RINGING: {
        started: { then: "STARTED" },
        hangup: { then: "ENDING", and: [ { timeout: 1 }, "hangup" ]},
        terminated: { then: "ENDING", and: "terminated" }
      },

      STARTED: {
        hangup: { then: "ENDING", and: [ { timeout: 1 }, "hangup" ]},
        terminated: { then: "ENDING", and: "terminated" }
      },

      ENDING: {
        timeout: { then: "ENDING", and: "terminated" },
        terminated: { then: "ENDED", and: [ { unset: "videos" }, "showCause" ]},
      },

      ENDED: {
        received: { then: "RECEIVING", and: [ "setupVideo", { unset: "error" }, { set: "session" } ] },
        close: { then: "IDLE", and: { unset: "error" } },
        audio: { then: "STARTING", and: [ "setupVideo", "audio" ] },
        video: { then: "STARTING", and: [ "setupVideo", "video" ] },
        received: { then: "RECEIVING", and: [ { unset: "error" }, { set: "session"  }, "setDisplayName" ]}
      }
    },

    methods: {
      
      setDisplayName: function() {
        this.$data.displayName = getDisplayName(
          this.$data.contacts,
          this.$data.session.remoteUser

        );
      },
      
      showCause: function(msg) {
        this.$data.error = (msg && msg.reason) ? this.$data.terminations[msg.reason] || "Call ended" : "Call ended";
      },

      reject: function(){
        client.reject({ id: this.session.id });
      },

      accept: function(){
        this.$nextTick( function() {
          client.accept({
            id: this.$data.session.id,
            audio: true,
            video: true
          });
       });
      },

      hangup: function(){
        client.hangup({
          id: this.$data.session.id
        });
      },

      audio: function(msg){
        this.$nextTick( function() {
          client.call({
            to: msg.identity,
            pstn: msg.pstn,
            audio: true,
            video: false
          });
        });
      },

      video: function(msg){
        this.$nextTick( function() {
          client.call({
            to: msg.identity,
            audio: true,
            video: true
          });
        });
      },

      setupVideo: function(){
        this.$data.videos = [ 1 ];
      }
    },

    listen: {
      events: {
        control: { audio: "audio", video: "video" },
        contacts: { contacts: "contacts" }
      },

      states: {
        sipstatus: { DISCONNECTED: "hangup" }
      }
    }

  });

  Vue.$comp( "im", {
    data: {
      session: {},
      user: {},
      contacts: [],
      messages: [],
      message: "",
      displayName: "",
      typing : false
    },

    ui: {
      status: { $DEFAULT: "", STARTING: "Starting..." }
    },

    states: {
      IDLE: {
        user: { then: "IDLE", and: { set: "user" }},
        contacts: { then: "IDLE", and: { set: "contacts" } },
        start: { then: "IDLE", and: "start" },
        starting: { then: "STARTING", and: "updateSession" },
        message: { then: "STARTED", and: [ "updateSession", "incoming", { pub: "update" }]},
        started: { then: "STARTED", and: "updateSession" }
      },

      STARTING: {
        close: { then: "IDLE", and: [ 
          {unset: "session" },
          {unset: "messages"},
          {unset: "message" }
        ]},
        started: { then: "STARTED", and: "updateSession" }
      },

      STARTED: {
        started: { then: "STARTED", and: "updateSession" },
        close: { then: "IDLE", and: [
          {unset: "session" },
          {unset: "messages"},
          {unset: "message" }
        ]},
        state: { then: "STARTED", and: "setTypingIndicator" },
        typing: { then: "STARTED", and: [ "startComposing", { timeout: 5 } ] },
        timeout: { then: "STARTED", and: "pauseComposing" },
        message: { then: "STARTED", and: [ "incoming", "pubMessage" ] },
        send: { then: "STARTED", and: [ "sendMessage", { unset: "message" }, "unsetTyping" ] },
        sending: { then: "STARTED", and: "outgoing" },
        receipt: { then: "STARTED", and: ["incoming", "pubMessage" ]},
        error: { then: "STARTED", and: "pubMessage" }
      },
    },
    methods: {
      start: function(msg) {
        client.im({
          to: msg.identity
        });
      },

      updateSession: function(msg) {
        console.log("updating session", msg );
        this.$data.session = msg;
        this.$data.displayName = getDisplayName(
          this.$data.contacts,
          this.$data.session.remoteUser
        );
      },

      startComposing: function(){
        client.imState({
          session: this.$data.session.id,
          state: "composing"
        });
      },

      pauseComposing: function(){
        client.imState({
          session: this.$data.session.id,
          state: "paused"
        });
      },

      setTypingIndicator: function(msg){
        this.$data.typing = (msg.state === 'composing');
      },

      sendMessage: function(msg) {
        client.imMessage({
          to: this.$data.session.remoteUser,
          message: this.$data.message
        });
      },

      addOrUpdateMessage: function( finder, onFound, onNotFound ) {
        var found = this.$data.messages.filter(finder);
        if( found.length ) 
          onFound(found[0]); 
        else 
          if( onNotFound) onNotFound(this);
      },

      incoming: function(msg) {
        this.addOrUpdateMessage( function(msg2) {
          return msg2.id === msg.id;
        }, function(existing) {
          existing.state = msg.state; 
        }, function(fsm) {
          msg.to = fsm.$data.user.first;
          msg.from = getDisplayName(fsm.$data.contacts, msg.from);
          fsm.$data.messages.push(msg);
        });
      },

      outgoing: function(msg) {
        this.addOrUpdateMessage( function(msg2) {
          return msg2.id === msg.id;
        }, function(existing) {
          existing.state = msg.state; 
        }, function(fsm) {
          msg.from = fsm.$data.user.first;
          msg.to = getDisplayName(fsm.$data.contacts, msg.to);
          fsm.$data.messages.push(msg);
        });
      },

      pubMessage: function(msg) {
        var message = this.$data.messages.filter( function(m){
          return msg.id === m.id;
        });

        if( message.length ) {
          message[0].state = msg.state 
          message[0].code = msg.code;
          message[0].condition = msg.condition;
          this.$pub( "update", message[0] );
        }
      }
    },

    listen: {
      events: {
        app: { user: "user" },
        control: { im: "start" },
        contacts: { contacts: "contacts" }
      }
    }
  });

  Vue.$comp( "im-message", {
    many: true,
    props: [ "message" ],
    ui: {
      icon: { 
        PENDING: "time",
        NORMAL: "check",
        ERROR: "alert-circle"
      }
    },
    
    states: {
      PENDING: {
        normal: { then: "NORMAL" },
        error: { then: "ERROR" },
        start: { then: "PENDING", and: "doStart" },
        refresh: { then: "PENDING", and: "doRefresh" },
      },

      NORMAL: {
        update: { then: "doRoute" }
      },

      ERROR: {
        update: { then: "doRoute" }
      }
    },

    hooks: {
      $init: "start" 
    },

    methods: {
      doStart: function(){
        this.$receive(this.message.state);
      },

      doRefresh: function(msg) {
        if( msg.id === this.message.id ) {
          this.message = msg;
          this.$receive(msg.state);
        }
      },
    },

    listen: {
      events: {
        $parent:  { update: "refresh" }
      }
    }
  });

  Vue.$comp( "home" );
  Vue.$comp( "checking" );
  Vue.$comp( "connecting" );

  Vue.$vue( "app", {
    data: { user: {} },
    ui: {
      content: { 
        $DEFAULT: "connecting", 
        CHECKING: "checking",
        LOGIN: "login",
        REGISTER: "register", 
        HOME: "home" 
      },
      background: { 
        LOGIN: "green", 
        REGISTER: "green", 
        $DEFAULT: "white" 
      }
    },
    states: {
      INIT: {
        start: {
          then: "CHECKING", and: {
            get: "/api/session"
          }
        }
      },

      CHECKING: {
        data: [ 
          { 
            if: { has: "token", using: "msg" }, 
            then: "HOME", 
            and: [
              { store: "token", data: "token" },
              { pub: "user" }
            ]
          },

          { then: "LOGIN",
            and: { store: "token", remove: true }
          }
        ],

        not_found: {
          then: "LOGIN",
          and: { store: "token", remove: true }
        }
      },

      LOGIN: {
        register:  { then: "REGISTER" },
        signed_in: { then: "HOME", and: { pub: "user" }}
      },

      REGISTER: {
        login: { then: "LOGIN" },
        registered: { then: "LOGIN", and: { pub: "info", msg: "Your account has been created. Please login." }}
      },

      HOME: {
        signout: { then: "LOGIN", and: { unset: "user" } }
      }
    }
  });


  $.ajaxPrefilter( function( options, originalOptions, xhr ) {
    var t = Vue.$store( 'token' );
    if( t ) xhr.setRequestHeader( 'token', t );
  });


})();
