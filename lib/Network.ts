// Copyright 2025 Chikirev Sirguy, Unirail Group
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// For inquiries, please contact: al8v5C6HU4UtqE9@gmail.com
// GitHub Repository: https://github.com/AdHoc-Protocol

/**
 * @module Network
 * Provides classes for implementing various network communication channels.
 *
 * This module includes:
 * - A local {@link Loopback} channel for in-memory testing.
 * - A generic {@link Host} manager for pooling and managing multiple connections.
 * - Concrete implementations for {@link WebSocketClient} and {@link WebRTCClient}.
 *
 * All channels are designed to integrate with AdHoc data sources (`AdHoc.BytesSrc`)
 * and destinations (`AdHoc.BytesDst`), forming a complete communication pipeline.
 */
import AdHoc from "./AdHoc";

export namespace org.unirail.Network {
    /**
     * @class Loopback
     * Implements an in-memory loopback data channel, ideal for testing and local communication.
     *
     * Data written to the source endpoint is immediately routed back to the destination endpoint.
     * It serves as a minimal and direct implementation of the {@link AdHoc.Channel.External} interface.
     */
    export class Loopback implements AdHoc.Channel.External {
        protected readonly src_view: DataView;
        private _internal!: AdHoc.Channel.Internal;

        /**
         * Creates an instance of the Loopback channel.
         * @param buff_size The size of the internal buffer used to shuttle data from source to destination.
         */
        constructor(buff_size: number) {
            this.src_view = new DataView(new ArrayBuffer(buff_size));
        }

        /** Closes the channel. This is a no-op for the Loopback channel. */
        close(): void {}

        /** Aborts the channel. This is a no-op for the Loopback channel. */
        abort(): void {}

        /** Closes and disposes of the channel. This is a no-op for the Loopback channel. */
        closeAndDispose(): void {}

        /** Timeout for receiving data. Not applicable to Loopback; this is a no-op. */
        set receiveTimeout(timout: number) {}

        /**
         * Timeout for receiving data. Not applicable to Loopback; always returns 0.
         * @returns {number} 0
         */
        get receiveTimeout(): number {
            return 0;
        }

        /**
         * Timeout for transmitting data. Not applicable to Loopback; always returns 0.
         * @returns {number} 0
         */
        get transmitTimeout(): number {
            return 0;
        }

        /** Timeout for transmitting data. Not applicable to Loopback; this is a no-op. */
        set transmitTimeout(timeout: number) {}

        get Internal(): AdHoc.Channel.Internal {
            return this._internal;
        }

        /**
         * Connects the channel to its internal AdHoc data endpoints.
         *
         * This method establishes the core loopback mechanism by subscribing to the
         * `BytesSrc` and immediately writing any transmitted data back to the `BytesDst`.
         * @param value The internal data source and sink.
         */
        set Internal(value: AdHoc.Channel.Internal) {
            this._internal = value;
            // Subscribe to the source to receive new bytes notification and write them to the destination.
            value.BytesSrc?.subscribe_on_new_bytes_to_transmit_arrive((source: AdHoc.BytesSrc) => {
                let bytesRead: number;
                while ((bytesRead = source.read(this.src_view, 0, this.src_view.buffer.byteLength)) > 0) this._internal.BytesDst?.write(this.src_view, 0, bytesRead);
            });
        }
    }

    /**
     * @class Host
     * Manages a collection of communication channels, acting as a factory and pool.
     *
     * It provides a base class for network host implementations that need to handle
     * multiple concurrent connections (e.g., a WebRTC server). Channels are managed
     * as a linked list, allowing for efficient allocation and reuse of channel objects.
     */
    export class Host {
        /**
         * A callback invoked when a channel encounters a failure.
         * @param source The object that originated the failure.
         * @param error The error that occurred.
         */
        readonly onFailure: (source: any, error: Error) => void;

        /**
         * The head of the linked list of channels managed by this host.
         */
        readonly channels: Host.ExternalChannel;

        /**
         * A factory function that creates new, protocol-specific channel instances for this host.
         */
        new_channel: (host: Host) => Host.ExternalChannel;

        /**
         * The default buffer size (in bytes) for data transmission in channels created by this host.
         */
        buff_size: number;

        /**
         * The name of this host, used for logging and identification.
         */
        readonly name: string;

        /**
         * Constructs a new Host instance.
         * @param name A unique identifier for this host (e.g., "WebRTC_Host").
         * @param new_channel A factory function to create new, protocol-specific {@link Host.ExternalChannel} instances.
         * @param onFailure Callback for handling errors.
         * @param buff_size The default size for the channel's internal data buffers.
         */
        constructor(name: string, new_channel: (host: Host) => Host.ExternalChannel, onFailure: (source: any, error: Error) => void, buff_size: number) {
            this.name = name;
            this.new_channel = new_channel;
            this.buff_size = buff_size;
            this.channels = new_channel(this); // Initialize the first channel in the list.
            this.onFailure = onFailure;
        }

        /**
         * Returns the name of the host.
         * @returns {string} The host's name.
         */
        toString = (): string => this.name;

        /**
         * Allocates a communication channel from the pool.
         *
         * It first attempts to find and reuse an inactive channel. If all existing
         * channels are active, it creates a new one and appends it to the list.
         * @returns {Host.ExternalChannel} An available communication channel.
         */
        allocate(): Host.ExternalChannel {
            let lastChannel: Host.ExternalChannel = this.channels;
            // Find the last channel in the list.
            while (lastChannel.next) {
                lastChannel = lastChannel.next;
            }

            let channelToUse: Host.ExternalChannel | undefined = this.channels;
            // Iterate through channels to find a free one to reuse.
            while (channelToUse) {
                if (!channelToUse.is_active()) {
                    channelToUse.transmit_time = Date.now(); // Mark as active.
                    return channelToUse; // Reuse existing inactive channel.
                }
                if (!channelToUse.next) {
                    // If no free channel is found, create a new one at the end of the list.
                    return (lastChannel.next = this.new_channel(this));
                }
                channelToUse = channelToUse.next;
            }
            // This code is unreachable because the loop above always returns a channel.
            throw new Error("Unreachable code in Host.allocate");
        }
    }

    export namespace Host {
        export const onFailurePrintConsole: (source: any, error: Error) => void = (source, error) => {
            console.log(new Error("onFailure handler called from:").stack);
            console.log(error.stack);
        };
        /**
         * Represents a free or inactive channel state, indicated by a negative timestamp.
         * @constant {number}
         */
        export const FREE = -1;

