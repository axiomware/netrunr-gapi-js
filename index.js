/*
 * Netrunr API - JavaScript
 *
 * Overview:
 * The API is an interface to the Netrunr BLE gateway.
 *
 * API capabilities include:
 * - Authentication
 * - Device management:
 *   - Scan for BLE devices
 *   - Connect/disconnect BLE devices
 *   - Discover BLE Services, Characteristics, and Descriptors
 *   - Read/write Characteristic/Descriptor values
 *   - Subscribe/unsubscribe
 *   - Asynchronously receive Character Value Notifications and Indications
 *   - Asynchronously receive functional, status, and error information
 * - Gateway management:
 *   - Check gateway registration, status, etc.
 * 
 * The API also includes functions for internal management 
 * (API initialization, configuration, etc.).
 *
 * The API is initialized by creating a new JS object instance
 * ("new appc.gapi()"). Then the caller authenticates (initially with
 * a username/password; later with a token), configures various API
 * parameters, and opens a transport (connection) to the gateway.
 *
 * Once initialized, the API can be used to access and manage BLE devices
 * within range of the gateway.
 *
 *
 * Details:
 * API instance methods (functions) are called to communicate between
 * the caller and a gateway over a specified transport communication layer.
 * The transport layer may be based on transactions, messages, or streams.
 * 
 * This JavaScript version of the API is procedural; however, a REST-like
 * definition (e.g. as implemented by the API HTTP binding) may also 
 * be used.
 *
 * References: 
 * Many of the API functions follow GAP/GATT definitions:
 *  https://www.bluetooth.org/docman/handlers/downloaddoc.ashx?doc_id=285911
 *  https://www.bluetooth.org/docman/handlers/downloaddoc.ashx?doc_id=285910
 *
 *
 * Security:
 * The API is expected to run with a security framework that provides
 * Authentication, Authorization, Encryption, and Privacy services.
 *
 * Authentication is based on an initial user/password login,
 * followed by issuance of a token (e.g. JSON Web Token) for ongoing access.
 * OAuth or other authentication scheme may optionally be available.
 *
 * The caller is given token-based credentials upon a successful login,
 * and may store these for future use. Tokens may be changed upon
 * each new login, after a period of time has elapsed or for other reasons.
 * Therefore, a caller should be prepared to re-authenticate via login
 * at any time.
 *
 * Serialization:
 * The gateway imposes certain limitations on parallel API commands.
 * Only one device scan may be outstanding at a time. 
 * Typically, only one command may be outstanding for each connected device.
 * If an API call fails (with appc.ERROR_CONFLICT), it should be
 * retried after a previous related call completes.
 *
 * Transports:
 * Currently supported transports include:
 * - MQTT-S: appc.gapi.ws
 * - HTTPS: appc.gapi.http
 *
 *
 * Usage:
 * var gapi = new appc.gapi();
 * gapi.config(obj);
 * gapi.open({}, function(robj) {}, function(robj) {});
 *  ...API commands...
 *  gapi.login();
 *  gapi.event();
 *  gapi.list();
 * ...
 * gapi.close();
 *
 *
 *
 *
 * Copyright(C) 2017,2018 Axiomware Systems Inc.. All Rights Reserved.
 */

//(function(window) {

var appc;

//"use strict";
if (typeof appc == "undefined") {
  /* TBD: 'var' fails with Node.js. "use strict" requires 'var appc' */
  //var appc = function() {
  appc = function() {
  };
}

/* Node.js shim */
appc.nodejs = false;
if (typeof window == "undefined") {
  appc.nodejs = true;
}

/* API release version */
appc.VERSION = "1.0.0";

/* API errors */
appc.ERROR_SUCCESS = 200;
appc.ERROR_BAD_REQUEST = 400;
appc.ERROR_AUTHENTICATION_ERROR = 401;
appc.ERROR_FORBIDDEN_REQUEST = 403;
appc.ERROR_REQUEST_NOT_FOUND = 404;
appc.ERROR_METHOD_NOT_ALLOWED = 405;
appc.ERROR_PARAMETERS_NOT_ACCEPTABLE = 406;
appc.ERROR_CONFLICT = 409;
appc.ERROR_REQUEST_PRECONDITION_FAILED = 412;
appc.ERROR_PARAMETER_MISSING = 441;
appc.ERROR_PARAMETER_VALUE_NOT_VALID = 442;
appc.ERROR_UNEXPECTED_INTERNAL_CONDITION = 443;
appc.ERROR_INTERNAL_ERROR = 500;
appc.ERROR_NO_CONNECTION = 504;
appc.ERROR_CONNECTION_EXISTS = 505;
appc.ERROR_OUT_OF_RESOURCES = 507;

/* GAPI commands */
appc.GAPI_GAP_PASSIVE =                        0;
appc.GAPI_GAP_ACTIVE =                         1;
appc.GAPI_GAP_ISENABLED =                      2;
appc.GAPI_GAP_NODE =                           3;
appc.GAPI_GAP_CONNECT =                        4;
appc.GAPI_GAP_ENABLE =                         5;
appc.GAPI_GAP_NAME =                           6;
appc.GAPI_GATT_NODES =                         7;
appc.GAPI_GATT_NODES_NODE =                    8;
appc.GAPI_GATT_SERVICES =                      9;
appc.GAPI_GATT_SERVICES_PRIMARY =              10;
appc.GAPI_GATT_SERVICES_PRIMARY_UUID =         11;
appc.GAPI_GATT_SERVICES_SERVICE =              12;
appc.GAPI_GATT_SERVICE_CHARS =                 13;
appc.GAPI_GATT_CHARS_UUID =                    14;
appc.GAPI_GATT_CHARS_CHAR =                    15;
appc.GAPI_GATT_CHARS_CHAR_INDICATE_ON =        16;
appc.GAPI_GATT_CHARS_CHAR_INDICATE_OFF =       17;
appc.GAPI_GATT_CHARS_CHAR_NOTIFY_ON =          18;
appc.GAPI_GATT_CHARS_CHAR_NOTIFY_OFF =         19;
appc.GAPI_GATT_CHARS_CHAR_READ =               20;
appc.GAPI_GATT_CHARS_READ_UUID =               21;
appc.GAPI_GATT_CHARS_CHAR_READ_LONG =          22;
appc.GAPI_GATT_CHARS_READ_MULTIPLE =           23;
appc.GAPI_GATT_CHARS_CHAR_READ_INDICATE =      24;
appc.GAPI_GATT_CHARS_CHAR_READ_NOTIFY =        25;
appc.GAPI_GATT_CHARS_CHAR_SUBSCRIBE_INDICATE = 26;
appc.GAPI_GATT_CHARS_CHAR_SUBSCRIBE_NOTIFY =   27;
appc.GAPI_GATT_CHARS_CHAR_WRITE =              28;
appc.GAPI_GATT_CHARS_CHAR_WRITE_LONG =         29;
appc.GAPI_GATT_CHARS_CHAR_WRITE_NORESPONSE =   30;
appc.GAPI_GATT_CHARS_CHAR_WRITE_RELIABLE =     31;
appc.GAPI_GATT_CHARS_CHAR_DESCS =              32;
appc.GAPI_GATT_DESCS_DESC =                    33;
appc.GAPI_GATT_DESCS_DESC_READ =               34;
appc.GAPI_GATT_DESCS_DESC_WRITE =              35;
appc.GAPI_GATT_DESCS_DESC_WRITE_LONG =         36;
appc.GAPI_RSVD37 =                             37;
appc.GAPI_RSVD38 =                             38;
appc.GAPI_RSVD39 =                             39;
appc.GAPI_RSVD40 =                             40;
appc.GAPI_PAIR =                               41;
appc.GAPI_RSVD42 =                             42;
appc.GAPI_RSVD43 =                             43;
appc.GAPI_RSVD44 =                             44;
appc.GAPI_RSVD45 =                             45;
appc.GAPI_RSVD46 =                             46;
appc.GAPI_RSVD47 =                             47;
appc.GAPI_RSVD48 =                             48;
appc.GAPI_RSVD49 =                             49;
appc.GAPI_RSVD50 =                             50;
appc.GAPI_CONFIGURE =                          51;
appc.GAPI_RSVD52 =                             52;
appc.GAPI_RSVD53 =                             53;
appc.GAPI_RSVD54 =                             54;
/* */
appc.GAPI_NO_COMMAND =                         55;
/* */
appc.GAPI_VERSION =                            56;
/* More reserved commands */
/* */
appc.GAPI_NONE =                              999;

/* API asynchronous events (match gateway internal API callback types) 
 * Not all of these occur
 */
appc.EVENT_DISCONNECT =                         1;
appc.EVENT_COMMAND_COMPLETE =                   2;
appc.EVENT_COMMAND_STATUS =                     3;
appc.EVENT_HARDWARE_ERROR =                     4;
appc.EVENT_READ_RSSI =                          5;
appc.EVENT_READ_CHANNEL_MAP =                   6;
appc.EVENT_CONNECTION_COMPLETE =                7;
appc.EVENT_ADVERTISING_REPORT =                 8;
appc.EVENT_LE_CONNECTION_UPDATE_COMPLETE =      9;
appc.EVENT_LE_CONNECTION_CANCEL =              10;
appc.EVENT_LE_READ_REMOTE_FEATURES_COMPLETE =  11;
appc.EVENT_LE_LTK_REQUEST =                    12;
appc.EVENT_LE_REMOTE_CONNECTION_PARAMETER_REQUEST =  13;
appc.EVENT_LE_DATA_LENGTH_CHANGE =             14;
appc.EVENT_LE_READ_LOCAL_P256_KEY_COMPLETE =   15;
appc.EVENT_LE_GENERATE_DHKEY_COMPLETE =        16;
appc.EVENT_LE_ENHANCED_CONNECTION_COMPLETE =   17;
appc.EVENT_LE_DIRECT_ADVERTISING_REPORT =      18;
/* Encryption change: 
 * subcode: status (>= 0), API error (< 0)
 */
appc.EVENT_ENCRYPT_CHANGE =                    19;
appc.EVENT_ENCRYPTION_KEY_REFRESH_COMPLETE =   20;
/* TBD */
/* Security Request
 * subcode: security request: authentication request
 */
appc.EVENT_PAIRING_COMPLETE =                  32;
appc.EVENT_SECURITY_REQUEST =                  37;
appc.EVENT_REQUEST_ERROR =                     38;
appc.EVENT_SCAN_ENABLE =                       39;
appc.EVENT_TRANSMIT_POWER =                    40;
appc.EVENT_AUTHEN_KEY =                        41;
appc.EVENT_PAIR_REQUEST =                      42;

/* Security Manager: AuthReq */
appc.SM_BONDING =                               1;
appc.SM_MITM =                                  4;
appc.SM_SECURE =                                8;




/* API instance  */
appc.gapi = function(obj) {
  /* API instance properties */
  this.defaultHost = 'gw.axiomware.com';
  this.defaultHTTPPort = 80;
  this.defaultHTTPSPort = 443;
  this.defaultPort = 9002;
  this.defaultType = 'ws';
  this.useSSL = 1;

  this.type = null;                     /* transport type */
  this.http = null;                     /* HTTP transport handle */
  this.ws = null;                       /* WebSocket transport handle */
  this.transport = null;                /* active transport handle */

  this.host = this.getRESTIP();
  this.httpPort = this.defaultHTTPPort;
  this.httpsPort = this.defaultHTTPSPort;
  this.port = this.getRESTPort();
  this.tid = '';
  this.token = '';
  this.user = '';
  this.gapiUser = '';
  this.gapiPwd = '';
  this.gwid = this.getRESTGWID();

  this.inited = 0;
  this.loggedIn = 0;
  this.connected = 0;                   /* transport-level */
  this.connectedId = new Object();      /* device-level */
  this.globalProcessing = 0;                  /* serialize scans */
  this.connectionProcessing = new Object();
  this.clientCallbacks = new Object();
  this.eventCallbacks = new Object();

  /* Multi-channel (for transports that support channels) */
  this.channelAdmin = '0';
  this.channelDataIn = '1';
  this.channelDataOut = '2';
  this.channelReportIn = '3';
  this.channelReportOut = '4';
  this.channelEventIn = '5';
  this.channelEventOut = '6';

  /* TBD: remove this and describe... */
  this.useLegacyDescribe = false;

  this.verbose = 0;
};




/*
 * API instance function prototypes
 */

