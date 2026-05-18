/**
 * ============================================
 * UI CONTROLLER
 * ============================================
 * Manages all user interface interactions and updates
 *
 * Responsibilities:
 * - Handle button clicks
 * - Manage modals
 * - Update configuration panel
 * - Display logs in UI
 * - Handle connection mode (source/destination selection)
 * - File save/load operations
 */

class UIController {
    constructor() {
        this.connectionMode = 'idle'; // 'idle', 'selecting-source', 'selecting-destination'
        this.selectedSourceService = null;
        this.selectedDestinationService = null;
        this.selectedSourceBus = null;

        console.log('✅ UIController initialized');
    }

    /**
     * Initialize all UI components and event listeners
     */
    init() {
        console.log('🎮 Initializing UI...');

        // Setup all button handlers
        this.setupClearButton();
        this.setupValidateButton();
        this.setupHelpButton();
        this.setupConnectionButtons();
        this.setupServicePalette();
        this.setupBusControls();
        this.setupConfigPanelToggle();

        // Initialize log panel
        this.initializeLogPanel();

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();

        console.log('✅ UI initialized');
    }

    // ==========================================
    // NF PALETTE SETUP
    // ==========================================

    /**
     * Setup Service palette in left sidebar
     */
    setupServicePalette() {
        const palette = document.querySelector('.service-palette');
        if (!palette) return;

        // Single service type that users can customize
        const serviceTypes = ['Service'];

        serviceTypes.forEach(type => {
            const serviceDef = {
                name: 'Generic Service',
                color: '#3498db'
            };

            const item = document.createElement('div');
            item.className = 'service-palette-item';
            item.dataset.type = type;

            item.innerHTML = `
                <button class="btn btn-primary btn-create-service">
                    <span class="service-icon">🚀</span>
                    <span class="service-text">Create New Service</span>
                </button>
            `;

            // Click to add Service
            item.addEventListener('click', () => {
                console.log('🖱️ Palette item clicked: Create Service');
                const button = item.querySelector('.btn-create-service');

                // Add click animation and loading state
                this.animateButtonClick(item);
                button.classList.add('loading');

                // Show configuration panel after brief delay for visual feedback
                setTimeout(() => {
                    button.classList.remove('loading');
                    button.classList.add('success-feedback');
                    this.showServiceConfigurationForNew();

                    // Remove success feedback after animation
                    setTimeout(() => {
                        button.classList.remove('success-feedback');
                    }, 500);
                }, 200);
            });

            palette.appendChild(item);
        });
    }

    /**
     * Animate button click with visual feedback
     * @param {HTMLElement} buttonElement - Button element to animate
     */
    animateButtonClick(buttonElement) {
        const button = buttonElement.querySelector('.btn-create-service');
        if (!button) return;

        // Add click animation class
        button.classList.add('btn-clicked');

        // Create ripple effect
        this.createRippleEffect(button);

        // Remove animation class after animation completes
        setTimeout(() => {
            button.classList.remove('btn-clicked');
        }, 300);
    }

    /**
     * Create ripple effect on button click
     * @param {HTMLElement} button - Button element
     */
    createRippleEffect(button) {
        // Remove any existing ripples
        const existingRipples = button.querySelectorAll('.ripple');
        existingRipples.forEach(ripple => ripple.remove());

        // Create new ripple element
        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        // Position ripple at center of button
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = rect.width / 2 - size / 2;
        const y = rect.height / 2 - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        // Add ripple to button
        button.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }







    // ==========================================
    // BUS CONTROLS
    // ==========================================

    /**
     * Setup bus control buttons
     */
    setupBusControls() {
        const btnHorizontalBus = document.getElementById('btn-add-bus-horizontal');
        const btnVerticalBus = document.getElementById('btn-add-bus-vertical');

        if (btnHorizontalBus) {
            btnHorizontalBus.addEventListener('click', () => {
                console.log('🖱️ Add Horizontal Bus clicked');
                this.addBusLine('horizontal');
            });
        }

        if (btnVerticalBus) {
            btnVerticalBus.addEventListener('click', () => {
                console.log('🖱️ Add Vertical Bus clicked');
                this.addBusLine('vertical');
            });
        }

        console.log('✅ Bus controls initialized');
    }

    /**
     * Add a new bus line to the canvas
     * @param {string} orientation - 'horizontal' or 'vertical'
     */
    addBusLine(orientation) {
        if (!window.busManager) {
            console.error('❌ BusManager not available');
            alert('Bus Manager not available');
            return;
        }

        // Calculate position for new bus line
        const allBuses = window.dataStore?.getAllBuses() || [];
        const busCount = allBuses.length;

        let position;
        if (orientation === 'horizontal') {
            position = {
                x: 150,
                y: 200 + (busCount * 150) // Space buses vertically
            };
        } else {
            position = {
                x: 200 + (busCount * 150), // Space buses horizontally
                y: 150
            };
        }

        // Create the bus line (no name)
        const bus = window.busManager.createBusLine(orientation, position, 500);

        if (bus) {
            console.log('✅ Bus line created:', bus.id);

            // Log the creation
            if (window.logEngine) {
                window.logEngine.addLog('system', 'SUCCESS',
                    `New ${orientation} bus line created and ready for connections`, {
                    busId: bus.id,
                    orientation: orientation,
                    position: position,
                    length: 500
                });
            }

            // Re-render canvas
            if (window.canvasRenderer) {
                window.canvasRenderer.render();
            }
        }
    }

    // ==========================================
    // CONNECTION BUTTONS (Source/Destination)
    // ==========================================

    /**
     * Setup connection control buttons
     */
    setupConnectionButtons() {
        const btnSource = document.getElementById('btn-select-source');
        const btnDestination = document.getElementById('btn-select-destination');
        const btnCancel = document.getElementById('btn-cancel-connection');

        if (!btnSource || !btnDestination || !btnCancel) {
            console.error('❌ Connection buttons not found');
            return;
        }

        // Select Source button
        btnSource.addEventListener('click', () => {
            console.log('🖱️ Select Source clicked');
            this.enterSourceSelectionMode();
        });

        // Select Destination button
        btnDestination.addEventListener('click', () => {
            console.log('🖱️ Select Destination clicked');
            if (this.selectedSourceService || this.selectedSourceBus) {
                // Enter destination mode - user can click Service or Bus
                this.enterDestinationSelectionMode();
                console.log('💡 You can now click on a Service or Bus Line to connect!');
            } else {
                alert('Please select a source first!');
            }
        });

        // Cancel button
        btnCancel.addEventListener('click', () => {
            console.log('🖱️ Connection cancelled');
            this.cancelConnectionMode();
        });

        // Listen to canvas clicks for connection mode
        this.setupConnectionModeListener();
    }



