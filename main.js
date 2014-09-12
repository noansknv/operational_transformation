var clients = [],
    i,
    peer,
    n = 5, // # of clients
    ids = [];

// List of ids.
for (i = 0; i < n; ++i) {
    ids[i] = "id" + i;
}

// Create clients.
for (i = 0; i < n; ++i) {
    clients[i] = new Client(ids[i], peer)
}

// Connect each client with each client.
var promises = [];
for (i = 0; i < n; ++i) {
    promises.push(clients[i].connect(_.filter(ids, function(id) { return ("id" + i) !== id; })));
}

Q.all(_.flatten(promises)).then(function() {
    // Setup template.
    ko.applyBindings({
        clients: ko.observableArray(clients),
    });

    // Do shit.
    window.setInterval(function() {
        var id = Math.floor(Math.random() * n);
        clients[id].performRandomOperation();
    }, 100);
});