        /**
         * @class ExternalChannel
         * An abstract base class for a single communication channel managed by a {@link Host}.
         *
         * It handles connection state, data buffers, and the core transmission logic.
         * Subclasses must provide a protocol-specific `transmit` implementation.
         */
        export class ExternalChannel implements AdHoc.Channel.External {
            /** The {@link Host} instance that manages this channel. */
            host: Host;

            /** An identifier for the remote peer, such as a URL or IP address. */
            peer = "";

            /**
             * Checks if the channel is currently active (i.e., not disposed).
             * @returns {boolean} True if the channel is active, false otherwise.
             */
            is_active(): boolean {
                return this.receive_time > FREE;
            }

            private _internal!: AdHoc.Channel.Internal;

            get Internal(): AdHoc.Channel.Internal {
                return this._internal;
            }

            set Internal(value: AdHoc.Channel.Internal) {
                this._internal = value;
                // Subscribe to be notified when the application has new data to send.
                value.BytesSrc?.subscribe_on_new_bytes_to_transmit_arrive(this.on_new_bytes_to_transmit_arrive);
            }

            /**
             * @param host The {@link Host} instance that manages this channel.
             */
            constructor(host: Host) {
                this.host = host;
                this.transmit_buffer = new ArrayBuffer(host.buff_size);
                this.transmit_view = new DataView(this.transmit_buffer);
            }

            /** Closes the channel and disposes of its resources. See {@link dispose}. */
            closeAndDispose(): void {
                this.dispose();
            }

            /**
             * Initiates a graceful shutdown of the channel.
             *
             * This prevents further transmissions and triggers a disconnect event.
             * Actual resource cleanup occurs in {@link dispose}.
             */
            close(): void {
                this.transmit_lock = 1; // Prevent further transmissions.
                this._internal?.OnExternalEvent(this, Network.Host.ExternalChannel.Event.THIS_CLOSE_GRACEFUL);
            }

            /** Aborts the connection immediately. Subclasses should override if specific logic is needed. */
            abort(): void {}

            /** An optional callback executed when the channel is disposed. */
            public on_disposed?: ((ch: ExternalChannel) => void) | undefined;

            /**
             * Disposes of the channel's resources, including its internal data endpoints.
             *
             * It marks the channel as inactive (`FREE`) so it can be reused by the host.
             * This method is idempotent.
             */
            dispose(): void {
                if (!this.is_active()) {
                    console.warn(new Error("Attempting to dispose an already disposed channel.").toString());
                    return;
                }
                this.close();
                this._internal?.BytesSrc?.close();
                this._internal?.BytesDst?.close();
                this.receive_time = FREE; // Mark as disposed/inactive.
                if (this.on_disposed) {
                    this.on_disposed(this);
                    this.on_disposed = undefined;
                }
            }

            isClosingGracefully: boolean = false;
//#region Receiving
            _receiveTimeout: number = 0;
            /**
             * The timeout in milliseconds for receiving data. If no data is received within this period,
             * the connection may be considered stale. A negative value indicates a request to close graceful.
             */
            get receiveTimeout(): number {
                return this.isClosingGracefully ? -this._receiveTimeout : this._receiveTimeout;
            }

            set receiveTimeout(value: number) {
                this._receiveTimeout = Math.abs(value);
                if (value < 0) {
                    this.isClosingGracefully = true;
                    this.close();
                }
            }

            /** Timestamp of the last received data packet (in milliseconds since epoch). */
            receive_time: number = FREE;

            /**
             * Handles incoming data by writing it to the internal `BytesDst`.
             * Also updates the `receive_time` to mark the channel as active.
             * @param src The buffer containing the received data.
             */
            receive(src: ArrayBuffer): void {
                this.receive_time = Date.now();
                this._internal?.BytesDst?.write(new DataView(src), 0, src.byteLength);
            }
//#endregion
//#region Transmitting
            _transmitTimeout: number = 0;
            /**
             * The timeout in milliseconds for transmitting data. A negative value indicates
             * that the channel should close graceful after the current transmission completes.
             */
            get transmitTimeout(): number {
                return this.isClosingGracefully ? -this._transmitTimeout : this._transmitTimeout;
            }

            set transmitTimeout(value: number) {
                this._transmitTimeout = Math.abs(value);
                this.isClosingGracefully = value < 0;
            }

            /** Timestamp of the last data transmission (in milliseconds since epoch). */
            transmit_time: number = FREE;

            protected readonly transmit_buffer: ArrayBuffer;
            protected readonly transmit_view: DataView;

            /**
             * A lifecycle method called by subclasses when the connection is established and ready for transmission.
             * It unlocks the transmitter and notifies the system of the connection event.
             */
            public transmitter_connected(): void {
                this.transmit_time = Date.now();
                this._internal?.OnExternalEvent(this, Network.Host.ExternalChannel.Event.THIS_CONNECT);

                this.transmit_lock = 0; // Allow transmissions.
                // Re-subscribe in case this is a reused channel.
                this._internal?.BytesSrc?.subscribe_on_new_bytes_to_transmit_arrive(this.on_new_bytes_to_transmit_arrive.bind(this));
            }

            /** A lock to prevent concurrent `transmit_` calls, ensuring sequential data transmission. */
            protected transmit_lock = 1;

            /**
             * Callback triggered when new bytes are available in the internal `BytesSrc`.
             * It initiates the transmission process if it's not already running.
             */
            public on_new_bytes_to_transmit_arrive = (): void => {
                // If not already transmitting, acquire lock and start the transmit loop.
                if (this.transmit_lock === 0) {
                    this.transmit_lock = 1;
                    this.transmit_();
                }
                // If already transmitting, the current transmit_() loop will process the new bytes.
            };

            /**
             * The internal transmission loop. Reads all available data from `BytesSrc`
             * in chunks and sends each chunk via the `transmit` method until the source is empty.
             */
            protected transmit_(): void {
                if (!this._internal?.BytesSrc) {
                    this.transmit_lock = 0;
                    return;
                }
                let bytesRead: number;
                while ((bytesRead = this._internal.BytesSrc.read(this.transmit_view, 0, this.transmit_view.byteLength)) > 0) {
                    this.transmit_time = Date.now();
                    // Slice the buffer to send only the valid data, avoiding sending empty padding.
                    const dataToTransmit = bytesRead !== this.transmit_view.byteLength ? this.transmit_buffer.slice(0, bytesRead) : this.transmit_buffer;
                    this.transmit(dataToTransmit);
                }
                this.transmit_lock = 0; // Release lock after all data is sent.
            }