/* Configure API */
appc.gapi.prototype.config = function(cobj) {
  if (!cobj || this.connected)
    return 0;

  if (typeof cobj['host'] != "undefined")
    this.host = cobj['host'];
  if (typeof cobj['httpPort'] != "undefined")
    this.httpPort = cobj['httpPort'];
  if (typeof cobj['httpsPort'] != "undefined")
    this.httpsPort = cobj['httpsPort'];
  if (typeof cobj['port'] != "undefined")
    this.port = cobj['port'];
  if (typeof cobj['useSSL'] != "undefined")
    this.useSSL = cobj['useSSL'];

  if (typeof cobj['type'] != "undefined") {
    if (cobj['type'] !== 'http' && cobj['type'] !== 'ws') {
      if (this.verbose)
	console.log('appc.gapi.config: ERROR: bad type: ' + cobj['type']);
      return 0;
    }
    this.type = cobj['type'];
  }

  if (typeof cobj['user'] != "undefined")
    this.user = cobj['user'];
  if (typeof cobj['tid'] != "undefined")
    this.tid = cobj['tid'];
  if (typeof cobj['token'] != "undefined")
    this.token = cobj['token'];

  /* Optional transport credentials (default: user/token) */
  if (typeof cobj['gapiUser'] != "undefined")
    this.gapiUser = cobj['gapiUser'];
  else if (this.user != "undefined")
    this.gapiUser = this.user
  if (typeof cobj['gapiPwd'] != "undefined")
    this.gapiPwd = cobj['gapiPwd'];
  else if (this.token != "undefined")
    this.gapiPwd = this.token;

  if (typeof cobj['gwid'] != "undefined")
    this.gwid = cobj['gwid'];

  /* Transport channels */

  if (typeof cobj['useLegacyDescribe'] != "undefined")
    this.useLegacyDescribe = cobj['useLegacyDescribe'];

  return 1;
};



/*
 * Management, Accounts, Authentication, ...
 */
/* Create account */
appc.gapi.prototype.create = function(obj, success, error) {
  this._init();
  this.http.create(obj, success, error);
};

/* Login to account (and pass authentication information) */
appc.gapi.prototype.login = function(obj, success, error) {
  var self = this;
  this._init();
  this.http.login(obj, 
		  function(robj) {
		    var gwid;
		    var sobj = {
		      'user': obj['user'],
		      'tid' : robj['tid'],
		      'token' : robj['token']
		    };

		    self.loggedIn = 1;

		    if (robj['gwid']) {
		      if (robj['gwid'] instanceof Array)
			sobj['gwid'] = robj['gwid'][0];
		      else
			sobj['gwid'] = robj['gwid'];
		    }
		    self.config(sobj);

		    if (success)
		      success(robj);
		  },
		  function(robj) {
		    if (robj)
		      error(robj);
		  });
};

appc.gapi.prototype.logout = function(obj, success, error) {
  var self = this;

  if (!self.loggedIn) {
    if (error)
      error({});
    return;
  }

  this.http.logout(obj, 
		   function(robj) {
		     self.loggedIn = 0;

		     if (success)
		       success(robj);

		   }, error);
};

/* Authenticate with account token */
appc.gapi.prototype.auth = function(obj, success, error) {
  var self = this;
  this._init();
  this.http.auth(obj, 
		 function(robj) {
		   var sobj = {
		     'user': obj['user'],
		     'tid': robj['tid'],
		     'token': robj['token'],
		     'gwid': robj['gwid']
		   };

		   if (!robj['token']) {
		     if (error)
		       error({'result':appc.ERROR_AUTHENTICATION_ERROR});
		     return 0;
		   }

		   self.config(sobj);

		   if (success)
		     success(robj);
		 },
		 function(robj) {
		   if (error)
		     error(robj);
		 });
};

appc.gapi.prototype.isAuth = function() {
  return (this.user && this.token);
};

appc.gapi.prototype.clearAuth = function() {
  this.transport.clearAuth();
  this.tid = null;
  this.token = null;
};

/* Check if gateway is online (requires Authentication) */
appc.gapi.prototype.online = function(obj, success, error) {
  obj['c'] = 'connected';
  return this.http.gateway(obj, success, error);
};
appc.gapi.prototype.registered = function(obj, success, error) {
  obj['c'] = 'registered_this';
  return this.http.gateway(obj, success, error);
};
appc.gapi.prototype.existing = function(obj, success, error) {
  obj['c'] = 'registered_other';
  return this.http.gateway(obj, success, error);
};



/* 
 * Transport layer management functions
 */
