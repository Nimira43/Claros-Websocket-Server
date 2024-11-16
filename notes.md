## HTTP/1.1
###### Released: 1999

###### Key Features: 

It allows a browser to communicate with a server to request and send data. However, it can only handle one request at a time per connection, which can lead to delays (known as "head-of-line blocking").

###### Example: 
When you visit a website, your browser sends a request to the server, and the server responds with the webpage.

## HTTP/2
###### Released: 2015

###### Key Features: 
It addresses the limitations of HTTP/1.1 by allowing multiple requests to be sent over a single connection simultaneously. This reduces latency and improves performance, especially for websites with many resources (like images, scripts, etc.).

###### Example: 
When you visit a website, your browser can request multiple resources (like images, stylesheets, scripts) at the same time, making the page load faster.

## HTTP/3
###### Released: 2022

###### Key Features: 
It builds on HTTP/2 by using a new transport protocol called QUIC, which improves performance even further by reducing connection establishment time and providing better congestion control. It also handles packet loss more efficiently.

###### Example: 
When you visit a website, your browser can establish a connection faster and handle data more efficiently, leading to even faster load times and smoother performance.

###### In summary, each version of HTTP has improved upon the previous one by making web communication more efficient and faster. HTTP/3 is the latest and greatest, offering the best performance for modern web applications.

## WebSockets Overview
###### WebSocket Protocol: 
WebSockets provide a full-duplex communication channel over a single, long-lived connection. Unlike HTTP, which follows a request-response pattern, WebSockets allow for bi-directional communication, making it perfect for real-time applications like chat apps, live notifications, and streaming data.

###### Key Points to Remember:
Handshake: The initial handshake is crucial. It involves an HTTP upgrade request and a specific response to establish the WebSocket connection.

Binary Frames: WebSocket frames can be text or binary. You'll need to handle these appropriately based on your application's needs.

Real-time Communication: Once connected, you can send and receive messages using the socket object.

## Bitwise Parsing

###### Bitwise parsing involves analyzing and manipulating individual bits within a byte or group of bytes. It's a powerful technique used in various fields such as networking, cryptography, and low-level programming. Here’s a rundown on the basics:

###### What is Bitwise Parsing?
Bitwise Operations: These include operations like AND, OR, XOR, NOT, and bit shifts. They work directly on the binary representation of data.

Parsing: It’s about extracting meaningful information from data. Bitwise parsing means using bitwise operations to interpret the data at a binary level.

###### Key Bitwise Operations:
###### AND (&):

Used to extract specific bits from a byte.

Example: a & b results in a binary number where only the bits that are 1 in both a and b are 1.

###### OR (|):

Used to combine bits from multiple bytes.

Example: a | b results in a binary number where the bits are 1 if they are 1 in either a or b.

###### XOR (^):

Used to toggle bits.

Example: a ^ b results in a binary number where the bits are 1 if they are 1 in one but not both of a and b.

###### NOT (~):

Used to invert all the bits.

Example: ~a results in a binary number where all 0s are turned to 1s and vice versa.

###### Bit Shifts (<<, >>):

Used to shift bits left or right.

Example: a << 2 shifts all bits in a two positions to the left, filling the rightmost positions with zeros.