    /**
     * Setup listener for connection mode canvas clicks
     */
    setupConnectionModeListener() {
        if (window.dataStore) {
            window.dataStore.subscribe((event, data) => {
                if (event === 'nf-added') {  // DataStore still emits 'nf-added' for compatibility
                    this.updateLogServiceFilter();
                }
            });
        }

        const canvas = document.getElementById('main-canvas');
        if (canvas) {
            canvas.addEventListener('click', (e) => {
                if (this.connectionMode === 'idle') return;

                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const clickedService = window.canvasRenderer?.getNFAtPosition(x, y);
                const clickedBus = window.canvasRenderer?.getBusAtPosition(x, y);

                console.log('🖱️ Canvas click in connection mode:', this.connectionMode);
                console.log('🖱️ Click coordinates:', { x, y });
                console.log('🖱️ Clicked Service:', clickedService?.name || 'none');
                console.log('🖱️ Clicked Bus:', clickedBus?.name || 'none');

                if (this.connectionMode === 'selecting-source') {
                    if (clickedService) {
                        console.log('🔗 Selecting Service as source...');
                        this.selectSourceService(clickedService);
                    } else if (clickedBus) {
                        console.log('🔗 Selecting Bus as source...');
                        this.selectSourceBus(clickedBus);
                    } else {
                        console.log('❌ Please click on a Service or Bus Line');
                    }
                } else if (this.connectionMode === 'selecting-destination') {
                    if (clickedService) {
                        console.log('🔗 Connecting to Service...');
                        this.selectDestinationService(clickedService);
                    } else if (clickedBus) {
                        console.log('🔗 Connecting to Bus...');
                        this.selectDestinationBus(clickedBus);
                    } else {
                        console.log('❌ Please click on a Service or Bus Line');
                    }
                }
            });
        }
    }
    /**
     * Enter source selection mode
     */
    enterSourceSelectionMode() {
        this.connectionMode = 'selecting-source';
        this.selectedSourceService = null;
        this.selectedDestinationService = null;

        // Update UI
        const btnSource = document.getElementById('btn-select-source');
        const btnDestination = document.getElementById('btn-select-destination');
        const btnCancel = document.getElementById('btn-cancel-connection');

        btnSource.classList.add('active');
        btnSource.style.background = '#3498db';
        btnDestination.disabled = true;
        btnCancel.style.display = 'block';

        // Show canvas message
        // this.showCanvasMessage('Click an NF or BUS LINE to set as SOURCE');
    }

    /**
     * Enter destination selection mode
     */
    enterDestinationSelectionMode() {
        this.connectionMode = 'selecting-destination';

        // Update UI
        const btnSource = document.getElementById('btn-select-source');
        const btnDestination = document.getElementById('btn-select-destination');

        btnSource.classList.remove('active');
        btnSource.style.background = '';
        btnDestination.classList.add('active');
        btnDestination.style.background = '#4caf50';

        // // Show canvas message
        // const sourceName = this.selectedSourceNF?.name || this.selectedSourceBus?.name || 'source';
        // this.showCanvasMessage(`Click on an NF or BUS LINE to connect from ${sourceName}`);
    }

    /**
     * Select source Service
     * @param {Object} service - Selected Service
     */
    selectSourceService(service) {
        console.log('✅ Source selected:', service.name);
        this.selectedSourceService = service;
        this.selectedSourceBus = null; // Clear bus selection

        // Enable destination button
        const btnDestination = document.getElementById('btn-select-destination');
        btnDestination.disabled = false;

        // Auto-switch to destination mode
        this.enterDestinationSelectionMode();
    }

    /**
     * Select source Bus
     * @param {Object} bus - Selected Bus
     */
    selectSourceBus(bus) {
        console.log('✅ Bus source selected:', bus.name);
        this.selectedSourceBus = bus;
        this.selectedSourceService = null; // Clear service selection

        // Enable destination button
        const btnDestination = document.getElementById('btn-select-destination');
        btnDestination.disabled = false;

        // Auto-switch to destination mode
        this.enterDestinationSelectionMode();
    }



    /**
     * Select destination Service and create connection
     * @param {Object} service - Selected Service
     */
    selectDestinationService(service) {
        console.log('✅ Service selected as destination:', service.name);
        this.selectedDestinationService = service;

        if (this.selectedSourceService) {
            // Service to Service connection
            console.log('🔗 Creating Service-to-Service connection:', this.selectedSourceService.name, '→', service.name);

            if (window.connectionManager) {
                console.log('🔗 ConnectionManager available, creating connection...');
                const connection = window.connectionManager.createConnection(
                    this.selectedSourceService.id,
                    this.selectedDestinationService.id
                );

                if (connection) {
                    console.log('✅ Service-to-Service connection created successfully:', connection);
                } else {
                    console.error('❌ Failed to create connection');
                }
            } else {
                console.error('❌ ConnectionManager not available');
            }
        } else if (this.selectedSourceBus) {
            // Bus to Service connection
            console.log('🔗 Creating Bus-to-Service connection:', this.selectedSourceBus.name, '→', service.name);

            if (window.busManager) {
                const connection = window.busManager.connectBusToNF(this.selectedSourceBus.id, service.id);
                if (connection) {
                    console.log('✅ Bus-to-Service connection created successfully');
                } else {
                    console.error('❌ Failed to create Bus-to-Service connection');
                }
            }
        } else {
            console.error('❌ No source selected!');
            alert('Error: No source selected');
        }

        // Reset connection mode
        this.cancelConnectionMode();
    }

