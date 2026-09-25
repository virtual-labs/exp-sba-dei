/**
 * ============================================
 * APPLICATION ENTRY POINT
 * ============================================
 * Initializes the Service Management Dashboard application
 * 
 * Responsibilities:
 * - Load configuration files
 * - Initialize all managers in correct order
 * - Handle startup errors
 * - Provide global initialization
 */

/**
 * Main initialization function
 */
async function initializeApp() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('SERVICE-BASED ARCHITECTURE DASHBOARD');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Initializing...');

    try {
        // ==========================================
        // STEP 1: Load Service Definitions
        // ==========================================
        console.log('\n📄 Step 1: Loading service definitions...');
        try {
            const response = await fetch('../service-definitions.json');
            window.serviceDefinitions = await response.json();
            console.log('✅ Service definitions loaded successfully');
        } catch (error) {
            console.warn('⚠️ Could not load service-definitions.json, using defaults');
            window.serviceDefinitions = getDefaultServiceDefinitions();
        }

        // ==========================================
        // STEP 2: Initialize Core Managers
        // ==========================================
        console.log('\n🔧 Step 2: Initializing core managers...');

        // Data Store (must be first)
        window.dataStore = new DataStore();

        // Log Engine (needs data store)
        window.logEngine = new LogEngine();

        // Service Manager
        window.serviceManager = new ServiceManager();

        // Bus Manager (before Connection Manager)
        window.busManager = new BusManager();

        // Connection Manager
        window.connectionManager = new ConnectionManager();

        // Canvas Renderer
        window.canvasRenderer = new CanvasRenderer();

        // UI Controller
        window.uiController = new UIController();

        console.log('✅ All managers initialized successfully');

        // ==========================================
        // STEP 3: Initialize UI
        // ==========================================
        console.log('\n🎨 Step 3: Initializing user interface...');
        window.uiController.init();
        console.log('✅ UI initialized');

        // ==========================================
        // STEP 4: Create Main Bus Line
        // ==========================================
        console.log('\n� Step 4: CRreating main bus line...');
        if (window.busManager) {
            window.busManager.createBusLine('horizontal', { x: 200, y: 300 }, 600);
        }
        console.log('✅ Main bus line created');

        // ==========================================
        // STEP 5: Initial Render
        // ==========================================
        console.log('\n🖼️ Step 5: Rendering initial canvas...');
        window.canvasRenderer.render();
        console.log('✅ Canvas rendered');

        // ==========================================
        // STEP 6: Add Startup Log
        // ==========================================
        console.log('\n📋 Step 6: Adding startup log...');
        window.logEngine.addLog('system', 'SUCCESS',
            'Service-Based Architecture Dashboard initialized', {
            version: '1.0.0',
            timestamp: new Date().toISOString()
        });

        // ==========================================
        // SUCCESS
        // ==========================================
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('✅ DASHBOARD READY');
        console.log('═══════════════════════════════════════════════════════');


        console.log('📌 Click on "Service" in the left panel to start building your service architecture');
        console.log('📌 Configure service names, IPs, and ports');
        console.log('📌 Connect services: Select Source → Select Destination');
        console.log('📌 Monitor service logs for initialization and communication');
        console.log('❓ Click "Help" button or press F1 for service management guide');
        console.log('═══════════════════════════════════════════════════════\n');

        // // Show helpful instructions
        // setTimeout(() => {
        //     alert('🚌 BIDIRECTIONAL BUS SYSTEM:\n\n' +
        //           '✨ BUSES work as BOTH source & destination!\n\n' +
        //           'CONNECTION TYPES:\n' +
        //           '• NF → Bus: Select NF, then Bus\n' +
        //           '• Bus → NF: Select Bus, then NF\n' +
        //           '• Bus → Bus: Select Bus, then another Bus\n\n' +
        //           '🎯 SIMPLE WORKFLOW:\n' +
        //           '1. Click "Select Source" → Click anything\n' +
        //           '2. Click "Select Destination" → Click anything\n\n' +
        //           'Look for "● CLICKABLE" indicators on buses!');
        // }, 2000);

    } catch (error) {
        console.error('═══════════════════════════════════════════════════════');
        console.error('❌ INITIALIZATION FAILED');
        console.error('═══════════════════════════════════════════════════════');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        console.error('═══════════════════════════════════════════════════════');

        alert('Failed to initialize dashboard: ' + error.message);
    }
}

/**
 * Default service definitions if JSON fails to load
 * @returns {Object} Default service definitions
 */
function getDefaultServiceDefinitions() {
    return {
        'Service': {
            name: 'Generic Service',
            color: '#3498db',
            description: 'A configurable service that can connect to other services'
        }
    };
}

// Start the application when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);