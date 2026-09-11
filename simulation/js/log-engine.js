/**
 * ============================================
 * LOG ENGINE
 * ============================================
 * Manages all logging for Services
 * 
 * Responsibilities:
 * - Generate logs for service lifecycle events
 * - Store and manage log entries
 * - Notify UI of new logs
 */

class LogEngine {
    constructor() {
        this.logs = new Map();
        this.maxLogsPerService = 100;
        this.logListeners = [];
        this.logScenarios = null; // Custom log scenarios

        this.init();
    }

    async init() {
        console.log('📋 LogEngine: Initializing...');

        // Load service scenarios
        try {
            const response = await fetch('../service-scenarios.json');
            this.logScenarios = await response.json();
            console.log('✅ Service scenarios loaded');
        } catch (error) {
            console.warn('⚠️ Could not load service scenarios, using basic logs');
            this.logScenarios = null;
        }
    }



    addLog(serviceId, level, message, details = {}) {
        // Replace {instance} and {random} placeholders
        const service = window.dataStore?.getNFById(serviceId);
        if (service) {
            const random = Math.random().toString(36).substring(2, 8);
            message = message.replace(/\{random\}/g, random);

            // Replace in details too
            Object.keys(details).forEach(key => {
                if (typeof details[key] === 'string') {
                    details[key] = details[key].replace(/\{random\}/g, random);
                }
            });

            // Generate dynamic endpoint if details contains a static endpoint
            if (details.endpoint && service.config) {
                details.endpoint = service.config.endpoint;
            }
        }

        const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            nfId: serviceId, // Keep nfId for compatibility with existing UI
            timestamp: Date.now(),
            level: level,
            message: message,
            details: details
        };

        if (!this.logs.has(serviceId)) {
            this.logs.set(serviceId, []);
        }

        const serviceLogs = this.logs.get(serviceId);
        serviceLogs.push(logEntry);

        if (serviceLogs.length > this.maxLogsPerService) {
            serviceLogs.shift();
        }

        this.notifyListeners(logEntry);

        // Console log
        const time = new Date(logEntry.timestamp).toLocaleTimeString();
        const serviceName = service?.name || serviceId;

        const logStyles = {
            'ERROR': 'color: #e74c3c; font-weight: bold',
            'WARNING': 'color: #ff9800; font-weight: bold',
            'INFO': 'color: #3498db',
            'SUCCESS': 'color: #4caf50; font-weight: bold',
            'DEBUG': 'color: #95a5a6'
        };

        console.log(
            `%c[${time}] ${serviceName} | ${level}%c | ${message}`,
            logStyles[level],
            'color: inherit'
        );

