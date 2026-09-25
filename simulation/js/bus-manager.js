/**
 * ============================================
 * BUS MANAGER
 * ============================================
 * Manages bus lines (Service Bus Architecture backbone)
 */

class BusManager {
    constructor() {
        this.buses = [];
        this.busCounter = 0;

        console.log('✅ BusManager initialized');
    }

    /**
     * Create a new bus line
     */
    createBusLine(orientation = 'horizontal', position = null, length = 600, name = null) {
        this.busCounter++;

        // Auto-position if not provided
        if (!position) {
            if (orientation === 'horizontal') {
                position = {
                    x: 100,
                    y: 150 + (this.busCounter - 1) * 300
                };
            } else {
                position = {
                    x: 100 + (this.busCounter - 1) * 200,
                    y: 100
                };
            }
        }

        const bus = {
            id: `bus-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: '', // No name for buses
            orientation: orientation,
            position: position,
            length: length,
            thickness: 8,
            color: '#3498db', // Always blue color
            type: 'service-bus',
            connections: []
        };

        console.log('✅ Bus created:', bus);

        // Add to data store
        if (window.dataStore) {
            console.log('📦 Adding bus to DataStore...');
            window.dataStore.addBus(bus);
            console.log('📦 Bus added. Total buses:', window.dataStore.getAllBuses().length);
        } else {
            console.error('❌ DataStore not available!');
        }

        // Re-render canvas
        if (window.canvasRenderer) {
            console.log('🎨 Triggering canvas render...');
            window.canvasRenderer.render();
        } else {
            console.error('❌ CanvasRenderer not available!');
        }

        return bus;
    }

    /**
     * Connect NF to bus line
     */
    connectNFToBus(nfId, busId) {
        const nf = window.dataStore?.getNFById(nfId);
        const bus = window.dataStore?.getBusById(busId);

        if (!nf || !bus) {
            console.error('❌ Invalid NF or Bus ID');
            return null;
        }

        if (bus.connections.includes(nfId)) {
            alert(`${nf.name} is already connected to ${bus.name}`);
            return null;
        }

        console.log(`🔗 Connecting ${nf.name} to bus ${bus.name}`);

        bus.connections.push(nfId);

        // Generate interface name based on service protocol
        const interfaceName = this.generateInterfaceName(nfId, bus.name);

        const connection = {
            id: `bus-conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            nfId: nfId,
            busId: busId,
            type: 'bus-connection',
            interfaceName: interfaceName,
            protocol: window.globalHTTPProtocol || 'HTTP/2',
            status: 'connected',
            createdAt: Date.now()
        };

        if (window.dataStore) {
            window.dataStore.addBusConnection(connection);
        }

        // =========================================
        // SMART BUS LOGIC: Auto-register with NRF
        // =========================================
        this.handleSmartBusConnection(nfId, busId, nf, bus);

        if (window.logEngine) {
            window.logEngine.addLog(nfId, 'SUCCESS',
                `Connected to service bus`, {
                busId: busId,
                orientation: bus.orientation,
                protocol: connection.protocol
            });
        }

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        return connection;
    }