/* Connect to transport server */
appc.gapi.prototype.open = function(obj, success, error) {
  var self = this;

  this._init();

  if (this.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  /* Set data transport by type */
  if (!this.transport) {
    if (!this.type)
      this.type = this.defaultType;

    if (this.type == 'http') {
      this.transport = this.http;
    } else if (this.type == 'ws') {
      this.transport = this.ws;
    } else {
      if (this.verbose)
	console.log('appc.gapi.open: ERROR: unknown data transport: ' + this.transport)
      return 0;
    }
  }
  if (this.verbose)
    console.log('appc.gapi.open: transport type: ' + this.type);

  /* Always open HTTP (for credentials, at least) */
  this.http.open(this, 
		 function(robj) {
		   /* If WSS, open WSS transport */
		   if (self.type != 'http') {
		     self.transport.open(self, success, error);
		   } else if (success) {
		     success(robj);
		   }

		 },
		 function(robj) {
		   if (error)
		     error(robj);
		 });
};

/* Transport opened (well-known callback function name) */
appc.gapi.prototype.opened = function(state) {
  this.connected = state;
  if (this.verbose)
    console.log('appc.gapi.open: opened');
};

/* Disconnect from transport server */
appc.gapi.prototype.close = function(obj, success, error) {
  var self = this;

  if (self.verbose)
    console.log('appc.gapi.close: closing');

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  var closed = function(robj) {
    /* Re-open must re-init connections to get clean state */
    self.inited = 0;
    self.connected = 0;
    self.ws = 0;
    self.transport = 0;
    self.clientCallbacks = new Object();
    self.eventCallbacks = new Object();

    if (success)
      success(robj);
  };

  var failed = function(robj) {
    if (error)
      error(robj);
  };

  this.transport.close(this, closed, failed);
};



/* 
 * Gateway Client API
 */

/* 
 * Scan for devices 
 *
 * N.B. only one call outstanding at a time
 *
 * Input object properties:
 *  active - 0 (passive) or 1 (active)
 *  period - N seconds
 */
appc.gapi.prototype.list = function(obj, success, error) {
  var self = this;

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if(self._isProcessing()) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  self._setProcessing(null, 1);

  if (typeof obj['active'] != "undefined") { 
    if (obj['active'] == 0) {
      delete obj['active'];
      obj['passive'] = 1;
    }
  } else if (typeof obj['passive'] != "undefined") {
    if (obj['passive'] == 0) {
      delete obj['passive'];
      obj['active'] = 1;
    }
  } else {
    obj['passive'] = 1;
  }
  if (typeof obj['period'] == "undefined") {
    if (error)
      error({'result':appc.ERROR_PARAMETER_MISSING});
    return 0;
  }

  return this.transport.list(obj,
			     function(robj) {
			       self._setProcessing(null, 0);
			       if (success)
				 success(robj);
			     },
			     function(robj) {
			       self._setProcessing(null, 0);
			       if (error)
				 error(robj);
			     });
};

/* 
 * Connect to device 
 *
 * Input object properties:
 *  did - device id (address)
 */
appc.gapi.prototype.connect = function(obj, success, error) {
  var self = this;
  obj = this.defaultArgs(obj, success, error);
  obj = this.defaultConnectArgs(obj);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (self._isProcessing(obj['node'])) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  self._setProcessing(obj['node'], 1);

  return this.transport.connect(obj, 
				function(robj) {
				  self._setProcessing(obj['node'], 0);
				  if (!robj || !robj['node']) {
				    if (self.verbose)
				      console.log('appc.gapi.connect: success FATAL ERROR: ' + JSON.stringify(robj));
				    if (error)
				      error(robj);
				    return;
				  }
				  if (!robj['result'] || 
				      (robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
				    if (self.verbose)
				      console.log('appc.gapi.connect: success ERROR: ' + robj['result']);
				    if (self.clientCallbacks[robj['node']]['error'])
				      self.clientCallbacks[robj['node']]['error'](robj);
				    return;
				  }

				  var node = robj['node'];
				  self.connectedId[node] = 1;
				  if (self.clientCallbacks[node]['success'])
				    self.clientCallbacks[node]['success'](robj);

				},
				function(robj) {
				  self._setProcessing(obj['node'], 0);
				  if (!robj || !robj['node']) {
				    if (self.verbose)
				      console.log('appc.gapi.connect: ERROR: ' + JSON.stringify(robj));
				    if (error)
				      error(robj);
				    return;
				  }
				  var node = robj['node'];
				  if (self.clientCallbacks[node]['error'])
				    self.clientCallbacks[node]['error'](robj);
				});
};

/* 
 * Disconnect from device 
 *
 * Input object properties:
 *  did - device id (device address) or ''/0/null (all devices)
 */
appc.gapi.prototype.disconnect = function(obj, success, error) {
  var self = this;
  obj = this.defaultArgs(obj, success, error);
    
  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  /* Check if all devices */
  if (!obj['node'] || obj['node'] === '*')
    obj['node'] = null;

  if ((obj['node'] && self._isProcessing(obj['node'])) ||
      (!obj['node'] && self._isProcessing())) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  obj['enable'] = 0;

  self._setProcessing(obj['node'], 1);

  /* Indicate disconnected regardless of result,
   * since if error, may have been disconnected internally
   */
  if (obj['node']) {
    self.connectedId[obj['node']] = 0;
  } else {
    for (var ii in self.connectedId) {
      self.connectedId[ii] = 0;
    }
  }

  return this.transport.disconnect(obj, 
				   function(robj) {
				     self._setProcessing(obj['node'], 0);
				     if (!robj) {
				       if (self.verbose)
					 console.log('appc.gapi.discconnect: success FATAL ERROR: ' + JSON.stringify(robj));
				       if (error)
					 error(robj);
				       return;
				     }
				     var node = robj['node'];
				     if (!robj['result'] ||
					 (robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
				       if (self.verbose)
					 console.log('appc.gapi.disconnect: success ERROR: ' + robj['result']);
				       if (node) {
					 if (self.clientCallbacks[node]['error'])
					   self.clientCallbacks[node]['error'](robj);
				       } else {
					 if (error)
					   error(robj);
				       }
				       return;
				     }

				     if (node) {
				       if (self.clientCallbacks[node]['success'])
					 self.clientCallbacks[node]['success'](robj);
				     } else {
				       if (success)
					 success(robj);
				     }

				   }, 
				   function(robj) {
				     self._setProcessing(obj['node'], 0);
				     if (!robj) {
				       if (self.verbose)
					 console.log('appc.gapi.disconnect: ERROR: ' + JSON.stringify(robj));
				       if (error)
					 error(robj);
				       return;
				     }
				     var node = robj['node'];
				     if (node) {
				       if (self.clientCallbacks[node]['error'])
					 self.clientCallbacks[node]['error'](robj);
				     } else {
				       if (error)
					 error(robj);
				     }
				   });
};

/* 
 * Show connected devices 
 *
 * Input object properties:
 *  did - device id (address) [optional]
 */
appc.gapi.prototype.show = function(obj, success, error) {
  var self = this;
  obj = this.defaultArgs(obj, success, error);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (obj['node'] == '*')
    obj['node'] = null;

  if (self._isProcessing(obj['node'])) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  obj['enable'] = 1;

  self._setProcessing(obj['node'], 1);

  return this.transport.show(obj, 
			     function(robj) {
			       self._setProcessing(obj['node'], 0);
			       if (!robj || robj['node']) {
				 if (error)
				   error(robj);
				 return;
			       }
			       if (success)
				 success(robj);
			     }, function(robj) {
			       self._setProcessing(obj['node'], 0);
			       if (error)
				 error(robj);
			     });
};

appc.gapi.prototype.services = function(obj, success, error) {
  var self = this;
  obj = self.defaultArgs(obj, success, error);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (self._isProcessing(obj['node'])) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  self._setProcessing(obj['node'], 1);
  return self.transport.services(obj, 
				    function(robj) {
				     self._setProcessing(obj['node'], 0);
				     if (!robj || !robj['node']) {
				       if (self.verbose)
					 console.log('appc.gapi.services: success FATAL ERROR: ' + JSON.stringify(robj));
				       return;
				     }
				     var node = robj['node'];
				     if (!robj['result'] ||
					 (robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
				       if (self.verbose)
					 console.log('appc.gapi.services: success ERROR: ' + JSON.stringify(robj));
				       if (self.clientCallbacks[node]['error'])
					 self.clientCallbacks[node]['error'](robj);
				       return;
				     }

				     if (self.clientCallbacks[node]['success'])
				       self.clientCallbacks[node]['success'](robj);
				    },
				    function(robj) {
				     self._setProcessing(obj['node'], 0);
				     if (!robj || !robj['node']) {
				       if (self.verbose)
					 console.log('appc.gapi.services: ERROR: ' + JSON.stringify(robj));
				       return;
				     }
				     var node = robj['node'];
				     if (self.clientCallbacks[node]['error'])
				       self.clientCallbacks[node]['error'](robj);
				    });
};

appc.gapi.prototype.characteristics = function(obj, success, error) {
  var self = this;
  var count = 0;
  obj = self.defaultArgs(obj, success, error);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (appc.VERSION > "0.81") {
    if (typeof obj['sh'] == "undefined" || obj['sh'] <= 0 ||
	typeof obj['eh'] == "undefined" || obj['eh'] <= 0 ||
	obj['eh'] < obj['sh']) {
      if (error)
	error({'result':appc.PARAMETERS_NOT_ACCEPTABLE});
      return 0;
    }

    if (typeof obj['uuid'] == "undefined" || !obj['uuid'])
      obj['uuid'] = '0328';
 
  } else {
    /* Check argument inconsistencies */
    count += (typeof obj['sh'] != "undefined") ? 1 : 0;
    count += (typeof obj['cuuid'] != "undefined") ? 1 : 0;
    count += (typeof obj['ch'] != "undefined") ? 1 : 0;
    if (count > 1) {
      if (error)
	error({'result':appc.PARAMETERS_NOT_ACCEPTABLE});
      return 0;
    }
  }

  if (self._isProcessing(obj['node'])) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  self._setProcessing(obj['node'], 1);
  return self.transport.characteristics(obj, 
				    function(robj) {
				     self._setProcessing(obj['node'], 0);
				     if (!robj || !robj['node']) {
				       if (self.verbose)
					 console.log('appc.gapi.characteristics: success FATAL ERROR: ' + JSON.stringify(robj));
				       return;
				     }
				     var node = robj['node'];
				     if (!robj['result'] ||
					 (robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
				       if (self.verbose)
					 console.log('appc.gapi.characteristics: success ERROR: ' + JSON.stringify(robj));
				       if (self.clientCallbacks[node]['error'])
					 self.clientCallbacks[node]['error'](robj);
				       return;
				     }

				     if (self.clientCallbacks[node]['success'])
				       self.clientCallbacks[node]['success'](robj);
				    },
				    function(robj) {
				     self._setProcessing(obj['node'], 0);
				     if (!robj || !robj['node']) {
				       if (self.verbose)
					 console.log('appc.gapi.characteristics: ERROR: ' + JSON.stringify(robj));
				       return;
				     }
				     var node = robj['node'];
				     if (self.clientCallbacks[node]['error'])
				       self.clientCallbacks[node]['error'](robj);
				    });
};

appc.gapi.prototype.descriptors = function(obj, success, error) {
  var self = this;
  var count = 0;
  obj = self.defaultArgs(obj, success, error);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (appc.VERSION > "0.81") {
    if (typeof obj['sh'] == "undefined" || obj['sh'] <= 0 ||
	typeof obj['eh'] == "undefined" || obj['eh'] <= 0 ||
	obj['eh'] < obj['sh']) {
      if (error)
	error({'result':appc.PARAMETERS_NOT_ACCEPTABLE});
      return 0;
    }

    if (typeof obj['uuid'] == "undefined" || !obj['uuid'])
      obj['uuid'] = '';

  } else {
    /* Check argument inconsistencies */
    count += (typeof obj['ch'] != "undefined") ? 1 : 0;
    count += (typeof obj['dh'] != "undefined") ? 1 : 0;
    if (count > 1) {
      if (error)
	error({'result':appc.PARAMETERS_NOT_ACCEPTABLE});
      return 0;
    }

    if (self._isProcessing(obj['node'])) {
      if (error)
	error({'result':appc.ERROR_CONFLICT});
      return 0;
    }

    if (!obj['ch'] && !obj['dh'])
      return -1;
  }

  self._setProcessing(obj['node'], 1);
  return self.transport.descriptors(obj, 
				    function(robj) {
				     self._setProcessing(obj['node'], 0);
				     if (!robj || !robj['node']) {
				       if (self.verbose)
					 console.log('appc.gapi.descriptors: success FATAL ERROR: ' + JSON.stringify(robj));
				       return;
				     }
				     var node = robj['node'];
				     if (!robj['result'] ||
					 (robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
				       if (self.verbose)
					 console.log('appc.gapi.descriptors: success ERROR: ' + JSON.stringify(robj));
				       if (self.clientCallbacks[node]['error'])
					 self.clientCallbacks[node]['error'](robj);
				       return;
				     }

				     if (self.clientCallbacks[node]['success'])
				       self.clientCallbacks[node]['success'](robj);
				    },
				    function(robj) {
				     self._setProcessing(obj['node'], 0);
				     if (!robj || !robj['node']) {
				       if (self.verbose)
					 console.log('appc.gapi.descriptors: ERROR: ' + JSON.stringify(robj));
				       return;
				     }
				     var node = robj['node'];
				     if (self.clientCallbacks[node]['error'])
				       self.clientCallbacks[node]['error'](robj);
				    });
};

/* 
 * Read device Characteristic or Descriptor
 */
appc.gapi.prototype.read = function(obj, success, error) {
  var self = this;
  obj = self.defaultArgs(obj, success, error);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (self._isProcessing(obj['node'])) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }
  self._setProcessing(obj['node'], 1);

  return this.transport.read(obj, 
			     function(robj) {
			       self._setProcessing(obj['node'], 0);
			       if (!robj || !robj['node']) {
				 if (self.verbose)
				   console.log('appc.gapi.read: success FATAL ERROR: ' + JSON.stringify(robj));
				 return;
			       }
			       if (!robj['result'] ||
				   (robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
				 if (self.verbose)
				   console.log('appc.gapi.read: success ERROR: ' + robj['result']);
				 if (self.clientCallbacks[robj['node']]['error'])
				   self.clientCallbacks[robj['node']]['error'](robj);
				 return;
			       }

			       if (self.clientCallbacks[robj['node']]['success'])
				 self.clientCallbacks[robj['node']]['success'](robj);

			     },
			     function(robj) {
			       self._setProcessing(obj['node'], 0);
			       if (!robj || !robj['node']) {
				 if (self.verbose)
				   console.log('appc.gapi.read: ERROR: ' + JSON.stringify(robj));
			       }
			       var node = robj['node'];
			       if (self.clientCallbacks[node]['error'])
				 self.clientCallbacks[node]['error'](robj);
			     });
};

/*
 * Write device Characteristic or Descriptor
 *
 * Input:
 *  did
 *  ch
 *  value
 */
appc.gapi.prototype.write = function(obj, success, error) {
  var self = this;
  obj = this.defaultArgs(obj, success, error);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (self.verbose)
    console.log('appc.gapi.write: ' + new Date().getTime() + ': ' + obj['node'] + ', ' + self._isProcessing(obj['node']));

  if (self._isProcessing(obj['node'])) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  self._setProcessing(obj['node'], 1);
  if (self.verbose)
    console.log('appc.gapi.write: ' + new Date().getTime() + ': ' + obj['node'] + ', set');

  return this.transport.write(obj, 
			      function(robj) {
				if (self.verbose)
				  console.log('appc.gapi.write: ' + new Date().getTime() + ': ' + obj['node'] + ', clear');
				self._setProcessing(obj['node'], 0);
				if (!robj || !robj['node']) {
				  if (self.verbose)
				    console.log('appc.gapi.write: success FATAL ERROR: ' + JSON.stringify(robj));
				  return;
				}
			       if (!robj['result'] ||
				   (robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
				 if (self.verbose)
				   console.log('appc.gapi.write: success ERROR: ' + robj['result']);
				 if (self.clientCallbacks[robj['node']]['error'])
				   self.clientCallbacks[robj['node']]['error'](robj);
				 return;
			       }

			       if (self.clientCallbacks[robj['node']]['success'])
				 self.clientCallbacks[robj['node']]['success'](robj);

			     },
			     function(robj) {
			       if (self.verbose)
				 console.log('appc.gapi.write: ' + new Date().getTime() + ': ' + obj['node'] + ', error clear');
			       self._setProcessing(obj['node'], 0);
			       if (!robj || !robj['node']) {
				 if (self.verbose)
				   console.log('appc.gapi.write: ERROR: ' + JSON.stringify(robj));
				 return;
			       }
			       var node = robj['node'];
			       if (self.clientCallbacks[node]['error'])
				 self.clientCallbacks[node]['error'](robj);
			     });
};
/*
 * Write device Characteristic or Descriptor with noresponse
 *
 * Input:
 *  did
 *  ch
 *  value
 */
appc.gapi.prototype.writenoresponse = function(obj, success, error) {
  var self = this;
  obj = this.defaultArgs(obj, success, error);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (this.verbose)
    console.log('appc.gapi.writenoresponse: ' + new Date().getTime() + ': ' + obj['node'] + ', ' + self._isProcessing(obj['node']));

  if (self._isProcessing(obj['node'])) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  self._setProcessing(obj['node'], 1);

  return this.transport.writenoresponse(obj,
					function(robj) {
					  if (this.verbose)
					    console.log('appc.gapi.writenoresponse: ' + new Date().getTime() + ': ' + obj['node'] + ', success/clear');
					  self._setProcessing(obj['node'], 0);
					  if (!robj || !robj['node']) {
					    if (self.verbose)
					      console.log('appc.gapi.writenoresponse: success FATAL ERROR: ' + JSON.stringify(robj));
					    return;
					  }

					  if (!robj['result'] ||
					      (robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
					    if (self.verbose)
					      console.log('appc.gapi.writenoresponse: success ERROR: ' + robj['result']);
					    if (self.clientCallbacks[robj['node']]['error'])
					      self.clientCallbacks[robj['node']]['error'](robj);
					    return;
					  }

					  if (self.clientCallbacks[robj['node']]['success'])
					    self.clientCallbacks[robj['node']]['success'](robj);

					},
					function(robj) {
					  if (this.verbose)
					    console.log('appc.gapi.writenoresponse: ' + new Date().getTime() + ': ' + obj['node'] + ', error/clear');
					  self._setProcessing(obj['node'], 0);
					  if (!robj || !robj['node']) {
					    if (self.verbose)
					      console.log('appc.gapi.writenoresponse: ERROR: ' + JSON.stringify(robj));
					    return;
					  }

					  var node = robj['node'];
					  if (self.clientCallbacks[node]['error'])
					    self.clientCallbacks[node]['error'](robj);
					});
};

/*
 * Subscribe to device Notification or Indication
 *
 * Input:
 *  did   : device id
 *  ch    : GATT characteristic handle
 *  notify: 1 (Notification), 0 (Indication)
 *
 */
appc.gapi.prototype.subscribe = function(obj, success, error) {
  var self = this;
  obj = this.defaultArgs(obj, success, error);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (self._isProcessing(obj['node'])) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  self._setProcessing(obj['node'], 1);

  return this.transport.subscribe(obj, 
				  function(robj) {
				    self._setProcessing(obj['node'], 0);
				    if (!robj || !robj['node']) {
				      if (self.verbose)
					console.log('appc.gapi.subscribe: success FATAL ERROR: ' + JSON.stringify(robj));
				      return;
				    }
				    if (!robj['result'] ||
					(robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
				      if (self.verbose)
					console.log('appc.gapi.subscribe: success ERROR: ' + JSON.stringify(robj));
				      if (self.clientCallbacks[robj['node']]['error'])
					self.clientCallbacks[robj['node']]['error'](robj);
				    return;
				    }

				    if (self.clientCallbacks[robj['node']]['success'])
				      self.clientCallbacks[robj['node']]['success'](robj);
				  },
				  function(robj) {
				    self._setProcessing(obj['node'], 0);
				    if (!robj || !robj['node']) {
				      if (self.verbose)
					console.log('appc.gapi.subscribe: ERROR: ' + JSON.stringify(robj));
				      return;
				    }
				    var node = robj['node'];
				    if (self.clientCallbacks[node]['error'])
				      self.clientCallbacks[node]['error'](robj);
				  });
};

/*
 * Unsubscribe from device Notification or Indication
 *
 * Input:
 *  did   : device id
 *  ch    : GATT characteristic
 *  notify: 1 (Notification), 0 (Indication)
 */
appc.gapi.prototype.unsubscribe = function(obj, success, error) {
  var self = this;
  obj = this.defaultArgs(obj, success, error);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (self._isProcessing(obj['node'])) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  self._setProcessing(obj['node'], 1);

  return this.transport.unsubscribe(obj, 
				    function(robj) {
				      self._setProcessing(obj['node'], 0);
				      if (!robj || !robj['node']) {
					if (self.verbose)
					  console.log('appc.gapi.unsubscribe: success FATAL ERROR: ' + JSON.stringify(robj));
					return;
				      }
				      if (!robj['result'] ||
					  (robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
					if (self.verbose)
					  console.log('appc.gapi.unsubscribe: success ERROR: ' + robj['result']);
					/* N.B. ignore soft unsubscribe errors as may be doing disconnect */
					//if (error)
					//error(robj);
					//return;
				      }

				      if (self.clientCallbacks[robj['node']]['success'])
					self.clientCallbacks[robj['node']]['success'](robj);
				    },
				    function(robj) {
				      self._setProcessing(obj['node'], 0);
				      if (!robj || !robj['node']) {
					if (self.verbose)
					  console.log('appc.gapi.unsubscribe: ERROR: ' + JSON.stringify(robj));
					return;
				      }
				      var node = robj['node'];
				      if (self.clientCallbacks[node]['error'])
					self.clientCallbacks[node]['error'](robj);
				    });
};

/*
 * DEPRECATED: will be removed
 *
 * Receive Notification or Indication
 *
 * Input:
 *  did   : device id
 *  ch    : GATT characteristic
 *  min_notify: (ignored)
 */
appc.gapi.prototype.notified = function(obj, success, error) {
  var self = this;
  obj = this.defaultNotifiedArgs(obj, success, error);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  return this.transport.notified(obj, 
				 function(robj) {
				   if (!robj || !robj['node']) {
				     if (self.verbose)
				       console.log('appc.gapi.notified: success FATAL ERROR: ' + JSON.stringify(robj));
				     return;
				   }
				   if (!robj['result'] ||
				       (robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
				     if (self.verbose)
				       console.log('appc.gapi.notified: success ERROR: ' + robj['result']);
				     return;
				   }
				   if (self.clientCallbacks[robj['node']]['notifiedSuccess'])
				     self.clientCallbacks[robj['node']]['notifiedSuccess'](robj);
				 },
				 function(robj) {
				   if (!robj || !robj['node']) {
				     if (self.verbose)
				       console.log('appc.gapi.notified: ERROR: ' + JSON.stringify(robj));
				     return;
				   }
				   var node = robj['node'];
				   if (self.clientCallbacks[node]['notifiedError'])
				     self.clientCallbacks[node]['notifiedError'](robj);
				 });
};


/* Reports */
appc.gapi.prototype.report = function(obj, success, error) {
  var self = this;

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (!obj['did'])
    return 0;

  this.transport.report(obj, success, error);
};

/* Events */
appc.gapi.prototype.event = function(obj, success, error) {
  var self = this;

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if (!obj['did'])
    return 0;

  this.transport.event(obj, success, error);
};

/* Security */
appc.gapi.prototype.pair = function(obj, success, error) {
  var self = this;
  var auth = 0, err = 0, op;
  var iobj;

  iobj = this.defaultArgs(obj, success, error);

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if(self._isProcessing()) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  if (appc.VERSION > "0.81") {
    /* Gather input parameters: op, iocap, oob, bonding/mitm/secure,
   * key_max, key_value, key_length, init, resp
   */
    op = (typeof obj['op'] == "undefined") ? 2 : obj['op'];
    iobj['op'] = op;
    if (op == 1) {
      iobj['iocap'] = (typeof obj['iocap'] == "undefined") ? 0x03: obj['iocap'];
      iobj['oob'] = (typeof obj['oob'] == "undefined") ? 0 : obj['oob'];
      if (obj['bonding'])
	auth |= appc.SM_BONDING;
      if (obj['mitm'])
	auth |= appc.SM_MITM;
      if (obj['secure'])
	auth |= appc.SM_SECURE;
      iobj['auth'] = auth;
      iobj['key_max'] = (typeof obj['key_max'] == "undefined") ? 16 : obj['key_max'];
      iobj['key_value'] = (typeof obj['key_value'] == "undefined") ? "" : obj['key_value'];
      iobj['key_length'] = iobj['key_value'].length;
      iobj['init'] = (typeof obj['init'] == "undefined") ? 0: obj['init'];
      iobj['resp'] = (typeof obj['resp'] == "undefined") ? 0: obj['resp'];
    }

    /* Validate input */
    if (op !== 0 && op !== 1 && op !==2 && op !== 3)
      err = 1;
    if (op == 1) {
      if (typeof iobj['iocap'] != "number" || iobj['iocap'] > 0x04)
	err = 1;
      if (typeof iobj['oob'] != "number")
	err = 1;
      if (typeof iobj['key_max'] != "number" || iobj['key_max'] > 16)
	err = 1;
      if (typeof iobj['key_value'] != "string" || iobj['key_value'].length > 16)
	err = 1;
      if (typeof iobj['key_length'] != "number" || iobj['key_length'] > 16)
	err = 1;
      if (typeof iobj['init'] != "number" || iobj['init'] > 7)
	err = 1;
      if (typeof iobj['resp'] != "number" || iobj['resp'] > 7)
	err = 1;
    }

    if (err && error) {
      error({'result':appc.ERROR_PARAMETER_VALUE_NOT_VALID});
      return;
    }

  } else {
    if (typeof obj['op'] == "undefined")
      obj['op'] = 2;
    if (typeof obj['bonding'] == "undefined")
      obj['bonding'] = 0;
    if (typeof obj['secure'] == "undefined")
      obj['secure'] = 0;
    if (typeof obj['mitm'] == "undefined")
      obj['mitm'] = 0;
    if (typeof obj['oob'] == "undefined")
      obj['oob'] = 0;
  }

  /* Remove 'node' parameter if list pairs */
  if (iobj['op'] == 2)
    delete iobj['node'];


  self._setProcessing(null, 1);
  return this.transport.pair(iobj,
			     function(robj) {
			       self._setProcessing(null, 0);
			       if (!robj) {
				 if (self.verbose)
				   console.log('appc.gapi.pair: success FATAL ERROR: ' + JSON.stringify(robj));
				 return;
			       }
			       if (!robj['result'] ||
				   (robj['result'] != appc.ERROR_SUCCESS && robj['result'] != appc.ERROR_CONNECTION_EXISTS)) {
				 if (self.verbose)
				   console.log('appc.gapi.pari: success ERROR: ' + robj['result']);
				 if (self.clientCallbacks[robj['node']]['error'])
				   self.clientCallbacks[robj['node']]['error'](robj);
				 return;
			       }
			       if (success)
				 success(robj);
			     },
			     function(robj) {
			       self._setProcessing(null, 0);
			       if (error)
				 error(robj);
			     });

};

/* Gateway configuration */
appc.gapi.prototype.configuration = function(obj, success, error) {
  var self = this;

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if(self._isProcessing()) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  self._setProcessing(null, 1);
  obj = this.defaultNotifiedArgs(obj, success, error);
  return this.transport.configuration(obj,
				      function(robj) {
					self._setProcessing(null, 0);
					if (!robj) {
					  if (self.verbose)
					    console.log('appc.gapi.configuration: success FATAL ERROR: ' + JSON.stringify(robj));
					  return;
					}
					if (success)
					  success(robj);
				      },
				      function(robj) {
					self._setProcessing(null, 0);
					if (error)
					  error(robj);
				      });
};

appc.gapi.prototype.version = function(obj, success, error) {
  this.transport.version(obj, success, error);
};

/* Testing / Debugging */
appc.gapi.prototype.echo = function(obj, success, error) {
  var self = this;

  if (!self.isAuth()) {
    if (error)
      error({'result':appc.ERROR_AUTHENTICATION_ERROR});
    return 0;
  }

  if (!self.transport) {
    if (error)
      error({'result':appc.ERROR_BAD_REQUEST});
    return 0;
  }

  if(self._isProcessing()) {
    if (error)
      error({'result':appc.ERROR_CONFLICT});
    return 0;
  }

  self._setProcessing(null, 1);
  obj = this.defaultNotifiedArgs(obj, success, error);
  return this.transport.echo(obj,
			     function(robj) {
			       self._setProcessing(null, 0);
			       if (!robj) {
				 if (self.verbose)
				   console.log('appc.gapi.echo: success FATAL ERROR: ' + JSON.stringify(robj));
				 return;
			       }
			       if (success)
				 success(robj);
			     },
			     function(robj) {
			       self._setProcessing(null, 0);
			       if (error)
				 error(robj);
			     });
};


					


/*
 * Utilities
 */

/* Initialization (called internally) */
appc.gapi.prototype._init = function() {
  if (this.inited)
    return 0;

  /* HTTP transport (login, auth) */
  if (!this.http) {
    this.http = new appc.gapi.http();

    /* Initialize (for login) */
    this.http.init(this);

    /* Local testing only: NoSSL */
    if (this.useSSL == 0)
      this.http.config({
	'port': this.httpPort,
	  'useSSL': 0});
  }

  /* WebSocket transport (login, auth) */
  if (!this.ws) {
    this.ws = new appc.gapi.ws();

    /* Initialize (for login) */
    this.ws.init(this);
  }
  this.inited = 1;
};

appc.gapi.prototype._isProcessing = function(node) {
  if (!node) {
    if (0 && this.verbose)
      console.log('_isProcessing: global: ' + this.globalProcessing);
    return this.globalProcessing;
  } else {
    if (0 && this.verbose)
      console.log('_isProcessing: node: ' + node + ', ' + this.connectionProcessing[node]);
    return this.connectionProcessing[node];
  }
};
appc.gapi.prototype._setProcessing = function(node, v) {
  if (!node) {
    if (this.verbose)
      console.log('_setProcessing: global: ' + v);
    this.globalProcessing = v;
  } else {
    if (this.verbose)
      console.log('_setProcessing: node: ' + node + ', ' + v);
    this.connectionProcessing[node] = v;
  }
};


/* Return object, setting certain default arguments */
appc.gapi.prototype.defaultArgs = function(obj, success, error) {
  var node;

  /* Authentication */
  if (!obj['token'])
    obj['token'] = this.token;

  /* Map caller device id name to API device id name ('node') */
  if (!obj['node']) {
    obj['node'] = obj['did'];
  }

  /* Device id and UUIDs are case-insensitive (force lower case) */
  if (obj['node'])
    obj['node'] = obj['node'].toLowerCase();
  if (obj['suuid']) {
    obj['suuid'] = obj['suuid'].toLowerCase();
    obj['suuid'] = obj['suuid'].replace(/\-/g, "");
  }
  if (obj['cuuid']) {
    obj['cuuid'] = obj['cuuid'].toLowerCase();
    obj['cuuid'] = obj['cuuid'].replace(/\-/g, "");
  }
  if (obj['uuid']) {
    obj['uuid'] = obj['uuid'].toLowerCase();
    obj['uuid'] = obj['uuid'].replace(/\-/g, "");
  }

  node = obj['node'];
  if (node) {
    if (typeof this.clientCallbacks[node] == "undefined") {
      this.clientCallbacks[node] = new Object();
    }
    this.clientCallbacks[node]['success'] = success;
    this.clientCallbacks[node]['error'] = error;
  }

  return obj;
};

appc.gapi.prototype.defaultConnectArgs = function(obj) {
  if (typeof obj['dtype'] == "undefined")
    obj['dtype'] = 0;
  if (typeof obj['interval_min'] == "undefined")
    obj['interval_min'] = 16;
  if (typeof obj['interval_max'] == "undefined")
    obj['interval_max'] = 160;
  if (typeof obj['latency'] == "undefined")
    obj['latency'] = 4;
  if (typeof obj['timeout'] == "undefined")
    obj['timeout'] = parseInt(((((1 + obj['latency']) * obj['interval_max'] * 1.25 * 3) + 9)/ 10) + 3);
  if (typeof obj['wait'] == "undefined")
    obj['wait'] = 15;
  return obj;
};

appc.gapi.prototype.defaultNotifiedArgs = function(obj, success, error) {
  var node;

  /* Authentication */
  if (!obj['token'])
    obj['token'] = this.token;

  /* Map caller device id name to API device id name ('node') */
  if (!obj['node'])
    obj['node'] = obj['did'];

  node = obj['node'];
  if (node) {
    if (typeof this.clientCallbacks[node] == "undefined") {
      this.clientCallbacks[node] = new Object();
    }
    this.clientCallbacks[node]['notifiedSuccess'] = success;
    this.clientCallbacks[node]['notifiedError'] = error;
  }

  return obj;
};

appc.gapi.prototype.getRESTIP = function() {
  var arr, ip;

  ip = this.getRESTQueryValue('ip');
  if (ip) {
    arr = ip.split(':');
    ip = arr[0];
  } else {
    ip = this.defaultHost;
  }
  return ip;
};

appc.gapi.prototype.getRESTPort = function() {
  var arr, ip, port;

  port = this.defaultPort;

  ip = this.getRESTQueryValue('ip');
  if (ip) {
    arr = ip.split(':');
    if (arr.length > 1)
      port = parseInt(arr[1]);
  }

  /* TEST: port 9001 is WS (not WSS) */
  if (port == 9001)
    this.useSSL = 0;

  return port;
};

appc.gapi.prototype.getRESTGWID = function() {
  return this.getRESTQueryValue('gwid');
};

appc.gapi.prototype.getRESTQueryValue = function(key) {
  var akv, astr, idx, ii, kv, str;

  if (typeof location == "undefined")
    return 0;

  idx = location.href.indexOf('?');
  if (idx > -1) {
    str = location.href.substr(idx + 1);
    idx = str.indexOf('#');
    if (idx > -1)
      str = str.substr(0, idx);
    astr = str.split('&');
    for (ii = 0; ii < astr.length; ii++) {
      kv = astr[ii];
      akv = kv.split('=');
      if (akv[0] == key && akv.length > 1)
	return akv[1];
    }
  }
  return '';
};

/* 
 * Netrunr API - HTTPS
 *
 * Copyright(C) 2017, Axiomware Systems Inc.. All Rights Reserved.
 */
appc.gapi.http = function() {
  this.parent = null;

  this.host = null;
  this.port = null;
  this.gwid = null;

  this.tid = null;
  this.token = null;

  this.client = null;

  this.connectOptions = {};

  this.verbose = 0;

  this.connected = 0;
  this.polling = 0;
  this.eventCallbacks = new Object();
  this.reportCallbacks = new Object();

  this.min_notify = 0;
  this.notifying = 0;
  this.notifySuccess = null;
  this.notifyError = null;
  this.outstanding = 0;

  this.nonAuthenticatable = 
    [
     '/c1/login',
     '/c1/create'
    ];

  this.requestCmd = new Array();
  this.requestNotify = new Array();
  this.requestEvent = new Array();
  this.requestReport = new Array();


  this.useSSL = 1;
};

/* Initialize (for login) */
appc.gapi.http.prototype.init = function(parent) {
  /* Base configuration */
  this.parent = parent;
  this.host = parent.host;
  if (parent.useSSL)
    this.port = parent.httpsPort;
  else
    this.port = parent.httpPort;

  this.verbose = parent.verbose;
};



/* 
 * Transport layer management functions
 */
appc.gapi.http.prototype.open = function(parent, success, error) {
  /* Parent may cache or store authentication credentials */
  this.gwid = parent.gwid;

  this.tid = parent.tid;
  this.token = parent.token;

  /* Feature configuration */

  /* Sub-channels */
  this.channelAdmin = parent.channelAdmin;
  this.channelDataIn = parent.channelDataIn;
  this.channelDataOut = parent.channelDataOut;
  this.channelReportIn = parent.channelReportIn;
  this.channelReportOut = parent.channelReportOut;
  this.channelEventIn = parent.channelEventIn;
  this.channelEventOut = parent.channelEventOut;

  if (success)
    success({});
};
appc.gapi.http.prototype.close = function(obj, success, error) {
  if (success)
    success({});
};
appc.gapi.http.prototype.parseResponse = function() {
};
appc.gapi.http.prototype.config = function(cobj) {
  if (!cobj)
    return 0;

  if (typeof cobj['port'] != "undefined")
    this.port = cobj['port'];
  if (typeof cobj['useSSL'] != "undefined")
    this.useSSL = cobj['useSSL'];
};



/*
 * Management, Accounts, Authentication, ...
 */

appc.gapi.http.prototype.create = function(obj, success, error) {
  return this.call('/c1/create', obj, success, error);
};
appc.gapi.http.prototype.login = function(obj, success, error) {
  var self = this;

  return this.call('/c1/login', obj, 
		   function(obj) {
		     self.tid = obj['tid'];
		     self.token = obj['token'];
		     if (!self.token) {
		       if (error)
			 error(obj);
		       return;
		     }
		     if (success)
		       success(obj);
		   }, error);
};

appc.gapi.http.prototype.logout = function(obj, success, error) {
  var self = this;

  obj['token'] = this.token;
  return this.call('/c1/logout', obj, 
		  function(robj) {
		    self.tid = null;
		    self.token = null;
		    if (success)
		      success(robj);
		  }, error);
};
appc.gapi.http.prototype.auth = function(obj, success, error) {
  var self = this;

  /* Check if validating user/pwd or user/token remotely */
  if (obj['user'] && (obj['pwd'] || obj['token'])) {
    return this.call('/c1/auth', obj,
		     function(robj) {
		       self.tid = robj['tid'];
		       self.token = robj['token'];
		       if (success)
			 success(robj);
		     }, error);
  }

  /* Check if validating token locally */
  if (this.token) {
    if (success) {
      success({'tid': this.tid, 'token': this.token, 'gwid': this.gwid});
    }
  } else {
    if (error)
      error({'result': 401, 'error': 'Not authenticated'});
  }
};
appc.gapi.http.prototype.clearAuth = function(obj, success, error) {
  this.tid = null;
  this.token = null
};

/* Gateway-related checks */
appc.gapi.http.prototype.gateway = function(obj, success, error) {
  this.call('/c1/gateway', obj,
	    function(robj) {
	      if (success)
		success(robj);
	    },
	    function(robj) {
	      if (error)
		error(robj);
	    });
};



/* 
 * Gateway Client API
 */
appc.gapi.http.prototype.list = function(obj, success, error) {
  var self = this;

  if (obj['active'])
    delete obj['passive'];
  else if (obj['passive'])
    delete obj['active'];

  return this.request('/c1/list', obj, 
		   success,
		   function(robj) {
		     if (robj && robj['result'] == 401)
		       self.clearAuth();
		     if (error)
		       error(robj);
		   }, error);
};

appc.gapi.http.prototype.connect = function(obj, success, error) {
  return this.request('/c1/connect', obj, success, error);
};

appc.gapi.http.prototype.disconnect = function(obj, success, error) {
  var self = this;
  self.notifying = 0;
  return this.request('/c1/disconnect', obj, success, error);
};

appc.gapi.http.prototype.show = function(obj, success, error) {
  return this.request('/c1/show', obj, success, error);
};

appc.gapi.http.prototype.services = function(obj, success, error) {
  return this.request('/c1/services', obj, success, error);
};

appc.gapi.http.prototype.characteristics = function(obj, success, error) {
  return this.request('/c1/characteristics', obj, success, error);
};

appc.gapi.http.prototype.descriptors = function(obj, success, error) {
  return this.request('/c1/descriptors', obj, success, error);
};

appc.gapi.http.prototype.read = function(obj, success, error) {
  return this.request('/c1/read', obj, success, error);
};

appc.gapi.http.prototype.write = function(obj, success, error) {
  return this.request('/c1/write', obj, success, error);
};

appc.gapi.http.prototype.writenoresponse = function(obj, success, error) {
  return this.request('/c1/writenoresponse', obj, success, error);
};

appc.gapi.http.prototype.subscribe = function(obj, success, error) {
  var self = this;

  return this.request('/c1/subscribe', obj, 
		   function(robj) {
		     if (robj && robj['result'] == 200) {
		       if (success)
			 success(robj);
		     } else {
		       if (error)
			 error(robj);
		     }
		   }, error);
};

appc.gapi.http.prototype.unsubscribe = function(obj, success, error) {

  this.notifying = 0;

  return this.request('/c1/unsubscribe', obj, success, error);
};

appc.gapi.http.prototype.notified = function(obj, success, error) {
  var self = this;

  if (obj['min_notify'])
    this.min_notify = obj['min_notify'];

  this.notifySuccessCb = success;
  this.notifyErrorCb = error;

  if (!self.notifying) {
    self.notifying = 1;
    self.notifier(obj, null, null);
  } else {
    if (self.verbose)
      console.log('appc.gapi.http.notified: already self-notifying...request ignored');
  }
};

/* Notify poller
 *  Callback when Notify received 
 */
appc.gapi.http.prototype.notifier = function(obj, success, error) {
  var self = this;
  this.request('/c1/notified', obj,
	    function(robj) {
	      if (self.notifySuccessCb) {
		self.notifySuccessCb(robj);

		if (self.notifying) {
		  setTimeout(function() {
		    self.notifier(obj, null, null);
		    /* TEST FOR MESSAGE LOSS */
		    //}, 2000);
		  }, 5000);
		}
	      }
	    },
	    function(robj) {
	      self.notifying = 0;
	      if (self.notifyErrorCb)
		self.notifyErrorCb(robj);
	    });
};


appc.gapi.http.prototype.report = function(obj, success, error) {
  var did = obj['did'];
  if (typeof this.reportCallbacks[did] == "undefined") {
    this.reportCallbacks[did] = new Object();
  }
  this.reportCallbacks[did]['success'] = success;
  this.reportCallbacks[did]['error'] = error;

  this.startPoller(obj, success, error);
};

appc.gapi.http.prototype.event = function(obj, success, error) {
  var did = obj['did'];
  if (typeof this.eventCallbacks[did] == "undefined") {
    this.eventCallbacks[did] = new Object();
  }
  this.eventCallbacks[did]['success'] = success;
  this.eventCallbacks[did]['error'] = error;

  this.startPoller(obj, success, error);
};

appc.gapi.http.prototype.startPoller = function(obj, success, error) {
  var self = this;
  if (!self.polling && (success || error)) {
    self.polling = 1;
    self.poller(obj, null, null);
  } else if (self.polling && !success && !error) {
    self.polling = 0;
  } else {
    if (self.verbose)
      console.log('appc.gapi.http.report: already polling...request ignored');
  }
};

/* Event/Report poller
 *  Callback when event/report received
 */
appc.gapi.http.prototype.poller = function(obj, success, error) {
  var self = this;
  this.request('/c1/event', obj,
	    function(robj) {
	      var event, node, ok, report;

	      if (!robj['result'] || 
		  (typeof robj['event'] == "undefined" &&
		   typeof robj['report'] == "undefined")) {
		if (self.eventCallbacks['*']) {
		  if (self.eventCallbacks['*'][error]) {
		    self.eventCallbacks['*'][error](robj);
		  }
		} else if (self.reportcallbacks['*']) {
		  if (self.reportCallbacks['*'][error]) {
		    self.reportCallbacks['*'][error](robj);
		  }
		}
		return;
	      }

	      ok = (robj['result'] == appc.ERROR_SUCCESS) ? true : false;
	      node = robj['node'];
	      event = robj['event'];
	      report = robj['report'];

	      if (node) {
		if (event) {
		  if (self.eventCallbacks[node]) {
		    if (ok && self.eventCallbacks[node]['success'])
		      self.eventCallbacks[node]['success'](robj);
		    else if (!ok && self.eventCallbacks[node]['error'])
		      self.eventCallbacks[node]['error'](robj);
		  }

		  /* Clear serialization on spurious disconnect; 
		   * transaction may have been interrupted and not complete
		   */
		  if (obj && obj['event'] == appc.EVENT_DISCONNECT) {
		    if (obj['node']) {
		      self.parent._setProcessing(obj['node'], 0);
		    }
		  }

		} else if (report) {
		  if (self.reportCallbacks[node]) {
		    if (ok && self.reportCallbacks[node]['success'])
		      self.reportCallbacks[node]['success'](robj);
		    else if (!ok && self.reportCallbacks[node]['error'])
		      self.reportCallbacks[node]['error'](robj);
		  }
		}
		
	      } else {
		if (event) {
		  if (self.eventCallbacks['*']) {
		    if (ok && self.eventCallbacks['*']['success'])
		      self.eventCallbacks['*']['success'](robj);
		    else if (!ok && self.eventCallbacks['*']['error'])
		      self.eventCallbacks['*']['error'](robj);
		  }
		} else if (report) {
		  if (self.reportCallbacks['*']) {
		    if (ok && self.reportCallbacks['*']['success'])
		      self.reportCallbacks['*']['success'](robj);
		    else if (!ok && self.reportCallbacks['*']['error'])
		      self.reportCallbacks['*']['error'](robj);
		  }
		}
	      }
		
	      if (self.polling) {
		setTimeout(function() {
		  self.poller(obj, null, null);
		  /* TBD: min/max settable by client? */
		}, 1000);
	      }

	    },
	    function(robj) {
	      self.polling = 0;
	      if (event) {
		if (self.eventCallbacks['*']) {
		  if (self.eventCallbacks['*'][error]) {
		    self.eventCallbacks['*'][error](robj);
		  }
		}
	      } else if (report) {
		if (self.reportCallbacks['*']) {
		  if (self.reportCallbacks['*'][error]) {
		    self.reportCallbacks['*'][error](robj);
		  }
		}
	      }
	    });
};


appc.gapi.http.prototype.pair = function(obj, success, error) {
  return this.request('/c1/pair', obj, 
		      function(robj) {
			if (robj && robj['result'] == 200) {
			  if (success)
			    success(robj);
			}
		      }, error);
};

appc.gapi.http.prototype.version = function(obj, success, error) {
  if (error)
    error({'result':appc.ERROR_REQUEST_NOT_FOUND});
  return 0;
};


/* 
 * HTTP request entry point: 
 * - enqueue request, according to type (Notify, non-Notify)
 * - invoke request dispatcher
 *
 * TBD: no longer needed if separate MQTT data/Notify channels 
 */
appc.gapi.http.prototype.request = function(cmd, obj, success, error) {
  var self = this;
  var key, requestDesc, requestObject, ret;

  if (!cmd) {
    if (self.verbose)
      console.log('appc.gapi.http.request: ERROR: missing cmd');
    return 0;
  }

  requestObject = new Object();
  for (key in obj) {
    if (obj.hasOwnProperty(key))
      requestObject[key] = obj[key];
  }

  requestDesc = {
    'cmd': cmd,
    'obj': requestObject,
    'success': success,
    'error': error
  };

  if (cmd.indexOf('event') != -1) {
    this.requestEvent.push(requestDesc);
  } else if (cmd.indexOf('report') != -1) {
    this.requestReport.push(requestDesc);
  } else if (cmd.indexOf('notified') != -1) {
    this.requestNotify.push(requestDesc);
  } else {
    this.requestCmd.push(requestDesc);
  }

  ret = this.requestDispatch();
  return ret;
};

/* HTTP request dispatcher */
appc.gapi.http.prototype.requestDispatch = function() {
  var self = this;
  var cmd, ret, requestDesc;

  if (this.outstanding)
    return 0;

  /* Check for oldest command request */
  if (this.requestCmd.length > 0) {
    requestDesc = this.requestCmd[this.requestCmd.length - 1];

  } else if (this.requestEvent.length > 0) {
    requestDesc = this.requestEvent[this.requestEvent.length - 1];

  } else if (this.requestReport.length > 0) {
    requestDesc = this.requestReport[this.requestReport.length - 1];

  /* Or, check for oldest notified request */
  } else if (this.requestNotify.length > 0) {
    requestDesc = this.requestNotify[this.requestNotify.length - 1];

  } else {
    if (self.verbose)
      console.log('appc.gapi.http.requestDispatch: no request queued');
    return 0;
  }

  cmd = requestDesc['cmd'];
  if (self.verbose)
    console.log('appc.gapi.http.requestDispatch: ' + cmd);
  this.outstanding = cmd;
  ret = this.call(cmd, 
		  requestDesc['obj'], 
		  function(robj) {
		    var nextRequestDesc, prevRequestDesc, success;

		    /* Process response to non-Event/non-Report request */
		    if (cmd.indexOf('notified') == -1 && 
			cmd.indexOf('event') == -1 &&
			cmd.indexOf('report') == -1) {
		      /* Response must be non-Notifications */
		      if (!robj['notifications']) {
			if (self.verbose)
			  console.log('appc.gapi.http.requestDispatch: cmd: ' + cmd + ' , response non-notified');
			prevRequestDesc = self.requestCmd.shift();
			success = prevRequestDesc ? prevRequestDesc['success'] : null;

		      } else {
			if (self.verbose)
			  console.log('appc.gapi.http.requestDispatch: ERROR: cmd: ' + cmd + ' but response notified');
			return;
		      }

		    /* Process response to Event request */
		    } else if (cmd.indexOf('event') != -1) {
		      if (self.verbose)
			console.log('appc.gapi.http.requestDispatch: cmd: ' + cmd + ', response event');

		      prevRequestDesc = self.requestEvent.shift();
		      success = prevRequestDesc ? prevRequestDesc['success'] : null;
		    /* Process response to Report request */
		    } else if (cmd.indexOf('report') != -1) {
		      if (self.verbose)
			console.log('appc.gapi.http.requestDispatch: cmd: ' + cmd + ', response report');

		      prevRequestDesc = self.requestReport.shift();
		      success = prevRequestDesc ? prevRequestDesc['success'] : null;
		    /* Process response to Notified request */
		    } else {
		      /* Response must be Notifications */
		      if (robj['notifications']) {
			if (self.verbose)
			  console.log('appc.gapi.http.requestDispatch: cmd: ' + cmd + ', response notified');
			prevRequestDesc = self.requestNotify.shift();
			success = prevRequestDesc ? prevRequestDesc['success'] : null;
		      } else {
			if (self.verbose)
			  console.log('appc.gapi.http.requestDispatch: ERROR: cmd: ' + cmd + ' but response non-notified');
			return;
		      }
		    }
		    if (!prevRequestDesc) {
		      if (self.verbose)
			console.log('appc.gapi.http.request: ERROR: response, but no outstanding request!');
		      return;
		    }

		    /* N.B. callback may make API request */
		    self.outstanding = 0;

		    /* Notify caller */
		    if (typeof success == "function") {
		      success(robj);
		    } else {
		      if (self.verbose)
			console.log('appc.gapi.http.request: NOTE: no success callback');
		    }

		    /* Dispatch next request, if any */
		    self.requestDispatch();

		  },
		  function(robj) {
		    var prevRequestDesc;
		    if (self.verbose)
		      console.log('appc.gapi.http.requestDispatch: ERROR: ' + JSON.stringify(robj));
		    if (cmd.indexOf('notified') == -1 &&
			cmd.indexOf('event') == -1 && 
			cmd.indexOf('report') == -1) {
		      if (self.requestNotify.length > 0) {
			prevRequestDesc = self.requestNotify.shift();
		      } else {
			if (self.verbose)
			  console.log('appc.gapi.happ.requestDispatch: ERROR: notified error but no notify request');
			return;
		      }

		    } else if (cmd.indexOf('event') != -1) {
		      if (self.requestEvent.length > 0) {
			prevRequestDesc = self.requestEvent.shift();
		      } else {
			if (self.verbose)
			  console.log('appc.gapi.happ.requestDispatch: ERROR: event error but no event request');
			return;
		      }

		    } else if (cmd.indexOf('report') != -1) {
		      if (self.requestReport.length > 0) {
			prevRequestDesc = self.requestReport.shift();
		      } else {
			if (self.verbose)
			  console.log('appc.gapi.happ.requestDispatch: ERROR: report error but no report request');
			return;
		      }

		    } else {
		      if (self.requestCmd.length > 0) {
			prevRequestDesc = self.requestCmd.shift();
		      } else {
			if (self.verbose)
			  console.log('appc.gapi.happ.requestDispatch: ERROR: non-notified error but no non-notified request');
			return;
		      }
		    }

		    if (typeof prevRequestDesc['error'] == 'function') {
		      prevRequestDesc['error'](robj);
		    }
		  });
  return ret;
};




appc.gapi.http.prototype.call = function(cmd, obj, success, error) {
  var self = this;
  var cobj, method, url, xhr;

  if (!obj)
    return 0;

  cobj = JSON.parse(JSON.stringify(obj));

  url = this.buildURL(cmd, cobj);
  method = 'POST';
  if (this.isNonAuthenticatable(cmd)) {
    ;
  } else {
    if (!cobj['tid'])
      cobj['tid'] = this.tid;
    if (!cobj['token'])
      cobj['token'] = this.token;
    if (!cobj['gwid'])
      cobj['gwid'] = this.gwid;

    /* Multi-channel support
     * Sniff/replace GWID for backward compatibility
     */
    if (cmd == '/c1/event')
      cobj['gwid'] += '/' + this.channelEventIn;
    else if (cmd == '/c1/report')
      cobj['gwid'] += '/' + this.channelReportIn;
    else if (cmd == '/c1/notified')
      cobj['gwid'] += '/' + this.channelReportIn;
    else
      cobj['gwid'] += '/' + this.channelDataIn;
  }

  /* HTTP request */
  /* Node.js */
  if (appc.nodejs) {
    xhr = this.nodeXHR(method, url, cobj, success, error);

  /* Browser */
  } else if (typeof jQuery != "undefined" && $ === jQuery) {
    xhr = this.jqXHR(method, url, cobj, success, error);

  } else {
    xhr = this.xhr(method, url, cobj, success, error);
  }

  return xhr;
};

/* Node.js XHR request */
appc.gapi.http.prototype.nodeXHR = function(method, url, obj, success, error) {
  var self = this;

  var querystring= require('querystring');
  var http = require('http');
  var https = require('https');
  var util = require('util');

  var options = {
    hostname: this.host,
    port: this.port,
    method: method,
    path: url,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  var postData = querystring.stringify(obj);
  if (self.verbose) {
    util.log('options: ' + querystring.stringify(options));
    util.log('postData: ' + postData);
  }
  var resData = '';

  var func;
  if (this.port == 80)
    func = http.request;
  else
    func = https.request;
  var sock = func(options, function(res) {
    if (self.verbose) {
      util.log('https.request: status:' + res.statusCode);
      util.log('https.request: headers:' + JSON.stringify(res.headers));
    }
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      if (self.verbose)
	util.log('body: ' + chunk);
      resData += chunk;
	
    });
    res.on('end', function(payload) {
      if (self.verbose)
	util.log('end reached: ' + payload);
      if (payload)
	resData += payload;
      if (success)
	success(resData ? JSON.parse(resData) : {});
    });
  });
  sock.write(postData);
  sock.end();

  sock.on('data', function(data) {
    if (self.verbose)
      util.log(': data: ' + data);
  });
  sock.on('error', function(e) {
    if (self.verbose)
      util.log(': error: ' + e);
  });
  sock.on('end', function() {
    if (self.verbose)
      util.log(': end');
  });

  sock.on('clientError', function(exception, tlsSocket) {
    if (self.verbose)
      util.log('clientError: ');
  });
  sock.on('newSession', function(sessionId, sessionData, 
				 iosNotificationCallback){});
  sock.on('secureConnection', function() {
    if (self.verbose)
      util.log('secureConnection: ');
  });

  return 0;
};

/* jQuery AJAX */
appc.gapi.http.prototype.jqXHR = function(method, url, obj, success, error) {
  var xhr;
  xhr = $.ajax({
    url : url,
      data: obj,
      method: method
      }).done(function(data, textStatus, jqXHR) {
	var robj = (typeof data == "string" && data) ? JSON.parse(data) : data;
	if (success)
	  success(robj);
	
      }).fail(function(jqXHR, textStatus, errorThrown) {
	if (error)
	  error({'result': 400, 'error':  textStatus + ', ' + errorThrown});
      });
};

/* XMLHttpRequest */
appc.gapi.http.prototype.xhr = function(method, url, obj, success, error) {
  var arr, ii, str, xhr;

  xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status != 200) {
      if (error)
	error({'result': 400, 'error': ''});
    }
  };
  xhr.onload = function() {
    var data = xhr.responseText;
    var robj = (typeof data == "string" && data) ? JSON.parse(data) : data;
    if (success)
      success(robj);
  };

  xhr.open(method, url, true);
  if (method == "POST") {
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  }

  if (typeof obj == "object") {
    arr = new Array();
    for (ii in obj) {
      str = ii + '=' + obj[ii];
      arr.push(str);
    }
    str = arr.join('&');
  }
  xhr.send(str);
  return xhr;
};


appc.gapi.http.prototype.buildURL = function(cmd, obj) {
  var url = 'http';

  if (this.useSSL)
    url += 's';
  url += '://' + this.host;
  if (this.port)
    url += ':' + this.port;
  url += cmd;

  return url;
};

appc.gapi.http.prototype.isNonAuthenticatable = function(cmd) {
  var arr = this.nonAuthenticatable;
  for (var ii = 0; ii < arr.length; ii++) {
    if (cmd == arr[ii])
      return true;
  }
  return false;
};

/*
 * Netrunr API - WebSockets
 *
 * Copyright(C) 2017, Axiomware Systems Inc.. All Rights Reserved.
 */
appc.gapi.ws = function() {
  this.parent = null;

  this.host = null;
  this.port = null;
  this.gwid = null;
  this.gapiUser = null;
  this.gapiPwd = null;

  this.client = null;
  this.clientId = null;
  this.clientIdBase = 'ws_';

  this.connectOptions = {};

  this.verbose = 0;
  this.trace = 1;

  this.connected = 0;
  /* Non-connection-directed message callbacks */
  this.success = null;
  this.error = null;
  /* Connection-directed message callbacks */
  this.clientCallbacks = new Object();
  /* Connection-directed message callbacks with intermediate processing */
  this.oneshotCallbacks = new Object();
  /* Report and event callbacks */
  this.reportCallbacks = new Object();
  this.eventCallbacks = new Object();

  /* Multi-channel (for channel-oriented transports) */
  this.channelAdmin = null;
  this.channelDataIn = null;
  this.channelDataOut = null;
  this.channelReportIn = null;
  this.channelReportOut = null;
  this.channelEventIn = null;
  this.channelEventOut = null;
};


appc.gapi.ws.prototype.init = function(parent) {
  /* Base configuration */
  this.parent = parent;
  this.host = parent.host;
  this.port = parent.port;

  this.verbose = parent.verbose;
};

/* Open Transport */
appc.gapi.ws.prototype.open = function(parent, success, error) {
  var self = this;
  
  if (self.connected) {
    if (self.verbose)
      console.log('appc.gapi.ws.open: connected');
    if (success)
      success(self);
    return 0;
  }

  self.gwid = parent.gwid;
  self.gapiUser = parent.gapiUser;
  self.gapiPwd = parent.gapiPwd;

  /* Sub-channels */
  this.clientId = self.clientIdBase + self.gwid;
  this.channelAdmin = parent.channelAdmin;
  this.channelDataIn = parent.channelDataIn;
  this.channelDataOut = parent.channelDataOut;
  this.channelReportIn = parent.channelReportIn;
  this.channelReportOut = parent.channelReportOut;
  this.channelEventIn = parent.channelEventIn;
  this.channelEventOut = parent.channelEventOut;

  if (self.verbose)
    console.log('appc.gapi.ws.open: host: ' + self.host + ', port: ' + self.port);

  if (appc.nodejs) {
    self._openNode(parent, success, error);
  } else {
    self._openBrowser(parent, success, error);
  }
  
};

/* Node.js */
appc.gapi.ws.prototype._openNode = function(parent, success, error) {
  var self = this;

  var mqtt = require('mqtt');
  var querystring= require('querystring');
  var util = require('util');
  var client, options, scheme, url;
  
  if (self.port == 9001)
    scheme = 'ws';
  else
    scheme = 'wss';

  url = scheme + '://' + self.host + ':' + self.port + '/mqtt';
  options = {
    clientId: self.clientId,
    username: self.gapiUser,
    password: self.gapiPwd,
    // N.B. need combined certificate, intermediate CAs, and root CA
    // in certificate file (e.g. 'certfile') on server. This client
    // does not seem to use a certificate chain file...
    //    rejectUnauthorized: false
    wsOptions: {
      perMessageDeflate: true
    }
  };
  if (self.verbose)
    util.log('_openNode: ' + querystring.stringify(options));
  client = mqtt.connect(url, options);
  self.client = client;
  if (self.verbose) {
    console.log('mqtt url:' + url);
    console.log('mqtt options:' + JSON.stringify(options));
  }


  client.on('connect', function(connack) {
    if (self.verbose)
      console.log('appc.gapi.ws._openNode:onconnect:' + JSON.stringify(connack));
    self.connected = 1;
    if (parent.opened)
      parent.opened(1);

    var subscribeOptions = {
    };
    /* Subscribe to Admin, GW data-out, and GW event channels */
    subscribeOptions.qos = 0;

    /* N.B. wait for Subscribe, so can immediately send requests */
    var nSubscribed = 0;
    var scb = function(err, granted) {
      if (++nSubscribed > 3) {
	/* Generic open (and subscribe) success */
	if (success)
	  success({});
      }
    };

    try {
      client.subscribe(self.gwid + '/' + self.channelAdmin, subscribeOptions, scb);
      client.subscribe(self.gwid + '/' + self.channelDataOut, subscribeOptions, scb);
      client.subscribe(self.gwid + '/' + self.channelReportOut, subscribeOptions, scb);
      client.subscribe(self.gwid + '/' + self.channelEventOut, subscribeOptions, scb);
    } catch(e) {
	if (self.verbose)
	  console.log('appc.gapi.ws._openNode: exception: ' + e.message);
    }

  });

  /* TBD: */

  client.on('message', function(topic, message, packet) {
    var str = message.toString();
    if (self.verbose)
      console.log('appc.gapi.ws._openNode:onmessage: ' + str);

    self._processMessage(str);

  });
  client.on('reconnect', function(data) {
    if (self.verbose)
      console.log('appc.gapi.ws._openNode:onreconnect:' + data);
  });
  client.on('close', function(data) {
    if (self.verbose)
      console.log('appc.gapi.ws._openNode:onclose: ' + data);
  });
  client.on('offline', function(data) {
    if (self.verbose)
      console.log('appc.gapi.ws._openNode:onoffline: ' + data);
  });
  client.on('error', function(data) {
    if (self.verbose)
      console.log('appc.gapi.ws._openNode:onerror:' + data);

    /* Generic open error */
    if (error)
      error(data);
  });
  client.on('packetreceive', function(packet) {
    if (self.verbose)
      console.log('appc.gapi.ws._openNode:onpacketreceive:', packet);
  });


};

/* Browser */
appc.gapi.ws.prototype._openBrowser = function(parent, success, error) {
  var self = this;
  var client = new Paho.MQTT.Client(self.host, Number(self.port), self.clientId);

  /* Setup generic callbacks */
  client.onConnectionLost = function(responseObject) {
    self.connected = 0;
    if (responseObject) {
      if (self.verbose)
	console.log("appc.gapi.ws._openBrowser.onConnectionLost:"+responseObject.errorMessage);
    }
    
    self.cleanup();

    if (error)
      error(responseObject.errorMessage);

    /* May be debugger; try to re-establish */
    //if (g_connectRetry-- > 0) {
    //client.connect(g_connectOptions);
    //}
  };

  client.onMessageArrived = function(message) {
    var str = message.payloadString;

    if (self.verbose)
      console.log("appc.gapi.ws.client.onMessageArrived:"+str);

    self._processMessage(str);
  };

  client.onMessageDelivered = function(message) {
    if (self.verbose)				
      console.log("appc.gapi.ws.client.onMessageDelivered:"+message.payloadString);
  };

  /* Setup connection options and callbacks */
  self.connectOptions = {
    userName: self.gapiUser,
    password: self.gapiPwd,

    onSuccess: function(responseObject) {
      self.connected = 1;
      if (self.verbose)
	console.log('appc.gapi.ws._openBrowser.onSuccess: isConnected: ' + self.client.isConnected());
      if (parent.opened)
	parent.opened(1);

      /* Setup channel subscription callbacks */
      var subscribeOptions = {
	onSuccess: function(responseObject) {
	  if (self.verbose)
	    console.log("onSubscribeSuccess:"+responseObject.errorMessage);
	},
	onFailure: function(responseObject) {
	  if (self.verbose)
	    console.log("onSubScribeFailure:"+responseObject.errorMessage);
	}
      };

      /* Subscribe to Admin, GW data-out, and GW event channels */
      subscribeOptions.qos = 0;
      try {
	client.subscribe(self.gwid + '/' + self.channelAdmin, subscribeOptions);
	client.subscribe(self.gwid + '/' + self.channelDataOut, subscribeOptions);
	client.subscribe(self.gwid + '/' + self.channelReportOut, subscribeOptions);
	client.subscribe(self.gwid + '/' + self.channelEventOut, subscribeOptions);

      } catch(e) {
	if (self.verbose)
	  console.log('appc.gapi.ws.open: exception: ' + e.message);
	if (error)
	  error(e.message);
      }

      /* Generic open success */
      if (success)
	success({});
    },

    onFailure: function(responseObject) {
      self.connected = 0;
      if (self.verbose) {
	console.log("appc.gapi.ws._openBrowser.onFailure:"+responseObject.errorMessage);
	console.log("Check username and password...retrying");
      }

      /* Generic open error */
      if (error)
	error(responseObject.errorMessage);
    }
  };

  // TEST: 20170816: Reduce Edge ping interval to prevent browser timeout
  if (navigator && (navigator.userAgent.indexOf('Edge') != -1))
    self.connectOptions.keepAliveInterval = 15;

  if (parent.useSSL)
    self.connectOptions.useSSL = true;

  self.client = client;
  if (self.client && self.verbose)
    console.log('appc.gapi.ws._openBrowser: isConnected: ' + self.client.isConnected());
  if (self.client && self.connected && self.client.isConnected()) {
    if (self.trace)
      self.client.stopTrace();
    self.client.disconnect();
  }

  if (!self.connected) {
    if (self.trace)
      self.client.startTrace();
    self.client.connect(self.connectOptions);
  }
};

appc.gapi.ws.prototype._processMessage = function(str) {
  var self = this;
  var event, node, obj, ok = true, report;

  if (self.verbose)
    console.log("appc.gapi.ws._processMessage:"+str);

  if (typeof tr_proc == "function") {
    //tr_proc(message.payloadString);
  } else {
    obj = self.parseResponse(str);

    /* Check for command echo */
    if (!obj['result'])
      return {};

    /* Check if success or error */
    ok = (obj['result'] == appc.ERROR_SUCCESS) ? true : false;
    node = obj['node'];

    /* Dispatch various message types */

    /* Report callback */
    if (typeof obj['report'] != "undefined") {

      if (node && self.reportCallbacks[node]) {
	if (ok && self.reportCallbacks[node]['success'])
	  self.reportCallbacks[node]['success'](obj);
	else if (!ok && self.reportCallbacks[node]['error'])
	  self.reportCallbacks[node]['error'](obj);

      } else if (self.reportCallbacks['*']) {
	if (ok && self.reportCallbacks['*']['success'])
	  self.reportCallbacks['*']['success'](obj);
	else if (!ok && self.reportCallbacks['*']['error'])
	  self.reportCallbacks['*']['error'](obj);
      }
      return 0;
    }

    /* Event callback */
    if (typeof obj['event'] != "undefined") {

      if (node && self.eventCallbacks[node]) {
	if (ok && self.eventCallbacks[node]['success'])
	  self.eventCallbacks[node]['success'](obj);
	else if (!ok && self.eventCallbacks[node]['error'])
	  self.eventCallbacks[node]['error'](obj);

      } else if (self.eventCallbacks['*']) {
	if (ok && self.eventCallbacks['*']['success'])
	  self.eventCallbacks['*']['success'](obj);
	else if (!ok && self.eventCallbacks['*']['error'])
	  self.eventCallbacks['*']['error'](obj);
      }

      /* Clear serialization on spurious disconnect; 
       * transaction may have been interrupted and not complete
       */
      if (obj && obj['event'] == appc.EVENT_DISCONNECT) {
	if (obj['node']) {
	  self.parent._setProcessing(obj['node'], 0);
	}
      }

      return 0;
    }

    /* Non-connection-directed message callback
     * N.B. callback only valid one-time; must be re-initialized 
     */
    node = obj['node'];
    if (!node) {
      if (ok && self.success) {
	var success = self.success;
	self.success = null;
	success(obj);
      } else if (!ok && self.error) {
	var error = self.error;
	self.error = null;
	error(obj);
      }
      return 0;
    }

    /* Connection-directed message callbacks */

    /* Intermediate (oneshot) connection-directed message callback */
    if (ok && self.oneshotCallbacks[node] &&
	self.oneshotCallbacks[node]['success']) {
      var cb = self.oneshotCallbacks[node]['success'];
      self.oneshotCallbacks[node] = null;
      cb(obj);

    } else if (!ok && self.oneshotCallbacks[node] &&
	self.oneshotCallbacks[node]['error']) {
      var cb = self.oneshotCallbacks[node]['error'];
      self.oneshotCallbacks[node] = null;
      cb(obj);

    /* Default: connection-directed message callback */
    } else if (ok && self.clientCallbacks[node] &&
	       self.clientCallbacks[node]['success']) {
      self.clientCallbacks[node]['success'](obj);

    } else if (!ok && self.clientCallbacks[node] &&
	       self.clientCallbacks[node]['error']) {
      self.clientCallbacks[node]['error'](obj);
    }
  }
};

/* Close transport 
 * - all connections multiplexed over transport will be lost
 */
appc.gapi.ws.prototype.close = function(parent, success, error) {
  var self = this;

  this.success = null;
  this.error = null;

  if (appc.nodejs) {
    self._closeNode(parent, success, error);
  } else {
    self._closeBrowser(parent, success, error);
  }
};

appc.gapi.ws.prototype._closeNode = function(parent, success, error) {
  this.cleanup();
  this.connected = 0;
  if (this.client.connected)
    this.client.end(false, success);
};

appc.gapi.ws.prototype._closeBrowser = function(parent, success, error) {
  var self = this;

  if (this.trace && this.client)
    this.client.stopTrace();

  /* Ignore most disconnect problems */
  try {
    this.client.disconnect();
  } catch(e) {
    if (self.verbose)
      console.log('appc.gapi.ws._closeBrowser: ' + e.message);
  }

  this.cleanup();
  if (success)
    success({});
};

/* Parse Transport response */
appc.gapi.ws.prototype.parseResponse = function(msg) {
  var self = this;
  var obj;

  if (!msg)
    return 0;

  /* Parse GAPI response */
  try {
    obj = JSON.parse(msg);
  } catch(e) {
    if (self.verbose)
      console.log('appc.gapi.transportParseResponse exception: ' + e.message);
    return {};
  }
  if (!obj)
    return {};

  return obj;
};




/*
 * GAPI
 */
/* Account related API: client generally uses http */
appc.gapi.ws.prototype.login = function() {
};
appc.gapi.ws.prototype.logout = function() {
};
appc.gapi.ws.prototype.auth = function() {
};
appc.gapi.ws.prototype.clearAuth = function() {
};



appc.gapi.ws.prototype.list = function(obj, success, error) {
  if (obj['active'])
    this.call(appc.GAPI_GAP_ACTIVE, obj, success, error);
  else
    this.call(appc.GAPI_GAP_PASSIVE, obj, success, error);
};

appc.gapi.ws.prototype.connect = function(obj, success, error) {
  obj = this.defaultArgs(obj, success, error);
  return this.call(appc.GAPI_GAP_CONNECT, obj, success, error);
};
appc.gapi.ws.prototype.disconnect = function(obj, success, error) {
  var self = this;
  obj = this.defaultArgs(obj, success, error);

  return this.call(appc.GAPI_GAP_ENABLE, obj, 
		   function(robj) {
		     self.cleanupConnection(robj);
		     if (success)
		       success(robj);
		   },
		   function(robj) {
		     self.cleanupConnection(robj);
		     if (error)
		       error(robj);
		   });
};
appc.gapi.ws.prototype.show = function(obj, success, error) {
  var self = this;

  obj = this.defaultArgs(obj, success, error);
  if (obj['node'])
    return this.call(appc.GAPI_GAP_NODE, obj, success, error);
  else
    return this.call(appc.GAPI_GAP_ISENABLED, obj, success, error);
};
appc.gapi.ws.prototype.services = function(obj, success, error) {
  obj = this.defaultArgs(obj, success, error);
  if (obj['suuid'] || obj['uuid']) {
    if (obj['suuid'])
      obj['uuid'] = obj['suuid'];
    delete obj['suuid'];
    obj['primary'] = 1;
    return this.call(appc.GAPI_GATT_SERVICES_PRIMARY_UUID, obj, success, error);

  } else {
    return this.call(appc.GAPI_GATT_SERVICES, obj, success, error);
  }
};

appc.gapi.ws.prototype.characteristics = function(obj, success, error) {
  obj = this.defaultArgs(obj, success, error);

  if (appc.VERSION > "0.81") {
    /* Discover Characteristics by UUID. UUID may be either:
     * - Attribute type of <<Characteristic>> (Discover all Characteristics)
     * - Characteristic UUID (match UUID)
     */
    return this.call(appc.GAPI_GATT_CHARS_UUID, obj, success, error);

  } else {
    if (obj['sh']) {
      /* TBD: service or sh? */
      obj['service'] = obj['sh'];
      delete obj['sh'];
      return this.call(appc.GAPI_GATT_SERVICE_CHARS, obj, success, error);
    } else if (obj['cuuid']) {
      /* TBD: uuid or cuuid? */
      obj['uuid'] = obj['cuuid'];
      delete obj['cuuid'];
      return this.call(appc.GAPI_GATT_CHARS_UUID, obj, success, error);
    } else if (obj['ch']) {
      return this.call(appc.GAPI_GATT_CHARS_CHAR, obj, success, error);
    } else
      return -1;
  }
};

appc.gapi.ws.prototype.descriptors = function(obj, success, error) {
  obj = this.defaultArgs(obj, success, error);
  if (appc.VERSION > "0.81") {
    if (obj['uuid'])
      return this.call(appc.GAPI_GATT_DESCS_DESC, obj, success, error);
    else
      return this.call(appc.GAPI_GATT_CHARS_CHAR_DESCS, obj, success, error);

  } else {
    if (obj['ch'])
      return this.call(appc.GAPI_GATT_CHARS_CHAR_DESCS, obj, success, error);
    else if (obj['dh'])
      return this.call(appc.GAPI_GATT_DESCS_DESC, obj, success, error);
    else
      return -1;
  }
};


appc.gapi.ws.prototype.read = function(obj, success, error) {
  obj = this.defaultArgs(obj, success, error);
  if (obj['ch']) {
    return this.call(appc.GAPI_GATT_CHARS_CHAR_READ, obj, success, error);
  } else if (obj['dh']) {
    return this.call(appc.GAPI_GATT_DESCS_DESC_READ, obj, success, error);
  } else {
    if (error)
      error({'result':appc.ERROR_PARAMETER_MISSING});
    return 0;
  }
};
appc.gapi.ws.prototype.write = function(obj, success, error) {
  obj = this.defaultArgs(obj, success, error);

  if (obj['value'] && obj['value'].length > 20) {
    obj['long'] = 1;
  }

  if (obj['ch']) {
    if (obj['value'] && obj['value'].length > 20) {
      return this.call(appc.GAPI_GATT_CHARS_CHAR_WRITE_LONG, obj, success, error);
    } else {
      return this.call(appc.GAPI_GATT_CHARS_CHAR_WRITE, obj, success, error);
    }
  } else if (obj['dh']) {
    if (obj['value'] && obj['value'].length > 20) {
      return this.call(appc.GAPI_GATT_DESCS_DESC_WRITE_LONG, obj, success, error);
    } else {
      return this.call(appc.GAPI_GATT_DESCS_DESC_WRITE, obj, success, error);
    }
  }
};
appc.gapi.ws.prototype.writenoresponse = function(obj, success, error) {
  obj = this.defaultArgs(obj, success, error);
  return this.call(appc.GAPI_GATT_CHARS_CHAR_WRITE_NORESPONSE, obj, success, error);
};

appc.gapi.ws.prototype.subscribe = function(obj, success, error) {
  var self = this;
  var cmd;

  obj = this.defaultArgs(obj, success, error);

  /* Subscribe to Notifications/Indications */
  var subscribeNotifyIndicate = function(node, ch, notify) {
    var scmd, sobj;

    sobj = {
      'node': node,
      'ch': ch,
      'event': 1
    };
    if (notify) {
      scmd = appc.GAPI_GATT_CHARS_CHAR_SUBSCRIBE_NOTIFY;
      sobj['notify'] = 1;
    } else {
      scmd = appc.GAPI_GATT_CHARS_CHAR_SUBSCRIBE_INDICATE;
      sobj['indicate'] = 1;
    }
    self.call(scmd, sobj, success, error);
  };



  if (!obj) {
    if (error)
      error('appc.gapi.subscribe: no parameters specified');
    return 0;
  }

  /* Enable Notifications/Indications */
  if (obj['notify'] == 1) {
    cmd = appc.GAPI_GATT_CHARS_CHAR_NOTIFY_ON;
  } else {
    cmd = appc.GAPI_GATT_CHARS_CHAR_INDICATE_ON;
    obj['indicate'] = 1;
  }
  self.call(cmd, obj, 
	    function(robj) {
	      if (!robj || !robj['result'] || robj['result'] != 200) {
		if (error)
		  error(robj);
		return;
	      }

	      subscribeNotifyIndicate(obj['node'], obj['ch'], obj['notify']);
	    }, 
	    function(robj) {
	      if (error)
		error(robj);
	    });
};

appc.gapi.ws.prototype.unsubscribe = function(obj, success, error) {
  var self = this;
  var cmd;
  var notify;

  obj = this.defaultArgs(obj, success, error);

  /* Unsubscribe to Notification/Indication events */
  var unsubscribeNotifyIndicate = function(node, ch, notify) {
    var scmd, sobj;

    /* TBD: is this used by GW? */
    sobj = {
      'node': obj['node'],
      'ch': obj['ch'],
      'event': 0               /* event off */
    };
    if (notify) {
      scmd = appc.GAPI_GATT_CHARS_CHAR_SUBSCRIBE_NOTIFY;
      sobj['notify'] = 1;
      delete sobj['indicate'];
    } else {
      scmd = appc.GAPI_GATT_CHARS_CHAR_SUBSCRIBE_INDICATE;
      sobj['indicate'] = 1;
      delete sobj['notify'];
    }

    self.call(scmd, sobj, success, error);
  };

  if (!obj) {
    if (error)
      error('appc.gapi.unsubscribe: no parameters specified');
    return 0;
  }

  /* Disable Notifications/Indications in device */
  if (obj['notify'] == 1) {
    notify = 1;
    cmd = appc.GAPI_GATT_CHARS_CHAR_NOTIFY_OFF;
    obj['notify'] = 0;
    delete obj['indicate'];
  } else {
    notify = 0;
    cmd = appc.GAPI_GATT_CHARS_CHAR_INDICATE_OFF;
    obj['indicate'] = 0;
    delete obj['notify'];
  }
  this.call(cmd, obj, 
	    function(robj) {
	      if (self.verbose)
		console.log('appc.gapi.ws.unsubscribe: done: ' + JSON.stringify(robj));
	      unsubscribeNotifyIndicate(obj['node'], obj['ch'], notify);
	    }, 
	    function(robj) {
	      if (error)
		error(robj);
	    });
};

appc.gapi.ws.prototype.notified = function(obj, success, error) {
  /* N.B. success/error called when Subscribed Notification/Indication 
   * event received
   *
   * TBD: handle multiple Characteristics (one callback per Characteristic)
   */
  obj = this.defaultNotifiedArgs(obj, success, error);
};


appc.gapi.ws.prototype.report = function(obj, success, error) {
  var did = obj['did'];
  if (typeof this.reportCallbacks[did] == "undefined") {
    this.reportCallbacks[did] = new Object();
  }
  this.reportCallbacks[did]['success'] = success;
  this.reportCallbacks[did]['error'] = error;
};

appc.gapi.ws.prototype.event = function(obj, success, error) {
  var did = obj['did'];
  if (typeof this.eventCallbacks[did] == "undefined") {
    this.eventCallbacks[did] = new Object();
  }
  this.eventCallbacks[did]['success'] = success;
  this.eventCallbacks[did]['error'] = error;
};

appc.gapi.ws.prototype.pair = function(obj, success, error) {
  this.call(appc.GAPI_PAIR, obj, success, error);
};

appc.gapi.ws.prototype.unpair = function(obj, success, error) {
  obj['enable'] = 0;

  this.call(appc.GAPI_PAIR, obj, success, error);
};

appc.gapi.ws.prototype.configuration = function(obj, success, error) {
  this.call(appc.GAPI_CONFIGURE, obj, success, error);
};

appc.gapi.ws.prototype.version = function(obj, success, error) {
  this.call(appc.GAPI_VERSION, obj, success, error);
};

appc.gapi.ws.prototype.echo = function(obj, success, error) {
  this.call(appc.GAPI_NO_COMMAND, obj, success, error);
};


appc.gapi.ws.prototype.call = function(cmd, obj, success, error) {
  var self = this;
  var node = obj ? obj['node'] : null;
  if (self.verbose)
    console.log('appc.gapi.ws.call: ' + cmd);
  if (!this.connected) {
    if (error) {
      error({
	'result': appc.ERROR_NO_CONNECTION, 
	  'value': 'appc.gapi.call: transport is not connected. Please login again.'});
      return 0;
    }
  }

  /* Check if callback override */
  if (node) {
    if (success || error) {
      self.oneshotCallbacks[node] = new Object();
      if (success)
	self.oneshotCallbacks[node]['success'] = success;
      if (error)
	self.oneshotCallbacks[node]['error'] = error;
    } else {
      if (typeof self.oneshotCallbacks[node] != "undefined") {
	if (self.verbose)
	  console.log('appc.gapi.ws.call: WARNING: oneshotCallbacks defined for: ' + node);
      }
    }

  /* Non-connection-oriented callbacks (one outstanding at a time, max) */
  } else {
    self.success = success;
    self.error = error;
  }

  /* Add command to arguments */
  obj['c'] = cmd;

  if (appc.nodejs) {
    self._sendMessageNode(obj);
  } else {
    self._sendMessageBrowser(obj);
  }
};

appc.gapi.ws.prototype._sendMessageNode = function(obj) {
  var self = this;
  var destinationName;
  var jstr = JSON.stringify(obj);
  var message = new Object();

  message.qos = 0;

  /* Topic: client specified or default */
  /* Multi-channel */
  if (obj['topic']) {
    destinationName = obj['topic'];
  } else {
    /* Default sub-channeL: data-to-gateway */
    destinationName = self.gwid + '/' + self.channelDataIn;
  }

  if (self.verbose) {
    console.log('destinationName: ' + destinationName);
    console.log('msg: ' + jstr);
  }
  try {
    self.client.publish(destinationName, jstr, message);
  } catch(e) {
    console.log('send exception: ' + e.message);
  }
};

appc.gapi.ws.prototype._sendMessageBrowser = function(obj) {
  var self = this;
  var jstr = JSON.stringify(obj);
  var message = new Paho.MQTT.Message(jstr);

  message.qos = 0;

  /* Topic: client specified or default */
  /* Multi-channel */
  if (obj['topic']) {
    message.destinationName = obj['topic'];
  } else {
    /* Default sub-channeL: data-to-gateway */
    message.destinationName = self.gwid + '/' + self.channelDataIn;
  }

  try {
    self.client.send(message); 
  } catch(e) {
    if (self.verbose)
      console.log('send exception: ' + e.message);
  }
};



appc.gapi.ws.prototype.cleanupConnection = function(obj) {
  if (!obj || !obj['node'])
    return 0;

  var node = obj['node'];
  if (this.clientCallbacks) {
    if (this.clientCallbacks[node])
      delete this.clientCallbacks[node];
  }
  if (this.oneshotCallbacks) {
    if (this.oneshotCallbacks[node])
      delete this.clientCallbacks[node];
  }
};
appc.gapi.ws.prototype.cleanup = function() {
  this.clientCallbacks = new Object();
  this.oneshotCallbacks = new Object();
};
appc.gapi.ws.prototype.defaultArgs = function(obj, success, error) {
  var node;

  node = obj['node'];
  if (node) {
    if (typeof this.clientCallbacks[node] == "undefined") {
      this.clientCallbacks[node] = new Object();
    }
    this.clientCallbacks[node]['success'] = success;
    this.clientCallbacks[node]['error'] = error;
  }

  return obj;
};

appc.gapi.ws.prototype.defaultNotifiedArgs = function(obj, success, error) {
  var node;

  node = obj['node'];
  if (node) {
    if (typeof this.clientCallbacks[node] == "undefined") {
      this.clientCallbacks[node] = new Object();
    }
    this.clientCallbacks[node]['notifiedSuccess'] = success;
    this.clientCallbacks[node]['notifiedError'] = error;
  }

  return obj;
};


/* Node.js API */
if (typeof module === 'object' && module && typeof module.exports === 'object') {
  module.exports.appc = appc;
  module.exports.gapi = appc.gapi;

} else {
  window.appc = appc;
}

//})(this);
