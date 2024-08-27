//  MIT License
//
//  Copyright © 2020 Chikirev Sirguy, Unirail Group. All rights reserved.
//  For inquiries, please contact:  al8v5C6HU4UtqE9@gmail.com
//  GitHub Repository: https://github.com/AdHoc-Protocol
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, and to permit others to do so, under the following conditions:
//
//  1. The above copyright notice and this permission notice must be included in all
//     copies or substantial portions of the Software.
//
//  2. Users of the Software must provide a clear acknowledgment in their user
//     documentation or other materials that their solution includes or is based on
//     this Software. This acknowledgment should be prominent and easily visible,
//     and can be formatted as follows:
//     "This product includes software developed by Chikirev Sirguy and the Unirail Group
//     (https://github.com/AdHoc-Protocol)."
//
//  3. If you modify the Software and distribute it, you must include a prominent notice
//     stating that you have changed the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM,
//  OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.

import AdHoc from "./AdHoc";


export namespace Network {


    export class Loopback {
        protected readonly src_buffer: ArrayBuffer;
        protected readonly src_view: DataView;

        protected bytes_dst ?: AdHoc.BytesDst;

        constructor(buff_size: number, src: AdHoc.BytesSrc, dst ?: AdHoc.BytesDst) {
            this.src_view = new DataView(this.src_buffer = new ArrayBuffer(buff_size));
            src.subscribe_on_new_bytes_to_transmit_arrive((src: AdHoc.BytesSrc) => {
                for (let bytes = 0; 0 < (bytes = src.read(this.src_view, 0, this.src_buffer.byteLength));) this.bytes_dst?.write(this.src_view, 0, bytes);
            })
            this.bytes_dst = dst;
        }
    }

    export class Host<SRC extends AdHoc.BytesSrc, DST extends AdHoc.BytesDst> {
        OnEvent: (src: Host.Channel<SRC, DST>, event: number) => void = (channel, event) => {
            switch (event) {
                case Host.Channel.Event.EXT_INT_CONNECT:
                    console.log(channel.host + ":Received connection from " + channel.peer);
                    return;
                case Host.Channel.Event.INT_EXT_CONNECT:
                    console.log(channel.host + ":Connected to " + channel.peer);
                    return;
                case Host.Channel.Event.EXT_INT_DISCONNECT:
                    console.log(channel.host + ":Remote peer " + channel.peer + " has dropped the connection.");
                    return;
                case Host.Channel.Event.INT_EXT_DISCONNECT:

                    console.log(channel.host + ":This host has dropped the connection to " + channel.peer);
                    return;
                case Host.Channel.Event.TIMEOUT:
                    console.log(channel.host + ":Timeout while receiving from " + channel.peer);
                    return;
                default:
                    console.log(channel.host + ": from" + channel.peer + " event: " + event);
            }
        }
        onFailure: (src: Host.Channel<SRC, DST>, err: Error) => void = (src, err) => console.log("onFailure " + src + "\n" + err);

        readonly channels: Host.Channel<SRC, DST>;
        new_channel: (host: Host<SRC, DST>) => Host.Channel<SRC, DST>;

        buff_size: number;
        readonly name: string

        constructor(name: string, new_channel: (host: Host<SRC, DST>) => Host.Channel<SRC, DST>, buff_size: number) {
            this.name = name;
            this.new_channel = new_channel;
            this.buff_size = buff_size;
            this.channels = new_channel(this);

            Host.prototype.toString = () => this.name;
        }


        allocate(): Host.Channel<SRC, DST> {
            let ch = this.channels;
            for (; ch.is_active(); ch = ch.next)
                if (!ch.next) return ch.next = this.new_channel(this)

            ch.transmit_time = Date.now();
            return ch;
        }

    }

    export namespace Host {
        export const FREE = -1;

        export class Channel<SRC extends AdHoc.BytesSrc, DST extends AdHoc.BytesDst> {

//#region > Channel code
//#endregion > Network.Host.Channel

            host: Host<SRC, DST>;
            peer: string;

            is_active() { return 0 < this.receive_time; }

            constructor(host: Host<SRC, DST>) { this.host = host; }

            close() {
                this.transmit_lock = 1;
                this.host.OnEvent(this, Channel.Event.INT_EXT_DISCONNECT);
            }

            public on_disposed: (ch: Channel<SRC, DST>) => void;

            dispose() {
                if (this.receive_time == FREE) //trying to dispose disposed
                {
                    console.log(new Error("trying to dispose disposed").toString());
                    return;
                }
                close();
                if (this.transmitter != undefined) this.transmitter.close();
                if (this.receiver != undefined) this.receiver.close();
                this.receive_time = -1;
                if (this.on_disposed) this.on_disposed(this)
            }

//#region Receiver
            receive_time: number = FREE

            public receiver: DST;

            receive(src: ArrayBuffer) {
                this.receive_time = Date.now();
                this.receiver.write(new DataView(src), 0, src.byteLength);
            }

//#endregion


//#region Transmitter
            transmit_time: number = FREE;

            public transmitter: SRC;
            protected readonly transmit_buffer: ArrayBuffer;
            protected readonly transmit_view: DataView;

            public on_connected: ((ch: Channel<SRC, DST>) => void) | undefined

            public transmitter_connected(): void {
                this.transmit_time = Date.now()
                this.host.OnEvent(this, Network.Host.Channel.Event.INT_EXT_CONNECT);
                
                if (this.on_connected) this.on_connected(this)
                
                this.transmit_lock = 0;
                this.transmitter.subscribe_on_new_bytes_to_transmit_arrive(this.on_new_bytes_to_transmit_arrive)
            }

            transmit_lock: number

