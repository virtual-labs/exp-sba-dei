/**
 * ============================================
 * NETWORK FUNCTION MANAGER
 * ============================================
 * Manages creation, deletion, and lifecycle of Network Functions
 * 
 * Responsibilities:
 * - Create new NF instances
 * - Generate unique IDs
 * - Assign default configurations
 * - Handle NF positioning on canvas
 * - Track NF counters for naming
 */

class NFManager {
    constructor() {
        // Counter for each NF type for unique naming
        this.nfCounters = {
            'NRF': 0,
            'AMF': 0,
            'SMF': 0,
            'UPF': 0,
            'AUSF': 0,
            'UDM': 0,
            'PCF': 0,
            'NSSF': 0,
            'UDR': 0,
            'gNB': 0,
            'UE': 0,
            'MySQL': 0
        };

        console.log('✅ NFManager initialized');
    }

    /**
     * Create a new Network Function
     * @param {string} type - Type of NF (AMF, SMF, etc.)
     * @param {Object} position - {x, y} coordinates on canvas (optional)
     * @returns {Object} Created NF object
     */

    createNetworkFunction(type, position = null) {
        console.log('🔧 NFManager: Creating NF of type:', type);

        this.nfCounters[type]++;
        const count = this.nfCounters[type];

        if (!position) {
            position = this.calculateAutoPosition(type, count);
        }

        const nfDef = this.getNFDefinition(type);

        // Get global protocol (default HTTP/2)
        const globalProtocol = window.globalHTTPProtocol || 'HTTP/2';

        // Create NF object
        const nf = {
            id: this.generateUniqueId(type),
            type: type,
            name: `${type}-${count}`,
            position: position,
            color: nfDef.color,
            icon: nfDef.icon,
            iconImage: null, // Will store loaded Image object
            status: 'active',
            config: {
                ipAddress: `192.168.1.${10 + count}`,
                port: 8080 + count,
                capacity: 1000,
                load: 0,
                httpProtocol: globalProtocol  // NEW: Add protocol property
            }
        };

        // =========================================
        // LOAD ICON IMAGE FROM SVG FILE
        // =========================================
        if (nf.icon) {
            console.log('🔄 Attempting to load icon for', nf.name + ':', nf.icon);
            console.log('🔍 Current location:', window.location.href);

            // Ensure the path is resolved correctly relative to the current page
            const iconPath = nf.icon.startsWith('http') ? nf.icon : nf.icon;
            const fullIconURL = new URL(iconPath, window.location.href).href;
            console.log('🔍 Full icon URL will be:', fullIconURL);

            const img = new Image();

            // Don't set CORS for local files as it can cause issues
            // img.crossOrigin = 'anonymous';

            img.onload = () => {
                console.log('✅ Icon loaded successfully for', nf.name + ':', nf.icon);
                console.log('✅ Image dimensions:', img.width, 'x', img.height);
                nf.iconImage = img;
                // Re-render to show the loaded icon
                if (window.canvasRenderer) {
                    console.log('🎨 Re-rendering canvas to show loaded icon');
                    window.canvasRenderer.render();
                }
            };

            img.onerror = (error) => {
                console.error('❌ Failed to load icon for', nf.name + ':', nf.icon);
                console.error('❌ Error event:', error);
                console.error('❌ Attempted URL:', img.src);

                // Try alternative paths
                const alternativePaths = [
                    `./${nf.icon}`,
                    `../${nf.icon}`,
                    nf.icon.replace('images/', './images/'),
                    nf.icon.replace('images/', '../images/')
                ];

                let pathIndex = 0;

                function tryNextPath() {
                    if (pathIndex >= alternativePaths.length) {
                        console.error('❌ All alternative paths failed for', nf.name);
                        nf.iconImage = null; // Will show fallback
                        return;
                    }

                    const altPath = alternativePaths[pathIndex++];
                    console.log('🔄 Trying alternative path:', altPath);

                    const alternativeImg = new Image();
                    alternativeImg.onload = () => {
                        console.log('✅ Alternative icon loaded for', nf.name, 'using path:', altPath);
                        nf.iconImage = alternativeImg;
                        if (window.canvasRenderer) {
                            window.canvasRenderer.render();
                        }
                    };
                    alternativeImg.onerror = () => {
                        console.log('❌ Alternative path failed:', altPath);
                        tryNextPath();
                    };
                    alternativeImg.src = altPath;
                }

                tryNextPath();
            };

            // Add a timeout to detect hanging loads
            setTimeout(() => {
                if (!img.complete && !nf.iconImage) {
                    console.warn('⏰ Icon loading timeout for', nf.name + ':', nf.icon);
                }
            }, 5000);

            img.src = iconPath; // This triggers the load
        } else {
            console.warn('⚠️ No icon path defined for NF type:', type);
        }

        console.log('✅ NF created:', nf);

        // Add to data store
        if (window.dataStore) {
            window.dataStore.addNF(nf);
        } else {
            console.error('❌ DataStore not available!');
            return null;
        }

        // Trigger log engine
        if (window.logEngine) {
            window.logEngine.onNFAdded(nf);
        }

        // Force canvas re-render
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        return nf;
    }

