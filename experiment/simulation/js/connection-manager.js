/**
 * ============================================
 * CONNECTION MANAGER
 * ============================================
 * Manages connections between Network Functions
 * 
 * Responsibilities:
 * - Create connections between NFs
 * - Validate connections (3GPP compliance)
 * - Determine interface names
 * - Delete connections
 * - Check connection validity
 */

class ConnectionManager {
    constructor() {
        // Valid connections based on 3GPP specs
        this.validConnections = this.initializeValidConnections();

        console.log('✅ ConnectionManager initialized');
    }

    /**
     * Initialize valid service connections
     * For generic services, all services can connect to all other services
     * @returns {Object} Valid connection mappings
     */
    initializeValidConnections() {
        return {
            // Generic services can connect to any other service
            'Service': ['Service']
        };
    }

    /**
     * Create a connection between two NFs
     * @param {string} sourceId - Source NF ID
     * @param {string} targetId - Target NF ID
     * @returns {Object|null} Created connection or null if invalid
     */
    createConnection(sourceId, targetId) {
        console.log('🔗 Creating connection:', sourceId, '→', targetId);

        // Get both NFs
        const sourceNF = window.dataStore.getNFById(sourceId);
        const targetNF = window.dataStore.getNFById(targetId);

        if (!sourceNF || !targetNF) {
            console.error('❌ Invalid NF IDs');
            return null;
        }

        // Prevent self-connection
        if (sourceId === targetId) {
            alert('Cannot connect an NF to itself');
            return null;
        }

        // Check if connection already exists
        if (window.dataStore.connectionExists(sourceId, targetId)) {
            alert(`Connection already exists between ${sourceNF.name} and ${targetNF.name}`);
            return null;
        }

        // Validate connection is allowed
        if (!this.isConnectionValid(sourceNF.type, targetNF.type)) {
            alert(`Invalid connection: ${sourceNF.type} cannot connect to ${targetNF.type}\n\nPer 3GPP specifications, this connection is not allowed.`);
            return null;
        }

        // Determine interface name based on source service protocol
        const interfaceName = this.getInterfaceName(sourceId, targetId);

        // Use global HTTP protocol
        const protocol = window.globalHTTPProtocol || 'HTTP/2';

        // Create connection object
        const connection = {
            id: this.generateConnectionId(),
            sourceId: sourceId,
            targetId: targetId,
            interfaceName: interfaceName,
            protocol: protocol,  // Use global protocol
            status: 'connected',
            createdAt: Date.now()
        };

        console.log('✅ Connection created:', connection);

        // Add to data store
        window.dataStore.addConnection(connection);

        // Trigger log engine
        if (window.logEngine) {
            window.logEngine.onConnectionCreated(connection);
        }

        // Re-render canvas
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        return connection;
    }

    /**
     * Generate unique connection ID
     * @returns {string} Unique connection ID
     */
    generateConnectionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 7);
        return `conn-${timestamp}-${random}`;
    }

    /**
     * Validate if connection is allowed between two service types
     * @param {string} sourceType - Source service type
     * @param {string} targetType - Target service type
     * @returns {boolean} True if connection is valid
     */
    isConnectionValid(sourceType, targetType) {
        // For generic services, all services can connect to each other
        if (sourceType === 'Service' && targetType === 'Service') {
            return true;
        }

        // Fallback to original logic for any remaining NF types
        if (!this.validConnections[sourceType]) {
            return false;
        }

        if (this.validConnections[sourceType].includes(targetType)) {
            return true;
        }

        if (this.validConnections[targetType] &&
            this.validConnections[targetType].includes(sourceType)) {
            return true;
        }

        return false;
    }

    /**
     * Get interface name for service connection
     * @param {string} sourceId - Source service ID
     * @param {string} targetId - Target service ID
     * @returns {string} Interface name
     */
    getInterfaceName(sourceId, targetId) {
        // Get the source service to use its protocol
        const sourceService = window.dataStore?.getNFById(sourceId);
        if (sourceService && sourceService.config && sourceService.config.protocol) {
            return sourceService.config.protocol;
        }
        
        // Fallback to HTTP/2
        return 'HTTP/2';
    }

    /**
     * Delete a connection
     * @param {string} connectionId - Connection ID to delete
     */
    deleteConnection(connectionId) {
        const connection = window.dataStore.getConnectionById(connectionId);

        if (!connection) {
            console.warn('⚠️ Connection not found:', connectionId);
            return;
        }

        console.log('🗑️ Deleting connection:', connectionId);

        // Trigger log engine
        if (window.logEngine) {
            window.logEngine.onConnectionDeleted(connection);
        }

        // Remove from data store
        window.dataStore.removeConnection(connectionId);

        // Re-render canvas
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Get all valid connection targets for a given NF
     * @param {string} nfId - Source NF ID
     * @returns {Array} Array of valid target NF IDs
     */
    getValidTargets(nfId) {
        const sourceNF = window.dataStore.getNFById(nfId);
        if (!sourceNF) return [];

        const allNFs = window.dataStore.getAllNFs();
        const validTargets = [];

        allNFs.forEach(nf => {
            if (nf.id !== nfId && this.isConnectionValid(sourceNF.type, nf.type)) {
                validTargets.push(nf);
            }
        });

        return validTargets;
    }

    /**
     * Get connection statistics
     * @returns {Object} Connection statistics
     */
    getConnectionStats() {
        const connections = window.dataStore.getAllConnections();

        return {
            total: connections.length,
            byProtocol: {
                'HTTP/2': connections.filter(c => c.protocol === 'HTTP/2').length
            },
            byStatus: {
                connected: connections.filter(c => c.status === 'connected').length,
                disconnected: connections.filter(c => c.status === 'disconnected').length
            }
        };
    }
}