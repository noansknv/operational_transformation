// State based PN-Counter. A strictly monotonic CRDT counter.
// A bit modified compare and merge.
function OTCounter(id, counter) {
    this.id = id;
    this.counter = counter;
    counter(0);

    this._state = {
        P: {},
        N: {}
    }

    this._state.P[this.id] = 0;
    this._state.N[this.id] = 0;

    this._connections = [];
}

OTCounter.prototype.registerOutgoingConnection = function(connection) {
    this._connections.push(connection);
}

OTCounter.prototype.registerIncomingConnection = function(connection) {
    connection.on("data", this._receiveStateHandler.bind(this));
}

OTCounter.prototype.inc = function(connection) {
    this._state.P[this.id] += 1;
    this._updateCounter();
    this._sendState(this._state);
}

OTCounter.prototype.dec = function(connection) {
    this._state.N[this.id] += 1;
    this._updateCounter();
    this._sendState(this._state);
}

OTCounter.prototype._updateCounter = function() {
    this.counter(OTCounter._query(this._state));
}

OTCounter.prototype._sendState = function(state) {
    _.forEach(this._connections, function(connection) {
        connection.send(state);
    });
}

OTCounter.prototype._receiveStateHandler = function(incomingState) {
    if (OTCounter._compare(this._state, incomingState)) {
        this._state = OTCounter._merge(this._state, incomingState);
        this._updateCounter();
    }
}

OTCounter._query = function(state) {
    var P = 0,
        N = 0;

    _.forOwn(state.P, function(val) {
        P += val;
    });

    _.forOwn(state.N, function(val) {
        N += val;
    });

    return P - N;
}

// If rhs has any property, that lhs doesn't, return true.
// If rhs doesn't have any of the lhs properies, ignore it.
// Merge is monotonic, thus we could actually always just merge,
// but leaving comparison for the sake of argument.
OTCounter._compare = function(lhs, rhs) {
    function compare(lhs, rhs) {
        var shouldMerge = true;

        for (var prop in lhs) {
            if (lhs.hasOwnProperty(prop) && rhs.hasOwnProperty(prop) && (lhs[prop] > rhs[prop])) {
                shouldMerge = false;
                break;
            }
        }

        for (var prop in rhs) {
            if (rhs.hasOwnProperty(prop) && !lhs.hasOwnProperty(prop)) {
                shouldMerge = true;
                break;
            }
        }

        return shouldMerge;
    };

    return compare(lhs.P, rhs.P) || compare(lhs.N, rhs.N);
}

// Monotonically merge states.
OTCounter._merge = function(lhs, rhs) {
    function merge(lhs, rhs) {
        var result = {};

        // Max all properties from lhs.
        _.forOwn(lhs, function(lhsVal, prop) {
            if (rhs.hasOwnProperty(prop)) {
                result[prop] = Math.max(lhsVal, rhs[prop]);
            } else {
                result[prop] = lhsVal;
            }
        });

        // Max all properties from rhs.
        _.forOwn(rhs, function(rhsVal, prop) {
            if (lhs.hasOwnProperty(prop)) {
                result[prop] = Math.max(rhsVal, lhs[prop]);
            } else {
                result[prop] = rhsVal;
            }
        });

        return result;
    };

    return {
        P: merge(lhs.P, rhs.P),
        N: merge(lhs.N, rhs.N)
    };
}