    // createNetworkFunction(type, position = null) {
    //     console.log('🔧 NFManager: Creating NF of type:', type);

    //     // Increment counter for this NF type
    //     this.nfCounters[type]++;
    //     const count = this.nfCounters[type];

    //     // Auto-position if not provided
    //     if (!position) {
    //         position = this.calculateAutoPosition(type, count);
    //     }

    //     // Get NF definition (color, icon, etc.)
    //     const nfDef = this.getNFDefinition(type);

    //     // Create NF object
    //     const nf = {
    //         id: this.generateUniqueId(type),
    //         type: type,
    //         name: `${type}-${count}`,
    //         position: position,
    //         color: nfDef.color,
    //         icon: nfDef.icon,
    //         status: 'active',
    //         config: {
    //             ipAddress: `192.168.1.${10 + count}`,
    //             port: 8080 + count,
    //             capacity: 1000,
    //             load: 0
    //         }
    //     };

    //     console.log('✅ NF created:', nf);

    //     // Add to data store
    //     if (window.dataStore) {
    //         window.dataStore.addNF(nf);
    //     } else {
    //         console.error('❌ DataStore not available!');
    //         return null;
    //     }

    //     // Trigger log engine
    //     if (window.logEngine) {
    //         window.logEngine.onNFAdded(nf);
    //     }

    //     // Force canvas re-render
    //     if (window.canvasRenderer) {
    //         window.canvasRenderer.render();
    //     }

    //     return nf;
    // }