        return logEntry;
    }



    /**
     * Service Added - Generate custom logs based on scenarios
     */
    onServiceAdded(service) {
        console.log('📋 LogEngine: Service Added:', service.name);

        // Use service scenarios
        if (this.logScenarios && this.logScenarios.Service) {
            this.runServiceScenario(service);
        } else {
            // Fallback to basic logs
            this.runBasicServiceScenario(service);
        }
    }



    /**
     * Run service scenario from JSON
     */
    runServiceScenario(service) {
        const scenario = this.logScenarios.Service;

        // ==================================
        // STARTUP LOGS
        // ==================================
        if (scenario.startup) {
            Object.values(scenario.startup).forEach(logConfig => {
                setTimeout(() => {
                    let message = logConfig.message;
                    let details = { ...logConfig.details };

                    // Replace service-specific placeholders
                    message = message.replace(/\{serviceName\}/g, service.name);
                    message = message.replace(/\{endpoint\}/g, service.config.endpoint);

                    // Handle dynamic endpoint in details
                    if (details.endpoint === 'dynamic') {
                        details.endpoint = service.config.endpoint;
                    }

                    this.addLog(service.id, logConfig.level, message, details);
                }, logConfig.delay);
            });
        }
    }



    /**
     * Fallback basic service scenario
     */
    runBasicServiceScenario(service) {
        this.addLog(service.id, 'INFO', `${service.name} service initialized`);

        setTimeout(() => {
            this.addLog(service.id, 'SUCCESS', `${service.name} is ready to accept connections`, {
                endpoint: service.config.endpoint,
                status: 'OPERATIONAL'
            });
        }, 300);
    }



    /**
     * Connection Created - Generate service connection logs
     */
    onConnectionCreated(connection) {
        const sourceService = window.dataStore?.getNFById(connection.sourceId);
        const targetService = window.dataStore?.getNFById(connection.targetId);

        if (!sourceService || !targetService) return;

        console.log('📋 LogEngine: Service Connection Created');

        // Generate connection establishment logs
        setTimeout(() => {
            this.addLog(connection.sourceId, 'INFO',
                `Establishing connection to ${targetService.name} from ${sourceService.config.endpoint}`, {
                protocol: targetService.config.protocol,
                sourceEndpoint: sourceService.config.endpoint,
                targetEndpoint: targetService.config.endpoint
            });

            this.addLog(connection.targetId, 'INFO',
                `Incoming connection from ${sourceService.name}`, {
                sourceEndpoint: sourceService.config.endpoint
            });
        }, 100);

        // Connection established
        setTimeout(() => {
            this.addLog(connection.sourceId, 'SUCCESS',
                `Connection established with ${targetService.name}`, {
                endpoint: targetService.config.endpoint,
                protocol: targetService.config.protocol,
                status: 'ACTIVE'
            });

            this.addLog(connection.targetId, 'SUCCESS',
                `Connection accepted from ${sourceService.name}`, {
                sourceEndpoint: sourceService.config.endpoint,
                status: 'ACTIVE'
            });
        }, 300);

        // Simulate initial communication
        setTimeout(() => {
            if (window.serviceManager) {
                window.serviceManager.simulateServiceCommunication(connection.sourceId, connection.targetId);
            }
        }, 1000);
    }



    getAllLogs() {
        const allLogs = [];
        this.logs.forEach(nfLogs => {
            allLogs.push(...nfLogs);
        });
        return allLogs.sort((a, b) => a.timestamp - b.timestamp);
    }

    getLogsForService(serviceId) {
        return this.logs.get(serviceId) || [];
    }

    clearLogsForService(serviceId) {
        this.logs.delete(serviceId);
        this.notifyListeners({ type: 'clear', serviceId });
    }

    clearAllLogs() {
        this.logs.clear();
        this.notifyListeners({ type: 'clear-all' });
    }

    subscribe(callback) {
        this.logListeners.push(callback);
    }

    notifyListeners(logEntry) {
        this.logListeners.forEach(callback => {
            try {
                callback(logEntry);
            } catch (error) {
                console.error('Error in log listener:', error);
            }
        });
    }

    exportLogsAsJSON() {
        const exportData = {
            exportTime: new Date().toISOString(),
            logs: this.getAllLogs()
        };
        return JSON.stringify(exportData, null, 2);
    }

    exportLogsAsCSV() {
        const logs = this.getAllLogs();
        const headers = ['Timestamp', 'Service Name', 'Level', 'Message'];
        let csv = headers.join(',') + '\n';

        logs.forEach(log => {
            const service = window.dataStore?.getNFById(log.nfId);
            const timestamp = new Date(log.timestamp).toISOString();
            csv += [
                timestamp,
                service?.name || 'Unknown',
                log.level,
                `"${log.message.replace(/"/g, '""')}"`
            ].join(',') + '\n';
        });

        return csv;
    }

    /**
     * Export logs as plain text
     * @returns {string} Plain text string of all logs
     */
    exportLogsAsText() {
        const logs = this.getAllLogs();
        let text = '═══════════════════════════════════════════════════════\n';
        text += 'SERVICE DASHBOARD - LOG EXPORT\n';
        text += '═══════════════════════════════════════════════════════\n';
        text += `Export Time: ${new Date().toISOString()}\n`;
        text += `Total Logs: ${logs.length}\n`;
        text += '═══════════════════════════════════════════════════════\n\n';

        logs.forEach(log => {
            const service = window.dataStore?.getNFById(log.nfId);
            const timestamp = new Date(log.timestamp).toLocaleString();

            text += `[${timestamp}] ${service?.name || 'Unknown'} - ${log.level}\n`;
            text += `${log.message}\n`;

            // Add details if present
            if (log.details && Object.keys(log.details).length > 0) {
                text += 'Details:\n';
                Object.entries(log.details).forEach(([key, value]) => {
                    text += `  ${key}: ${JSON.stringify(value)}\n`;
                });
            }
            text += '\n';
        });

        text += '═══════════════════════════════════════════════════════\n';
        text += 'END OF LOG EXPORT\n';
        text += '═══════════════════════════════════════════════════════\n';

        return text;
    }
}

