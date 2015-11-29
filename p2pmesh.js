
function P2PMesh() {

    this.io = io;
    this.mesh = null;
    this.connections = {};
    this.dataCache = {};
    this.events = {};
    this.dataCacheKeepAlive = 60000;
}

P2PMesh.prototype.connect = function(host) {

    this.mesh = this.io.connect(host + '/mesh');

    var self = this;
    this.mesh.on('initConnection', function(connectionId, offerReply) {
        self._onInitConnection(connectionId, offerReply);
    });

    this.mesh.on('answerConnection', function(connectionId, offer, answerReply) {
        self._onAnswerConnection(connectionId, offer, answerReply);
    });

    this.mesh.on('finishConnection', function(connectionId, answer, successReply) {
        self._onFinishConnection(connectionId, answer, successReply);
    });

    this.mesh.on('disconnectFrom', function(connectionId) {
        self._onDisconnectFrom(connectionId);
    });
};

P2PMesh.prototype.send = function(eventName, data) {

    this._dispatchMessage(eventName, data);
};

P2PMesh.prototype.on = function(eventName, callback) {

    var callbacks = (this.events[eventName] = (this.events[eventName] || []));
    callbacks.push(callback);
};

P2PMesh.prototype._dispatchMessage = function(eventName, data) {

    data = this._serializeData(eventName, data);

    this.dataCache[data.id] = {
        connection: null,
        data: data,
        created: Date.now()
    };

    for (var connectionId in this.connections) {
        if (this.connections.hasOwnProperty(connectionId)) {
            this._dispatchData(data, this.connections[connectionId]);
        }
    }
};

P2PMesh.prototype._serializeData = function(eventName, data) {

    return {
        id: this._uuid(),
        e: eventName,
        d: data,
        c: Date.now()
    };
};

P2PMesh.prototype._deserializeData = function(data) {

    return data.d;
};

P2PMesh.prototype._dispatchData = function(data, connection) {

    if (connection.ready && connection.peer.writable) {
        connection.peer.send(data);
    }
};

P2PMesh.prototype._onInitConnection = function(connectionId, offerReply) {

    var connection = this._getConnection(connectionId);
    var peer = new SimplePeer({ initiator: true, trickle: false });
    connection.peer = peer;

    peer.on('signal', function(offer) {
        offerReply(offer);
    });
};

P2PMesh.prototype._onAnswerConnection = function(connectionId, offer, answerReply) {

    var connection = this._getConnection(connectionId);
    var peer = new SimplePeer({ trickle: false });
    connection.peer = peer;

    var self = this;
    peer.on('signal', function(answer) {
        answerReply(answer);
    });

    peer.on('connect', function() {
        connection.ready = true;
    });

    peer.on('data', function(data) {
        self._onData(connection, data);
    });

    peer.signal(offer);
};

P2PMesh.prototype._onFinishConnection = function(connectionId, answer, successReply) {

    var connection = this._getConnection(connectionId);
    var peer = connection.peer;

    var self = this;
    peer.on('connect', function() {
        connection.ready = true;
        successReply(true);
    });

    peer.on('data', function(data) {
        self._onData(connection, data);
    });

    peer.signal(answer);
};

P2PMesh.prototype._onDisconnectFrom = function(connectionId) {

    var connection = this._getConnection(connectionId);
    if (connection) {
        delete this.connections[connectionId];
        connection.peer.destroy();
    }
};

P2PMesh.prototype._onData = function(connection, data) {

    var isNew = this._relayData(connection, data);
    if (isNew) {
        var message = this._deserializeData(data);
        this._dispatchEvents(data.e, message);
    }
};

P2PMesh.prototype._relayData = function(connection, data) {

    var newData = !this.dataCache[data.id];
    if (newData) {

        this.dataCache[data.id] = {
            connection: connection,
            data: data,
            created: Date.now()
        };

        for (var connectionId in this.connections) {
            if (this.connections.hasOwnProperty(connectionId) && connectionId !== connection.id) {
                var connection = this.connections[connectionId];
                this._dispatchData(data, connection);
            }
        }
    }

    this._cleanDataCache();

    return newData;
};

P2PMesh.prototype._dispatchEvents = function(eventName, message) {

    var registeredEvents = this.events[eventName];

    if (registeredEvents) {
        for (var i in registeredEvents) {
            var callback = registeredEvents[i];
            callback(message);
        }
    }
};

P2PMesh.prototype._cleanDataCache = function() {

    var time = Date.now();

    for (var dataId in this.dataCache) {
        if (this.dataCache.hasOwnProperty(dataId)) {

            var dataEntry = this.dataCache[dataId];

            if (time - dataEntry.created > this.dataCacheKeepAlive) {
                delete this.dataCache[dataId];
            }
        }
    }
};

P2PMesh.prototype._getConnection = function(connectionId) {

    return this.connections[connectionId] = (this.connections[connectionId] || {
        id: connectionId
    });
};

P2PMesh.prototype._uuid = function() {

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};