            public on_new_bytes_to_transmit_arrive(): void { //Callback function called when new bytes in the source are available for transmission
                if (this.transmit_lock++ == 1) this.transmit_(); }

            transmit_(): void {

                for (let bytes = 0; (bytes = this.transmitter.read(this.transmit_view, 0, this.transmit_view.byteLength)); this.transmit_time = Date.now())
                    this.transmit(
                        bytes != this.transmit_view.byteLength ?
                        this.transmit_buffer.slice(0, bytes) :
                        this.transmit_buffer
                    );
            }

            transmit: (src: ArrayBuffer) => void;

//#endregion
            next: Channel<SRC, DST> | undefined = undefined;
        }

        export namespace Channel {
            export enum Event {
                EXT_INT_CONNECT = 0,
                INT_EXT_CONNECT = 1,
                EXT_INT_DISCONNECT = 2,
                INT_EXT_DISCONNECT = 3,
                TIMEOUT = 4,
            }
        }
    }

    export class WebSocketClient<SRC extends AdHoc.BytesSrc, DST extends AdHoc.BytesDst> extends Host<SRC, DST> {

//#region > WebSocket Client code
//#endregion > Network.Host.WebSocketClient

        public ext ?: WebSocket;

        private connected = false;

        //'ws://localhost:4321'
        connect(server: string, onConnected: (src: SRC) => void, onConnectingFailure: (Error) => void): void {
            this.channels.peer = server
            this.connected = false;

            try {
                (this.ext = new WebSocket(server)).binaryType = "arraybuffer"; //https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/binaryType
            } catch (e) {
                console.log()
            }

            this.ext!.onopen = () => {
                this.channels.transmitter_connected()
                onConnected(this.channels.transmitter)
            }

            this.ext!.onclose = () => this.channels.close();
            this.ext!.onerror = (event) => {
                if (this.connected) {
                    this.channels.close();
                    this.connected = false;
                    this.onFailure(this.channels, new Error(event + ":" + event.type))
                } else onConnectingFailure(new Error("The server is not reachable"))
            }
            this.ext!.onmessage = (event) =>
                this.channels.receive(event.data);
            this.channels.transmit = (src) => this.ext?.send(src);
        }
    }


    export class WebRTCClient<SRC extends AdHoc.BytesSrc, DST extends AdHoc.BytesDst> extends Host<SRC, DST> {

        connect(server_url: string): SRC {
            const ch = <WebRTCClient.Channel<SRC, DST>>this.allocate();
            ch.open(new WebRTCClient.WebSocketSignaling('ws://localhost:4321'));
            ch.transmitter.subscribe_on_new_bytes_to_transmit_arrive(ch.on_new_bytes_to_transmit_arrive)
            return ch.transmitter;
        }
    }

    export namespace WebRTCClient {

        export interface Signaling {
            onmessage: ((event: MessageEvent) => any) | undefined;

            send(data: string): void;
        }

        export class WebSocketSignaling implements Signaling {
            ws: WebSocket;

            constructor(signaling_url: string) {
                this.ws = new WebSocket(signaling_url)
                this.ws.onmessage = event => this.onmessage!(event);
            }

            onmessage: ((event: MessageEvent) => any) | undefined;

            send(data: string): void {
                this.ws.send(data);
            }
        }


        export class Channel<SRC extends AdHoc.BytesSrc, DST extends AdHoc.BytesDst> extends Host.Channel<SRC, DST> {

            signal: Signaling;
            rtc: RTCPeerConnection;
            data: RTCDataChannel

            //'ws://localhost:4321'
            open(signal: Signaling) {
                this.signal = signal;
                signal.onmessage = this.onsignal;

                this.rtc = new RTCPeerConnection();
                const ch = this.rtc.createDataChannel('AdHoc')

                ch.binaryType = "arraybuffer";
                ch.onopen = () => this.transmit_()
                ch.onclose = () => this.close();
                ch.onerror = () => this.close();
                ch.onmessage = (event: MessageEvent) => this.receive(event.data);

                // Listen for remote ICE candidates and add them to the peer connection
                this.rtc.onicecandidate = (event) => {
                    if (event.candidate) {
                        this.signal.send(JSON.stringify({
                            type: 'iceCandidate',
                            data: event.candidate,
                        }));
                    }
                };

                // Create an offer and set it as the local description
                this.rtc.createOffer()
                    .then((offer) => {
                        return this.rtc.setLocalDescription(offer);
                    })
                    .then(() => {
                        // Send the offer to the remote peer
                        // Send the description over a signaling channel (e.g. WebSockets)
                        this.signal.send(JSON.stringify(this.rtc.localDescription!));
                    });

            }


            // Set up event listeners for the signaling channel (e.g. WebSockets)
            onsignal(event: MessageEvent) {
                const message = JSON.parse(event.data);
                switch (message.type) {
                    case 'sessionDescription': // Receive a session description from the remote peer and set it as the remote description
                        this.rtc.setRemoteDescription(message.data)
                            .then(() => {
                                if (message.data.type === 'offer') {
                                    // Create an answer and set it as the local description
                                    this.rtc.createAnswer()
                                        .then((answer) => {
                                            return this.rtc.setLocalDescription(answer);
                                        })
                                        .then(() => {
                                            // Send the answer to the remote peer
                                            // Send the description over a signaling channel (e.g. WebSockets)
                                            this.signal.send(JSON.stringify(this.rtc.localDescription!));
                                        });
                                }
                            });
                        break;
                    case 'iceCandidate':
                        this.rtc.addIceCandidate(message.data);
                        break;
                    default:
                        console.error(`Invalid message type: ${message.type}`);
                        break;
                }
            }

            transmit = (src: ArrayBuffer) => this.data.send(src);
        }
    }
}

export default Network;