function Client(id) {
    this.id = id;
    this.counter = ko.observable();

    this._otCounter = new OTCounter(this.id, this.counter);

    this._peer = new Peer(this.id, {key: "wbs7r9wtos3v7vi"});
    this._peer.on("connection", this._otCounter.registerIncomingConnection.bind(this._otCounter));

};

Client.prototype.connect = function(ids) {
    var promises = [],
        that = this;

    _.forEach(ids, function(id) {
        var connection = that._peer.connect(id);
        var deferred = Q.defer();
        promises.push(deferred.promise);

        connection.on("open", function() {
            // Register connection only once it's ready to use.
            deferred.resolve();
            that._otCounter.registerOutgoingConnection(connection);
        });
    });

    return promises;
};

Client.prototype.performRandomOperation = function() {
    if (Math.floor(Math.random() * 2)) {
        this._otCounter.inc();
    } else {
        this._otCounter.dec();
    }
};