    /**
     * Generate unique ID for NF
     * @param {string} type - NF type
     * @returns {string} Unique ID
     */
    generateUniqueId(type) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 7);
        return `${type.toLowerCase()}-${timestamp}-${random}`;
    }

    /**
     * Calculate automatic position for NF on canvas
     * @param {string} type - NF type
     * @param {number} count - Current count of this NF type
     * @returns {Object} {x, y} position
     */
    calculateAutoPosition(type, count) {
        // NEW: Better grid layout with proper spacing
        const nfsPerRow = 6;  // More NFs per row for better utilization
        const nfWidth = 60;   // Smaller width to fit more NFs
        const nfHeight = 80;  // Height including label space
        const marginX = 40;   // Horizontal spacing between NFs
        const marginY = 60;   // Vertical spacing between rows
        const startX = 120;   // Start position X
        const startY = 120;   // Start position Y

        const row = Math.floor((count - 1) / nfsPerRow);
        const col = (count - 1) % nfsPerRow;

        return {
            x: startX + col * (nfWidth + marginX),
            y: startY + row * (nfHeight + marginY)
        };
    }

    /**
     * Get NF definition from global definitions (PUBLIC METHOD)
     * @param {string} type - NF type
     * @returns {Object} NF definition with color, icon, etc.
     */
    getNFDefinition(type) {
        // Try to get from loaded definitions
        if (window.nfDefinitions && window.nfDefinitions[type]) {
            return window.nfDefinitions[type];
        }

        // Fallback default definitions
        const defaultDefs = {
            'NRF': { color: '#9b59b6', icon: null, name: 'Network Repository Function' },
            'AMF': { color: '#3498db', icon: null, name: 'Access and Mobility Management' },
            'SMF': { color: '#00bcd4', icon: null, name: 'Session Management Function' },
            'UPF': { color: '#4caf50', icon: null, name: 'User Plane Function' },
            'AUSF': { color: '#ff9800', icon: null, name: 'Authentication Server Function' },
            'UDM': { color: '#ff5722', icon: null, name: 'Unified Data Management' },
            'PCF': { color: '#e91e63', icon: null, name: 'Policy Control Function' },
            'NSSF': { color: '#ffc107', icon: null, name: 'Network Slice Selection' },
            'UDR': { color: '#009688', icon: null, name: 'Unified Data Repository' },
            'gNB': { color: '#8e44ad', icon: null, name: 'gNodeB (5G Base Station)' },
            'UE': { color: '#16a085', icon: null, name: 'User Equipment' },
            'MySQL': { color: '#d35400', icon: null, name: 'MySQL Database' }
        };

        return defaultDefs[type] || { color: '#95a5a6', icon: null, name: type };
    }

    /**
     * Delete a Network Function
     * @param {string} nfId - ID of NF to delete
     */
    deleteNetworkFunction(nfId) {
        const nf = window.dataStore.getNFById(nfId);

        if (!nf) {
            console.warn('⚠️ NF not found:', nfId);
            return;
        }

        console.log('🗑️ Deleting NF:', nf.name);

        // Trigger log engine before deletion
        if (window.logEngine) {
            window.logEngine.onNFRemoved(nf);
        }

        // Remove from data store (this also removes connections)
        window.dataStore.removeNF(nfId);

        // Re-render canvas
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Update NF configuration
     * @param {string} nfId - NF ID
     * @param {Object} config - New configuration values
     */
    updateNFConfig(nfId, config) {
        const nf = window.dataStore.getNFById(nfId);

        if (!nf) {
            console.warn('⚠️ NF not found:', nfId);
            return;
        }

        // Update config
        Object.assign(nf.config, config);

        // Update in data store
        window.dataStore.updateNF(nfId, { config: nf.config });

        console.log('✅ NF config updated:', nf.name);

        // Re-render canvas
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Move NF to new position
     * @param {string} nfId - NF ID
     * @param {Object} position - New {x, y} position
     */
    moveNF(nfId, position) {
        const nf = window.dataStore.getNFById(nfId);

        if (!nf) return;

        nf.position = position;
        window.dataStore.updateNF(nfId, { position });

        // Re-render canvas
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Get count of NFs by type
     * @param {string} type - NF type
     * @returns {number} Count of NFs of this type
     */
    getNFCountByType(type) {
        const allNFs = window.dataStore.getAllNFs();
        return allNFs.filter(nf => nf.type === type).length;
    }

    /**
     * Get all NF types that exist in topology
     * @returns {Array} Array of unique NF types
     */
    getExistingNFTypes() {
        const allNFs = window.dataStore.getAllNFs();
        const types = allNFs.map(nf => nf.type);
        return [...new Set(types)]; // Unique types only
    }

    /**
     * Update ALL NFs to use new HTTP protocol
     * @param {string} newProtocol - 'HTTP/1' or 'HTTP/2'
     */
    updateGlobalProtocol(newProtocol) {
        console.log('🔄 Updating global HTTP protocol to:', newProtocol);

        // Update global variable
        window.globalHTTPProtocol = newProtocol;

        // Update all existing NFs
        const allNFs = window.dataStore?.getAllNFs() || [];
        let updateCount = 0;

        allNFs.forEach(nf => {
            if (nf.config.httpProtocol !== newProtocol) {
                const previousProtocol = nf.config.httpProtocol;
                nf.config.httpProtocol = newProtocol;
                window.dataStore.updateNF(nf.id, { config: nf.config });
                updateCount++;

                // Add log for protocol change
                if (window.logEngine) {
                    window.logEngine.addLog(nf.id, 'INFO',
                        `HTTP protocol updated to ${newProtocol}`, {
                        previousProtocol: previousProtocol || 'Unknown',
                        newProtocol: newProtocol,
                        reason: 'Global protocol synchronization'
                    });
                }
            }
        });

        console.log(`✅ Updated ${updateCount} NFs to ${newProtocol}`);

        // Update all connections
        const allConnections = window.dataStore?.getAllConnections() || [];
        allConnections.forEach(conn => {
            conn.protocol = newProtocol;
        });

        // Re-render canvas
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        return updateCount;
    }
}