            /**
             * Abstract method to transmit data over the network.
             *
             * **Subclasses must implement this method** to handle the protocol-specific sending mechanism
             * (e.g., `WebSocket.send`, `RTCDataChannel.send`).
             * @param src The data to transmit.
             */
            transmit!: (src: ArrayBuffer) => void;
//#endregion

            /** Pointer to the next channel in the host's linked list. */
            next: ExternalChannel | undefined = undefined;
        }

        export namespace ExternalChannel {
            /**
             * Defines bitmasks used as building blocks to compose event types. Each mask represents
             * an independent property of an event.
             */
            export namespace Mask {
                // --- Source Flags (Bit 31) ---
                /** Flag indicating the event was initiated by this endpoint (the local host). This is the default (zero). */
                export const THIS = 0;
                /** Flag indicating the event was initiated by the remote peer. */
                export const REMOTE = 1 << 31;

                // --- Manner Flags (Bits 30-29) ---
                /** Flag indicating the operation was performed graceful (e.g., a clean TCP FIN/ACK or WebSocket close handshake). */
                export const GRACEFUL = 1 << 30;
                /** Flag indicating the operation was abrupt (e.g., a TCP RST, a hard close, or an unhandled exception). */
                export const ABRUPTLY = 1 << 29;

                // --- I/O Direction Flags (Bits 28-27) ---
                /** Flag indicating the event is related to a transmit (send) operation. Primarily used for timeouts. */
                export const TRANSMIT = 1 << 28;
                /** Flag indicating the event is related to a receive (read) operation. Primarily used for timeouts. */
                export const RECEIVE = 1 << 27;

                // --- Protocol/Context Flags (Bit 26) ---
                /** Flag indicating the event is specific to the WebSocket protocol layer. */
                export const WEBSOCKET = 1 << 26;

                // --- Group & Action Masks ---
                /** A mask to isolate the source of an event (`THIS` or `REMOTE`). */
                export const SOURCE_MASK = REMOTE;
                /** A mask to isolate the manner of an event (e.g., `GRACEFUL` or `ABRUPT`). */
                export const MANNER_MASK = GRACEFUL | ABRUPTLY;
                /** A mask to isolate the I/O direction of an event (e.g., `TRANSMIT` or `RECEIVE`). */
                export const IO_DIRECTION_MASK = TRANSMIT | RECEIVE;
                /** A mask to isolate all property flags (the upper 16 bits). */
                export const FLAGS = 0xffff0000;
                /** A mask to isolate the base action of an event (the lower 16 bits). */
                export const ACTION = 0x0000ffff;

                // --- Helper Functions ---

                /** Checks if the event was initiated by the remote peer. */
                export function isRemote(event: number): boolean {
                    return (event & REMOTE) === REMOTE;
                }

                /** Checks if the event was initiated by this host. */
                export function isThis(event: number): boolean {
                    return (event & REMOTE) === 0;
                }

                /** Checks if the event was a graceful operation. */
                export function isGraceful(event: number): boolean {
                    return (event & GRACEFUL) === GRACEFUL;
                }

                /** Checks if the event was an abrupt operation. */
                export function isAbrupt(event: number): boolean {
                    return (event & ABRUPTLY) === ABRUPTLY;
                }

                /** Checks if the event is WebSocket-specific. */
                export function isWebSocket(event: number): boolean {
                    return (event & WEBSOCKET) === WEBSOCKET;
                }
            }

            /**
             * Defines the base "actions" of an event, occupying the lower 16 bits of the event code.
             */
            export namespace Action {
                /** Base action for a connection being established. Use `Mask.ACTION` to extract this from an event. */
                export const CONNECT = 1;
                /** Base action for a connection being terminated. */
                export const CLOSE = 2;
                /** Base action for a timeout occurring during an I/O operation. */
                export const TIMEOUT = 3;
                /** Base action for a WebSocket PING control frame. */
                export const PING = 4;
                /** Base action for a WebSocket PONG control frame. */
                export const PONG = 5;
                /** Base action for an empty WebSocket data frame. */
                export const EMPTY_FRAME = 6;

                /**
                 * Checks if the given event represents any type of CONNECT action.
                 * @param event The event code to check.
                 * @returns `true` if the base action is CONNECT, `false` otherwise.
                 */
                export function isConnect(event: number): boolean {
                    return (event & Mask.ACTION) === CONNECT;
                }

                /**
                 * Checks if the given event represents any type of CLOSE action.
                 * @param event The event code to check.
                 * @returns `true` if the base action is CLOSE, `false` otherwise.
                 */
                export function isClose(event: number): boolean {
                    return (event & Mask.ACTION) === CLOSE;
                }

                /**
                 * Checks if the given event represents any type of TIMEOUT action.
                 * @param event The event code to check.
                 * @returns `true` if the base action is TIMEOUT, `false` otherwise.
                 */
                export function isTimeout(event: number): boolean {
                    return (event & Mask.ACTION) === TIMEOUT;
                }

                /**
                 * Checks if the given event represents a PING action.
                 * @param event The event code to check.
                 * @returns `true` if the base action is PING, `false` otherwise.
                 */
                export function isPing(event: number): boolean {
                    return (event & Mask.ACTION) === PING;
                }

                /**
                 * Checks if the given event represents a PONG action.
                 * @param event The event code to check.
                 * @returns `true` if the base action is PONG, `false` otherwise.
                 */
                export function isPong(event: number): boolean {
                    return (event & Mask.ACTION) === PONG;
                }

                /**
                 * Checks if the given event represents an EMPTY_FRAME action.
                 * @param event The event code to check.
                 * @returns `true` if the base action is EMPTY_FRAME, `false` otherwise.
                 */
                export function isEmptyFrame(event: number): boolean {
                    return (event & Mask.ACTION) === EMPTY_FRAME;
                }
            }