    /**
     * Delete bus line
     */
    deleteBusLine(busId) {
        const bus = window.dataStore?.getBusById(busId);

        if (!bus) {
            console.warn('⚠️ Bus not found:', busId);
            return;
        }

        console.log('🗑️ Deleting bus:', bus.name);

        if (window.dataStore) {
            window.dataStore.removeBusConnections(busId);
            window.dataStore.removeBus(busId);
        }

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Update bus properties
     */
    updateBus(busId, updates) {
        const bus = window.dataStore?.getBusById(busId);

        if (!bus) {
            console.warn('⚠️ Bus not found:', busId);
            return;
        }

        Object.assign(bus, updates);

        console.log('✅ Bus updated:', bus.name);

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Connect Bus to NF (Bus as source)
     * @param {string} busId - Bus ID (source)
     * @param {string} nfId - NF ID (destination)
     * @returns {Object} Connection object
     */
    connectBusToNF(busId, nfId) {
        const bus = window.dataStore?.getBusById(busId);
        const nf = window.dataStore?.getNFById(nfId);

        if (!bus || !nf) {
            console.error('❌ Invalid Bus or NF ID');
            return null;
        }

        console.log(`🔗 Connecting bus to NF ${nf.name}`);

        // Generate interface name based on service protocol
        const interfaceName = this.generateInterfaceName(nfId, bus.name);

        // Create connection object
        const connection = {
            id: `bus-nf-conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            busId: busId,
            nfId: nfId,
            type: 'bus-to-nf-connection',
            interfaceName: interfaceName, // NEW: Interface name
            protocol: window.globalHTTPProtocol || 'HTTP/2',
            status: 'connected',
            createdAt: Date.now()
        };

        // Add to data store
        if (window.dataStore) {
            window.dataStore.addBusConnection(connection);
        }

        // Log
        if (window.logEngine) {
            window.logEngine.addLog(nfId, 'SUCCESS', `Connected from service bus`, {
                busId: busId,
                orientation: bus.orientation,
                protocol: connection.protocol
            });
        }

        // Re-render
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        return connection;
    }

    /**
     * Connect Bus to Bus (Bus as both source and destination)
     * @param {string} sourceBusId - Source Bus ID
     * @param {string} targetBusId - Target Bus ID
     * @returns {Object} Connection object
     */
    connectBusToBus(sourceBusId, targetBusId) {
        const sourceBus = window.dataStore?.getBusById(sourceBusId);
        const targetBus = window.dataStore?.getBusById(targetBusId);

        if (!sourceBus || !targetBus) {
            console.error('❌ Invalid Bus IDs');
            return null;
        }

        if (sourceBusId === targetBusId) {
            alert('Cannot connect a bus to itself!');
            return null;
        }

        console.log(`🔗 Connecting bus ${sourceBus.name} to bus ${targetBus.name}`);

        // Generate interface name for bus-to-bus connection
        const interfaceName = this.generateBusBridgeInterfaceName(sourceBus.name, targetBus.name);

        // Create connection object
        const connection = {
            id: `bus-bus-conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            sourceBusId: sourceBusId,
            targetBusId: targetBusId,
            type: 'bus-to-bus-connection',
            interfaceName: interfaceName, // NEW: Interface name
            protocol: window.globalHTTPProtocol || 'HTTP/2',
            status: 'connected',
            createdAt: Date.now()
        };

        // Add to data store
        if (window.dataStore) {
            window.dataStore.addBusConnection(connection);
        }

        // Log
        if (window.logEngine) {
            window.logEngine.addLog('system', 'SUCCESS', `Bus bridge created between two bus lines`, {
                sourceBusId: sourceBusId,
                targetBusId: targetBusId,
                protocol: connection.protocol
            });
        }

        // Re-render
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        return connection;
    }

    /**
     * Generate interface name based on service protocol
     * @param {string} nfId - Network Function ID
     * @param {string} busName - Bus name (unused now)
     * @returns {string} Interface name (protocol name)
     */
    generateInterfaceName(nfId, busName) {
        // Get the service to access its protocol
        const service = window.dataStore?.getNFById(nfId);
        if (service && service.config && service.config.protocol) {
            return service.config.protocol; // Use the service's protocol as interface name
        }
        
        // Fallback to HTTP/2 if protocol not found
        return 'HTTP/2';
    }

    /**
     * Generate interface name for bus-to-bus connections
     * @param {string} sourceBusName - Source bus name
     * @param {string} targetBusName - Target bus name
     * @returns {string} Interface name
     */
    generateBusBridgeInterfaceName(sourceBusName, targetBusName) {
        // Determine interface based on bus types
        const sourceType = this.getBusType(sourceBusName);
        const targetType = this.getBusType(targetBusName);

        if (sourceType === 'control' && targetType === 'user') {
            return 'N4'; // Control Plane to User Plane
        } else if (sourceType === 'user' && targetType === 'control') {
            return 'N4'; // User Plane to Control Plane
        } else if (sourceType === 'control' && targetType === 'control') {
            return 'SBI'; // Service-Based Interface
        } else if (sourceType === 'user' && targetType === 'user') {
            return 'N6'; // User Plane interconnect
        } else {
            return 'Nbridge'; // Generic bridge interface
        }
    }

    /**
     * Determine bus type from name
     * @param {string} busName - Bus name
     * @returns {string} Bus type
     */
    getBusType(busName) {
        const name = busName.toLowerCase();
        if (name.includes('control') || name.includes('sbi')) {
            return 'control';
        } else if (name.includes('user') || name.includes('data')) {
            return 'user';
        } else {
            return 'generic';
        }
    }

    /**
     * Handle smart bus connections - auto-register with NRF when connected to same bus
     * @param {string} nfId - NF ID that just connected
     * @param {string} busId - Bus ID
     * @param {Object} nf - NF object
     * @param {Object} bus - Bus object
     */
    handleSmartBusConnection(nfId, busId, nf, bus) {
        // Get all NFs connected to this bus
        const busConnections = window.dataStore?.getBusConnectionsForBus(busId) || [];
        const connectedNFIds = busConnections.map(conn => conn.nfId);

        // Find NRF on this bus
        const nrfOnBus = connectedNFIds.find(connectedNfId => {
            const connectedNF = window.dataStore?.getNFById(connectedNfId);
            return connectedNF && connectedNF.type === 'NRF';
        });

        if (nrfOnBus && nf.type !== 'NRF') {
            // NRF is on this bus and we're connecting a non-NRF
            console.log(`🔄 Smart Bus: Auto-registering ${nf.name} with NRF via bus`);

            if (window.logEngine) {
                // Add registration logs
                setTimeout(() => {
                    window.logEngine.addLog(nfId, 'INFO',
                        `Discovered NRF via bus - Initiating registration`, {
                        busId: busId,
                        nrfId: nrfOnBus,
                        discoveryMethod: 'Service Bus'
                    });

                    setTimeout(() => {
                        window.logEngine.addLog(nfId, 'SUCCESS',
                            `Successfully registered with NRF via bus`, {
                            nrfId: nrfOnBus,
                            profileId: `${nf.type.toLowerCase()}-profile-${Date.now()}`,
                            validity: '3600 seconds',
                            heartbeatInterval: '60 seconds'
                        });
                    }, 1500);
                }, 1000);
            }
        } else if (nf.type === 'NRF' && connectedNFIds.length > 1) {
            // NRF is being connected and there are other NFs on the bus
            console.log(`🔄 Smart Bus: NRF ${nf.name} connecting to bus with existing NFs`);

            // Register all existing NFs with this NRF
            connectedNFIds.forEach(existingNfId => {
                if (existingNfId !== nfId) {
                    const existingNF = window.dataStore?.getNFById(existingNfId);
                    if (existingNF && existingNF.type !== 'NRF') {
                        setTimeout(() => {
                            if (window.logEngine) {
                                window.logEngine.addLog(existingNfId, 'INFO',
                                    `NRF ${nf.name} joined ${bus.name} - Initiating registration`, {
                                    busId: busId,
                                    nrfId: nfId,
                                    discoveryMethod: 'Service Bus'
                                });

                                setTimeout(() => {
                                    window.logEngine.addLog(existingNfId, 'SUCCESS',
                                        `Successfully registered with ${nf.name} via bus`, {
                                        nrfId: nfId,
                                        profileId: `${existingNF.type.toLowerCase()}-profile-${Date.now()}`,
                                        validity: '3600 seconds',
                                        heartbeatInterval: '60 seconds'
                                    });
                                }, 1500);
                            }
                        }, 1000 + Math.random() * 2000); // Stagger the registrations
                    }
                }
            });
        }

        // Handle other smart connections (e.g., AMF-UDM, SMF-UPF via bus)
        this.handleOtherSmartConnections(nfId, busId, nf, bus, connectedNFIds);
    }

    /**
     * Handle other smart bus connections beyond NRF registration
     * @param {string} nfId - NF ID that just connected
     * @param {string} busId - Bus ID
     * @param {Object} nf - NF object
     * @param {Object} bus - Bus object
     * @param {Array} connectedNFIds - Array of NF IDs connected to this bus
     */
    handleOtherSmartConnections(nfId, busId, nf, bus, connectedNFIds) {
        // Define smart connection rules
        const smartRules = {
            'AMF': ['AUSF', 'UDM', 'PCF', 'NSSF'], // AMF auto-discovers these
            'SMF': ['UPF', 'PCF', 'UDM'],          // SMF auto-discovers these
            'AUSF': ['UDM'],                       // AUSF needs UDM
            'UDM': ['MySQL'],                      // UDM connects to database
        };

        if (smartRules[nf.type]) {
            // Check if any of the required NFs are on this bus
            connectedNFIds.forEach(connectedNfId => {
                const connectedNF = window.dataStore?.getNFById(connectedNfId);
                if (connectedNF && smartRules[nf.type].includes(connectedNF.type)) {
                    console.log(`🔄 Smart Bus: ${nf.name} auto-discovering ${connectedNF.name} via bus`);

                    if (window.logEngine) {
                        setTimeout(() => {
                            window.logEngine.addLog(nfId, 'SUCCESS',
                                `Discovered ${connectedNF.type} ${connectedNF.name} via bus`, {
                                busId: busId,
                                discoveredNfId: connectedNfId,
                                discoveryMethod: 'Service Bus',
                                interface: this.generateInterfaceName(connectedNfId, bus.name)
                            });
                        }, 2000 + Math.random() * 1000);
                    }
                }
            });
        }

        // Reverse discovery - existing NFs discover the new one
        connectedNFIds.forEach(existingNfId => {
            if (existingNfId !== nfId) {
                const existingNF = window.dataStore?.getNFById(existingNfId);
                if (existingNF && smartRules[existingNF.type] && smartRules[existingNF.type].includes(nf.type)) {
                    console.log(`🔄 Smart Bus: ${existingNF.name} auto-discovering new ${nf.name} via bus`);

                    if (window.logEngine) {
                        setTimeout(() => {
                            window.logEngine.addLog(existingNfId, 'SUCCESS',
                                `Discovered new ${nf.type} ${nf.name} via bus`, {
                                busId: busId,
                                discoveredNfId: nfId,
                                discoveryMethod: 'Service Bus',
                                interface: this.generateInterfaceName(nfId, bus.name)
                            });
                        }, 2500 + Math.random() * 1000);
                    }
                }
            }
        });
    }
}