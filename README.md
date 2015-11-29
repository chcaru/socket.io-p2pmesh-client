# socket.io-p2pmesh-client

socket.io-p2pmesh-client is the client component to socket.io-p2pmesh that allows a client to participate in a WebRTC peer-to-peer mesh. This enables clients to directly communicate among one another in large networks (mesh) without ever having to communicate to the server the data which is to be transferred among clients. This takes the burden off the server, which is common of large scale WebSocket applications. This component uses socket.io-client to act as the signaler in a WebRTC connection. The server must maintain a socket.io-p2pmesh!

## The Mesh Topology

The primary motivation for this was creating an efficient mesh topology that didn't overload any single client. Most existing WebRTC libraries that handle signaling allow fully connected topologies, which means that for each client in the network, it is connected to all the other clients. As you can imagine, the number of edges in a large  network grow too fast to be practical. To combat edge explosion, [Delaunay Triangulation] is used to compute an efficient network topology. On average, each client should have ~6 connections to other clients. This can be more or less for any individual client, but the average is a known property of [Delaunay Triangulation]. Below you can see how a mesh would evolve over time, with the addition and removal of clients. The blue lines represent a WebRTC connection between two clients:

![alt tag](http://i.giphy.com/xTk9ZD25IbIfVpjapO.gif)

Please see socket.io-p2pmesh for more information on customizing the mesh.

## Example

It is very easy to add a p2p mesh to your application:

```js
// Suppose socket.io is loaded globally
var p2pmesh = new P2PMesh();

p2pmesh.on('comment', function(comment) {
    console.log(comment);
});

// Suppose socket.io-p2pmesh is running on a localhost server, port 80
p2pmesh.connect('http://localhost');

p2pmesh.send('comment', 'hello mesh!');
```

That's it! When connected, the client is then a participant in the mesh, and can easily send and receive data!

## API Documentation
```
//TODO - Coming soon
```
### Version
#### 0.0.1
This project is still a work in progress, and is subject to change until a stable version is reached.

### License
MIT

[//]: #
[Delaunay Triangulation]: <https://en.wikipedia.org/wiki/Delaunay_triangulation>  