            /**
             * A composite set of predefined event types, combining actions and masks.
             */
            export enum Event {
                // --- Composite TCP/General Events ---
                REMOTE_CONNECT = Mask.REMOTE | Action.CONNECT,
                THIS_CONNECT = Mask.THIS | Action.CONNECT,
                REMOTE_CLOSE_GRACEFUL = Mask.REMOTE | Mask.GRACEFUL | Action.CLOSE,
                THIS_CLOSE_GRACEFUL = Mask.THIS | Mask.GRACEFUL | Action.CLOSE,
                REMOTE_CLOSE_ABRUPTLY = Mask.REMOTE | Mask.ABRUPTLY | Action.CLOSE,
                THIS_CLOSE_ABRUPTLY = Mask.THIS | Mask.ABRUPTLY | Action.CLOSE,
                TRANSMIT_TIMEOUT = Mask.TRANSMIT | Action.TIMEOUT,
                RECEIVE_TIMEOUT = Mask.RECEIVE | Action.TIMEOUT,

                // --- Composite WebSocket-Specific Events ---
                WEBSOCKET_REMOTE_CONNECTED = Mask.WEBSOCKET | Mask.REMOTE | Action.CONNECT,
                WEBSOCKET_THIS_CONNECTED = Mask.WEBSOCKET | Mask.THIS | Action.CONNECT,
                WEBSOCKET_PING = Mask.WEBSOCKET | Mask.REMOTE | Action.PING,
                WEBSOCKET_PONG = Mask.WEBSOCKET | Mask.REMOTE | Action.PONG,
                WEBSOCKET_EMPTY_FRAME = Mask.WEBSOCKET | Mask.REMOTE | Action.EMPTY_FRAME,
                WEBSOCKET_REMOTE_CLOSE_GRACEFUL = Mask.WEBSOCKET | Mask.REMOTE | Mask.GRACEFUL | Action.CLOSE,
                WEBSOCKET_REMOTE_CLOSE_ABRUPTLY = Mask.WEBSOCKET | Mask.REMOTE | Mask.ABRUPTLY | Action.CLOSE,
                WEBSOCKET_THIS_CLOSE_GRACEFUL = Mask.WEBSOCKET | Mask.THIS | Mask.GRACEFUL | Action.CLOSE,
                WEBSOCKET_THIS_CLOSE_ABRUPTLY = Mask.WEBSOCKET | Mask.THIS | Mask.ABRUPTLY | Action.CLOSE,
            }

            /**
             * Provides utility implementations for event handlers.
             */
            export namespace Utils {
                /** Defines the shape of an event handler function. */
                export type EventHandler = (channel: ExternalChannel | null, event: number) => void;

                /** A default event handler that prints a human-readable description of each event to the console. */
                export const PrintConsole: EventHandler = (channel, event) => {
                    // The original Java code included a stack trace for debugging. This can be added if needed.
                    // if (debugMode) { console.trace("debugging stack of onEvent"); }

                    let eventDescription: string;
                    const channelInfo = !channel || !channel.toString() ? ["", ""] : channel.toString().split(":", 2); // Split into at most 2 parts

                    if (Action.isConnect(event)) {
                        const isWebSocket = Mask.isWebSocket(event);
                        const isRemote = Mask.isRemote(event);
                        eventDescription = isRemote ? (isWebSocket ? "WebSocket connection established from " : "Received connection from ") : "Connected to ";
                    } else if (Action.isClose(event)) {
                        const isGraceful = Mask.isGraceful(event);
                        const isRemote = Mask.isRemote(event);
                        if (isRemote) {
                            eventDescription = isGraceful ? "Remote peer graceful closed the connection with " : "Connection abruptly closed by remote peer or network failure with ";
                        } else {
                            eventDescription = isGraceful ? "Gracefully closing connection to " : "Abruptly closing connection to ";
                        }
                    } else if (Action.isTimeout(event)) {
                        eventDescription = (event & Mask.TRANSMIT) !== 0 ? "Timeout while transmitting to " : "Timeout while receiving from ";
                    } else {
                        switch (event) {
                            case Event.WEBSOCKET_PING:
                                eventDescription = "PING received from ";
                                break;
                            case Event.WEBSOCKET_PONG:
                                eventDescription = "PONG received from ";
                                break;
                            case Event.WEBSOCKET_EMPTY_FRAME:
                                eventDescription = "Received empty WebSocket data frame from ";
                                break;
                            default:
                                eventDescription = `Unknown event: ${event} for `;
                                break;
                        }
                    }

                    console.log(`${channelInfo[0]}: ${eventDescription}${channelInfo[1] || ""}`);
                };

                /** A stub event handler that does nothing. Useful as a default or placeholder. */
                export const Stub: EventHandler = (channel, event) => {
                    /* no-op */
                };
            }
        }
    }

    /**
     * @class WebSocketClient
     * A self-contained implementation of `AdHoc.Channel.External` for WebSocket communication.
     *
     * Unlike {@link WebRTCClient}, this class does not use a {@link Host} and manages a single
     * WebSocket connection directly. This implementation includes automatic reconnection with
     * exponential backoff, making it resilient to transient network failures.
     */
    export class WebSocketClient<INT extends AdHoc.Channel.Internal> implements AdHoc.Channel.External {
        private readonly name: string;
        private readonly transmit_buffer: ArrayBuffer;
        private readonly transmit_view: DataView;
        private connectionInfo: string;
        private webSocket: WebSocket | null = null;
        private transmitLock: boolean = false;
        private isClosingGracefully: boolean = false;
        private watchdogTimeoutId: NodeJS.Timeout | number | null = null;
        private _internal!: AdHoc.Channel.Internal;
        private _receiveTimeout: number = Number.MAX_SAFE_INTEGER;
        private _transmitTimeout: number = Number.MAX_SAFE_INTEGER;
        private readonly onFailure: (source: any, error: Error) => void;
        private retryAttempts: number = 0;
        private readonly maxRetries: number = 3;
        private readonly retryDelay: number = 1000;

        /**
         * Creates a new WebSocket client channel.
         * @param {string} name A descriptive name for the client (e.g., "SignalingClient").
         * @param newInternal
         * @param {(source: any, error: Error) => void} onFailure Callback for handling errors.
         * @param {number} bufferSize The size of the transmission buffer.
         */
        constructor( name: string, newInternal: ( channel: AdHoc.Channel.External ) => INT, onFailure: ( source: any, error: Error ) => void = Network.Host.onFailurePrintConsole, bufferSize: number = 1024 ){
            this.name = name;
            this.Internal = newInternal( this );
            this.transmit_buffer = new ArrayBuffer( bufferSize );
            this.transmit_view = new DataView( this.transmit_buffer );
            this.connectionInfo = `${ name }:closed`;
            this.onFailure = onFailure;
        }