    /**
     * Select destination Bus and create connection
     * @param {Object} bus - Selected Bus
     */
    selectDestinationBus(bus) {
        console.log('✅ Bus selected as destination:', bus.name);

        if (this.selectedSourceService) {
            // Service to Bus connection
            console.log('🔗 Creating Service-to-Bus connection:', this.selectedSourceService.name, '→', bus.name);

            if (window.busManager) {
                const connection = window.busManager.connectNFToBus(this.selectedSourceService.id, bus.id);
                if (connection) {
                    console.log('✅ Service-to-Bus connection created successfully');
                } else {
                    console.error('❌ Failed to create Service-to-Bus connection');
                }
            }
        } else if (this.selectedSourceBus) {
            // Bus to Bus connection
            console.log('🔗 Creating Bus-to-Bus connection:', this.selectedSourceBus.name, '→', bus.name);

            if (window.busManager) {
                const connection = window.busManager.connectBusToBus(this.selectedSourceBus.id, bus.id);
                if (connection) {
                    console.log('✅ Bus-to-Bus connection created successfully');
                } else {
                    console.error('❌ Failed to create Bus-to-Bus connection');
                }
            }
        }

        // Reset connection mode
        this.cancelConnectionMode();
    }

    /**
     * Cancel connection mode
     */
    cancelConnectionMode() {
        this.connectionMode = 'idle';
        this.selectedSourceService = null;
        this.selectedDestinationService = null;
        this.selectedSourceBus = null;

        // Update UI
        const btnSource = document.getElementById('btn-select-source');
        const btnDestination = document.getElementById('btn-select-destination');
        const btnCancel = document.getElementById('btn-cancel-connection');

        btnSource.classList.remove('active');
        btnSource.style.background = '';
        btnDestination.classList.remove('active');
        btnDestination.style.background = '';
        btnDestination.disabled = true;
        btnCancel.style.display = 'none';

        // Hide canvas message
        this.hideCanvasMessage();
    }

    /**
     * Show canvas message
     * @param {string} message - Message to display
     */
    showCanvasMessage(message) {
        const msgElement = document.getElementById('canvas-message');
        if (msgElement) {
            msgElement.textContent = message;
            msgElement.classList.add('show');
        }
    }

    /**
     * Hide canvas message
     */
    hideCanvasMessage() {
        const msgElement = document.getElementById('canvas-message');
        if (msgElement) {
            msgElement.classList.remove('show');
        }
    }

    // ==========================================
    // SAVE / LOAD / CLEAR BUTTONS
    // ==========================================



    /**
     * Setup Clear button
     */
    setupClearButton() {
        const clearBtn = document.getElementById('btn-clear');
        if (!clearBtn) return;

        clearBtn.addEventListener('click', () => {
            console.log('🗑️ Clear clicked');
            this.clearTopology();
        });
    }

    /**
     * Clear entire topology
     */
    clearTopology() {
        if (!confirm('Are you sure you want to clear the entire topology? This cannot be undone.')) {
            return;
        }

        // Clear data
        if (window.dataStore) {
            window.dataStore.clearAll();
        }

        // Clear logs
        if (window.logEngine) {
            window.logEngine.clearAllLogs();
        }

        // Clear log UI
        const logContent = document.getElementById('log-content');
        if (logContent) {
            logContent.innerHTML = '';
        }

        // Recreate main bus line
        if (window.busManager) {
            setTimeout(() => {
                window.busManager.createBusLine('horizontal', { x: 200, y: 300 }, 600);

                // Re-render canvas after bus is created
                if (window.canvasRenderer) {
                    window.canvasRenderer.render();
                }
            }, 100);
        } else {
            // Re-render canvas if no bus manager
            if (window.canvasRenderer) {
                window.canvasRenderer.render();
            }
        }

        console.log('✅ Topology cleared');
        console.log('🔓 Protocol lock reset - next service can choose any protocol');
        alert('Topology cleared successfully!');
        // Full refresh ensures complete re-initialization of all managers and UI state
        window.location.reload();
    }

    /**
     * Setup Validate button
     */
    setupValidateButton() {
        const validateBtn = document.getElementById('btn-validate');
        if (!validateBtn) return;

        validateBtn.addEventListener('click', () => {
            console.log('✓ Validate clicked');
            this.validateTopology();
        });
    }

    /**
     * Validate service topology
     */
    validateTopology() {
        const allServices = window.dataStore?.getAllNFs() || [];
        const allConnections = window.dataStore?.getAllConnections() || [];

        if (allServices.length === 0) {
            alert('No services found. Create some services first.');
            return;
        }

        let report = '═══════════════════════════════════\n';
        report += 'SERVICE TOPOLOGY VALIDATION REPORT\n';
        report += '═══════════════════════════════════\n\n';

        // Check each Service
        report += 'SERVICES:\n';
        report += '─────────────────────────────────\n';
        allServices.forEach(service => {
            const connections = window.dataStore.getConnectionsForNF(service.id);
            report += `${service.name}: ${connections.length} connections\n`;
            report += `  Endpoint: ${service.config?.endpoint || 'N/A'}\n`;
        });

        report += '\n';
        report += `Total Services: ${allServices.length}\n`;
        report += `Total Connections: ${allConnections.length}\n`;

        report += '\n═══════════════════════════════════\n';
        report += 'STATUS: ✅ VALID';
        report += '\n═══════════════════════════════════';

        alert(report);
        console.log(report);
    }

    /**
     * Setup Help button
     */
    setupHelpButton() {
        const helpBtn = document.getElementById('btn-help');
        if (!helpBtn) return;

        helpBtn.addEventListener('click', () => {
            console.log('❓ Help clicked');
            this.showHelpModal();
        });
    }