        /**
         * The internal AdHoc data source and sink connected to this channel.
         * @type {AdHoc.Channel.Internal}
         */
        get Internal(): AdHoc.Channel.Internal {
            return this._internal;
        }

        /**
         * Connects the channel to its internal AdHoc data endpoints.
         * This wires up the data pipeline, allowing the application to send and receive data.
         * @param {AdHoc.Channel.Internal} value The internal data source and sink.
         */
        set Internal(value: AdHoc.Channel.Internal) {
            this._internal = value;
            value.BytesSrc?.subscribe_on_new_bytes_to_transmit_arrive(() => {
                if (!this.transmitLock && this.webSocket?.readyState === WebSocket.OPEN) {
                    this.transmitLock = true;
                    this.transmitLoop(this.getNextFragment());
                }
            });
        }

        get receiveTimeout(): number {
            return this.isClosingGracefully ? -this._receiveTimeout : this._receiveTimeout;
        }

        set receiveTimeout(value: number) {
            this._receiveTimeout = Math.abs(value);
            this.isClosingGracefully = value < 0;
            if (this.isClosingGracefully) {
                this.close();
            } else if (this.webSocket?.readyState === WebSocket.OPEN) {
                this.resetReceiveTimeout();
            }
        }

        get transmitTimeout(): number {
            return this.isClosingGracefully ? -this._transmitTimeout : this._transmitTimeout;
        }

        set transmitTimeout(value: number) {
            this._transmitTimeout = Math.abs(value);
            this.isClosingGracefully = value < 0;
        }

        /**
         * Initiates a graceful shutdown, sends a close frame, and releases all resources.
         */
        closeAndDispose(): void {
            this._internal?.OnExternalEvent(this, Network.Host.ExternalChannel.Event.WEBSOCKET_THIS_CLOSE_GRACEFUL);
            this.closeConnection(1000, "Client disposing");
            this.cleanup();
        }

        /**
         * Initiates a graceful shutdown of the WebSocket connection by sending a close frame.
         */
        close(): void {
            this._internal?.OnExternalEvent(this, Network.Host.ExternalChannel.Event.WEBSOCKET_THIS_CLOSE_GRACEFUL);
            this.closeConnection(1000, "Client closing");
        }

        /**
         * Abruptly terminates the WebSocket connection without a graceful handshake.
         */
        abort(): void {
            this._internal?.OnExternalEvent(this, Network.Host.ExternalChannel.Event.WEBSOCKET_THIS_CLOSE_ABRUPTLY);
            this.closeConnection(1006, "Client aborted");
            this.cleanup();
        }

        /**
         * Asynchronously connects to a WebSocket server with built-in retry logic.
         *
         * This method establishes a connection, sets up event listeners for message handling,
         * and features robust error handling, a connection timeout, and an automatic
         * reconnection mechanism with exponential backoff.
         *
         * If the initial connection fails, it will automatically retry several times with an
         * increasing delay between attempts. The method returns a Promise that resolves with
         * the client instance (`this`) on success, or `undefined` on failure after all retries.
         *
         * @param {string} server The full URL of the WebSocket server (e.g., "ws://localhost:8080").
         * @param {number} [connectingTimeout=5000] - Timeout in milliseconds for each connection attempt.
         * @returns {Promise<INT | undefined>} A Promise that resolves with the WebSocketClient instance (`this`) on successful connection, or `undefined` if all connection attempts fail.
         *
         * @example
         * // Example using async/await (recommended)
         * async function main() {
         *   const wsClient = new Network.WebSocketClient("MyClient", (src, err) => console.error(err), 4096);
         *   console.log("Connecting...");
         *   const connectedClient = await wsClient.connect("ws://localhost:8080");
         *
         *   if (connectedClient) {
         *     console.log("Successfully connected!", connectedClient.toString());
         *     // The client is now ready to use
         *   } else {
         *     console.error("Failed to connect after multiple retries.");
         *   }
         * }
         * main();
         *
         * @example
         * // Example using .then() chaining
         * const wsClient = new Network.WebSocketClient("MyClient", (src, err) => console.error(err), 4096);
         * console.log("Connecting...");
         * wsClient.connect("ws://localhost:8080")
         *   .then(connectedClient => {
         *     if (connectedClient) {
         *       console.log("Successfully connected!", connectedClient.toString());
         *       // The client is now ready to use
         *     } else {
         *       console.error("Failed to connect after multiple retries.");
         *     }
         *   })
         *   .catch(error => {
         *     console.error("An unexpected error occurred during connection:", error);
         *   });
         */
        public async connect(server: string, connectingTimeout: number = 5000): Promise<INT | undefined> {
            if (this.webSocket && this.webSocket.readyState < WebSocket.CLOSING) {
                this.close(); // Close any existing connection before starting a new one
            }

            this.connectionInfo = `${this.name}:connecting`;
            this.retryAttempts = 0;

            const tryConnect = (): Promise<INT | undefined> => {
                return new Promise((resolve) => {
                    try {
                        // Validate URL format before attempting to connect
                        try {
                            new URL(server);
                            if (!server.startsWith("ws:") && !server.startsWith("wss:")) {
                                throw new Error("Invalid WebSocket URL: Must use ws: or wss: protocol");
                            }
                        } catch (e) {
                            this.handleConnectionFailure(new Error(`Invalid WebSocket URL: ${(e as Error).message}`));
                            return resolve(undefined);
                        }

                        let isSettled = false;
                        this.webSocket = new WebSocket(server);
                        this.webSocket.binaryType = "arraybuffer";

                        const timeoutId = setTimeout(() => {
                            if (isSettled) return;
                            isSettled = true;
                            this.handleConnectionFailure(new Error(`Connection timed out after ${connectingTimeout}ms`));
                            resolve(undefined);
                        }, connectingTimeout);

                        this.webSocket.onopen = () => {
                            if (isSettled) return;
                            isSettled = true;
                            clearTimeout(timeoutId);
                            this.connectionInfo = `${this.name}:${server}`;
                            this._internal?.OnExternalEvent(this, Network.Host.ExternalChannel.Event.WEBSOCKET_THIS_CONNECTED);

                            this.webSocket!.onmessage = (event) => {
                                this.resetReceiveTimeout();
                                if (this._internal?.BytesDst && event.data instanceof ArrayBuffer) {
                                    this._internal.BytesDst.write(new DataView(event.data), 0, event.data.byteLength);
                                }
                            };
                            this.webSocket!.onclose = (event) => {
                                this._internal?.OnExternalEvent(this, event.code === 1000 ? Network.Host.ExternalChannel.Event.WEBSOCKET_REMOTE_CLOSE_GRACEFUL : Network.Host.ExternalChannel.Event.WEBSOCKET_REMOTE_CLOSE_ABRUPTLY);
                                this.cleanup();
                            };
                            this.webSocket!.onerror = () => {
                                const error = new Error("WebSocket runtime error");
                                this.onFailure(this, error);
                                this._internal?.OnExternalEvent(this, Network.Host.ExternalChannel.Event.WEBSOCKET_REMOTE_CLOSE_ABRUPTLY);
                                this.cleanup();
                            };

                            this.resetReceiveTimeout();
                            resolve(<INT>this.Internal);
                        };

                        this.webSocket.onerror = () => {
                            if (isSettled) return;
                            isSettled = true;
                            clearTimeout(timeoutId);
                            this.handleConnectionFailure(new Error("WebSocket failed to connect."));
                            resolve(undefined);
                        };
                    } catch (e) {
                        this.handleConnectionFailure(e as Error);
                        resolve(undefined);
                    }
                });
            };

            while (this.retryAttempts <= this.maxRetries) {
                const result = await tryConnect();
                if (result) return result; // Success!

                this.retryAttempts++;
                if (this.retryAttempts <= this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }

            this.onFailure(this, new Error(`Failed to connect after ${this.maxRetries} retries.`));
            return undefined;
        }

        /**
         * Provides a string representation of the client and its connection state.
         * @returns {string} The connection info string.
         */
        public toString(): string {
            return this.connectionInfo;
        }

        /**
         * @private
         * Safely closes the WebSocket connection if it's open.
         */
        private closeConnection(statusCode: number, reason: string): void {
            if (this.webSocket && this.webSocket.readyState < WebSocket.CLOSING) {
                this.webSocket.close(statusCode, reason);
            }
        }

        /**
         * @private
         * Centralized method to tear down all resources and reset state.
         * This ensures the client is in a clean state after disconnection or failure.
         */
        private cleanup(): void {
            this.shutdownWatchdog();
            if (this.webSocket) {
                this.webSocket.onopen = null;
                this.webSocket.onmessage = null;
                this.webSocket.onclose = null;
                this.webSocket.onerror = null;
                if (this.webSocket.readyState < WebSocket.CLOSING) {
                    this.webSocket.close();
                }
                this.webSocket = null;
            }
            this.connectionInfo = `${this.name}:closed`;
            this.transmitLock = false;

            // Always close internal streams when the channel is no longer usable.
            this._internal?.BytesSrc?.close();
            this._internal?.BytesDst?.close();
        }

        /**
         * @private
         * Clears any active receive timeout watchdog.
         */
        private shutdownWatchdog(): void {
            if (this.watchdogTimeoutId) {
                clearTimeout(this.watchdogTimeoutId as any);
                this.watchdogTimeoutId = null;
            }
        }

        /**
         * @private
         * Reads the next chunk of data from the internal source buffer.
         */
        private getNextFragment(): ArrayBuffer | undefined {
            if (!this._internal?.BytesSrc) return undefined;
            const bytesRead = this._internal.BytesSrc.read(this.transmit_view, 0, this.transmit_view.byteLength);
            return bytesRead > 0 ? this.transmit_buffer.slice(0, bytesRead) : undefined;
        }

        /**
         * @private
         * The main transmission loop. Sends data fragments sequentially.
         */
        private async transmitLoop(fragment: ArrayBuffer | undefined): Promise<void> {
            if (!fragment || !this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
                this.finishSend();
                return;
            }
            try {
                await this.sendWithTimeout(fragment);
                const nextFragment = this.getNextFragment();
                if (nextFragment) {
                    setTimeout(() => this.transmitLoop(nextFragment), 0); // Non-blocking recursion
                } else {
                    this.finishSend();
                }
            } catch (e) {
                this.onFailure(this, e as Error);
                this.finishSend();
            }
        }

        /**
         * @private
         * Sends a single data fragment with a configured timeout.
         */
        private sendWithTimeout(data: ArrayBuffer): Promise<void> {
            return new Promise((resolve, reject) => {
                if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
                    return reject(new Error("WebSocket is not open"));
                }
                const timeoutId = setTimeout(() => {
                    this.closeConnection(1006, "Send timeout");
                    reject(new Error(`Send operation timed out after ${this._transmitTimeout}ms`));
                }, this._transmitTimeout);

                try {
                    this.webSocket.send(data);
                    clearTimeout(timeoutId);
                    resolve();
                } catch (e) {
                    clearTimeout(timeoutId);
                    reject(e);
                }
            });
        }

        /**
         * @private
         * Releases the transmit lock and performs post-send actions.
         */
        private finishSend(): void {
            this.transmitLock = false;
            if (this.isClosingGracefully) {
                this.closeAndDispose();
            }
        }

        /**
         * @private
         * Resets the idle/receive timeout watchdog.
         */
        private resetReceiveTimeout(): void {
            this.shutdownWatchdog();
            if (this._receiveTimeout > 0 && this._receiveTimeout !== Number.MAX_SAFE_INTEGER) {
                this.watchdogTimeoutId = setTimeout(() => {
                    const error = new Error(`Receive timed out. No data received for ${this._receiveTimeout}ms`);
                    this.onFailure(this, error);
                    this._internal?.OnExternalEvent(this, Network.Host.ExternalChannel.Event.RECEIVE_TIMEOUT);
                    this.abort(); // An idle timeout is an abrupt event
                }, this._receiveTimeout);
            }
        }

        /**
         * @private
         * Handles the logic for a failed connection attempt.
         */
        private handleConnectionFailure(error: Error): void {
            this.onFailure(this, error);
            this.connectionInfo = `${this.name}:failed`;
            this.cleanup();
        }
    }

    /**
     * @class WebRTCClient
     * Implements a {@link Host} for managing peer-to-peer WebRTC connections.
     *
     * It features robust error handling, state management, and an automatic
     * reconnection mechanism for both signaling and data channels.
     */
    export class WebRTCClient extends Host {
        static readonly SIGNALING_TIMEOUT = 30000; // 30 seconds
        static readonly MAX_RETRIES = 3;
        static readonly RECONNECT_DELAY = 1000; // 1 second