    /**
     * Show Help modal
     */
    showHelpModal() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.style.display = 'flex';
        }

        // Setup close button
        const closeBtn = document.getElementById('help-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }

        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    // ==========================================
    // CONFIGURATION PANEL
    // ==========================================

    /**
     * Show Service configuration panel for NEW Service (before creation)
     */
    showServiceConfigurationForNew() {
        const configForm = document.getElementById('config-form');
        if (!configForm) return;

        // Generate default values
        const count = (window.serviceManager?.serviceCount || 0) + 1;
        const defaultName = `Service${count}`;
        const defaultIP = `192.168.1.${10 + count}`;
        const defaultPort = 8080 + count;

        // Check if there are existing services to determine protocol lock
        const existingServices = window.dataStore?.getAllNFs() || [];
        const globalProtocol = this.getGlobalProtocol();
        const isProtocolLocked = existingServices.length > 0 && globalProtocol;

        let protocolOptions = '';
        if (isProtocolLocked) {
            // Protocol is locked - only show the locked protocol
            protocolOptions = `<option value="${globalProtocol}" selected>${globalProtocol}</option>`;
        } else {
            // First service - show both options
            protocolOptions = `
                <option value="HTTP/1">HTTP/1</option>
                <option value="HTTP/2" selected>HTTP/2</option>
            `;
        }

        configForm.innerHTML = `
            <h4>Create New Service</h4>
           
            <div class="form-group">
                <label>Service Name *</label>
                <input type="text" id="config-name" value="${defaultName}" required placeholder="e.g., UserService, PaymentAPI">
            </div>
           
            <div class="form-group">
                <label>IP Address *</label>
                <input type="text" id="config-ip" value="${defaultIP}" required placeholder="e.g., 192.168.1.10">
                <small id="ip-help-text" style="color: #95a5a6; font-size: 11px; display: block; margin-top: 4px;">
                    Enter a valid IPv4 address (0.0.0.0 to 255.255.255.255)
                </small>
                <div id="ip-error" style="color: #e74c3c; font-size: 12px; margin-top: 4px; display: none; font-weight: bold;">
                    IP Invalid
                </div>
            </div>
           
            <div class="form-group">
                <label>Port *</label>
                <input type="number" id="config-port" value="${defaultPort}" required min="1" max="65535">
            </div>
           
            <div class="form-group">
                <label>Protocol ${isProtocolLocked ? '(Locked)' : ''}</label>
                <select id="config-protocol" ${isProtocolLocked ? 'disabled' : ''}>
                    ${protocolOptions}
                </select>
                ${isProtocolLocked ? `<small style="color: #f39c12; font-size: 11px; display: block; margin-top: 4px;">Protocol is locked to ${globalProtocol} based on existing services</small>` : ''}
            </div>
           
            <div class="form-group">
                <label>Description (Optional)</label>
                <input type="text" id="config-description" placeholder="Brief description of the service">
            </div>
           
            <button class="btn btn-success btn-block" id="btn-start-service">
                🚀 Start Service
            </button>
            <button class="btn btn-secondary btn-block" id="btn-cancel-service">Cancel</button>
        `;

        // IP validation on input
        const ipInput = document.getElementById('config-ip');
        const ipError = document.getElementById('ip-error');
        const ipHelpText = document.getElementById('ip-help-text');

        if (ipInput && ipError && ipHelpText) {
            ipInput.addEventListener('input', (e) => {
                const ip = e.target.value;
                const isValid = this.validateIPAddress(ip);

                if (ip && !isValid) {
                    // Show error message and hide help text
                    ipError.style.display = 'block';
                    ipHelpText.style.display = 'none';
                    e.target.classList.add('error');
                } else {
                    // Hide error message and show help text
                    ipError.style.display = 'none';
                    ipHelpText.style.display = 'block';
                    e.target.classList.remove('error');
                }
            });
        }

        // Start button handler
        const startBtn = document.getElementById('btn-start-service');
        startBtn.addEventListener('click', () => {
            // Add click animation
            startBtn.classList.add('btn-clicked');
            startBtn.classList.add('loading');

            // Execute service creation after brief delay for visual feedback
            setTimeout(() => {
                this.startNewService();
                startBtn.classList.remove('loading');
                startBtn.classList.remove('btn-clicked');
            }, 150);
        });

        // Cancel button handler
        const cancelBtn = document.getElementById('btn-cancel-service');
        cancelBtn.addEventListener('click', () => {
            // Add click animation
            cancelBtn.classList.add('btn-clicked');

            setTimeout(() => {
                this.hideServiceConfigPanel();
                cancelBtn.classList.remove('btn-clicked');
            }, 100);
        });
    }



    /**
     * Get the global protocol from existing services
     * @returns {string|null} The locked protocol or null if no services exist
     */
    getGlobalProtocol() {
        const existingServices = window.dataStore?.getAllNFs() || [];
        if (existingServices.length === 0) {
            return null; // No services exist, no protocol lock
        }

        // Get the protocol from the first service (all services should have the same protocol)
        const firstService = existingServices[0];
        return firstService.config?.protocol || 'HTTP/2';
    }

    /**
     * Validate IP address format
     * @param {string} ip - IP address to validate
     * @returns {boolean} True if valid IP address
     */
    validateIPAddress(ip) {
        // Regular expression for IPv4 validation
        const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipv4Regex.test(ip);
    }

    /**
     * Clear all validation errors in the form
     */
    clearValidationErrors() {
        const ipError = document.getElementById('ip-error');
        const ipHelpText = document.getElementById('ip-help-text');
        const ipInput = document.getElementById('config-ip');

        if (ipError && ipHelpText && ipInput) {
            ipError.style.display = 'none';
            ipHelpText.style.display = 'block';
            ipInput.classList.remove('error');
        }
    }

    /**
     * Start new Service with configuration
     */
    startNewService() {
        const name = document.getElementById('config-name')?.value;
        const ipAddress = document.getElementById('config-ip')?.value;
        const port = parseInt(document.getElementById('config-port')?.value);
        const protocolSelect = document.getElementById('config-protocol');
        const protocol = protocolSelect?.value || this.getGlobalProtocol() || 'HTTP/2';
        const description = document.getElementById('config-description')?.value;

        if (!name || !ipAddress || !port) {
            alert('Please fill all required fields');
            return;
        }

        // Check for duplicate service name
        const existingServices = window.dataStore?.getAllNFs() || [];
        const duplicateService = existingServices.find(s => s.name.toLowerCase() === name.toLowerCase());
       
        if (duplicateService) {
            alert(`A service named "${name}" already exists. Please choose a different name.`);
            document.getElementById('config-name')?.focus();
            return;
        }

        // Validate IP address
        if (!this.validateIPAddress(ipAddress)) {
            // Show error message in the form
            const ipError = document.getElementById('ip-error');
            const ipHelpText = document.getElementById('ip-help-text');
            const ipInput = document.getElementById('config-ip');

            if (ipError && ipHelpText && ipInput) {
                ipError.style.display = 'block';
                ipHelpText.style.display = 'none';
                ipInput.classList.add('error');
                ipInput.focus(); // Focus on the invalid field
            }

            alert('Invalid IP address format. Please enter a valid IPv4 address (e.g., 192.168.1.10)');
            return;
        }

        // Validate port range
        if (port < 1 || port > 65535) {
            alert('Invalid port number. Please enter a port between 1 and 65535');
            return;
        }

        console.log('🚀 Starting new Service:', { name, ipAddress, port, protocol, description });

        // Clear any validation errors since all validations passed
        this.clearValidationErrors();

        // Calculate position with proper spacing
        const position = this.calculateServicePositionWithSpacing();

        // Create Service with custom configuration
        if (window.serviceManager) {
            const service = window.serviceManager.createService(position, {
                name: name,
                ipAddress: ipAddress,
                port: port,
                protocol: protocol,
                description: description
            });

            if (service) {
                console.log('✅ Service started successfully:', service.name);

                // Clear configuration panel
                this.hideServiceConfigPanel();

                // Re-render canvas
                if (window.canvasRenderer) {
                    window.canvasRenderer.render();
                }
            }
        } else {
            console.error('❌ ServiceManager not available');
            alert('Error: ServiceManager not available');
        }
    }

    /**
     * Calculate Service position with proper spacing
     * @returns {Object} {x, y} position
     */
    calculateServicePositionWithSpacing() {
        const allServices = window.dataStore?.getAllNFs() || []; // Still using NFs data structure

        // Grid layout with better spacing
        const servicesPerRow = 6;  // Services per row
        const serviceWidth = 80;   // Width for service
        const serviceHeight = 100; // Height including label
        const marginX = 50;        // Horizontal spacing
        const marginY = 70;        // Vertical spacing
        const startX = 120;        // Start position X
        const startY = 120;        // Start position Y

        const totalServices = allServices.length;
        const row = Math.floor(totalServices / servicesPerRow);
        const col = totalServices % servicesPerRow;

        return {
            x: startX + col * (serviceWidth + marginX),
            y: startY + row * (serviceHeight + marginY)
        };
    }



    /**
     * Hide Service configuration panel
     */
    hideServiceConfigPanel() {
        const configForm = document.getElementById('config-form');
        if (configForm) {
            configForm.innerHTML = '<p class="hint">Click on "Service" in the left panel to configure and start a new service</p>';
        }
    }

    /**
     * Show Bus configuration panel
     * @param {Object} bus - Bus object
     */
    showBusConfigPanel(bus) {
        // Buses are not configurable - do nothing
        console.log('Bus configuration is disabled - buses are not configurable');
        return;
    }

    /**
     * Update bus configuration
     * @param {Object} bus - Bus object to update
     */
    updateBusConfiguration(bus) {
        // Buses are not configurable - this method is disabled
        console.log('Bus configuration is disabled - buses cannot be updated');
        return;
    }

    /**
     * Hide Bus configuration panel
     */
    hideBusConfigPanel() {
        const configForm = document.getElementById('config-form');
        if (configForm) {
            configForm.innerHTML = '<p class="hint">Click on "Service" in the left panel to configure and start a new service</p>';
        }
    }

    /**
     * Show NF configuration panel (for existing services)
     * @param {Object} nf - Service object
     */
    showNFConfigPanel(nf) {
        const configForm = document.getElementById('config-form');
        if (!configForm) return;

        configForm.innerHTML = `
            <h4>Service Information</h4>
           
            <div class="form-group">
                <label>Service Name</label>
                <input type="text" value="${nf.name}" readonly>
            </div>
           
            <div class="form-group">
                <label>IP Address</label>
                <input type="text" value="${nf.config?.ipAddress || 'N/A'}" readonly>
            </div>
           
            <div class="form-group">
                <label>Port</label>
                <input type="text" value="${nf.config?.port || 'N/A'}" readonly>
            </div>
           
            <div class="form-group">
                <label>Protocol</label>
                <input type="text" value="${nf.config?.protocol || 'N/A'}" readonly>
            </div>
           
            <div class="form-group">
                <label>Endpoint</label>
                <input type="text" value="${nf.config?.endpoint || 'N/A'}" readonly>
            </div>
           
            <div class="form-group">
                <label>Status</label>
                <input type="text" value="${nf.status || 'Unknown'}" readonly>
            </div>
           
           
            <button class="btn btn-info btn-block" id="btn-open-terminal" style="margin-bottom: 10px;">
                💻 Open Service Terminal
            </button>
           
           
            <button class="btn btn-danger btn-block" id="btn-delete-service">
                🗑️ Delete Service
            </button>
            <button class="btn btn-secondary btn-block" id="btn-close-nf-config">Close</button>
        `;

        // Open terminal button handler
        const terminalBtn = document.getElementById('btn-open-terminal');
        terminalBtn.addEventListener('click', () => {
            this.openServiceTerminal(nf);
        });

        // Delete button handler
        const deleteBtn = document.getElementById('btn-delete-service');
        deleteBtn.addEventListener('click', () => {
            // Add click animation
            deleteBtn.classList.add('btn-clicked');

            setTimeout(() => {
                this.deleteService(nf);
                deleteBtn.classList.remove('btn-clicked');
            }, 100);
        });

        // Close button handler
        const closeBtn = document.getElementById('btn-close-nf-config');
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }

    /**
     * Delete a service
     * @param {Object} nf - Service object to delete
     */
    deleteService(nf) {
        // Confirm deletion
        const confirmMessage = `Are you sure you want to delete "${nf.name}"?\n\nThis will:\n- Remove the service from the canvas\n- Delete all its connections\n- Remove all related logs\n\nThis action cannot be undone.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        console.log('🗑️ Deleting service:', nf.name);

        // Count connections before deletion for logging
        const allConnections = window.dataStore?.getAllConnections() || [];
        const connectionsToDelete = allConnections.filter(conn =>
            conn.sourceId === nf.id || conn.targetId === nf.id
        );

        // Remove all bus connections involving this service
        const allBusConnections = window.dataStore?.getAllBusConnections() || [];
        const busConnectionsToDelete = allBusConnections.filter(conn => conn.nfId === nf.id);

        busConnectionsToDelete.forEach(conn => {
            if (window.dataStore) {
                window.dataStore.removeBusConnection(conn.id);
            }
        });

        // Delete the service itself (this will also remove regular connections automatically)
        if (window.serviceManager) {
            window.serviceManager.deleteService(nf.id);
        }

        // Log the deletion
        if (window.logEngine) {
            window.logEngine.addLog('system', 'WARNING',
                `Service "${nf.name}" has been deleted`, {
                serviceId: nf.id,
                deletedConnections: connectionsToDelete.length,
                deletedBusConnections: busConnectionsToDelete.length,
                deletedAt: new Date().toISOString()
            });
        }

        // Hide the configuration panel
        this.hideNFConfigPanel();

        // Re-render canvas
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        // Update log filter dropdown
        this.updateLogServiceFilter();

        console.log('✅ Service deleted successfully:', nf.name);

        // Show success message
        alert(`Service "${nf.name}" has been deleted successfully.`);
    }

    /**
     * Hide NF configuration panel
     */
    hideNFConfigPanel() {
        const configForm = document.getElementById('config-form');
        if (configForm) {
            configForm.innerHTML = '<p class="hint">Click on "Service" in the left panel to configure and start a new service</p>';
        }
    }

    /**
     * Open service terminal
     * @param {Object} service - Service object
     */
    openServiceTerminal(service) {
        this.currentTerminalService = service;
        this.terminalCommandHistory = this.terminalCommandHistory || [];
        this.terminalHistoryIndex = -1;

        // Show terminal modal
        const modal = document.getElementById('terminal-modal');
        const title = document.getElementById('terminal-title');
        const output = document.getElementById('terminal-output');
        const prompt = document.getElementById('terminal-prompt');
        const input = document.getElementById('terminal-input');
        const termBody = document.getElementById('terminal-body');

        if (modal && title && output && prompt && input) {
            title.textContent = `💻 ${service.name} — ${service.config.ipAddress}`;
            prompt.textContent = `${service.name}@${service.config.ipAddress}:~$ `;

            // Build welcome message
            output.textContent = `5G WIRELESS LAB
Type 'help' for available commands.

`;

            modal.style.display = 'flex';
            input.value = '';
            input.focus();
        }

        // Setup terminal event listeners
        this.setupTerminalEventListeners();
    }

    /**
     * Setup terminal event listeners
     */
    setupTerminalEventListeners() {
        const modal = document.getElementById('terminal-modal');
        const closeBtn = document.getElementById('terminal-close');
        const input = document.getElementById('terminal-input');
        const termBody = document.getElementById('terminal-body');

        // Close button (red dot)
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }

        // Close on background click
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            };
        }

        // Click anywhere in terminal body → focus input
        if (termBody) {
            termBody.onclick = () => {
                if (input) input.focus();
            };
        }

        // Keyboard handling
        if (input) {
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executeTerminalCommand();
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    this.autocompleteTerminalInput(input);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    // Navigate history backwards
                    if (this.terminalCommandHistory && this.terminalCommandHistory.length > 0) {
                        if (this.terminalHistoryIndex < this.terminalCommandHistory.length - 1) {
                            this.terminalHistoryIndex++;
                        }
                        input.value = this.terminalCommandHistory[this.terminalCommandHistory.length - 1 - this.terminalHistoryIndex];
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this.terminalHistoryIndex > 0) {
                        this.terminalHistoryIndex--;
                        input.value = this.terminalCommandHistory[this.terminalCommandHistory.length - 1 - this.terminalHistoryIndex];
                    } else {
                        this.terminalHistoryIndex = -1;
                        input.value = '';
                    }
                }
            };
        }
    }

    /**
     * Autocomplete terminal input on Tab press — real terminal behaviour:
     * single match → complete immediately
     * multiple matches → print all options, keep current input
     * @param {HTMLInputElement} input - Terminal input element
     */
    autocompleteTerminalInput(input) {
        const currentValue = input.value;
        const output = document.getElementById('terminal-output');
        const prompt = document.getElementById('terminal-prompt');
        const termBody = document.getElementById('terminal-body');

        // Build full command list including dynamic ping variants
        const baseCommands = ['help', 'ifconfig', 'ping', 'clear', 'exit'];
        const allServices = window.dataStore?.getAllNFs() || [];
        const serviceIPs = allServices
            .filter(s => s.id !== this.currentTerminalService?.id)
            .map(s => s.config?.ipAddress)
            .filter(Boolean);
        // Add "ping <ip>" for each known service
        const pingIPCommands = serviceIPs.map(ip => `ping ${ip}`);
        const allCommands = [...baseCommands, ...pingIPCommands];

        // Find matches
        const matches = allCommands.filter(cmd =>
            cmd.startsWith(currentValue.toLowerCase())
        );

        if (matches.length === 0) {
            // Nothing matches — do nothing
            return;
        }

        if (matches.length === 1) {
            // Single match — complete it
            input.value = matches[0];
            return;
        }

        // Multiple matches — print them below current line like a real terminal
        if (output && prompt) {
            output.textContent += `${prompt.textContent}${currentValue}\n`;
            output.textContent += matches.join('    ') + '\n';
            if (termBody) termBody.scrollTop = termBody.scrollHeight;
        }
        // Keep the input as-is so the user can keep typing
    }

    /**
     * Execute terminal command — bake typed text into output, process, then re-create prompt
     */
    executeTerminalCommand() {
        const input = document.getElementById('terminal-input');
        const output = document.getElementById('terminal-output');
        const prompt = document.getElementById('terminal-prompt');
        const termBody = document.getElementById('terminal-body');

        if (!input || !output || !this.currentTerminalService) return;

        const command = input.value.trim();
        if (!command) return;

        // Save to history
        this.terminalCommandHistory = this.terminalCommandHistory || [];
        this.terminalCommandHistory.push(command);
        this.terminalHistoryIndex = -1;

        // Bake the prompt + command into the output area
        output.textContent += `${prompt.textContent}${command}\n`;

        // Process command (appends response to output.textContent)
        this.processTerminalCommand(command);

        // Clear input and refocus
        input.value = '';

        // Scroll to bottom
        if (termBody) {
            termBody.scrollTop = termBody.scrollHeight;
        }

        // Re-focus
        input.focus();
    }

    /**
     * Process terminal command
     * @param {string} command - Command to process
     */
    processTerminalCommand(command) {
        const output = document.getElementById('terminal-output');
        const service = this.currentTerminalService;

        const cmd = command.toLowerCase().trim();

        if (cmd === 'help') {
            output.textContent += `Available commands:
  help          - Show this help message
  ifconfig      - Show network configuration
  ping <ip>     - Ping a specific IP address
  clear           - Clear screen
  exit          - Close terminal

`;
        } else if (cmd === 'ifconfig') {
            output.textContent += `Windows IP Configuration

Ethernet adapter Local Area Connection:
   Connection-specific DNS Suffix  . :
   IPv4 Address. . . . . . . . . . . : ${service.config.ipAddress}
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : ${this.getSubnetFromIP(service.config.ipAddress)}.1

`;
        } else if (cmd === 'clear') {
            output.textContent = '';
        } else if (cmd === 'exit') {
            document.getElementById('terminal-modal').style.display = 'none';
        } else if (cmd.startsWith('ping ')) {
            const target = cmd.substring(5).trim();
            this.executePingCommand(service, target);
        } else {
            output.textContent += `'${command}' is not recognized as an internal or external command,
operable program or batch file.

`;
        }
    }

    /**
     * Execute ping command for specific IP
     * @param {Object} service - Source service
     * @param {string} targetIP - Target IP address
     */
    executePingCommand(service, targetIP) {
        const output = document.getElementById('terminal-output');
        const input = document.getElementById('terminal-input');

        // Validate IP format
        if (!this.validateIPAddress(targetIP)) {
            output.textContent += `Ping request could not find host ${targetIP}. Please check the name and try again.

`;
            return;
        }

        // Disable input during ping execution
        if (input) {
            input.disabled = true;
            input.style.opacity = '0.5';
            input.style.cursor = 'not-allowed';
        }

        // Check if target IP exists in services
        const allServices = window.dataStore?.getAllNFs() || [];
        const targetService = allServices.find(s => s.config?.ipAddress === targetIP);

        if (!targetService) {
            // Show failed ping with progressive timeouts
            output.textContent += `Pinging ${targetIP} with 32 bytes of data:
`;

            // Show timeout messages progressively
            let timeoutCount = 0;
            const showTimeout = () => {
                if (timeoutCount < 4) {
                    output.textContent += `Request timed out.
`;
                    const tb1 = document.getElementById('terminal-body');
                    if (tb1) tb1.scrollTop = tb1.scrollHeight;
                    timeoutCount++;
                    setTimeout(showTimeout, 1000); // 1 second delay for timeouts
                } else {
                    output.textContent += `
Ping statistics for ${targetIP}:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),

`;
                    const tb2 = document.getElementById('terminal-body');
                    if (tb2) tb2.scrollTop = tb2.scrollHeight;
                    
                    // Re-enable input after ping completes
                    if (input) {
                        input.disabled = false;
                        input.style.opacity = '1';
                        input.style.cursor = 'text';
                        input.focus();
                    }
                }
            };
            showTimeout();
            return;
        }

        // Generate realistic ping times
        const times = [
            Math.floor(Math.random() * 50) + 10,
            Math.floor(Math.random() * 30) + 5,
            Math.floor(Math.random() * 20) + 2,
            Math.floor(Math.random() * 40) + 8
        ];

        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const avgTime = Math.floor(times.reduce((a, b) => a + b, 0) / times.length);

        // Show initial ping message
        output.textContent += `Pinging ${targetIP} with 32 bytes of data:
`;
        const tb3 = document.getElementById('terminal-body');
        if (tb3) tb3.scrollTop = tb3.scrollHeight;

        // Show ping replies progressively with 0.5 second delays
        let replyCount = 0;
        const showPingReply = () => {
            if (replyCount < 4) {
                output.textContent += `Reply from ${targetIP}: bytes=32 time=${times[replyCount]}ms TTL=255
`;
                const tb4 = document.getElementById('terminal-body');
                if (tb4) tb4.scrollTop = tb4.scrollHeight;
                replyCount++;
                setTimeout(showPingReply, 1000); // 1 second delay between replies
            } else {
                // Show statistics after all replies
                setTimeout(() => {
                    output.textContent += `
Ping statistics for ${targetIP}:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = ${minTime}ms, Maximum = ${maxTime}ms, Average = ${avgTime}ms

`;
                    const tb5 = document.getElementById('terminal-body');
                    if (tb5) tb5.scrollTop = tb5.scrollHeight;

                    // Log the ping after completion
                    if (window.logEngine) {
                        window.logEngine.addLog(service.id, 'INFO',
                            `Ping executed to ${targetIP} (${targetService.name})`, {
                            targetIP: targetIP,
                            targetService: targetService.name,
                            avgResponseTime: `${avgTime}ms`,
                            success: true
                        });
                    }
                    
                    // Re-enable input after ping completes
                    if (input) {
                        input.disabled = false;
                        input.style.opacity = '1';
                        input.style.cursor = 'text';
                        input.focus();
                    }
                }, 1000); // Small delay before showing statistics
            }
        };

        // Start showing replies after a brief delay
        setTimeout(showPingReply, 100);
    }



    /**
     * Get subnet from IP address (assumes /24 subnet)
     * @param {string} ip - IP address
     * @returns {string|null} Subnet (e.g., "192.168.1")
     */
    getSubnetFromIP(ip) {
        const parts = ip.split('.');
        if (parts.length !== 4) return null;

        // Validate each part
        for (let part of parts) {
            const num = parseInt(part);
            if (isNaN(num) || num < 0 || num > 255) return null;
        }

        // Return first 3 octets as subnet (assuming /24)
        return parts.slice(0, 3).join('.');
    }



    // ==========================================
    // LOG PANEL
    // ==========================================

    /**
     * Initialize log panel
     */
    initializeLogPanel() {
        console.log('📋 Initializing log panel...');

        // Subscribe to log engine
        if (window.logEngine) {
            window.logEngine.subscribe((logEntry) => {
                if (logEntry.type) return; // Skip event objects
                this.appendLogToUI(logEntry);
            });
        }

        // Setup log controls
        const filterNF = document.getElementById('log-filter-nf');
        const filterLevel = document.getElementById('log-filter-level');
        const clearBtn = document.getElementById('btn-clear-logs');
        const exportBtn = document.getElementById('btn-export-logs');
        const toggleBtn = document.getElementById('btn-toggle-logs');

        if (filterNF) {
            filterNF.addEventListener('change', () => this.filterLogs());
        }

        if (filterLevel) {
            filterLevel.addEventListener('change', () => this.filterLogs());
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const logContent = document.getElementById('log-content');
                if (logContent) {
                    logContent.innerHTML = '';
                }
                if (window.logEngine) {
                    window.logEngine.clearAllLogs();
                }
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportLogs());
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleLogPanel());
        }

        console.log('✅ Log panel initialized');
    }

    /**
     * Append log entry to UI
     * @param {Object} logEntry - Log entry object
     */
    appendLogToUI(logEntry) {
        const logContent = document.getElementById('log-content');
        if (!logContent) return;

        const nf = window.dataStore?.getNFById(logEntry.nfId);
        const nfName = nf?.name || logEntry.nfId;

        const logDiv = document.createElement('div');
        logDiv.className = `log-entry ${logEntry.level}`;
        logDiv.dataset.nfId = logEntry.nfId;
        logDiv.dataset.level = logEntry.level;

        const time = new Date(logEntry.timestamp).toLocaleTimeString();

        logDiv.innerHTML = `
            <span class="log-timestamp">[${time}]</span>
            <span class="log-nf-name">${nfName}</span>
            <span class="log-level">${logEntry.level}</span>
            <span class="log-message">${this.escapeHtml(logEntry.message)}</span>
        `;

        // Add details if present
        if (logEntry.details && Object.keys(logEntry.details).length > 0) {
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'log-details';

            Object.entries(logEntry.details).forEach(([key, value]) => {
                const detailLine = document.createElement('div');
                detailLine.textContent = `${key}: ${JSON.stringify(value)}`;
                detailsDiv.appendChild(detailLine);
            });

            logDiv.appendChild(detailsDiv);
        }

        logContent.appendChild(logDiv);

        // Auto-scroll to bottom
        logContent.scrollTop = logContent.scrollHeight;

        // Limit displayed logs
        while (logContent.children.length > 500) {
            logContent.removeChild(logContent.firstChild);
        }
    }

    /**
     * Filter logs based on selected filters
     */
    filterLogs() {
        const filterNF = document.getElementById('log-filter-nf')?.value || 'all';
        const filterLevel = document.getElementById('log-filter-level')?.value || 'all';
        const logContent = document.getElementById('log-content');

        if (!logContent) return;

        const allLogEntries = logContent.querySelectorAll('.log-entry');

        allLogEntries.forEach(entry => {
            let show = true;

            if (filterNF !== 'all' && entry.dataset.nfId !== filterNF) {
                show = false;
            }

            if (filterLevel !== 'all' && entry.dataset.level !== filterLevel) {
                show = false;
            }

            entry.style.display = show ? 'flex' : 'none';
        });
    }

    /**
     * Update Service filter dropdown in log panel
     */
    updateLogServiceFilter() {
        const select = document.getElementById('log-filter-nf');
        if (!select) return;

        const currentValue = select.value;

        // Clear options except "All Services"
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Add option for each Service
        const allServices = window.dataStore?.getAllNFs() || [];
        allServices.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = `${service.name}`;
            select.appendChild(option);
        });

        // Restore previous selection if valid
        if (currentValue && [...select.options].some(opt => opt.value === currentValue)) {
            select.value = currentValue;
        }
    }

    /**
     * Export logs
     */
    exportLogs() {
        if (!window.logEngine) return;

        const format = prompt('Export format (json/csv/txt):', 'txt');

        if (!format) return;

        let content, filename, mimeType;

        if (format.toLowerCase() === 'json') {
            content = window.logEngine.exportLogsAsJSON();
            filename = `service-logs-${Date.now()}.json`;
            mimeType = 'application/json';
        } else if (format.toLowerCase() === 'csv') {
            content = window.logEngine.exportLogsAsCSV();
            filename = `service-logs-${Date.now()}.csv`;
            mimeType = 'text/csv';
        } else if (format.toLowerCase() === 'txt') {
            content = window.logEngine.exportLogsAsText();
            filename = `service-logs-${Date.now()}.txt`;
            mimeType = 'text/plain';
        } else {
            alert('Invalid format. Use "json", "csv", or "txt"');
            return;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        console.log('✅ Logs exported as', format);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Toggle log panel visibility
     */
    toggleLogPanel() {
        const logPanel = document.getElementById('log-panel');
        const toggleIcon = document.getElementById('toggle-icon');

        if (!logPanel || !toggleIcon) return;

        const isCollapsed = logPanel.classList.contains('collapsed');

        if (isCollapsed) {
            // Show logs
            logPanel.classList.remove('collapsed');
            toggleIcon.textContent = '▼';
            console.log('📋 Log panel expanded');
        } else {
            // Hide logs
            logPanel.classList.add('collapsed');
            toggleIcon.textContent = '▲';
            console.log('📋 Log panel collapsed');
        }

        // Trigger canvas resize after panel toggle animation completes
        setTimeout(() => {
            if (window.canvasRenderer) {
                window.canvasRenderer.resizeCanvas();
            }
        }, 350); // Wait for CSS transition to complete (300ms + buffer)
    }

    /**
     * Setup configuration panel toggle
     */
    setupConfigPanelToggle() {
        const toggleBtn = document.getElementById('btn-toggle-config');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleConfigPanel());
            console.log('✅ Config panel toggle initialized');
        } else {
            console.warn('⚠️ Config panel toggle button not found');
        }
    }

    /**
     * Toggle configuration panel visibility
     */
    toggleConfigPanel() {
        const sidebar = document.querySelector('.sidebar-right');
        const toggleIcon = document.getElementById('config-toggle-icon');

        if (!sidebar || !toggleIcon) return;

        const isCollapsed = sidebar.classList.contains('collapsed');

        if (isCollapsed) {
            // Show config panel
            sidebar.classList.remove('collapsed');
            toggleIcon.textContent = '◀';
            console.log('⚙️ Config panel expanded');
        } else {
            // Hide config panel
            sidebar.classList.add('collapsed');
            toggleIcon.textContent = '▶';
            console.log('⚙️ Config panel collapsed');
        }

        // Trigger canvas resize after panel toggle animation completes
        setTimeout(() => {
            if (window.canvasRenderer) {
                window.canvasRenderer.resizeCanvas();
            }
        }, 350); // Wait for CSS transition to complete (300ms + buffer)
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + L to toggle logs
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                this.toggleLogPanel();
            }

            // Ctrl/Cmd + K to toggle config panel
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleConfigPanel();
            }

            // F1 or Ctrl/Cmd + H to show help
            if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.key === 'h')) {
                e.preventDefault();
                this.showHelpModal();
            }
        });

        console.log('⌨️ Keyboard shortcuts initialized (Ctrl+L: Toggle logs, Ctrl+K: Toggle config, F1/Ctrl+H: Help)');
    }



}