        /**
         * Allocates a channel and initiates a WebRTC connection to a peer via a signaling server.
         *
         * This method implements retry logic for establishing a stable connection.
         * The caller is responsible for setting the `Internal` property on the returned channel
         * to wire up the data streams.
         *
         * @param server_url The URL of the WebSocket signaling server.
         * @returns {WebRTCClient.Channel} The allocated channel, ready for configuration and connection.
         */
        connect(server_url: string): WebRTCClient.Channel {
            const channel = this.allocate() as WebRTCClient.Channel;
            channel.open(server_url);
            return channel;
        }
    }

    export namespace WebRTCClient {
        /**
         * @interface Signaling
         * Defines the contract for a WebRTC signaling mechanism.
         *
         * This abstracts the underlying transport (e.g., WebSocket) and includes
         * an expectation of reconnection logic.
         */
        export interface Signaling {
            onmessage: ((event: MessageEvent) => void) | undefined;
            onerror: ((event: Event) => void) | undefined;
            onopen: ((event: Event) => void) | undefined;

            send(data: string): void;

            close(): void;

            reconnect(): void;
        }

        /**
         * @class WebSocketSignaling
         * Implements the {@link Signaling} interface using WebSockets, with built-in
         * automatic reconnection support. It handles the transport layer for WebRTC signaling messages.
         */
        export class WebSocketSignaling implements Signaling {
            private ws: WebSocket | undefined;
            private isClosed: boolean = false;
            private reconnectAttempts: number = 0;
            private readonly url: string;

            /**
             * Creates and initializes a WebSocket-based signaling channel.
             * @param signaling_url The URL of the WebSocket signaling server.
             */
            constructor(signaling_url: string) {
                this.url = signaling_url;
                this.connect();
            }

            onmessage: ((event: MessageEvent) => void) | undefined;
            onerror: ((event: Event) => void) | undefined;
            onopen: ((event: Event) => void) | undefined;

            /**
             * Establishes the initial WebSocket connection to the signaling server.
             * Sets up event listeners and handles the connection lifecycle.
             */
            connect(): void {
                if (this.isClosed) return;
                try {
                    this.ws = new WebSocket(this.url);
                    this.ws.onmessage = (event) => this.onmessage?.(event);
                    this.ws.onerror = (event) => this.onerror?.(event);
                    this.ws.onopen = (event) => {
                        this.reconnectAttempts = 0; // Reset on successful connection.
                        this.onopen?.(event);
                    };
                    this.ws.onclose = () => {
                        if (!this.isClosed) this.reconnect();
                    };
                } catch (e) {
                    this.onerror?.(new Event("error"));
                    this.reconnect();
                }
            }

            /**
             * Sends a signaling message to the server.
             * @param data The stringified signaling message to send.
             * @throws {Error} If the WebSocket connection is not open.
             */
            send(data: string): void {
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error("Signaling connection is not open.");
                this.ws.send(data);
            }

            /**
             * Attempts to reconnect to the signaling server using an exponential backoff strategy.
             * Reconnection stops after {@link WebRTCClient.MAX_RETRIES} attempts.
             */
            reconnect(): void {
                if (this.isClosed || this.reconnectAttempts >= WebRTCClient.MAX_RETRIES) return;

                this.reconnectAttempts++;
                // Exponential backoff for reconnection attempts.
                setTimeout(() => this.connect(), WebRTCClient.RECONNECT_DELAY * this.reconnectAttempts);
            }

            /**
             * Permanently closes the signaling connection and prevents further reconnection attempts.
             */
            close(): void {
                if (this.isClosed) return;
                this.isClosed = true;
                if (this.ws && this.ws.readyState < WebSocket.CLOSING) this.ws.close();
                this.ws = undefined;
            }
        }

        /**
         * @class Channel
         * Manages a single WebRTC peer connection, handling the entire lifecycle from
         * signaling and ICE negotiation to data transfer and cleanup.
         */
        export class Channel extends Host.ExternalChannel{
            private signal?: Signaling;
            private rtc?: RTCPeerConnection;
            private data?: RTCDataChannel;
            private pendingCandidates: RTCIceCandidateInit[] = [];
            private serverUrl: string = "";
            private retryCount: number = 0;
            private signalingTimeout?: number;
            private connectionState: "new" | "connecting" | "connected" | "failed" | "closed" = "new";

            /**
             * Starts the WebRTC connection process.
             * @param signaling_url The URL of the signaling server.
             */
            open( signaling_url: string ): void{
                this.serverUrl = signaling_url;
                this.startConnectionAttempt();
            }

            private startConnectionAttempt(): void{
                if( this.connectionState === "connecting" || this.connectionState === "connected" ) return;

                this.cleanup(); // Clean up previous attempts before starting a new one.
                this.connectionState = "connecting";

                try{
                    this.signal = new WebSocketSignaling( this.serverUrl );
                }catch( e ){
                    this.handleError( new Error( `Failed to initialize signaling: ${ e }` ), true );
                    return;
                }

                this.signal.onopen = () => {
                    this.setupRTC();
                    this.rtc
                        ?.createOffer( { iceRestart: this.retryCount > 0 } ) // Force ICE restart on retries
                        .then( ( offer ) => this.rtc!.setLocalDescription( offer ) )
                        .then( () =>
                            this.signal!.send(
                                JSON.stringify( {
                                    type: "sessionDescription",
                                    data: this.rtc!.localDescription,
                                } ),
                            ),
                        )
                        .catch( ( err ) => this.handleError( err, true ) );
                };

                this.signal.onmessage = this.onsignal.bind( this );
                this.signal.onerror = () => this.handleError( new Error( "Signaling connection failed" ), true );

                // Watchdog to prevent getting stuck in the connecting state.
                this.signalingTimeout = window.setTimeout( () => {
                    if( this.connectionState !== "connected" ){
                        this.handleError( new Error( "Connection attempt timed out" ), true );
                    }
                }, WebRTCClient.SIGNALING_TIMEOUT );
            }

            private setupRTC(): void{
                this.rtc = new RTCPeerConnection( {
                    iceServers: [ { urls: "stun:stun.l.google.com:19302" } ],
                } );

                this.rtc.ondatachannel = ( event ) => {
                    this.data = event.channel;
                    this.bindDataChannelEvents();
                };

                this.data = this.rtc.createDataChannel( "AdHoc", { ordered: true } );
                this.bindDataChannelEvents();

                this.rtc.onicecandidate = ( event ) => {
                    if( event.candidate && this.signal ){
                        this.signal.send(
                            JSON.stringify( {
                                type: "iceCandidate",
                                data: event.candidate,
                            } ),
                        );
                    }
                };

                this.rtc.oniceconnectionstatechange = () => {
                    switch( this.rtc?.iceConnectionState ){
                        case "failed":
                        case "disconnected":
                            if( this.connectionState !== "closed" ) this.retryConnection();
                            break;
                        case "closed":
                            this.cleanup();
                            break;
                    }
                };

                this.rtc.onnegotiationneeded = () => {
                    if( this.connectionState !== "connecting" && this.connectionState !== "connected" ) return;
                    this.rtc
                        ?.createOffer()
                        .then( ( offer ) => this.rtc!.setLocalDescription( offer ) )
                        .then( () =>
                            this.signal?.send(
                                JSON.stringify( {
                                    type: "sessionDescription",
                                    data: this.rtc!.localDescription,
                                } ),
                            ),
                        )
                        .catch( ( err ) => this.handleError( err, true ) );
                };
            }

            private bindDataChannelEvents(): void{
                if( !this.data ) return;
                this.data.binaryType = "arraybuffer";

                this.data.onopen = () => {
                    if( this.connectionState === "closed" ) return;
                    this.connectionState = "connected";
                    this.retryCount = 0;
                    clearTimeout( this.signalingTimeout );
                    this.signalingTimeout = undefined;
                    this.transmitter_connected();
                };

                this.data.onclose = () => {
                    if( this.connectionState !== "closed" ) this.handleError( new Error( "Data channel closed unexpectedly" ), false );
                };

                this.data.onerror = ( event ) => {
                    const error = ( event as RTCErrorEvent ).error || new Error( "Unknown data channel error" );
                    this.handleError( error, true );
                };

                this.data.onmessage = ( event ) => this.receive( event.data as ArrayBuffer );
            }

            private retryConnection(): void{
                if( this.retryCount >= WebRTCClient.MAX_RETRIES ){
                    this.handleError( new Error( `Max retry attempts reached` ), true );
                    return;
                }
                this.retryCount++;
                console.log( `Connection lost. Reconnecting... (Attempt ${ this.retryCount })` );
                setTimeout( () => this.startConnectionAttempt(), WebRTCClient.RECONNECT_DELAY );
            }

            private handleError( error: Error, isFatal: boolean ): void{
                if( this.connectionState === "failed" || this.connectionState === "closed" ) return;

                console.error( "WebRTC Channel Error:", error );
                if( isFatal ){
                    this.connectionState = "failed";
                    this.host.onFailure( this, error );
                    this.cleanup();
                }else{
                    this.retryConnection();
                }
            }

            private cleanup(): void{
                if( this.connectionState === "closed" ) return;
                this.connectionState = "closed";

                clearTimeout( this.signalingTimeout );
                this.signalingTimeout = undefined;

                this.signal?.close();
                this.signal = undefined;

                if( this.data ){
                    this.data.onopen = this.data.onclose = this.data.onerror = this.data.onmessage = null;
                    this.data.close();
                    this.data = undefined;
                }
                if( this.rtc ){
                    this.rtc.onicecandidate = this.rtc.oniceconnectionstatechange = this.rtc.ondatachannel = this.rtc.onnegotiationneeded = null;
                    this.rtc.close();
                    this.rtc = undefined;
                }
            }

            public closeAndDispose(): void{
                this.cleanup();
                super.dispose(); // Use dispose to mark as reusable.
            }

            /**
             * Handles incoming messages from the signaling server.
             * @revised This method was restructured to resolve promise chain errors and improve clarity.
             */
            onsignal( event: MessageEvent ): void{
                if( !this.rtc || this.connectionState === "closed" ) return;

                try{
                    const message = JSON.parse( event.data as string );
                    switch( message.type ){
                        case "sessionDescription":{
                            const description = new RTCSessionDescription( message.data );
                            this.rtc.setRemoteDescription( description )
                                .then( () => {
                                    // After setting the remote description, process any queued ICE candidates.
                                    this.pendingCandidates.forEach( candidate => {
                                        this.rtc!.addIceCandidate( new RTCIceCandidate( candidate ) )
                                            .catch( err => this.handleError( err, false ) ); // Log non-fatal candidate errors
                                    } );
                                    this.pendingCandidates = [];

                                    // If we received an offer, we must create and send an answer.
                                    if( description.type === "offer" ){
                                        return this.rtc!.createAnswer()
                                            .then( answer => this.rtc!.setLocalDescription( answer ) )
                                            .then( () => {
                                                // With the answer set as local description, send it back.
                                                if( this.rtc?.localDescription ){
                                                    this.signal?.send( JSON.stringify( {
                                                        type: "sessionDescription",
                                                        data: this.rtc.localDescription,
                                                    } ) );
                                                }
                                            } );
                                    }
                                    // If we received an answer, the offer/answer exchange is complete. No further action needed in this chain.
                                    return Promise.resolve();
                                } )
                                .catch( err => this.handleError( err, true ) );
                            break;
                        }
                        case "iceCandidate":{
                            const candidate = new RTCIceCandidate( message.data );
                            // Queue the candidate if the remote description isn't set yet (trickle ICE).
                            if( this.rtc.remoteDescription ){
                                this.rtc.addIceCandidate( candidate ).catch( err => this.handleError( err, false ) );
                            }else{
                                this.pendingCandidates.push( message.data );
                            }
                            break;
                        }
                    }
                }catch( err ){
                    this.handleError( err as Error, true );
                }
            }

            /**
             * Sends data over the established WebRTC data channel.
             *
             * This method implements the protocol-specific transmission logic for WebRTC.
             * If the data channel is not open, it triggers a non-fatal error to attempt reconnection.
             * @param src The data to transmit.
             */
            transmit = ( src: ArrayBuffer ): void => {
                if( this.data?.readyState === "open" ){
                    try{
                        this.data.send( src );
                    }catch( err ){
                        this.handleError( new Error( `Failed to transmit data: ${ err }` ), false );
                    }
                }else if( this.connectionState !== "closed" ){
                    this.handleError( new Error( "Cannot transmit: Data channel is not open." ), false );
                }
            };
        }
    }
}

import Network = org.unirail.Network;

export default Network;
